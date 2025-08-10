import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/bookings/start-active
 * Body: { bookingId: string; partnerId: string }
 *
 * Transitions a booking from partner_accepted to active status when ready for vehicle collection.
 * This can be triggered manually by partner or automatically when all conditions are met.
 */
export async function POST(req: NextRequest) {
  try {
    const { bookingId, partnerId, triggeredBy = 'partner', bypassRequirements = false } = await req.json();

    if (!bookingId || !partnerId) {
      return NextResponse.json({ error: 'Missing bookingId or partnerId' }, { status: 400 });
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

    if (bookingData.partner_id !== partnerId) {
      return NextResponse.json({ error: 'Not authorized to activate this booking' }, { status: 403 });
    }

    // Check if booking is in correct status for activation
    const validStatuses = ['partner_accepted', 'pending_insurance_upload', 'confirmed'];
    if (!validStatuses.includes(bookingData.status)) {
      return NextResponse.json({ 
        error: `Cannot activate booking with status: ${bookingData.status}` 
      }, { status: 400 });
    }

    // Check if booking is already active
    if (bookingData.status === 'active') {
      return NextResponse.json({ status: 'already_active' });
    }

    // Verify all requirements are met unless bypassRequirements is true
    if (!bypassRequirements) {
      const requirements = [];
      // Check payment status
      if (!['completed', 'paid', 'confirmed', 'active'].includes(bookingData.payment_status)) {
        requirements.push('Payment must be confirmed');
      }
      // Check insurance requirements
      if (bookingData.insurance_required && !bookingData.driver_insurance_valid && !bookingData.partner_provides_insurance) {
        requirements.push('Valid insurance certificate required');
      }
      // Check if any critical documents are pending (if document verification is required)
      if (bookingData.requires_document_verification && !bookingData.all_documents_approved) {
        requirements.push('Document verification must be completed');
      }
      if (requirements.length > 0) {
        return NextResponse.json({ 
          error: 'Cannot activate booking. Requirements not met',
          requirements
        }, { status: 400 });
      }
    }

    const activatedAt = new Date();

    // Update booking to active status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'active',
        activated_at: activatedAt.toISOString(),
        activated_by: partnerId,
        activated_by_type: 'partner',
        activated_trigger: triggeredBy,
        updated_at: activatedAt.toISOString()
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
        action: 'booking_activated',
        performed_by: partnerId,
        performed_by_type: 'partner',
        details: {
          triggered_by: triggeredBy,
          activated_at: activatedAt.toISOString(),
          ready_for_collection: true,
          bypass_requirements: bypassRequirements
        },
        description: bypassRequirements ? 'Booking force activated by partner (requirements bypassed).' : 'Booking activated by partner. Vehicle ready for collection.',
        created_at: activatedAt.toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Update vehicle status to reflect active booking
    const vehicleId = bookingData.car_id || bookingData.current_vehicle_id || bookingData.vehicle_id;
    if (vehicleId) {
      const { error: vehicleUpdateError } = await supabaseAdmin
        .from('vehicles')
        .update({
          status: 'booked',
          current_booking_id: bookingId,
          active_booking_started: activatedAt.toISOString(),
          updated_at: activatedAt.toISOString()
        })
        .eq('id', vehicleId);

      if (vehicleUpdateError) {
        console.error('Error updating vehicle status:', vehicleUpdateError);
      }
    }

    // Notify driver that booking is now active
    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_activated',
        recipient_id: bookingData.driver_id,
        recipient_type: 'driver',
        title: 'Booking Now Active - Ready for Collection!',
        message: `Your booking is now active! Please contact your partner to arrange vehicle collection. Make sure to complete the handover inspection.`,
        data: {
          booking_id: bookingId
        },
        created_at: activatedAt.toISOString(),
        priority: 'high'
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    // Notify admin of activation
    const { error: adminNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_activated_admin',
        title: 'Booking Activated',
        message: `Booking ${bookingId} has been activated by partner. Vehicle collection phase started.`,
        data: {
          booking_id: bookingId,
          partner_id: partnerId
        },
        created_at: activatedAt.toISOString(),
        priority: 'low'
      });

    if (adminNotificationError) {
      console.error('Error creating admin notification:', adminNotificationError);
    }

    return NextResponse.json({ 
      success: true,
      status: 'active',
      message: 'Booking activated successfully',
      activated_at: activatedAt.toISOString()
    });

  } catch (error: any) {
    console.error('Error activating booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/bookings/start-active?bookingId=xxx
 * 
 * Check if a booking is ready to be activated
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 });
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

    // Check readiness
    const readiness = {
      can_activate: false,
      current_status: bookingData.status,
      requirements: [] as string[],
      checks: {
        valid_status: ['partner_accepted', 'pending_insurance_upload', 'confirmed'].includes(bookingData.status),
        payment_confirmed: ['completed', 'paid', 'confirmed'].includes(bookingData.payment_status),
        insurance_valid: !bookingData.insurance_required || bookingData.driver_insurance_valid || bookingData.partner_provides_insurance,
        documents_approved: !bookingData.requires_document_verification || bookingData.all_documents_approved
      }
    };

    if (!readiness.checks.valid_status) {
      readiness.requirements.push(`Status must be partner_accepted, pending_insurance_upload, or confirmed (current: ${bookingData.status})`);
    }

    if (!readiness.checks.payment_confirmed) {
      readiness.requirements.push(`Payment must be confirmed (current: ${bookingData.payment_status})`);
    }

    if (!readiness.checks.insurance_valid) {
      readiness.requirements.push('Valid insurance certificate required');
    }

    if (!readiness.checks.documents_approved) {
      readiness.requirements.push('Document verification must be completed');
    }

    readiness.can_activate = readiness.requirements.length === 0;

    return NextResponse.json(readiness);

  } catch (error: any) {
    console.error('Error checking booking activation readiness:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
} 