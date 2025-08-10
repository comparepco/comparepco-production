const { createClient } = require('@supabase/supabase-js');

// Your project URL from the linked project
const supabaseUrl = 'https://yunhdfngdanrxllgtmfc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('You can get this from your Supabase dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  try {
    const email = 'omar@comparepco.co.uk';
    const password = 'Ani070317?!';
    
    console.log('👑 Creating Super Admin account...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Step 1: Create auth user
    console.log('\n1. Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: 'Omar',
        role: 'SUPER_ADMIN'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created successfully!');
    console.log('Auth User ID:', authData.user.id);

    // Step 2: Create user record
    console.log('\n2. Creating user record...');
    const userData = {
      id: authData.user.id,
      email: email,
      name: 'Omar',
      phone: '+447700900000',
      role: 'SUPER_ADMIN',
      status: 'active',
      is_active: true,
      email_verified: true,
      profile_completed: true,
      profile: {
        title: 'Super Administrator',
        department: 'Management',
        permissions: ['all'],
        access_level: 'super_admin'
      },
      address: {
        street: '123 Admin Street',
        city: 'London',
        state: 'England',
        zip: 'SW1A 1AA',
        country: 'UK'
      },
      consents: {
        terms_accepted: true,
        privacy_policy: true,
        marketing: true,
        data_processing: true,
        admin_access: true
      },
      marketing_preferences: {
        email_notifications: true,
        sms_notifications: true,
        push_notifications: true,
        promotional_emails: true,
        system_alerts: true
      }
    };

    const { data: userResult, error: userError } = await supabase
      .from('users')
      .insert([userData])
      .select();

    if (userError) {
      console.error('Error creating user record:', userError);
      return;
    }

    console.log('✅ User record created successfully!');

    // Step 3: Verify everything is set up correctly
    console.log('\n3. Verifying account setup...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.error('Error verifying user:', verifyError);
    } else {
      console.log('✅ User verification successful!');
    }

    console.log('\n👑 Super Admin account is fully created and ready!');
    console.log('\n📋 Account Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Name: Omar');
    console.log('📧 Email: omar@comparepco.co.uk');
    console.log('🔑 Password: Ani070317?!');
    console.log('📱 Phone: +447700900000');
    console.log('👑 Role: SUPER_ADMIN');
    console.log('📍 Location: London, UK');
    console.log('🏢 Department: Management');
    console.log('🔐 Access Level: Super Administrator');
    console.log('⭐ Status: Active');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: omar@comparepco.co.uk');
    console.log('   Password: Ani070317?!');
    console.log('\n💡 Super Admin Capabilities:');
    console.log('   ✅ Full system access');
    console.log('   ✅ User management');
    console.log('   ✅ System configuration');
    console.log('   ✅ Analytics and reporting');
    console.log('   ✅ Security and compliance');
    console.log('   ✅ Partner and driver management');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createSuperAdmin(); 