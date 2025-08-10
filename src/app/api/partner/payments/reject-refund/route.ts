import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Body: { instructionId: string, partnerId: string, reason: string }
export async function POST(req: NextRequest) {
  try {
    const { instructionId, partnerId, reason } = await req.json();
    if (!instructionId || !partnerId || !reason) {
      return NextResponse.json({ error: 'Missing instructionId, partnerId, or reason' }, { status: 400 });
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

    if (instruction.status !== 'pending' && instruction.status !== 'deposit_refund_pending' && instruction.status !== 'sent') {
      return NextResponse.json({ error: 'Refund not pending' }, { status: 400 });
    }

    // Update instruction status and store rejection reason
    const { error: updateError } = await supabaseAdmin
      .from('payment_instructions')
      .update({
        status: 'refund_rejected',
        refund_rejection_reason: reason,
        refund_rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', instructionId);

    if (updateError) {
      console.error('Error updating instruction status:', updateError);
      return NextResponse.json({ error: 'Failed to update instruction status' }, { status: 500 });
    }

    // Notify driver
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: instruction.driver_id,
        type: 'refund_rejected',
        title: 'Refund Rejected',
        message: `Your refund request for booking ${instruction.booking_id} was rejected. Reason: ${reason}`,
        data: {
          instruction_id: instructionId,
          booking_id: instruction.booking_id,
          reason: reason
        },
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: instruction.booking_id,
        action: 'refund_rejected',
        performed_by: partnerId,
        performed_by_type: 'partner',
        details: {
          instruction_id: instructionId,
          reason: reason,
          rejected_at: new Date().toISOString()
        },
        description: `Refund rejected: ${reason}`,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Update booking timestamp
    const { error: bookingUpdateError } = await supabaseAdmin
      .from('bookings')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', instruction.booking_id);

    if (bookingUpdateError) {
      console.error('Error updating booking:', bookingUpdateError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Refund rejected successfully'
    });

  } catch (err: any) {
    console.error('reject refund error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
} 