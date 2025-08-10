import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function getCurrentUser(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  // 1) cookie-based session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // 2) bearer token header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    if (userData?.user) return userData.user;
  }
  return null;
}

function checkRole(user: any) {
  const role = user?.user_metadata?.role;
  return role && ['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'].includes(role);
}

// -----------------------------------------------------------------------------
// POST   → update / create online session record
// GET    → fetch counts + current user status
// DELETE → mark current user offline
// -----------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
  }
  if (!checkRole(currentUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { status = 'online', sessionId, ipAddress, userAgent } = await request.json();
  const finalSessionId = sessionId || `${currentUser.id}-${Date.now()}`;
  const userRole = currentUser.user_metadata?.role;

  const { error } = await supabaseAdmin.rpc('update_admin_online_status', {
    p_user_id: currentUser.id,
    p_user_role: userRole,
    p_online_status: status,
    p_session_id: finalSessionId,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
  });

  if (error) {
    console.error('RPC update_admin_online_status failed:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }

  return NextResponse.json({ success: true, sessionId: finalSessionId, status });
}

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
  }
  if (!checkRole(currentUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data: onlineCount, error: countErr } = await supabaseAdmin.rpc('get_online_admin_count');
  if (countErr) {
    console.error(countErr);
    return NextResponse.json({ error: 'Failed to get counts' }, { status: 500 });
  }

  const { data: userStatus } = await supabaseAdmin
    .from('admin_sessions')
    .select('online_status, last_activity, session_id')
    .eq('user_id', currentUser.id)
    .eq('is_active', true)
    .single();

  return NextResponse.json({
    onlineCount: onlineCount?.[0] || { total_online: 0, admin_online: 0, support_online: 0 },
    userStatus: userStatus ?? { online_status: 'offline', last_activity: null, session_id: null },
  });
}

export async function DELETE(request: NextRequest) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
  }
  if (!checkRole(currentUser)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { error } = await supabaseAdmin.rpc('mark_admin_offline', {
    p_user_id: currentUser.id,
  });
  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to mark offline' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
