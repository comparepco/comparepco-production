import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Check if the current user is an admin
    const userRole = user.user_metadata?.role;
    if (!userRole || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      console.error('User role not authorized:', userRole);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get staff members
    const { data: staff, error: staffError } = await supabase
      .from('admin_staff')
      .select('*')
      .order('created_at', { ascending: false });

    if (staffError) {
      console.error('Staff error:', staffError);
      return NextResponse.json({ error: 'Failed to fetch staff members' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      staff: staff || []
    });

  } catch (error) {
    console.error('Error fetching staff members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 