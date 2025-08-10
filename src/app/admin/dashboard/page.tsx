'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardTiles from '@/components/dashboard/tiles';
import { supabase } from '@/lib/supabase/client';
import { 
  FaUserShield, FaChartLine, FaUsers, FaCalendarCheck, FaBell, 
  FaEnvelope, FaComments, FaHeadset, FaFileAlt, FaStar, FaCog,
  FaEye, FaPlus, FaSearch, FaFilter, FaDownload, FaUpload,
  FaCheckCircle, FaExclamationTriangle, FaClock, FaHistory,
  FaUserCircle, FaShieldAlt, FaTools, FaBolt, FaMapMarkerAlt,
  FaTachometerAlt, FaMoneyBillWave, FaCar, FaExclamationCircle, 
  FaInfoCircle, FaThumbsUp, FaThumbsDown, FaChevronRight
} from 'react-icons/fa';

interface DashboardStats {
  totalPartners: number;
  totalDrivers: number;
  totalBookings: number;
  totalRevenue: number;
  totalNotifications: number;
  unreadNotifications: number;
  totalMessages: number;
  unreadMessages: number;
  supportTickets: number;
  openTickets: number;
  satisfactionRating: number;
  averageResponseTime: number;
  totalUsers: number;
  activeUsers: number;
  thisMonthRevenue: number;
  thisMonthBookings: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  user_type: string;
}

interface Message {
  id: string;
  sender_name: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AdminStaffPermissions {
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

export default function AdminDashboard() {
  const { 
    stats, 
    refreshStats, 
    isLoading, 
    user
  } = useAdmin();
  
  const { loading: authLoading } = useAuth();
  const [enhancedStats, setEnhancedStats] = useState<DashboardStats>({
    totalPartners: 0,
    totalDrivers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    totalMessages: 0,
    unreadMessages: 0,
    supportTickets: 0,
    openTickets: 0,
    satisfactionRating: 0,
    averageResponseTime: 0,
    totalUsers: 0,
    activeUsers: 0,
    thisMonthRevenue: 0,
    thisMonthBookings: 0
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [staffPermissions, setStaffPermissions] = useState<AdminStaffPermissions>({
    dashboard: true,
    analytics: true,
    users: false,
    partners: false,
    drivers: false,
    bookings: false,
    fleet: false,
    documents: false,
    payments: false,
    claims: false,
    support: false,
    notifications: false,
    sales: false,
    marketing: false,
    quality: false,
    security: false,
    staff: false,
    settings: false,
    integrations: false,
    workflow: false,
    reports: false
  });

  useEffect(() => {
    refreshStats();
  }, []);

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'ADMIN_STAFF')) {
      if (user.role === 'ADMIN_STAFF') {
        loadStaffPermissions();
      }
      loadEnhancedData();
    }
  }, [user]);

  const loadStaffPermissions = async () => {
    if (!user) return;

    try {
      const { data: staffData } = await supabase
        .from('admin_staff')
        .select('sidebar_access')
        .eq('user_id', user.id)
        .single();

      if (staffData?.sidebar_access) {
        setStaffPermissions(staffData.sidebar_access);
      }
    } catch (error) {
      console.error('Error loading staff permissions:', error);
    }
  };

  const loadEnhancedData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      // Load notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Load support tickets
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Load partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select('*');

      // Load drivers
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*');

      // Load bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*');

      // Load users
      const { data: usersData } = await supabase
        .from('users')
        .select('*');

      // Load admin staff
      const { data: staffData } = await supabase
        .from('admin_staff')
        .select('*');

      // Load chat sessions for support metrics
      const { data: chatSessionsData } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Load support staff for response time calculations
      const { data: supportStaffData } = await supabase
        .from('support_staff')
        .select('*');

      // Calculate real stats
      const totalPartners = partnersData?.length || 0;
      const totalDrivers = driversData?.length || 0;
      const totalBookings = bookingsData?.length || 0;
      const totalUsers = usersData?.length || 0;
      const totalStaff = staffData?.length || 0;
      
      // Calculate real revenue from bookings
      const totalRevenue = bookingsData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const thisMonthRevenue = bookingsData
        ?.filter(b => new Date(b.created_at).getMonth() === new Date().getMonth())
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const thisMonthBookings = bookingsData
        ?.filter(b => new Date(b.created_at).getMonth() === new Date().getMonth()).length || 0;

      // Calculate real notification stats
      const totalNotifications = notificationsData?.length || 0;
      const unreadNotifications = notificationsData?.filter(n => !n.is_read).length || 0;

      // Calculate real support stats
      const totalTickets = ticketsData?.length || 0;
      const openTickets = ticketsData?.filter(t => t.status === 'open').length || 0;
      const resolvedTickets = ticketsData?.filter(t => t.status === 'resolved').length || 0;
      const urgentTickets = ticketsData?.filter(t => t.priority === 'urgent').length || 0;

      // Calculate real satisfaction rating from tickets
      const ticketsWithRating = ticketsData?.filter(t => t.satisfaction_rating) || [];
      const averageSatisfaction = ticketsWithRating.length > 0 
        ? ticketsWithRating.reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0) / ticketsWithRating.length
        : 4.5; // Default if no ratings

      // Calculate real response time from support staff
      const supportStaffWithResponseTime = supportStaffData?.filter(s => s.average_response_time_minutes) || [];
      const averageResponseTime = supportStaffWithResponseTime.length > 0
        ? supportStaffWithResponseTime.reduce((sum, s) => sum + (s.average_response_time_minutes || 0), 0) / supportStaffWithResponseTime.length
        : 2.5; // Default if no data

      // Calculate real active users (users with recent activity)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const activeUsers = usersData?.filter(u => new Date(u.updated_at || u.created_at) >= yesterday).length || 0;

      // Calculate real chat metrics
      const activeChats = chatSessionsData?.filter(c => c.status === 'active').length || 0;
      const waitingChats = chatSessionsData?.filter(c => c.status === 'waiting').length || 0;
      const completedChats = chatSessionsData?.filter(c => c.status === 'completed').length || 0;

      // Calculate real message stats
      const totalMessages = chatSessionsData?.reduce((sum, c) => sum + (c.message_count || 0), 0) || 0;

      setEnhancedStats({
        totalPartners,
        totalDrivers,
        totalBookings,
        totalRevenue,
        totalNotifications,
        unreadNotifications,
        totalMessages,
        unreadMessages: unreadNotifications, // Use unread notifications as unread messages
        supportTickets: totalTickets,
        openTickets,
        satisfactionRating: Math.round(averageSatisfaction * 10) / 10,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        totalUsers,
        activeUsers,
        thisMonthRevenue,
        thisMonthBookings
      });

      setNotifications(notificationsData || []);
      setSupportTickets(ticketsData || []);

    } catch (error) {
      console.error('Error loading enhanced data:', error);
      // Set default stats if there's an error
      setEnhancedStats({
        totalPartners: 0,
        totalDrivers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalNotifications: 0,
        unreadNotifications: 0,
        totalMessages: 0,
        unreadMessages: 0,
        supportTickets: 0,
        openTickets: 0,
        satisfactionRating: 4.5,
        averageResponseTime: 2.5,
        totalUsers: 0,
        activeUsers: 0,
        thisMonthRevenue: 0,
        thisMonthBookings: 0
      });
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getQuickStats = () => {
    if (user?.role === 'ADMIN_STAFF') {
      return [
        {
          title: "Total Partners",
          value: enhancedStats.totalPartners,
          icon: <FaUsers className="w-6 h-6" />,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          show: staffPermissions.partners
        },
        {
          title: "Total Drivers",
          value: enhancedStats.totalDrivers,
          icon: <FaUserCircle className="w-6 h-6" />,
          color: "text-green-600",
          bgColor: "bg-green-100",
          show: staffPermissions.drivers
        },
        {
          title: "Active Bookings",
          value: enhancedStats.totalBookings,
          icon: <FaCalendarCheck className="w-6 h-6" />,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          show: staffPermissions.bookings
        },
        {
          title: "Total Revenue",
          value: `£${enhancedStats.totalRevenue.toLocaleString()}`,
          icon: <FaMoneyBillWave className="w-6 h-6" />,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          show: staffPermissions.payments
        },
        {
          title: "Support Tickets",
          value: enhancedStats.openTickets,
          icon: <FaHeadset className="w-6 h-6" />,
          color: "text-red-600",
          bgColor: "bg-red-100",
          show: staffPermissions.support
        },
        {
          title: "Notifications",
          value: enhancedStats.unreadNotifications,
          icon: <FaBell className="w-6 h-6" />,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          show: staffPermissions.notifications
        }
      ].filter(stat => stat.show);
    } else {
      // For Super Admin and Admin users, use real data from enhancedStats if available
      const realStats = enhancedStats.totalPartners > 0 ? enhancedStats : stats;
      
      return [
        {
          title: "Total Partners",
          value: realStats.totalPartners,
          icon: <FaUsers className="w-6 h-6" />,
          color: "text-blue-600",
          bgColor: "bg-blue-100"
        },
        {
          title: "Total Drivers",
          value: realStats.totalDrivers,
          icon: <FaUserCircle className="w-6 h-6" />,
          color: "text-green-600",
          bgColor: "bg-green-100"
        },
        {
          title: "Active Bookings",
          value: realStats.totalBookings,
          icon: <FaCalendarCheck className="w-6 h-6" />,
          color: "text-orange-600",
          bgColor: "bg-orange-100"
        },
        {
          title: "Total Revenue",
          value: `£${realStats.totalRevenue.toLocaleString()}`,
          icon: <FaMoneyBillWave className="w-6 h-6" />,
          color: "text-purple-600",
          bgColor: "bg-purple-100"
        }
      ];
    }
  };

  if (authLoading || isLoading || loadingData) {
    return <div className="p-10 text-center">Loading Admin Dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <FaUserShield className="text-6xl text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600">Authentication Required</h2>
        <p className="text-gray-500">Please log in to access the admin dashboard.</p>
      </div>
    );
  }

  const isAdminStaff = user.role === 'ADMIN_STAFF';
  const quickStats = getQuickStats();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isAdminStaff ? 'Staff Dashboard' : 'Admin Dashboard'}
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Welcome back, {user.name || 'Admin'}! Here's what's happening with your platform.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-gray-600 dark:text-slate-400 text-sm">Your Role</p>
              <p className="text-gray-900 dark:text-white font-semibold">
                {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Admin' : 'Staff Member'}
              </p>
            </div>
            {user.profile?.department && (
              <div className="text-right">
                <p className="text-gray-600 dark:text-slate-400 text-sm">Department</p>
                <p className="text-gray-900 dark:text-white font-semibold">{user.profile.department}</p>
              </div>
            )}
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaBell className="w-6 h-6" />
                {enhancedStats.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {enhancedStats.unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">{stat.title}</h3>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Analytics for Staff */}
        {isAdminStaff && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Performance Metrics */}
            {staffPermissions.analytics && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaTachometerAlt className="w-5 h-5 mr-2 text-blue-600" />
                  Performance Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rating</span>
                    <div className="flex items-center">
                      <FaStar className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-semibold">{enhancedStats.satisfactionRating}/5.0</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Average Response Time</span>
                    <span className="font-semibold">{enhancedStats.averageResponseTime}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                    <span className="font-semibold">{enhancedStats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                    <span className="font-semibold">{enhancedStats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Messages</span>
                    <span className="font-semibold">{enhancedStats.totalMessages}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Unread Messages</span>
                    <span className="font-semibold">{enhancedStats.unreadMessages}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Overview */}
            {staffPermissions.payments && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaMoneyBillWave className="w-5 h-5 mr-2 text-green-600" />
                  Revenue Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                    <span className="font-semibold text-green-600">£{enhancedStats.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                    <span className="font-semibold text-green-600">£{enhancedStats.thisMonthRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Bookings</span>
                    <span className="font-semibold">{enhancedStats.totalBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                    <span className="font-semibold">{enhancedStats.thisMonthBookings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Partners</span>
                    <span className="font-semibold">{enhancedStats.totalPartners}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Drivers</span>
                    <span className="font-semibold">{enhancedStats.totalDrivers}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaPlus className="w-5 h-5 mr-2 text-purple-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                {staffPermissions.support && (
                  <button className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    <div className="flex items-center">
                      <FaHeadset className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="font-medium">Support Tickets</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-blue-600" />
                  </button>
                )}
                
                {staffPermissions.notifications && (
                  <button className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                    <div className="flex items-center">
                      <FaBell className="w-5 h-5 text-green-600 mr-3" />
                      <span className="font-medium">Notifications</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-green-600" />
                  </button>
                )}
                
                {staffPermissions.users && (
                  <button className="w-full flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                    <div className="flex items-center">
                      <FaUsers className="w-5 h-5 text-purple-600 mr-3" />
                      <span className="font-medium">User Management</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-purple-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabs for Staff */}
        {isAdminStaff && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow mb-8">
            <div className="border-b border-gray-200 dark:border-slate-700">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: FaChartLine, show: true },
                  { id: 'support', label: 'Support', icon: FaHeadset, show: staffPermissions.support },
                  { id: 'notifications', label: 'Notifications', icon: FaBell, show: staffPermissions.notifications },
                  { id: 'users', label: 'Users', icon: FaUsers, show: staffPermissions.users },
                  { id: 'analytics', label: 'Analytics', icon: FaTachometerAlt, show: staffPermissions.analytics }
                ].filter(tab => tab.show).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Notifications */}
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Notifications</h3>
                      <div className="space-y-3">
                        {notifications.slice(0, 3).map((notification) => (
                          <div key={notification.id} className="flex items-center p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 mr-3">
                              <FaBell className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(notification.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Support Tickets */}
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Support Tickets</h3>
                      <div className="space-y-3">
                        {supportTickets.slice(0, 3).map((ticket) => (
                          <div key={ticket.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.user_type}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Tab */}
              {activeTab === 'support' && staffPermissions.support && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Support Tickets</h3>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <FaPlus className="w-4 h-4 inline mr-2" />
                      New Ticket
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h4>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && staffPermissions.notifications && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Notifications</h3>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Mark all as read
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`p-4 rounded-lg border ${notification.is_read ? 'bg-gray-50 dark:bg-slate-700' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">{notification.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-3"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && staffPermissions.users && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Total Partners</h4>
                      <p className="text-2xl font-bold text-blue-600">{enhancedStats.totalPartners}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100">Total Drivers</h4>
                      <p className="text-2xl font-bold text-green-600">{enhancedStats.totalDrivers}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100">Active Users</h4>
                      <p className="text-2xl font-bold text-purple-600">{enhancedStats.activeUsers}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && staffPermissions.analytics && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Rating</span>
                          <span className="font-semibold">{enhancedStats.satisfactionRating}/5.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                          <span className="font-semibold">{enhancedStats.averageResponseTime}h</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-4">Revenue Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</span>
                          <span className="font-semibold text-green-600">£{enhancedStats.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                          <span className="font-semibold text-green-600">£{enhancedStats.thisMonthRevenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Role-based Dashboard Tiles */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Dashboard</h2>
            <DashboardTiles />
          </div>
        </div>
      </div>
    </div>
  );
} 