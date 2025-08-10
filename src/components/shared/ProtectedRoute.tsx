'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionSet } from '@/lib/auth/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof PermissionSet;
  requiredLevel?: 'view' | 'edit' | 'delete' | 'manage';
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredLevel = 'view',
  fallback = <div className="p-8 text-center">Access Denied</div>
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const { checkPermission, isSuperAdmin, isAdmin } = usePermissions();

  // If no user, show access denied
  if (!user) {
    return <>{fallback}</>;
  }

  // Super admin and admin have access to everything
  if (isSuperAdmin || isAdmin) {
    return <>{children}</>;
  }

  // If no specific permission required, allow access
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // Check specific permission
  if (requiredPermission && !checkPermission(requiredPermission, requiredLevel)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 