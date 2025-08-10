const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createSimplePayments() {
  console.log('🧪 Creating simple test payment instructions...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const partnerId = '939006e2-b68d-4404-bee8-926d440bcfa3'; // Test Transport Company

    console.log('📝 Creating test payment instructions...');
    
    // Create simple test payment instructions without complex foreign keys
    const testPayments = [
      {
        partner_id: partnerId,
        booking_id: '550e8400-e29b-41d4-a716-446655440001',
        driver_id: '550e8400-e29b-41d4-a716-446655440002',
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
        driver_id: '550e8400-e29b-41d4-a716-446655440004',
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
        driver_id: '550e8400-e29b-41d4-a716-446655440006',
        driver_name: 'Mike Johnson',
        vehicle_reg: 'LM56 NOP',
        amount: 75.00,
        method: 'direct_debit',
        frequency: 'one_off',
        type: 'adjustment',
        next_due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'sent',
        reason: 'Late payment adjustment'
      },
      {
        partner_id: partnerId,
        booking_id: '550e8400-e29b-41d4-a716-446655440007',
        driver_id: '550e8400-e29b-41d4-a716-446655440008',
        driver_name: 'Sarah Wilson',
        vehicle_reg: 'QR78 STU',
        amount: 300.00,
        method: 'bank_transfer',
        frequency: 'weekly',
        type: 'weekly_rent',
        next_due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'auto',
        reason: 'Weekly rent payment'
      },
      {
        partner_id: partnerId,
        booking_id: '550e8400-e29b-41d4-a716-446655440009',
        driver_id: '550e8400-e29b-41d4-a716-446655440010',
        driver_name: 'David Brown',
        vehicle_reg: 'VW90 XYZ',
        amount: 125.00,
        method: 'direct_debit',
        frequency: 'one_off',
        type: 'topup',
        next_due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        reason: 'Account top-up'
      }
    ];

    // Try to insert the payment instructions
    const { data: payments, error: paymentsError } = await supabase
      .from('payment_instructions')
      .insert(testPayments)
      .select();

    if (paymentsError) {
      console.log('❌ Error creating payment instructions:', paymentsError.message);
      
      // If foreign key constraint fails, let's try without the foreign key fields
      console.log('🔄 Trying without foreign key constraints...');
      
      const simplePayments = testPayments.map(payment => ({
        partner_id: payment.partner_id,
        driver_name: payment.driver_name,
        vehicle_reg: payment.vehicle_reg,
        amount: payment.amount,
        method: payment.method,
        frequency: payment.frequency,
        type: payment.type,
        next_due_date: payment.next_due_date,
        status: payment.status,
        reason: payment.reason
      }));

      const { data: simplePaymentsData, error: simpleError } = await supabase
        .from('payment_instructions')
        .insert(simplePayments)
        .select();

      if (simpleError) {
        console.log('❌ Error creating simple payment instructions:', simpleError.message);
        return;
      }

      console.log('✅ Successfully created simple test payment instructions!');
      console.log('\n📊 Created payments:');
      simplePaymentsData.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.driver_name} - ${payment.vehicle_reg} - £${payment.amount} (${payment.status}) - ${payment.type}`);
      });

    } else {
      console.log('✅ Successfully created test payment instructions!');
      console.log('\n📊 Created payments:');
      payments.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.driver_name} - ${payment.vehicle_reg} - £${payment.amount} (${payment.status}) - ${payment.type}`);
      });
    }

    console.log('\n🎉 Test data ready!');
    console.log('Now you can:');
    console.log('1. Log in as a partner user (testpartner@comparepco.com)');
    console.log('2. Navigate to /partner/payments');
    console.log('3. See the test payment instructions');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

createSimplePayments().catch(console.error); 