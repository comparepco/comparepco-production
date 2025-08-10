import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, releasedBy, releasedByType, reason } = await req.json();

    if (!bookingId || !releasedBy || !releasedByType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['driver', 'partner', 'admin'].includes(releasedByType)) {
      return NextResponse.json({ error: 'Invalid releasedByType' }, { status: 400 });
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

    // Verify authorization
    if (releasedByType === 'driver' && booking.driver_id !== releasedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }
    if (releasedByType === 'partner' && booking.partner_id !== releasedBy) {
      return NextResponse.json({ error: 'Unauthorized - not your booking' }, { status: 403 });
    }

    // Check if booking can have vehicle released
    const validStatuses = ['active', 'in_progress', 'partner_accepted', 'pending_insurance_upload'];
    if (!validStatuses.includes(booking.status)) {
      return NextResponse.json({ error: `Cannot release vehicle for booking with status: ${booking.status}` }, { status: 400 });
    }

    // Check if vehicle is already released
    if (!booking.current_vehicle_id && !booking.vehicle_id) {
      return NextResponse.json({ error: 'No vehicle assigned to this booking' }, { status: 400 });
    }

    // Get performer data for history logging
    const { data: performerData, error: performerError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', releasedBy)
      .single();

    const performerName = performerData?.company_name || performerData?.company || performerData?.full_name || performerData?.name || performerData?.email || 'Unknown';

    // Get vehicle details
    const vehicleId = booking.current_vehicle_id || booking.vehicle_id;
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      console.error('Error fetching vehicle:', vehicleError);
    }

    // Update booking to remove vehicle
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        current_vehicle_id: null,
        vehicle_id: null,
        car: null,
        car_name: null,
        car_image: null,
        car_plate: null,
        vehicle_released_at: currentTime.toISOString(),
        vehicle_released_by: releasedBy,
        vehicle_released_by_type: releasedByType,
        vehicle_release_reason: reason || 'No reason provided',
        updated_at: currentTime.toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Update vehicle status back to available
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

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'vehicle_released',
        performed_by: releasedBy,
        performed_by_type: releasedByType,
        details: {
          performer_name: performerName,
          vehicle_id: vehicleId,
          vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
          vehicle_registration: vehicle?.registration_number || 'Unknown',
          reason: reason || 'No reason provided'
        },
        description: `Vehicle released by ${performerName}${reason ? `: ${reason}` : ''}`,
        created_at: currentTime.toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Send notifications
    // Notify driver
    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'vehicle_released',
        recipient_id: booking.driver_id,
        recipient_type: 'driver',
        title: 'Vehicle Released',
        message: `The vehicle for your booking has been released${reason ? `. Reason: ${reason}` : ''}.`,
        data: {
          booking_id: bookingId,
          vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
          reason: reason
        },
        created_at: currentTime.toISOString(),
        priority: 'medium'
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    // Notify partner
    const { error: partnerNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'vehicle_released',
        recipient_id: booking.partner_id,
        recipient_type: 'partner',
        title: 'Vehicle Released',
        message: `Vehicle has been released from booking ${bookingId} by ${performerName}${reason ? `. Reason: ${reason}` : ''}`,
        data: {
          booking_id: bookingId,
          vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
          reason: reason,
          performer_name: performerName
        },
        created_at: currentTime.toISOString(),
        priority: 'medium'
      });

    if (partnerNotificationError) {
      console.error('Error creating partner notification:', partnerNotificationError);
    }

    // Notify admin
    const { error: adminNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'vehicle_released_admin',
        title: 'Vehicle Released',
        message: `Vehicle has been released from booking ${bookingId} by ${performerName} (${releasedByType})${reason ? `. Reason: ${reason}` : ''}`,
        data: {
          booking_id: bookingId,
          vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown',
          reason: reason,
          performer_name: performerName,
          performer_type: releasedByType
        },
        created_at: currentTime.toISOString(),
        priority: 'low'
      });

    if (adminNotificationError) {
      console.error('Error creating admin notification:', adminNotificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle released successfully',
      vehicle: vehicle ? {
        id: vehicleId,
        make: vehicle.make,
        model: vehicle.model,
        registration_number: vehicle.registration_number
      } : null
    });

  } catch (error: any) {
    console.error('Error releasing vehicle:', error);
    return NextResponse.json({ error: 'Failed to release vehicle' }, { status: 500 });
  }
}
