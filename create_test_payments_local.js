const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTestPayments() {
  console.log('🧪 Creating test payments with proper foreign keys...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const partnerId = '939006e2-b68d-4404-bee8-926d440bcfa3'; // Test Transport Company
    const userId = '7a9833a3-a85f-4bd0-bf54-a4a750778744'; // testpartner@comparepco.com

    console.log('📝 Creating test vehicles first...');
    
    // Create test vehicles
    const testVehicles = [
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        partner_id: partnerId,
        make: 'Toyota',
        model: 'Prius',
        year: 2022,
        license_plate: 'AB12 CDE',
        status: 'active'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440012',
        partner_id: partnerId,
        make: 'Nissan',
        model: 'Leaf',
        year: 2023,
        license_plate: 'XY34 FGH',
        status: 'active'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440013',
        partner_id: partnerId,
        make: 'Ford',
        model: 'Focus',
        year: 2021,
        license_plate: 'LM56 NOP',
        status: 'active'
      }
    ];

    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .upsert(testVehicles, { onConflict: 'id' })
      .select();

    if (vehiclesError) {
      console.log('❌ Error creating vehicles:', vehiclesError.message);
      return;
    }

    console.log('✅ Created vehicles:', vehicles.length);

    console.log('📝 Creating test bookings...');
    
    // Create test bookings
    const testBookings = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        user_id: userId,
        partner_id: partnerId,
        vehicle_id: '550e8400-e29b-41d4-a716-446655440011',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        total_amount: 150.00
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        user_id: userId,
        partner_id: partnerId,
        vehicle_id: '550e8400-e29b-41d4-a716-446655440012',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        total_amount: 200.00
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        user_id: userId,
        partner_id: partnerId,
        vehicle_id: '550e8400-e29b-41d4-a716-446655440013',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        total_amount: 75.00
      }
    ];

    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .upsert(testBookings, { onConflict: 'id' })
      .select();

    if (bookingsError) {
      console.log('❌ Error creating bookings:', bookingsError.message);
      return;
    }

    console.log('✅ Created bookings:', bookings.length);

    console.log('📝 Creating test payment instructions...');
    
    // Create test payment instructions
    const testPayments = [
      {
        partner_id: partnerId,
        booking_id: '550e8400-e29b-41d4-a716-446655440001',
        driver_id: userId, // Use the existing user as driver
        driver_name: 'John Smith',
        vehicle_reg: 'AB12 CDE',
        amount: 150.00,
        method: 'bank_transfer',
        frequency: 'weekly',
        type: 'weekly_rent',
        next_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        reason: 'Weekly rent payment'
      },
      {
        partner_id: partnerId,
        booking_id: '550e8400-e29b-41d4-a716-446655440003',
        driver_id: userId, // Use the existing user as driver
        driver_name: 'Jane Doe',
        vehicle_reg: 'XY34 FGH',
        amount: 200.00,
        method: 'bank_transfer',
        frequency: 'weekly',
        type: 'deposit',
        next_due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'deposit_pending',
        reason: 'Security deposit'
      },
      {
        partner_id: partnerId,
        booking_id: '550e8400-e29b-41d4-a716-446655440005',
        driver_id: userId, // Use the existing user as driver
        driver_name: 'Mike Johnson',
        vehicle_reg: 'LM56 NOP',
        amount: 75.00,
        method: 'direct_debit',
        frequency: 'one_off',
        type: 'adjustment',
        next_due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'sent',
        reason: 'Late payment adjustment'
      }
    ];

    const { data: payments, error: paymentsError } = await supabase
      .from('payment_instructions')
      .insert(testPayments)
      .select();

    if (paymentsError) {
      console.log('❌ Error creating payment instructions:', paymentsError.message);
      return;
    }

    console.log('✅ Successfully created test data!');
    console.log('\n📊 Summary:');
    console.log(`- Vehicles: ${vehicles.length}`);
    console.log(`- Bookings: ${bookings.length}`);
    console.log(`- Payment Instructions: ${payments.length}`);

    console.log('\n📋 Payment instructions created:');
    payments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.driver_name} - ${payment.vehicle_reg} - £${payment.amount} (${payment.status}) - ${payment.type}`);
    });

    console.log('\n🎉 Test data ready!');
    console.log('Now you can:');
    console.log('1. Log in as a partner user (testpartner@comparepco.com)');
    console.log('2. Navigate to /partner/payments');
    console.log('3. See the test payment instructions');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

createTestPayments().catch(console.error); 