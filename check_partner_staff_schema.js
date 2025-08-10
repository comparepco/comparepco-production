const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPartnerStaffSchema() {
  try {
    console.log('🔍 Checking partner_staff table structure...');

    // Check partner_staff table structure
    const { data: staff, error: staffError } = await supabase
      .from('partner_staff')
      .select('*')
      .limit(1);

    if (staffError) {
      console.error('❌ Error accessing partner_staff table:', staffError);
    } else {
      console.log('✅ Partner_staff table exists and is accessible');
      console.log('📊 Partner_staff table columns:', Object.keys(staff[0] || {}));
      console.log('📊 Sample staff data:', staff[0]);
    }

    // Try to get all staff records
    const { data: allStaff, error: allStaffError } = await supabase
      .from('partner_staff')
      .select('*');

    if (allStaffError) {
      console.error('❌ Error getting all staff:', allStaffError);
    } else {
      console.log('\n📊 Total staff records:', allStaff?.length || 0);
      if (allStaff && allStaff.length > 0) {
        console.log('📊 First staff record:', allStaff[0]);
      }
    }

    // Try to manually join with users
    console.log('\n🔍 Testing manual join...');
    if (allStaff && allStaff.length > 0) {
      const staffRecord = allStaff[0];
      console.log('📊 Staff record user_id:', staffRecord.user_id);
      
      // Get user details separately
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', staffRecord.user_id)
        .single();

      if (userError) {
        console.error('❌ Error getting user:', userError);
      } else {
        console.log('✅ User found:', user);
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkPartnerStaffSchema(); 