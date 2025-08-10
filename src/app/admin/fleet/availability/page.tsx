'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaCalendar,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaTruck,
  FaWrench,
  FaUser,
  FaMapMarkerAlt,
  FaDollarSign,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaTimes
} from 'react-icons/fa';

interface Vehicle {
  id: string;
  name?: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  partner_id: string;
  partner_name?: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  daily_rate: number;
  weekly_rate?: number;
  location: string;
  category: string;
  current_driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  current_booking?: {
    id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
  };
  upcoming_bookings: any[];
}

interface Partner {
  id: string;
  business_name?: string;
  company_name?: string;
  name?: string;
  contact_person?: string;
  email: string;
}

interface Driver {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  phone?: string;
}

interface Booking {
  id: string;
  car_id: string;
  driver_id: string;
  status: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  driver_name?: string;
}

export default function VehicleAvailability() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && authUser) {
      loadData();
    }
  }, [authUser, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all data concurrently from Supabase
      const [vehiclesSnapshot, bookingsSnapshot, partnersSnapshot] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('partners').select('*')
      ]);

      if (vehiclesSnapshot.error) {
        console.error('Error loading vehicles:', vehiclesSnapshot.error);
        toast.error('Failed to load vehicles');
        return;
      }

      if (bookingsSnapshot.error) {
        console.error('Error loading bookings:', bookingsSnapshot.error);
        toast.error('Failed to load bookings');
        return;
      }

      if (partnersSnapshot.error) {
        console.error('Error loading partners:', partnersSnapshot.error);
        toast.error('Failed to load partners');
        return;
      }

      // Process partners
      const partnersData: Partner[] = [];
      (partnersSnapshot.data || []).forEach(partner => {
        partnersData.push({ id: partner.id, ...partner } as Partner);
      });

      // Process drivers
      const driversData: Driver[] = [];
      // The original code had a call to supabase.from('drivers').select('*')
      // and then usersResult.data || []).forEach(user => { ... }).
      // This part of the logic is now redundant as drivers are part of the 'users' table.
      // We'll keep the original logic for now, but it might need adjustment
      // if the 'drivers' table is truly separate from 'users'.
      // For now, we'll assume 'drivers' are users with role 'driver'.
      (partnersSnapshot.data || []).forEach(user => {
        if (user.role === 'driver') {
          driversData.push({
            id: user.id,
            name: user.name || user.full_name,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone
          });
        }
      });

      // Process bookings
      const bookingsData: Booking[] = (bookingsSnapshot.data || []).map(booking => {
        const driver = driversData.find(d => d.id === booking.driver_id);
        return {
          id: booking.id,
          ...booking,
          driver_name: driver?.name || driver?.full_name || booking.driver_name || 'Unknown Driver'
        } as Booking;
      });

      // Process vehicles with enhanced data
      const vehiclesData = (vehiclesSnapshot.data || []).map(vehicle => {
        const partner = partnersData.find(p => p.id === vehicle.partner_id);
        
        // Calculate weekly rate
        const weeklyRate = vehicle.weekly_rate || vehicle.price_per_week || (vehicle.daily_rate * 7);
        
        // Find current active booking
        const now = new Date();
        const activeBooking = bookingsData.find(booking => {
          if (booking.car_id !== vehicle.id) return false;
          if (!['active','confirmed','partner_accepted'].includes(booking.status)) return false;
          
          if (booking.start_date && booking.end_date) {
            const startDate = new Date(booking.start_date);
            const endDate = new Date(booking.end_date);
            return now >= startDate && now <= endDate;
          }
          return false;
        });

        // Find current driver
        let currentDriver = null;
        if (activeBooking) {
          currentDriver = driversData.find(d => d.id === activeBooking.driver_id);
        }

        // Get upcoming bookings
        const upcomingBookings = getUpcomingBookings(vehicle.id, bookingsData);

        // Determine actual status
        let actualStatus = activeBooking ? 'rented' : (vehicle.status || 'available');

        // Normalize legacy/booked status to 'rented' for accurate display
        if (actualStatus === 'booked') {
          actualStatus = 'rented';
        }

        return {
          id: vehicle.id,
          ...vehicle,
          partner_name: partner?.business_name || partner?.company_name || partner?.name || partner?.contact_person || 'Unknown Partner',
          weekly_rate: weeklyRate,
          status: actualStatus,
          current_driver: currentDriver ? {
            id: currentDriver.id,
            name: currentDriver.name || currentDriver.full_name || 'Unknown Driver',
            email: currentDriver.email,
            phone: currentDriver.phone
          } : null,
          current_booking: activeBooking ? {
            id: activeBooking.id,
            start_date: activeBooking.start_date,
            end_date: activeBooking.end_date,
            total_amount: activeBooking.total_amount
          } : null,
          upcoming_bookings: upcomingBookings
        } as Vehicle;
      });

      setVehicles(vehiclesData);
      setBookings(bookingsData);
      setPartners(partnersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingBookings = (vehicleId: string, bookingsData: Booking[]) => {
    const now = new Date();
    return bookingsData
      .filter((booking: Booking) => {
        if (booking.car_id !== vehicleId) return false;
        if (!booking.start_date) return false;
        
        const startDate = new Date(booking.start_date);
        return startDate > now && (['confirmed','pending','partner_accepted'].includes(booking.status));
      })
      .sort((a: Booking, b: Booking) => {
        const dateA = new Date(a.start_date);
        const dateB = new Date(b.start_date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case 'rented':
        return <FaClock className="h-5 w-5 text-blue-500" />;
      case 'maintenance':
        return <FaWrench className="h-5 w-5 text-yellow-500" />;
      case 'inactive':
        return <FaTimesCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FaCheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rented':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB');
  };

  const getPartnerDisplayName = (partner: Partner) => {
    if (partner?.business_name) return partner.business_name;
    if (partner?.company_name) return partner.company_name;
    if (partner?.name) return partner.name;
    if (partner?.contact_person) return partner.contact_person;
    // Only show email if no other name is available
    return partner?.email?.includes('@') ? 'Unknown Partner' : partner?.email || 'Unknown Partner';
  };

  const filterVehicles = () => {
    return vehicles.filter(vehicle => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleMatch = vehicle.make?.toLowerCase().includes(searchLower) ||
                            vehicle.model?.toLowerCase().includes(searchLower) ||
                            vehicle.registration_number?.toLowerCase().includes(searchLower) ||
                            vehicle.name?.toLowerCase().includes(searchLower);
        
        const partnerMatch = vehicle.partner_name?.toLowerCase().includes(searchLower);
        const driverMatch = vehicle.current_driver?.name?.toLowerCase().includes(searchLower);
        
        if (!vehicleMatch && !partnerMatch && !driverMatch) return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && vehicle.status !== selectedStatus) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && vehicle.category !== categoryFilter) {
        return false;
      }

      // Partner filter
      if (partnerFilter !== 'all' && vehicle.partner_id !== partnerFilter) {
        return false;
      }

      return true;
    });
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    vehicles.forEach(vehicle => {
      if (vehicle.category) categories.add(vehicle.category);
    });
    return Array.from(categories).sort();
  };

  const categorizeVehicles = () => {
    const available = vehicles.filter(v => v.status === 'available');
    const rented = vehicles.filter(v => v.status === 'rented');
    const maintenance = vehicles.filter(v => v.status === 'maintenance');
    const inactive = vehicles.filter(v => v.status === 'inactive');

    return { available, rented, maintenance, inactive };
  };

  const filteredVehicles = filterVehicles();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading vehicle availability...</p>
        </div>
      </div>
    );
  }

  const { available, rented, maintenance, inactive } = categorizeVehicles();
  const filteredStats = {
    available: filteredVehicles.filter(v => v.status === 'available').length,
    rented: filteredVehicles.filter(v => v.status === 'rented').length,
    maintenance: filteredVehicles.filter(v => v.status === 'maintenance').length,
    inactive: filteredVehicles.filter(v => v.status === 'inactive').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaCalendar className="h-8 w-8 text-blue-600" />
              Vehicle Availability
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track vehicle availability, current rentals, and upcoming bookings
          </p>
        </div>

        {/* Availability Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setSelectedStatus('available')}
            className={`p-4 rounded-lg text-center transition-colors border ${
              selectedStatus === 'available' 
                ? 'bg-green-100 dark:bg-green-900/30 border-green-500 ring-2 ring-green-500' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
            }`}
          >
            <FaCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{available.length}</p>
            <p className="text-sm text-green-700 dark:text-green-400">Available</p>
          </button>
          
          <button
            onClick={() => setSelectedStatus('rented')}
            className={`p-4 rounded-lg text-center transition-colors border ${
              selectedStatus === 'rented' 
                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 ring-2 ring-blue-500' 
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          >
            <FaClock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{rented.length}</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">Currently Rented</p>
          </button>
          
          <button
            onClick={() => setSelectedStatus('maintenance')}
            className={`p-4 rounded-lg text-center transition-colors border ${
              selectedStatus === 'maintenance' 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 ring-2 ring-yellow-500' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
            }`}
          >
            <FaWrench className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{maintenance.length}</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">Maintenance</p>
          </button>
          
          <button
            onClick={() => setSelectedStatus('inactive')}
            className={`p-4 rounded-lg text-center transition-colors border ${
              selectedStatus === 'inactive' 
                ? 'bg-red-100 dark:bg-red-900/30 border-red-500 ring-2 ring-red-500' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            <FaTimesCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{inactive.length}</p>
            <p className="text-sm text-red-700 dark:text-red-400">Inactive</p>
          </button>
        </div>

        {/* Additional Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Vehicles
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by make, model, registration, partner, driver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Partner
              </label>
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Partners</option>
                {partners
                  .filter((partner, index, self) => 
                    index === self.findIndex(p => p.id === partner.id)
                  )
                  .map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {getPartnerDisplayName(partner)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setPartnerFilter('all');
                  setSelectedStatus('all');
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes className="text-sm" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedStatus === 'all' ? 'All Vehicles' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Vehicles`}
          </h2>
          <button
            onClick={() => setSelectedStatus('all')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            View All ({vehicles.length})
          </button>
        </div>

        {/* Fleet Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Vehicle Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reg: {vehicle.registration_number}
                    </p>
                    {vehicle.name && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {vehicle.name}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                    <span className="ml-1 capitalize">{vehicle.status}</span>
                  </span>
                </div>

                {/* Partner & Pricing */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FaUser className="h-4 w-4 mr-1" />
                    {vehicle.partner_name}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(vehicle.weekly_rate || 0)}/week
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(vehicle.daily_rate || 0)}/day
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Status Details */}
              <div className="p-4">
                {/* Location */}
                <div className="flex items-center mb-3">
                  <FaMapMarkerAlt className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {vehicle.location || 'Location not specified'}
                  </span>
                </div>

                {/* Current Driver (if rented) */}
                {vehicle.current_driver && vehicle.current_booking && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                      Currently Rented by:
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {vehicle.current_driver.name}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {vehicle.current_driver.email}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {formatDate(new Date(vehicle.current_booking.start_date))} - {formatDate(new Date(vehicle.current_booking.end_date))}
                        </span>
                        <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                          {formatCurrency(vehicle.current_booking.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Bookings */}
                {vehicle.upcoming_bookings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                      Upcoming Bookings ({vehicle.upcoming_bookings.length}):
                    </p>
                    <div className="space-y-1">
                      {vehicle.upcoming_bookings.slice(0, 2).map((booking: any, index: number) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-yellow-800 dark:text-yellow-300">
                            {booking.driver_name}
                          </span>
                          <span className="text-yellow-600 dark:text-yellow-400">
                            {formatDate(new Date(booking.start_date))}
                          </span>
                        </div>
                      ))}
                      {vehicle.upcoming_bookings.length > 2 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          +{vehicle.upcoming_bookings.length - 2} more bookings
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Available Vehicle Info */}
                {vehicle.status === 'available' && vehicle.upcoming_bookings.length === 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">
                      Available for immediate booking
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Category: {vehicle.category} • Weekly rate: {formatCurrency(vehicle.weekly_rate || 0)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <FaTruck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No vehicles found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {selectedStatus === 'all' 
                ? 'No vehicles in the fleet.'
                : `No vehicles with ${selectedStatus} status.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

