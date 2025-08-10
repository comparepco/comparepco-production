const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkBookings() {
  console.log('🔍 Checking existing bookings...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, user_id, partner_id, driver_id, start_date, end_date, status')
      .limit(10);

    if (bookingsError) {
      console.log('❌ Error fetching bookings:', bookingsError.message);
    } else {
      console.log('📋 Bookings found:', bookings.length);
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. Booking ${booking.id} - Status: ${booking.status}`);
      });
    }

    // Check if we can create a test booking first
    console.log('\n📝 Creating a test booking...');
    const { data: testBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: '7a9833a3-a85f-4bd0-bf54-a4a750778744',
        partner_id: '939006e2-b68d-4404-bee8-926d440bcfa3',
        driver_id: '550e8400-e29b-41d4-a716-446655440002',
        vehicle_id: '550e8400-e29b-41d4-a716-446655440011',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        total_amount: 150.00
      })
      .select()
      .single();

    if (bookingError) {
      console.log('❌ Error creating test booking:', bookingError.message);
    } else {
      console.log('✅ Created test booking:', testBooking.id);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkBookings().catch(console.error); 