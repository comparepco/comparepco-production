import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// PUT /api/partner/vehicles/bulk-update-pricing - Update pricing for multiple vehicles
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const body = await request.json();
    const { 
      vehicleIds, 
      dailyRate, 
      weeklyRate, 
      monthlyRate, 
      pricePerDay, 
      pricePerWeek 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!vehicleIds || !Array.isArray(vehicleIds)) {
      return NextResponse.json({ error: 'Vehicle IDs array is required' }, { status: 400 });
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

    // Update pricing for multiple vehicles
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .update({
        daily_rate: dailyRate,
        weekly_rate: weeklyRate,
        monthly_rate: monthlyRate,
        price_per_day: pricePerDay,
        price_per_week: pricePerWeek,
        updated_at: new Date().toISOString()
      })
      .in('id', vehicleIds)
      .eq('partner_id', partner.id)
      .select();

    if (error) {
      console.error('Error updating vehicle pricing:', error);
      return NextResponse.json({ error: 'Failed to update vehicle pricing' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      vehicles: vehicles || [],
      message: `${vehicles?.length || 0} vehicles pricing updated successfully`
    });
  } catch (error) {
    console.error('Error updating vehicle pricing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 