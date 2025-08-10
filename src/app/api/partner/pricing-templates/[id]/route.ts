import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, make, model, dailyRate, weeklyRate, monthlyRate, rideHailingCategories } = body;

    // Validation
    if (!name || !category || !dailyRate) {
      return NextResponse.json({ error: 'Name, category, and daily rate are required' }, { status: 400 });
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

    // Update pricing template
    const { data: template, error } = await supabaseAdmin
      .from('pricing_templates')
      .update({
        name,
        category,
        make: make || null,
        model: model || null,
        daily_rate: dailyRate,
        weekly_rate: weeklyRate || null,
        monthly_rate: monthlyRate || null,
        ride_hailing_categories: rideHailingCategories || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('partner_id', partner.id) // Ensure partner owns this template
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing template:', error);
      return NextResponse.json({ error: 'Failed to update pricing template' }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Pricing template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating pricing template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete pricing template
    const { error } = await supabaseAdmin
      .from('pricing_templates')
      .delete()
      .eq('id', params.id)
      .eq('partner_id', partner.id); // Ensure partner owns this template

    if (error) {
      console.error('Error deleting pricing template:', error);
      return NextResponse.json({ error: 'Failed to delete pricing template' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 