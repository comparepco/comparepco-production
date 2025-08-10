const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Script to add test payment instructions using direct database connection
async function addTestData() {
  console.log('🧪 Adding test payment instructions to database...\n');

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL not found in environment variables');
    console.log('Please set DATABASE_URL in your .env.local file');
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // First, create a test partner
    console.log('\n📝 Creating test partner...');
    await client.query(`
      INSERT INTO partners (id, user_id, company_name, business_type, address, city, state, country, postal_code, phone, is_approved, is_active, created_at, updated_at)
      VALUES (
        'test-partner-id',
        'test-user-id',
        'Test Partner Company',
        'PCO',
        '123 Test Street',
        'London',
        'England',
        'UK',
        'SW1A 1AA',
        '+44123456789',
        true,
        true,
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING
    `);

    // Add test payment instructions
    console.log('📝 Creating test payment instructions...');
    await client.query(`
      INSERT INTO payment_instructions (
        id, partner_id, booking_id, driver_id, driver_name, vehicle_reg,
        amount, method, frequency, type, next_due_date, status, reason,
        created_at, updated_at
      ) VALUES 
      ('test-payment-1', 'test-partner-id', 'test-booking-1', 'test-driver-1', 'John Smith', 'AB12 CDE', 150.00, 'bank_transfer', 'weekly', 'weekly_rent', (NOW() + INTERVAL '7 days')::date, 'pending', 'Weekly rent payment', NOW(), NOW()),
      ('test-payment-2', 'test-partner-id', 'test-booking-2', 'test-driver-2', 'Jane Doe', 'XY34 FGH', 200.00, 'bank_transfer', 'weekly', 'deposit', (NOW() + INTERVAL '3 days')::date, 'deposit_pending', 'Security deposit', NOW(), NOW()),
      ('test-payment-3', 'test-partner-id', 'test-booking-3', 'test-driver-3', 'Mike Johnson', 'LM56 NOP', 75.00, 'direct_debit', 'one_off', 'adjustment', (NOW() + INTERVAL '1 day')::date, 'sent', 'Late payment adjustment', NOW(), NOW()),
      ('test-payment-4', 'test-partner-id', 'test-booking-4', 'test-driver-4', 'Sarah Wilson', 'QR78 STU', 300.00, 'bank_transfer', 'weekly', 'weekly_rent', (NOW() - INTERVAL '2 days')::date, 'auto', 'Weekly rent payment', NOW(), NOW()),
      ('test-payment-5', 'test-partner-id', 'test-booking-5', 'test-driver-5', 'David Brown', 'VW90 XYZ', 125.00, 'direct_debit', 'one_off', 'topup', (NOW() + INTERVAL '5 days')::date, 'pending', 'Account top-up', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);

    // Verify the data was inserted
    console.log('📊 Verifying data...');
    const result = await client.query(`
      SELECT 
        driver_name,
        vehicle_reg,
        amount,
        type,
        status,
        next_due_date
      FROM payment_instructions 
      WHERE partner_id = 'test-partner-id'
      ORDER BY created_at
    `);

    console.log('✅ Successfully created test data!');
    console.log('\n📋 Test payment instructions:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.driver_name} - ${row.vehicle_reg} - £${row.amount} (${row.status}) - ${row.type}`);
    });

    console.log('\n🎉 Test data ready!');
    console.log('Now you can:');
    console.log('1. Log in as a partner user');
    console.log('2. Navigate to /partner/payments');
    console.log('3. See the test payment instructions');

  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

// Run the script
addTestData().catch(console.error); 