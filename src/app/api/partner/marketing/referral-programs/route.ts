import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // Get referral programs for this partner
    const { data: referralPrograms, error } = await supabaseAdmin
      .from('referral_programs')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referral programs:', error);
      return NextResponse.json({ error: 'Failed to fetch referral programs' }, { status: 500 });
    }

    return NextResponse.json({ referralPrograms: referralPrograms || [] });
  } catch (error) {
    console.error('Error fetching referral programs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      description,
      referrer_reward,
      referee_reward,
      reward_type,
      min_booking_amount,
      max_referrals_per_user
    } = body;

    // Get partner ID from user
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Create new referral program
    const { data: referralProgram, error } = await supabaseAdmin
      .from('referral_programs')
      .insert({
        partner_id: partner.id,
        name,
        description,
        referrer_reward,
        referee_reward,
        reward_type,
        min_booking_amount,
        max_referrals_per_user,
        is_active: true,
        total_referrals: 0,
        total_rewards_paid: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating referral program:', error);
      return NextResponse.json({ error: 'Failed to create referral program' }, { status: 500 });
    }

    return NextResponse.json({ referralProgram }, { status: 201 });
  } catch (error) {
    console.error('Error creating referral program:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 