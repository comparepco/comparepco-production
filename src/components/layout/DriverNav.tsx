'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaBars, FaHome, FaCar, FaCalendar, FaDollarSign, FaUser, FaCog, FaSignOutAlt, FaBell, FaHeadset, FaFileAlt, FaCarSide, FaMoneyBillWave, FaShieldAlt, FaTools, FaBolt, FaComments, FaClock, FaHistory, FaPlus, FaEye, FaUpload, FaSignature, FaUndo, FaTimes, FaMapMarkerAlt, FaStar, FaExclamationTriangle, FaGift, FaQuestionCircle, FaSearch, FaTachometerAlt, FaChevronLeft, FaChevronRight, FaPhone } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  badge?: number;
}

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
    icon: FaCalendar,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    name: 'Active Trips',
    href: '/driver/trips',
    icon: FaCarSide,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    name: 'Earnings',
    href: '/driver/earnings',
    icon: FaMoneyBillWave,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  {
    name: 'Payments',
    href: '/driver/payments',
    icon: FaDollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    name: 'Vehicles',
    href: '/driver/vehicles',
    icon: FaCar,
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
    name: 'Notifications',
    href: '/driver/notifications',
    icon: FaBell,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    name: 'Support',
    href: '/driver/support',
    icon: FaHeadset,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  {
    name: 'Profile',
    href: '/driver/profile',
    icon: FaUser,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    name: 'Settings',
    href: '/driver/settings',
    icon: FaCog,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
];

const bottomNavigation = [
  {
    name: 'Profile',
    href: '/driver/profile',
    icon: FaUser,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    name: 'Support',
    href: '/driver/support',
    icon: FaHeadset,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  }
];

export default function DriverNav() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Handle screen size changes and set initial sidebar state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarCollapsed(false); // Expand on desktop
        setOpen(false); // Close mobile overlay
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
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch bookings for badges
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            car:vehicles(*)
          `)
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false });

        if (!bookingsError && bookingsData) {
          const processedBookings = bookingsData.map(booking => ({
            ...booking,
            car_name: booking.car?.make && booking.car?.model ? `${booking.car.make} ${booking.car.model}` : 'Unknown Car',
            car_image: booking.car?.image_url || '',
            car_plate: booking.car?.registration_number || '',
          })) as Booking[];
          setBookings(processedBookings);
        }

        // Fetch notifications
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false });

        if (!notificationsError && notificationsData) {
          setNotifications(notificationsData);
        }

        // Fetch transactions for total spent
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('driver_id', user.id)
          .eq('type', 'expense');

        if (!transactionsError && transactions) {
          const total = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
          setTotalSpent(total);
        }
      } catch (error) {
        console.error('Error fetching nav data:', error);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const bookingsSubscription = supabase
      .channel('nav_bookings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `driver_id=eq.${user.id}`
        }, 
        () => {
          fetchData();
        }
      )
      .subscribe();

    const notificationsSubscription = supabase
      .channel('nav_notifications_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`
        }, 
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [user]);

  const getStats = () => {
    return {
      active: bookings.filter(b => b.status === 'active').length,
      pending: bookings.filter(b => ['pending_partner_approval', 'pending_admin_approval', 'pending_documents'].includes(b.status)).length,
      notifications: notifications.length,
      totalSpent: totalSpent,
    };
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobile && open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 lg:hidden bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
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
                onClick={() => setOpen(false)}
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
                  const badge = item.name === 'Notifications' ? stats.notifications : 
                               item.name === 'My Bookings' ? stats.pending : undefined;
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActiveItem
                          ? `${item.bgColor} ${item.color} shadow-sm`
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <div className={`p-2 rounded-lg ${isActiveItem ? 'bg-white shadow-sm' : 'group-hover:bg-white group-hover:shadow-sm'} transition-all duration-200`}>
                        <item.icon className={`w-4 h-4 ${isActiveItem ? item.color : 'text-gray-600'}`} />
                      </div>
                      <span className="font-medium flex items-center gap-1">
                        {item.name}
                        {badge && badge > 0 && (
                          <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-blue-600 text-white rounded-full px-1.5">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Bottom Navigation */}
              <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-1">
                {bottomNavigation.map((item) => {
                  const isActiveItem = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActiveItem
                          ? `${item.bgColor} ${item.color}`
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      onClick={() => setOpen(false)}
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
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActiveItem = isActive(item.href);
            const badge = item.name === 'Notifications' ? stats.notifications : 
                         item.name === 'My Bookings' ? stats.pending : undefined;
            
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
                    {badge && badge > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center text-xs font-semibold bg-blue-600 text-white rounded-full px-1.5">
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
        <div className="p-4 border-t border-gray-200 space-y-1">
          {bottomNavigation.map((item) => {
            const isActiveItem = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActiveItem
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
                  onClick={() => setOpen(true)}
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
          {/* The children prop was removed, so this main content area is now empty */}
        </main>
      </div>

      {/* Enhanced Mobile Bottom Navigation */}
      {!open && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb transition-all duration-300">
          <div className="flex justify-around px-2 py-2">
            {[ 
              { href: '/driver', icon: FaTachometerAlt, label: 'Dashboard' },
              { href: '/driver/bookings', icon: FaCalendar, label: 'Bookings' },
              { href: '/driver/trips', icon: FaCarSide, label: 'Trips' },
              { href: '/driver/profile', icon: FaUser, label: 'Profile' }
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
    </div>
  );
} 