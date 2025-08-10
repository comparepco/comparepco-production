import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getCurrentStaffData, 
  hasPermission, 
  hasSidebarAccess, 
  canView, 
  canEdit, 
  canDelete, 
  canManage,
  getUserPermissionLevel,
  canAccessPage,
  getUserPermissions,
  getUserSidebarAccess,
  type AdminStaff,
  type PermissionLevel,
  type SidebarAccess
} from '@/lib/auth/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const [staffData, setStaffData] = useState<AdminStaff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffData();
  }, [user]);

  const loadStaffData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Load staff data for all admin roles
    if (user.role === 'ADMIN_STAFF' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      try {
        const data = await getCurrentStaffData(user.id);
        setStaffData(data);
      } catch (error) {
        console.error('Error loading staff data:', error);
      }
    }

    setLoading(false);
  };

  const checkPermission = (permission: keyof AdminStaff['permissions'], requiredLevel: PermissionLevel = 'view') => {
    return hasPermission(user?.role || '', staffData, permission, requiredLevel);
  };

  const checkSidebarAccess = (section: keyof SidebarAccess) => {
    return hasSidebarAccess(user?.role || '', staffData, section);
  };

  const canViewPermission = (permission: keyof AdminStaff['permissions']) => {
    return canView(user?.role || '', staffData, permission);
  };

  const canEditPermission = (permission: keyof AdminStaff['permissions']) => {
    return canEdit(user?.role || '', staffData, permission);
  };

  const canDeletePermission = (permission: keyof AdminStaff['permissions']) => {
    return canDelete(user?.role || '', staffData, permission);
  };

  const canManagePermission = (permission: keyof AdminStaff['permissions']) => {
    return canManage(user?.role || '', staffData, permission);
  };

  const getPermissionLevel = (permission: keyof AdminStaff['permissions']): PermissionLevel => {
    return getUserPermissionLevel(user?.role || '', staffData, permission);
  };

  const canAccessPagePermission = (page: string) => {
    return canAccessPage(user?.role || '', staffData, page);
  };

  const getAllPermissions = (): Record<string, any> => {
    if (!user || !staffData) return {};
    return getUserPermissions(user.id) || {};
  };

  return {
    loading,
    staffData,
    checkPermission,
    checkSidebarAccess,
    canView: canViewPermission,
    canEdit: canEditPermission,
    canDelete: canDeletePermission,
    canManage: canManagePermission,
    getPermissionLevel,
    canAccessPage: canAccessPagePermission,
    getAllPermissions,
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isAdmin: user?.role === 'ADMIN',
    isStaff: user?.role === 'ADMIN_STAFF'
  };
} 