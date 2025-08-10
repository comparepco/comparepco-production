require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateVehicleCategories() {
  try {
    console.log('🚀 Updating vehicle categories...');

    // Use the partner ID that matches the vehicles (from the API response)
    const partnerId = '939006e2-b68d-4404-bee8-926d440bcfa3';
    console.log(`✅ Using partner ID: ${partnerId}`);

    // Get vehicles and update their categories
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, make, model')
      .eq('partner_id', partnerId);

    if (vehicleError) {
      console.error('❌ Error fetching vehicles:', vehicleError);
      return;
    }

    console.log(`📝 Updating ${vehicles.length} vehicles with categories...`);

    for (const vehicle of vehicles) {
      let category = 'Economy';
      let pricing = {
        daily_rate: 50.00,
        weekly_rate: 300.00,
        monthly_rate: 1200.00,
        ride_hailing_categories: ['UBER_X', 'LYFT_STANDARD']
      };

      // Set category and pricing based on vehicle make/model
      if (vehicle.make === 'Toyota' && vehicle.model === 'Prius') {
        category = 'Hybrid';
        pricing = {
          daily_rate: 60.00,
          weekly_rate: 360.00,
          monthly_rate: 1400.00,
          ride_hailing_categories: ['UBER_COMFORT', 'LYFT_STANDARD']
        };
      } else if (vehicle.make === 'Nissan' && vehicle.model === 'Leaf') {
        category = 'Electric';
        pricing = {
          daily_rate: 70.00,
          weekly_rate: 420.00,
          monthly_rate: 1600.00,
          ride_hailing_categories: ['UBER_COMFORT', 'LYFT_PREMIUM']
        };
      } else if (vehicle.make === 'Ford' && vehicle.model === 'Focus') {
        category = 'Economy';
        pricing = {
          daily_rate: 45.00,
          weekly_rate: 270.00,
          monthly_rate: 1100.00,
          ride_hailing_categories: ['UBER_X', 'LYFT_STANDARD']
        };
      } else if (vehicle.make === 'Toyota' && vehicle.model === 'Camry') {
        category = 'Mid-size';
        pricing = {
          daily_rate: 55.00,
          weekly_rate: 330.00,
          monthly_rate: 1300.00,
          ride_hailing_categories: ['UBER_X', 'LYFT_STANDARD']
        };
      } else if (vehicle.make === 'Honda' && vehicle.model === 'CR-V') {
        category = 'SUV';
        pricing = {
          daily_rate: 65.00,
          weekly_rate: 400.00,
          monthly_rate: 1500.00,
          ride_hailing_categories: ['UBER_XL', 'LYFT_XL']
        };
      } else if (vehicle.make === 'Ford' && vehicle.model === 'Transit') {
        category = 'Van';
        pricing = {
          daily_rate: 80.00,
          weekly_rate: 480.00,
          monthly_rate: 1800.00,
          ride_hailing_categories: ['UBER_XL', 'LYFT_XL']
        };
      }

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          category,
          ...pricing
        })
        .eq('id', vehicle.id);

      if (updateError) {
        console.error(`❌ Error updating vehicle ${vehicle.id}:`, updateError);
      } else {
        console.log(`✅ Updated ${vehicle.make} ${vehicle.model} -> ${category}`);
      }
    }

    console.log('✅ Vehicle categories updated successfully!');

  } catch (error) {
    console.error('❌ Error updating vehicle categories:', error);
  }
}

updateVehicleCategories(); 