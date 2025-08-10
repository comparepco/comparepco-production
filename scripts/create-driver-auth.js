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

async function createCompleteDriver() {
  try {
    const password = 'Driver123!'; // Default password
    
    console.log('🚗 Creating complete driver account for John Driver...');
    console.log('Email: driver@example.com');
    console.log('Password:', password);
    
    // Step 1: Create auth user
    console.log('\n1. Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'driver@example.com',
      password: password,
      email_confirm: true,
      user_metadata: {
        name: 'John Driver',
        role: 'DRIVER'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created successfully!');
    console.log('Auth User ID:', authData.user.id);

    // Step 2: Create driver record
    console.log('\n2. Creating driver record...');
    const driverData = {
      id: authData.user.id, // Use the auth user ID
      email: 'driver@example.com',
      name: 'John Driver',
      phone: '+1234567890',
      status: 'active',
      profile_completed: false,
      email_verified: true,
      roles: ['DRIVER'],
      profile: {
        license_number: 'DL123456789',
        vehicle_type: 'sedan',
        experience_years: 2,
        rating: 0,
        documents: {
          license: 'pending',
          insurance: 'pending',
          registration: 'pending'
        }
      },
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      },
      consents: {
        terms_accepted: true,
        privacy_policy: true,
        marketing: false,
        data_processing: true
      },
      marketing_preferences: {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true,
        promotional_emails: false
      }
    };

    const { data: driverResult, error: driverError } = await supabase
      .from('drivers')
      .insert([driverData])
      .select();

    if (driverError) {
      console.error('Error creating driver record:', driverError);
      return;
    }

    console.log('✅ Driver record created successfully!');

    // Step 3: Create user record
    console.log('\n3. Creating user record...');
    const userData = {
      id: authData.user.id,
      email: 'driver@example.com',
      name: 'John Driver',
      phone: '+1234567890',
      role: 'DRIVER',
      status: 'active',
      is_active: true,
      email_verified: true,
      profile_completed: false,
      profile: driverData.profile,
      address: driverData.address,
      consents: driverData.consents,
      marketing_preferences: driverData.marketing_preferences
    };

    const { data: userResult, error: userError } = await supabase
      .from('users')
      .insert([userData])
      .select();

    if (userError) {
      console.error('Error creating user record:', userError);
    } else {
      console.log('✅ User record created successfully!');
    }

    // Step 4: Verify everything is set up correctly
    console.log('\n4. Verifying account setup...');
    const { data: verifyDriver, error: verifyError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (verifyError) {
      console.error('Error verifying driver:', verifyError);
    } else {
      console.log('✅ Driver verification successful!');
    }

    console.log('\n🎉 John Driver account is fully created and ready!');
    console.log('\n📋 Account Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Name: John Driver');
    console.log('📧 Email: driver@example.com');
    console.log('🔑 Password: Driver123!');
    console.log('📱 Phone: +1234567890');
    console.log('🚗 Role: DRIVER');
    console.log('📍 Location: New York, NY');
    console.log('🚙 Vehicle: Sedan');
    console.log('📜 License: DL123456789');
    console.log('⭐ Status: Active');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: driver@example.com');
    console.log('   Password: Driver123!');
    console.log('\n💡 Next Steps:');
    console.log('   1. John can now log in to the driver app');
    console.log('   2. Complete profile verification');
    console.log('   3. Upload required documents');
    console.log('   4. Start accepting bookings');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createCompleteDriver(); 