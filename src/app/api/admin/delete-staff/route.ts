import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // token handling
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    let accessToken: string | null = session?.access_token ?? null;
    const authHeader = request.headers.get('authorization');
    if (!accessToken && authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.replace('Bearer ', '').trim();
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'No valid session' }, { status: 401 });
    }

    const { data: { user: currentUser }, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
    if (userErr || !currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userRole = (currentUser.user_metadata as any)?.role;
    if (!userRole || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Cookie-based user check removed; access token validation already done

    // Get the staff ID from the URL
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('id');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // First get the staff member to get the user_id
    const { data: staffMember, error: fetchError } = await supabase
      .from('admin_staff')
      .select('user_id, name')
      .eq('id', staffId)
      .single();

    if (fetchError || !staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      staffMember.user_id
    );

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue with staff deletion even if auth deletion fails
    }

    // Delete admin staff record
    const { error: staffError } = await supabaseAdmin
      .from('admin_staff')
      .delete()
      .eq('id', staffId);

    if (staffError) {
      console.error('Staff error:', staffError);
      return NextResponse.json({ error: 'Failed to delete staff record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Staff member ${staffMember.name} deleted successfully`
    });

  } catch (error) {
    console.error('Error deleting staff member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 