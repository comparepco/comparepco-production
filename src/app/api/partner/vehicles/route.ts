import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const partnerId = searchParams.get('partnerId');

    if (!userId && !partnerId) {
      return NextResponse.json({ error: 'User ID or Partner ID is required' }, { status: 400 });
    }

    let actualPartnerId = partnerId;

    // If userId is provided, get the partner ID
    if (!partnerId && userId) {
      // First try to get from partner_staff table
      const { data: staffData, error: staffError } = await supabaseAdmin
        .from('partner_staff')
        .select('partner_id')
        .eq('user_id', userId)
        .single();

      if (!staffError && staffData) {
        actualPartnerId = staffData.partner_id;
      } else {
        // Try to get from partners table
        const { data: partnerData, error: partnerError } = await supabaseAdmin
          .from('partners')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!partnerError && partnerData) {
          actualPartnerId = partnerData.id;
        }
      }
    }

    if (!actualPartnerId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Get vehicles for this partner
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        id,
        name,
        make,
        model,
        year,
        license_plate,
        registration_number,
        color,
        seats,
        fuel_type,
        transmission,
        category,
        daily_rate,
        weekly_rate,
        monthly_rate,
        price_per_day,
        price_per_week,
        ride_hailing_categories,
        is_active,
        is_available,
        status,
        partner_id,
        created_at,
        updated_at
      `)
      .eq('partner_id', actualPartnerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }

    return NextResponse.json({ 
      vehicles: vehicles || [],
      count: vehicles?.length || 0
    });

  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/vehicles - Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      partnerId,
      name,
      make,
      model,
      year,
      licensePlate,
      registrationNumber,
      color,
      seats,
      fuelType,
      transmission,
      category,
      dailyRate,
      weeklyRate,
      monthlyRate,
      pricePerDay,
      pricePerWeek,
      rideHailingCategories,
      isActive = true,
      isAvailable = true
    } = body;

    if (!partnerId || !name || !make || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: vehicleData, error } = await supabaseAdmin
      .from('vehicles')
      .insert({
        partner_id: partnerId,
        name,
        make,
        model,
        year,
        license_plate: licensePlate,
        registration_number: registrationNumber,
        color,
        seats,
        fuel_type: fuelType,
        transmission,
        category,
        daily_rate: dailyRate,
        weekly_rate: weeklyRate,
        monthly_rate: monthlyRate,
        price_per_day: pricePerDay,
        price_per_week: pricePerWeek,
        ride_hailing_categories: rideHailingCategories,
        is_active: isActive,
        is_available: isAvailable,
        status: isAvailable ? 'available' : 'unavailable',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      vehicle: vehicleData,
      message: 'Vehicle created successfully'
    });

  } catch (error) {
    console.error('Vehicle POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/vehicles - Update vehicle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicleId, updates } = body;

    if (!vehicleId || !updates) {
      return NextResponse.json({ error: 'Vehicle ID and updates are required' }, { status: 400 });
    }

    const { data: vehicleData, error } = await supabaseAdmin
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      vehicle: vehicleData,
      message: 'Vehicle updated successfully'
    });

  } catch (error) {
    console.error('Vehicle PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/vehicles?vehicleId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (error) {
      console.error('Error deleting vehicle:', error);
      return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Vehicle DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 