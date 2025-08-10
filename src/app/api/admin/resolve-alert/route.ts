import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { alert_id } = await request.json();
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

    // Update alert as resolved
    const { data: updatedAlert, error: updateError } = await supabase
      .from('security_alerts')
      .update({
        resolved: true,
        resolved_by: caller.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alert_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
    }

    // Log the action to admin_activity_logs
    await supabase.from('admin_activity_logs').insert({
      admin_id: caller.id,
      action_type: 'resolve_alert',
      target_type: 'security_alert',
      target_id: alert_id,
      details: {
        alert_id: alert_id,
        resolved: true,
        ip_address: clientIP
      },
      ip_address: clientIP
    });

    return NextResponse.json({ 
      success: true, 
      alert: updatedAlert
    });

  } catch (error) {
    console.error('Resolve alert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 