import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || (user.user_metadata?.role !== 'SUPER_ADMIN' && user.user_metadata?.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { user_id, role } = await request.json();

    if (!user_id || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF', 'PARTNER', 'DRIVER', 'USER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent role escalation unless SUPER_ADMIN
    if (user.user_metadata?.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only SUPER_ADMIN can assign SUPER_ADMIN role' }, { status: 403 });
    }

    // Use service role client for admin operations
    const supabaseAdmin = createRouteHandlerClient({ cookies });
    
    // Get target user's current metadata
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (getUserError || !targetUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user role
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      user_metadata: { 
        ...targetUser.user.user_metadata,
        role: role,
        role_updated_at: new Date().toISOString(),
        role_updated_by: user.id
      }
    });

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Update admin_staff table if role is admin-related
    if (['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'].includes(role)) {
      try {
        // Check if user exists in admin_staff
        const { data: existingStaff } = await supabaseAdmin
          .from('admin_staff')
          .select('*')
          .eq('user_id', user_id)
          .single();

        if (existingStaff) {
          // Update existing record
          await supabaseAdmin
            .from('admin_staff')
            .update({ 
              role: role,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user_id);
        } else {
          // Create new record
          await supabaseAdmin
            .from('admin_staff')
            .insert({
              user_id: user_id,
              role: role,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      } catch (staffError) {
        console.warn('Admin staff update error (non-critical):', staffError);
        // Continue even if admin_staff update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `User role updated to ${role}`
    });

  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 