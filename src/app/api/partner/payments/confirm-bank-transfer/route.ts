import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, paymentId, confirmedBy, confirmedByType = 'partner' } = await req.json();

    if (!bookingId || !paymentId || !confirmedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update payment status to confirmed
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'COMPLETED',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (paymentError) {
      console.error('Error updating payment status:', paymentError);
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
    }

    if (!paymentData) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update booking payment status
    const { error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Error updating booking status:', bookingError);
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    // Update payment instruction status
    const { error: instructionError } = await supabaseAdmin
      .from('payment_instructions')
      .update({
        status: 'received',
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', bookingId)
      .eq('status', 'pending');

    if (instructionError) {
      console.error('Error updating payment instruction:', instructionError);
      // Don't fail the request if instruction update fails
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'bank_transfer_confirmed',
        performed_by: confirmedBy,
        performed_by_type: confirmedByType,
        details: {
          paymentId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          confirmed_at: new Date().toISOString()
        },
        description: `Bank transfer payment confirmed by ${confirmedByType}`,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
      // Don't fail the request if history creation fails
    }

    // Create a notification for the driver
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: paymentData.driver_id,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        message: `Your bank transfer payment of ${paymentData.currency.toUpperCase()} ${paymentData.amount} has been confirmed.`,
        data: {
          bookingId,
          paymentId,
          amount: paymentData.amount,
          currency: paymentData.currency
        },
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({ 
      success: true,
      paymentId: paymentData.id,
      bookingId,
      message: 'Bank transfer payment confirmed successfully'
    });

  } catch (err: any) {
    console.error('Confirm bank transfer API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 