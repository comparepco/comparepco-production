import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('All cookies:', allCookies.map(c => `${c.name}=${c.value}`));

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session data:', session);
    console.log('Session error:', sessionError);

    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'No valid session found',
        sessionError: sessionError?.message,
        cookies: allCookies.map(c => c.name)
      }, { status: 401 });
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User data:', user);
    console.log('User error:', userError);

    if (userError || !user) {
      return NextResponse.json({ 
        error: 'User not found',
        userError: userError?.message
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role,
        metadata: user.user_metadata
      },
      session: {
        access_token: session.access_token ? 'present' : 'missing',
        refresh_token: session.refresh_token ? 'present' : 'missing'
      }
    });

  } catch (error) {
    console.error('Error in test login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 