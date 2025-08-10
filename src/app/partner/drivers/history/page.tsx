'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaHistory, FaSearch, FaFilter, FaEye, FaClock, 
  FaMoneyBillWave, FaCar, FaStar, FaDownload, FaChartLine,
  FaCalendarAlt, FaUserCircle, FaFileAlt, FaExclamationTriangle,
  FaUsers, FaCheckCircle, FaTimes, FaRoute, FaSpinner
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DriverHistory {
  id: string;
  driver_id: string;
  partner_id: string;
  booking_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: 'completed' | 'cancelled' | 'suspended';
  created_at: string;
  
  driver: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    verified: boolean;
    rating: number;
    total_rentals: number;
  };
  
  vehicle: {
    id: string;
    make: string;
    model: string;
    license_plate: string;
    category: string;
  };
  
  booking: {
    id: string;
    total_amount: number;
    weeks: number;
    payment_status: 'pending' | 'paid' | 'overdue';
  };
  
  performance: {
    total_mileage?: number;
    condition_rating?: number;
    driver_rating?: number;
    actual_duration: number;
    was_overdue: boolean;
    overdue_days: number;
    damage_reported: boolean;
    damage_amount?: number;
  };
}

interface DriverHistoryStats {
  total_rentals: number;
  completed_rentals: number;
  total_revenue: number;
  average_rating: number;
  unique_drivers: number;
  total_mileage: number;
  overdue_rentals: number;
  damaged_vehicles: number;
}

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800'
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
};

export default function DriverHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [driverHistory, setDriverHistory] = useState<DriverHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<DriverHistory[]>([]);
  const [stats, setStats] = useState<DriverHistoryStats>({
    total_rentals: 0,
    completed_rentals: 0,
    total_revenue: 0,
    average_rating: 0,
    unique_drivers: 0,
    total_mileage: 0,
    overdue_rentals: 0,
    damaged_vehicles: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('end_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadDriverHistory = async () => {
    try {
      setLoading(true);

      if (!user) return;

      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        setDriverHistory([]);
        setFilteredHistory([]);
        calculateStats([]);
        return;
      }

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .in('status', ['completed', 'cancelled', 'suspended'])
        .order('created_at', { ascending: false });

      if (bookingsError || !bookingsData) {
        setDriverHistory([]);
        setFilteredHistory([]);
        calculateStats([]);
        return;
      }

      const transformedHistory: DriverHistory[] = await Promise.all(
        bookingsData.map(async (booking: any) => {
          let driver: any = {};
          if (booking.driver_id) {
            const { data: driverData } = await supabase
              .from('users')
              .select('*')
              .eq('id', booking.driver_id)
              .single();
            if (driverData) driver = driverData;
          }

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

          const startDate = new Date(booking.start_date);
          const endDate = new Date(booking.end_date);
          const actualEndDate = booking.actual_end_date ? new Date(booking.actual_end_date) : endDate;
          const actualDuration = Math.ceil((actualEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const wasOverdue = actualEndDate > endDate;
          const overdueDays = wasOverdue ? Math.ceil((actualEndDate.getTime() - endDate.getTime()) / (24 * 60 * 60 * 1000)) : 0;

          const weeklyRate = (vehicle.weekly_rate ?? vehicle.price_per_week ?? (vehicle.daily_rate ? vehicle.daily_rate * 7 : 0)) || 0;

          const history: DriverHistory = {
            id: booking.id,
            driver_id: booking.driver_id,
            partner_id: booking.partner_id,
            booking_id: booking.id,
            vehicle_id: carDocId || '',
            start_date: booking.start_date,
            end_date: booking.end_date,
            status: (booking.status as 'completed' | 'cancelled' | 'suspended') || 'completed',
            created_at: booking.created_at,

            driver: {
              id: driver.id || '',
              full_name: driver.full_name || driver.name || '',
              email: driver.email || '',
              phone: driver.phone || '',
              verified: driver.verified || false,
              rating: Number(driver.rating) || 0,
              total_rentals: Number(driver.total_rentals) || 0,
            },

            vehicle: {
              id: vehicle.id || '',
              make: vehicle.make || '',
              model: vehicle.model || '',
              license_plate: vehicle.license_plate || vehicle.registration_number || vehicle.registration_plate || '',
              category: vehicle.category || (vehicle.ride_hailing_categories?.[0] ?? ''),
            },

            booking: {
              id: booking.id,
              total_amount: booking.total_amount || weeklyRate * (booking.weeks || 1),
              weeks: booking.weeks || 1,
              payment_status: (booking.payment_status as 'pending' | 'paid' | 'overdue') || 'paid',
            },

            performance: {
              total_mileage: Number(booking.total_mileage) || 0,
              condition_rating: Number(booking.condition_rating) || 5,
              driver_rating: Number(booking.driver_rating) || 0,
              actual_duration: actualDuration,
              was_overdue: wasOverdue,
              overdue_days: overdueDays,
              damage_reported: Boolean(booking.damage_reported),
              damage_amount: Number(booking.damage_amount) || 0,
            },
          };

          return history;
        })
      );

      setDriverHistory(transformedHistory);
      setFilteredHistory(transformedHistory);
      calculateStats(transformedHistory);
    } catch (err) {
      console.error('Error loading driver history:', err);
      setDriverHistory([]);
      setFilteredHistory([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (history: DriverHistory[]) => {
    const totalRentals = history.length;
    const completedRentals = history.filter(h => h.status === 'completed').length;
    const totalRevenue = history.reduce((sum, h) => sum + h.booking.total_amount, 0);
    const averageRating = history.reduce((sum, h) => sum + h.driver.rating, 0) / totalRentals || 0;
    const uniqueDrivers = new Set(history.map(h => h.driver_id)).size;
    const totalMileage = history.reduce((sum, h) => sum + (h.performance.total_mileage || 0), 0);
    const overdueRentals = history.filter(h => h.performance.was_overdue).length;
    const damagedVehicles = history.filter(h => h.performance.damage_reported).length;

    setStats({
      total_rentals: totalRentals,
      completed_rentals: completedRentals,
      total_revenue: totalRevenue,
      average_rating: averageRating,
      unique_drivers: uniqueDrivers,
      total_mileage: totalMileage,
      overdue_rentals: overdueRentals,
      damaged_vehicles: damagedVehicles
    });
  };

  useEffect(() => {
    let filtered = [...driverHistory];

    if (searchTerm) {
      filtered = filtered.filter(history =>
        history.driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        history.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        history.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(history => history.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(history => history.booking.payment_status === paymentFilter);
    }

    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(history => {
        const endDate = new Date(history.end_date);
        switch (dateRangeFilter) {
          case '30days':
            return endDate >= thirtyDaysAgo;
          case '90days':
            return endDate >= ninetyDaysAgo;
          case '1year':
            return endDate >= oneYearAgo;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'end_date':
          aValue = new Date(a.end_date);
          bValue = new Date(b.end_date);
          break;
        case 'driver_name':
          aValue = a.driver.full_name;
          bValue = b.driver.full_name;
          break;
        case 'total_amount':
          aValue = a.booking.total_amount;
          bValue = b.booking.total_amount;
          break;
        default:
          aValue = new Date(a.end_date);
          bValue = new Date(b.end_date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [driverHistory, searchTerm, statusFilter, paymentFilter, dateRangeFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadDriverHistory();
  }, [user, authLoading]);

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

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentHistory = filteredHistory.slice(startIndex, endIndex);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');
  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  const formatRating = (rating: number) => rating.toFixed(1);
  const formatMileage = (miles: number) => `${miles.toLocaleString()} miles`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver history...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Driver History</h1>
              <p className="mt-1 text-sm text-gray-600">
                View historical driver performance and rental data
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export
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
                <FaHistory className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rentals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_rentals}</p>
                <p className="text-xs text-blue-600">Historical data</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed_rentals}</p>
                <p className="text-xs text-green-600">Successful rentals</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-xs text-purple-600">Historical earnings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{formatRating(stats.average_rating)}</p>
                <p className="text-xs text-yellow-600">Driver satisfaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-lg">
                <FaUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unique_drivers}</p>
                <p className="text-xs text-indigo-600">Total drivers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-teal-500 p-3 rounded-lg">
                <FaRoute className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mileage</p>
                <p className="text-2xl font-bold text-gray-900">{formatMileage(stats.total_mileage)}</p>
                <p className="text-xs text-teal-600">Distance covered</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Rentals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue_rentals}</p>
                <p className="text-xs text-red-600">Late returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Driver History</h2>
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
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="1year">Last Year</option>
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
                  <option value="end_date-desc">End Date (Recent)</option>
                  <option value="end_date-asc">End Date (Oldest)</option>
                  <option value="driver_name-asc">Driver Name (A-Z)</option>
                  <option value="total_amount-desc">Amount (High-Low)</option>
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
                  Driver History ({filteredHistory.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} records
                </p>
              </div>
            </div>
          </div>

          {currentHistory.length === 0 ? (
            <div className="text-center py-12">
              <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No driver history found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredHistory.length === 0 && driverHistory.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any completed driver rentals yet.'}
              </p>
              {driverHistory.length === 0 && (
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
                      Driver & Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rental Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Financial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentHistory.map((history) => (
                    <tr key={history.id} className={`hover:bg-gray-50 ${history.performance.was_overdue ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FaUserCircle className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {history.driver.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {history.driver.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                              {formatRating(history.driver.rating)}
                              <span className="ml-2 text-xs text-gray-400">
                                ({history.driver.total_rentals} rentals)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-900">
                            {history.vehicle.make} {history.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {history.vehicle.license_plate} • {history.vehicle.category}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(history.start_date)} - {formatDate(history.end_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {history.booking.weeks} weeks • {history.performance.actual_duration} days actual
                          </div>
                          {history.performance.was_overdue && (
                            <div className="text-xs text-red-600 font-medium mt-1">
                              ⚠ {history.performance.overdue_days} days overdue
                            </div>
                          )}
                          {history.performance.damage_reported && (
                            <div className="text-xs text-orange-600 font-medium mt-1">
                              🔧 Damage reported
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatMileage(history.performance.total_mileage || 0)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Condition: {history.performance.condition_rating}/5
                          </div>
                          {history.driver.verified && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              ✓ Verified driver
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[history.status]}`}>
                            {history.status.charAt(0).toUpperCase() + history.status.slice(1)}
                          </span>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {formatCurrency(history.booking.total_amount)}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[history.booking.payment_status]}`}>
                            {history.booking.payment_status.charAt(0).toUpperCase() + history.booking.payment_status.slice(1)}
                          </span>
                          {history.performance.damage_amount > 0 && (
                            <div className="text-xs text-red-500 mt-1">
                              Damage: {formatCurrency(history.performance.damage_amount)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900">
                            <FaChartLine className="w-4 h-4" />
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} results
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