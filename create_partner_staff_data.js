require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPartnerStaffData() {
  try {
    console.log('🔧 Creating partner staff data...');

    // First, let's check if the user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', '7a9833a3-a85f-4bd0-bf54-a4a750778744')
      .single();

    if (userError || !user) {
      console.log('❌ User not found, creating user first...');
      
      // Create the user
      const { error: createUserError } = await supabase
        .from('users')
        .insert({
          id: '7a9833a3-a85f-4bd0-bf54-a4a750778744',
          email: 'partner@test.com',
          firstName: 'John',
          lastName: 'Partner',
          phone: '+447700900000',
          role: 'PARTNER',
          isActive: true
        });

      if (createUserError) {
        console.error('❌ Error creating user:', createUserError);
        return;
      }
      console.log('✅ User created successfully');
    }

    // Check if partner exists
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', '939006e2-b68d-4404-bee8-926d440bcfa3')
      .single();

    if (partnerError || !partner) {
      console.log('❌ Partner not found, creating partner first...');
      
      // Create the partner with basic fields
      const { error: createPartnerError } = await supabase
        .from('partners')
        .insert({
          id: '939006e2-b68d-4404-bee8-926d440bcfa3',
          userId: '7a9833a3-a85f-4bd0-bf54-a4a750778744',
          companyName: 'Test Transport Company',
          businessType: 'transport_company',
          address: '123 Test Street',
          city: 'London',
          state: 'England',
          country: 'United Kingdom',
          postalCode: 'SW1A 1AA',
          phone: '+447700900000',
          website: 'https://testtransport.com',
          description: 'A test transport company',
          isApproved: true,
          isActive: true
        });

      if (createPartnerError) {
        console.error('❌ Error creating partner:', createPartnerError);
        return;
      }
      console.log('✅ Partner created successfully');
    }

    // Check if staff already exists
    const { data: existingStaff, error: staffCheckError } = await supabase
      .from('partner_staff')
      .select('*')
      .eq('user_id', '7a9833a3-a85f-4bd0-bf54-a4a750778744')
      .single();

    if (staffCheckError || !existingStaff) {
      console.log('❌ Staff not found, creating staff record...');
      
      // Create staff record with correct column names
      const { error: createStaffError } = await supabase
        .from('partner_staff')
        .insert({
          partner_id: '939006e2-b68d-4404-bee8-926d440bcfa3',
          user_id: '7a9833a3-a85f-4bd0-bf54-a4a750778744',
          role: 'Manager',
          department: 'Operations',
          position: 'Fleet Manager',
          start_date: '2024-01-01',
          salary: 45000,
          address: '456 Staff Street, London, SW1A 1AA',
          emergency_contact_name: 'Jane Partner',
          emergency_contact_phone: '+447700900001',
          emergency_contact_relationship: 'Spouse',
          notes: 'Experienced fleet manager with 5+ years in transport industry',
          last_login: new Date().toISOString(),
          login_count: 15,
          permissions: {
            canViewFleet: true,
            canManageFleet: true,
            canViewStaff: true,
            canManageStaff: true,
            canViewBookings: true,
            canManageBookings: true,
            canViewClaims: true,
            canManageClaims: false,
            canViewFinancials: true,
            canViewAnalytics: true,
            canManageDocuments: true
          },
          is_active: true
        });

      if (createStaffError) {
        console.error('❌ Error creating staff:', createStaffError);
        return;
      }
      console.log('✅ Staff record created successfully');
    } else {
      console.log('✅ Staff record already exists');
    }

    console.log('✅ Partner staff data setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating partner staff data:', error);
  }
}

createPartnerStaffData(); 