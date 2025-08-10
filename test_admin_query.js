const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create admin client (service role)
const adminSupabase = createClient(supabaseUrl, serviceKey);

// Create regular client (anon key)
const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAdminQuery() {
  try {
    console.log('🔍 Testing admin drivers query...');
    
    // Test with service role (admin)
    console.log('\n📊 Testing with service role (admin):');
    const { data: adminDrivers, error: adminError } = await adminSupabase
      .from('drivers')
      .select(`
        *,
        user:users(
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          created_at
        )
      `)
      .order('created_at', { ascending: false });
    
    if (adminError) {
      console.error('❌ Admin query error:', adminError);
    } else {
      console.log(`✅ Admin query successful: ${adminDrivers.length} drivers found`);
      if (adminDrivers.length > 0) {
        console.log('📋 First driver:', {
          id: adminDrivers[0].id,
          email: adminDrivers[0].user?.email,
          name: adminDrivers[0].user ? `${adminDrivers[0].user.first_name} ${adminDrivers[0].user.last_name}` : 'N/A'
        });
      }
    }
    
    // Test with regular client (should fail due to RLS)
    console.log('\n📊 Testing with regular client (should be blocked by RLS):');
    const { data: regularDrivers, error: regularError } = await regularSupabase
      .from('drivers')
      .select('*')
      .limit(1);
    
    if (regularError) {
      console.log('❌ Regular client blocked (expected):', regularError.message);
    } else {
      console.log(`⚠️  Regular client got ${regularDrivers.length} drivers (unexpected)`);
    }
    
    // Test the exact query from admin page
    console.log('\n📊 Testing exact admin page query:');
    const { data: pageDrivers, error: pageError } = await adminSupabase
      .from('drivers')
      .select(`
        *,
        user:users(
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          created_at
        )
      `)
      .order('created_at', { ascending: false });
    
    if (pageError) {
      console.error('❌ Page query error:', pageError);
    } else {
      console.log(`✅ Page query successful: ${pageDrivers.length} drivers found`);
      
      // Process like the admin page does
      const enriched = pageDrivers.map(driver => {
        const userData = driver.user;
        return {
          ...driver,
          email: userData?.email || driver.email,
          full_name: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : driver.full_name,
          phone: userData?.phone || driver.phone,
          role: userData?.role || driver.role,
          created_at: userData?.created_at || driver.created_at,
          bookings: [],
          source: 'drivers'
        };
      });
      
      console.log('📋 Processed drivers:');
      enriched.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.full_name} (${driver.email}) - Status: ${driver.status || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAdminQuery(); 