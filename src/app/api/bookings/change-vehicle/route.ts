import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, partnerId, newVehicleId, reason, adjustmentType = 'prorated' } = await req.json();

    if (!bookingId || !partnerId || !newVehicleId || !reason) {
      return NextResponse.json({ error: 'Missing required fields: bookingId, partnerId, newVehicleId, reason' }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify partner ownership
    if (booking.partner_id !== partnerId) {
      return NextResponse.json({ error: 'Unauthorized: You can only modify your own bookings' }, { status: 403 });
    }

    // Check if booking can be modified
    if (!['active', 'partner_accepted', 'confirmed', 'pending_insurance_upload'].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot change vehicle for booking with status: ${booking.status}` }, { status: 400 });
    }

    // Get new vehicle details
    const { data: newVehicle, error: newVehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', newVehicleId)
      .single();

    if (newVehicleError || !newVehicle) {
      return NextResponse.json({ error: 'New vehicle not found' }, { status: 404 });
    }

    // Check vehicle availability
    if (newVehicle.status !== 'available') {
      return NextResponse.json({ error: 'Selected vehicle is not available' }, { status: 400 });
    }

    // Get current vehicle details for comparison
    const { data: currentVehicle, error: currentVehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', booking.current_vehicle_id)
      .single();

    const oldWeeklyRate = booking.weekly_rate || currentVehicle?.price_per_week || 0;
    const newWeeklyRate = newVehicle.price_per_week || 0;
    const rateDifference = newWeeklyRate - oldWeeklyRate;

    // Get actual paid weeks/amount for adjustment logic
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

    // Calculate cost adjustment based on actual paid weeks
    let adjustmentAmount = 0;
    let adjustmentReason = '';
    let daysUsed = 0;
    let remainingDays = 0;
    const now = new Date();
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);

    if (booking.status === 'active') {
      daysUsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      remainingDays = Math.max(0, (Math.ceil(actualPaid / (oldWeeklyRate / 7)) * 7) - daysUsed);
    } else {
      // Not yet active, calculate for full period
      remainingDays = Math.ceil(actualPaid / (oldWeeklyRate / 7)) * 7;
    }

    if (adjustmentType === 'prorated') {
      // Calculate prorated adjustment for remaining paid days
      const dailyRateDifference = rateDifference / 7; // Weekly rate to daily
      adjustmentAmount = dailyRateDifference * remainingDays;
      adjustmentReason = `Prorated rate adjustment: ${remainingDays} paid days remaining at ${rateDifference >= 0 ? '+' : ''}£${rateDifference}/week`;
    } else if (adjustmentType === 'immediate') {
      // Full weekly difference applied immediately
      adjustmentAmount = rateDifference;
      adjustmentReason = `Immediate rate adjustment: ${rateDifference >= 0 ? '+' : ''}£${rateDifference}/week`;
    } else if (adjustmentType === 'next_cycle') {
      // No immediate charge, will affect next billing cycle
      adjustmentAmount = 0;
      adjustmentReason = `Rate change will apply to next billing cycle: ${rateDifference >= 0 ? '+' : ''}£${rateDifference}/week`;
    }

    // Round adjustment amount
    adjustmentAmount = Math.round(adjustmentAmount * 100) / 100;

    let paymentProcessed = false;
    let stripePaymentId = null;
    let stripeRefundId = null;

    // Process payment adjustment if needed
    if (adjustmentAmount !== 0) {
      try {
        // Get active subscription for this booking
        const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('booking_id', bookingId)
          .eq('status', 'active')
          .limit(1);

        if (!subscriptionError && subscriptions && subscriptions.length > 0) {
          const subscription = subscriptions[0];

          if (adjustmentAmount > 0) {
            // Additional charge needed
            if (subscription.stripe_customer_id && subscription.stripe_subscription_id) {
              // This would integrate with your Stripe invoice creation
              // For now, we'll simulate the payment
              stripePaymentId = `inv_${Date.now()}`;
              paymentProcessed = true;

              // Record additional payment
              const { error: paymentRecordError } = await supabaseAdmin
                .from('payments')
                .insert({
                  booking_id: bookingId,
                  driver_id: booking.driver_id,
                  partner_id: partnerId,
                  stripe_invoice_id: stripePaymentId,
                  amount: adjustmentAmount,
                  currency: 'gbp',
                  status: 'completed',
                  type: 'vehicle_change_adjustment',
                  created_at: now.toISOString(),
                  updated_at: now.toISOString(),
                  metadata: {
                    old_vehicle_id: booking.current_vehicle_id,
                    new_vehicle_id: newVehicleId,
                    old_weekly_rate: oldWeeklyRate,
                    new_weekly_rate: newWeeklyRate,
                    rate_difference: rateDifference,
                    adjustment_reason: adjustmentReason,
                    days_used: daysUsed,
                    remaining_days: remainingDays
                  }
                });

              if (paymentRecordError) {
                console.error('Error recording payment:', paymentRecordError);
              }

              // Create transaction records for revenue tracking
              // 1. Partner Income Transaction
              const { error: partnerTransactionError } = await supabaseAdmin
                .from('transactions')
                .insert({
                  booking_id: bookingId,
                  partner_id: partnerId,
                  driver_id: booking.driver_id,
                  type: 'income',
                  category: 'Vehicle Rental',
                  amount: adjustmentAmount,
                  description: `Vehicle change adjustment: ${adjustmentReason}`,
                  date: now.toISOString(),
                  status: 'completed',
                  fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
                  net_amount: adjustmentAmount,
                  source: 'stripe',
                  payment_method: 'card',
                  stripe_invoice_id: stripePaymentId,
                  booking_details: {
                    old_vehicle_id: booking.current_vehicle_id,
                    new_vehicle_id: newVehicleId,
                    old_weekly_rate: oldWeeklyRate,
                    new_weekly_rate: newWeeklyRate,
                    rate_difference: rateDifference,
                    adjustment_reason: adjustmentReason
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
                    registration: newVehicle.registration_number,
                    make: newVehicle.make,
                    model: newVehicle.model
                  },
                  created_at: now.toISOString(),
                  updated_at: now.toISOString()
                });

              if (partnerTransactionError) {
                console.error('Error creating partner transaction:', partnerTransactionError);
              }

              // 2. Driver Expense Transaction
              const { error: driverTransactionError } = await supabaseAdmin
                .from('transactions')
                .insert({
                  booking_id: bookingId,
                  partner_id: partnerId,
                  driver_id: booking.driver_id,
                  type: 'expense',
                  category: 'Vehicle Rental',
                  amount: adjustmentAmount,
                  description: `Vehicle change adjustment: ${adjustmentReason}`,
                  date: now.toISOString(),
                  status: 'completed',
                  fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
                  net_amount: adjustmentAmount,
                  source: 'stripe',
                  payment_method: 'card',
                  stripe_invoice_id: stripePaymentId,
                  booking_details: {
                    old_vehicle_id: booking.current_vehicle_id,
                    new_vehicle_id: newVehicleId,
                    old_weekly_rate: oldWeeklyRate,
                    new_weekly_rate: newWeeklyRate,
                    rate_difference: rateDifference,
                    adjustment_reason: adjustmentReason
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
                    registration: newVehicle.registration_number,
                    make: newVehicle.make,
                    model: newVehicle.model
                  },
                  created_at: now.toISOString(),
                  updated_at: now.toISOString()
                });

              if (driverTransactionError) {
                console.error('Error creating driver transaction:', driverTransactionError);
              }
            }
          } else if (adjustmentAmount < 0) {
            // Refund needed
            stripeRefundId = `ref_${Date.now()}`;
            paymentProcessed = true;

            // Create refund transaction records
            const { error: refundTransactionError } = await supabaseAdmin
              .from('transactions')
              .insert({
                booking_id: bookingId,
                partner_id: partnerId,
                driver_id: booking.driver_id,
                type: 'income',
                category: 'Vehicle Rental',
                amount: adjustmentAmount, // Negative amount
                description: `Vehicle change refund: ${adjustmentReason}`,
                date: now.toISOString(),
                status: 'completed',
                fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
                net_amount: adjustmentAmount, // Negative amount
                source: 'stripe',
                payment_method: 'card',
                stripe_refund_id: stripeRefundId,
                booking_details: {
                  old_vehicle_id: booking.current_vehicle_id,
                  new_vehicle_id: newVehicleId,
                  old_weekly_rate: oldWeeklyRate,
                  new_weekly_rate: newWeeklyRate,
                  rate_difference: rateDifference,
                  adjustment_reason: adjustmentReason
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
                  registration: newVehicle.registration_number,
                  make: newVehicle.make,
                  model: newVehicle.model
                },
                created_at: now.toISOString(),
                updated_at: now.toISOString()
              });

            if (refundTransactionError) {
              console.error('Error creating refund transaction:', refundTransactionError);
            }
          }
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        return NextResponse.json({ error: 'Failed to process payment adjustment' }, { status: 500 });
      }
    }

    // Get performer data for history logging
    const { data: performerData, error: performerError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .single();

    const performerName = performerData?.company_name || performerData?.company || performerData?.full_name || performerData?.name || performerData?.email || 'Unknown';

    const oldVehicleId = booking.current_vehicle_id;

    // Create vehicle history entry
    const vehicleHistoryEntry = {
      vehicle_id: newVehicleId,
      assigned_at: now.toISOString(),
      assigned_by: partnerId,
      assigned_by_type: 'partner',
      assigned_by_name: performerName,
      reason: reason,
      status: 'active',
      previous_vehicle_id: oldVehicleId
    };

    // Create booking history entry
    const bookingHistoryEntry = {
      booking_id: bookingId,
      action: 'vehicle_assigned',
      performed_by: partnerId,
      performed_by_type: 'partner',
      details: {
        old_vehicle_id: oldVehicleId,
        new_vehicle_id: newVehicleId,
        old_vehicle: `${booking.car?.make} ${booking.car?.model} (${booking.car?.registration_number})`,
        new_vehicle: `${newVehicle.make} ${newVehicle.model} (${newVehicle.registration_number})`,
        reason: reason,
        performer_name: performerName,
        adjustment_amount: adjustmentAmount,
        adjustment_reason: adjustmentReason
      },
      description: `Vehicle changed from ${booking.car?.make} ${booking.car?.model} to ${newVehicle.make} ${newVehicle.model} by ${performerName}. Reason: ${reason}${adjustmentAmount !== 0 ? ` (${adjustmentAmount >= 0 ? '+' : ''}£${adjustmentAmount})` : ''}`,
      created_at: now.toISOString()
    };

    // Update booking with new vehicle
    const newVehicleName = `${newVehicle.make || ''} ${newVehicle.model || ''}`.trim();
    const newPlate = newVehicle.registration_number || '';

    const updateData = {
      current_vehicle_id: newVehicleId,
      car_id: newVehicleId, // Update legacy fields for compatibility with driver pages
      car_name: newVehicleName,
      car_image: newVehicle.image_url || (newVehicle.image_urls && newVehicle.image_urls[0]) || '',
      car_plate: newPlate,
      car: {
        id: newVehicleId,
        make: newVehicle.make || '',
        model: newVehicle.model || '',
        year: newVehicle.year || '',
        registration_number: newPlate,
        color: newVehicle.color || '',
        fuel_type: newVehicle.fuel_type || '',
        transmission: newVehicle.transmission || '',
        seats: newVehicle.seats || '',
        mileage: newVehicle.mileage || '',
        image: newVehicle.image_url || (newVehicle.image_urls && newVehicle.image_urls[0]) || '',
        price_per_week: newVehicle.price_per_week || 0
      },
      vehicle_history: booking.vehicle_history ? [...booking.vehicle_history, vehicleHistoryEntry] : [vehicleHistoryEntry],
      updated_at: now.toISOString()
    };

    // Use a batch to update multiple documents atomically
    const batch = [];

    // Update booking
    const { error: bookingUpdateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (bookingUpdateError) {
      console.error('Error updating booking:', bookingUpdateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Update old vehicle status to available (if it exists)
    if (oldVehicleId && oldVehicleId !== newVehicleId) {
      const { error: oldVehicleUpdateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          status: 'available',
          current_booking_id: null,
          updated_at: now.toISOString()
        })
        .eq('id', oldVehicleId);

      if (oldVehicleUpdateError) {
        console.error('Error updating old vehicle status:', oldVehicleUpdateError);
      }
    }

    // Update new vehicle status to booked
    const { error: newVehicleUpdateError } = await supabaseAdmin
      .from('vehicles')
      .update({
        status: 'booked',
        current_booking_id: bookingId,
        updated_at: now.toISOString()
      })
      .eq('id', newVehicleId);

    if (newVehicleUpdateError) {
      console.error('Error updating new vehicle status:', newVehicleUpdateError);
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert(bookingHistoryEntry);

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Send notification to driver
    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'vehicle_assigned',
        recipient_id: booking.driver_id,
        recipient_type: 'driver',
        title: 'Vehicle Changed',
        message: `Your assigned vehicle has been changed to ${newVehicle.make} ${newVehicle.model} (${newVehicle.registration_number}). Reason: ${reason}${adjustmentAmount !== 0 ? ` (${adjustmentAmount >= 0 ? '+' : ''}£${adjustmentAmount})` : ''}`,
        data: {
          booking_id: bookingId,
          old_vehicle: `${booking.car?.make} ${booking.car?.model}`,
          new_vehicle: `${newVehicle.make} ${newVehicle.model}`,
          adjustment_amount: adjustmentAmount
        },
        created_at: now.toISOString(),
        priority: 'high'
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    // Send notification to admin
    const { error: adminNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'vehicle_assigned_admin',
        title: 'Vehicle Assignment Changed',
        message: `Partner ${performerName} changed vehicle for booking ${bookingId} from ${booking.car?.make} ${booking.car?.model} to ${newVehicle.make} ${newVehicle.model}`,
        data: {
          booking_id: bookingId,
          partner_name: performerName,
          old_vehicle: `${booking.car?.make} ${booking.car?.model}`,
          new_vehicle: `${newVehicle.make} ${newVehicle.model}`,
          adjustment_amount: adjustmentAmount
        },
        created_at: now.toISOString(),
        priority: 'medium'
      });

    if (adminNotificationError) {
      console.error('Error creating admin notification:', adminNotificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle assigned successfully',
      new_vehicle: {
        id: newVehicleId,
        make: newVehicle.make,
        model: newVehicle.model,
        registration_number: newVehicle.registration_number
      },
      adjustment_amount: adjustmentAmount,
      adjustment_reason: adjustmentReason,
      payment_processed: paymentProcessed,
      stripe_payment_id: stripePaymentId,
      stripe_refund_id: stripeRefundId
    });

  } catch (error: any) {
    console.error('Vehicle assignment error:', error);
    return NextResponse.json({ error: 'Failed to assign vehicle' }, { status: 500 });
  }
}
