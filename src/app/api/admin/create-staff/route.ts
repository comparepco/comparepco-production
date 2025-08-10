import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Try to get access token from cookie session or Authorization header
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let accessToken: string | null = session?.access_token ?? null;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.replace('Bearer ', '').trim();
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
    }

    const { data: { user: currentUser }, error: userLookupError } = await supabaseAdmin.auth.getUser(accessToken);

    if (userLookupError || !currentUser) {
      console.error('User lookup error:', userLookupError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    let { name, email, password, role, department, position, permissions, sidebar_access } = body;
    sidebar_access = normalizeSidebarAccess(sidebar_access);

    // Validate required fields
    if (!name || !email || !password || !department || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }, { status: 400 });
    }

    // Create user in auth.users using service role client
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create admin staff record (service role bypasses RLS)
    const { error: staffError } = await supabaseAdmin
      .from('admin_staff')
      .insert({
        user_id: authUser.user.id,
        name,
        email,
        role,
        department,
        position,
        permissions,
        sidebar_access,
        is_active: true,
        is_online: false,
        login_count: 0,
        join_date: new Date().toISOString()
      });

    if (staffError) {
      console.error('Staff error:', staffError);
      // Try to delete the auth user if staff creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: 'Failed to create staff record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Staff member ${name} created successfully`,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        name,
        role
      }
    });

  } catch (error) {
    console.error('Error creating staff member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 