import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, reason, requestedBy, requestedByType, action = 'request' } = await req.json();

    if (!bookingId || !requestedBy || !requestedByType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['driver', 'partner', 'admin'].includes(requestedByType)) {
      return NextResponse.json({ error: 'Invalid requester type' }, { status: 400 });
    }

    if (!['request', 'approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be request, approve, or reject' }, { status: 400 });
    }

    // Get booking data
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !bookingData) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const currentTime = new Date();

    // Verify authorization
    if (requestedByType === 'driver' && bookingData.driver_id !== requestedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }
    if (requestedByType === 'partner' && bookingData.partner_id !== requestedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }

    // Get requester data for history logging
    const { data: requesterData, error: requesterError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', requestedBy)
      .single();

    const requesterName = requesterData?.company_name || requesterData?.company || requesterData?.full_name || requesterData?.name || requesterData?.email || 'Unknown';

    const updateData: any = {
      updated_at: currentTime.toISOString()
    };
    let historyEntry: any;
    let notificationTitle: string = '';
    let notificationMessage: string = '';
    let newStatus: string | null = null;

    if (action === 'request') {
      // Check if booking is in a valid state for return request
      const validStatuses = ['partner_accepted', 'active', 'in_progress'];
      if (!validStatuses.includes(bookingData.status)) {
        return NextResponse.json({ 
          error: `Cannot request return. Booking status: ${bookingData.status}` 
        }, { status: 400 });
      }

      // Check if return is already requested
      if (bookingData.return_requested) {
        return NextResponse.json({ error: 'Return already requested' }, { status: 400 });
      }

      updateData.return_requested = true;
      updateData.return_requested_at = currentTime.toISOString();
      updateData.return_requested_by = requestedBy;
      updateData.return_requested_by_type = requestedByType;
      updateData.return_reason = reason || 'No reason provided';

      historyEntry = {
        booking_id: bookingId,
        action: 'return_requested',
        performed_by: requestedBy,
        performed_by_type: requestedByType,
        details: {
          reason: reason || 'No reason provided',
          requester_name: requesterName
        },
        description: `Return requested by ${requesterName}${reason ? `: ${reason}` : ''}`,
        created_at: currentTime.toISOString()
      };

      notificationTitle = 'Return Requested';
      notificationMessage = `${requesterName} has requested to return the vehicle${reason ? `. Reason: ${reason}` : ''}`;

    } else if (action === 'approve') {
      // Check if return was requested
      if (!bookingData.return_requested) {
        return NextResponse.json({ error: 'No return request to approve' }, { status: 400 });
      }

      // Check if already approved
      if (bookingData.return_approved) {
        return NextResponse.json({ error: 'Return already approved' }, { status: 400 });
      }

      newStatus = 'completed';
      updateData.status = newStatus;
      updateData.return_approved = true;
      updateData.return_approved_at = currentTime.toISOString();
      updateData.return_approved_by = requestedBy;
      updateData.return_approved_by_type = requestedByType;
      updateData.completed_at = currentTime.toISOString();

      // Update vehicle status back to available
      const vehicleId = bookingData.current_vehicle_id || bookingData.vehicle_id;
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

      historyEntry = {
        booking_id: bookingId,
        action: 'return_approved',
        performed_by: requestedBy,
        performed_by_type: requestedByType,
        details: {
          approver_name: requesterName,
          original_return_reason: bookingData.return_reason || 'No reason provided'
        },
        description: `Return approved by ${requesterName}. Booking completed.`,
        created_at: currentTime.toISOString()
      };

      notificationTitle = 'Return Approved';
      notificationMessage = `Your return request has been approved by ${requesterName}. The booking is now complete.`;

    } else if (action === 'reject') {
      // Check if return was requested
      if (!bookingData.return_requested) {
        return NextResponse.json({ error: 'No return request to reject' }, { status: 400 });
      }

      // Check if already processed
      if (bookingData.return_approved) {
        return NextResponse.json({ error: 'Return already approved, cannot reject' }, { status: 400 });
      }

      updateData.return_requested = false;
      updateData.return_rejected_at = currentTime.toISOString();
      updateData.return_rejected_by = requestedBy;
      updateData.return_rejected_by_type = requestedByType;
      updateData.return_rejection_reason = reason || 'No reason provided';

      historyEntry = {
        booking_id: bookingId,
        action: 'return_rejected',
        performed_by: requestedBy,
        performed_by_type: requestedByType,
        details: {
          rejector_name: requesterName,
          rejection_reason: reason || 'No reason provided',
          original_return_reason: bookingData.return_reason || 'No reason provided'
        },
        description: `Return rejected by ${requesterName}${reason ? `: ${reason}` : ''}`,
        created_at: currentTime.toISOString()
      };

      notificationTitle = 'Return Rejected';
      notificationMessage = `Your return request has been rejected by ${requesterName}${reason ? `. Reason: ${reason}` : ''}`;
    }

    // Update the booking
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Add to booking history
    if (historyEntry) {
      const { error: historyError } = await supabaseAdmin
        .from('booking_history')
        .insert(historyEntry);

      if (historyError) {
        console.error('Error adding to booking history:', historyError);
      }
    }

    // Send appropriate notifications
    if (action === 'request') {
      // Notify partner (if request came from driver) or driver (if request came from partner)
      const recipientId = requestedByType === 'driver' ? bookingData.partner_id : bookingData.driver_id;
      const recipientType = requestedByType === 'driver' ? 'partner' : 'driver';
      const actionUrl = recipientType === 'partner' ? `/partner/bookings/${bookingId}` : `/bookings/${bookingId}`;

      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'return_requested',
          recipient_id: recipientId,
          recipient_type: recipientType,
          title: notificationTitle,
          message: notificationMessage,
          data: {
            booking_id: bookingId
          },
          created_at: currentTime.toISOString(),
          priority: 'high'
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // Notify admin
      const { error: adminNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'return_requested_admin',
          title: 'Return Requested',
          message: `Return requested for booking ${bookingId} by ${requesterName} (${requestedByType})`,
          data: {
            booking_id: bookingId,
            requester_name: requesterName,
            requester_type: requestedByType
          },
          created_at: currentTime.toISOString(),
          priority: 'medium'
        });

      if (adminNotificationError) {
        console.error('Error creating admin notification:', adminNotificationError);
      }

      // Enhanced admin notification for return requests
      const { error: enhancedAdminError } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
          type: 'warning',
          priority: 'high',
          task_type: 'return_requested',
          task_id: bookingId,
          title: '🔄 Vehicle Return Requested - Action Required',
          message: `${requestedByType.toUpperCase()} ${requesterName} requested vehicle return for booking ${bookingId}. Reason: ${reason || 'No reason provided'}. ${requestedByType === 'driver' ? 'Partner must respond within 24 hours' : 'Driver will be notified'}.`,
          data: {
            booking_id: bookingId,
            requested_by: requesterData?.id,
            requested_by_type: requestedByType,
            requester_name: requesterName,
            return_reason: reason || 'No reason provided',
            urgency: 'high',
            requires_partner_response: requestedByType === 'driver'
          },
          target_roles: ['admin', 'super_admin', 'bookings', 'operations', 'support'],
          requires_action: true,
          created_at: currentTime.toISOString(),
          read_by: [],
          is_completed: false
        });

      if (enhancedAdminError) {
        console.error('Error creating enhanced admin notification:', enhancedAdminError);
      }

    } else if (action === 'approve') {
      // Notify driver if approved by partner/admin
      if (requestedByType !== 'driver') {
        const { error: driverNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'return_approved',
            recipient_id: bookingData.driver_id,
            recipient_type: 'driver',
            title: notificationTitle,
            message: notificationMessage,
            data: {
              booking_id: bookingId
            },
            created_at: currentTime.toISOString(),
            priority: 'high'
          });

        if (driverNotificationError) {
          console.error('Error creating driver notification:', driverNotificationError);
        }
      }

      // Notify partner if approved by admin
      if (requestedByType === 'admin') {
        const { error: partnerNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'return_approved_partner',
            recipient_id: bookingData.partner_id,
            recipient_type: 'partner',
            title: 'Return Approved by Admin',
            message: `Admin has approved the return for booking ${bookingId}`,
            data: {
              booking_id: bookingId
            },
            created_at: currentTime.toISOString(),
            priority: 'medium'
          });

        if (partnerNotificationError) {
          console.error('Error creating partner notification:', partnerNotificationError);
        }
      }

      // Notify admin if approved by partner
      if (requestedByType === 'partner') {
        const { error: adminNotificationError } = await supabaseAdmin
          .from('notifications')
          .insert({
            type: 'return_approved_admin',
            title: 'Return Approved',
            message: `Partner ${requesterName} approved return for booking ${bookingId}`,
            data: {
              booking_id: bookingId,
              approver_name: requesterName
            },
            created_at: currentTime.toISOString(),
            priority: 'low'
          });

        if (adminNotificationError) {
          console.error('Error creating admin notification:', adminNotificationError);
        }
      }

      // Enhanced admin notification for return approval
      const { error: enhancedAdminError } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
          type: 'success',
          priority: 'medium',
          task_type: 'return_approved',
          task_id: bookingId,
          title: '✅ Vehicle Return Approved',
          message: `Return approved for booking ${bookingId} by ${requestedByType} ${requesterName}. Vehicle handover process can begin. Ensure proper return documentation.`,
          data: {
            booking_id: bookingId,
            approved_by: requesterData?.id,
            approved_by_type: requestedByType,
            approver_name: requesterName,
            return_reason: reason || 'No reason provided',
            approval_timestamp: currentTime.toISOString()
          },
          target_roles: ['admin', 'super_admin', 'bookings', 'operations'],
          requires_action: false,
          created_at: currentTime.toISOString(),
          read_by: [],
          is_completed: false
        });

      if (enhancedAdminError) {
        console.error('Error creating enhanced admin notification:', enhancedAdminError);
      }

    } else if (action === 'reject') {
      // Notify the original requester
      const originalRequesterId = bookingData.return_requested_by;
      const originalRequesterType = bookingData.return_requested_by_type;
      const actionUrl = originalRequesterType === 'partner' ? `/partner/bookings/${bookingId}` : `/bookings/${bookingId}`;

      const { error: requesterNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'return_rejected',
          recipient_id: originalRequesterId,
          recipient_type: originalRequesterType,
          title: notificationTitle,
          message: notificationMessage,
          data: {
            booking_id: bookingId
          },
          created_at: currentTime.toISOString(),
          priority: 'medium'
        });

      if (requesterNotificationError) {
        console.error('Error creating requester notification:', requesterNotificationError);
      }

      // Notify admin
      const { error: adminNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'return_rejected_admin',
          title: 'Return Rejected',
          message: `Return rejected for booking ${bookingId} by ${requesterName} (${requestedByType})`,
          data: {
            booking_id: bookingId,
            rejecter_name: requesterName,
            rejecter_type: requestedByType
          },
          created_at: currentTime.toISOString(),
          priority: 'low'
        });

      if (adminNotificationError) {
        console.error('Error creating admin notification:', adminNotificationError);
      }

      // Enhanced admin notification for return rejection
      const { error: enhancedAdminError } = await supabaseAdmin
        .from('admin_notifications')
        .insert({
          type: 'error',
          priority: 'medium',
          task_type: 'return_rejected',
          task_id: bookingId,
          title: '❌ Vehicle Return Rejected',
          message: `Return request rejected for booking ${bookingId} by ${requestedByType} ${requesterName}. Reason: ${reason || 'No reason provided'}. Original requester may need support.`,
          data: {
            booking_id: bookingId,
            rejected_by: requesterData?.id,
            rejected_by_type: requestedByType,
            rejecter_name: requesterName,
            rejection_reason: reason || 'No reason provided',
            rejection_timestamp: currentTime.toISOString()
          },
          target_roles: ['admin', 'super_admin', 'bookings', 'support'],
          requires_action: false,
          created_at: currentTime.toISOString(),
          read_by: [],
          is_completed: false
        });

      if (enhancedAdminError) {
        console.error('Error creating enhanced admin notification:', enhancedAdminError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Return ${action}${action === 'request' ? 'ed' : 'd'} successfully`,
      status: newStatus || bookingData.status,
      return_status: {
        requested: action === 'request' ? true : bookingData.return_requested,
        approved: action === 'approve' ? true : bookingData.return_approved || false
      }
    });

  } catch (error: any) {
    console.error('Return request error:', error);
    return NextResponse.json({ error: 'Failed to process return request' }, { status: 500 });
  }
} 