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

    const { user_id, blocked } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Use service role client for admin operations
    const supabaseAdmin = createRouteHandlerClient({ cookies });
    
    if (blocked) {
      // Block user by setting banned_until to a future date
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        user_metadata: { 
          ...user.user_metadata,
          status: 'suspended',
          blocked: true,
          blocked_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error blocking user:', error);
        return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
      }
    } else {
      // Unblock user by removing banned_until and updating metadata
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        user_metadata: { 
          ...user.user_metadata,
          status: 'active',
          blocked: false,
          unblocked_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Error unblocking user:', error);
        return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      action: blocked ? 'blocked' : 'unblocked',
      message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`
    });

  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 