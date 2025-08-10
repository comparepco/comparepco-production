import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, checkType } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 });
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
    const results = {
      booking_id: bookingId,
      checks_performed: [] as string[],
      actions_taken: [] as string[],
      notifications_sent: [] as string[]
    };

    // Check partner acceptance deadline
    if (booking.status === 'pending_partner_approval' && booking.partner_acceptance_deadline) {
      const deadline = new Date(booking.partner_acceptance_deadline);
      
      if (currentTime > deadline) {
        // Deadline exceeded - auto-reject booking
        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'auto_rejected',
            auto_rejected_at: currentTime.toISOString(),
            auto_rejection_reason: 'Partner acceptance deadline exceeded',
            updated_at: currentTime.toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking for auto-rejection:', updateError);
        } else {
          results.actions_taken.push('booking_auto_rejected');
        }

        // Add to booking history
        const { error: historyError } = await supabaseAdmin
          .from('booking_history')
          .insert({
            booking_id: bookingId,
            action: 'booking_auto_rejected',
            performed_by: 'system',
            performed_by_type: 'system',
            details: {
              reason: 'Partner acceptance deadline exceeded',
              deadline: booking.partner_acceptance_deadline,
              exceeded_by: currentTime.getTime() - deadline.getTime()
            },
            description: 'Booking automatically rejected due to partner acceptance deadline being exceeded',
            created_at: currentTime.toISOString()
          });

        if (historyError) {
          console.error('Error adding to booking history:', historyError);
        }

        // Update vehicle status back to available
        const vehicleId = booking.current_vehicle_id || booking.vehicle_id;
        if (vehicleId) {
          const { error: vehicleUpdateError } = await supabaseAdmin
            .from('vehicles')
            .update({
              status: 'available',
              current_booking_id: null,
              updated_at: currentTime.toISOString()
            })
            .eq('id', vehicleId);

          if (vehicleUpdateError) {
            console.error('Error updating vehicle status:', vehicleUpdateError);
          }
        }

        // Send notifications
        const { error: driverNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'booking_auto_rejected',
            recipient_id: booking.driver_id,
            recipient_type: 'driver',
            title: 'Booking Auto-Rejected',
            message: 'Your booking has been automatically rejected because the partner did not respond within the required time.',
            data: {
              booking_id: bookingId,
              reason: 'Partner acceptance deadline exceeded'
            },
            created_at: currentTime.toISOString(),
            priority: 'medium'
          });

        if (driverNotificationError) {
          console.error('Error creating driver notification:', driverNotificationError);
        } else {
          results.notifications_sent.push('driver_notification');
        }

        const { error: adminNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'booking_auto_rejected_admin',
            title: 'Booking Auto-Rejected',
            message: `Booking ${bookingId} was automatically rejected due to partner acceptance deadline being exceeded.`,
            data: {
              booking_id: bookingId,
              reason: 'Partner acceptance deadline exceeded'
            },
            created_at: currentTime.toISOString(),
            priority: 'low'
          });

        if (adminNotificationError) {
          console.error('Error creating admin notification:', adminNotificationError);
        } else {
          results.notifications_sent.push('admin_notification');
        }
      } else {
        // Deadline approaching - send reminder
        const timeUntilDeadline = deadline.getTime() - currentTime.getTime();
        const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);

        if (hoursUntilDeadline <= 2) {
          // Send urgent reminder to partner
          const { error: partnerNotificationError } = await supabaseAdmin
            .from('notifications')
            .insert({
              type: 'partner_acceptance_reminder',
              recipient_id: booking.partner_id,
              recipient_type: 'partner',
              title: 'URGENT: Booking Response Required',
              message: `You have ${Math.round(hoursUntilDeadline)} hours to respond to booking ${bookingId}. Please accept or reject the booking.`,
              data: {
                booking_id: bookingId,
                hours_remaining: Math.round(hoursUntilDeadline)
              },
              created_at: currentTime.toISOString(),
              priority: 'high'
            });

          if (partnerNotificationError) {
            console.error('Error creating partner reminder notification:', partnerNotificationError);
          } else {
            results.notifications_sent.push('partner_reminder');
          }
        }
      }

      results.checks_performed.push('partner_acceptance_deadline');
    }

    // Check payment deadline
    if (booking.status === 'pending_payment' && booking.payment_deadline) {
      const deadline = new Date(booking.payment_deadline);
      
      if (currentTime > deadline) {
        // Payment deadline exceeded
        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'payment_expired',
            payment_expired_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking for payment expiry:', updateError);
        } else {
          results.actions_taken.push('payment_expired');
        }

        // Add to booking history
        const { error: historyError } = await supabaseAdmin
          .from('booking_history')
          .insert({
            booking_id: bookingId,
            action: 'payment_expired',
            performed_by: 'system',
            performed_by_type: 'system',
            details: {
              reason: 'Payment deadline exceeded',
              deadline: booking.payment_deadline,
              exceeded_by: currentTime.getTime() - deadline.getTime()
            },
            description: 'Booking payment deadline exceeded',
            created_at: currentTime.toISOString()
          });

        if (historyError) {
          console.error('Error adding to booking history:', historyError);
        }

        // Send notification to driver
        const { error: driverNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'payment_expired',
            recipient_id: booking.driver_id,
            recipient_type: 'driver',
            title: 'Payment Deadline Expired',
            message: 'Your payment deadline has expired. Please contact support to resolve this issue.',
            data: {
              booking_id: bookingId
            },
            created_at: currentTime.toISOString(),
            priority: 'high'
          });

        if (driverNotificationError) {
          console.error('Error creating driver notification:', driverNotificationError);
        } else {
          results.notifications_sent.push('driver_payment_expired');
        }
      }

      results.checks_performed.push('payment_deadline');
    }

    // Check insurance upload deadline
    if (booking.status === 'pending_insurance_upload' && booking.insurance_upload_deadline) {
      const deadline = new Date(booking.insurance_upload_deadline);
      
      if (currentTime > deadline) {
        // Insurance upload deadline exceeded
        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'insurance_expired',
            insurance_expired_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking for insurance expiry:', updateError);
        } else {
          results.actions_taken.push('insurance_expired');
        }

        // Add to booking history
        const { error: historyError } = await supabaseAdmin
          .from('booking_history')
          .insert({
            booking_id: bookingId,
            action: 'insurance_expired',
            performed_by: 'system',
            performed_by_type: 'system',
            details: {
              reason: 'Insurance upload deadline exceeded',
              deadline: booking.insurance_upload_deadline,
              exceeded_by: currentTime.getTime() - deadline.getTime()
            },
            description: 'Insurance upload deadline exceeded',
            created_at: currentTime.toISOString()
          });

        if (historyError) {
          console.error('Error adding to booking history:', historyError);
        }

        // Send notification to driver
        const { error: driverNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'insurance_expired',
            recipient_id: booking.driver_id,
            recipient_type: 'driver',
            title: 'Insurance Upload Deadline Expired',
            message: 'Your insurance upload deadline has expired. Please contact support to resolve this issue.',
            data: {
              booking_id: bookingId
            },
            created_at: currentTime.toISOString(),
            priority: 'high'
          });

        if (driverNotificationError) {
          console.error('Error creating driver notification:', driverNotificationError);
        } else {
          results.notifications_sent.push('driver_insurance_expired');
        }
      }

      results.checks_performed.push('insurance_upload_deadline');
    }

    // Check booking end date
    if (booking.status === 'active' && booking.end_date) {
      const endDate = new Date(booking.end_date);
      
      if (currentTime > endDate) {
        // Booking end date exceeded
        const { error: updateError } = await supabaseAdmin
          .from('bookings')
          .update({
            status: 'overdue',
            overdue_at: currentTime.toISOString(),
            updated_at: currentTime.toISOString()
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Error updating booking for overdue status:', updateError);
        } else {
          results.actions_taken.push('booking_overdue');
        }

        // Add to booking history
        const { error: historyError } = await supabaseAdmin
          .from('booking_history')
          .insert({
            booking_id: bookingId,
            action: 'booking_overdue',
            performed_by: 'system',
            performed_by_type: 'system',
            details: {
              reason: 'Booking end date exceeded',
              end_date: booking.end_date,
              exceeded_by: currentTime.getTime() - endDate.getTime()
            },
            description: 'Booking has exceeded its end date',
            created_at: currentTime.toISOString()
          });

        if (historyError) {
          console.error('Error adding to booking history:', historyError);
        }

        // Send notifications
        const { error: driverNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'booking_overdue',
            recipient_id: booking.driver_id,
            recipient_type: 'driver',
            title: 'Booking Overdue',
            message: 'Your booking has exceeded its end date. Please contact your partner to arrange vehicle return.',
            data: {
              booking_id: bookingId
            },
            created_at: currentTime.toISOString(),
            priority: 'high'
          });

        if (driverNotificationError) {
          console.error('Error creating driver notification:', driverNotificationError);
        } else {
          results.notifications_sent.push('driver_overdue');
        }

        const { error: partnerNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'booking_overdue',
            recipient_id: booking.partner_id,
            recipient_type: 'partner',
            title: 'Booking Overdue',
            message: `Booking ${bookingId} has exceeded its end date. Please contact the driver to arrange vehicle return.`,
            data: {
              booking_id: bookingId
            },
            created_at: currentTime.toISOString(),
            priority: 'medium'
          });

        if (partnerNotificationError) {
          console.error('Error creating partner notification:', partnerNotificationError);
        } else {
          results.notifications_sent.push('partner_overdue');
        }
      }

      results.checks_performed.push('booking_end_date');
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('Error checking deadlines:', error);
    return NextResponse.json({ error: 'Failed to check deadlines' }, { status: 500 });
  }
}
