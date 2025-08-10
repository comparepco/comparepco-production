require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPricingData() {
  try {
    console.log('🚀 Creating pricing data...');

    // Get the existing partner
    const { data: partners, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (partnerError || !partners || partners.length === 0) {
      console.error('❌ No partners found');
      return;
    }

    const partnerId = partners[0].id;
    console.log(`✅ Found partner: ${partnerId}`);

    // Create pricing templates
    const pricingTemplates = [
      {
        partner_id: partnerId,
        name: 'Economy Sedan Template',
        category: 'Economy',
        make: 'Toyota',
        model: 'Corolla',
        daily_rate: 45.00,
        weekly_rate: 280.00,
        monthly_rate: 1100.00,
        ride_hailing_categories: ['UBER_X', 'LYFT_STANDARD', 'BOLT_STANDARD'],
        is_active: true
      },
      {
        partner_id: partnerId,
        name: 'Compact SUV Template',
        category: 'SUV',
        make: 'Honda',
        model: 'CR-V',
        daily_rate: 65.00,
        weekly_rate: 400.00,
        monthly_rate: 1500.00,
        ride_hailing_categories: ['UBER_XL', 'LYFT_XL', 'BOLT_XL'],
        is_active: true
      },
      {
        partner_id: partnerId,
        name: 'Luxury Sedan Template',
        category: 'Luxury',
        make: 'BMW',
        model: '3 Series',
        daily_rate: 85.00,
        weekly_rate: 520.00,
        monthly_rate: 2000.00,
        ride_hailing_categories: ['UBER_PREMIUM', 'LYFT_PREMIUM', 'BOLT_PREMIUM'],
        is_active: true
      },
      {
        partner_id: partnerId,
        name: 'Electric Vehicle Template',
        category: 'Electric',
        make: 'Tesla',
        model: 'Model 3',
        daily_rate: 75.00,
        weekly_rate: 460.00,
        monthly_rate: 1800.00,
        ride_hailing_categories: ['UBER_COMFORT', 'LYFT_PREMIUM', 'BOLT_PREMIUM'],
        is_active: true
      },
      {
        partner_id: partnerId,
        name: 'Minivan Template',
        category: 'Minivan',
        make: 'Toyota',
        model: 'Sienna',
        daily_rate: 70.00,
        weekly_rate: 430.00,
        monthly_rate: 1700.00,
        ride_hailing_categories: ['UBER_XL', 'LYFT_XL', 'BOLT_XL'],
        is_active: true
      }
    ];

    console.log('📝 Creating pricing templates...');
    const { data: templates, error: templateError } = await supabase
      .from('pricing_templates')
      .insert(pricingTemplates)
      .select();

    if (templateError) {
      console.error('❌ Error creating pricing templates:', templateError);
      return;
    }

    console.log(`✅ Created ${templates.length} pricing templates`);

    // Update existing vehicles with pricing data
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, make, model, category')
      .eq('partner_id', partnerId);

    if (vehicleError) {
      console.error('❌ Error fetching vehicles:', vehicleError);
      return;
    }

    console.log(`📝 Updating ${vehicles.length} vehicles with pricing...`);

    for (const vehicle of vehicles) {
      let pricing = {
        daily_rate: 50.00,
        weekly_rate: 300.00,
        monthly_rate: 1200.00,
        ride_hailing_categories: ['UBER_X', 'LYFT_STANDARD']
      };

      // Set pricing based on vehicle category
      if (vehicle.category === 'SUV') {
        pricing = {
          daily_rate: 65.00,
          weekly_rate: 400.00,
          monthly_rate: 1500.00,
          ride_hailing_categories: ['UBER_XL', 'LYFT_XL']
        };
      } else if (vehicle.category === 'Luxury') {
        pricing = {
          daily_rate: 85.00,
          weekly_rate: 520.00,
          monthly_rate: 2000.00,
          ride_hailing_categories: ['UBER_PREMIUM', 'LYFT_PREMIUM']
        };
      } else if (vehicle.category === 'Electric') {
        pricing = {
          daily_rate: 75.00,
          weekly_rate: 460.00,
          monthly_rate: 1800.00,
          ride_hailing_categories: ['UBER_COMFORT', 'LYFT_PREMIUM']
        };
      }

      const { error: updateError } = await supabase
        .from('vehicles')
        .update(pricing)
        .eq('id', vehicle.id);

      if (updateError) {
        console.error(`❌ Error updating vehicle ${vehicle.id}:`, updateError);
      }
    }

    console.log('✅ Pricing data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${templates.length} pricing templates created`);
    console.log(`   - ${vehicles.length} vehicles updated with pricing`);

  } catch (error) {
    console.error('❌ Error creating pricing data:', error);
  }
}

createPricingData(); 