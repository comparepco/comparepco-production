'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase/client';
import { 
  FaSearch, FaStar, FaCalendarAlt, FaMoneyBillWave, FaClock,
  FaUserTie, FaCreditCard, FaFileAlt, FaBan
} from 'react-icons/fa';

// Type Definitions
interface PendingBooking {
  id: string;
  status: string;
  vehicle_id: string;
  driver_id: string;
  partner_id: string;
  weeks: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  partner_response_deadline?: string;
  driver_notes?: string;
  partner_notes?: string;
  
  // Enhanced data structure
  driver: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    verified: boolean;
    rating: number;
    total_rentals: number;
    documents_uploaded: boolean;
  };
  
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: string;
    license_plate: string;
    color: string;
    fuel_type: string;
    transmission: string;
    seats: string;
    mileage: string;
    image: string;
    price_per_week: number;
    category: string;
  };
  
  // Booking details
  pickup_location?: string;
  dropoff_location?: string;
  requirements?: string[];
  payment_status: 'pending' | 'paid' | 'overdue';
  deposit_required: boolean;
  deposit_amount?: number;
  deposit_status?: 'pending' | 'received' | 'failed';
  
  // Urgency tracking
  is_urgent: boolean;
  hours_until_deadline?: number | null;
  days_until_start?: number;
}

const STATUS_COLORS = {
  pending_partner_approval: 'bg-yellow-100 text-yellow-800',
  pending_driver_approval: 'bg-blue-100 text-blue-800',
  pending_documents: 'bg-orange-100 text-orange-800',
  pending_payment: 'bg-purple-100 text-purple-800',
  pending_vehicle_assignment: 'bg-gray-100 text-gray-800'
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
};

export default function PendingBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [_error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total_pending: 0,
    urgent_bookings: 0,
    total_revenue: 0,
    average_rating: 0,
    vehicles_requested: 0,
    drivers_waiting: 0,
    documents_pending: 0,
    expiring_soon: 0
  });
  const [_selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);
  const [_showBookingModal, setShowBookingModal] = useState(false);
  const [_showApprovalModal, setShowApprovalModal] = useState(false);
  const [_showRejectionModal, setShowRejectionModal] = useState(false);
  const [_showContactModal, setShowContactModal] = useState(false);

  // Calculate statistics
  const calculateStats = useCallback((bookings: PendingBooking[]) => {
    const totalPending = bookings.length;
    const urgentBookings = bookings.filter(b => b.is_urgent).length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
    const averageRating = bookings.reduce((sum, booking) => sum + booking.driver.rating, 0) / totalPending || 0;
    const vehiclesRequested = new Set(bookings.map(b => b.vehicle_id)).size;
    const driversWaiting = new Set(bookings.map(b => b.driver_id)).size;
    const documentsPending = bookings.filter(b => !b.driver.documents_uploaded).length;
    const expiringSoon = bookings.filter(b => (b.hours_until_deadline ?? 0) <= 6).length;

    setStats({
      total_pending: totalPending,
      urgent_bookings: urgentBookings,
      total_revenue: totalRevenue,
      average_rating: averageRating,
      vehicles_requested: vehiclesRequested,
      drivers_waiting: driversWaiting,
      documents_pending: documentsPending,
      expiring_soon: expiringSoon
    });
  }, []);

  // Load pending bookings
  const loadPendingBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Derive partnerId similar to other pages
      const partnerId = user.role === 'PARTNER_STAFF' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        // No partner ID found - handle silently
        setPendingBookings([]);
        setFilteredBookings([]);
        calculateStats([]);
        return;
      }

      // Fetch pending bookings for this partner
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .in('status', ['pending_partner_approval', 'pending_driver_approval', 'pending_documents', 'pending_payment', 'pending_vehicle_assignment'])
        .order('created_at', { ascending: false });

      if (bookingsError) {
        // Supabase error - handle silently
        setPendingBookings([]);
        setFilteredBookings([]);
        calculateStats([]);
        return;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setPendingBookings([]);
        setFilteredBookings([]);
        calculateStats([]);
        return;
      }

      // Enrich with vehicle and driver details per booking
      const transformedBookings: PendingBooking[] = await Promise.all(
        bookingsData.map(async (booking: any) => {
          // Vehicle details
          const carDocId = booking.car_id || booking.current_vehicle_id || booking.vehicle_id;
          let vehicle: any = {};
          if (carDocId) {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('*')
              .eq('id', carDocId)
              .single();
            if (vehicleData) vehicle = vehicleData;
          }

          // Driver details
          let driver: any = {};
          if (booking.driver_id) {
            const { data: driverData } = await supabase
              .from('users')
              .select('*')
              .eq('id', booking.driver_id)
              .single();
            if (driverData) driver = driverData;
          }

          const startDate = new Date(booking.start_date);
          const now = new Date();
          const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          
          // Calculate urgency
          const deadline = booking.partner_response_deadline ? new Date(booking.partner_response_deadline) : null;
          const hoursUntilDeadline = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (60 * 60 * 1000)) : null;
          const isUrgent = hoursUntilDeadline !== null && hoursUntilDeadline <= 24;

          const weeklyRate = (vehicle.weekly_rate ?? vehicle.price_per_week ?? (vehicle.daily_rate ? vehicle.daily_rate * 7 : 0)) || 0;

          const pendingBooking: PendingBooking = {
            id: booking.id,
            status: booking.status,
            vehicle_id: carDocId || '',
            driver_id: booking.driver_id,
            partner_id: booking.partner_id,
            weeks: booking.weeks || 1,
            total_amount: booking.total_amount || weeklyRate * (booking.weeks || 1),
            start_date: booking.start_date,
            end_date: booking.end_date,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            partner_response_deadline: booking.partner_response_deadline,
            driver_notes: booking.driver_notes,
            partner_notes: booking.partner_notes,

            driver: {
              id: driver.id || '',
              full_name: driver.full_name || driver.name || '',
              email: driver.email || '',
              phone: driver.phone || '',
              verified: driver.verified || false,
              rating: Number(driver.rating) || 0,
              total_rentals: Number(driver.total_rentals) || 0,
              documents_uploaded: Boolean(driver.documents_uploaded),
            },

            vehicle: {
              id: vehicle.id || '',
              make: vehicle.make || '',
              model: vehicle.model || '',
              year: vehicle.year || '',
              license_plate: vehicle.license_plate || vehicle.registration_number || vehicle.registration_plate || '',
              color: vehicle.color || '',
              fuel_type: vehicle.fuel_type || '',
              transmission: vehicle.transmission || '',
              seats: vehicle.seats || '',
              mileage: vehicle.mileage || '',
              image: vehicle.image || '',
              price_per_week: weeklyRate,
              category: vehicle.category || (vehicle.ride_hailing_categories?.[0] ?? ''),
            },

            pickup_location: booking.pickup_location,
            dropoff_location: booking.dropoff_location,
            requirements: booking.requirements || [],
            payment_status: (booking.payment_status as 'pending' | 'paid' | 'overdue') || 'pending',
            deposit_required: Boolean(booking.deposit_required),
            deposit_amount: Number(booking.deposit_amount) || 0,
            deposit_status: (booking.deposit_status as 'pending' | 'received' | 'failed') || 'pending',

            is_urgent: isUrgent,
            hours_until_deadline: hoursUntilDeadline,
            days_until_start: daysUntilStart,
          };

          return pendingBooking;
        })
      );

      setPendingBookings(transformedBookings);
      setFilteredBookings(transformedBookings);
      calculateStats(transformedBookings);
    } catch (err) {
      // Error loading pending bookings - handle silently
      setPendingBookings([]);
      setFilteredBookings([]);
      calculateStats([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [user, calculateStats]);

  // Filter and sort bookings
  useEffect(() => {
    let filtered = [...pendingBookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      if (urgencyFilter === 'urgent') {
        filtered = filtered.filter(booking => booking.is_urgent);
      } else if (urgencyFilter === 'expiring') {
        filtered = filtered.filter(booking => (booking.hours_until_deadline ?? null) !== null && (booking.hours_until_deadline ?? 0) <= 6);
      }
    }

    // Vehicle filter
    if (vehicleFilter) {
      filtered = filtered.filter(booking => booking.vehicle.category === vehicleFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'start_date':
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          break;
        case 'driver_name':
          aValue = a.driver.full_name;
          bValue = b.driver.full_name;
          break;
        case 'urgency':
          aValue = a.hours_until_deadline || Infinity;
          bValue = b.hours_until_deadline || Infinity;
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [pendingBookings, searchTerm, statusFilter, vehicleFilter, sortBy, sortOrder]);

  // Wait for auth state
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadPendingBookings();
  }, [user, authLoading, loadPendingBookings, router]);

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

  if (!user) {
    return null;
  }

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Format functions
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  const formatDuration = (weeks: number) => {
    if (weeks === 1) return '1 week';
    return `${weeks} weeks`;
  };

  const formatTimeRemaining = (hours: number | null | undefined) => {
    if (hours === null || hours === undefined) return 'No deadline';
    if (hours <= 0) return 'Expired';
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.ceil(hours / 24);
    return `${days}d remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending bookings...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Pending Bookings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Review and manage booking requests awaiting your approval
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaFileAlt className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                <FaBan className="w-4 h-4 mr-2" />
                Bulk Approve
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
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_pending}</p>
                <p className="text-xs text-yellow-600">Awaiting action</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent_bookings}</p>
                <p className="text-xs text-red-600">Need immediate attention</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Potential Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-xs text-purple-600">From pending bookings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-lg">
                <FaFileAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Documents Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.documents_pending}</p>
                <p className="text-xs text-orange-600">Need verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Pending Bookings</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drivers, vehicles..."
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
                  <option value="pending_partner_approval">Partner Approval</option>
                  <option value="pending_driver_approval">Driver Approval</option>
                  <option value="pending_documents">Documents</option>
                  <option value="pending_payment">Payment</option>
                  <option value="pending_vehicle_assignment">Vehicle Assignment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="urgent">Urgent (≤24h)</option>
                  <option value="expiring">Expiring (≤6h)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Category</label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="x">X (Economy)</option>
                  <option value="comfort">COMFORT (Standard)</option>
                  <option value="business_comfort">BUSINESS COMFORT (Premium)</option>
                  <option value="exec">EXEC (Executive)</option>
                  <option value="green">GREEN (Electric/Hybrid)</option>
                  <option value="lux">LUX (Luxury)</option>
                  <option value="blacklane">BLACKLANE (Premium Black Car)</option>
                  <option value="wheely">WHEELY (Specialized)</option>
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
                  Pending Bookings ({filteredBookings.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at-desc">Created (Newest)</option>
                  <option value="created_at-asc">Created (Oldest)</option>
                  <option value="start_date-asc">Start Date (Soonest)</option>
                  <option value="urgency-asc">Urgency (Most Urgent)</option>
                  <option value="total_amount-desc">Amount (High-Low)</option>
                  <option value="driver_name-asc">Driver Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {currentBookings.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending bookings found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredBookings.length === 0 && pendingBookings.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any pending booking requests at the moment.'}
              </p>
              {pendingBookings.length === 0 && (
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
                      Booking Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Urgency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentBookings.map((booking) => (
                    <tr key={booking.id} className={`hover:bg-gray-50 ${booking.is_urgent ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{booking.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created {formatDate(booking.created_at)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDuration(booking.weeks)} • {formatCurrency(booking.total_amount)}
                          </div>
                          {booking.is_urgent && (
                            <div className="text-xs text-red-600 font-medium mt-1">
                              ⚠️ {formatTimeRemaining(booking.hours_until_deadline)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FaUserTie className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.driver.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.driver.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                              {booking.driver.rating}
                              {!booking.driver.documents_uploaded && (
                                <span className="ml-2 text-xs text-orange-600">📄 Docs pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.vehicle.make} {booking.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.vehicle.year} • {booking.vehicle.license_plate}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.vehicle.category} • {booking.vehicle.color}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                            {booking.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            Start: {formatDate(booking.start_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.days_until_start} days away
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(booking.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(booking.vehicle.price_per_week)}/week
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[booking.payment_status]}`}>
                            {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                          </span>
                          {booking.deposit_required && (
                            <div className="text-xs text-gray-500 mt-1">
                              Deposit: {formatCurrency(booking.deposit_amount || 0)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowBookingModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaCalendarAlt className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowApprovalModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FaBan className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowRejectionModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaBan className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowContactModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <FaCreditCard className="w-4 h-4" />
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
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
                    onClick={() => handlePageChange(currentPage + 1)}
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