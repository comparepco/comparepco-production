"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { 
  FaTachometerAlt, FaCar, FaCalendarAlt, FaTools, FaFileAlt,
  FaChartLine, FaMoneyBillWave, FaUsers, FaBullhorn, FaCog,
  FaBell, FaSignOutAlt, FaChevronLeft, FaChevronRight, FaPlus,
  FaHome, FaPhone, FaQuestionCircle, FaExclamationTriangle, FaUser,
  FaBars, FaTimes, FaTags, FaCogs, FaPlay, FaHistory, FaCalendar, FaFileContract,
  FaUserCheck, FaShieldAlt, FaStar, FaComments, FaCalendarCheck, FaClipboardList,
  FaBoxes, FaWrench, FaIdCard, FaUserTie, FaCheckCircle, FaPoundSign, FaReceipt,
  FaChartBar, FaPercentage, FaSearch, FaToggleOn, FaChartPie,
  FaUserPlus, FaLock, FaGlobe, FaGift, FaHeadset, FaEnvelope, FaCreditCard, FaClock
} from 'react-icons/fa';
import LiveChatWidget from '@/components/shared/LiveChatWidget';
import { toast } from 'react-hot-toast';

const navigation = [
  // MAIN DASHBOARD
  {
    name: 'Dashboard',
    href: '/partner',
    icon: FaTachometerAlt,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    requiredPermission: null, // Always visible
    category: 'main'
  },

  // FLEET MANAGEMENT
  {
    name: 'Fleet Management',
    href: '/partner/fleet',
    icon: FaCar,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    requiredPermission: 'canManageFleet',
    category: 'fleet',
    subItems: [
      { name: 'Fleet Overview', href: '/partner/fleet', icon: FaTachometerAlt },
      { name: 'Add Vehicle', href: '/partner/fleet/add', icon: FaPlus },
      { name: 'Vehicle Categories', href: '/partner/fleet/categories', icon: FaTags },
      { name: 'Bulk Operations', href: '/partner/fleet/bulk', icon: FaCogs }
    ]
  },

  // RENTAL OPERATIONS
  {
    name: 'Rental Operations',
    href: '/partner/bookings',
    icon: FaCalendarAlt,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    requiredPermission: 'canManageBookings',
    category: 'rentals',
    subItems: [
      { name: 'All Bookings', href: '/partner/bookings', icon: FaCalendarAlt },
      { name: 'Active Rentals', href: '/partner/bookings?status=active', icon: FaPlay },
      { name: 'Pending Bookings', href: '/partner/bookings?status=pending', icon: FaClock },
      { name: 'Completed Rentals', href: '/partner/bookings?status=completed', icon: FaCheckCircle },
      { name: 'Booking Analytics', href: '/partner/bookings?view=analytics', icon: FaChartLine }
    ]
  },

  // DRIVER MANAGEMENT
  {
    name: 'Driver Management',
    href: '/partner/drivers',
    icon: FaUsers,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    requiredPermission: 'canManageDrivers',
    category: 'drivers',
    subItems: [
      { name: 'Rented Drivers', href: '/partner/drivers/rented', icon: FaUserCheck },
      { name: 'Driver History', href: '/partner/drivers/history', icon: FaHistory },
      { name: 'Driver Verification', href: '/partner/drivers/verification', icon: FaShieldAlt },
      { name: 'Driver Performance', href: '/partner/drivers/performance', icon: FaStar },
      { name: 'Driver Communication', href: '/partner/drivers/communication', icon: FaComments }
    ]
  },

  // MAINTENANCE & SERVICE
  {
    name: 'Maintenance & Service',
    href: '/partner/maintenance',
    icon: FaTools,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    requiredPermission: 'canManageMaintenence',
    category: 'maintenance',
    subItems: [
      { name: 'Service Schedule', href: '/partner/maintenance/schedule', icon: FaCalendarCheck },
      { name: 'Service History', href: '/partner/maintenance/history', icon: FaClipboardList },
      { name: 'Parts Inventory', href: '/partner/maintenance/parts', icon: FaBoxes },
      { name: 'Warranty Management', href: '/partner/maintenance/warranty', icon: FaShieldAlt },
      { name: 'Service Providers', href: '/partner/maintenance/providers', icon: FaWrench }
    ]
  },

  // DOCUMENTS & COMPLIANCE
  {
    name: 'Documents & Compliance',
    href: '/partner/documents',
    icon: FaFileAlt,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    requiredPermission: null, // Always visible but limited functionality for staff
    category: 'documents',
    subItems: [
      { name: 'PCO Documents', href: '/partner/documents/pco', icon: FaIdCard },
      { name: 'Rental Documents', href: '/partner/documents/rental', icon: FaFileContract },
      { name: 'Driver Documents', href: '/partner/documents/driver', icon: FaUserTie },
      { name: 'Expiry Alerts', href: '/partner/documents/expiry', icon: FaExclamationTriangle },
      { name: 'Compliance Tracking', href: '/partner/documents/compliance', icon: FaCheckCircle }
    ]
  },

  // FINANCIAL MANAGEMENT
  {
    name: 'Financial Management',
    href: '/partner/finances',
    icon: FaMoneyBillWave,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    requiredPermission: 'canViewFinancials',
    category: 'finance',
    subItems: [
      { name: 'Rental Revenue', href: '/partner/finances/revenue', icon: FaPoundSign },
      { name: 'Cost Tracking', href: '/partner/finances/costs', icon: FaReceipt },
      { name: 'Profit Analysis', href: '/partner/finances/profit', icon: FaChartBar },
      { name: 'Commission Tracking', href: '/partner/finances/commission', icon: FaPercentage },
      { name: 'Payment Management', href: '/partner/finances/payments', icon: FaCreditCard }
    ]
  },

  // PRICING & AVAILABILITY
  {
    name: 'Pricing & Availability',
    href: '/partner/pricing',
    icon: FaTags,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    partnerOnly: true, // Only partners can see this
    category: 'pricing',
    subItems: [
      { name: 'Dynamic Pricing', href: '/partner/pricing/dynamic', icon: FaChartLine },
      { name: 'Seasonal Pricing', href: '/partner/pricing/seasonal', icon: FaCalendarAlt },
      { name: 'Competitive Analysis', href: '/partner/pricing/competitive', icon: FaSearch },
      { name: 'Availability Management', href: '/partner/pricing/availability', icon: FaToggleOn },
      { name: 'Pricing Analytics', href: '/partner/pricing/analytics', icon: FaChartPie }
    ]
  },

  // SAFETY & RISK MANAGEMENT
  {
    name: 'Safety & Risk',
    href: '/partner/safety',
    icon: FaShieldAlt,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    requiredPermission: null, // visible to all partner roles
    category: 'safety',
    subItems: [
      { name: 'Incident Reports', href: '/partner/safety/incidents', icon: FaExclamationTriangle },
      { name: 'Insurance Claims', href: '/partner/safety/claims', icon: FaFileAlt },
      { name: 'Risk Assessment', href: '/partner/safety/risk', icon: FaChartBar },
      { name: 'Safety Inspections', href: '/partner/safety/inspections', icon: FaCheckCircle },
      { name: 'Emergency Procedures', href: '/partner/safety/emergency', icon: FaPhone }
    ]
  },

  // ANALYTICS & REPORTS
  {
    name: 'Analytics & Reports',
    href: '/partner/analytics',
    icon: FaChartLine,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    requiredPermission: 'canViewReports',
    category: 'analytics',
    subItems: [
      { name: 'Fleet Analytics', href: '/partner/analytics/fleet', icon: FaCar },
      { name: 'Rental Analytics', href: '/partner/analytics/rental', icon: FaCalendarAlt },
      { name: 'Driver Analytics', href: '/partner/analytics/driver', icon: FaUsers },
      { name: 'Financial Reports', href: '/partner/analytics/financial', icon: FaMoneyBillWave },
      { name: 'Custom Reports', href: '/partner/analytics/custom', icon: FaFileAlt }
    ]
  },

  // STAFF MANAGEMENT
  {
    name: 'Staff Management',
    href: '/partner/staff',
    icon: FaUsers,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    partnerOnly: true, // Only partners can see this
    category: 'staff',
    subItems: [
      { name: 'All Staff', href: '/partner/staff', icon: FaUsers },
      { name: 'Add Staff', href: '/partner/staff/add', icon: FaUserPlus },
      { name: 'Permissions', href: '/partner/staff/permissions', icon: FaLock },
      { name: 'Staff Performance', href: '/partner/staff/performance', icon: FaStar },
      { name: 'Staff Communication', href: '/partner/staff/communication', icon: FaComments }
    ]
  },

  // MARKETING & GROWTH
  {
    name: 'Marketing & Growth',
    href: '/partner/marketing',
    icon: FaBullhorn,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    partnerOnly: true, // Only partners can see this
    category: 'marketing',
    subItems: [
      { name: 'Vehicle Marketing', href: '/partner/marketing/vehicles', icon: FaCar },
      { name: 'Driver Acquisition', href: '/partner/marketing/acquisition', icon: FaUserPlus },
      { name: 'Retention Strategies', href: '/partner/marketing/retention', icon: FaUserCheck },
      { name: 'Promotional Campaigns', href: '/partner/marketing/campaigns', icon: FaGift },
      { name: 'Market Expansion', href: '/partner/marketing/expansion', icon: FaGlobe }
    ]
  },

  // CUSTOMER SERVICE
  {
    name: 'Customer Service',
    href: '/partner/support',
    icon: FaHeadset,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    requiredPermission: null,
    category: 'support',
    subItems: [
      { name: 'Driver Support', href: '/partner/support/drivers', icon: FaUsers },
      { name: 'Issue Resolution', href: '/partner/support/issues', icon: FaTools },
      { name: 'Feedback Management', href: '/partner/support/feedback', icon: FaComments },
      { name: 'Communication Hub', href: '/partner/support/communication', icon: FaEnvelope },
      { name: 'Emergency Support', href: '/partner/support/emergency', icon: FaPhone }
    ]
  },

  // NOTIFICATIONS & COMMUNICATIONS
  {
    name: 'Notifications',
    href: '/partner/notifications',
    icon: FaBell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    requiredPermission: null,
    category: 'notifications'
  }
];

const bottomNavigation = [
  {
    name: 'Profile',
    href: '/partner/profile',
    icon: FaUser,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    name: 'Support',
    href: '/partner/support',
    icon: FaQuestionCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
];

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Set sidebar collapsed by default on mobile, expanded on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [badgeCounts, setBadgeCounts] = useState({
    unreadNotifications: 0,
    openClaims: 0
  });
  const [partnerStatus, setPartnerStatus] = useState<string>('active');
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  console.log('PartnerLayout - User:', user);
  console.log('PartnerLayout - User role:', user?.role);
  console.log('PartnerLayout - Auth loading:', authLoading);
  console.log('PartnerLayout - Current pathname:', pathname);
  console.log('PartnerLayout - Is mobile:', isMobile);
  console.log('PartnerLayout - Sidebar collapsed:', sidebarCollapsed);
  console.log('PartnerLayout - Show mobile sidebar:', showMobileSidebar);
  
  // Filter navigation based on user role and permissions
  const getFilteredNavigation = () => {
    if (!user || !userPermissions) return [];

    const filtered = navigation.filter(item => {
      // If it's partner-only and user is not a partner, hide it
      if (item.partnerOnly && user.role !== 'PARTNER') {
        return false;
      }

      // If it requires a specific permission, check if user has it
      if (item.requiredPermission) {
        return userPermissions[item.requiredPermission] === true;
      }

      // If no specific permission required, show it
      return true;
    });

    console.log('Filtered navigation:', filtered);
    console.log('User permissions:', userPermissions);
    console.log('User role:', user.role);

    return filtered;
  };

  const filteredNavigation = useMemo(() => getFilteredNavigation(), [user, userPermissions]);

  // Auto-expand categories based on current pathname
  useEffect(() => {
    const currentPath = pathname;
    const newExpandedCategories = new Set<string>();
    
    // Check if current path matches any sub-items and expand their parent category
    filteredNavigation.forEach(item => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some(subItem => currentPath === subItem.href);
        if (hasActiveSubItem) {
          newExpandedCategories.add(item.category || '');
        }
      }
    });
    
    setExpandedCategories(newExpandedCategories);
  }, [pathname]);

  // Handle screen size changes and set initial sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarCollapsed(false); // Expand on desktop
        setShowMobileSidebar(false); // Close mobile overlay
      } else {
        setSidebarCollapsed(true); // Always collapsed on mobile
      }
    };

    // Set initial state
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setShowMobileSidebar(false);
  }, [pathname]);

  // Load user permissions and badge counts
  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping permissions load');
      return;
    }

    const loadUserData = async () => {
      try {
        console.log('Loading user data for role:', user.role);
        
        // Check partner status first
        if (user.role === 'PARTNER' || user.role === 'PARTNER_STAFF') {
          const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .select('status, approval_status, company_name')
            .eq('id', user.id)
            .single();

          if (partnerError) {
            console.error('Error loading partner data:', partnerError);
            toast.error('Failed to load partner data');
            return;
          }

          console.log('Partner data loaded:', partnerData);
          setPartnerStatus(partnerData.status);
          
          // Check if account is suspended or deactivated
          if (partnerData.status === 'suspended') {
            setIsAccountSuspended(true);
            return;
          }

          // Load staff permissions if user is staff
          if (user.role === 'PARTNER_STAFF') {
            const { data: staffData, error: staffError } = await supabase
              .from('partner_staff')
              .select('permissions')
              .eq('id', user.id)
              .single();

            if (staffError) {
              console.error('Error loading staff permissions:', staffError);
              // Set default permissions for staff
              setUserPermissions({
                canManageFleet: true,
                canManageBookings: true,
                canManageDrivers: true,
                canManageMaintenence: true,
                canViewReports: true,
                canManageStaff: false,
                canManagePricing: true,
                canManageDocuments: true
              });
            } else {
              console.log('Staff permissions loaded:', staffData.permissions);
              setUserPermissions(staffData.permissions);
            }
          } else {
            // Partner has all permissions
            console.log('Setting partner permissions (all true)');
            setUserPermissions({
              canManageFleet: true,
              canManageBookings: true,
              canManageDrivers: true,
              canManageMaintenence: true,
              canViewReports: true,
              canManageStaff: true,
              canManagePricing: true,
              canManageDocuments: true
            });
          }

          // Load badge counts - simplified for now
          setBadgeCounts({
            unreadNotifications: 0,
            openClaims: 0
          });

        } else {
          console.log('User is not a partner or staff member');
        }

      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user]);

  // Check if user has permission to access current route
  useEffect(() => {
    if (!user || !userPermissions || pathname === '/partner') return;

    const currentNavItem = navigation.find(item => pathname.startsWith(item.href));
    if (currentNavItem) {
      // Check if staff is trying to access partner-only area
      if (currentNavItem.partnerOnly && user.role !== 'PARTNER') {
        console.warn(`Security violation: Staff user ${user.id} attempted to access partner-only area: ${pathname}`);
        alert('Access denied: This area is restricted to business owners only.');
        router.replace('/partner');
        return;
      }

      // Check if staff has required permission
      if (currentNavItem.requiredPermission && !userPermissions[currentNavItem.requiredPermission]) {
        console.warn(`Permission denied: User ${user.id} lacks permission ${currentNavItem.requiredPermission} for ${pathname}`);
        alert('Access denied: You do not have permission to access this area.');
        router.replace('/partner');
        return;
      }
    }
  }, [user, userPermissions, pathname, router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show suspended account message
  if (isAccountSuspended) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <FaExclamationTriangle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Account {partnerStatus === 'suspended' ? 'Suspended' : 'Deactivated'}
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Your partner account has been {partnerStatus === 'suspended' ? 'suspended' : 'deactivated'} by an administrator. 
              Please contact support for assistance.
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Not Authenticated</h2>
          <p className="text-gray-500 mb-4">Please log in to access the partner area.</p>
          <a href="/auth/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  const isPartner = user.role === 'PARTNER' || user.role === 'PARTNER_STAFF';
  if (!isPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You do not have permission to access the partner dashboard.</p>
          <a href="/" className="text-blue-600 hover:underline">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobile && showMobileSidebar && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 lg:hidden bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
          {/* Sidebar */}
          <div 
            className="fixed left-0 top-0 z-50 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col lg:hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sidebar Header - Fixed */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
              <div>
                <h1 className="text-xl font-bold text-gray-900">ComparePCO</h1>
                <p className="text-sm text-gray-600">Partner Portal</p>
              </div>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FaTimes className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Mobile User Profile - Fixed */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {(user as any)?.firstName?.[0] || user?.email?.[0] || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto">
              {/* Mobile Navigation */}
              <nav className="p-4 space-y-2">
                {filteredNavigation.map((item) => {
                  // Improved active state logic
                  const isExactMatch = pathname === item.href;
                  const isActive = isExactMatch || (item.href !== '/partner' && pathname.startsWith(item.href));
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded = expandedCategories.has(item.category || '');
                  
                  return (
                    <div key={item.name} className="space-y-1">
                      {/* Main Navigation Item */}
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                            isActive
                              ? `${item.bgColor} ${item.color} shadow-sm`
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setShowMobileSidebar(false)}
                        >
                          <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'} transition-all duration-200`}>
                            <item.icon className={`w-4 h-4 ${isActive ? item.color : 'text-gray-600'}`} />
                          </div>
                          <span className="font-medium flex items-center gap-1">
                            {item.name}
                            {item.name === 'Notifications' && badgeCounts.unreadNotifications > 0 && (
                              <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-blue-600 text-white rounded-full px-1.5">
                                {badgeCounts.unreadNotifications > 99 ? '99+' : badgeCounts.unreadNotifications}
                              </span>
                            )}
                            {item.name === 'Vehicle Claims' && badgeCounts.openClaims > 0 && (
                              <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-amber-500 text-white rounded-full px-1.5">
                                {badgeCounts.openClaims > 99 ? '99+' : badgeCounts.openClaims}
                              </span>
                            )}
                          </span>
                        </Link>
                        
                        {/* Expand/Collapse Button for Items with SubItems */}
                        {hasSubItems && (
                          <button
                            onClick={() => toggleCategory(item.category || '')}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              isExpanded ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                      </div>
                      
                      {/* SubItems Dropdown */}
                      {hasSubItems && isExpanded && (
                        <div className="ml-6 space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                  isSubActive
                                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                                onClick={() => setShowMobileSidebar(false)}
                              >
                                <subItem.icon className={`w-3 h-3 ${isSubActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className="text-sm font-medium">{subItem.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Mobile Quick Actions */}
              {user?.role === 'PARTNER' && (
                <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                  <Link
                    href="/partner/fleet/add"
                    className="flex items-center gap-3 px-3 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
                    onClick={() => setShowMobileSidebar(false)}
                  >
                    <FaPlus className="w-4 h-4" />
                    <span className="font-medium">Add Vehicle</span>
                  </Link>
                </div>
              )}

              {/* Mobile Bottom Navigation */}
              <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-1">
                {bottomNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? `${item.bgColor} ${item.color}`
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => setShowMobileSidebar(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>

              {/* Extra padding at bottom to ensure scrollability */}
              <div className="h-4"></div>
            </div>
          </div>
        </>
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className={`${isMobile ? 'hidden' : (sidebarCollapsed ? 'w-20' : 'w-72')} bg-white shadow-xl border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">ComparePCO</h1>
                <p className="text-sm text-gray-600">Partner Portal</p>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>
        </div>

        {/* User Profile */}
        {!sidebarCollapsed && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                {(user as any)?.firstName?.[0] || user?.email?.[0] || 'P'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {(user as any)?.firstName} {(user as any)?.lastName}
                </p>
                <p className="text-sm text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ zIndex: 1000, position: 'relative' }}>
          {/*  Removed temporary debug buttons */}
          
          {filteredNavigation.map((item) => {
            // Improved active state logic
            const isExactMatch = pathname === item.href;
            const isActive = isExactMatch || (item.href !== '/partner' && pathname.startsWith(item.href));
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedCategories.has(item.category || '');
            
            console.log('Navigation item:', item.name, 'href:', item.href, 'isActive:', isActive);
            
            return (
              <div key={item.name} className="space-y-1" style={{ position: 'relative', zIndex: 1001 }}>
                {/* Main Navigation Item */}
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked on navigation item:', item.name, 'href:', item.href);
                      console.log('Event target:', e.target);
                      console.log('Event currentTarget:', e.currentTarget);
                      console.log('About to navigate to:', item.href);
                      router.push(item.href);
                    }}
                    onMouseDown={(e) => {
                      console.log('Mouse down on:', item.name);
                    }}
                    onMouseUp={(e) => {
                      console.log('Mouse up on:', item.name);
                    }}
                    className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer text-left ${
                      isActive
                        ? `${item.bgColor} ${item.color} shadow-sm`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={sidebarCollapsed ? item.name : undefined}
                    style={{ 
                      pointerEvents: 'auto',
                      position: 'relative',
                      zIndex: 1002,
                      userSelect: 'none'
                    }}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'} transition-all duration-200`}>
                      <item.icon className={`w-4 h-4 ${isActive ? item.color : 'text-gray-600'}`} />
                    </div>
                    {!sidebarCollapsed && (
                      <span className="font-medium flex items-center gap-1">
                        {item.name}
                        {item.name === 'Notifications' && badgeCounts.unreadNotifications > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-blue-600 text-white rounded-full px-1.5">
                            {badgeCounts.unreadNotifications > 99 ? '99+' : badgeCounts.unreadNotifications}
                          </span>
                        )}
                        {item.name === 'Vehicle Claims' && badgeCounts.openClaims > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-amber-500 text-white rounded-full px-1.5">
                            {badgeCounts.openClaims > 99 ? '99+' : badgeCounts.openClaims}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                  
                  {/* Expand/Collapse Button for Items with SubItems */}
                  {!sidebarCollapsed && hasSubItems && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Toggling category:', item.category);
                        toggleCategory(item.category || '');
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        isExpanded ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
                
                {/* SubItems Dropdown */}
                {!sidebarCollapsed && hasSubItems && isExpanded && (
                  <div className="ml-6 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <button
                          key={subItem.name}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Clicked on sub-item:', subItem.name, 'href:', subItem.href);
                            console.log('Sub-item event target:', e.target);
                            router.push(subItem.href);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group cursor-pointer text-left ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                          }`}
                          style={{ 
                            pointerEvents: 'auto',
                            position: 'relative',
                            zIndex: 1002
                          }}
                        >
                          <subItem.icon className={`w-3 h-3 ${isSubActive ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{subItem.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Quick Actions - Only show for partners */}
        {!sidebarCollapsed && user?.role === 'PARTNER' && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2">
              <Link
                href="/partner/fleet/add"
                className="flex items-center gap-3 px-3 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
              >
                <FaPlus className="w-4 h-4" />
                <span className="font-medium">Add Vehicle</span>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions for Staff with Fleet permissions */}
        {!sidebarCollapsed && user?.role === 'PARTNER_STAFF' && userPermissions?.canManageFleet && (
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2">
              <Link
                href="/partner/fleet/add"
                className="flex items-center gap-3 px-3 py-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-sm"
              >
                <FaPlus className="w-4 h-4" />
                <span className="font-medium">Add Vehicle</span>
              </Link>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          {bottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? `${item.bgColor} ${item.color}`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="w-4 h-4" />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <FaSignOutAlt className="w-4 h-4" />
            {!sidebarCollapsed && (
              <span className="font-medium">Sign Out</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Hamburger Menu */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
                >
                  <FaBars className="w-5 h-5 text-gray-600" />
                </button>
              )}
              
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {navigation.find(item => item.href === pathname)?.name || 'Partner Dashboard'}
                </h2>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Manage your fleet and bookings efficiently
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Quick Links */}
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/"
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Go to Main Site"
                >
                  <FaHome className="w-5 h-5" />
                </Link>
                <Link
                  href="/partner/support"
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Contact Support"
                >
                  <FaPhone className="w-5 h-5" />
                </Link>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
                >
                  <FaBell className="w-5 h-5" />
                  {badgeCounts.unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {badgeCounts.unreadNotifications > 99 ? '99+' : badgeCounts.unreadNotifications}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                              }`}></div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-xs mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-gray-400 text-xs mt-2">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 min-h-screen bg-gray-50 mobile-bottom-padding">
          {children}
        </main>
      </div>

      {/* Enhanced Mobile Bottom Navigation */}
      {!showMobileSidebar && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb transition-all duration-300">
          <div className="flex justify-around px-2 py-2">
            {[ 
              { href: '/partner', icon: FaTachometerAlt, label: 'Dashboard' },
              { href: '/partner/fleet', icon: FaCar, label: 'Fleet' },
              { href: '/partner/bookings', icon: FaCalendarAlt, label: 'Bookings' },
              { href: '/partner/profile', icon: FaUser, label: 'Profile' }
            ].map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-2 transition-colors rounded-lg ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="text-lg mb-1" />
                  <span className="text-xs font-medium leading-none">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Enhanced Mobile Styles */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .mobile-bottom-padding {
            padding-bottom: 80px;
          }
          
          .safe-area-pb {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
        
        /* Smooth transitions for mobile sidebar */
        .mobile-sidebar-enter {
          transform: translateX(-100%);
        }
        
        .mobile-sidebar-enter-active {
          transform: translateX(0);
          transition: transform 300ms ease-in-out;
        }
        
        .mobile-sidebar-exit {
          transform: translateX(0);
        }
        
        .mobile-sidebar-exit-active {
          transform: translateX(-100%);
          transition: transform 300ms ease-in-out;
        }
        
        /* Enhanced blur effect for mobile sidebar overlay */
        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
      `}</style>
      
      {/* Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
} 