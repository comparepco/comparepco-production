import { supabase } from '../supabase/client'
import { User, UserRole } from '@/types/shared'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
  isVerified: boolean
}

export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return data
  }

  static async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    
    return profile
  }

  static async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    
    return data
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  static async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  static async verifyEmail(token: string, type: 'signup' | 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type
    })
    if (error) throw error
  }

  static async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data
  }

  static async getUserRole(userId: string): Promise<UserRole> {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) throw error
    
    return data.role
  }

  static async checkPermission(userId: string, requiredRole: UserRole): Promise<boolean> {
    const userRole = await this.getUserRole(userId)
    
    const roleHierarchy: Record<UserRole, number> = {
      USER: 0,
      DRIVER: 1,
      PARTNER_STAFF: 2,
      PARTNER: 3,
      ADMIN_STAFF: 4,
      ADMIN: 5,
      SUPER_ADMIN: 6
    }

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
  }

  static async isPartnerApproved(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('partners')
      .select('isApproved')
      .eq('userId', userId)
      .single()

    if (error) return false
    
    return data?.isApproved || false
  }

  static async isDriverApproved(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('drivers')
      .select('isApproved')
      .eq('userId', userId)
      .single()

    if (error) return false
    
    return data?.isApproved || false
  }
}

// Role-based access control
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ADMIN_STAFF: 'ADMIN_STAFF',
  PARTNER: 'PARTNER',
  PARTNER_STAFF: 'PARTNER_STAFF',
  DRIVER: 'DRIVER',
  USER: 'USER'
} as const

export const PERMISSIONS: Record<UserRole, string[]> = {
  // Super Admin - Full access
  [ROLES.SUPER_ADMIN]: ['*'],
  
  // Admin - Platform management
  [ROLES.ADMIN]: [
    'admin.dashboard',
    'admin.analytics',
    'admin.users',
    'admin.partners',
    'admin.drivers',
    'admin.bookings',
    'admin.fleet',
    'admin.documents',
    'admin.payments',
    'admin.claims',
    'admin.support',
    'admin.settings'
  ],
  
  // Admin Staff - Limited admin access
  [ROLES.ADMIN_STAFF]: [
    'admin.dashboard',
    'admin.analytics',
    'admin.support',
    'admin.staff',
    'admin.notifications'
  ],
  
  // Partner - Business management
  [ROLES.PARTNER]: [
    'partner.dashboard',
    'partner.analytics',
    'partner.fleet',
    'partner.drivers',
    'partner.bookings',
    'partner.finances',
    'partner.documents',
    'partner.claims',
    'partner.operations',
    'partner.management'
  ],
  
  // Partner Staff - Limited access
  [ROLES.PARTNER_STAFF]: [
    'partner.dashboard',
    'partner.bookings',
    'partner.fleet',
    'partner.drivers'
  ],
  
  // Driver - Trip management
  [ROLES.DRIVER]: [
    'driver.dashboard',
    'driver.bookings',
    'driver.trips',
    'driver.earnings',
    'driver.payments',
    'driver.vehicles',
    'driver.claims',
    'driver.support',
    'driver.profile',
    'driver.notifications'
  ],
  
  // User - Basic access
  [ROLES.USER]: [
    'user.dashboard',
    'user.bookings',
    'user.profile'
  ]
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = PERMISSIONS[userRole] || []
  
  // Super admin has all permissions
  if (userRole === ROLES.SUPER_ADMIN) return true
  
  // Check if permission is in role's permission list
  return rolePermissions.includes(permission) || rolePermissions.includes('*')
}

export function getRedirectPath(userRole: UserRole): string {
  switch (userRole) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return '/admin/dashboard'
    case ROLES.PARTNER:
    case ROLES.PARTNER_STAFF:
      return '/partner'
    case ROLES.DRIVER:
      return '/driver'
    case ROLES.USER:
      return '/dashboard'
    default:
      return '/'
  }
}

// Role protection middleware
export function requireRole(requiredRole: UserRole) {
  return async (req: any, res: any, next: any) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const hasPermission = await AuthService.checkPermission(user.id, requiredRole);
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

// Client-side role protection hook
export function useRoleProtection(requiredRole: UserRole) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && (!user || !hasPermission(user.role as UserRole, requiredRole))) {
      router.push('/auth/login');
    }
  }, [user, loading, requiredRole, router]);
  
  return { user, loading };
} 