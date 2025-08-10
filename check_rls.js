const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSAndPermissions() {
  try {
    console.log('🔍 Checking RLS policies and permissions...');
    
    // Test with admin client (should work)
    console.log('\n1. Testing with admin client...');
    const { data: adminPartners, error: adminError } = await supabase
      .from('partners')
      .select('*');
    
    if (adminError) {
      console.error('❌ Admin client error:', adminError);
    } else {
      console.log('✅ Admin client works - Found partners:', adminPartners?.length || 0);
    }

    // Test with anon client (might be blocked by RLS)
    console.log('\n2. Testing with anon client...');
    const { createClient: createAnonClient } = require('@supabase/supabase-js');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseAnon = createAnonClient(supabaseUrl, anonKey);
    
    const { data: anonPartners, error: anonError } = await supabaseAnon
      .from('partners')
      .select('*');
    
    if (anonError) {
      console.error('❌ Anon client error:', anonError);
    } else {
      console.log('✅ Anon client works - Found partners:', anonPartners?.length || 0);
    }

    // Check if there are any RLS policies
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'partners');
    
    if (policiesError) {
      console.error('❌ Error checking policies:', policiesError);
    } else {
      console.log('📊 RLS Policies found:', policies?.length || 0);
      policies?.forEach(policy => {
        console.log(`  - Policy: ${policy.policy_name}`);
        console.log(`    Action: ${policy.action}`);
        console.log(`    Roles: ${policy.roles}`);
        console.log(`    Command: ${policy.cmd}`);
      });
    }

    // Check table permissions
    console.log('\n4. Checking table permissions...');
    const { data: permissions, error: permError } = await supabase
      .from('information_schema.table_privileges')
      .select('*')
      .eq('table_name', 'partners');
    
    if (permError) {
      console.error('❌ Error checking permissions:', permError);
    } else {
      console.log('📊 Table permissions found:', permissions?.length || 0);
      permissions?.forEach(perm => {
        console.log(`  - Grantee: ${perm.grantee}`);
        console.log(`    Privilege: ${perm.privilege_type}`);
        console.log(`    Grantable: ${perm.is_grantable}`);
      });
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

checkRLSAndPermissions(); 