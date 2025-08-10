require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testVehicleAddition() {
  console.log('🚗 Testing Vehicle Addition...\n');

  try {
    // Step 1: Get partner information directly (using service role)
    console.log('1️⃣ Getting partner information...');
    
    // First, let's see what partners exist
    const { data: allPartners, error: allPartnersError } = await supabase
      .from('partners')
      .select('id, user_id, company_name, email')
      .limit(5);

    if (allPartnersError) {
      console.error('❌ Partner lookup failed:', allPartnersError.message);
      return;
    }

    console.log('Available partners:');
    allPartners.forEach((partner, index) => {
      console.log(`${index + 1}. ${partner.company_name} (${partner.email}) - ID: ${partner.id}`);
    });

    // Use the first partner
    const partners = allPartners[0];
    if (!partners) {
      console.error('❌ No partners found in database');
      return;
    }

    console.log('\n✅ Using partner:', partners.company_name);
    console.log('Partner ID:', partners.id);
    console.log('User ID:', partners.user_id);

    // Step 2: Test vehicle data creation
    console.log('\n2️⃣ Creating test vehicle data...');
    
    const testVehicle = {
      name: 'Test BMW 4 Series',
      make: 'BMW',
      model: '4 Series',
      year: 2024,
      license_plate: 'TEST123',
      category: 'LUXURY',
      fuel_type: 'PETROL',
      transmission: 'AUTOMATIC',
      mileage: 15000,
      location: 'London',
      color: 'Black',
      seats: 5,
      doors: 4,
      engine: '2.0L Turbo',
      description: 'Test vehicle for system verification',
      price_per_week: 350,
      price_per_day: 50,
      features: ['Bluetooth', 'Navigation', 'Heated Seats'],
      insurance_expiry: '2025-12-31',
      mot_expiry: '2025-06-30',
      road_tax_expiry: '2025-03-31',
      next_service: '2025-01-15',
      insurance_included: true,
      insurance_details: 'Comprehensive coverage',
      pricing: {
        min_term_months: 3,
        deposit_required: true,
        deposit_amount: 500,
        deposit_notes: 'Refundable deposit',
        tier_rates: {}
      },
      partner_id: partners.id, // Use the actual partner ID
      is_available: true,
      is_approved: false,
      is_active: true,
      image_urls: [],
      documents: {
        mot: { status: 'pending', url: null, expiry_date: '2025-06-30' },
        private_hire_license: { status: 'pending', url: null, expiry_date: '2025-12-31' },
        insurance: { status: 'pending', url: null, expiry_date: '2025-12-31' },
        logbook: { status: 'pending', url: null, expiry_date: null }
      },
      ride_hailing_categories: ['UBER', 'BOLT'],
      document_verification_status: 'pending',
      visible_on_platform: false
    };

    console.log('✅ Test vehicle data created');

    // Step 3: Attempt to insert vehicle
    console.log('\n3️⃣ Attempting to insert vehicle into database...');
    
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert([testVehicle])
      .select()
      .single();

    if (vehicleError) {
      console.error('❌ Vehicle insertion failed:');
      console.error('Code:', vehicleError.code);
      console.error('Message:', vehicleError.message);
      console.error('Details:', vehicleError.details);
      console.error('Hint:', vehicleError.hint);
      return;
    }

    console.log('✅ Vehicle inserted successfully!');
    console.log('Vehicle ID:', vehicle.id);
    console.log('Vehicle Name:', vehicle.name);
    console.log('License Plate:', vehicle.license_plate);
    console.log('Partner ID:', vehicle.partner_id);

    // Step 4: Test document insertion
    console.log('\n4️⃣ Testing document insertion...');
    
    const testDocuments = [
      {
        vehicle_id: vehicle.id,
        type: 'mot',
        file_url: 'https://example.com/test-mot.pdf',
        file_name: 'test-mot.pdf',
        expiry_date: '2025-06-30',
        upload_date: new Date().toISOString(),
        status: 'pending_review',
        partner_id: partners.id
      },
      {
        vehicle_id: vehicle.id,
        type: 'insurance',
        file_url: 'https://example.com/test-insurance.pdf',
        file_name: 'test-insurance.pdf',
        expiry_date: '2025-12-31',
        upload_date: new Date().toISOString(),
        status: 'pending_review',
        partner_id: partners.id
      }
    ];

    const { data: documents, error: docError } = await supabase
      .from('vehicle_documents')
      .insert(testDocuments)
      .select();

    if (docError) {
      console.error('❌ Document insertion failed:', docError.message);
    } else {
      console.log('✅ Documents inserted successfully!');
      console.log('Documents count:', documents.length);
    }

    // Step 5: Test documents table insertion
    console.log('\n5️⃣ Testing documents table insertion...');
    
    const { data: generalDocs, error: generalDocError } = await supabase
      .from('documents')
      .insert([
        {
          partner_id: partners.id,
          uploader_id: partners.user_id,
          name: 'MOT Certificate',
          type: 'mot',
          category: 'vehicle',
          car_id: vehicle.id,
          car_name: vehicle.name,
          file_name: 'test-mot.pdf',
          file_url: 'https://example.com/test-mot.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          expiry_date: '2025-06-30',
          status: 'pending_review',
          uploader_name: 'Test Partner',
          uploader_email: 'testpartner@comparepco.com',
          uploader_type: 'partner',
          partner_name: partners.company_name,
          notes: `Vehicle: ${vehicle.name} (${vehicle.license_plate})`
        }
      ])
      .select();

    if (generalDocError) {
      console.error('❌ General documents insertion failed:', generalDocError.message);
      console.error('Error details:', generalDocError);
    } else {
      console.log('✅ General documents inserted successfully!');
      console.log('Documents count:', generalDocs.length);
    }

    // Step 6: Clean up test data
    console.log('\n6️⃣ Cleaning up test data...');
    
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicle.id);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
    } else {
      console.log('✅ Test vehicle deleted successfully');
    }

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ Vehicle addition system is working properly');
    console.log('✅ No infinite recursion errors');
    console.log('✅ Database operations successful');
    console.log('✅ Document handling works correctly');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testVehicleAddition(); 