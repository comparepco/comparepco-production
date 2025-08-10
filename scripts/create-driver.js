const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Your project URL from the linked project
const supabaseUrl = 'https://yunhdfngdanrxllgtmfc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('You can get this from your Supabase dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function createDriver() {
  try {
    const driverId = generateUUID();
    
    // Create a new driver account
    const driverData = {
      id: driverId,
      email: 'driver@example.com',
      name: 'John Driver',
      phone: '+1234567890',
      status: 'active',
      profile_completed: false,
      email_verified: false,
      roles: ['DRIVER'],
      profile: {
        license_number: 'DL123456789',
        vehicle_type: 'sedan',
        experience_years: 2,
        rating: 0
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
        marketing: false
      },
      marketing_preferences: {
        email_notifications: true,
        sms_notifications: false,
        push_notifications: true
      }
    };

    console.log('Creating driver account...');
    
    // Insert the driver into the drivers table
    const { data, error } = await supabase
      .from('drivers')
      .insert([driverData])
      .select();

    if (error) {
      console.error('Error creating driver:', error);
      return;
    }

    console.log('✅ Driver created successfully!');
    console.log('Driver ID:', data[0].id);
    console.log('Email:', data[0].email);
    console.log('Name:', data[0].name);
    console.log('Status:', data[0].status);

    // Also create a user account for authentication
    const userData = {
      id: driverId,
      email: driverData.email,
      name: driverData.name,
      phone: driverData.phone,
      role: 'DRIVER',
      status: 'active',
      is_active: true,
      email_verified: false,
      profile_completed: false,
      profile: driverData.profile,
      address: driverData.address,
      consents: driverData.consents,
      marketing_preferences: driverData.marketing_preferences
    };

    console.log('Creating user account...');
    
    const { data: userDataResult, error: userError } = await supabase
      .from('users')
      .insert([userData])
      .select();

    if (userError) {
      console.error('Error creating user account:', userError);
    } else {
      console.log('✅ User account created successfully!');
      console.log('User ID:', userDataResult[0].id);
    }

    console.log('\n🎉 Driver account creation complete!');
    console.log('Login credentials:');
    console.log('Email: driver@example.com');
    console.log('Password: (You can set this through Supabase Auth)');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createDriver(); 