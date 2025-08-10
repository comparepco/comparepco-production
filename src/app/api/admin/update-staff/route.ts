import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

export async function PUT(request: NextRequest) {
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
      console.error('User role not authorized:', userRole);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allowedSidebarKeys = ['dashboard','analytics','users','partners','drivers','bookings','fleet','documents','payments','claims','support','notifications','sales','marketing','quality','security','staff','settings','integrations','workflow','reports'];
    const normalizeSidebarAccess = (raw: any): Record<string, boolean> => {
      const normalized: Record<string, boolean> = {};
      allowedSidebarKeys.forEach(k => {
        normalized[k] = !!raw?.[k] || !!raw?.[k.toLowerCase()] || false;
      });
      return normalized;
    };

    // Get the request body
    const body = await request.json();
    let { staffId, name, email, password, role, department, position, permissions, sidebar_access } = body;
    sidebar_access = normalizeSidebarAccess(sidebar_access);

    // Validate required fields
    if (!staffId || !name || !email || !department || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: staffMember, error: fetchError } = await supabaseAdmin
      .from('admin_staff')
      .select('user_id, role')
      .eq('id', staffId)
      .single();

    if (fetchError || !staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Update the auth user if password is provided or role changed
    if (password || role !== staffMember.role) {
      const updateData: any = {
        user_metadata: {
          name,
          role
        }
      };

      // Only update password if provided
      if (password) {
        // Validate password strength
        if (password.length < 8) {
          return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          return NextResponse.json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }, { status: 400 });
        }

        updateData.password = password;
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        staffMember.user_id,
        updateData
      );

      if (authError) {
        console.error('Auth error:', authError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
    }

    // Update admin staff record
    const { error: staffError } = await supabaseAdmin
      .from('admin_staff')
      .update({
        name,
        email,
        role,
        department,
        position,
        permissions,
        sidebar_access,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId);

    if (staffError) {
      console.error('Staff error:', staffError);
      return NextResponse.json({ error: 'Failed to update staff record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Staff member ${name} updated successfully`
    });

  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 