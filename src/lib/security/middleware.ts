import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Security Middleware - Central Access Control
export async function securityMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const url = request.nextUrl.clone();
  const path = url.pathname;

  try {
    // Skip security checks for public routes
    if (isPublicRoute(path)) {
      return NextResponse.next();
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      await logSecurityEvent('access_denied', 'no_token', { path });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      await logSecurityEvent('access_denied', 'invalid_token', { path, error: error?.message });
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check token expiration
    if (user.user_metadata?.exp && Date.now() > user.user_metadata.exp * 1000) {
      await logSecurityEvent('access_denied', 'expired_token', { path, userId: user.id });
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    // Rate limiting
    const rateLimitResult = await checkRateLimit(user.id, path);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent('rate_limit_exceeded', 'api_limit', { path, userId: user.id });
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Role-based access control
    const hasAccess = await checkRoleAccess(user, path);
    if (!hasAccess) {
      await logSecurityEvent('access_denied', 'insufficient_permissions', { path, userId: user.id });
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Log successful access
    await logSecurityEvent('access_granted', 'success', { 
      path, 
      userId: user.id,
      responseTime: Date.now() - startTime 
    });

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.user_metadata?.role || 'user');
    
    return response;

  } catch (error) {
    const err = error as Error;
    console.error('Security middleware error:', err);
    await logSecurityEvent('middleware_error', 'system_error', { path, error: err.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Check if route is public
function isPublicRoute(path: string): boolean {
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/api/auth',
    '/api/webhooks',
    '/_next',
    '/favicon.ico'
  ];

  return publicRoutes.some(route => path.startsWith(route));
}

// Rate limiting check
async function checkRateLimit(userId: string, endpoint: string): Promise<{ allowed: boolean }> {
  try {
    const windowMinutes = 1;
    const maxRequests = 100;
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    // Get current request count
    const { data: currentRequests } = await supabase
      .from('rate_limits')
      .select('request_count')
      .eq('identifier', userId)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    const requestCount = currentRequests?.request_count || 0;

    if (requestCount >= maxRequests) {
      return { allowed: false };
    }

    // Update or create rate limit record
    if (currentRequests) {
      await supabase
        .from('rate_limits')
        .update({ request_count: requestCount + 1 })
        .eq('identifier', userId)
        .eq('endpoint', endpoint);
    } else {
      await supabase.from('rate_limits').insert({
        identifier: userId,
        endpoint,
        request_count: 1
      });
    }

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true }; // Fail open
  }
}

// Role-based access control
async function checkRoleAccess(user: any, path: string): Promise<boolean> {
  try {
    const userRole = user.user_metadata?.role || 'user';

    // Admin routes
    if (path.startsWith('/admin')) {
      if (!['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'].includes(userRole)) {
        return false;
      }

      // Check if user is in admin_staff table
      const { data: adminStaff } = await supabase
        .from('admin_staff')
        .select('role, permissions')
        .eq('user_id', user.id)
        .single();

      if (!adminStaff) {
        return false;
      }

      // Check specific permissions for sensitive routes
      if (path.startsWith('/admin/security')) {
        return ['SUPER_ADMIN', 'ADMIN'].includes(adminStaff.role);
      }

      if (path.startsWith('/admin/staff')) {
        return ['SUPER_ADMIN', 'ADMIN'].includes(adminStaff.role);
      }
    }

    // Partner routes
    if (path.startsWith('/partner')) {
      return userRole === 'PARTNER';
    }

    // Driver routes
    if (path.startsWith('/driver')) {
      return userRole === 'DRIVER';
    }

    return true;
  } catch (error) {
    console.error('Role access check failed:', error);
    return false;
  }
}

// Log security events
async function logSecurityEvent(eventType: string, subType: string, details: any) {
  try {
    await supabase.from('system_logs').insert({
      level: eventType.includes('denied') || eventType.includes('error') ? 'warn' : 'info',
      message: `Security event: ${eventType} - ${subType}`,
      module: 'security_middleware',
      context: details
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Session management
export async function validateSession(token: string): Promise<{ valid: boolean; user?: any }> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { valid: false };
    }

    // Check if session is still active
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('is_active, expires_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!sessions || new Date() > new Date(sessions.expires_at)) {
      return { valid: false };
    }

    return { valid: true, user };
  } catch (error) {
    console.error('Session validation failed:', error);
    return { valid: false };
  }
}

// File upload security
export async function validateFileUpload(file: File): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Get security settings
    const { data: settings } = await supabase
      .from('security_settings')
      .select('setting_value')
      .eq('setting_key', 'file_security')
      .single();

    const fileSettings = settings?.setting_value || {
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
      blocked_extensions: ['.exe', '.js', '.bat', '.sh'],
      max_file_size_mb: 5
    };

    // Check file size
    if (file.size > fileSettings.max_file_size_mb * 1024 * 1024) {
      return { valid: false, reason: `File size exceeds ${fileSettings.max_file_size_mb}MB limit` };
    }

    // Check MIME type
    if (!fileSettings.allowed_mime_types.includes(file.type)) {
      return { valid: false, reason: `File type ${file.type} not allowed` };
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (fileSettings.blocked_extensions.includes(extension)) {
      return { valid: false, reason: `File extension ${extension} is blocked` };
    }

    return { valid: true };
  } catch (error) {
    console.error('File validation failed:', error);
    return { valid: false, reason: 'File validation failed' };
  }
} 