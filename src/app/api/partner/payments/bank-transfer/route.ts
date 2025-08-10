import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, amount, currency = 'gbp', driverId, partnerId } = await req.json();

    if (!bookingId || !amount || !driverId || !partnerId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const referenceCode = `CP-${bookingId.substring(0, 6).toUpperCase()}-${uuidv4().split('-')[0].toUpperCase()}`;

    // Store payment in Supabase payments table
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: bookingId,
        driver_id: driverId,
        partner_id: partnerId,
        amount: amount,
        currency: currency,
        status: 'PENDING',
        type: 'BOOKING_PAYMENT',
        method: 'BANK_TRANSFER',
        transaction_id: referenceCode,
        description: `Bank transfer with reference ${referenceCode}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 });
    }

    // Update booking status in Supabase
    const { error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'pending_bank_transfer',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingError) {
      console.error('Error updating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    // Create payment instruction for tracking
    const { error: instructionError } = await supabaseAdmin
      .from('payment_instructions')
      .insert({
        partner_id: partnerId,
        booking_id: bookingId,
        driver_id: driverId,
        amount: amount,
        method: 'bank_transfer',
        type: 'weekly_rent',
        status: 'pending',
        next_due_date: new Date().toISOString(),
        reason: `Bank transfer initiated with reference ${referenceCode}`,
        metadata: {
          referenceCode,
          currency,
          initiated_at: new Date().toISOString()
        }
      });

    if (instructionError) {
      console.error('Error creating payment instruction:', instructionError);
      // Don't fail the request if instruction creation fails
    }

    // Add to booking history (if you have a history table)
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'bank_transfer_initiated',
        performed_by: driverId,
        performed_by_type: 'driver',
        details: {
          amount,
          currency,
          referenceCode
        },
        description: `Driver selected bank transfer with reference ${referenceCode}`,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
      // Don't fail the request if history creation fails
    }

    return NextResponse.json({ 
      referenceCode,
      paymentId: paymentData.id,
      message: 'Bank transfer initiated successfully'
    });

  } catch (err: any) {
    console.error('Bank transfer API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 