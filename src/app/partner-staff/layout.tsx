'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaUserTie, FaBuilding, FaCar, FaCalendarAlt, FaChartBar, FaFileAlt,
  FaUsers, FaMoneyBillWave, FaRoute, FaCog, FaSignOutAlt, FaBell,
  FaTachometerAlt, FaShieldAlt, FaUserTimes
} from 'react-icons/fa';

interface StaffData {
  id: string;
  partner_id: string;
  user_id: string;
  role: string;
  department: string;
  position: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  employment_status: string;
  permissions: any;
}

interface PartnerData {
  id: string;
  company_name: string;
  status: string;
  approval_status: string;
}

export default function PartnerStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [staffData, setStaffData] = useState<StaffData | null>(null);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadUserData();
  }, [user, router]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get staff data
      const { data: staff, error: staffError } = await supabase
        .from('partner_staff')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (staffError) {
        console.error('Error loading staff data:', staffError);
        toast.error('Failed to load staff data');
        router.push('/auth/login');
        return;
      }

      // Check if staff is active
      if (!staff.is_active || staff.employment_status === 'suspended') {
        setIsAccountSuspended(true);
        toast.error('Your account has been suspended. Please contact your manager.');
        return;
      }

      setStaffData(staff);

      // Get partner data
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, company_name, status, approval_status')
        .eq('id', staff.partner_id)
        .single();

      if (partnerError) {
        console.error('Error loading partner data:', partnerError);
        return;
      }

      // Check if partner account is suspended
      if (partner.status === 'suspended') {
        setIsAccountSuspended(true);
        toast.error('Your company account has been suspended. Please contact support.');
        return;
      }

      setPartnerData(partner);

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'manager': 'Manager',
      'supervisor': 'Supervisor',
      'coordinator': 'Coordinator',
      'assistant': 'Assistant',
      'driver': 'Driver',
      'accountant': 'Accountant',
      'marketing': 'Marketing Specialist'
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colorMap: { [key: string]: string } = {
      'manager': 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400',
      'supervisor': 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400',
      'coordinator': 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400',
      'assistant': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-400',
      'driver': 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-400',
      'accountant': 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400',
      'marketing': 'text-pink-600 bg-pink-100 dark:bg-pink-900 dark:text-pink-400'
    };
    return colorMap[role] || 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
  };

  const getAvailableNavItems = () => {
    if (!staffData?.permissions) return [];

    const items = [
      { 
        href: '/partner-staff', 
        label: 'Dashboard', 
        icon: FaTachometerAlt,
        always: true 
      }
    ];

    if (staffData.permissions.canViewFleet) {
      items.push({ 
        href: '/partner-staff/fleet', 
        label: 'Fleet', 
        icon: FaCar 
      });
    }

    if (staffData.permissions.canViewBookings) {
      items.push({ 
        href: '/partner-staff/bookings', 
        label: 'Bookings', 
        icon: FaCalendarAlt 
      });
    }

    if (staffData.permissions.canViewAnalytics) {
      items.push({ 
        href: '/partner-staff/analytics', 
        label: 'Analytics', 
        icon: FaChartBar 
      });
    }

    if (staffData.permissions.canViewFinancials) {
      items.push({ 
        href: '/partner-staff/financials', 
        label: 'Financials', 
        icon: FaMoneyBillWave 
      });
    }

    if (staffData.permissions.canManageDocuments) {
      items.push({ 
        href: '/partner-staff/documents', 
        label: 'Documents', 
        icon: FaFileAlt 
      });
    }

    if (staffData.permissions.canManageStaff) {
      items.push({ 
        href: '/partner-staff/staff', 
        label: 'Staff', 
        icon: FaUsers 
      });
    }

    return items;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading staff portal...</p>
        </div>
      </div>
    );
  }

  if (isAccountSuspended) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <FaUserTimes className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Account Suspended
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your account has been suspended. Please contact your manager or support for assistance.
          </p>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <FaSignOutAlt className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!staffData || !partnerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaUserTie className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Staff Account Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your staff account could not be found. Please contact your manager.
          </p>
        </div>
      </div>
    );
  }

  const navItems = getAvailableNavItems();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUserTie className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Staff Portal
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {partnerData.company_name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(staffData.role)}`}>
                {getRoleDisplayName(staffData.role)}
              </span>
              <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <FaBell className="w-5 h-5" />
              </button>
              <div className="relative">
                <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {staffData.first_name.charAt(0)}{staffData.last_name.charAt(0)}
                    </span>
                  </div>
                </button>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <FaSignOutAlt className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-screen">
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {staffData.first_name} {staffData.last_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {staffData.department} • {staffData.position}
              </p>
            </div>
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 