import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const {
      driverId,
      partnerId,
      vehicleId,
      startDate,
      endDate,
      weeklyRate,
      depositAmount = 0,
      insuranceRequired = false,
      partnerProvidesInsurance = false,
      requiresDocumentVerification = false,
      paymentMethod = 'bank_transfer',
      stripeCustomerId = null,
      stripeSubscriptionId = null
    } = await req.json();

    if (!driverId || !partnerId || !vehicleId || !startDate || !endDate || !weeklyRate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return NextResponse.json({ error: 'Start date cannot be in the past' }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    // Get vehicle details
    const { data: vehicle, error: vehicleError } = await supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Check vehicle availability
    if (vehicle.status !== 'available') {
      return NextResponse.json({ error: 'Vehicle is not available' }, { status: 400 });
    }

    // Get driver details
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get partner details
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Calculate total amount
    const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalAmount = totalWeeks * weeklyRate + depositAmount;

    // Generate booking ID
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        id: bookingId,
        driver_id: driverId,
        partner_id: partnerId,
        vehicle_id: vehicleId,
        current_vehicle_id: vehicleId,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        weekly_rate: weeklyRate,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        insurance_required: insuranceRequired,
        partner_provides_insurance: partnerProvidesInsurance,
        requires_document_verification: requiresDocumentVerification,
        payment_method: paymentMethod,
        status: 'pending_payment',
        payment_status: 'pending',
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        car: {
          id: vehicleId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          registration_number: vehicle.registration_number,
          color: vehicle.color,
          fuel_type: vehicle.fuel_type,
          transmission: vehicle.transmission,
          seats: vehicle.seats,
          mileage: vehicle.mileage,
          image: vehicle.image_url || (vehicle.image_urls && vehicle.image_urls[0]) || '',
          price_per_week: vehicle.price_per_week
        },
        car_name: `${vehicle.make} ${vehicle.model}`,
        car_image: vehicle.image_url || (vehicle.image_urls && vehicle.image_urls[0]) || '',
        car_plate: vehicle.registration_number,
        driver: {
          id: driverId,
          full_name: driver.full_name || driver.name || driver.email,
          email: driver.email,
          phone: driver.phone
        },
        partner: {
          id: partnerId,
          full_name: partner.full_name || partner.name || partner.email,
          email: partner.email,
          company_name: partner.company_name || partner.company
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Update vehicle status
    const { error: vehicleUpdateError } = await supabaseAdmin
      .from('vehicles')
      .update({
        status: 'booked',
        current_booking_id: bookingId,
        updated_at: now.toISOString()
      })
      .eq('id', vehicleId);

    if (vehicleUpdateError) {
      console.error('Error updating vehicle status:', vehicleUpdateError);
    }

    // Create payment instruction if deposit is required
    if (depositAmount > 0) {
      const { error: depositInstructionError } = await supabaseAdmin
        .from('payment_instructions')
        .insert({
          booking_id: bookingId,
          driver_id: driverId,
          partner_id: partnerId,
          vehicle_reg: vehicle.registration_number,
          amount: depositAmount,
          type: 'deposit',
          method: paymentMethod,
          status: 'pending',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        });

      if (depositInstructionError) {
        console.error('Error creating deposit instruction:', depositInstructionError);
      }
    }

    // Create weekly payment instruction
    const { error: weeklyInstructionError } = await supabaseAdmin
      .from('payment_instructions')
      .insert({
        booking_id: bookingId,
        driver_id: driverId,
        partner_id: partnerId,
        vehicle_reg: vehicle.registration_number,
        amount: weeklyRate,
        type: 'weekly_rent',
        method: paymentMethod,
        frequency: 'weekly',
        status: 'pending',
        next_due_date: start.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });

    if (weeklyInstructionError) {
      console.error('Error creating weekly instruction:', weeklyInstructionError);
    }

    // Add to booking history
    const { error: historyError } = await supabaseAdmin
      .from('booking_history')
      .insert({
        booking_id: bookingId,
        action: 'booking_created',
        performed_by: driverId,
        performed_by_type: 'driver',
        details: {
          vehicle_id: vehicleId,
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          weekly_rate: weeklyRate,
          total_amount: totalAmount,
          deposit_amount: depositAmount
        },
        description: `Booking created for ${vehicle.make} ${vehicle.model} (${vehicle.registration_number})`,
        created_at: now.toISOString()
      });

    if (historyError) {
      console.error('Error adding to booking history:', historyError);
    }

    // Send notification to partner
    const { error: partnerNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'new_booking',
        recipient_id: partnerId,
        recipient_type: 'partner',
        title: 'New Booking Request',
        message: `New booking request from ${driver.full_name || driver.email} for ${vehicle.make} ${vehicle.model}`,
        data: {
          booking_id: bookingId,
          driver_name: driver.full_name || driver.email,
          vehicle: `${vehicle.make} ${vehicle.model}`
        },
        created_at: now.toISOString(),
        priority: 'high'
      });

    if (partnerNotificationError) {
      console.error('Error creating partner notification:', partnerNotificationError);
    }

    // Send notification to driver
    const { error: driverNotificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        type: 'booking_created',
        recipient_id: driverId,
        recipient_type: 'driver',
        title: 'Booking Created',
        message: `Your booking for ${vehicle.make} ${vehicle.model} has been created. Please complete payment to proceed.`,
        data: {
          booking_id: bookingId,
          vehicle: `${vehicle.make} ${vehicle.model}`
        },
        created_at: now.toISOString(),
        priority: 'medium'
      });

    if (driverNotificationError) {
      console.error('Error creating driver notification:', driverNotificationError);
    }

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      booking: {
        id: bookingId,
        status: 'pending_payment',
        total_amount: totalAmount,
        weekly_rate: weeklyRate,
        deposit_amount: depositAmount,
        vehicle: {
          id: vehicleId,
          make: vehicle.make,
          model: vehicle.model,
          registration_number: vehicle.registration_number
        }
      }
    });

  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
