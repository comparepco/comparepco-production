'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdminProvider } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase/client';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

interface AdminStaff {
  id: string;
  user_id: string;
  is_active: boolean;
  sidebar_access: Record<string, boolean>;
  permissions: Record<string, any>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [staffData, setStaffData] = useState<AdminStaff | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [user, loading]);

  const checkAccess = async () => {
    if (loading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Super admin and admin have full access
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }

    // Check if ADMIN_STAFF has access
    if (user.role === 'ADMIN_STAFF') {
      try {
        const { data, error } = await supabase
          .from('admin_staff')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          console.log('Staff member not found or inactive');
          router.push('/');
          return;
        }

        setStaffData(data);
        setHasAccess(true);
      } catch (error) {
        console.error('Error checking staff access:', error);
        router.push('/');
        return;
      }
    } else {
      // Other roles don't have admin access
      router.push('/');
      return;
    }

    setCheckingAccess(false);
  };

  const handleMenuClick = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect
  }

  return (
    <AdminProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader 
            onMenuClick={handleMenuClick}
            sidebarCollapsed={sidebarCollapsed}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminProvider>
  );
} 