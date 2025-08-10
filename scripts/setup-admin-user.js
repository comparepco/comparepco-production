require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setupAdminUser() {
  try {
    console.log('Setting up admin user...');
    
    // Get the current user (you'll need to replace this with the actual user ID)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found');
      return;
    }
    
    console.log('Current user:', user.email);
    
    // Check if user already exists in admin_staff
    const { data: existingStaff, error: checkError } = await supabase
      .from('admin_staff')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (existingStaff) {
      console.log('User already exists in admin_staff table');
      return;
    }
    
    // Create admin staff record with full permissions
    const adminStaffData = {
      user_id: user.id,
      name: user.user_metadata?.name || user.email,
      email: user.email,
      role: 'ADMIN',
      department: 'Administration',
      position: 'Administrator',
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
      is_online: true
    };
    
    const { data: newStaff, error: insertError } = await supabase
      .from('admin_staff')
      .insert(adminStaffData)
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating admin staff record:', insertError);
      return;
    }
    
    console.log('Admin user setup successfully:', newStaff);
    
    // Update user metadata with ADMIN role
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        role: 'ADMIN',
        accountType: 'admin'
      }
    });
    
    if (updateError) {
      console.error('Error updating user metadata:', updateError);
    } else {
      console.log('User metadata updated with ADMIN role');
    }
    
  } catch (error) {
    console.error('Error setting up admin user:', error);
  }
}

// Run the setup
setupAdminUser(); 