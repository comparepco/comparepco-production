const { createClient } = require('@supabase/supabase-js');

// Script to create test payment instructions
async function createTestPayments() {
  console.log('🧪 Creating test payment instructions...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase credentials not found');
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // First, let's check if we have any partners
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, company_name')
      .limit(5);

    if (partnersError) {
      console.log('❌ Error fetching partners:', partnersError.message);
      return;
    }

    if (!partners || partners.length === 0) {
      console.log('❌ No partners found in database');
      console.log('Please create a partner account first');
      return;
    }

    console.log('📋 Found partners:', partners.map(p => p.company_name));

    // Get the first partner
    const partner = partners[0];
    console.log(`\n🎯 Using partner: ${partner.company_name} (${partner.id})`);

    // Create test payment instructions
    const testPayments = [
      {
        partner_id: partner.id,
        booking_id: 'test-booking-1',
        driver_id: 'test-driver-1',
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
        partner_id: partner.id,
        booking_id: 'test-booking-2',
        driver_id: 'test-driver-2',
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
        partner_id: partner.id,
        booking_id: 'test-booking-3',
        driver_id: 'test-driver-3',
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

    console.log('\n📝 Creating test payment instructions...');

    const { data: insertedPayments, error: insertError } = await supabase
      .from('payment_instructions')
      .insert(testPayments)
      .select();

    if (insertError) {
      console.log('❌ Error creating payment instructions:', insertError.message);
      return;
    }

    console.log('✅ Successfully created test payment instructions!');
    console.log('\n📊 Created payments:');
    insertedPayments.forEach((payment, index) => {
      console.log(`${index + 1}. ${payment.driver_name} - £${payment.amount} (${payment.status})`);
    });

    console.log('\n🎉 Test data created successfully!');
    console.log('Now you can:');
    console.log('1. Log in as a partner user');
    console.log('2. Navigate to /partner/payments');
    console.log('3. See the test payment instructions');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the script
createTestPayments().catch(console.error); 