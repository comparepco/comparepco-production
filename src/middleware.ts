import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/compare', '/services', '/about'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If no session and trying to access protected route, redirect to login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If session exists, check role-based access
  if (session) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const userRole = user?.role || 'USER';

    // Admin routes protection
    if (pathname.startsWith('/admin') && !['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'].includes(userRole)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Partner routes protection
    if (pathname.startsWith('/partner') && !['PARTNER', 'PARTNER_STAFF', 'SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Driver routes protection
    if (pathname.startsWith('/driver') && !['DRIVER', 'SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // If logged in user tries to access login/register, redirect to appropriate dashboard
    if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
      if (['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'].includes(userRole)) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      } else if (['PARTNER', 'PARTNER_STAFF'].includes(userRole)) {
        return NextResponse.redirect(new URL('/partner', req.url));
      } else if (userRole === 'DRIVER') {
        return NextResponse.redirect(new URL('/driver', req.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 