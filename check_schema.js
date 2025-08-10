require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  try {
    // Check users table structure
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log('Users table structure:', Object.keys(users[0] || {}));
    }

    // Check drivers table structure
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .limit(1);

    if (driversError) {
      console.error('Error fetching drivers:', driversError);
    } else {
      console.log('Drivers table structure:', Object.keys(drivers[0] || {}));
    }

    // Check partners table structure
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*')
      .limit(1);

    if (partnersError) {
      console.error('Error fetching partners:', partnersError);
    } else {
      console.log('Partners table structure:', Object.keys(partners[0] || {}));
    }

  } catch (err) {
    console.error('Exception checking schema:', err);
  }
}

checkSchema(); 