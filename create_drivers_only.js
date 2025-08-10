require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDriversOnly() {
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

    // Get existing users with DRIVER role
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, firstName, lastName')
      .eq('role', 'DRIVER')
      .limit(5);

    if (usersError || !existingUsers || existingUsers.length === 0) {
      console.error('No existing driver users found.');
      return;
    }

    console.log('Found existing users:', existingUsers.length);

    // Create drivers for existing users
    const testDrivers = existingUsers.map((user, index) => ({
      userId: user.id,
      partnerId: partnerId,
      licenseNumber: `DL${String(index + 1).padStart(9, '0')}`,
      licenseExpiry: new Date('2025-12-31').toISOString(),
      rating: 4.5 + (index * 0.1),
      totalTrips: 50 + (index * 25),
      totalEarnings: 5000 + (index * 1500),
      isApproved: index < 3, // First 3 are approved
      isActive: index < 4 // First 4 are active
    }));

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
        console.log('Created driver for user:', driverData.userId);
      }
    }

    console.log('✅ Test drivers created successfully!');
    console.log('You can now refresh the drivers page to see the data.');

  } catch (err) {
    console.error('Exception creating drivers:', err);
  }
}

createDriversOnly(); 