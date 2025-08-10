'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, FaSearch, FaFilter, FaEye, FaClock, 
  FaMoneyBillWave, FaCar, FaStar, FaDownload, FaChartLine,
  FaCalendarAlt, FaUserCircle, FaFileAlt, FaExclamationTriangle,
  FaThumbsUp, FaThumbsDown, FaComments, FaPhone, FaEnvelope,
  FaPlus, FaUpload, FaSignature, FaUndo, FaHistory, FaBolt,
  FaTools, FaShieldAlt, FaChevronRight, FaBuilding, FaUser, FaEdit,
  FaTrash, FaBell, FaExchangeAlt, FaPaperPlane, FaCheck,
  FaInfoCircle, FaTh, FaList, FaTrophy, FaAward, FaMedal,
  FaUserCheck, FaFileContract, FaHandshake, FaSpinner,
  FaMapMarkerAlt, FaCreditCard, FaReceipt, FaIdCard, FaCheckCircle,
  FaTimes, FaCalendarCheck, FaCarSide, FaRoute, FaGasPump
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type Definitions
interface RentedDriver {
  id: string;
  driver_id: string;
  partner_id: string;
  booking_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  current_status: 'active' | 'completed' | 'cancelled' | 'suspended';
  created_at: string;
  updated_at: string;
  
  // Driver details
  driver: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    verified: boolean;
    rating: number;
    total_rentals: number;
    documents_uploaded: boolean;
    license_number?: string;
    license_expiry?: string;
    insurance_number?: string;
    insurance_expiry?: string;
    experience_years?: number;
    is_approved: boolean;
    is_active: boolean;
  };
  
  // Vehicle details
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
  booking: {
    id: string;
    total_amount: number;
    weeks: number;
    pickup_location?: string;
    dropoff_location?: string;
    payment_status: 'pending' | 'paid' | 'overdue';
    deposit_amount?: number;
    deposit_status?: 'pending' | 'received' | 'returned';
  };
  
  // Performance metrics
  performance: {
    current_mileage?: number;
    fuel_level?: string;
    condition_rating?: number;
    driver_rating?: number;
    partner_rating?: number;
    days_rented: number;
    days_remaining: number;
    is_overdue: boolean;
    overdue_days: number;
  };
}

interface RentedDriverStats {
  total_rented: number;
  active_rentals: number;
  total_revenue: number;
  average_rating: number;
  vehicles_rented: number;
  drivers_renting: number;
  overdue_rentals: number;
  expiring_soon: number;
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800'
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
};

export default function RentedDriversPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [rentedDrivers, setRentedDrivers] = useState<RentedDriver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<RentedDriver[]>([]);
  const [stats, setStats] = useState<RentedDriverStats>({
    total_rented: 0,
    active_rentals: 0,
    total_revenue: 0,
    average_rating: 0,
    vehicles_rented: 0,
    drivers_renting: 0,
    overdue_rentals: 0,
    expiring_soon: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [selectedDriver, setSelectedDriver] = useState<RentedDriver | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  // Load rented drivers data
  const loadRentedDrivers = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Derive partnerId
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        console.error('No partner ID found for rented drivers');
        setRentedDrivers([]);
        setFilteredDrivers([]);
        calculateStats([]);
        return;
      }

      // Fetch active bookings for this partner
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .in('status', ['active', 'in_progress', 'confirmed'])
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Supabase error (bookings):', {
          message: (bookingsError as any).message,
          details: (bookingsError as any).details,
          hint: (bookingsError as any).hint,
          code: (bookingsError as any).code,
        });
        setRentedDrivers([]);
        setFilteredDrivers([]);
        calculateStats([]);
        return;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setRentedDrivers([]);
        setFilteredDrivers([]);
        calculateStats([]);
        return;
      }

      // Enrich with driver, vehicle, and performance details
      const transformedDrivers: RentedDriver[] = await Promise.all(
        bookingsData.map(async (booking: any) => {
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

          // Calculate performance metrics
          const startDate = new Date(booking.start_date);
          const endDate = new Date(booking.end_date);
          const now = new Date();
          const daysRented = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          const isOverdue = now > endDate;
          const overdueDays = isOverdue ? Math.ceil((now.getTime() - endDate.getTime()) / (24 * 60 * 60 * 1000)) : 0;

          const weeklyRate = (vehicle.weekly_rate ?? vehicle.price_per_week ?? (vehicle.daily_rate ? vehicle.daily_rate * 7 : 0)) || 0;

          const rentedDriver: RentedDriver = {
            id: booking.id,
            driver_id: booking.driver_id,
            partner_id: booking.partner_id,
            booking_id: booking.id,
            vehicle_id: carDocId || '',
            start_date: booking.start_date,
            end_date: booking.end_date,
            current_status: (booking.status as 'active' | 'completed' | 'cancelled' | 'suspended') || 'active',
            created_at: booking.created_at,
            updated_at: booking.updated_at,

            driver: {
              id: driver.id || '',
              full_name: driver.full_name || driver.name || '',
              email: driver.email || '',
              phone: driver.phone || '',
              verified: driver.verified || false,
              rating: Number(driver.rating) || 0,
              total_rentals: Number(driver.total_rentals) || 0,
              documents_uploaded: Boolean(driver.documents_uploaded),
              license_number: driver.license_number || '',
              license_expiry: driver.license_expiry || '',
              insurance_number: driver.insurance_number || '',
              insurance_expiry: driver.insurance_expiry || '',
              experience_years: Number(driver.experience_years) || 0,
              is_approved: Boolean(driver.is_approved),
              is_active: Boolean(driver.is_active),
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

            booking: {
              id: booking.id,
              total_amount: booking.total_amount || weeklyRate * (booking.weeks || 1),
              weeks: booking.weeks || 1,
              pickup_location: booking.pickup_location,
              dropoff_location: booking.dropoff_location,
              payment_status: (booking.payment_status as 'pending' | 'paid' | 'overdue') || 'pending',
              deposit_amount: Number(booking.deposit_amount) || 0,
              deposit_status: (booking.deposit_status as 'pending' | 'received' | 'returned') || 'pending',
            },

            performance: {
              current_mileage: Number(booking.current_mileage) || 0,
              fuel_level: booking.fuel_level || 'Full',
              condition_rating: Number(booking.condition_rating) || 5,
              driver_rating: Number(booking.driver_rating) || 0,
              partner_rating: Number(booking.partner_rating) || 0,
              days_rented: daysRented,
              days_remaining: daysRemaining,
              is_overdue: isOverdue,
              overdue_days: overdueDays,
            },
          };

          return rentedDriver;
        })
      );

      setRentedDrivers(transformedDrivers);
      setFilteredDrivers(transformedDrivers);
      calculateStats(transformedDrivers);
    } catch (err) {
      console.error('Error loading rented drivers:', err);
      setRentedDrivers([]);
      setFilteredDrivers([]);
      calculateStats([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (drivers: RentedDriver[]) => {
    const totalRented = drivers.length;
    const activeRentals = drivers.filter(d => d.current_status === 'active').length;
    const totalRevenue = drivers.reduce((sum, driver) => sum + driver.booking.total_amount, 0);
    const averageRating = drivers.reduce((sum, driver) => sum + driver.driver.rating, 0) / totalRented || 0;
    const vehiclesRented = new Set(drivers.map(d => d.vehicle_id)).size;
    const driversRenting = new Set(drivers.map(d => d.driver_id)).size;
    const overdueRentals = drivers.filter(d => d.performance.is_overdue).length;
    const expiringSoon = drivers.filter(d => d.performance.days_remaining <= 3 && d.performance.days_remaining > 0).length;

    setStats({
      total_rented: totalRented,
      active_rentals: activeRentals,
      total_revenue: totalRevenue,
      average_rating: averageRating,
      vehicles_rented: vehiclesRented,
      drivers_renting: driversRenting,
      overdue_rentals: overdueRentals,
      expiring_soon: expiringSoon
    });
  };

  // Filter and sort drivers
  useEffect(() => {
    let filtered = [...rentedDrivers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(driver => driver.current_status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(driver => driver.booking.payment_status === paymentFilter);
    }

    // Vehicle filter
    if (vehicleFilter !== 'all') {
      filtered = filtered.filter(driver => driver.vehicle.category === vehicleFilter);
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseInt(ratingFilter);
      filtered = filtered.filter(driver => driver.driver.rating >= minRating);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'start_date':
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
          break;
        case 'driver_name':
          aValue = a.driver.full_name;
          bValue = b.driver.full_name;
          break;
        case 'total_amount':
          aValue = a.booking.total_amount;
          bValue = b.booking.total_amount;
          break;
        case 'driver_rating':
          aValue = a.driver.rating;
          bValue = b.driver.rating;
          break;
        case 'days_remaining':
          aValue = a.performance.days_remaining;
          bValue = b.performance.days_remaining;
          break;
        default:
          aValue = new Date(a.start_date);
          bValue = new Date(b.start_date);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDrivers(filtered);
    setCurrentPage(1);
  }, [rentedDrivers, searchTerm, statusFilter, paymentFilter, vehicleFilter, ratingFilter, sortBy, sortOrder]);

  // Wait for auth state
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadRentedDrivers();
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
  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDrivers = filteredDrivers.slice(startIndex, endIndex);

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
          <p className="mt-4 text-gray-600">Loading rented drivers...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Rented Drivers</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage drivers currently renting your vehicles
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
                <p className="text-sm font-medium text-gray-600">Rented Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_rented}</p>
                <p className="text-xs text-blue-600">Currently renting</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_rentals}</p>
                <p className="text-xs text-green-600">Ongoing rentals</p>
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
                <p className="text-xs text-purple-600">From current rentals</p>
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Rented Drivers</h2>
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
                  <option value="active">Active</option>
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
                  <option value="start_date-desc">Start Date (Recent)</option>
                  <option value="start_date-asc">Start Date (Oldest)</option>
                  <option value="driver_name-asc">Driver Name (A-Z)</option>
                  <option value="total_amount-desc">Amount (High-Low)</option>
                  <option value="driver_rating-desc">Rating (High-Low)</option>
                  <option value="days_remaining-asc">Days Remaining</option>
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
                  Rented Drivers ({filteredDrivers.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredDrivers.length)} of {filteredDrivers.length} drivers
                </p>
              </div>
            </div>
          </div>

          {currentDrivers.length === 0 ? (
            <div className="text-center py-12">
              <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No rented drivers found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredDrivers.length === 0 && rentedDrivers.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any drivers currently renting your vehicles.'}
              </p>
              {rentedDrivers.length === 0 && (
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
                      Rental Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentDrivers.map((driver) => (
                    <tr key={driver.id} className={`hover:bg-gray-50 ${driver.performance.is_overdue ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FaUserCircle className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {driver.driver.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {driver.driver.email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                              {formatRating(driver.driver.rating)}
                              <span className="ml-2 text-xs text-gray-400">
                                ({driver.driver.total_rentals} rentals)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm font-medium text-gray-900">
                            {driver.vehicle.make} {driver.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {driver.vehicle.license_plate} • {driver.vehicle.category}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(driver.start_date)} - {formatDate(driver.end_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDuration(driver.booking.weeks)} • {formatCurrency(driver.booking.total_amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {driver.performance.days_rented} days rented
                          </div>
                          {driver.performance.is_overdue && (
                            <div className="text-xs text-red-600 font-medium mt-1">
                              ⚠ {driver.performance.overdue_days} days overdue
                            </div>
                          )}
                          {!driver.performance.is_overdue && driver.performance.days_remaining <= 3 && (
                            <div className="text-xs text-orange-600 font-medium mt-1">
                              ⏰ {driver.performance.days_remaining} days remaining
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {driver.performance.current_mileage} miles
                          </div>
                          <div className="text-sm text-gray-500">
                            Fuel: {driver.performance.fuel_level}
                          </div>
                          <div className="text-sm text-gray-500">
                            Condition: {driver.performance.condition_rating}/5
                          </div>
                          {driver.driver.verified && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              ✓ Verified driver
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[driver.current_status]}`}>
                            {driver.current_status.charAt(0).toUpperCase() + driver.current_status.slice(1)}
                          </span>
                          <div className="text-sm font-medium text-gray-900 mt-1">
                            {formatCurrency(driver.booking.total_amount)}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[driver.booking.payment_status]}`}>
                            {driver.booking.payment_status.charAt(0).toUpperCase() + driver.booking.payment_status.slice(1)}
                          </span>
                          {driver.booking.deposit_amount > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              Deposit: {formatCurrency(driver.booking.deposit_amount)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowDriverModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowContactModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FaEnvelope className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowPerformanceModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredDrivers.length)} of {filteredDrivers.length} results
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