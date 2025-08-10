'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaCarSide, FaCalendarAlt, FaMoneyBillWave, FaBell, FaUserCircle, FaFileAlt, FaStar, FaCog, FaChevronRight, FaCheckCircle, FaExclamationTriangle, FaGift, FaQuestionCircle, FaSearch, FaShieldAlt, FaTools, FaBolt, FaComments, FaClock, FaHistory, FaPlus, FaEye, FaUpload, FaSignature, FaUndo, FaTimes, FaMapMarkerAlt, FaTachometerAlt, FaChevronLeft, FaPhone, FaSignOutAlt, FaBars, FaHome } from "react-icons/fa";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";
import LiveChatWidget from '@/components/shared/LiveChatWidget';

interface Booking {
  id: string;
  status: string;
  car_id: string;
  driver_id: string;
  partner_id: string;
  weeks: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  
  car?: {
    id: string;
    make: string;
    model: string;
    year: string;
    registration_number: string;
    color: string;
    fuel_type: string;
    transmission: string;
    seats: string;
    mileage: string;
    image_url: string;
    price_per_week: number;
  };
  
  car_name?: string;
  car_image?: string;
  car_plate?: string;
  partner_name?: string;

  // Optional issues array (each issue at least has a status field)
  issues?: { status: string; [key: string]: any }[];
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/driver',
    icon: FaTachometerAlt,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: 'My Bookings',
    href: '/driver/bookings',
    icon: FaCalendarAlt,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },

  {
    name: 'Payments',
    href: '/driver/payments',
    icon: FaMoneyBillWave,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    name: 'Vehicles',
    href: '/driver/vehicles',
    icon: FaCarSide,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: 'Claims',
    href: '/driver/claims',
    icon: FaFileAlt,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  {
    name: 'Documents',
    href: '/driver/documents',
    icon: FaFileAlt,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    name: 'Notifications',
    href: '/driver/notifications',
    icon: FaBell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    name: 'Support',
    href: '/driver/support',
    icon: FaComments,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  {
    name: 'Profile',
    href: '/driver/profile',
    icon: FaUserCircle,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
];

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  useEffect(() => {
    if (!authLoading) {
      console.log('Layout Auth state:', { user, role: user?.role, authLoading });
      if (!user) {
        console.log('Layout: No user, redirecting to login');
        router.replace('/auth/login');
      } else {
        // Check if user has a role, if not, try to get it from the database
        if (!user.role) {
          console.log('Layout: No role in user metadata, checking database...');
          // Try to get role from database
          const getUserRole = async () => {
            try {
              const { data: userProfile, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
              
              if (userProfile && userProfile.role) {
                console.log('Layout: Found role in database:', userProfile.role);
                // Update the user object with the role
                const updatedUser = { ...user, role: userProfile.role };
                // Force a re-render by updating the auth context
                // This is a temporary fix - ideally the auth context should handle this
                setLoading(false);
                return;
              }
            } catch (error) {
              console.error('Layout: Error getting user role:', error);
            }
          };
          getUserRole();
        } else if (user.role !== 'DRIVER' && user.role !== 'driver') {
          console.log('Layout: User role is not DRIVER:', user.role);
          router.replace('/');
        } else {
          console.log('Layout: User is DRIVER, setting loading to false');
          setLoading(false);
        }
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        // Fetch all bookings for stats
        const { data: allBookings, error: allBookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            car:vehicles(*),
            partner:partners(*)
          `)
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false });

        if (allBookingsError) {
          console.error('Error fetching bookings:', allBookingsError);
          return;
        }

        const processedBookings = allBookings.map(booking => ({
          ...booking,
          car_name: booking.car?.make && booking.car?.model ? `${booking.car.make} ${booking.car.model}` : 'Unknown Car',
          car_image: booking.car?.image_url || '',
          car_plate: booking.car?.registration_number || '',
          partner_name: booking.partner?.company_name || booking.partner?.full_name || 'Verified Partner',
        })) as Booking[];

        setBookings(processedBookings);
        setRecentBookings(processedBookings.slice(0, 3));
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    const fetchTransactions = async () => {
      try {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('driver_id', user.id)
          .eq('type', 'expense');

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        const total = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
        setTotalSpent(total);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false });

        if (!notificationsError && notificationsData) {
          setNotifications(notificationsData);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    const fetchClaims = async () => {
      try {
        const { data: claimsData, error } = await supabase
          .from('claims')
          .select('*')
          .eq('driver_id', user.id)
          .in('status', ['open', 'need_info'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching claims:', error);
          return;
        }

        setClaims(claimsData || []);
      } catch (error) {
        console.error('Error fetching claims:', error);
      }
    };

    const fetchPayments = async () => {
      try {
        const { data: paymentsData, error } = await supabase
          .from('payment_instructions')
          .select('*')
          .eq('driver_id', user.id)
          .in('status', ['pending', 'sent'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching payments:', error);
          return;
        }

        setPayments(paymentsData || []);
      } catch (error) {
        console.error('Error fetching payments:', error);
      }
    };

    fetchBookings();
    fetchTransactions();
    fetchNotifications();
    fetchClaims();
    fetchPayments();

    // Set up real-time subscription for bookings
    const bookingsSubscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `driver_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Booking change:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
    };
  }, [user]);

  const getStats = () => {
    return {
      total: bookings.length,
      active: bookings.filter(b => b.status === 'active').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      pending: bookings.filter(b => ['pending_partner_approval', 'pending_admin_approval', 'pending_documents'].includes(b.status)).length,
      totalSpent: totalSpent,
      openIssues: bookings.reduce(
        (sum, b) =>
          sum + (b.issues?.filter((i: { status: string }) => i.status !== 'resolved').length || 0),
        0
      ),
      notifications: notifications.length,
      openClaims: claims.filter(c => c.status === 'open').length,
      needInfoClaims: claims.filter(c => c.status === 'need_info').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      sentPayments: payments.filter(p => p.status === 'sent').length
    };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_partner_approval': 'bg-yellow-100 text-yellow-800',
      'pending_admin_approval': 'bg-purple-100 text-purple-800',
      'pending_documents': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
      'partner_rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const stats = getStats();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  const isActive = (href: string) => {
    if (href === '/driver') {
      return pathname === '/driver';
    }
    return pathname.startsWith(href);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Not Authenticated</h2>
          <p className="text-gray-500 mb-4">Please log in to access the driver area.</p>
          <Link href="/auth/login" className="text-blue-600 hover:underline">Go to Login</Link>
        </div>
      </div>
    );
  }

  const isDriver = (user.role || '').toUpperCase() === 'DRIVER';
  if (!isDriver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You do not have permission to access the driver dashboard.</p>
          <Link href="/" className="text-blue-600 hover:underline">Go to Home</Link>
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
                <p className="text-sm text-gray-600">Driver Portal</p>
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
                  {user?.email?.[0] || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {user?.email?.split('@')[0] || 'Driver'}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto">
              {/* Mobile Navigation */}
              <nav className="p-4 space-y-2">
                {navigation.map((item) => {
                  const isActiveItem = isActive(item.href);
                  // Enhanced badge logic
                  let badge: number | undefined;
                  let badgeColor = 'bg-blue-600';
                  
                  switch (item.name) {
                    case 'Notifications':
                      badge = stats.notifications > 0 ? stats.notifications : undefined;
                      badgeColor = 'bg-red-500';
                      break;
                    case 'My Bookings':
                      badge = stats.pending > 0 ? stats.pending : undefined;
                      badgeColor = 'bg-yellow-500';
                      break;
                    case 'Claims':
                      badge = (stats.openClaims + stats.needInfoClaims) > 0 ? (stats.openClaims + stats.needInfoClaims) : undefined;
                      badgeColor = 'bg-red-500';
                      break;
                    case 'Payments':
                      badge = (stats.pendingPayments + stats.sentPayments) > 0 ? (stats.pendingPayments + stats.sentPayments) : undefined;
                      badgeColor = 'bg-yellow-500';
                      break;
                    default:
                      badge = undefined;
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActiveItem
                          ? `${item.bgColor} ${item.color} shadow-sm`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setShowMobileSidebar(false)}
                    >
                      <div className={`p-2 rounded-lg ${isActiveItem ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'} transition-all duration-200`}>
                        <item.icon className={`w-4 h-4 ${isActiveItem ? item.color : 'text-gray-600'}`} />
                      </div>
                      <span className="font-medium flex items-center gap-1">
                        {item.name}
                        {badge && (
                          <span className={`ml-1 inline-flex items-center justify-center text-xs font-semibold ${badgeColor} text-white rounded-full px-1.5 min-w-[18px] h-[18px]`}>
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Sign Out */}
              <div className="px-4 pb-4 border-t border-gray-200 pt-4">
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
                <p className="text-sm text-gray-600">Driver Portal</p>
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
                {user?.email?.[0] || 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {user?.email?.split('@')[0] || 'Driver'}
                </p>
                <p className="text-sm text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {navigation.map((item) => {
            const isActiveItem = isActive(item.href);
            // Enhanced badge logic for desktop
            let badge: number | undefined;
            let badgeColor = 'bg-blue-600';
            
            switch (item.name) {
              case 'Notifications':
                badge = stats.notifications > 0 ? stats.notifications : undefined;
                badgeColor = 'bg-red-500';
                break;
              case 'My Bookings':
                badge = stats.pending > 0 ? stats.pending : undefined;
                badgeColor = 'bg-yellow-500';
                break;
              case 'Claims':
                badge = stats.openIssues > 0 ? stats.openIssues : undefined;
                badgeColor = 'bg-red-500';
                break;
              default:
                badge = undefined;
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActiveItem
                    ? `${item.bgColor} ${item.color} shadow-sm`
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <div className={`p-2 rounded-lg ${isActiveItem ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'} transition-all duration-200`}>
                  <item.icon className={`w-4 h-4 ${isActiveItem ? item.color : 'text-gray-600'}`} />
                </div>
                {!sidebarCollapsed && (
                  <span className="font-medium flex items-center gap-1">
                    {item.name}
                    {badge && (
                      <span className={`ml-1 inline-flex items-center justify-center text-xs font-semibold ${badgeColor} text-white rounded-full px-1.5 min-w-[18px] h-[18px]`}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-200">
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
                  {navigation.find(item => item.href === pathname)?.name || 'Driver Dashboard'}
                </h2>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Manage your trips and bookings efficiently
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
                  href="/driver/support"
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
                  {stats.notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {stats.notifications > 99 ? '99+' : stats.notifications}
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
                                  {new Date(notification.created_at).toLocaleDateString()}
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
              { href: '/driver', icon: FaTachometerAlt, label: 'Dashboard' },
              { href: '/driver/bookings', icon: FaCalendarAlt, label: 'Bookings' },
              { href: '/driver/trips', icon: FaCarSide, label: 'Trips' },
              { href: '/driver/profile', icon: FaUserCircle, label: 'Profile' }
            ].map((item) => {
              const isActiveItem = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-1 px-2 transition-colors rounded-lg ${
                    isActiveItem
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