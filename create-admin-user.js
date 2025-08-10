// Create admin user script
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  console.log('👤 Creating admin user...\n');

  try {
    // Create admin user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@comparepco.co.uk',
      password: 'AdminPass123!',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        role: 'SUPER_ADMIN'
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('User ID:', authUser.user.id);
    console.log('User Email:', authUser.user.email);
    console.log('User Role:', authUser.user.user_metadata?.role);

    // Create admin staff record
    const { data: staffRecord, error: staffError } = await supabase
      .from('admin_staff')
      .insert({
        user_id: authUser.user.id,
        name: 'Admin User',
        email: 'admin@comparepco.co.uk',
        role: 'SUPER_ADMIN',
        department: 'Administration',
        position: 'System Administrator',
        permissions: {
          dashboard: 'manage',
          analytics: 'manage',
          users: 'manage',
          partners: 'manage',
          drivers: 'manage',
          bookings: 'manage',
          fleet: 'manage',
          documents: 'manage',
          payments: 'manage',
          claims: 'manage',
          support: 'manage',
          notifications: 'manage',
          sales: 'manage',
          marketing: 'manage',
          quality: 'manage',
          security: 'manage',
          staff: 'manage',
          settings: 'manage',
          integrations: 'manage',
          workflow: 'manage',
          reports: 'manage'
        },
        sidebar_access: {
          dashboard: true,
          analytics: true,
          users: true,
          partners: true,
          drivers: true,
          bookings: true,
          fleet: true,
          documents: true,
          payments: true,
          claims: true,
          support: true,
          notifications: true,
          sales: true,
          marketing: true,
          quality: true,
          security: true,
          staff: true,
          settings: true,
          integrations: true,
          workflow: true,
          reports: true
        },
        is_active: true,
        is_online: false,
        login_count: 0,
        join_date: new Date().toISOString()
      })
      .select()
      .single();

    if (staffError) {
      console.error('❌ Staff record creation failed:', staffError);
      return;
    }

    console.log('✅ Admin staff record created successfully!');
    console.log('Staff ID:', staffRecord.id);

    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Login Details:');
    console.log('Email: admin@comparepco.co.uk');
    console.log('Password: AdminPass123!');
    console.log('Role: SUPER_ADMIN');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminUser(); 