import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/partner/vehicles/[id]/pricing - Get vehicle pricing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const vehicleId = params.id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
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

    // Get vehicle pricing
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        id,
        name,
        make,
        model,
        daily_rate,
        weekly_rate,
        monthly_rate,
        price_per_day,
        price_per_week,
        partner_id
      `)
      .eq('id', vehicleId)
      .eq('partner_id', partner.id)
      .single();

    if (error) {
      console.error('Error fetching vehicle pricing:', error);
      return NextResponse.json({ error: 'Failed to fetch vehicle pricing' }, { status: 500 });
    }

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error('Error fetching vehicle pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/vehicles/[id]/pricing - Update vehicle pricing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const vehicleId = params.id;
    const body = await request.json();
    const { 
      dailyRate, 
      weeklyRate, 
      monthlyRate, 
      pricePerDay, 
      pricePerWeek 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!vehicleId) {
      return NextResponse.json({ error: 'Vehicle ID is required' }, { status: 400 });
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

    // Update vehicle pricing
    const { data: vehicle, error } = await supabaseAdmin
      .from('vehicles')
      .update({
        daily_rate: dailyRate,
        weekly_rate: weeklyRate,
        monthly_rate: monthlyRate,
        price_per_day: pricePerDay,
        price_per_week: pricePerWeek,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)
      .eq('partner_id', partner.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle pricing:', error);
      return NextResponse.json({ error: 'Failed to update vehicle pricing' }, { status: 500 });
    }

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      vehicle,
      message: 'Vehicle pricing updated successfully'
    });
  } catch (error) {
    console.error('Error updating vehicle pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 