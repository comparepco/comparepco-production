import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { file_id, approved } = await request.json();
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

    // Update file approval status
    const { data: updatedFile, error: updateError } = await supabase
      .from('file_security')
      .update({
        is_approved: approved,
        approved_by: caller.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', file_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
    }

    // Log the action to admin_activity_logs
    await supabase.from('admin_activity_logs').insert({
      admin_id: caller.id,
      action_type: approved ? 'approve_file' : 'reject_file',
      target_type: 'file',
      target_id: file_id,
      details: {
        file_id: file_id,
        approved: approved,
        ip_address: clientIP
      },
      ip_address: clientIP
    });

    // Create security alert
    await supabase.from('security_alerts').insert({
      alert_type: approved ? 'file_approved' : 'file_rejected',
      severity: 'low',
      message: `File ${approved ? 'approved' : 'rejected'} by ${caller.email}`,
      user_id: updatedFile.uploaded_by,
      ip_address: clientIP,
      category: 'file_security',
      source: 'admin_action'
    });

    return NextResponse.json({ 
      success: true, 
      file: updatedFile,
      action: approved ? 'approved' : 'rejected'
    });

  } catch (error) {
    console.error('Approve file error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 