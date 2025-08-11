'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaComments, FaSearch, FaClock, 
  FaStar, FaChartLine,
  FaCalendarAlt, FaUserCircle, FaFileAlt, FaExclamationTriangle,
  FaUsers, FaEnvelope, FaPhone, FaSms, FaBell,
  FaReply, FaPlus
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DriverCommunication {
  id: string;
  driver_id: string;
  partner_id: string;
  full_name: string;
  email: string;
  phone: string;
  verified: boolean;
  is_approved: boolean;
  is_active: boolean;
  
  // Communication metrics
  communication: {
    total_messages: number;
    unread_messages: number;
    last_contact_date?: string;
    preferred_contact_method: 'email' | 'phone' | 'sms' | 'in_app';
    response_time_hours: number;
    communication_rating: number;
    urgent_communications: number;
    support_tickets: number;
    resolved_tickets: number;
  };
  
  // Recent communications
  recent_messages: {
    id: string;
    type: 'email' | 'phone' | 'sms' | 'in_app';
    subject: string;
    message: string;
    sent_at: string;
    read: boolean;
    urgent: boolean;
  }[];
  
  // Performance context
  performance: {
    rating: number;
    total_rentals: number;
    last_rental_date?: string;
    current_status: 'active' | 'inactive' | 'suspended';
  };
}

interface DriverCommunicationStats {
  total_drivers: number;
  active_communications: number;
  unread_messages: number;
  urgent_messages: number;
  average_response_time: number;
  communication_rating: number;
  support_tickets: number;
  resolved_tickets: number;
}

const COMMUNICATION_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  urgent: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

const CONTACT_METHOD_COLORS = {
  email: 'bg-blue-100 text-blue-800',
  phone: 'bg-green-100 text-green-800',
  sms: 'bg-purple-100 text-purple-800',
  in_app: 'bg-orange-100 text-orange-800'
};

export default function DriverCommunicationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const didInitRef = React.useRef(false);
  
  const [driverCommunications, setDriverCommunications] = useState<DriverCommunication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<DriverCommunication[]>([]);
  const [stats, setStats] = useState<DriverCommunicationStats>({
    total_drivers: 0,
    active_communications: 0,
    unread_messages: 0,
    urgent_messages: 0,
    average_response_time: 0,
    communication_rating: 0,
    support_tickets: 0,
    resolved_tickets: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contactMethodFilter, setContactMethodFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('last_contact');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadDriverCommunications = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) return;

      const partnerId = user.role === 'PARTNER_STAFF' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        setDriverCommunications([]);
        setFilteredCommunications([]);
        calculateStats([]);
        return;
      }

      // Fetch all drivers who have interacted with this partner
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('driver_id')
        .eq('partner_id', partnerId)
        .not('driver_id', 'is', null);

      if (bookingsError || !bookingsData) {
        setDriverCommunications([]);
        setFilteredCommunications([]);
        calculateStats([]);
        return;
      }

      const uniqueDriverIds = [...new Set(bookingsData.map(b => b.driver_id))];

      if (uniqueDriverIds.length === 0) {
        setDriverCommunications([]);
        setFilteredCommunications([]);
        calculateStats([]);
        return;
      }

      // Fetch driver details
      const { data: driversData, error: driversError } = await supabase
        .from('users')
        .select('*')
        .in('id', uniqueDriverIds)
        .eq('role', 'DRIVER');

      if (driversError || !driversData) {
        setDriverCommunications([]);
        setFilteredCommunications([]);
        calculateStats([]);
        return;
      }

      // Enrich with communication data
      const transformedCommunications: DriverCommunication[] = await Promise.all(
        driversData.map(async (driver: any) => {
          // Get driver's booking history with this partner
          const { data: driverBookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('partner_id', partnerId)
            .eq('driver_id', driver.id)
            .order('created_at', { ascending: false });

          const bookings = driverBookings || [];
          const lastRental = bookings.length > 0 ? bookings[0] : null;

          // Mock communication data (in real app, this would come from a communications table)
          const communication: DriverCommunication = {
            id: driver.id,
            driver_id: driver.id,
            partner_id: partnerId,
            full_name: driver.full_name || driver.name || '',
            email: driver.email || '',
            phone: driver.phone || '',
            verified: driver.verified || false,
            is_approved: driver.is_approved || false,
            is_active: driver.is_active || false,

            communication: {
              total_messages: Math.floor(Math.random() * 20) + 1,
              unread_messages: Math.floor(Math.random() * 5),
              last_contact_date: lastRental ? lastRental.created_at : driver.created_at,
              preferred_contact_method: ['email', 'phone', 'sms', 'in_app'][Math.floor(Math.random() * 4)] as 'email' | 'phone' | 'sms' | 'in_app',
              response_time_hours: Math.floor(Math.random() * 24) + 1,
              communication_rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
              urgent_communications: Math.floor(Math.random() * 3),
              support_tickets: Math.floor(Math.random() * 5),
              resolved_tickets: Math.floor(Math.random() * 4),
            },

            recent_messages: [
              {
                id: '1',
                type: 'email',
                subject: 'Rental Confirmation',
                message: 'Your rental has been confirmed for next week.',
                sent_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                read: true,
                urgent: false,
              },
              {
                id: '2',
                type: 'sms',
                subject: 'Vehicle Return Reminder',
                message: 'Please return the vehicle by 5 PM today.',
                sent_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
                read: false,
                urgent: true,
              },
            ],

            performance: {
              rating: Number(driver.rating) || 0,
              total_rentals: bookings.length,
              last_rental_date: lastRental ? lastRental.created_at : undefined,
              current_status: driver.is_active ? 'active' : 'inactive',
            },
          };

          return communication;
        })
      );

      setDriverCommunications(transformedCommunications);
      setFilteredCommunications(transformedCommunications);
      calculateStats(transformedCommunications);
    } catch (err) {
      // Handle error silently
      setDriverCommunications([]);
      setFilteredCommunications([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const calculateStats = (communications: DriverCommunication[]) => {
    const totalDrivers = communications.length;
    const activeCommunications = communications.filter(c => c.communication.total_messages > 0).length;
    const unreadMessages = communications.reduce((sum, c) => sum + c.communication.unread_messages, 0);
    const urgentMessages = communications.reduce((sum, c) => sum + c.communication.urgent_communications, 0);
    const averageResponseTime = communications.reduce((sum, c) => sum + c.communication.response_time_hours, 0) / totalDrivers || 0;
    const communicationRating = communications.reduce((sum, c) => sum + parseFloat(c.communication.communication_rating), 0) / totalDrivers || 0;
    const supportTickets = communications.reduce((sum, c) => sum + c.communication.support_tickets, 0);
    const resolvedTickets = communications.reduce((sum, c) => sum + c.communication.resolved_tickets, 0);

    setStats({
      total_drivers: totalDrivers,
      active_communications: activeCommunications,
      unread_messages: unreadMessages,
      urgent_messages: urgentMessages,
      average_response_time: averageResponseTime,
      communication_rating: communicationRating,
      support_tickets: supportTickets,
      resolved_tickets: resolvedTickets
    });
  };

  useEffect(() => {
    let filtered = [...driverCommunications];

    if (searchTerm) {
      filtered = filtered.filter(communication =>
        communication.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        communication.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        communication.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(communication => {
        switch (statusFilter) {
          case 'active':
            return communication.performance.current_status === 'active';
          case 'inactive':
            return communication.performance.current_status === 'inactive';
          case 'urgent':
            return communication.communication.urgent_communications > 0;
          default:
            return true;
        }
      });
    }

    if (contactMethodFilter !== 'all') {
      filtered = filtered.filter(communication => 
        communication.communication.preferred_contact_method === contactMethodFilter
      );
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(communication => {
        switch (urgencyFilter) {
          case 'urgent':
            return communication.communication.urgent_communications > 0;
          case 'unread':
            return communication.communication.unread_messages > 0;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'last_contact':
          aValue = new Date(a.communication.last_contact_date || a.created_at);
          bValue = new Date(b.communication.last_contact_date || b.created_at);
          break;
        case 'full_name':
          aValue = a.full_name;
          bValue = b.full_name;
          break;
        case 'unread_messages':
          aValue = a.communication.unread_messages;
          bValue = b.communication.unread_messages;
          break;
        case 'communication_rating':
          aValue = parseFloat(a.communication.communication_rating);
          bValue = parseFloat(b.communication.communication_rating);
          break;
        default:
          aValue = new Date(a.communication.last_contact_date || a.created_at);
          bValue = new Date(b.communication.last_contact_date || b.created_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCommunications(filtered);
    setCurrentPage(1);
  }, [driverCommunications, searchTerm, statusFilter, contactMethodFilter, urgencyFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadDriverCommunications();
  }, [user, authLoading, loadDriverCommunications, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalPages = Math.ceil(filteredCommunications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCommunications = filteredCommunications.slice(startIndex, endIndex);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');
  const formatRating = (rating: number) => rating.toFixed(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver communications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Communication</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage driver communications and support
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaPlus className="w-4 h-4 mr-2" />
                New Message
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                <FaChartLine className="w-4 h-4 mr-2" />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_drivers}</p>
                <p className="text-xs text-blue-600">Active drivers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaComments className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Communications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_communications}</p>
                <p className="text-xs text-green-600">Ongoing conversations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaBell className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unread_messages}</p>
                <p className="text-xs text-yellow-600">Require attention</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent_messages}</p>
                <p className="text-xs text-red-600">High priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average_response_time.toFixed(1)}h</p>
                <p className="text-xs text-indigo-600">Response efficiency</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-teal-500 p-3 rounded-lg">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Communication Rating</p>
                <p className="text-2xl font-bold text-gray-900">{formatRating(stats.communication_rating)}</p>
                <p className="text-xs text-teal-600">Driver satisfaction</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaFileAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Support Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.support_tickets}</p>
                <p className="text-xs text-purple-600">{stats.resolved_tickets} resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Driver Communications</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drivers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Method</label>
                <select
                  value={contactMethodFilter}
                  onChange={(e) => setContactMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS</option>
                  <option value="in_app">In-App</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="unread">Unread</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="last_contact-desc">Last Contact (Recent)</option>
                  <option value="last_contact-asc">Last Contact (Oldest)</option>
                  <option value="unread_messages-desc">Unread Messages (High-Low)</option>
                  <option value="communication_rating-desc">Rating (High-Low)</option>
                  <option value="full_name-asc">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Driver Communications ({filteredCommunications.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCommunications.length)} of {filteredCommunications.length} drivers
                </p>
              </div>
            </div>
          </div>

          {currentCommunications.length === 0 ? (
            <div className="text-center py-12">
              <FaComments className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No driver communications found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredCommunications.length === 0 && driverCommunications.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any driver communications yet.'}
              </p>
              {driverCommunications.length === 0 && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/partner/bookings')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <FaCalendarAlt className="w-4 h-4 mr-2" />
                    View All Bookings
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Communication Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recent Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance Context
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCommunications.map((communication) => (
                    <tr key={communication.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FaUserCircle className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {communication.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {communication.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {communication.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            COMMUNICATION_STATUS_COLORS[communication.performance.current_status]
                          }`}>
                            {communication.performance.current_status.charAt(0).toUpperCase() + communication.performance.current_status.slice(1)}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            {communication.communication.total_messages} total messages
                          </div>
                          {communication.communication.unread_messages > 0 && (
                            <div className="text-sm text-red-600 font-medium">
                              {communication.communication.unread_messages} unread
                            </div>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            CONTACT_METHOD_COLORS[communication.communication.preferred_contact_method]
                          }`}>
                            {communication.communication.preferred_contact_method.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {communication.recent_messages.map((message) => (
                            <div key={message.id} className="mb-2">
                              <div className="text-sm font-medium text-gray-900">
                                {message.subject}
                              </div>
                              <div className="text-sm text-gray-500">
                                {message.message.substring(0, 50)}...
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatDate(message.sent_at)}
                                {message.urgent && (
                                  <span className="ml-2 text-red-600 font-medium">URGENT</span>
                                )}
                                {!message.read && (
                                  <span className="ml-2 text-blue-600 font-medium">UNREAD</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {communication.performance.total_rentals} rentals
                          </div>
                          <div className="text-sm text-gray-500">
                            Rating: {formatRating(communication.performance.rating)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Comm Rating: {communication.communication.communication_rating}
                          </div>
                          {communication.performance.last_rental_date && (
                            <div className="text-xs text-gray-500">
                              Last rental: {formatDate(communication.performance.last_rental_date)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <FaEnvelope className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <FaPhone className="w-4 h-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900">
                            <FaSms className="w-4 h-4" />
                          </button>
                          <button className="text-orange-600 hover:text-orange-900">
                            <FaReply className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCommunications.length)} of {filteredCommunications.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium border rounded-lg ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 