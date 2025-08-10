require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkUsers() {
  console.log('🔍 Checking existing users...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Error fetching auth users:', authError.message);
    } else {
      console.log('👥 Auth users found:', authUsers.users.length);
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.id})`);
      });
    }

    // Check public.users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .limit(10);

    if (publicError) {
      console.log('❌ Error fetching public users:', publicError.message);
    } else {
      console.log('\n👥 Public users found:', publicUsers.length);
      publicUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.id})`);
      });
    }

    // Check partners
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, company_name, user_id')
      .limit(10);

    if (partnersError) {
      console.log('❌ Error fetching partners:', partnersError.message);
    } else {
      console.log('\n🏢 Partners found:', partners.length);
      partners.forEach((partner, index) => {
        console.log(`${index + 1}. ${partner.company_name} (${partner.id}) - User: ${partner.user_id}`);
      });
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkUsers().catch(console.error); 