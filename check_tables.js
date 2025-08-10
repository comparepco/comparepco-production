require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Check if cars table exists
    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('count')
      .limit(1);

    console.log('Cars table:');
    if (carsError) {
      console.log('❌ Error:', carsError.message);
    } else {
      console.log('✅ Exists');
      const { count } = await supabase
        .from('cars')
        .select('*', { count: 'exact', head: true });
      console.log(`   Records: ${count}`);
    }

    // Check if vehicles table exists
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('count')
      .limit(1);

    console.log('\nVehicles table:');
    if (vehiclesError) {
      console.log('❌ Error:', vehiclesError.message);
    } else {
      console.log('✅ Exists');
      const { count } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });
      console.log(`   Records: ${count}`);
    }

    // Check what's in vehicles table
    if (!vehiclesError) {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, name, license_plate, partner_id, is_approved')
        .limit(5);

      if (!error && vehicles.length > 0) {
        console.log('\nSample vehicles:');
        vehicles.forEach((v, i) => {
          console.log(`${i + 1}. ${v.name} (${v.license_plate}) - Approved: ${v.is_approved}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables(); 