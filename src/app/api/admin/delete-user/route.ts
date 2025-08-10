import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function DELETE(request: NextRequest) {
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

    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent self-deletion
    if (user_id === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Use service role client for admin operations
    const supabaseAdmin = createRouteHandlerClient({ cookies });
    
    // Delete user from Supabase Auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Clean up related data (optional - depending on your requirements)
    try {
      // Delete from admin_staff if exists
      await supabaseAdmin.from('admin_staff').delete().eq('user_id', user_id);
      
      // Delete from users table if exists
      await supabaseAdmin.from('users').delete().eq('id', user_id);
      
      // Delete user sessions
      await supabaseAdmin.from('user_sessions').delete().eq('user_id', user_id);
      
      // Delete user action logs
      await supabaseAdmin.from('user_action_logs').delete().eq('user_id', user_id);
      
    } catch (cleanupError) {
      console.warn('Cleanup error (non-critical):', cleanupError);
      // Continue even if cleanup fails - user is already deleted from auth
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 