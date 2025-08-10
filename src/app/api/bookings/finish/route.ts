import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, finishedBy, finishedByType, finalNotes, finalMileage, finalFuelLevel } = await req.json();

    if (!bookingId || !finishedBy || !finishedByType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['driver', 'partner', 'admin'].includes(finishedByType)) {
      return NextResponse.json({ error: 'Invalid finishedByType' }, { status: 400 });
    }

    // Get booking data
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentTime = new Date();

    // Verify authorization
    if (finishedByType === 'driver' && booking.driver_id !== finishedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }
    if (finishedByType === 'partner' && booking.partner_id !== finishedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }

    // Check if booking can be finished
    const validStatuses = ['active', 'in_progress', 'partner_accepted'];
    if (!validStatuses.includes(booking.status)) {
      return NextResponse.json({ error: `Cannot finish booking with status: ${booking.status}` }, { status: 400 });
    }

    // Get performer data for history logging
    const { data: performerData, error: performerError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', finishedBy)
      .single();

    const performerName = performerData?.company_name || performerData?.company || performerData?.full_name || performerData?.name || performerData?.email || 'Unknown';

    // Calculate final amounts
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const actualEndDate = new Date();
    const totalDays = Math.ceil((actualEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.ceil(totalDays / 7);
    const finalAmount = totalWeeks * booking.weekly_rate;

    // Get actual paid amount
    const { data: paymentInstructions, error: paymentError } = await supabaseAdmin
      .from('payment_instructions')
      .select('amount, status')
      .eq('booking_id', bookingId)
      .in('status', ['completed', 'received']);

    if (paymentError) {
      console.error('Error fetching payment instructions:', paymentError);
    }

    const actualPaid = paymentInstructions?.reduce((sum, instruction) => {
      return sum + (instruction.status === 'completed' || instruction.status === 'received' ? instruction.amount : 0);
    }, 0) || 0;

    const outstandingAmount = Math.max(0, finalAmount - actualPaid);

    // Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'completed',
        finished_at: currentTime.toISOString(),
        finished_by: finishedBy,
        finished_by_type: finishedByType,
        final_notes: finalNotes || null,
        final_mileage: finalMileage || null,
        final_fuel_level: finalFuelLevel || null,
        total_days: totalDays,
        total_weeks: totalWeeks,
        final_amount: finalAmount,
        outstanding_amount: outstandingAmount,
        payment_status: outstandingAmount > 0 ? 'outstanding' : 'completed',
        updated_at: currentTime.toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Update vehicle status back to available
    const vehicleId = booking.current_vehicle_id || booking.vehicle_id;
    if (vehicleId) {
      const { error: vehicleUpdateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          status: 'available',
          current_booking_id: null,
          final_mileage: finalMileage || null,
          updated_at: currentTime.toISOString()
        })
        .eq('id', vehicleId);

      if (vehicleUpdateError) {
        console.error('Error updating vehicle status:', vehicleUpdateError);
      }
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'booking_finished',
        performed_by: finishedBy,
        performed_by_type: finishedByType,
        details: {
          performer_name: performerName,
          final_notes: finalNotes,
          final_mileage: finalMileage,
          final_fuel_level: finalFuelLevel,
          total_days: totalDays,
          total_weeks: totalWeeks,
          final_amount: finalAmount,
          actual_paid: actualPaid,
          outstanding_amount: outstandingAmount
        },
        description: `Booking finished by ${performerName}. Total: ${totalDays} days, ${totalWeeks} weeks. Final amount: £${finalAmount}${outstandingAmount > 0 ? ` (Outstanding: £${outstandingAmount})` : ''}`,
        created_at: currentTime.toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Create final payment instruction if there's outstanding amount
    if (outstandingAmount > 0) {
      const { error: finalPaymentError } = await supabaseAdmin
        .from('payment_instructions')
        .insert({
          booking_id: bookingId,
          driver_id: booking.driver_id,
          partner_id: booking.partner_id,
          vehicle_reg: booking.car?.registration_number || booking.vehicle_reg || '',
          amount: outstandingAmount,
          type: 'final_payment',
          method: booking.payment_method || 'bank_transfer',
          status: 'pending',
          reason: 'Final payment for completed booking',
          created_at: currentTime.toISOString(),
          updated_at: currentTime.toISOString()
        });

      if (finalPaymentError) {
        console.error('Error creating final payment instruction:', finalPaymentError);
      }
    }

    // Create final transaction records
    const { error: finalTransactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        booking_id: bookingId,
        partner_id: booking.partner_id,
        driver_id: booking.driver_id,
        type: 'income',
        category: 'Vehicle Rental',
        amount: finalAmount,
        description: `Final payment for completed booking`,
        date: currentTime.toISOString(),
        status: 'completed',
        fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
        net_amount: finalAmount,
        source: 'booking_completion',
        payment_method: booking.payment_method || 'bank_transfer',
        booking_details: {
          total_days: totalDays,
          total_weeks: totalWeeks,
          final_amount: finalAmount,
          actual_paid: actualPaid,
          outstanding_amount: outstandingAmount
        },
        driver_details: {
          name: booking.driver?.full_name || booking.driver_email || 'Unknown',
          email: booking.driver_email
        },
        partner_details: {
          name: booking.partner?.full_name || booking.partner_email || 'Unknown',
          email: booking.partner_email,
          company_name: booking.partner?.company_name
        },
        vehicle_details: {
          registration: booking.car?.registration_number || booking.vehicle_reg || '',
          make: booking.car?.make,
          model: booking.car?.model,
          final_mileage: finalMileage
        },
        created_at: currentTime.toISOString(),
        updated_at: currentTime.toISOString()
      });

    if (finalTransactionError) {
      console.error('Error creating final transaction:', finalTransactionError);
    }

    // Send notifications
    // Notify driver
    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_finished',
        recipient_id: booking.driver_id,
        recipient_type: 'driver',
        title: 'Booking Completed',
        message: `Your booking for ${booking.car?.make} ${booking.car?.model} has been completed.${outstandingAmount > 0 ? ` Outstanding amount: £${outstandingAmount}` : ''}`,
        data: {
          booking_id: bookingId,
          final_amount: finalAmount,
          outstanding_amount: outstandingAmount
        },
        created_at: currentTime.toISOString(),
        priority: 'medium'
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    // Notify partner
    const { error: partnerNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_finished',
        recipient_id: booking.partner_id,
        recipient_type: 'partner',
        title: 'Booking Completed',
        message: `Booking ${bookingId} has been completed by ${performerName}. Final amount: £${finalAmount}${outstandingAmount > 0 ? ` (Outstanding: £${outstandingAmount})` : ''}`,
        data: {
          booking_id: bookingId,
          final_amount: finalAmount,
          outstanding_amount: outstandingAmount,
          performer_name: performerName
        },
        created_at: currentTime.toISOString(),
        priority: 'medium'
      });

    if (partnerNotificationError) {
      console.error('Error creating partner notification:', partnerNotificationError);
    }

    // Notify admin
    const { error: adminNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_finished_admin',
        title: 'Booking Completed',
        message: `Booking ${bookingId} has been completed by ${performerName} (${finishedByType}). Final amount: £${finalAmount}`,
        data: {
          booking_id: bookingId,
          final_amount: finalAmount,
          outstanding_amount: outstandingAmount,
          performer_name: performerName,
          performer_type: finishedByType
        },
        created_at: currentTime.toISOString(),
        priority: 'low'
      });

    if (adminNotificationError) {
      console.error('Error creating admin notification:', adminNotificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking completed successfully',
      final_amount: finalAmount,
      outstanding_amount: outstandingAmount,
      total_days: totalDays,
      total_weeks: totalWeeks
    });

  } catch (error: any) {
    console.error('Error finishing booking:', error);
    return NextResponse.json({ error: 'Failed to finish booking' }, { status: 500 });
  }
}
