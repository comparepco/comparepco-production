import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/partner/pricing-templates?userId=xxx
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

    // Get pricing templates for this partner
    const { data: templates, error } = await supabaseAdmin
      .from('pricing_templates')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pricing templates:', error);
      return NextResponse.json({ error: 'Failed to fetch pricing templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    console.error('Error fetching pricing templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/pricing-templates - Create new pricing template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      partnerId,
      name,
      description,
      dailyRate,
      weeklyRate,
      monthlyRate,
      isActive = true,
      conditions = {}
    } = body;

    if (!partnerId || !name || !dailyRate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: templateData, error } = await supabaseAdmin
      .from('pricing_templates')
      .insert({
        partner_id: partnerId,
        name,
        description,
        daily_rate: dailyRate,
        weekly_rate: weeklyRate,
        monthly_rate: monthlyRate,
        is_active: isActive,
        conditions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing template:', error);
      return NextResponse.json({ error: 'Failed to create pricing template' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      template: templateData,
      message: 'Pricing template created successfully'
    });

  } catch (error) {
    console.error('Pricing template POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/pricing-templates/[id] - Update pricing template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, updates } = body;

    if (!templateId || !updates) {
      return NextResponse.json({ error: 'Template ID and updates are required' }, { status: 400 });
    }

    const { data: templateData, error } = await supabaseAdmin
      .from('pricing_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing template:', error);
      return NextResponse.json({ error: 'Failed to update pricing template' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      template: templateData,
      message: 'Pricing template updated successfully'
    });

  } catch (error) {
    console.error('Pricing template PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/pricing-templates/[id] - Delete pricing template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('pricing_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting pricing template:', error);
      return NextResponse.json({ error: 'Failed to delete pricing template' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Pricing template deleted successfully'
    });

  } catch (error) {
    console.error('Pricing template DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 