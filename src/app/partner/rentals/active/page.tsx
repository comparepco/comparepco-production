'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaCalendarAlt, FaSearch, FaFilter, FaEye, FaClock, 
  FaMoneyBillWave, FaCar, FaMapMarkerAlt, FaFileAlt,
  FaCheckCircle, FaTimes, FaExclamationTriangle, FaStar,
  FaDownload, FaPhone, FaEnvelope, FaComments, FaLifeRing,
  FaPlus, FaUpload, FaSignature, FaUndo, FaHistory, FaBolt,
  FaTools, FaShieldAlt, FaUserCircle, FaChevronRight, FaBuilding,
  FaUser, FaEdit, FaTrash, FaBell, FaExchangeAlt, FaPaperPlane,
  FaCheck, FaInfoCircle, FaTh, FaList, FaPlay, FaPause, FaStop,
  FaCarSide, FaRoute, FaGasPump, FaTachometerAlt, FaCalendarCheck,
  FaUserCheck, FaFileContract, FaHandshake
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type Definitions
interface ActiveRental {
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
  activated_at: string;
  current_week: number;
  weeks_remaining: number;
  next_payment_date: string;
  last_payment_date: string;
  payment_status: 'paid' | 'pending' | 'overdue';
  
  // Enhanced data structure
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
  
  // Rental tracking
  current_mileage: number;
  fuel_level: number;
  vehicle_condition: 'excellent' | 'good' | 'fair' | 'poor';
  last_inspection_date: string;
  next_inspection_date: string;
  
  // Communication and support
  last_contact_date: string;
  support_tickets: number;
  open_issues: number;
  
  // Financial tracking
  weekly_payment: number;
  total_paid: number;
  outstanding_balance: number;
  deposit_amount: number;
  deposit_status: 'held' | 'returned' | 'forfeited';
}

interface ActiveRentalStats {
  total_active: number;
  total_revenue: number;
  average_rating: number;
  vehicles_rented: number;
  drivers_active: number;
  payments_due: number;
  support_requests: number;
  expiring_soon: number;
}

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  suspended: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800'
};

const PAYMENT_STATUS_COLORS = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800'
};

const VEHICLE_CONDITION_COLORS = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
};

export default function ActiveRentalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<ActiveRental[]>([]);
  const [stats, setStats] = useState<ActiveRentalStats>({
    total_active: 0,
    total_revenue: 0,
    average_rating: 0,
    vehicles_rented: 0,
    drivers_active: 0,
    payments_due: 0,
    support_requests: 0,
    expiring_soon: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [selectedRental, setSelectedRental] = useState<ActiveRental | null>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);

  // Load active rentals
  const loadActiveRentals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Derive partnerId similar to bookings page
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        console.error('No partner ID found for active rentals');
        setActiveRentals([]);
        setFilteredRentals([]);
        calculateStats([]);
        return;
      }

      // Fetch active bookings for this partner (no joins to avoid 400 errors)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Supabase error (bookings):', {
          message: (bookingsError as any).message,
          details: (bookingsError as any).details,
          hint: (bookingsError as any).hint,
          code: (bookingsError as any).code,
        });
        // Show empty state instead of failing hard
        setActiveRentals([]);
        setFilteredRentals([]);
        calculateStats([]);
        return;
      }

      if (!bookingsData || bookingsData.length === 0) {
        setActiveRentals([]);
        setFilteredRentals([]);
        calculateStats([]);
        return;
      }

      // Enrich with vehicle and driver details per booking
      const transformedRentals: ActiveRental[] = await Promise.all(
        bookingsData.map(async (booking: any) => {
          // Vehicle details (try multiple possible id fields)
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
          const endDate = new Date(booking.end_date || startDate);
          const now = new Date();
          const currentWeek = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);
          const weeksRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000)));

          const weeklyRate = (vehicle.weekly_rate ?? vehicle.price_per_week ?? (vehicle.daily_rate ? vehicle.daily_rate * 7 : 0)) || 0;

          const rental: ActiveRental = {
            id: booking.id,
            status: booking.status,
            vehicle_id: carDocId || '',
            driver_id: booking.driver_id,
            partner_id: booking.partner_id,
            weeks: booking.weeks || Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))),
            total_amount: booking.total_amount || weeklyRate * (booking.weeks || currentWeek),
            start_date: booking.start_date,
            end_date: booking.end_date || endDate.toISOString(),
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            activated_at: booking.activated_at || booking.start_date,
            current_week: currentWeek,
            weeks_remaining: weeksRemaining,
            next_payment_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            last_payment_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            payment_status: (booking.payment_status as 'paid' | 'pending' | 'overdue') || 'pending',

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

            current_mileage: parseInt(vehicle.mileage || '0', 10),
            fuel_level: Number(vehicle.fuel_level) || 0,
            vehicle_condition: (vehicle.vehicle_condition as any) || 'good',
            last_inspection_date: vehicle.last_inspection_date || new Date().toISOString(),
            next_inspection_date: vehicle.next_inspection_date || new Date().toISOString(),

            last_contact_date: booking.last_contact_date || new Date().toISOString(),
            support_tickets: Number(booking.support_tickets) || 0,
            open_issues: Number(booking.open_issues) || 0,

            weekly_payment: weeklyRate,
            total_paid: Number(booking.total_paid) || weeklyRate * currentWeek,
            outstanding_balance: Number(booking.outstanding_balance) || 0,
            deposit_amount: Number(booking.deposit_amount) || 0,
            deposit_status: (booking.deposit_status as any) || 'held',
          };

          return rental;
        })
      );

      setActiveRentals(transformedRentals);
      setFilteredRentals(transformedRentals);
      calculateStats(transformedRentals);
    } catch (err) {
      console.error('Error loading active rentals:', err);
      // Fall back to empty state instead of blocking the page with an error
      setActiveRentals([]);
      setFilteredRentals([]);
      calculateStats([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Create sample data for testing
  const createSampleData = async () => {
    try {
      setLoading(true);
      
      // Get the first available vehicle for this partner
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, make, model, price_per_week')
        .eq('partner_id', user?.id)
        .eq('status', 'available')
        .limit(1);

      if (!vehicles || vehicles.length === 0) {
        alert('No available vehicles found. Please add a vehicle first.');
        return;
      }

      const vehicle = vehicles[0];
      
      // Create a sample booking (active rental)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 28); // 4 weeks from now
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          vehicle_id: vehicle.id,
          driver_id: 'sample-driver-id', // This would normally be a real driver ID
          partner_id: user?.id,
          status: 'active',
          weeks: 4,
          total_amount: vehicle.price_per_week * 4,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          activated_at: startDate.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating sample booking:', error);
        alert('Failed to create sample data');
        return;
      }

      // Reload the rentals
      await loadActiveRentals();
      
    } catch (err) {
      console.error('Error creating sample data:', err);
      alert('Failed to create sample data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (rentals: ActiveRental[]) => {
    const totalActive = rentals.length;
    const totalRevenue = rentals.reduce((sum, rental) => sum + rental.total_paid, 0);
    const averageRating = rentals.reduce((sum, rental) => sum + rental.driver.rating, 0) / totalActive || 0;
    const vehiclesRented = new Set(rentals.map(r => r.vehicle_id)).size;
    const driversActive = new Set(rentals.map(r => r.driver_id)).size;
    const paymentsDue = rentals.filter(r => r.payment_status === 'pending' || r.payment_status === 'overdue').length;
    const supportRequests = rentals.reduce((sum, rental) => sum + rental.support_tickets, 0);
    const expiringSoon = rentals.filter(r => r.weeks_remaining <= 2).length;

    setStats({
      total_active: totalActive,
      total_revenue: totalRevenue,
      average_rating: averageRating,
      vehicles_rented: vehiclesRented,
      drivers_active: driversActive,
      payments_due: paymentsDue,
      support_requests: supportRequests,
      expiring_soon: expiringSoon
    });
  };

  // Filter and sort rentals
  useEffect(() => {
    let filtered = [...activeRentals];

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

    // Vehicle filter
    if (vehicleFilter !== 'all') {
      filtered = filtered.filter(rental => rental.vehicle.category === vehicleFilter);
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
        case 'vehicle':
          aValue = `${a.vehicle.make} ${a.vehicle.model}`;
          bValue = `${b.vehicle.make} ${b.vehicle.model}`;
          break;
        case 'weekly_payment':
          aValue = a.weekly_payment;
          bValue = b.weekly_payment;
          break;
        case 'weeks_remaining':
          aValue = a.weeks_remaining;
          bValue = b.weeks_remaining;
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

    setFilteredRentals(filtered);
    setCurrentPage(1);
  }, [activeRentals, searchTerm, statusFilter, paymentFilter, vehicleFilter, sortBy, sortOrder]);

  // Wait for auth state like bookings page
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadActiveRentals();
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Rentals</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadActiveRentals}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
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
              <h1 className="text-2xl font-bold text-gray-900">Active Rentals</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your currently active vehicle rentals and driver relationships
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                <FaPlus className="w-4 h-4 mr-2" />
                New Rental
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
                <FaPlay className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_active}</p>
                <p className="text-xs text-green-600">Currently running</p>
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
                <p className="text-xs text-green-600">From active rentals</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average_rating.toFixed(1)}</p>
                <p className="text-xs text-green-600">Driver satisfaction</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiring_soon}</p>
                <p className="text-xs text-yellow-600">Within 2 weeks</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Active Rentals</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <option value="paused">Paused</option>
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
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
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
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Active Rentals ({filteredRentals.length})
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
                  <option value="start_date-desc">Start Date (Newest)</option>
                  <option value="start_date-asc">Start Date (Oldest)</option>
                  <option value="driver_name-asc">Driver Name (A-Z)</option>
                  <option value="vehicle-asc">Vehicle (A-Z)</option>
                  <option value="weekly_payment-desc">Weekly Payment (High-Low)</option>
                  <option value="weeks_remaining-asc">Weeks Remaining (Low-High)</option>
                </select>
              </div>
            </div>
          </div>

          {currentRentals.length === 0 ? (
            <div className="text-center py-12">
              <FaCar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active rentals found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredRentals.length === 0 && activeRentals.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any active vehicle rentals at the moment. Start by creating a new rental agreement or check your pending bookings.'}
              </p>
              {activeRentals.length === 0 && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/partner/bookings')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <FaCalendarAlt className="w-4 h-4 mr-2" />
                    View All Bookings
                  </button>
                  <button
                    onClick={() => router.push('/partner/fleet/add')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </button>
                  <button
                    onClick={createSampleData}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Create Sample Data
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
                      Progress
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
                  {currentRentals.map((rental) => (
                    <tr key={rental.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{rental.id.slice(-8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Started {formatDate(rental.start_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDuration(rental.weeks)} • {formatCurrency(rental.total_amount)}
                          </div>
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
                              {rental.driver.rating}
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
                          <div className="text-sm font-medium text-gray-900">
                            Week {rental.current_week} of {rental.weeks}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(rental.current_week / rental.weeks) * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {rental.weeks_remaining} weeks remaining
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(rental.weekly_payment)}/week
                          </div>
                          <div className="text-sm text-gray-500">
                            Total: {formatCurrency(rental.total_paid)}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[rental.payment_status]}`}>
                            {rental.payment_status.charAt(0).toUpperCase() + rental.payment_status.slice(1)}
                          </span>
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
                              setShowContactModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FaEnvelope className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRental(rental);
                              setShowPaymentModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            <FaMoneyBillWave className="w-4 h-4" />
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