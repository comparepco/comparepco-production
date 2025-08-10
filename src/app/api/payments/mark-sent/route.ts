import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// POST /api/payments/mark-sent
// Body: { instructionId: string, driverId: string }
export async function POST(req: NextRequest) {
  try {
    const { instructionId, driverId } = await req.json();
    
    if (!instructionId || !driverId) {
      return NextResponse.json({ error: 'Missing instructionId or driverId' }, { status: 400 });
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

    // Verify the driver owns this instruction
    if (instruction.driver_id !== driverId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow bank transfer payments to be marked as sent
    if (instruction.method !== 'bank_transfer') {
      return NextResponse.json({ error: 'Only manual transfers can be marked sent' }, { status: 400 });
    }

    // Check if already marked as sent
    if (instruction.status === 'sent') {
      return NextResponse.json({ error: 'Already marked sent' }, { status: 400 });
    }

    // Check if payment is overdue
    const isOverdue = instruction.next_due_date && new Date(instruction.next_due_date) < new Date();
    if (!isOverdue && instruction.status === 'pending') {
      return NextResponse.json({ error: 'Payment is not due yet' }, { status: 400 });
    }

    // Update instruction status
    const { error: updateError } = await supabaseAdmin
      .from('payment_instructions')
      .update({
        status: 'sent',
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructionId);

    if (updateError) {
      console.error('Error updating instruction status:', updateError);
      return NextResponse.json({ error: 'Failed to update instruction status' }, { status: 500 });
    }

    // Get booking details for comprehensive transaction records
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', instruction.booking_id)
      .single();

    if (!bookingError && bookingData) {
      // Create a transaction record
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          booking_id: instruction.booking_id,
          driver_id: instruction.driver_id,
          partner_id: instruction.partner_id,
          amount: instruction.amount,
          type: 'payment_sent',
          status: 'pending_confirmation',
          method: instruction.method,
          description: `Payment marked as sent for ${instruction.type}`,
          category: 'Booking Revenue',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
      }
    }

    // Send notification to partner (if notification system is implemented)
    try {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          recipient_id: instruction.partner_id,
          sender_id: instruction.driver_id,
          type: 'payment_sent',
          title: 'Payment Marked as Sent',
          message: `Driver has marked payment of £${instruction.amount} as sent for ${instruction.vehicle_reg}`,
          data: {
            instruction_id: instructionId,
            booking_id: instruction.booking_id,
            amount: instruction.amount,
            vehicle_reg: instruction.vehicle_reg,
          },
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    } catch (notificationErr) {
      console.error('Error sending notification:', notificationErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment marked as sent successfully',
      instruction: {
        id: instructionId,
        status: 'sent',
        last_sent_at: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('Mark sent error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 