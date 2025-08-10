const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDriver() {
  const testDriver = {
    email: 'test.driver@example.com',
    password: 'TestDriver123!',
    name: 'John Test Driver',
    phone: '+447700900000',
    address: {
      street: '123 Test Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'United Kingdom'
    }
  };

  console.log('🚗 Creating test driver...');
  console.log('Email:', testDriver.email);
  console.log('Name:', testDriver.name);
  console.log('Phone:', testDriver.phone);

  try {
    // Step 1: Create user with Supabase Auth
    console.log('\n1️⃣ Creating user with Supabase Auth...');
    const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
      email: testDriver.email,
      password: testDriver.password,
      email_confirm: true
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!user) {
      throw new Error('No user returned from signup');
    }

    console.log('✅ User created with ID:', user.id);

    // Step 2: Create user profile in public.users table
    console.log('\n2️⃣ Creating user profile in public.users...');
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: testDriver.email,
        phone: testDriver.phone.replace(/\s/g, ''),
        first_name: testDriver.name.split(' ')[0] || testDriver.name,
        last_name: testDriver.name.split(' ').slice(1).join(' ') || '',
        role: 'driver',
        is_active: true,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      throw profileError;
    }

    console.log('✅ User profile created');

    // Step 3: Create driver record in public.drivers table
    console.log('\n3️⃣ Creating driver record in public.drivers...');
    const { error: driverError } = await supabase
      .from('drivers')
      .insert({
        user_id: user.id,
        license_number: null, // Use null instead of empty string
        license_expiry: null,
        insurance_number: null,
        insurance_expiry: null,
        experience: 0,
        rating: 0,
        total_trips: 0,
        total_earnings: 0,
        is_approved: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (driverError) {
      throw driverError;
    }

    console.log('✅ Driver record created');

    // Step 4: Verify the records were created
    console.log('\n4️⃣ Verifying records...');
    
    // Check user profile
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      throw userError;
    }

    console.log('✅ User profile verified:', {
      id: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      is_active: userProfile.is_active
    });

    // Check driver record
    const { data: driverProfile, error: driverCheckError } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (driverCheckError) {
      throw driverCheckError;
    }

    console.log('✅ Driver record verified:', {
      id: driverProfile.id,
      user_id: driverProfile.user_id,
      is_approved: driverProfile.is_approved,
      is_active: driverProfile.is_active
    });

    // Step 5: Test authentication
    console.log('\n5️⃣ Testing authentication...');
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email: testDriver.email,
      password: testDriver.password
    });

    if (authError) {
      throw authError;
    }

    console.log('✅ Authentication successful');
    console.log('Session user ID:', session.user.id);

    console.log('\n🎉 Test driver created successfully!');
    console.log('\n📋 Test Driver Details:');
    console.log('Email:', testDriver.email);
    console.log('Password:', testDriver.password);
    console.log('Name:', testDriver.name);
    console.log('Phone:', testDriver.phone);
    console.log('User ID:', user.id);
    console.log('Driver ID:', driverProfile.id);

    return {
      user,
      userProfile,
      driverProfile,
      session
    };

  } catch (error) {
    console.error('❌ Error creating test driver:', error);
    throw error;
  }
}

// Run the test
createTestDriver()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 