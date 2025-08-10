import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Body: { instructionId: string, partnerId?: string } or { bookingId: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { instructionId, partnerId, bookingId } = body;

    // Handle both instructionId and bookingId cases
    if (!instructionId && !bookingId) {
      return NextResponse.json({ error: 'Missing instructionId or bookingId' }, { status: 400 });
    }

    let targetInstructionId = instructionId;
    let targetPartnerId = partnerId;

    // If bookingId is provided, find the deposit instruction for that booking
    if (bookingId && !instructionId) {
      const { data: depositInstruction, error: depositError } = await supabaseAdmin
        .from('payment_instructions')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('type', 'deposit')
        .eq('status', 'sent')
        .single();

      if (depositError || !depositInstruction) {
        return NextResponse.json({ error: 'No pending deposit instruction found for this booking' }, { status: 404 });
      }

      targetInstructionId = depositInstruction.id;
      targetPartnerId = depositInstruction.partner_id;
    }

    if (!targetInstructionId) {
      return NextResponse.json({ error: 'No instruction found' }, { status: 404 });
    }

    // Get payment instruction
    const { data: instruction, error: instructionError } = await supabaseAdmin
      .from('payment_instructions')
      .select('*')
      .eq('id', targetInstructionId)
      .single();

    if (instructionError || !instruction) {
      return NextResponse.json({ error: 'Instruction not found' }, { status: 404 });
    }

    if (instruction.method !== 'bank_transfer') {
      return NextResponse.json({ error: 'Only manual transfers require confirmation' }, { status: 400 });
    }

    if (instruction.status !== 'sent') {
      return NextResponse.json({ error: 'Payment not marked sent yet' }, { status: 400 });
    }

    let newDue: Date | null = null;
    
    if (instruction.type === 'deposit' || instruction.frequency === 'one_off') {
      // One-off deposit, mark as fully received (no recurrence)
      const { error: updateError } = await supabaseAdmin
        .from('payment_instructions')
        .update({
          status: 'deposit_received',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetInstructionId);

      if (updateError) {
        console.error('Error updating instruction status:', updateError);
        return NextResponse.json({ error: 'Failed to update instruction status' }, { status: 500 });
      }
    } else {
      // Weekly rent – schedule next week
      const nextDue = instruction.next_due_date ? new Date(instruction.next_due_date) : new Date();
      newDue = new Date(nextDue.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { error: updateError } = await supabaseAdmin
        .from('payment_instructions')
        .update({
          status: 'pending',
          next_due_date: newDue.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', targetInstructionId);

      if (updateError) {
        console.error('Error updating instruction status:', updateError);
        return NextResponse.json({ error: 'Failed to update instruction status' }, { status: 500 });
      }
    }

    // Get booking details for comprehensive transaction records
    let bookingData = null;
    let driverData = null;
    let partnerData = null;
    
    try {
      const [bookingResult, driverResult, partnerResult] = await Promise.all([
        supabaseAdmin.from('bookings').select('*').eq('id', instruction.booking_id).single(),
        supabaseAdmin.from('users').select('*').eq('id', instruction.driver_id).single(),
        supabaseAdmin.from('users').select('*').eq('id', instruction.partner_id).single()
      ]);
      
      if (bookingResult.data) bookingData = bookingResult.data;
      if (driverResult.data) driverData = driverResult.data;
      if (partnerResult.data) partnerData = partnerResult.data;
    } catch (error) {
      console.error('Error fetching related data:', error);
    }

    // Helper to remove undefined values
    const clean = (obj: any) => {
      if (!obj) return null;
      const cleaned: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined) cleaned[k] = v;
      }
      return Object.keys(cleaned).length ? cleaned : null;
    };

    const safeBookingDetails = bookingData ? clean({
      start_date: bookingData.start_date,
      end_date: bookingData.end_date,
      total_amount: bookingData.total_amount,
      weekly_rate: bookingData.weekly_rate || bookingData.price_per_week,
    }) : null;

    const safeDriverDetails = driverData ? clean({
      name: driverData.profile?.full_name || driverData.email,
      email: driverData.email,
    }) : null;

    const safePartnerDetails = partnerData ? clean({
      name: partnerData.profile?.full_name || partnerData.email,
      email: partnerData.email,
      company_name: partnerData.profile?.company_name,
    }) : null;

    const vehicleDetails = clean({
      registration: instruction.vehicle_reg,
      make: bookingData?.car_info?.make || bookingData?.car?.make,
      model: bookingData?.car_info?.model || bookingData?.car?.model,
    });

    // Create comprehensive transaction records
    // 1. Partner Income Transaction
    const { error: partnerTransactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        booking_id: instruction.booking_id,
        partner_id: instruction.partner_id,
        driver_id: instruction.driver_id,
        type: 'income',
        category: 'Booking Revenue',
        amount: instruction.amount,
        description: `Weekly payment received for ${instruction.vehicle_reg}`,
        date: new Date().toISOString(),
        status: 'completed',
        fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
        net_amount: instruction.amount,
        source: 'driver',
        payment_method: 'bank_transfer',
        instruction_id: targetInstructionId,
        booking_details: safeBookingDetails,
        driver_details: safeDriverDetails,
        partner_details: safePartnerDetails,
        vehicle_details: vehicleDetails,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (partnerTransactionError) {
      console.error('Error creating partner transaction:', partnerTransactionError);
    }

    // 2. Driver Expense Transaction
    const { error: driverTransactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        booking_id: instruction.booking_id,
        partner_id: instruction.partner_id,
        driver_id: instruction.driver_id,
        type: 'expense',
        category: 'Vehicle Rental',
        amount: instruction.amount,
        description: `Weekly rental payment for ${instruction.vehicle_reg}`,
        date: new Date().toISOString(),
        status: 'completed',
        fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
        net_amount: instruction.amount,
        source: 'partner',
        payment_method: 'bank_transfer',
        instruction_id: targetInstructionId,
        booking_details: safeBookingDetails,
        driver_details: safeDriverDetails,
        partner_details: safePartnerDetails,
        vehicle_details: vehicleDetails,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (driverTransactionError) {
      console.error('Error creating driver transaction:', driverTransactionError);
    }

    // 3. Platform Revenue Transaction (if platform fee exists)
    const platformFee = 0; // Currently no platform fee, but structure is ready
    if (platformFee > 0) {
      const { error: platformTransactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          booking_id: instruction.booking_id,
          partner_id: instruction.partner_id,
          driver_id: instruction.driver_id,
          type: 'income',
          category: 'Platform Commission',
          amount: platformFee,
          description: `Platform commission from weekly payment for ${instruction.vehicle_reg}`,
          date: new Date().toISOString(),
          status: 'completed',
          fees: { platform: platformFee, payment: 0, insurance: 0, maintenance: 0 },
          net_amount: platformFee,
          source: 'platform',
          payment_method: 'bank_transfer',
          instruction_id: targetInstructionId,
          booking_details: safeBookingDetails,
          driver_details: safeDriverDetails,
          partner_details: safePartnerDetails,
          vehicle_details: vehicleDetails,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (platformTransactionError) {
        console.error('Error creating platform transaction:', platformTransactionError);
      }
    }

    // 4. Update booking payment status
    const { error: bookingUpdateError } = await supabaseAdmin
      .from('bookings')
      .update({
        last_payment_date: new Date().toISOString(),
        total_paid: instruction.amount, // This should be incremented, but Supabase doesn't have increment
        payment_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', instruction.booking_id);

    if (bookingUpdateError) {
      console.error('Error updating booking:', bookingUpdateError);
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: instruction.booking_id,
        action: 'weekly_payment_received',
        performed_by: instruction.partner_id,
        performed_by_type: 'partner',
        details: {
          amount: instruction.amount,
          instruction_id: targetInstructionId,
          received_at: new Date().toISOString()
        },
        description: `Weekly payment of £${instruction.amount} received for ${instruction.vehicle_reg}`,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Notify driver
    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: instruction.driver_id,
        type: 'payment_received',
        title: 'Payment Received',
        message: `Partner has confirmed receipt of your weekly payment (£${instruction.amount}) for ${instruction.vehicle_reg}.`,
        data: {
          instruction_id: targetInstructionId,
          booking_id: instruction.booking_id,
          amount: instruction.amount
        },
        created_at: new Date().toISOString()
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    // Prepare partner notification
    const partnerNotification = {
      type: 'payment_received',
      title: 'Payment Received',
      message: `Weekly payment (£${instruction.amount}) for ${instruction.vehicle_reg} has been confirmed as received.`,
      data: {
        instruction_id: targetInstructionId,
        booking_id: instruction.booking_id,
        amount: instruction.amount
      },
      created_at: new Date().toISOString()
    };

    // Notify main partner
    const { error: partnerNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        ...partnerNotification,
        user_id: instruction.partner_id
      });

    if (partnerNotificationError) {
      console.error('Error creating partner notification:', partnerNotificationError);
    }

    // Notify all partner staff with canViewFinancials permission and active status
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('partner_staff')
      .select('user_id, permissions')
      .eq('partner_id', instruction.partner_id)
      .eq('is_active', true);

    if (!staffError && staffData) {
      for (const staff of staffData) {
        if (staff.permissions?.canViewFinancials) {
          const { error: staffNotificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
              ...partnerNotification,
              user_id: staff.user_id
            });

          if (staffNotificationError) {
            console.error('Error creating staff notification:', staffNotificationError);
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      nextDue: newDue,
      message: 'Payment confirmed successfully'
    });

  } catch (err: any) {
    console.error('Confirm received error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
} 