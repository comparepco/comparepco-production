'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaStar, FaSearch, FaFilter, FaEye, FaClock, 
  FaMoneyBillWave, FaCar, FaDownload, FaChartLine,
  FaCalendarAlt, FaUserCircle, FaFileAlt, FaExclamationTriangle,
  FaUsers, FaCheckCircle, FaTimes, FaRoute, FaSpinner,
  FaTrophy, FaAward, FaMedal, FaTrendingUp, FaTrendingDown,
  FaChartBar, FaChartPie, FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DriverPerformance {
  id: string;
  driver_id: string;
  partner_id: string;
  full_name: string;
  email: string;
  phone: string;
  verified: boolean;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  
  // Performance metrics
  performance: {
    rating: number;
    total_rentals: number;
    completed_rentals: number;
    cancelled_rentals: number;
    total_earnings: number;
    average_rating: number;
    total_mileage: number;
    average_duration: number;
    on_time_returns: number;
    late_returns: number;
    early_returns: number;
    damage_incidents: number;
    total_damage_amount: number;
    customer_complaints: number;
    customer_praise: number;
    last_rental_date?: string;
    first_rental_date?: string;
    days_since_last_rental: number;
    rental_frequency: number; // rentals per month
  };
  
  // Financial metrics
  financial: {
    total_revenue_generated: number;
    average_rental_value: number;
    commission_earned: number;
    deposit_returns: number;
    outstanding_payments: number;
    payment_on_time_rate: number;
  };
  
  // Quality metrics
  quality: {
    vehicle_condition_rating: number;
    fuel_efficiency_rating: number;
    cleanliness_rating: number;
    communication_rating: number;
    punctuality_rating: number;
    overall_satisfaction: number;
  };
}

interface DriverPerformanceStats {
  total_drivers: number;
  average_rating: number;
  total_revenue: number;
  total_rentals: number;
  top_performers: number;
  underperformers: number;
  average_rental_value: number;
  total_mileage: number;
}

const PERFORMANCE_COLORS = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  average: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

const getPerformanceLevel = (rating: number) => {
  if (rating >= 4.5) return 'excellent';
  if (rating >= 4.0) return 'good';
  if (rating >= 3.0) return 'average';
  return 'poor';
};

export default function DriverPerformancePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [driverPerformances, setDriverPerformances] = useState<DriverPerformance[]>([]);
  const [filteredPerformances, setFilteredPerformances] = useState<DriverPerformance[]>([]);
  const [stats, setStats] = useState<DriverPerformanceStats>({
    total_drivers: 0,
    average_rating: 0,
    total_revenue: 0,
    total_rentals: 0,
    top_performers: 0,
    underperformers: 0,
    average_rental_value: 0,
    total_mileage: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadDriverPerformances = async () => {
    try {
      setLoading(true);

      if (!user) return;

      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        setDriverPerformances([]);
        setFilteredPerformances([]);
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
        setDriverPerformances([]);
        setFilteredPerformances([]);
        calculateStats([]);
        return;
      }

      const uniqueDriverIds = [...new Set(bookingsData.map(b => b.driver_id))];

      if (uniqueDriverIds.length === 0) {
        setDriverPerformances([]);
        setFilteredPerformances([]);
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
        setDriverPerformances([]);
        setFilteredPerformances([]);
        calculateStats([]);
        return;
      }

      // Enrich with detailed performance data
      const transformedPerformances: DriverPerformance[] = await Promise.all(
        driversData.map(async (driver: any) => {
          // Get driver's complete booking history with this partner
          const { data: driverBookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('partner_id', partnerId)
            .eq('driver_id', driver.id);

          const bookings = driverBookings || [];
          const completedBookings = bookings.filter((b: any) => b.status === 'completed');
          const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled');
          
          // Calculate detailed metrics
          const totalEarnings = completedBookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
          const averageRating = completedBookings.reduce((sum: number, b: any) => sum + (b.driver_rating || 0), 0) / completedBookings.length || 0;
          const totalMileage = completedBookings.reduce((sum: number, b: any) => sum + (b.total_mileage || 0), 0);
          
          // Calculate return timing metrics
          const onTimeReturns = completedBookings.filter((b: any) => {
            if (!b.actual_end_date || !b.end_date) return false;
            const actualEnd = new Date(b.actual_end_date);
            const expectedEnd = new Date(b.end_date);
            const diffHours = Math.abs(actualEnd.getTime() - expectedEnd.getTime()) / (1000 * 60 * 60);
            return diffHours <= 2; // Within 2 hours is considered on time
          }).length;
          
          const lateReturns = completedBookings.filter((b: any) => {
            if (!b.actual_end_date || !b.end_date) return false;
            const actualEnd = new Date(b.actual_end_date);
            const expectedEnd = new Date(b.end_date);
            return actualEnd > expectedEnd;
          }).length;
          
          const earlyReturns = completedBookings.filter((b: any) => {
            if (!b.actual_end_date || !b.end_date) return false;
            const actualEnd = new Date(b.actual_end_date);
            const expectedEnd = new Date(b.end_date);
            const diffHours = (expectedEnd.getTime() - actualEnd.getTime()) / (1000 * 60 * 60);
            return diffHours > 2; // More than 2 hours early
          }).length;

          // Calculate average duration
          const totalDuration = completedBookings.reduce((sum: number, b: any) => {
            if (!b.start_date || !b.end_date) return sum;
            const start = new Date(b.start_date);
            const end = new Date(b.end_date);
            return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          }, 0);
          const averageDuration = completedBookings.length > 0 ? totalDuration / completedBookings.length : 0;

          // Calculate rental frequency (rentals per month)
          const firstRental = bookings.length > 0 ? new Date(bookings[0].created_at) : new Date();
          const lastRental = bookings.length > 0 ? new Date(bookings[bookings.length - 1].created_at) : new Date();
          const monthsActive = Math.max(1, (lastRental.getTime() - firstRental.getTime()) / (1000 * 60 * 60 * 24 * 30));
          const rentalFrequency = bookings.length / monthsActive;

          // Calculate days since last rental
          const now = new Date();
          const lastRentalDate = bookings.length > 0 ? new Date(bookings[bookings.length - 1].created_at) : null;
          const daysSinceLastRental = lastRentalDate ? Math.ceil((now.getTime() - lastRentalDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

          const performance: DriverPerformance = {
            id: driver.id,
            driver_id: driver.id,
            partner_id: partnerId,
            full_name: driver.full_name || driver.name || '',
            email: driver.email || '',
            phone: driver.phone || '',
            verified: driver.verified || false,
            is_approved: driver.is_approved || false,
            is_active: driver.is_active || false,
            created_at: driver.created_at,

            performance: {
              rating: Number(driver.rating) || 0,
              total_rentals: bookings.length,
              completed_rentals: completedBookings.length,
              cancelled_rentals: cancelledBookings.length,
              total_earnings: totalEarnings,
              average_rating: averageRating,
              total_mileage: totalMileage,
              average_duration: averageDuration,
              on_time_returns: onTimeReturns,
              late_returns: lateReturns,
              early_returns: earlyReturns,
              damage_incidents: completedBookings.filter((b: any) => b.damage_reported).length,
              total_damage_amount: completedBookings.reduce((sum: number, b: any) => sum + (b.damage_amount || 0), 0),
              customer_complaints: completedBookings.filter((b: any) => b.customer_complaint).length,
              customer_praise: completedBookings.filter((b: any) => b.customer_praise).length,
              last_rental_date: bookings.length > 0 ? bookings[bookings.length - 1].created_at : undefined,
              first_rental_date: bookings.length > 0 ? bookings[0].created_at : undefined,
              days_since_last_rental: daysSinceLastRental,
              rental_frequency: rentalFrequency,
            },

            financial: {
              total_revenue_generated: totalEarnings,
              average_rental_value: completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0,
              commission_earned: totalEarnings * 0.1, // Assuming 10% commission
              deposit_returns: completedBookings.reduce((sum: number, b: any) => sum + (b.deposit_amount || 0), 0),
              outstanding_payments: completedBookings.filter((b: any) => b.payment_status === 'pending').reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0),
              payment_on_time_rate: completedBookings.filter((b: any) => b.payment_status === 'paid').length / completedBookings.length * 100 || 0,
            },

            quality: {
              vehicle_condition_rating: completedBookings.reduce((sum: number, b: any) => sum + (b.condition_rating || 5), 0) / completedBookings.length || 5,
              fuel_efficiency_rating: completedBookings.reduce((sum: number, b: any) => sum + (b.fuel_efficiency_rating || 5), 0) / completedBookings.length || 5,
              cleanliness_rating: completedBookings.reduce((sum: number, b: any) => sum + (b.cleanliness_rating || 5), 0) / completedBookings.length || 5,
              communication_rating: completedBookings.reduce((sum: number, b: any) => sum + (b.communication_rating || 5), 0) / completedBookings.length || 5,
              punctuality_rating: completedBookings.reduce((sum: number, b: any) => sum + (b.punctuality_rating || 5), 0) / completedBookings.length || 5,
              overall_satisfaction: averageRating,
            },
          };

          return performance;
        })
      );

      setDriverPerformances(transformedPerformances);
      setFilteredPerformances(transformedPerformances);
      calculateStats(transformedPerformances);
    } catch (err) {
      console.error('Error loading driver performances:', err);
      setDriverPerformances([]);
      setFilteredPerformances([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (performances: DriverPerformance[]) => {
    const totalDrivers = performances.length;
    const averageRating = performances.reduce((sum, p) => sum + p.performance.rating, 0) / totalDrivers || 0;
    const totalRevenue = performances.reduce((sum, p) => sum + p.performance.total_earnings, 0);
    const totalRentals = performances.reduce((sum, p) => sum + p.performance.total_rentals, 0);
    const topPerformers = performances.filter(p => p.performance.rating >= 4.5).length;
    const underperformers = performances.filter(p => p.performance.rating < 3.0).length;
    const averageRentalValue = totalRentals > 0 ? totalRevenue / totalRentals : 0;
    const totalMileage = performances.reduce((sum, p) => sum + p.performance.total_mileage, 0);

    setStats({
      total_drivers: totalDrivers,
      average_rating: averageRating,
      total_revenue: totalRevenue,
      total_rentals: totalRentals,
      top_performers: topPerformers,
      underperformers: underperformers,
      average_rental_value: averageRentalValue,
      total_mileage: totalMileage
    });
  };

  useEffect(() => {
    let filtered = [...driverPerformances];

    if (searchTerm) {
      filtered = filtered.filter(performance =>
        performance.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        performance.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter(performance => performance.performance.rating >= minRating);
    }

    if (performanceFilter !== 'all') {
      filtered = filtered.filter(performance => {
        const level = getPerformanceLevel(performance.performance.rating);
        return level === performanceFilter;
      });
    }

    if (activityFilter !== 'all') {
      filtered = filtered.filter(performance => {
        switch (activityFilter) {
          case 'active':
            return performance.performance.days_since_last_rental <= 30;
          case 'inactive':
            return performance.performance.days_since_last_rental > 30;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'rating':
          aValue = a.performance.rating;
          bValue = b.performance.rating;
          break;
        case 'total_rentals':
          aValue = a.performance.total_rentals;
          bValue = b.performance.total_rentals;
          break;
        case 'total_earnings':
          aValue = a.performance.total_earnings;
          bValue = b.performance.total_earnings;
          break;
        case 'rental_frequency':
          aValue = a.performance.rental_frequency;
          bValue = b.performance.rental_frequency;
          break;
        case 'full_name':
          aValue = a.full_name;
          bValue = b.full_name;
          break;
        default:
          aValue = a.performance.rating;
          bValue = b.performance.rating;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPerformances(filtered);
    setCurrentPage(1);
  }, [driverPerformances, searchTerm, ratingFilter, performanceFilter, activityFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadDriverPerformances();
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

  const totalPages = Math.ceil(filteredPerformances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPerformances = filteredPerformances.slice(startIndex, endIndex);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');
  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  const formatRating = (rating: number) => rating.toFixed(1);
  const formatMileage = (miles: number) => `${miles.toLocaleString()} miles`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver performances...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Driver Performance</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor driver performance metrics and analytics
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
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{formatRating(stats.average_rating)}</p>
                <p className="text-xs text-yellow-600">Overall satisfaction</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-xs text-green-600">Generated revenue</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaTrophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.top_performers}</p>
                <p className="text-xs text-purple-600">4.5+ rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-lg">
                <FaCar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rentals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_rentals}</p>
                <p className="text-xs text-indigo-600">Completed rentals</p>
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
                <p className="text-sm font-medium text-gray-600">Underperformers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.underperformers}</p>
                <p className="text-xs text-red-600">Below 3.0 rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Driver Performance</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Performance Level</label>
                <select
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="excellent">Excellent (4.5+)</option>
                  <option value="good">Good (4.0-4.4)</option>
                  <option value="average">Average (3.0-3.9)</option>
                  <option value="poor">Poor (<3.0)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Status</label>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Activity</option>
                  <option value="active">Active (Last 30 days)</option>
                  <option value="inactive">Inactive (>30 days)</option>
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
                  <option value="rating-desc">Rating (High-Low)</option>
                  <option value="rating-asc">Rating (Low-High)</option>
                  <option value="total_rentals-desc">Rentals (High-Low)</option>
                  <option value="total_earnings-desc">Earnings (High-Low)</option>
                  <option value="rental_frequency-desc">Frequency (High-Low)</option>
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
                  Driver Performance ({filteredPerformances.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredPerformances.length)} of {filteredPerformances.length} drivers
                </p>
              </div>
            </div>
          </div>

          {currentPerformances.length === 0 ? (
            <div className="text-center py-12">
              <FaStar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No driver performance data found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredPerformances.length === 0 && driverPerformances.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any driver performance data yet.'}
              </p>
              {driverPerformances.length === 0 && (
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
                      Performance Metrics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Financial Metrics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality Metrics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPerformances.map((performance) => (
                    <tr key={performance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FaUserCircle className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {performance.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {performance.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                              {formatRating(performance.performance.rating)}
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                PERFORMANCE_COLORS[getPerformanceLevel(performance.performance.rating)]
                              }`}>
                                {getPerformanceLevel(performance.performance.rating).charAt(0).toUpperCase() + getPerformanceLevel(performance.performance.rating).slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {performance.performance.total_rentals} rentals
                          </div>
                          <div className="text-sm text-gray-500">
                            {performance.performance.completed_rentals} completed
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatMileage(performance.performance.total_mileage)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {performance.performance.rental_frequency.toFixed(1)} rentals/month
                          </div>
                          {performance.performance.days_since_last_rental > 0 && (
                            <div className="text-xs text-gray-500">
                              Last rental: {performance.performance.days_since_last_rental} days ago
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(performance.performance.total_earnings)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Avg: {formatCurrency(performance.financial.average_rental_value)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Commission: {formatCurrency(performance.financial.commission_earned)}
                          </div>
                          <div className="text-sm text-gray-500">
                            On-time payments: {performance.financial.payment_on_time_rate.toFixed(0)}%
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Overall: {formatRating(performance.quality.overall_satisfaction)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Vehicle: {formatRating(performance.quality.vehicle_condition_rating)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Punctuality: {formatRating(performance.quality.punctuality_rating)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Communication: {formatRating(performance.quality.communication_rating)}
                          </div>
                          {performance.performance.damage_incidents > 0 && (
                            <div className="text-xs text-red-600">
                              {performance.performance.damage_incidents} damage incidents
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <FaChartLine className="w-4 h-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900">
                            <FaTrophy className="w-4 h-4" />
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredPerformances.length)} of {filteredPerformances.length} results
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