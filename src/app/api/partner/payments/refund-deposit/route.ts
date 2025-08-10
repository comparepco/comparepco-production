import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Body: { instructionId: string, refundAmount: number, partnerId: string }
export async function POST(req: NextRequest) {
  try {
    const { instructionId, refundAmount, partnerId } = await req.json();
    if (!instructionId || !partnerId) {
      return NextResponse.json({ error: 'Missing instructionId or partnerId' }, { status: 400 });
    }

    if (typeof refundAmount !== 'number' || refundAmount <= 0) {
      return NextResponse.json({ error: 'Invalid refundAmount' }, { status: 400 });
    }

    // Get payment instruction
    const { data: instruction, error: instructionError } = await supabaseAdmin
      .from('payment_instructions')
      .select('*')
      .eq('id', instructionId)
      .single();

    if (instructionError || !instruction) {
      return NextResponse.json({ error: 'Instruction not found' }, { status: 404 });
    }

    if (instruction.partner_id !== partnerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (instruction.type !== 'deposit') {
      return NextResponse.json({ error: 'Only deposit instructions are refundable' }, { status: 400 });
    }

    if (instruction.status === 'deposit_refunded') {
      return NextResponse.json({ error: 'Deposit already refunded' }, { status: 400 });
    }

    // Ensure we do not create duplicate refund transactions
    const { data: existingRefundTx, error: existingRefundError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('instruction_id', instructionId)
      .eq('category', 'Deposit Refund')
      .eq('type', 'expense')
      .limit(1);

    const shouldCreateTx = !existingRefundTx || existingRefundTx.length === 0;

    // If there is an existing income transaction for the deposit, mark it refunded
    const { data: depositIncomeTx, error: depositIncomeError } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('instruction_id', instructionId)
      .eq('type', 'income')
      .limit(1);

    if (!depositIncomeError && depositIncomeTx && depositIncomeTx.length > 0) {
      const { error: updateIncomeError } = await supabaseAdmin
        .from('transactions')
        .update({ 
          status: 'refunded', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', depositIncomeTx[0].id);

      if (updateIncomeError) {
        console.error('Error updating deposit income transaction:', updateIncomeError);
      }
    }

    // Update instruction status
    const { error: updateError } = await supabaseAdmin
      .from('payment_instructions')
      .update({
        status: 'deposit_refunded',
        refunded_amount: refundAmount,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructionId);

    if (updateError) {
      console.error('Error updating instruction status:', updateError);
      return NextResponse.json({ error: 'Failed to update instruction status' }, { status: 500 });
    }

    // Fetch related entities (booking, driver, etc.)
    let bookingData: any = null;
    let driverData: any = null;
    let partnerData: any = null;

    try {
      const [bookingResult, driverResult, partnerResult] = await Promise.all([
        supabaseAdmin.from('bookings').select('*').eq('id', instruction.booking_id).single(),
        supabaseAdmin.from('users').select('*').eq('id', instruction.driver_id).single(),
        supabaseAdmin.from('users').select('*').eq('id', partnerId).single(),
      ]);
      
      if (bookingResult.data) bookingData = bookingResult.data;
      if (driverResult.data) driverData = driverResult.data;
      if (partnerResult.data) partnerData = partnerResult.data;
    } catch (err) {
      console.error('Related fetch error:', err);
    }

    // Helper to remove undefined/null
    const clean = (obj: any) => {
      if (!obj) return null;
      const result: any = {};
      for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null) result[k] = v;
      }
      return Object.keys(result).length ? result : null;
    };

    const bookingDetails = clean({
      start_date: bookingData?.start_date,
      end_date: bookingData?.end_date,
      total_amount: bookingData?.total_amount,
      weekly_rate: bookingData?.weekly_rate || bookingData?.price_per_week,
    });

    const driverDetails = clean({
      name: driverData?.profile?.full_name || driverData?.email,
      email: driverData?.email,
    });

    const partnerDetails = clean({
      name: partnerData?.profile?.full_name || partnerData?.email,
      email: partnerData?.email,
      company_name: partnerData?.profile?.company_name,
    });

    const vehicleDetails = clean({
      registration: instruction.vehicle_reg,
      make: bookingData?.car_info?.make || bookingData?.car?.make,
      model: bookingData?.car_info?.model || bookingData?.car?.model,
    });

    // Create transactions
    if (shouldCreateTx) {
      await Promise.all([
        // Partner expense
        supabaseAdmin.from('transactions').insert({
          booking_id: instruction.booking_id,
          partner_id: partnerId,
          driver_id: instruction.driver_id,
          type: 'expense',
          category: 'Deposit Refund',
          amount: refundAmount,
          description: `Deposit refund to driver for ${instruction.vehicle_reg}`,
          date: new Date().toISOString(),
          status: 'completed',
          net_amount: refundAmount,
          source: 'partner',
          payment_method: instruction.method,
          instruction_id: instructionId,
          booking_details: bookingDetails,
          driver_details: driverDetails,
          partner_details: partnerDetails,
          vehicle_details: vehicleDetails,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
        // Driver income
        supabaseAdmin.from('transactions').insert({
          booking_id: instruction.booking_id,
          partner_id: partnerId,
          driver_id: instruction.driver_id,
          type: 'income',
          category: 'Deposit Refund',
          amount: refundAmount,
          description: `Deposit refund received for ${instruction.vehicle_reg}`,
          date: new Date().toISOString(),
          status: 'completed',
          net_amount: refundAmount,
          source: 'partner',
          payment_method: instruction.method,
          instruction_id: instructionId,
          booking_details: bookingDetails,
          driver_details: driverDetails,
          partner_details: partnerDetails,
          vehicle_details: vehicleDetails,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      ]);
    }

    // Update booking
    const { error: bookingUpdateError } = await supabaseAdmin
      .from('bookings')
      .update({
        deposit_refunded: refundAmount, // This should be incremented, but Supabase doesn't have increment
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
        action: 'deposit_refunded',
        performed_by: partnerId,
        performed_by_type: 'partner',
        details: {
          amount: refundAmount,
          instruction_id: instructionId,
          refunded_at: new Date().toISOString()
        },
        description: `Deposit refund of £${refundAmount} issued`,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Notify driver
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: instruction.driver_id,
        type: 'deposit_refunded',
        title: 'Deposit Refunded',
        message: `Your deposit (£${refundAmount}) has been refunded by the partner.`,
        data: {
          instruction_id: instructionId,
          booking_id: instruction.booking_id,
          amount: refundAmount
        },
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Deposit refunded successfully'
    });

  } catch (err: any) {
    console.error('refund deposit error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
} 