const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Script to add test payment instructions using Supabase client
async function addTestData() {
  console.log('🧪 Adding test payment instructions using Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase credentials not found');
    console.log('Please check your .env.local file');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Use existing partner or create a new one
    console.log('📝 Checking for existing partners...');
    let { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('id, company_name, user_id')
      .limit(1);

    if (partnersError) {
      console.log('❌ Error fetching partners:', partnersError.message);
      return;
    }

    let partner;
    if (partners && partners.length > 0) {
      partner = partners[0];
      console.log('✅ Using existing partner:', partner.company_name);
    } else {
      console.log('📝 Creating new test partner...');
      const { data: newPartner, error: partnerError } = await supabase
        .from('partners')
        .insert({
          user_id: '7a9833a3-a85f-4bd0-bf54-a4a750778744', // Use existing user ID
          company_name: 'Test Partner Company',
          business_type: 'PCO',
          address: '123 Test Street',
          city: 'London',
          state: 'England',
          country: 'UK',
          postal_code: 'SW1A 1AA',
          phone: '+44123456789',
          is_approved: true,
          is_active: true
        })
        .select()
        .single();

      if (partnerError) {
        console.log('❌ Error creating partner:', partnerError.message);
        return;
      }
      partner = newPartner;
    }

          console.log('✅ Partner ready:', partner.company_name);

    // Add test payment instructions
    console.log('📝 Creating test payment instructions...');
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
      },
      {
        partner_id: partner.id,
        booking_id: 'test-booking-4',
        driver_id: 'test-driver-4',
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
        partner_id: partner.id,
        booking_id: 'test-booking-5',
        driver_id: 'test-driver-5',
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
      console.log(`${index + 1}. ${payment.driver_name} - ${payment.vehicle_reg} - £${payment.amount} (${payment.status}) - ${payment.type}`);
    });

    console.log('\n🎉 Test data ready!');
    console.log('Now you can:');
    console.log('1. Log in as a partner user');
    console.log('2. Navigate to /partner/payments');
    console.log('3. See the test payment instructions');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the script
addTestData().catch(console.error); 