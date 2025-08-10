const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndCreatePartner() {
  try {
    console.log('🔍 Checking existing partners...');
    
    // Check existing partners
    const { data: existingPartners, error: fetchError } = await supabase
      .from('partners')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching partners:', fetchError);
      return;
    }
    
    console.log('📊 Found partners:', existingPartners?.length || 0);
    if (existingPartners && existingPartners.length > 0) {
      existingPartners.forEach(partner => {
        console.log(`- ${partner.company_name} (${partner.email}) - Status: ${partner.status}`);
      });
    }

    // Check existing users
    console.log('\n🔍 Checking existing users...');
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'PARTNER');
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log('📊 Found partner users:', existingUsers?.length || 0);
    if (existingUsers && existingUsers.length > 0) {
      existingUsers.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Create a new partner if none exist
    if (!existingPartners || existingPartners.length === 0) {
      console.log('\n➕ Creating a new partner...');
      
      // Create user first
      const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
        email: 'demo-partner@example.com',
        password: 'demopassword123',
        email_confirm: true,
        user_metadata: {
          name: 'Demo Partner Company',
          role: 'PARTNER'
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return;
      }

      console.log('✅ User created:', user.id);

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: 'demo-partner@example.com',
          name: 'Demo Partner Company',
          role: 'PARTNER',
          phone: '+44123456789',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userError) {
        console.error('User profile error:', userError);
        return;
      }

      console.log('✅ User profile created');

      // Create partner record
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          id: user.id,
          company_name: 'Demo Partner Company',
          email: 'demo-partner@example.com',
          phone: '+44123456789',
          status: 'pending_verification',
          business_type: 'transport_company',
          company_registration_number: 'DEMO123456',
          address: '123 Demo Street, London, SW1A 1AA, UK',
          operating_areas: ['Central London', 'North London'],
          vehicle_types: ['Standard Cars', 'Premium Cars'],
          years_in_business: 3,
          fleet_size: 5,
          payment_method: 'bank_transfer',
          bank_details: {
            account_name: 'Demo Partner Company',
            account_number: '12345678',
            sort_code: '12-34-56'
          },
          documents: {
            businessLicense: {
              status: 'pending_review',
              url: 'https://example.com/business-license.pdf',
              uploaded_at: new Date().toISOString()
            },
            insuranceCertificate: {
              status: 'pending_review',
              url: 'https://example.com/insurance.pdf',
              uploaded_at: new Date().toISOString()
            },
            operatorLicense: {
              status: 'pending_review',
              url: 'https://example.com/operator-license.pdf',
              uploaded_at: new Date().toISOString()
            }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (partnerError) {
        console.error('Partner record error:', partnerError);
        return;
      }

      console.log('✅ Partner record created');
      console.log('\n🎉 Demo partner created successfully!');
      console.log('📧 Email: demo-partner@example.com');
      console.log('🔑 Password: demopassword123');
      console.log('🏢 Company: Demo Partner Company');
      console.log('📊 Status: pending_verification');
    } else {
      console.log('\n✅ Partners already exist in the database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreatePartner(); 