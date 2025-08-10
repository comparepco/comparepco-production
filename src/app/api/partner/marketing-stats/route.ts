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

    // Get promo codes stats
    const { data: promoCodes, error: promoCodesError } = await supabaseAdmin
      .from('promo_codes')
      .select('*')
      .eq('partner_id', partner.id);

    // Get campaigns stats
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('social_campaigns')
      .select('*')
      .eq('partner_id', partner.id);

    // Get referral programs stats
    const { data: referralPrograms, error: referralProgramsError } = await supabaseAdmin
      .from('referral_programs')
      .select('*')
      .eq('partner_id', partner.id);

    if (promoCodesError || campaignsError || referralProgramsError) {
      console.error('Error fetching marketing stats:', { promoCodesError, campaignsError, referralProgramsError });
      return NextResponse.json({ error: 'Failed to fetch marketing stats' }, { status: 500 });
    }

    // Calculate stats
    const totalPromoCodes = promoCodes?.length || 0;
    const activePromoCodes = promoCodes?.filter(p => p.is_active).length || 0;
    const totalDiscountsGiven = promoCodes?.reduce((sum, p) => sum + (p.used_count * p.discount_value), 0) || 0;
    
    const totalCampaigns = campaigns?.length || 0;
    const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
    const totalEngagement = campaigns?.reduce((sum, c) => {
      const metrics = c.engagement_metrics || {};
      return sum + (metrics.views || 0) + (metrics.clicks || 0) + (metrics.shares || 0);
    }, 0) || 0;
    
    const totalReferrals = referralPrograms?.reduce((sum, r) => sum + (r.total_referrals || 0), 0) || 0;
    const totalRewardsPaid = referralPrograms?.reduce((sum, r) => sum + (r.total_rewards_paid || 0), 0) || 0;

    const stats = {
      total_promo_codes: totalPromoCodes,
      active_promo_codes: activePromoCodes,
      total_discounts_given: totalDiscountsGiven,
      total_campaigns: totalCampaigns,
      active_campaigns: activeCampaigns,
      total_engagement: totalEngagement,
      total_referrals: totalReferrals,
      total_rewards_paid: totalRewardsPaid
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching marketing stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 