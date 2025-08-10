require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMarketingData() {
  try {
    console.log('🚀 Creating marketing data...');

    // Get partner ID (using the same partner from previous scripts)
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', '7a9833a3-a85f-4bd0-bf54-a4a750778744')
      .single();

    if (partnerError || !partner) {
      console.error('❌ Error finding partner:', partnerError);
      return;
    }

    console.log('✅ Found partner:', partner.id);

    // Create promo codes
    const promoCodeData = [
      {
        partner_id: partner.id,
        code: 'SUMMER20',
        name: 'Summer Special',
        description: '20% off all bookings this summer',
        discount_type: 'PERCENTAGE',
        discount_value: 20,
        min_amount: 50,
        max_discount: 100,
        usage_limit: 100,
        used_count: 45,
        start_date: '2024-06-01',
        end_date: '2024-08-31',
        is_active: true,
        applicable_fleets: ['fleet-1', 'fleet-2']
      },
      {
        partner_id: partner.id,
        code: 'WELCOME50',
        name: 'Welcome Discount',
        description: '£50 off first booking',
        discount_type: 'FIXED',
        discount_value: 50,
        min_amount: 100,
        usage_limit: 200,
        used_count: 78,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        is_active: true,
        applicable_fleets: ['fleet-1']
      }
    ];

    for (const promoCode of promoCodeData) {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert(promoCode)
        .select();

      if (error) {
        console.error('❌ Error creating promo code:', error);
      } else {
        console.log('✅ Created promo code:', data[0].code);
      }
    }

    // Create social campaigns
    const campaignData = [
      {
        partner_id: partner.id,
        name: 'Summer Fleet Promotion',
        platform: 'FACEBOOK',
        content: 'Book your summer adventure with our premium fleet! 🚗✨ #SummerDrives #PremiumCars',
        image_url: '/images/summer-campaign.jpg',
        link_url: 'https://example.com/summer-promo',
        status: 'ACTIVE',
        engagement_metrics: {
          views: 1250,
          clicks: 89,
          shares: 23,
          conversions: 12
        }
      },
      {
        partner_id: partner.id,
        name: 'New Fleet Announcement',
        platform: 'INSTAGRAM',
        content: 'Introducing our latest luxury vehicles! Experience the ultimate in comfort and style.',
        status: 'SCHEDULED',
        scheduled_date: '2024-06-01T10:00:00Z',
        engagement_metrics: {
          views: 0,
          clicks: 0,
          shares: 0,
          conversions: 0
        }
      }
    ];

    for (const campaign of campaignData) {
      const { data, error } = await supabase
        .from('social_campaigns')
        .insert(campaign)
        .select();

      if (error) {
        console.error('❌ Error creating campaign:', error);
      } else {
        console.log('✅ Created campaign:', data[0].name);
      }
    }

    // Create referral program
    const referralProgramData = {
      partner_id: partner.id,
      name: 'Refer & Earn',
      description: 'Earn rewards for every successful referral',
      referrer_reward: 25,
      referee_reward: 10,
      reward_type: 'FIXED',
      min_booking_amount: 50,
      max_referrals_per_user: 10,
      is_active: true,
      total_referrals: 156,
      total_rewards_paid: 3250
    };

    const { data: referralProgram, error: referralError } = await supabase
      .from('referral_programs')
      .insert(referralProgramData)
      .select();

    if (referralError) {
      console.error('❌ Error creating referral program:', referralError);
    } else {
      console.log('✅ Created referral program:', referralProgram[0].name);
    }

    console.log('🎉 Marketing data created successfully!');
  } catch (error) {
    console.error('❌ Error creating marketing data:', error);
  }
}

createMarketingData(); 