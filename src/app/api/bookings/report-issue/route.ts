import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, issueType, description, severity, reportedBy, reportedByType, images = [] } = await req.json();

    if (!bookingId || !issueType || !description || !reportedBy || !reportedByType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['driver', 'partner', 'admin'].includes(reportedByType)) {
      return NextResponse.json({ error: 'Invalid reporter type' }, { status: 400 });
    }

    const validIssueTypes = ['mechanical', 'damage', 'cleanliness', 'documentation', 'other'];
    if (!validIssueTypes.includes(issueType)) {
      return NextResponse.json({ error: 'Invalid issue type' }, { status: 400 });
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json({ error: 'Invalid severity level' }, { status: 400 });
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
    if (reportedByType === 'driver' && bookingData.driver_id !== reportedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }
    if (reportedByType === 'partner' && bookingData.partner_id !== reportedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }

    // Get reporter data for history logging
    const { data: reporterData, error: reporterError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', reportedBy)
      .single();

    const reporterName = reporterData?.company_name || reporterData?.company || reporterData?.full_name || reporterData?.name || reporterData?.email || 'Unknown';

    // Generate issue ID
    const issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create issue object
    const issue = {
      id: issueId,
      type: issueType,
      description: description,
      severity: severity || 'medium',
      status: 'open',
      reported_by: reportedBy,
      reported_by_type: reportedByType,
      reported_by_name: reporterName,
      reported_at: currentTime.toISOString(),
      images: images || [],
      resolved_at: null,
      resolved_by: null,
      resolution_notes: null,
      updates: []
    };

    // Add issue to booking
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        issues: bookingData.issues ? [...bookingData.issues, issue] : [issue],
        updated_at: currentTime.toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with issue:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'issue_reported',
        performed_by: reportedBy,
        performed_by_type: reportedByType,
        details: {
          issue_id: issueId,
          issue_type: issueType,
          severity: severity || 'medium',
          description: description,
          reporter_name: reporterName,
          vehicle_id: bookingData.current_vehicle_id || bookingData.vehicle_id,
          vehicle: `${bookingData.car?.make} ${bookingData.car?.model} (${bookingData.car?.registration_number})`
        },
        description: `${issueType.charAt(0).toUpperCase() + issueType.slice(1)} issue reported by ${reporterName}: ${description}`,
        created_at: currentTime.toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Determine notification recipients and priority
    let notificationPriority = 'medium';
    if (severity === 'high' || severity === 'critical') {
      notificationPriority = 'high';
    }

    // Send notification to partner (if not reported by partner)
    if (reportedByType !== 'partner') {
      const { error: partnerNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'issue_reported',
          recipient_id: bookingData.partner_id,
          recipient_type: 'partner',
          title: `${severity?.toUpperCase() || 'MEDIUM'} Issue Reported`,
          message: `${reporterName} reported a ${issueType} issue: ${description}`,
          data: {
            booking_id: bookingId,
            issue_id: issueId
          },
          created_at: currentTime.toISOString(),
          priority: notificationPriority
        });

      if (partnerNotificationError) {
        console.error('Error creating partner notification:', partnerNotificationError);
      }
    }

    // Send notification to driver (if not reported by driver)
    if (reportedByType !== 'driver') {
      const { error: driverNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'issue_reported_driver',
          recipient_id: bookingData.driver_id,
          recipient_type: 'driver',
          title: 'Issue Reported',
          message: `An issue has been reported for your booking: ${description}`,
          data: {
            booking_id: bookingId,
            issue_id: issueId
          },
          created_at: currentTime.toISOString(),
          priority: notificationPriority
        });

      if (driverNotificationError) {
        console.error('Error creating driver notification:', driverNotificationError);
      }
    }

    // Always send notification to admin
    const { error: adminNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'issue_reported_admin',
        title: `${severity?.toUpperCase() || 'MEDIUM'} Issue Reported`,
        message: `${reporterName} (${reportedByType}) reported a ${issueType} issue for booking ${bookingId}: ${description}`,
        data: {
          booking_id: bookingId,
          issue_id: issueId,
          reporter_name: reporterName,
          reporter_type: reportedByType
        },
        created_at: currentTime.toISOString(),
        priority: notificationPriority
      });

    if (adminNotificationError) {
      console.error('Error creating admin notification:', adminNotificationError);
    }

    // If critical issue, also update vehicle status
    if (severity === 'critical') {
      const vehicleId = bookingData.current_vehicle_id || bookingData.vehicle_id;
      if (vehicleId) {
        const { error: vehicleUpdateError } = await supabaseAdmin
          .from('vehicles')
          .update({
            status: 'maintenance_required',
            updated_at: currentTime.toISOString()
          })
          .eq('id', vehicleId);

        if (vehicleUpdateError) {
          console.error('Error updating vehicle status:', vehicleUpdateError);
        }
      }

      // Add additional critical issue notification
      const { error: criticalNotificationError } = await supabaseAdmin
        .from('notifications')
        .insert({
          type: 'critical_issue_alert',
          title: 'CRITICAL ISSUE ALERT',
          message: `URGENT: Critical issue reported for vehicle ${bookingData.car?.make} ${bookingData.car?.model} (${bookingData.car?.registration_number}). Immediate attention required.`,
          data: {
            booking_id: bookingId,
            issue_id: issueId,
            vehicle_id: bookingData.current_vehicle_id || bookingData.vehicle_id
          },
          created_at: currentTime.toISOString(),
          priority: 'critical'
        });

      if (criticalNotificationError) {
        console.error('Error creating critical issue notification:', criticalNotificationError);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Issue reported successfully',
      issue_id: issueId,
      issue: {
        id: issueId,
        type: issueType,
        severity: severity || 'medium',
        status: 'open',
        reported_at: currentTime.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Issue reporting error:', error);
    return NextResponse.json({ error: 'Failed to report issue' }, { status: 500 });
  }
} 