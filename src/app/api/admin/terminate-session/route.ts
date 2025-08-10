import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { session_id } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify the caller is authenticated
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !caller) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if caller is admin
    const { data: adminStaff } = await supabase
      .from('admin_staff')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    if (!adminStaff || !['SUPER_ADMIN', 'ADMIN'].includes(adminStaff.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 
                    'Unknown';

    // Get session details before terminating
    const { data: session } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Terminate the session
    const { data: terminatedSession, error: updateError } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        terminated_at: new Date().toISOString(),
        terminated_by: caller.id
      })
      .eq('id', session_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to terminate session' }, { status: 500 });
    }

    // Log the action to admin_activity_logs
    await supabase.from('admin_activity_logs').insert({
      admin_id: caller.id,
      action_type: 'terminate_session',
      target_type: 'user_session',
      target_id: session_id,
      details: {
        session_id: session_id,
        user_id: session.user_id,
        ip_address: clientIP
      },
      ip_address: clientIP
    });

    // Create security alert
    await supabase.from('security_alerts').insert({
      alert_type: 'session_terminated',
      severity: 'medium',
      message: `User session terminated by ${caller.email}`,
      user_id: session.user_id,
      ip_address: clientIP,
      category: 'session_management',
      source: 'admin_action'
    });

    return NextResponse.json({ 
      success: true, 
      session: terminatedSession
    });

  } catch (error) {
    console.error('Terminate session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 