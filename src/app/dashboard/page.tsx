"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  FaChartLine, FaUsers, FaCalendarAlt, FaMoneyBillWave, FaBell, 
  FaEnvelope, FaComments, FaHeadset, FaFileAlt, FaStar, FaCog,
  FaEye, FaPlus, FaSearch, FaFilter, FaDownload, FaUpload,
  FaCheckCircle, FaExclamationTriangle, FaClock, FaHistory,
  FaUserCircle, FaShieldAlt, FaTools, FaBolt, FaMapMarkerAlt, FaChevronRight
} from 'react-icons/fa';

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  totalSpent: number;
  thisMonthSpent: number;
  totalNotifications: number;
  unreadNotifications: number;
  totalMessages: number;
  unreadMessages: number;
  supportTickets: number;
  openTickets: number;
  satisfactionRating: number;
  recentActivity: any[];
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface Message {
  id: string;
  sender_name: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    activeBookings: 0,
    totalSpent: 0,
    thisMonthSpent: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    totalMessages: 0,
    unreadMessages: 0,
    supportTickets: 0,
    openTickets: 0,
    satisfactionRating: 0,
    recentActivity: []
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on role
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'PARTNER' || user.role === 'PARTNER_STAFF') {
        router.push('/partner');
      } else if (user.role === 'DRIVER' || user.role === 'driver') {
        router.push('/driver');
      } else {
        // Load data for regular users
        loadDashboardData();
      }
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoadingData(true);

      // Load bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id);

      // Load notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Load support tickets
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const totalBookings = bookingsData?.length || 0;
      const activeBookings = bookingsData?.filter(b => b.status === 'active').length || 0;
      const totalSpent = bookingsData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const thisMonthSpent = bookingsData
        ?.filter(b => new Date(b.created_at).getMonth() === new Date().getMonth())
        .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      const totalNotifications = notificationsData?.length || 0;
      const unreadNotifications = notificationsData?.filter(n => !n.is_read).length || 0;

      const totalTickets = ticketsData?.length || 0;
      const openTickets = ticketsData?.filter(t => t.status === 'open').length || 0;

      setStats({
        totalBookings,
        activeBookings,
        totalSpent,
        thisMonthSpent,
        totalNotifications,
        unreadNotifications,
        totalMessages: 0, // Placeholder
        unreadMessages: 0, // Placeholder
        supportTickets: totalTickets,
        openTickets,
        satisfactionRating: 4.5, // Placeholder
        recentActivity: []
      });

      setNotifications(notificationsData || []);
      setSupportTickets(ticketsData || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name || user.email?.split('@')[0]}!</h1>
              <p className="text-gray-600 mt-1">Here's what's happening with your account</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="font-semibold text-gray-900">{user.role}</p>
              </div>
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <FaBell className="w-6 h-6" />
                  {stats.unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {stats.unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <FaCalendarAlt className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <FaMoneyBillWave className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <FaBell className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unreadNotifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <FaHeadset className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: FaChartLine },
                { id: 'notifications', label: 'Notifications', icon: FaBell },
                { id: 'support', label: 'Support', icon: FaHeadset },
                { id: 'activity', label: 'Recent Activity', icon: FaHistory }
              ].map((tab) => (
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
                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => router.push('/compare')}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <FaSearch className="w-5 h-5 text-blue-600 mr-3" />
                          <span className="font-medium">Compare Cars</span>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      <button 
                        onClick={() => router.push('/profile')}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <FaUserCircle className="w-5 h-5 text-green-600 mr-3" />
                          <span className="font-medium">View Profile</span>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                      
                      <button 
                        onClick={() => router.push('/contact')}
                        className="w-full flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center">
                          <FaHeadset className="w-5 h-5 text-purple-600 mr-3" />
                          <span className="font-medium">Get Support</span>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      {notifications.slice(0, 3).map((notification) => (
                        <div key={notification.id} className="flex items-center p-3 bg-white rounded-lg shadow-sm">
                          <div className="p-2 rounded-full bg-blue-100 mr-3">
                            <FaBell className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">All Notifications</h3>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Mark all as read
                  </button>
                </div>
                
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 rounded-lg border ${notification.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
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

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
                  <button 
                    onClick={() => router.push('/contact')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="w-4 h-4 inline mr-2" />
                    New Ticket
                  </button>
                </div>
                
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{ticket.subject}</h4>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className="text-xs text-gray-500">
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

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notification, index) => (
                    <div key={notification.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 rounded-full bg-gray-200 mr-3">
                        <FaBell className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 