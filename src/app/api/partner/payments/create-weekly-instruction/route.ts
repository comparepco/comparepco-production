import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

// POST /api/partner/payments/create-weekly-instruction
// Body: { bookingId: string, method: 'bank_transfer' | 'direct_debit' }
// Creates a payment_instruction doc and updates the booking with payment meta.
export async function POST(req: NextRequest) {
  try {
    const { bookingId, method } = await req.json();
    if (!bookingId || !method) {
      return NextResponse.json({ error: 'Missing bookingId or method' }, { status: 400 });
    }

    // Fetch booking to gather context
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const driverId = booking.driver_id;
    const partnerId = booking.partner_id;
    const weeklyAmount = booking.weekly_rate || booking.price_per_week || booking.car_info?.weekly_rate || booking.car?.price_per_week || 0;
    const vehicleReg =
      booking.vehicle?.license_plate ||
      booking.car_info?.registration_plate ||
      booking.car_info?.license_plate ||
      booking.vehicle?.registration_number ||
      booking.car?.registration_number ||
      booking.vehicle_reg ||
      booking.car_plate ||
      booking.car?.license_plate ||
      'UNKNOWN';

    // Fetch partner bank details
    const { data: partnerData, error: partnerError } = await supabaseAdmin
      .from('users')
      .select('bank_details')
      .eq('id', booking.partner_id)
      .single();

    const partnerBank = partnerData?.bank_details || null;

    // Generate instruction ID
    const instructionId = uuidv4();

    // Build instruction data
    const instructionData = {
      id: instructionId,
      booking_id: bookingId,
      driver_id: driverId,
      partner_id: partnerId,
      vehicle_reg: vehicleReg,
      amount: weeklyAmount,
      frequency: 'weekly',
      method, // bank_transfer or direct_debit
      type: 'weekly_rent',
      partner_bank_details: partnerBank,
      next_due_date: new Date().toISOString(),
      status: method === 'direct_debit' ? 'auto' : 'pending', // auto = will be auto-debited
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create payment instruction
    const { error: instructionError } = await supabaseAdmin
      .from('payment_instructions')
      .insert(instructionData);

    if (instructionError) {
      console.error('Error creating payment instruction:', instructionError);
      return NextResponse.json({ error: 'Failed to create payment instruction' }, { status: 500 });
    }

    // Update booking meta
    const { error: bookingUpdateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_method: method,
        payment_instruction_id: instructionId,
        payment_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bookingUpdateError) {
      console.error('Error updating booking:', bookingUpdateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'weekly_payment_instruction_created',
        performed_by: driverId,
        performed_by_type: 'driver',
        details: {
          method,
          amount: weeklyAmount,
          instruction_id: instructionId,
          vehicle_reg: vehicleReg
        },
        description: `Weekly payment instruction created with ${method.replace('_', ' ')} method for £${weeklyAmount}`,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
      // Don't fail the request if history creation fails
    }

    // Notify driver
    const driverMessage = method === 'bank_transfer'
      ? `Please transfer £${weeklyAmount} each week using reference ${vehicleReg} to account ${partnerBank?.account_number || '—'} (sort ${partnerBank?.sort_code || '—'}).`
      : `Your weekly payment of £${weeklyAmount} will be collected automatically each week.`;

    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: driverId,
        type: 'payment_instruction_created',
        title: 'Weekly payment set up',
        message: driverMessage,
        data: {
          booking_id: bookingId,
          instruction_id: instructionId,
          method,
          amount: weeklyAmount
        },
        created_at: new Date().toISOString()
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    // Notify partner
    const { error: partnerNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: partnerId,
        type: 'payment_instruction_created',
        title: 'New weekly payment from driver',
        message: `Driver linked to booking ${bookingId} has set up ${method.replace('_', ' ')} payments.`,
        data: {
          booking_id: bookingId,
          instruction_id: instructionId,
          method,
          amount: weeklyAmount
        },
        created_at: new Date().toISOString()
      });

    if (partnerNotificationError) {
      console.error('Error creating partner notification:', partnerNotificationError);
    }

    return NextResponse.json({ 
      success: true, 
      instructionId: instructionId,
      message: 'Weekly payment instruction created successfully'
    });

  } catch (err: any) {
    console.error('Create weekly instruction error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
} 