'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaTachometerAlt, FaChartBar, FaUsers, FaHandshake, FaUserTie, FaCalendarCheck,
  FaFileAlt, FaCreditCard, FaExclamationTriangle, FaHeadset, FaBell, FaCog,
  FaShieldAlt, FaCogs, FaPlug, FaUserCog, FaFileAlt as FaReports, FaBullhorn,
  FaCheckCircle, FaMoneyBillWave, FaTruck, FaChevronDown, FaChevronRight,
  FaSignOutAlt, FaUser, FaCog as FaSettings, FaCrown
} from 'react-icons/fa';

interface SidebarAccess {
  dashboard: boolean;
  analytics: boolean;
  users: boolean;
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

interface AdminStaff {
  id: string;
  user_id: string;
  sidebar_access: SidebarAccess;
  permissions: any;
}

// Organized sidebar items with proper groupings
const sidebarItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: FaTachometerAlt,
    color: 'text-blue-600',
    category: 'main'
  },
  {
    key: 'analytics',
    label: 'Analytics',
    href: '/admin/analytics',
    icon: FaChartBar,
    color: 'text-purple-600',
    category: 'analytics',
    subItems: [
      { label: 'Overview', href: '/admin/analytics' },
      { label: 'Drivers', href: '/admin/analytics/drivers' },
      { label: 'Bookings', href: '/admin/analytics/bookings' },
      { label: 'Revenue', href: '/admin/analytics/revenue' },
      { label: 'Fleet', href: '/admin/analytics/fleet' },
      { label: 'Partners', href: '/admin/analytics/partners' },
      { label: 'Performance', href: '/admin/analytics/performance' },
      { label: 'Market Intelligence', href: '/admin/analytics/market-intelligence' },
      { label: 'Custom Reports', href: '/admin/analytics/custom-reports' },
      { label: 'Business Intelligence', href: '/admin/analytics/business-intelligence' },
      { label: 'Reports', href: '/admin/analytics/reports' }
    ]
  },
  {
    key: 'partners',
    label: 'Partners',
    href: '/admin/partners',
    icon: FaHandshake,
    color: 'text-orange-600',
    category: 'management',
    subItems: [
      { label: 'Overview', href: '/admin/partners' },
      { label: 'Add Partner', href: '/admin/partners/add' },
      { label: 'Pending', href: '/admin/partners/pending' }
    ]
  },
  {
    key: 'drivers',
    label: 'Drivers',
    href: '/admin/drivers',
    icon: FaUserTie,
    color: 'text-indigo-600',
    category: 'management',
    subItems: [
      { label: 'Overview', href: '/admin/drivers' },
      { label: 'Add Driver', href: '/admin/drivers/add' },
      { label: 'Create Driver', href: '/admin/drivers/create' },
      { label: 'Pending', href: '/admin/drivers/pending' },
      { label: 'Bookings', href: '/admin/drivers/bookings' },
      { label: 'Performance', href: '/admin/drivers/performance' },
      { label: 'Verification', href: '/admin/drivers/verification' },
      { label: 'Analytics', href: '/admin/drivers/analytics' }
    ]
  },
  {
    key: 'bookings',
    label: 'Bookings',
    href: '/admin/bookings',
    icon: FaCalendarCheck,
    color: 'text-red-600',
    category: 'operations',
    subItems: [
      { label: 'Overview', href: '/admin/bookings' },
      { label: 'Active', href: '/admin/bookings/active' },
      { label: 'Pending', href: '/admin/bookings/pending' },
      { label: 'Analytics', href: '/admin/bookings/analytics' }
    ]
  },
  {
    key: 'fleet',
    label: 'Fleet',
    href: '/admin/fleet',
    icon: FaTruck,
    color: 'text-yellow-600',
    category: 'operations',
    subItems: [
      { label: 'Dashboard', href: '/admin/fleet/dashboard' },
      { label: 'Vehicles', href: '/admin/fleet/vehicles' },
      { label: 'Maintenance', href: '/admin/fleet/maintenance' },
      { label: 'Pricing', href: '/admin/fleet/pricing' },
      { label: 'Claims', href: '/admin/fleet/claims' },
      { label: 'Availability', href: '/admin/fleet/availability' },
      { label: 'Approval', href: '/admin/fleet/approval' },
      { label: 'Documents', href: '/admin/fleet/documents' },
      { label: 'Analytics', href: '/admin/fleet/analytics' }
    ]
  },
  {
    key: 'documents',
    label: 'Documents',
    href: '/admin/documents',
    icon: FaFileAlt,
    color: 'text-gray-600',
    category: 'operations',
    subItems: [
      { label: 'Overview', href: '/admin/documents' },
      { label: 'Drivers', href: '/admin/documents/drivers' },
      { label: 'Partners', href: '/admin/documents/partners' },
      { label: 'Expiring', href: '/admin/documents/expiring' },
      { label: 'Review', href: '/admin/documents/review' }
    ]
  },
  {
    key: 'payments',
    label: 'Payments',
    href: '/admin/payments',
    icon: FaCreditCard,
    color: 'text-green-600',
    category: 'finance'
  },
  {
    key: 'support',
    label: 'Support',
    href: '/admin/support',
    icon: FaHeadset,
    color: 'text-blue-600',
    category: 'support',
    subItems: [
      { label: 'Overview', href: '/admin/support' },
      { label: 'Tickets', href: '/admin/support/tickets' },
      { label: 'Chat', href: '/admin/support/chat' },
      { label: 'Staff', href: '/admin/support/staff' },
      { label: 'Analytics', href: '/admin/support/analytics' },
      { label: 'Quick Responses', href: '/admin/support/quick-responses' },
      { label: 'Notifications', href: '/admin/support/notifications' }
    ]
  },
  {
    key: 'notifications',
    label: 'Notifications',
    href: '/admin/notifications',
    icon: FaBell,
    color: 'text-yellow-600',
    category: 'communications'
  },
  {
    key: 'sales',
    label: 'Sales',
    href: '/admin/sales',
    icon: FaMoneyBillWave,
    color: 'text-green-600',
    category: 'business',
    subItems: [
      { label: 'Overview', href: '/admin/sales' },
      { label: 'Commission', href: '/admin/sales/commission' },
      { label: 'Payouts', href: '/admin/sales/payouts' },
      { label: 'Pricing', href: '/admin/sales/pricing' },
      { label: 'Reports', href: '/admin/sales/reports' },
      { label: 'Revenue', href: '/admin/sales/revenue' }
    ]
  },
  {
    key: 'marketing',
    label: 'Marketing',
    href: '/admin/marketing',
    icon: FaBullhorn,
    color: 'text-purple-600',
    category: 'business',
    subItems: [
      { label: 'Overview', href: '/admin/marketing' },
      { label: 'Campaigns', href: '/admin/marketing/campaigns' },
      { label: 'Email', href: '/admin/marketing/email' },
      { label: 'Promotions', href: '/admin/marketing/promotions' },
      { label: 'Referral', href: '/admin/marketing/referral' }
    ]
  },
  {
    key: 'quality',
    label: 'Quality',
    href: '/admin/quality',
    icon: FaCheckCircle,
    color: 'text-green-600',
    category: 'business'
  },
  {
    key: 'security',
    label: 'Security',
    href: '/admin/security',
    icon: FaShieldAlt,
    color: 'text-red-600',
    category: 'system',
    subItems: [
      { label: 'Dashboard', href: '/admin/security' },
      { label: 'Access Control', href: '/admin/security/access-control' },
      { label: 'Audit Logs', href: '/admin/security/audit-logs' },
      { label: 'Compliance', href: '/admin/security/compliance' },
      { label: 'Document Access', href: '/admin/security/document-access' },
      { label: 'Fraud Detection', href: '/admin/security/fraud-detection' }
    ]
  },
  {
    key: 'staff',
    label: 'Staff',
    href: '/admin/staff',
    icon: FaUserCog,
    color: 'text-blue-600',
    category: 'system'
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: FaSettings,
    color: 'text-gray-600',
    category: 'system'
  },
  {
    key: 'integrations',
    label: 'Integrations',
    href: '/admin/integrations',
    icon: FaPlug,
    color: 'text-indigo-600',
    category: 'system'
  },
  {
    key: 'workflow',
    label: 'Workflow',
    href: '/admin/workflow',
    icon: FaCogs,
    color: 'text-orange-600',
    category: 'system'
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/admin/reports',
    icon: FaReports,
    color: 'text-gray-600',
    category: 'system'
  }
];

// Category labels
const categoryLabels = {
  main: 'Main',
  analytics: 'Analytics & Reports',
  management: 'User Management',
  operations: 'Operations',
  finance: 'Finance',
  support: 'Support & Communication',
  communications: 'Communications',
  business: 'Business',
  system: 'System & Administration'
};

export default function AdminSidebar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [staffData, setStaffData] = useState<AdminStaff | null>(null);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user?.role === 'ADMIN_STAFF') {
      loadStaffData();
    }
    loadBadgeCounts();
    setupRealtimeSubscriptions();
  }, [user]);

  const loadStaffData = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setStaffData(data);
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  };

  const loadBadgeCounts = async () => {
    try {
      // Load support tickets count
      const { count: ticketsCount } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // Load chat sessions count
      const { count: chatsCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Load pending staff count
      const { count: staffCount } = await supabase
        .from('admin_staff')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false);

      setBadgeCounts({
        support: ticketsCount || 0,
        chat: chatsCount || 0,
        staff: staffCount || 0
      });
    } catch (error) {
      console.error('Error loading badge counts:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const subscription = supabase
      .channel('admin_badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        loadBadgeCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        loadBadgeCounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_staff' }, () => {
        loadBadgeCounts();
        // Refresh sidebar permissions if the current user's staff record changed
        if (user?.role === 'ADMIN_STAFF') {
          loadStaffData();
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const hasAccess = (itemKey: string): boolean => {
    // SUPER_ADMIN has access to everything
    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }

    // ADMIN has access to everything
    if (user?.role === 'ADMIN') {
      return true;
    }

    // Staff members need specific permission
    if (user?.role === 'ADMIN_STAFF' && staffData) {
      return staffData.sidebar_access[itemKey as keyof SidebarAccess] || false;
    }

    return false;
  };

  const toggleExpanded = (itemKey: string) => {
    setExpandedItems(prev => 
      prev.includes(itemKey) 
        ? prev.filter(key => key !== itemKey)
        : [...prev, itemKey]
    );
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getBadgeCount = (itemKey: string): number => {
    switch (itemKey) {
      case 'support':
        return badgeCounts.support || 0;
      case 'chat':
        return badgeCounts.chat || 0;
      case 'staff':
        return badgeCounts.staff || 0;
      default:
        return 0;
    }
  };

  const filteredItems = sidebarItems.filter(item => hasAccess(item.key));

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof sidebarItems>);

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            {user?.role === 'SUPER_ADMIN' ? (
              <FaCrown className="w-5 h-5 text-white" />
            ) : (
              <FaUser className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Panel</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
               user?.role === 'ADMIN' ? 'Administrator' : 
               user?.role === 'ADMIN_STAFF' ? 'Staff Member' : 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            {/* Category Header */}
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </h3>
            </div>

            {/* Category Items */}
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedItems.includes(item.key);
                const hasSubItems = item.subItems && item.subItems.length > 0;
                const badgeCount = getBadgeCount(item.key);

                return (
                  <div key={item.key}>
                    <Link
                      href={hasSubItems ? '#' : item.href}
                      onClick={hasSubItems ? (e) => {
                        e.preventDefault();
                        toggleExpanded(item.key);
                      } : undefined}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {badgeCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {badgeCount}
                          </span>
                        )}
                        {hasSubItems && (
                          isExpanded ? <FaChevronDown className="w-4 h-4" /> : <FaChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </Link>

                    {/* Sub-items */}
                    {hasSubItems && isExpanded && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive(subItem.href)
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <FaUser className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            title="Sign out"
          >
            <FaSignOutAlt className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 