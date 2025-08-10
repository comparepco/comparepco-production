import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/partner/marketing/promo-codes?userId=xxx
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

    // Get promo codes for this partner
    const { data: promoCodes, error } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promo codes:', error);
      return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
    }

    return NextResponse.json({ promoCodes: promoCodes || [] });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/marketing/promo-codes - Create new promo code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      partnerId,
      code,
      discountType,
      discountValue,
      minAmount,
      maxDiscount,
      usageLimit,
      validFrom,
      validUntil,
      isActive = true,
      description
    } = body;

    if (!partnerId || !code || !discountType || !discountValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: promoCodeData, error } = await supabaseAdmin
      .from('promo_codes')
      .insert({
        partner_id: partnerId,
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountValue,
        min_amount: minAmount,
        max_discount: maxDiscount,
        usage_limit: usageLimit,
        valid_from: validFrom,
        valid_until: validUntil,
        is_active: isActive,
        description,
        used_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating promo code:', error);
      return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      promoCode: promoCodeData,
      message: 'Promo code created successfully'
    });

  } catch (error) {
    console.error('Promo code POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/marketing/promo-codes/[id] - Update promo code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { promoCodeId, updates } = body;

    if (!promoCodeId || !updates) {
      return NextResponse.json({ error: 'Promo code ID and updates are required' }, { status: 400 });
    }

    const { data: promoCodeData, error } = await supabaseAdmin
      .from('promo_codes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', promoCodeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating promo code:', error);
      return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      promoCode: promoCodeData,
      message: 'Promo code updated successfully'
    });

  } catch (error) {
    console.error('Promo code PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/marketing/promo-codes/[id] - Delete promo code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const promoCodeId = searchParams.get('id');

    if (!promoCodeId) {
      return NextResponse.json({ error: 'Promo code ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('promo_codes')
      .delete()
      .eq('id', promoCodeId);

    if (error) {
      console.error('Error deleting promo code:', error);
      return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Promo code deleted successfully'
    });

  } catch (error) {
    console.error('Promo code DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 