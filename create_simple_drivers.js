require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSimpleDrivers() {
  try {
    // First, let's get a partner ID to use
    const { data: partners, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (partnerError || !partners || partners.length === 0) {
      console.error('No partners found. Please create a partner first.');
      return;
    }

    const partnerId = partners[0].id;
    console.log('Using partner ID:', partnerId);

    // Create test users first
    const testUsers = [
      {
        email: 'john.driver@test.com',
        phone: '+447700123456',
        firstName: 'John',
        lastName: 'Smith',
        role: 'DRIVER',
        isVerified: true,
        isActive: true
      },
      {
        email: 'sarah.driver@test.com',
        phone: '+447700123457',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'DRIVER',
        isVerified: true,
        isActive: true
      },
      {
        email: 'mike.driver@test.com',
        phone: '+447700123458',
        firstName: 'Mike',
        lastName: 'Williams',
        role: 'DRIVER',
        isVerified: false,
        isActive: true
      }
    ];

    const createdUsers = [];
    
    // Create users
    for (const userData of testUsers) {
      const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        continue;
      }

      createdUsers.push({ ...userData, id: user.user.id });
      console.log('Created user:', userData.firstName, userData.lastName);
    }

    // Create drivers with only basic fields
    const testDrivers = [
      {
        userId: createdUsers[0].id,
        partnerId: partnerId,
        licenseNumber: 'DL123456789',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        rating: 4.8,
        totalTrips: 150,
        totalEarnings: 12500.00,
        isApproved: true,
        isActive: true
      },
      {
        userId: createdUsers[1].id,
        partnerId: partnerId,
        licenseNumber: 'DL987654321',
        licenseExpiry: new Date('2026-03-15').toISOString(),
        rating: 4.6,
        totalTrips: 89,
        totalEarnings: 7800.00,
        isApproved: true,
        isActive: true
      },
      {
        userId: createdUsers[2].id,
        partnerId: partnerId,
        licenseNumber: 'DL456789123',
        licenseExpiry: new Date('2025-08-20').toISOString(),
        rating: 4.2,
        totalTrips: 45,
        totalEarnings: 3200.00,
        isApproved: false,
        isActive: true
      }
    ];

    // Insert drivers
    for (const driverData of testDrivers) {
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .insert([driverData])
        .select()
        .single();

      if (driverError) {
        console.error('Error creating driver:', driverError);
      } else {
        console.log('Created driver for:', driverData.userId);
      }
    }

    console.log('✅ Test drivers created successfully!');
    console.log('You can now refresh the drivers page to see the data.');

  } catch (err) {
    console.error('Exception creating drivers:', err);
  }
}

createSimpleDrivers(); 