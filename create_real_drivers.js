require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRealDrivers() {
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
        email: 'john.driver1@test.com',
        name: 'John Smith',
        phone: '+447700123456',
        role: 'DRIVER',
        is_active: true,
        status: 'active'
      },
      {
        email: 'sarah.driver1@test.com',
        name: 'Sarah Johnson',
        phone: '+447700123457',
        role: 'DRIVER',
        is_active: true,
        status: 'active'
      },
      {
        email: 'mike.driver1@test.com',
        name: 'Mike Williams',
        phone: '+447700123458',
        role: 'DRIVER',
        is_active: true,
        status: 'active'
      },
      {
        email: 'lisa.driver1@test.com',
        name: 'Lisa Brown',
        phone: '+447700123459',
        role: 'DRIVER',
        is_active: true,
        status: 'active'
      },
      {
        email: 'david.driver1@test.com',
        name: 'David Davis',
        phone: '+447700123460',
        role: 'DRIVER',
        is_active: false,
        status: 'inactive'
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
          name: userData.name,
          phone: userData.phone,
          role: userData.role
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        continue;
      }

      // Update user profile with correct schema
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          is_active: userData.is_active,
          status: userData.status
        })
        .eq('id', user.user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
      }

      createdUsers.push({ ...userData, id: user.user.id });
      console.log('Created user:', userData.name);
    }

    console.log('✅ Test users created successfully!');
    console.log('You can now refresh the drivers page to see the data.');

  } catch (err) {
    console.error('Exception creating drivers:', err);
  }
}

createRealDrivers(); 