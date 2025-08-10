const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.log('Make sure you have:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPartnerAccount() {
  try {
    console.log('Creating partner account...');
    
    const partnerData = {
      email: 'superadmin@example.com',
      password: 'adminpassword123',
      companyName: 'Super Admin',
      phone: '+44123456789'
    };

    // 1. Create user with admin service (no email verification)
    console.log('1. Creating auth user...');
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: partnerData.email,
      password: partnerData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: partnerData.companyName,
        role: 'ADMIN'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('✅ User created:', user.id);

    // 2. Create user profile
    console.log('2. Creating user profile...');
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: partnerData.email,
        name: partnerData.companyName,
        role: 'ADMIN',
        phone: partnerData.phone,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (userError) {
      console.error('User profile error:', userError);
      return;
    }

    console.log('✅ User profile created');

    console.log('\n🎉 Admin account created successfully!');
    console.log('📧 Email:', partnerData.email);
    console.log('🔑 Password:', partnerData.password);
    console.log('👤 Role: Admin User');
    console.log('\nYou can now login at: http://localhost:3002/auth/login');

  } catch (error) {
    console.error('❌ Error creating partner account:', error);
  }
}

// Run the script
createPartnerAccount(); 