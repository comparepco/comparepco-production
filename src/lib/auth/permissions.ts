import { supabase } from '@/lib/supabase/client';

export type PermissionLevel = 'none' | 'view' | 'edit' | 'delete' | 'manage';

export interface PermissionSet {
  // Dashboard & Analytics
  dashboard: PermissionLevel;
  analytics: PermissionLevel;
  
  // Management
  partners: PermissionLevel;
  drivers: PermissionLevel;
  
  // Operations
  bookings: PermissionLevel;
  fleet: PermissionLevel;
  documents: PermissionLevel;
  payments: PermissionLevel;
  claims: PermissionLevel;
  
  // Support & Communication
  support: PermissionLevel;
  notifications: PermissionLevel;
  
  // Business Management
  sales: PermissionLevel;
  marketing: PermissionLevel;
  quality: PermissionLevel;
  security: PermissionLevel;
  
  // System
  staff: PermissionLevel;
  settings: PermissionLevel;
  integrations: PermissionLevel;
  workflow: PermissionLevel;
  reports: PermissionLevel;
}

export interface SidebarAccess {
  dashboard: boolean;
  analytics: boolean;
  partners: boolean;
  drivers: boolean;
  bookings: boolean;
  fleet: boolean;
  documents: boolean;
  payments: boolean;
  claims: boolean;
  support: boolean;
  notifications: boolean;
  sales: boolean;
  marketing: boolean;
  quality: boolean;
  security: boolean;
  staff: boolean;
  settings: boolean;
  integrations: boolean;
  workflow: boolean;
  reports: boolean;
}

export interface AdminStaff {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'ADMIN_STAFF';
  department: string;
  position: string;
  permissions: PermissionSet;
  sidebar_access: SidebarAccess;
  is_active: boolean;
  is_online: boolean;
  last_login?: string;
  login_count: number;
  join_date: string;
  created_at: string;
  updated_at: string;
}

// Get staff data for current user
export async function getCurrentStaffData(userId: string): Promise<AdminStaff | null> {
  try {
    const { data, error } = await supabase
      .from('admin_staff')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting staff data:', error);
    return null;
  }
}

// Check if user has permission for a specific action
export function hasPermission(
  userRole: string,
  staffData: AdminStaff | null,
  permission: keyof PermissionSet,
  requiredLevel: PermissionLevel = 'view'
): boolean {
  // Super admin has all permissions
  if (userRole === 'SUPER_ADMIN') return true;

  // Admin has most permissions (except super admin specific)
  if (userRole === 'ADMIN') {
    return true;
  }

  // Staff members need specific permission
  if (userRole === 'ADMIN_STAFF' && staffData) {
    const userPermission = staffData.permissions[permission] || 'none';
    return hasPermissionLevel(userPermission, requiredLevel);
  }

  return false;
}

// Check if user has sidebar access
export function hasSidebarAccess(
  userRole: string,
  staffData: AdminStaff | null,
  section: keyof SidebarAccess
): boolean {
  // Super admin and admin have full access
  if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
    return true;
  }

  // Staff members need specific sidebar access
  if (userRole === 'ADMIN_STAFF' && staffData) {
    return staffData.sidebar_access[section] || false;
  }

  return false;
}

// Compare permission levels
function hasPermissionLevel(userLevel: PermissionLevel, requiredLevel: PermissionLevel): boolean {
  const levels: PermissionLevel[] = ['none', 'view', 'edit', 'delete', 'manage'];
  const userIndex = levels.indexOf(userLevel);
  const requiredIndex = levels.indexOf(requiredLevel);
  
  return userIndex >= requiredIndex;
}

// Check if user can perform specific actions
export function canView(userRole: string, staffData: AdminStaff | null, permission: keyof PermissionSet): boolean {
  return hasPermission(userRole, staffData, permission, 'view');
}

export function canEdit(userRole: string, staffData: AdminStaff | null, permission: keyof PermissionSet): boolean {
  return hasPermission(userRole, staffData, permission, 'edit');
}

export function canDelete(userRole: string, staffData: AdminStaff | null, permission: keyof PermissionSet): boolean {
  return hasPermission(userRole, staffData, permission, 'delete');
}

export function canManage(userRole: string, staffData: AdminStaff | null, permission: keyof PermissionSet): boolean {
  return hasPermission(userRole, staffData, permission, 'manage');
}

// Get user's permission level for a specific permission
export function getUserPermissionLevel(
  userRole: string,
  staffData: AdminStaff | null,
  permission: keyof PermissionSet
): PermissionLevel {
  if (userRole === 'SUPER_ADMIN') return 'manage';
  if (userRole === 'ADMIN') return 'manage';
  
  if (userRole === 'ADMIN_STAFF' && staffData) {
    return staffData.permissions[permission] || 'none';
  }
  
  return 'none';
}

// Check if user can access a specific page
export function canAccessPage(
  userRole: string,
  staffData: AdminStaff | null,
  page: string
): boolean {
  const pagePermissions: Record<string, keyof PermissionSet> = {
    'dashboard': 'dashboard',
    'analytics': 'analytics',
    'partners': 'partners',
    'drivers': 'drivers',
    'bookings': 'bookings',
    'fleet': 'fleet',
    'documents': 'documents',
    'payments': 'payments',
    'claims': 'claims',
    'support': 'support',
    'notifications': 'notifications',
    'sales': 'sales',
    'marketing': 'marketing',
    'quality': 'quality',
    'security': 'security',
    'staff': 'staff',
    'settings': 'settings',
    'integrations': 'integrations',
    'workflow': 'workflow',
    'reports': 'reports'
  };

  const permission = pagePermissions[page];
  if (!permission) return false;

  return canView(userRole, staffData, permission);
}

export const getUserPermissions = async (userId: string): Promise<PermissionSet | null> => {
  const staffData = await getCurrentStaffData(userId);
  if (!staffData) return null;
  
  return staffData.permissions as PermissionSet;
};

export const getUserSidebarAccess = async (userId: string): Promise<SidebarAccess | null> => {
  const staffData = await getCurrentStaffData(userId);
  if (!staffData) return null;
  
  return staffData.sidebar_access as SidebarAccess;
}; 