import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, reason, cancelType, insuranceRefundAmount } = await req.json();

    if (!bookingId || !reason || !cancelType) {
      return NextResponse.json({ error: 'Missing required fields: bookingId, reason, cancelType' }, { status: 400 });
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

    const now = new Date();

    // Calculate refund amounts
    let refundAmount = 0;
    let insuranceRefund = 0;
    let stripeRefundId = null;
    let subscriptionsCancelled = false;

    // Calculate days used and remaining
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - daysUsed);

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

    const weeklyRate = booking.car?.price_per_week || booking.price_per_week || 0;
    const dailyRate = weeklyRate / 7;

    // Calculate refund based on cancel type
    switch (cancelType) {
      case 'full':
        refundAmount = actualPaid;
        break;
      case 'prorated':
        // Only refund for paid days not used
        const paidDays = Math.ceil(actualPaid / dailyRate);
        const remainingPaidDays = Math.max(0, paidDays - daysUsed);
        refundAmount = Math.round(remainingPaidDays * dailyRate * 100) / 100;
        break;
      case 'none':
        refundAmount = 0;
        break;
      default:
        return NextResponse.json({ error: 'Invalid cancel type' }, { status: 400 });
    }

    // Handle insurance refund if provided
    if (insuranceRefundAmount && insuranceRefundAmount > 0) {
      insuranceRefund = insuranceRefundAmount;
    }

    // Process refund if payment was made
    if (booking.payment_status === 'paid' && refundAmount > 0) {
      try {
        // This would integrate with your Stripe refund logic
        // For now, we'll simulate the refund
        stripeRefundId = `ref_${Date.now()}`;

        // Create transaction records for refund tracking
        // 1. Partner Income Reduction (negative transaction)
        const { error: partnerTransactionError } = await supabaseAdmin
          .from('transactions')
          .insert({
            booking_id: bookingId,
            partner_id: booking.partner_id,
            driver_id: booking.driver_id,
            type: 'income',
            category: 'Vehicle Rental',
            amount: -refundAmount, // Negative amount
            description: `Booking cancellation refund (${cancelType})`,
            date: now.toISOString(),
            status: 'completed',
            fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
            net_amount: -refundAmount, // Negative amount
            source: 'stripe',
            payment_method: 'card',
            stripe_refund_id: stripeRefundId,
            booking_details: {
              original_amount: booking.total_amount,
              days_used: daysUsed,
              total_days: totalDays,
              remaining_days: remainingDays,
              cancel_type: cancelType,
              cancel_reason: reason
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
              registration: booking.car_plate || booking.car?.registration_number || '',
              make: booking.car?.make,
              model: booking.car?.model
            },
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          });

        if (partnerTransactionError) {
          console.error('Error creating partner transaction:', partnerTransactionError);
        }

        // 2. Driver Expense Reduction (negative transaction)
        const { error: driverTransactionError } = await supabaseAdmin
          .from('transactions')
          .insert({
            booking_id: bookingId,
            partner_id: booking.partner_id,
            driver_id: booking.driver_id,
            type: 'expense',
            category: 'Vehicle Rental',
            amount: -refundAmount, // Negative amount
            description: `Booking cancellation refund (${cancelType})`,
            date: now.toISOString(),
            status: 'completed',
            fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
            net_amount: -refundAmount, // Negative amount
            source: 'stripe',
            payment_method: 'card',
            stripe_refund_id: stripeRefundId,
            booking_details: {
              original_amount: booking.total_amount,
              days_used: daysUsed,
              total_days: totalDays,
              remaining_days: remainingDays,
              cancel_type: cancelType,
              cancel_reason: reason
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
              registration: booking.car_plate || booking.car?.registration_number || '',
              make: booking.car?.make,
              model: booking.car?.model
            },
            created_at: now.toISOString(),
            updated_at: now.toISOString()
          });

        if (driverTransactionError) {
          console.error('Error creating driver transaction:', driverTransactionError);
        }

        // 3. Insurance Refund Transaction (if applicable)
        if (insuranceRefund > 0) {
          const { error: insuranceTransactionError } = await supabaseAdmin
            .from('transactions')
            .insert({
              booking_id: bookingId,
              partner_id: booking.partner_id,
              driver_id: booking.driver_id,
              type: 'income',
              category: 'Insurance',
              amount: -insuranceRefund, // Negative amount
              description: `Insurance refund for booking cancellation`,
              date: now.toISOString(),
              status: 'completed',
              fees: { platform: 0, payment: 0, insurance: 0, maintenance: 0 },
              net_amount: -insuranceRefund, // Negative amount
              source: 'stripe',
              payment_method: 'card',
              stripe_refund_id: stripeRefundId,
              booking_details: {
                original_amount: booking.total_amount,
                days_used: daysUsed,
                total_days: totalDays,
                remaining_days: remainingDays,
                cancel_type: cancelType,
                cancel_reason: reason
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
                registration: booking.car_plate || booking.car?.registration_number || '',
                make: booking.car?.make,
                model: booking.car?.model
              },
              created_at: now.toISOString(),
              updated_at: now.toISOString()
            });

          if (insuranceTransactionError) {
            console.error('Error creating insurance transaction:', insuranceTransactionError);
          }
        }

      } catch (error) {
        console.error('Stripe refund error:', error);
        return NextResponse.json({ error: 'Failed to process payment refund' }, { status: 500 });
      }
    }

    // Cancel any active subscriptions
    if (booking.stripe_subscription_id) {
      try {
        // This would integrate with your Stripe subscription cancellation
        subscriptionsCancelled = true;
      } catch (error) {
        console.error('Subscription cancellation error:', error);
      }
    }

    // Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: now.toISOString(),
        cancelled_by: booking.driver_id,
        cancelled_by_type: 'driver',
        cancel_reason: reason,
        cancel_type: cancelType,
        refund_amount: refundAmount,
        insurance_refund: insuranceRefund,
        stripe_refund_id: stripeRefundId,
        subscriptions_cancelled: subscriptionsCancelled,
        days_used: daysUsed,
        remaining_days: remainingDays,
        payment_status: refundAmount > 0 ? 'refunded' : booking.payment_status,
        updated_at: now.toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'booking_cancelled',
        performed_by: booking.driver_id,
        performed_by_type: 'driver',
        details: {
          reason,
          cancel_type: cancelType,
          refund_amount: refundAmount,
          insurance_refund: insuranceRefund,
          stripe_refund_id: stripeRefundId,
          subscriptions_cancelled: subscriptionsCancelled,
          days_used: daysUsed,
          total_days: totalDays,
          remaining_days: remainingDays
        },
        description: `Booking cancelled by driver: ${reason}${refundAmount > 0 ? ` (£${refundAmount} refunded)` : ''}${insuranceRefund > 0 ? ` (Insurance refund: £${insuranceRefund})` : ''}`,
        created_at: now.toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Update vehicle status back to available
    const vehicleId = booking.car_id || booking.current_vehicle_id;
    if (vehicleId) {
      const { error: vehicleUpdateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          status: 'available',
          current_booking_id: null,
          updated_at: now.toISOString()
        })
        .eq('id', vehicleId);

      if (vehicleUpdateError) {
        console.error('Error updating vehicle status:', vehicleUpdateError);
      }
    }

    // Send notifications
    const notifications = [];

    // Notify partner
    const { error: partnerNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_cancelled',
        recipient_id: booking.partner_id,
        recipient_type: 'partner',
        title: 'Booking Cancelled',
        message: `Booking ${bookingId} has been cancelled by the driver. Reason: ${reason}`,
        data: {
          booking_id: bookingId,
          cancel_type: cancelType,
          refund_amount: refundAmount,
          insurance_refund: insuranceRefund,
          reason
        },
        created_at: now.toISOString(),
        priority: 'medium'
      });

    if (partnerNotificationError) {
      console.error('Error creating partner notification:', partnerNotificationError);
    }

    // Notify admin
    const { error: adminNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_cancelled',
        title: 'Booking Cancelled by Driver',
        message: `Driver ${booking.driver?.full_name || 'Unknown'} cancelled booking ${bookingId}. Reason: ${reason}`,
        data: {
          booking_id: bookingId,
          cancel_type: cancelType,
          refund_amount: refundAmount,
          insurance_refund: insuranceRefund,
          reason
        },
        created_at: now.toISOString(),
        priority: 'medium'
      });

    if (adminNotificationError) {
      console.error('Error creating admin notification:', adminNotificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      refund_amount: refundAmount,
      insurance_refund: insuranceRefund,
      stripe_refund_id: stripeRefundId,
      subscriptions_cancelled: subscriptionsCancelled
    });

  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
