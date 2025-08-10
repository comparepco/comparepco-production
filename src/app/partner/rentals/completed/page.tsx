'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaCheckCircle, FaSearch, FaFilter, FaEye, FaHistory, 
  FaMoneyBillWave, FaCar, FaStar, FaDownload, FaChartLine,
  FaCalendarAlt, FaUserCircle, FaFileAlt, FaExclamationTriangle,
  FaThumbsUp, FaThumbsDown, FaComments, FaPhone, FaEnvelope,
  FaPlus, FaUpload, FaSignature, FaUndo, FaBolt, FaTools,
  FaShieldAlt, FaChevronRight, FaBuilding, FaUser, FaEdit,
  FaTrash, FaBell, FaExchangeAlt, FaPaperPlane, FaCheck,
  FaInfoCircle, FaTh, FaList, FaTrophy, FaAward, FaMedal,
  FaUserCheck, FaFileContract, FaHandshake, FaSpinner,
  FaClock, FaMapMarkerAlt, FaCreditCard, FaReceipt
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type Definitions
interface CompletedRental {
  id: string;
  status: string;
  vehicle_id: string;
  driver_id: string;
  partner_id: string;
  weeks: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  actual_end_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
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
  
  // Rental details
  pickup_location?: string;
  dropoff_location?: string;
  requirements?: string[];
  payment_status: 'completed' | 'refunded' | 'disputed';
  deposit_amount?: number;
  deposit_status?: 'returned' | 'forfeited' | 'pending';
  
  // Completion details
  final_mileage?: number;
  fuel_level?: string;
  condition_rating?: number;
  driver_rating?: number;
  partner_rating?: number;
  driver_feedback?: string;
  partner_feedback?: string;
  
  // Financial details
  commission_amount?: number;
  net_revenue?: number;
  late_fees?: number;
  damage_fees?: number;
  cleaning_fees?: number;
  
  // Duration tracking
  actual_duration_weeks?: number;
  early_return?: boolean;
  late_return?: boolean;
  days_overdue?: number;
}

interface CompletedRentalStats {
  total_completed: number;
  total_revenue: number;
  average_rating: number;
  total_weeks: number;
  unique_drivers: number;
  unique_vehicles: number;
  average_duration: number;
  commission_earned: number;
}

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  completed_early: 'bg-blue-100 text-blue-800',
  completed_late: 'bg-orange-100 text-orange-800',
  disputed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

const PAYMENT_STATUS_COLORS = {
  completed: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
  disputed: 'bg-red-100 text-red-800'
};

export default function CompletedRentalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [completedRentals, setCompletedRentals] = useState<CompletedRental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<CompletedRental[]>([]);
  const [stats, setStats] = useState<CompletedRentalStats>({
    total_completed: 0,
    total_revenue: 0,
    average_rating: 0,
    total_weeks: 0,
    unique_drivers: 0,
    unique_vehicles: 0,
    average_duration: 0,
    commission_earned: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('completed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [selectedRental, setSelectedRental] = useState<CompletedRental | null>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);

  // Load completed rentals
  const loadCompletedRentals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Derive partnerId similar to other pages
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        console.error('No partner ID found for completed rentals');
        setCompletedRentals([]);
        setFilteredRentals([]);
        calculateStats([]);
        return;
      }

      // Fetch completed rentals for this partner
      const { data: rentalsData, error: rentalsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .in('status', ['completed', 'completed_early', 'completed_late', 'disputed', 'refunded'])
        .order('updated_at', { ascending: false });

      if (rentalsError) {
        console.error('Supabase error (rentals):', {
          message: (rentalsError as any).message,
          details: (rentalsError as any).details,
          hint: (rentalsError as any).hint,
          code: (rentalsError as any).code,
        });
        setCompletedRentals([]);
        setFilteredRentals([]);
        calculateStats([]);
        return;
      }

      if (!rentalsData || rentalsData.length === 0) {
        setCompletedRentals([]);
        setFilteredRentals([]);
        calculateStats([]);
        return;
      }

      // Enrich with vehicle and driver details per rental
      const transformedRentals: CompletedRental[] = await Promise.all(
        rentalsData.map(async (rental: any) => {
          // Vehicle details
          const carDocId = rental.car_id || rental.current_vehicle_id || rental.vehicle_id;
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
          if (rental.driver_id) {
            const { data: driverData } = await supabase
              .from('users')
              .select('*')
              .eq('id', rental.driver_id)
              .single();
            if (driverData) driver = driverData;
          }

          const startDate = new Date(rental.start_date);
          const endDate = new Date(rental.end_date);
          const actualEndDate = rental.actual_end_date ? new Date(rental.actual_end_date) : endDate;
          
          // Calculate duration and overdue
          const plannedDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const actualDuration = Math.ceil((actualEndDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const actualDurationWeeks = Math.ceil(actualDuration / 7);
          const daysOverdue = actualEndDate > endDate ? Math.ceil((actualEndDate.getTime() - endDate.getTime()) / (24 * 60 * 60 * 1000)) : 0;
          const earlyReturn = actualEndDate < endDate;
          const lateReturn = actualEndDate > endDate;

          const weeklyRate = (vehicle.weekly_rate ?? vehicle.price_per_week ?? (vehicle.daily_rate ? vehicle.daily_rate * 7 : 0)) || 0;
          const commissionRate = 0.15; // 15% commission
          const commissionAmount = (rental.total_amount || weeklyRate * (rental.weeks || 1)) * commissionRate;

          const completedRental: CompletedRental = {
            id: rental.id,
            status: rental.status,
            vehicle_id: carDocId || '',
            driver_id: rental.driver_id,
            partner_id: rental.partner_id,
            weeks: rental.weeks || 1,
            total_amount: rental.total_amount || weeklyRate * (rental.weeks || 1),
            start_date: rental.start_date,
            end_date: rental.end_date,
            actual_end_date: rental.actual_end_date,
            created_at: rental.created_at,
            updated_at: rental.updated_at,
            completed_at: rental.completed_at || rental.updated_at,

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

            pickup_location: rental.pickup_location,
            dropoff_location: rental.dropoff_location,
            requirements: rental.requirements || [],
            payment_status: (rental.payment_status as 'completed' | 'refunded' | 'disputed') || 'completed',
            deposit_amount: Number(rental.deposit_amount) || 0,
            deposit_status: (rental.deposit_status as 'returned' | 'forfeited' | 'pending') || 'returned',

            final_mileage: Number(rental.final_mileage) || 0,
            fuel_level: rental.fuel_level || 'Full',
            condition_rating: Number(rental.condition_rating) || 5,
            driver_rating: Number(rental.driver_rating) || 0,
            partner_rating: Number(rental.partner_rating) || 0,
            driver_feedback: rental.driver_feedback || '',
            partner_feedback: rental.partner_feedback || '',

            commission_amount: commissionAmount,
            net_revenue: (rental.total_amount || weeklyRate * (rental.weeks || 1)) - commissionAmount,
            late_fees: Number(rental.late_fees) || 0,
            damage_fees: Number(rental.damage_fees) || 0,
            cleaning_fees: Number(rental.cleaning_fees) || 0,

            actual_duration_weeks: actualDurationWeeks,
            early_return: earlyReturn,
            late_return: lateReturn,
            days_overdue: daysOverdue,
          };

          return completedRental;
        })
      );

      setCompletedRentals(transformedRentals);
      setFilteredRentals(transformedRentals);
      calculateStats(transformedRentals);
    } catch (err) {
      console.error('Error loading completed rentals:', err);
      setCompletedRentals([]);
      setFilteredRentals([]);
      calculateStats([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (rentals: CompletedRental[]) => {
    const totalCompleted = rentals.length;
    const totalRevenue = rentals.reduce((sum, rental) => sum + rental.total_amount, 0);
    const averageRating = rentals.reduce((sum, rental) => sum + rental.driver_rating, 0) / totalCompleted || 0;
    const totalWeeks = rentals.reduce((sum, rental) => sum + rental.actual_duration_weeks, 0);
    const uniqueDrivers = new Set(rentals.map(r => r.driver_id)).size;
    const uniqueVehicles = new Set(rentals.map(r => r.vehicle_id)).size;
    const averageDuration = totalWeeks / totalCompleted || 0;
    const commissionEarned = rentals.reduce((sum, rental) => sum + (rental.commission_amount || 0), 0);

    setStats({
      total_completed: totalCompleted,
      total_revenue: totalRevenue,
      average_rating: averageRating,
      total_weeks: totalWeeks,
      unique_drivers: uniqueDrivers,
      unique_vehicles: uniqueVehicles,
      average_duration: averageDuration,
      commission_earned: commissionEarned
    });
  };

  // Filter and sort rentals
  useEffect(() => {
    let filtered = [...completedRentals];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(rental =>
        rental.driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rental => rental.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(rental => rental.payment_status === paymentFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(rental => {
        const completedDate = new Date(rental.completed_at || rental.updated_at);
        switch (dateRangeFilter) {
          case '30days':
            return completedDate >= thirtyDaysAgo;
          case '90days':
            return completedDate >= ninetyDaysAgo;
          case '1year':
            return completedDate >= oneYearAgo;
          default:
            return true;
        }
      });
    }

    // Vehicle filter
    if (vehicleFilter !== 'all') {
      filtered = filtered.filter(rental => rental.vehicle.category === vehicleFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(rental => rental.driver_rating >= minRating);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'completed_at':
          aValue = new Date(a.completed_at || a.updated_at);
          bValue = new Date(b.completed_at || b.updated_at);
          break;
        case 'start_date':
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          break;
        case 'driver_name':
          aValue = a.driver.full_name;
          bValue = b.driver.full_name;
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'driver_rating':
          aValue = a.driver_rating;
          bValue = b.driver_rating;
          break;
        case 'duration':
          aValue = a.actual_duration_weeks;
          bValue = b.actual_duration_weeks;
          break;
        default:
          aValue = new Date(a.completed_at || a.updated_at);
          bValue = new Date(b.completed_at || b.updated_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredRentals(filtered);
    setCurrentPage(1);
  }, [completedRentals, searchTerm, statusFilter, paymentFilter, dateRangeFilter, vehicleFilter, ratingFilter, sortBy, sortOrder]);

  // Wait for auth state
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadCompletedRentals();
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

  if (!user) {
    return null;
  }

  // Pagination
  const totalPages = Math.ceil(filteredRentals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRentals = filteredRentals.slice(startIndex, endIndex);

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

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading completed rentals...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Completed Rentals</h1>
              <p className="mt-1 text-sm text-gray-600">
                View and analyze your completed rental history and performance
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export Report
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
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Rentals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_completed}</p>
                <p className="text-xs text-green-600">Successful transactions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-xs text-blue-600">Gross earnings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{formatRating(stats.average_rating)}</p>
                <p className="text-xs text-yellow-600">Driver satisfaction</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaTrophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.commission_earned)}</p>
                <p className="text-xs text-purple-600">Platform fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Completed Rentals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
                  <option value="completed_early">Completed Early</option>
                  <option value="completed_late">Completed Late</option>
                  <option value="disputed">Disputed</option>
                  <option value="refunded">Refunded</option>
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
                  <option value="completed">Completed</option>
                  <option value="refunded">Refunded</option>
                  <option value="disputed">Disputed</option>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
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
                  Completed Rentals ({filteredRentals.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredRentals.length)} of {filteredRentals.length} rentals
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
                  <option value="completed_at-desc">Completed (Recent)</option>
                  <option value="completed_at-asc">Completed (Oldest)</option>
                  <option value="total_amount-desc">Amount (High-Low)</option>
                  <option value="driver_rating-desc">Rating (High-Low)</option>
                  <option value="duration-desc">Duration (Long-Short)</option>
                  <option value="driver_name-asc">Driver Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {currentRentals.length === 0 ? (
            <div className="text-center py-12">
              <FaCheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No completed rentals found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredRentals.length === 0 && completedRentals.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any completed rentals yet.'}
              </p>
              {completedRentals.length === 0 && (
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
                      Rental Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration & Status
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
                  {currentRentals.map((rental) => (
                    <tr key={rental.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{rental.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Completed {formatDate(rental.completed_at || rental.updated_at)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDuration(rental.actual_duration_weeks || rental.weeks)} • {formatCurrency(rental.total_amount)}
                          </div>
                          {rental.early_return && (
                            <div className="text-xs text-blue-600 font-medium mt-1">
                              ✓ Early return
                            </div>
                          )}
                          {rental.late_return && (
                            <div className="text-xs text-orange-600 font-medium mt-1">
                              ⚠ {rental.days_overdue} days overdue
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FaUserCircle className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {rental.driver.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rental.driver.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                              {formatRating(rental.driver_rating)}
                              <span className="ml-2 text-xs text-gray-400">
                                ({rental.driver.total_rentals} rentals)
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {rental.vehicle.make} {rental.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rental.vehicle.year} • {rental.vehicle.license_plate}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rental.vehicle.category} • {rental.vehicle.color}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[rental.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'}`}>
                            {rental.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(rental.start_date)} - {formatDate(rental.actual_end_date || rental.end_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDuration(rental.actual_duration_weeks || rental.weeks)}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(rental.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Net: {formatCurrency(rental.net_revenue || rental.total_amount)}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[rental.payment_status]}`}>
                            {rental.payment_status.charAt(0).toUpperCase() + rental.payment_status.slice(1)}
                          </span>
                          {(rental.late_fees || rental.damage_fees || rental.cleaning_fees) > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              +{formatCurrency((rental.late_fees || 0) + (rental.damage_fees || 0) + (rental.cleaning_fees || 0))} fees
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRental(rental);
                              setShowRentalModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRental(rental);
                              setShowFeedbackModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FaComments className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRental(rental);
                              setShowFinancialModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <FaReceipt className="w-4 h-4" />
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRentals.length)} of {filteredRentals.length} results
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