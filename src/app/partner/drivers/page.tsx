'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, FaSearch, FaEye, FaCheckCircle, FaTimes,
  FaStar, FaCar, FaHistory,
  FaShieldAlt, FaChevronDown, FaChevronUp,
  FaCheck
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';

interface Driver {
  id: string;
  userId: string;
  partnerId?: string;
  licenseNumber: string;
  licenseExpiry: Date;
  insuranceNumber?: string;
  insuranceExpiry?: Date;
  experience: number;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  isApproved: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // User fields (joined)
  user?: {
    id: string;
    email: string;
    phone?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    isVerified: boolean;
  };
}

interface Booking {
  id: string;
  userId: string;
  partnerId: string;
  driverId?: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalAmount: number;
  deposit?: number;
  status: string;
  pickupLocation: string;
  dropoffLocation?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Vehicle info (joined)
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    licensePlate?: string;
    color?: string;
  };
}

interface EnrichedDriver extends Driver {
  currentBooking?: Booking;
  pastBookings: Booking[];
  acceptedBookings: Booking[];
  isCurrentlyDriving: boolean;
  hasAcceptedBookings: boolean;
  currentVehicle?: {
    id: string;
    make?: string;
    model?: string;
    licensePlate?: string;
    color?: string;
  };
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800'
};

const verificationColors = {
  verified: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  incomplete: 'bg-gray-100 text-gray-800'
};

const bookingStatusColors = {
  ACTIVE: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800'
};

export default function DriversPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, _setLoading] = useState(true);
  const [_resolvedPartnerId,setResolvedPartnerId]=useState<string|null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enrichedDrivers, setEnrichedDrivers] = useState<EnrichedDriver[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<EnrichedDriver[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<EnrichedDriver | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());

  const resolvePartnerId = useCallback(async () => {
    if(!user) return;
    const role=(user.role||'').toUpperCase();
    let resolvedPartnerId: string | null = null;

    if(role==='PARTNER_STAFF'){
      // For partner staff, get their partner_id
      const { data: staffData } = await supabase
        .from('partner_staff')
        .select('partner_id')
        .eq('user_id', user?.id)
        .single();
      
      if (staffData?.partner_id) {
        resolvedPartnerId = staffData.partner_id;
      }
    } else if(role==='PARTNER'){
      resolvedPartnerId = user?.id;
    }

    if (resolvedPartnerId) {
      loadData(resolvedPartnerId);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (!['PARTNER','PARTNER_STAFF'].includes((user.role||''))) {
        router.replace('/');
      } else {
        // resolve partner id then load
        resolvePartnerId();
      }
    }
  }, [user, authLoading, router, resolvePartnerId]);

  const loadData = (partnerId:string) => {
    // Load drivers with user info
    const driversQuery = supabase
      .from('drivers')
      .select(`
        *,
        user:users(id, email, phone, firstName, lastName, avatar, isVerified)
      `)
      .eq('partnerId', partnerId);
    
    driversQuery.then(({ data, error }) => {
      if (error) {
        // Handle error silently
        return;
      }
      setDrivers(data as Driver[]);
    });

    // Load bookings for this partner with vehicle info
    const bookingsQuery = supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles(id, make, model, licensePlate, color)
      `)
      .eq('partnerId', partnerId)
      .order('createdAt', { ascending: false });
    
    bookingsQuery.then(({ data, error }) => {
      if (error) {
        // Handle error silently
        return;
      }
      setBookings(data as Booking[]);
    });

    // Load vehicles
    const vehiclesQuery = supabase
      .from('vehicles')
      .select('*')
      .eq('partnerId', partnerId);
    
    vehiclesQuery.then(({ data, error }) => {
      if (error) {
        // Handle error silently
        return;
      }
      setVehicles((data||[]) as any[]);
    });
  };

  // Enrich drivers with booking and vehicle information
  useEffect(() => {
    const enriched = drivers.map(driver => {
      // Find current active booking
      const currentBooking = bookings.find(booking => 
        booking.driverId === driver.id && 
        booking.status === 'ACTIVE'
      );

      // Find past bookings (completed, cancelled)
      const pastBookings = bookings.filter(booking => 
        booking.driverId === driver.id && 
        ['COMPLETED', 'CANCELLED'].includes(booking.status)
      );

      // Find accepted bookings (confirmed but not yet active)
      const acceptedBookings = bookings.filter(booking => 
        booking.driverId === driver.id && 
        ['CONFIRMED', 'PENDING'].includes(booking.status)
      );

      // Find current vehicle if there's an active booking
      const currentVehicle = currentBooking ? vehicles.find(vehicle => 
        vehicle.id === currentBooking.vehicleId
      ) : null;

      const enrichedDriver: EnrichedDriver = {
        ...driver,
        currentBooking,
        pastBookings,
        acceptedBookings,
        isCurrentlyDriving: !!currentBooking,
        hasAcceptedBookings: acceptedBookings.length > 0,
        currentVehicle: currentVehicle ? {
          id: currentVehicle.id,
          make: currentVehicle.make || '',
          model: currentVehicle.model || '',
          licensePlate: currentVehicle.licensePlate || '',
          color: currentVehicle.color || ''
        } : undefined
      };

      return enrichedDriver;
    });

    // Sort: active drivers first, then by verification status, then by name
    enriched.sort((a, b) => {
      // Active drivers first
      if (a.isCurrentlyDriving && !b.isCurrentlyDriving) return -1;
      if (!a.isCurrentlyDriving && b.isCurrentlyDriving) return 1;
      
      // Then by verification status
      const aVerified = getVerificationStatus(a) === 'verified';
      const bVerified = getVerificationStatus(b) === 'verified';
      if (aVerified && !bVerified) return -1;
      if (!aVerified && bVerified) return 1;
      
      // Finally by name
      const aName = a.user?.firstName + ' ' + a.user?.lastName || '';
      const bName = b.user?.firstName + ' ' + b.user?.lastName || '';
      return aName.localeCompare(bName);
    });

    setEnrichedDrivers(enriched);
  }, [drivers, bookings, vehicles]);

  // Filter drivers
  useEffect(() => {
    let filtered = [...enrichedDrivers];

    if (searchTerm) {
      filtered = filtered.filter(driver => {
        const fullName = driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : '';
        const email = driver.user?.email || '';
        const phone = driver.user?.phone || '';
        const license = driver.licenseNumber || '';
        
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               phone.includes(searchTerm) ||
               license.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(driver => driver.isActive ? 'active' : 'inactive' === statusFilter);
    }

    if (verificationFilter) {
      filtered = filtered.filter(driver => getVerificationStatus(driver) === verificationFilter);
    }

    setFilteredDrivers(filtered);
  }, [enrichedDrivers, searchTerm, statusFilter, verificationFilter]);

  const getVerificationStatus = (driver: Driver): string => {
    // Check if driver is approved
    if (driver.isApproved) {
      return 'verified';
    }
    
    // Check if user is verified
    if (driver.user?.isVerified) {
      return 'verified';
    }
    
    return 'pending';
  };

  const toggleDriverExpansion = (driverId: string) => {
    const newExpanded = new Set(expandedDrivers);
    if (newExpanded.has(driverId)) {
      newExpanded.delete(driverId);
    } else {
      newExpanded.add(driverId);
    }
    setExpandedDrivers(newExpanded);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-bold text-gray-900">Loading drivers...</div>
      </div>
    );
  }

  if (!user) return null;

  const stats = {
    total: enrichedDrivers.length,
    active: enrichedDrivers.filter(d => d.isActive).length,
    verified: enrichedDrivers.filter(d => getVerificationStatus(d) === 'verified').length,
    currentlyDriving: enrichedDrivers.filter(d => d.isCurrentlyDriving).length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
              <p className="text-gray-600">
                {filteredDrivers.length} of {enrichedDrivers.length} drivers
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <FaUsers />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Drivers</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                <FaCheckCircle />
              </div>
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-xl font-bold text-gray-900">{stats.verified}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                <FaCar />
              </div>
              <div>
                <p className="text-sm text-gray-600">Currently Driving</p>
                <p className="text-xl font-bold text-gray-900">{stats.currentlyDriving}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                <FaShieldAlt />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Status</p>
                <p className="text-xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Drivers List */}
        <div className="space-y-4">
          {filteredDrivers.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FaUsers className="mx-auto text-gray-400 text-6xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No drivers found</h3>
              <p className="text-gray-600">
                {enrichedDrivers.length === 0
                  ? 'No drivers match your current filters'
                  : 'No drivers match your current filters'
                }
              </p>
            </div>
          ) : (
            filteredDrivers.map((driver) => {
              const fullName = driver.user ? `${driver.user.firstName} ${driver.user.lastName}` : 'Unknown Driver';
              const email = driver.user?.email || 'No email';
              const phone = driver.user?.phone || 'No phone';
              
              return (
                <div key={driver.id} className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                  driver.isCurrentlyDriving ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}>
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Driver Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          driver.isCurrentlyDriving ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {driver.isCurrentlyDriving ? <FaCar className="text-xl" /> : <FaUsers className="text-xl" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
                            {getVerificationStatus(driver) === 'verified' && (
                              <FaCheckCircle className="text-green-500 text-sm" />
                            )}
                            {driver.isCurrentlyDriving && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                Currently Driving
                              </span>
                            )}
                            {!driver.isCurrentlyDriving && driver.hasAcceptedBookings && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                Booking Accepted
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-black">{email}</p>
                          <p className="text-sm text-black">{phone}</p>
                          
                          {/* Current Vehicle Info */}
                          {driver.currentVehicle && (
                            <div className="mt-2 p-2 bg-green-100 rounded-lg">
                              <p className="text-sm font-medium text-green-800 flex items-center gap-1">
                                <FaCar className="w-3 h-3" />
                                Driving: {driver.currentVehicle.make} {driver.currentVehicle.model} ({driver.currentVehicle.licensePlate})
                                {driver.currentVehicle.color && ` - ${driver.currentVehicle.color}`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats and Status */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="text-sm text-black text-center">
                          <p className="font-medium">License: {driver.licenseNumber || 'N/A'}</p>
                          <div className="flex items-center gap-2 mt-1 justify-center">
                            <FaStar className="text-yellow-400" />
                            <span>{driver.rating?.toFixed(1) || '0.0'} ({driver.totalTrips || 0} trips)</span>
                          </div>
                          <p className="text-xs text-black mt-1">Earnings: {formatCurrency(driver.totalEarnings || 0)}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[driver.isActive ? 'active' : 'inactive']}`}>
                            {driver.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${verificationColors[getVerificationStatus(driver) as keyof typeof verificationColors] || 'bg-gray-100 text-gray-800'}`}>
                            {getVerificationStatus(driver).charAt(0).toUpperCase() + getVerificationStatus(driver).slice(1)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => toggleDriverExpansion(driver.id)}
                            className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-50"
                            title="Toggle Past Bookings"
                          >
                            {expandedDrivers.has(driver.id) ? <FaChevronUp /> : <FaChevronDown />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Section - Accepted & Past Bookings */}
                    {expandedDrivers.has(driver.id) && (
                      <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
                        
                        {/* Accepted Bookings */}
                        {driver.acceptedBookings.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <FaCheck className="text-blue-600" />
                              Accepted Bookings ({driver.acceptedBookings.length})
                            </h4>
                            <div className="space-y-3">
                              {driver.acceptedBookings.map((booking) => (
                                <div key={booking.id} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900">
                                          {booking.vehicle?.make} {booking.vehicle?.model}
                                        </span>
                                        <span className="text-sm text-black">
                                          ({booking.vehicle?.licensePlate})
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${bookingStatusColors[booking.status as keyof typeof bookingStatusColors] || 'bg-blue-100 text-blue-800'}`}>
                                          {booking.status.replace('_', ' ')}
                                        </span>
                                      </div>
                                      <div className="text-sm text-black">
                                        <span>Start: {formatDate(booking.startDate)}</span>
                                        <span className="mx-2">•</span>
                                        <span>{booking.totalDays} day{booking.totalDays !== 1 ? 's' : ''}</span>
                                        <span className="mx-2">•</span>
                                        <span>{formatCurrency(booking.totalAmount)}</span>
                                      </div>
                                      <div className="text-xs text-blue-600 mt-1 font-medium">
                                        ⏳ Waiting for partner to start active booking
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Past Bookings */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FaHistory />
                            Past Bookings ({driver.pastBookings.length})
                          </h4>
                        
                        {driver.pastBookings.length === 0 ? (
                          <p className="text-black text-sm">No past bookings found.</p>
                        ) : (
                          <div className="space-y-3">
                            {driver.pastBookings.slice(0, 5).map((booking) => (
                              <div key={booking.id} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-900">
                                        {booking.vehicle?.make} {booking.vehicle?.model}
                                      </span>
                                      <span className="text-sm text-black">
                                        ({booking.vehicle?.licensePlate})
                                      </span>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bookingStatusColors[booking.status as keyof typeof bookingStatusColors] || 'bg-gray-100 text-gray-800'}`}>
                                        {booking.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="text-sm text-black">
                                      <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                                      <span className="mx-2">•</span>
                                      <span>{booking.totalDays} day{booking.totalDays !== 1 ? 's' : ''}</span>
                                      <span className="mx-2">•</span>
                                      <span>{formatCurrency(booking.totalAmount)}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-black">
                                      {formatDate(booking.createdAt)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {driver.pastBookings.length > 5 && (
                              <p className="text-sm text-black text-center">
                                And {driver.pastBookings.length - 5} more booking{driver.pastBookings.length - 5 !== 1 ? 's' : ''}...
                              </p>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Driver Details Modal */}
      {showDetails && selectedDriver && (
        <>
          {/* Backdrop Blur */}
          <div 
            className="modal-overlay-backdrop"
            onClick={() => setShowDetails(false)}
          />
          
          {/* Modal Content */}
          <div className="modal-overlay pointer-events-none">
            <div className="modal-content w-full max-w-4xl mx-4 pointer-events-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Driver Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            
            <div className="p-6 space-y-6">
              {/* Driver Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-black mb-3">Personal Information</h3>
                  <div className="space-y-2 text-black">
                    <p><span className="font-medium">Name:</span> {selectedDriver.user ? `${selectedDriver.user.firstName} ${selectedDriver.user.lastName}` : 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedDriver.user?.email || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedDriver.user?.phone || 'N/A'}</p>
                    <p><span className="font-medium">License Number:</span> {selectedDriver.licenseNumber || 'N/A'}</p>
                    <p><span className="font-medium">License Expiry:</span> {formatDate(selectedDriver.licenseExpiry)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-black mb-3">Driver Details</h3>
                  <div className="space-y-2 text-black">
                    <p><span className="font-medium">Experience:</span> {selectedDriver.experience} years</p>
                    <p><span className="font-medium">Insurance Number:</span> {selectedDriver.insuranceNumber || 'N/A'}</p>
                    <p><span className="font-medium">Insurance Expiry:</span> {formatDate(selectedDriver.insuranceExpiry)}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Verification Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${verificationColors[getVerificationStatus(selectedDriver) as keyof typeof verificationColors] || 'bg-gray-100 text-gray-800'}`}>
                        {getVerificationStatus(selectedDriver).charAt(0).toUpperCase() + getVerificationStatus(selectedDriver).slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Vehicle */}
              {selectedDriver.currentVehicle && (
                <div>
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <FaCar className="text-green-600" />
                    Currently Driving
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium text-green-900">
                      {selectedDriver.currentVehicle.make} {selectedDriver.currentVehicle.model} ({selectedDriver.currentVehicle.licensePlate})
                    </p>
                    {selectedDriver.currentVehicle.color && (
                      <p className="text-sm text-green-700">Color: {selectedDriver.currentVehicle.color}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black">Total Trips</p>
                  <p className="text-2xl font-bold text-black">{selectedDriver.totalTrips || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black">Total Earnings</p>
                  <p className="text-2xl font-bold text-black">{formatCurrency(selectedDriver.totalEarnings || 0)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-black">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-black">{(selectedDriver.rating || 0).toFixed(1)}</p>
                    <FaStar className="text-yellow-400" />
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div>
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <FaHistory className="text-blue-600" />
                  Recent Bookings
                </h3>
                {selectedDriver.pastBookings.length === 0 ? (
                  <p className="text-black">No bookings found.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedDriver.pastBookings.slice(0, 10).map((booking) => (
                      <div key={booking.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-black">{booking.vehicle?.make} {booking.vehicle?.model}</p>
                            <p className="text-sm text-black">
                              {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${bookingStatusColors[booking.status as keyof typeof bookingStatusColors] || 'bg-gray-100 text-gray-800'}`}>
                              {booking.status.replace('_', ' ')}
                            </span>
                            <p className="text-sm font-medium mt-1 text-black">{formatCurrency(booking.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
} 