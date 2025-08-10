import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    if (instruction.driver_id !== driverId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (instruction.method !== 'bank_transfer') {
      return NextResponse.json({ error: 'Only manual transfers can be marked sent' }, { status: 400 });
    }

    if (instruction.status === 'sent') {
      return NextResponse.json({ error: 'Already marked sent' }, { status: 400 });
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

    // ---------------------------------------------
    // Promote booking status (if still pending_payment)
    // ---------------------------------------------
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', instruction.booking_id)
      .single();

    if (!bookingError && bookingData && bookingData.status === 'pending_payment') {
      const acceptanceDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h

      const { error: bookingUpdateError } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'pending_partner_approval',
          partner_acceptance_deadline: acceptanceDeadline.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', instruction.booking_id);

      if (bookingUpdateError) {
        console.error('Error updating booking status:', bookingUpdateError);
      }

      // Add to booking history
      const { error: historyError } = await supabaseAdmin
        .from('booking_history')
        .insert({
          booking_id: instruction.booking_id,
          action: 'first_payment_sent',
          performed_by: driverId,
          performed_by_type: 'driver',
          details: {
            amount: instruction.amount,
            instruction_id: instructionId
          },
          description: `Driver marked first weekly payment of £${instruction.amount} as sent.`,
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('Error adding to booking history:', historyError);
      }

      // New-booking notification for partner to approve
      const { error: partnerNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: instruction.partner_id,
          type: 'new_booking',
          title: 'New Booking Request',
          message: `Weekly payment received. Please approve or reject booking for ${instruction.vehicle_reg}.`,
          data: {
            booking_id: instruction.booking_id,
            instruction_id: instructionId,
            amount: instruction.amount
          },
          created_at: new Date().toISOString(),
          priority: 'high'
        });

      if (partnerNotificationError) {
        console.error('Error creating partner notification:', partnerNotificationError);
      }

      // Notify financial staff as well
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
                user_id: staff.user_id,
                type: 'new_booking',
                title: 'New Booking Request',
                message: `Weekly payment received. Please approve or reject booking for ${instruction.vehicle_reg}.`,
                data: {
                  booking_id: instruction.booking_id,
                  instruction_id: instructionId,
                  amount: instruction.amount
                },
                created_at: new Date().toISOString(),
                priority: 'high'
              });

            if (staffNotificationError) {
              console.error('Error creating staff notification:', staffNotificationError);
            }
          }
        }
      }
    }

    // Prepare notification object
    const notification = {
      type: 'payment_sent',
      title: 'Payment Sent',
      message: `Driver has marked weekly payment (£${instruction.amount}) for ${instruction.vehicle_reg} as sent. Please confirm receipt and approve the booking.`,
      data: {
        instruction_id: instructionId,
        booking_id: instruction.booking_id,
        amount: instruction.amount
      },
      created_at: new Date().toISOString()
    };

    // Notify main partner
    const { error: mainPartnerNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        ...notification,
        user_id: instruction.partner_id
      });

    if (mainPartnerNotificationError) {
      console.error('Error creating main partner notification:', mainPartnerNotificationError);
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
              ...notification,
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
      message: 'Payment marked as sent successfully'
    });

  } catch (err: any) {
    console.error('mark-sent error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
} 