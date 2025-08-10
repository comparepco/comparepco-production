const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkDrivers() {
  try {
    console.log('🔍 Checking drivers table...');
    
    // Check drivers count
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*');
    
    if (driversError) {
      console.error('❌ Error fetching drivers:', driversError);
      return;
    }
    
    console.log(`📊 Found ${drivers.length} drivers in the database`);
    
    if (drivers.length > 0) {
      console.log('\n📋 Driver details:');
      drivers.forEach((driver, index) => {
        console.log(`${index + 1}. ID: ${driver.id}, User ID: ${driver.user_id}, Created: ${driver.created_at}`);
      });
    }
    
    // Check users with driver role
    console.log('\n🔍 Checking users with driver role...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${users.length} users with driver role`);
    
    if (users.length > 0) {
      console.log('\n📋 User details:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Created: ${user.created_at}`);
      });
    }
    
    // Check RLS policies
    console.log('\n🔍 Checking RLS policies on drivers table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'drivers' })
      .catch(() => ({ data: null, error: 'RPC not available' }));
    
    if (policiesError) {
      console.log('ℹ️  Could not check RLS policies directly');
    } else {
      console.log('📋 RLS Policies:', policies);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDrivers(); 