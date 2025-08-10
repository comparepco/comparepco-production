const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with direct credentials
const supabaseUrl = "https://yunhdfngdanrxllgtmfc.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bmhkZm5nZGFucnhsbGd0bWZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEwNTg2MSwiZXhwIjoyMDY4NjgxODYxfQ.pg2IxVcUuAjPMiBcVFNMSYUjMdQCdVHhasJTwC640UE";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperAdmin() {
  try {
    console.log('Creating super admin user...');

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'omar@comparepco.co.uk',
      password: 'Ani070317?!',
      email_confirm: true,
      user_metadata: {
        role: 'SUPER_ADMIN',
        name: 'Omar',
        email: 'omar@comparepco.co.uk'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created successfully:', authData.user.id);

    // Create admin staff record
    const { data: staffData, error: staffError } = await supabase
      .from('admin_staff')
      .insert({
        user_id: authData.user.id,
        name: 'Omar',
        email: 'omar@comparepco.co.uk',
        role: 'ADMIN',
        department: 'Management',
        position: 'Super Administrator',
        permissions: {
          view_all: true,
          edit_all: true,
          delete_all: true,
          manage_users: true,
          manage_partners: true,
          manage_bookings: true,
          manage_payments: true,
          manage_reports: true,
          manage_analytics: true,
          manage_support: true,
          manage_system: true
        },
        sidebar_access: {
          dashboard: true,
          analytics: true,
          partners: true,
          drivers: true,
          bookings: true,
          fleet: true,
          documents: true,
          claims: true,
          sales: true,
          marketing: true,
          support: true,
          staff: true,
          settings: true,
          system: true
        },
        is_active: true,
        is_online: false
      })
      .select();

    if (staffError) {
      console.error('Error creating admin staff record:', staffError);
      return;
    }

    console.log('Admin staff record created successfully:', staffData[0].id);

    // Create a notification for the new super admin
    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: authData.user.id,
        type: 'welcome',
        title: 'Welcome to ComparePCO',
        message: 'Your super admin account has been created successfully. You now have full access to the system.',
        is_read: false
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
    } else {
      console.log('Welcome notification created');
    }

    console.log('\n✅ Super Admin created successfully!');
    console.log('📧 Email: omar@comparepco.co.uk');
    console.log('🔑 Password: Ani070317?!');
    console.log('👑 Role: SUPER_ADMIN');
    console.log('🆔 User ID:', authData.user.id);
    console.log('\nYou can now log in to the admin panel with these credentials.');

  } catch (error) {
    console.error('Error creating super admin:', error);
  }
}

createSuperAdmin(); 