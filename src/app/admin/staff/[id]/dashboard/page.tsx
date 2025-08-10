'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHeadset, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes,
  FaCheck, FaTimes as FaX, FaUserTie, FaUserCog, FaUserShield, FaHandshake,
  FaUserFriends, FaTruck, FaBook, FaChartBar, FaBullhorn, FaCheckCircle,
  FaExclamationTriangle, FaInfoCircle, FaArrowUp, FaArrowDown, FaLock, FaUnlock,
  FaClock, FaUserPlus, FaUserMinus, FaUserCheck, FaUserTimes, FaTachometerAlt,
  FaUsers, FaCalendarCheck, FaExclamationCircle, FaCheckCircle as FaCheckCircleIcon
} from 'react-icons/fa';

interface StaffDashboard {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  permissions: Record<string, any>;
  sidebar_access: Record<string, boolean>;
  is_active: boolean;
  is_online: boolean;
  last_login?: string;
  login_count: number;
  join_date: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalPartners: number;
  totalDrivers: number;
  totalSupportTickets: number;
  activeChats: number;
  pendingDocuments: number;
  recentActivity: any[];
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const { id } = useParams();
  const { 
    canView, 
    canEdit, 
    canDelete, 
    getPermissionLevel,
    isSuperAdmin,
    isAdmin,
    isStaff,
    staffData
  } = usePermissions();

  // Helper functions for permissions
  const getPermissionLevelFor = (permission: string): string => {
    if (isSuperAdmin || isAdmin) return 'manage';
    if (!staffData) return 'none';
    return staffData.permissions[permission as keyof typeof staffData.permissions] || 'none';
  };

  const hasSidebarAccessFor = (section: string): boolean => {
    if (isSuperAdmin || isAdmin) return true;
    if (!staffData) return false;
    return staffData.sidebar_access[section as keyof typeof staffData.sidebar_access] || false;
  };
  
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    totalPartners: 0,
    totalDrivers: 0,
    totalSupportTickets: 0,
    activeChats: 0,
    pendingDocuments: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadStaffData();
      loadDashboardStats();
    }
  }, [id]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      // The usePermissions hook now manages staffData, so we don't need to set it here.
      // setStaffData(data); 
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Load stats based on permissions
      const permissions = getPermissionLevelFor;
      const sidebarAccess = hasSidebarAccessFor;
      
      const statsData: DashboardStats = {
        totalBookings: 0,
        totalRevenue: 0,
        totalPartners: 0,
        totalDrivers: 0,
        totalSupportTickets: 0,
        activeChats: 0,
        pendingDocuments: 0,
        recentActivity: []
      };

      // Load bookings if they have access
      if (canView('bookings')) {
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });
        statsData.totalBookings = bookingsCount || 0;
      }

      // Load revenue if they have access
      if (canView('payments')) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount');
        statsData.totalRevenue = paymentsData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      }

      // Load partners if they have access
      if (canView('partners')) {
        const { count: partnersCount } = await supabase
          .from('partners')
          .select('*', { count: 'exact', head: true });
        statsData.totalPartners = partnersCount || 0;
      }

      // Load support tickets if they have access
      if (canView('support')) {
        const { count: ticketsCount } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        statsData.totalSupportTickets = ticketsCount || 0;

        const { count: chatsCount } = await supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        statsData.activeChats = chatsCount || 0;
      }

      // Load documents if they have access
      if (canView('documents')) {
        const { count: docsCount } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        statsData.pendingDocuments = docsCount || 0;
      }

      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Staff Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400">The requested staff member could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaUserCog className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                {staffData.name}'s Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {staffData.department} • {staffData.position} • {staffData.role}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  staffData.is_online
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {staffData.is_online ? 'Online' : 'Offline'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  staffData.is_active
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {staffData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <FaUser className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{staffData.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{staffData.email}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Role & Department</h4>
                <p className="text-sm text-gray-900 dark:text-white">{staffData.role}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{staffData.department} • {staffData.position}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account Info</h4>
                <p className="text-sm text-gray-900 dark:text-white">Joined: {new Date(staffData.join_date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Logins: {staffData.login_count}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {canView('bookings') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaCalendarCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
                </div>
              </div>
            </div>
          )}

          {canView('payments') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaMoneyBillWave className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">£{(stats.totalRevenue / 1000).toFixed(1)}k</p>
                </div>
              </div>
            </div>
          )}

          {canView('partners') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaHandshake className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Partners</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPartners}</p>
                </div>
              </div>
            </div>
          )}

          {canView('support') && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaHeadset className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Support Tickets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSupportTickets}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Permissions & Access */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Permissions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FaLock className="w-5 h-5 mr-2" />
                Permissions
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(staffData?.permissions || {}).map(([permission, level]) => (
                  <div key={permission} className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {permission.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      level === 'manage' ? 'bg-green-100 text-green-800' :
                      level === 'edit' ? 'bg-blue-100 text-blue-800' :
                      level === 'view' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Access */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FaCog className="w-5 h-5 mr-2" />
                Sidebar Access
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(staffData?.sidebar_access || {}).map(([section, hasAccess]) => (
                  <div key={section} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                      {section.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hasAccess 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {hasAccess ? 'Access' : 'No Access'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FaTachometerAlt className="w-5 h-5 mr-2" />
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {canView('bookings') && (
                <a href="/admin/bookings" className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                  <FaCalendarCheck className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">View Bookings</span>
                </a>
              )}

              {canView('partners') && (
                <a href="/admin/partners" className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                  <FaHandshake className="w-5 h-5 text-orange-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Partners</span>
                </a>
              )}

              {canView('support') && (
                <a href="/admin/support" className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                  <FaHeadset className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Support Dashboard</span>
                </a>
              )}

              {canView('analytics') && (
                <a href="/admin/analytics" className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                  <FaChartBar className="w-5 h-5 text-green-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">View Analytics</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 