import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/partner/fleets?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get partner ID from user
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Get fleets for this partner
    const { data: fleets, error } = await supabaseAdmin
      .from('fleets')
      .select(`
        *,
        vehicles:vehicles(
          id,
          name,
          make,
          model,
          license_plate,
          status
        )
      `)
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching fleets:', error);
      return NextResponse.json({ error: 'Failed to fetch fleets' }, { status: 500 });
    }

    return NextResponse.json({ 
      fleets: fleets || [],
      count: fleets?.length || 0
    });
  } catch (error) {
    console.error('Error fetching fleets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/fleets - Create new fleet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      partnerId,
      name,
      description,
      vehicleIds = [],
      isActive = true
    } = body;

    if (!partnerId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: fleetData, error } = await supabaseAdmin
      .from('fleets')
      .insert({
        partner_id: partnerId,
        name,
        description,
        is_active: isActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating fleet:', error);
      return NextResponse.json({ error: 'Failed to create fleet' }, { status: 500 });
    }

    // Add vehicles to fleet if provided
    if (vehicleIds.length > 0) {
      const { error: vehicleError } = await supabaseAdmin
        .from('vehicles')
        .update({ fleet_id: fleetData.id })
        .in('id', vehicleIds)
        .eq('partner_id', partnerId);

      if (vehicleError) {
        console.error('Error adding vehicles to fleet:', vehicleError);
        // Don't fail the request if vehicle assignment fails
      }
    }

    return NextResponse.json({ 
      success: true,
      fleet: fleetData,
      message: 'Fleet created successfully'
    });

  } catch (error) {
    console.error('Fleet POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/fleets - Update fleet
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { fleetId, updates } = body;

    if (!fleetId || !updates) {
      return NextResponse.json({ error: 'Fleet ID and updates are required' }, { status: 400 });
    }

    const { data: fleetData, error } = await supabaseAdmin
      .from('fleets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', fleetId)
      .select()
      .single();

    if (error) {
      console.error('Error updating fleet:', error);
      return NextResponse.json({ error: 'Failed to update fleet' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      fleet: fleetData,
      message: 'Fleet updated successfully'
    });

  } catch (error) {
    console.error('Fleet PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/fleets?fleetId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fleetId = searchParams.get('fleetId');

    if (!fleetId) {
      return NextResponse.json({ error: 'Fleet ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('fleets')
      .delete()
      .eq('id', fleetId);

    if (error) {
      console.error('Error deleting fleet:', error);
      return NextResponse.json({ error: 'Failed to delete fleet' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Fleet deleted successfully'
    });

  } catch (error) {
    console.error('Fleet DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 