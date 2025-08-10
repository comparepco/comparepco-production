'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  FaCalendarAlt,
  FaSearch,
  FaEye,
  FaClock,
  FaMoneyBillWave,
  FaCar,
  FaUser,
  FaBuilding,
  FaUserShield,
  FaChevronRight,
  FaChevronDown,
  FaTrash,
  FaHistory,
  FaFileAlt,
  FaUndo,
  FaExclamationTriangle,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaDownload,
  FaPlus
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Booking {
  id: string;
  user_id: string;
  partner_id: string;
  driver_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

interface Driver {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  avatar: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface Partner {
  id: string;
  user_id: string;
  company_name: string;
  business_type: string;
  tax_id: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone: string;
  website: string | null;
  description: string | null;
  logo: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  partner_id: string;
  driver_id: string | null;
  name: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  vin: string | null;
  color: string | null;
  fuel_type: string | null;
  transmission: string | null;
  seats: number | null;
  doors: number | null;
  mileage: number | null;
  engine: string | null;
  location: string | null;
  description: string | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  price_per_week: number | null;
  price_per_day: number | null;
  category: string | null;
  image_urls: string[];
  features: string[];
  insurance_expiry: string | null;
  mot_expiry: string | null;
  road_tax_expiry: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  partner_id: string;
  driver_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending_partner_approval: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pending_admin_approval: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending_signature: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function AdminBookingsPage() {
  const { user } = useAdmin();
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [partners, setPartners] = useState<Record<string, Partner>>({});
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all related data (drivers, partners, vehicles, payments)
  useEffect(() => {
    const loadRelatedData = async () => {
      try {
        // Load drivers
        const { data: driversData } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'driver');

        // Load partners
        const { data: partnersData } = await supabase
          .from('partners')
          .select('*');

        // Load vehicles
        const { data: vehiclesData } = await supabase
          .from('vehicles')
          .select('*');

        // Load payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        // Create lookup maps
        const driversMap: Record<string, Driver> = {};
        driversData?.forEach(driver => {
          driversMap[driver.id] = driver;
        });

        const partnersMap: Record<string, Partner> = {};
        partnersData?.forEach(partner => {
          partnersMap[partner.id] = partner;
        });

        const vehiclesMap: Record<string, Vehicle> = {};
        vehiclesData?.forEach(vehicle => {
          vehiclesMap[vehicle.id] = vehicle;
        });

        setDrivers(driversMap);
        setPartners(partnersMap);
        setVehicles(vehiclesMap);
        setPayments(paymentsData || []);
      } catch (error) {
        console.error('Error loading related data:', error);
      }
    };

    loadRelatedData();
  }, []);

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (authLoading) return;

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      try {
        setLoading(true);

        const { data: bookingsData, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching bookings:', error);
          return;
        }

        setBookings(bookingsData || []);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user, authLoading, router]);

  // Group bookings by partner_id
  const partnersMap = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(b => {
      const pid = b.partner_id || 'unknown';
      if (!map[pid]) map[pid] = [];
      map[pid].push(b);
    });
    return map;
  }, [bookings]);

  // Partner list for sidebar
  const partnerList = useMemo(() => {
    return Object.entries(partnersMap).map(([pid, bookings]) => {
      const partner = partners[pid];
      const partnerName = partner?.company_name || 'Unknown Partner';
      
      return {
        id: pid,
        name: partnerName,
        count: bookings.length
      };
    }).sort((a, b) => b.count - a.count);
  }, [partnersMap, partners]);

  // Bookings for selected partner
  const partnerBookings = selectedPartner ? partnersMap[selectedPartner] || [] : [];

  // Add functions to handle accept/reject actions
  const handleAccept = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        toast.error('Failed to accept booking');
        return;
      }

      toast.success('Booking accepted successfully');
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'confirmed' }
          : booking
      ));
    } catch (error) {
      toast.error('Failed to accept booking');
    }
  };

  const handleReject = async (bookingId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'rejected',
          admin_rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        toast.error('Failed to reject booking');
        return;
      }

      toast.success('Booking rejected successfully');
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'rejected' }
          : booking
      ));
    } catch (error) {
      toast.error('Failed to reject booking');
    }
  };

  const handleDelete = async (bookingId: string, driverName: string) => {
    if (confirm(`Are you sure you want to delete the booking for ${driverName}? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);

        if (error) {
          toast.error('Failed to delete booking');
          return;
        }

        toast.success('Booking deleted successfully');
        
        // Update local state
        setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      } catch (error) {
        console.error('Error deleting booking:', error);
        toast.error('Failed to delete booking');
      }
    }
  };

  // Helper functions for the detailed view
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return statusColors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  // Get comprehensive payment info for a booking
  const getBookingPaymentInfo = (bookingId: string) => {
    const bookingPayments = payments.filter(p => p.booking_id === bookingId);
    
    const totalPaid = bookingPayments
      .filter(p => p.status === 'succeeded' || p.status === 'paid' || p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const lastPayment = bookingPayments.length > 0 
      ? bookingPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      : null;
    
    // Calculate payment status
    let paymentStatus = 'no_payments';
    if (bookingPayments.length > 0) {
      const hasSuccessful = bookingPayments.some(p => p.status === 'succeeded' || p.status === 'paid' || p.status === 'completed');
      const hasPending = bookingPayments.some(p => p.status === 'pending');
      const hasFailed = bookingPayments.some(p => p.status === 'failed' || p.status === 'canceled');
      
      if (hasSuccessful) {
        paymentStatus = 'paid';
      } else if (hasPending) {
        paymentStatus = 'pending';
      } else if (hasFailed) {
        paymentStatus = 'failed';
      }
    }
    
    return {
      payments: bookingPayments,
      totalPaid,
      lastPayment,
      paymentStatus,
      paymentCount: bookingPayments.length
    };
  };

  const openDetailModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedBooking(null);
    setShowDetailModal(false);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return "—";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <div className="p-10 text-center">Loading bookings...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <div className="text-center py-12">
          <FaUserShield className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 dark:text-slate-400">Authentication Required</h2>
          <p className="text-gray-500 dark:text-slate-500">Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white flex">
      {/* Partner Sidebar */}
      <div className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-6 overflow-y-auto sticky top-0 h-screen shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Partners</h2>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search partners..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          {partnerList
            .filter(partner => partner.name.toLowerCase().includes(search.toLowerCase()))
            .map((partner) => (
              <button
                key={partner.id}
                className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                  selectedPartner === partner.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setSelectedPartner(partner.id)}
              >
                <span className="font-medium">{partner.name}</span>
                <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  {partner.count}
                </span>
              </button>
            ))}
        </div>
      </div>

      {/* Bookings List */}
      <div className="flex-1 p-6 overflow-x-auto">
        {!selectedPartner && (
          <div className="text-center mt-20">
            <FaBuilding className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-slate-400 mb-2">Select a Partner</h3>
            <p className="text-gray-500 dark:text-slate-500">Choose a partner from the sidebar to view their bookings</p>
          </div>
        )}
        
        {selectedPartner && (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Bookings for {partnerList.find(p => p.id === selectedPartner)?.name}
                </h2>
                <p className="text-gray-600 dark:text-slate-400">
                  Manage and monitor all bookings for this partner
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FaDownload />
                  Export
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              {partnerBookings.length === 0 ? (
                <div className="p-12 text-center">
                  <FaCalendarAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-slate-400 mb-2">No Bookings</h3>
                  <p className="text-gray-500 dark:text-slate-500">This partner has no bookings yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {partnerBookings.map((booking) => {
                    const driver = drivers[booking.driver_id];
                    const partner = partners[booking.partner_id];
                    const vehicle = vehicles[booking.vehicle_id];
                    const paymentInfo = getBookingPaymentInfo(booking.id);

                    const driverName = driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown Driver';
                    const driverEmail = driver?.email || '—';
                    const vehicleName = vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.name || 'Unknown Vehicle' : 'Unknown Vehicle';
                    const partnerName = partner?.company_name || 'Unknown Partner';
                    
                    return (
                      <div key={booking.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 items-center">
                          {/* Driver Information */}
                          <div className="lg:col-span-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <FaUser className="text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{driverName}</h3>
                                <p className="text-sm text-gray-600 dark:text-slate-400">{driverEmail}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <FaUserShield className="text-xs text-green-500" />
                                  <span className="text-xs text-green-600 dark:text-green-400">Driver</span>
                                </div>
                                {driver?.is_verified && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Verified</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Vehicle Information */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                              <FaCar className="text-blue-600 dark:text-blue-400 text-sm" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{vehicleName}</p>
                              {vehicle?.license_plate && (
                                <p className="text-sm text-gray-600 dark:text-slate-400">{vehicle.license_plate}</p>
                              )}
                            </div>
                          </div>

                          {/* Partner Information */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                              <FaBuilding className="text-purple-600 dark:text-purple-400 text-sm" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{partnerName}</p>
                              {partner?.city && (
                                <p className="text-sm text-gray-600 dark:text-slate-400">{partner.city}</p>
                              )}
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                              <FaCalendarAlt className="text-orange-600 dark:text-orange-400 text-sm" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{formatDate(booking.start_date)}</p>
                              <p className="text-sm text-gray-600 dark:text-slate-400">Start Date</p>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                              <FaMoneyBillWave className="text-green-600 dark:text-green-400 text-sm" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">£{booking.total_amount?.toLocaleString() || '0'}</p>
                              <p className="text-sm text-gray-600 dark:text-slate-400">Total Amount</p>
                              {paymentInfo.totalPaid > 0 && (
                                <p className="text-xs text-blue-600 dark:text-blue-400">Paid: £{paymentInfo.totalPaid}</p>
                              )}
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[booking.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                                {booking.status?.replace('_', ' ') || 'unknown'}
                              </span>
                              
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => openDetailModal(booking)}
                                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                                >
                                  <FaEye />
                                  View
                                </button>
                                
                                {(booking.status === 'pending' || booking.status === 'pending_admin_approval') && (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleAccept(booking.id)} 
                                      className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-green-500 transition-colors"
                                    >
                                      <FaCheckCircle />
                                      Accept
                                    </button>
                                    <button 
                                      onClick={() => handleReject(booking.id)} 
                                      className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-500 transition-colors"
                                    >
                                      <FaTimesCircle />
                                      Reject
                                    </button>
                                  </div>
                                )}
                                
                                <button 
                                  onClick={() => handleDelete(booking.id, driverName)} 
                                  className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-red-500 transition-colors"
                                >
                                  <FaTrash />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Booking Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Booking Details - {selectedBooking.id}
                </h2>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status Overview */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaClock className="mr-3 h-6 w-6 text-blue-400" />
                  Current Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Status:</span>
                    <p className={`px-3 py-1 rounded-full text-sm font-medium inline-block mt-1 ${getStatusBadgeColor(selectedBooking.status)}`}>
                      {selectedBooking.status?.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Created:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDateTime(selectedBooking.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Last Updated:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDateTime(selectedBooking.updated_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Total Amount:</span>
                    <p className="text-green-600 dark:text-green-400 font-bold text-lg">£{selectedBooking.total_amount?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaUser className="mr-3 h-6 w-6 text-blue-400" />
                  Driver Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Name:</span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {drivers[selectedBooking.driver_id] ? 
                        `${drivers[selectedBooking.driver_id].first_name} ${drivers[selectedBooking.driver_id].last_name}` : 
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Email:</span>
                    <p className="text-gray-900 dark:text-white">{drivers[selectedBooking.driver_id]?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Phone:</span>
                    <p className="text-gray-900 dark:text-white">{drivers[selectedBooking.driver_id]?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Verification:</span>
                    <p className="text-gray-900 dark:text-white">
                      {drivers[selectedBooking.driver_id]?.is_verified ? 
                        <span className="text-green-600 dark:text-green-400">✅ Verified</span> : 
                        <span className="text-yellow-600 dark:text-yellow-400">⏳ Pending</span>
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Driver ID:</span>
                    <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">{selectedBooking.driver_id}</p>
                  </div>
                </div>
              </div>

              {/* Partner Information */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaBuilding className="mr-3 h-6 w-6 text-green-400" />
                  Partner Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Company:</span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {partners[selectedBooking.partner_id]?.company_name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Business Type:</span>
                    <p className="text-gray-900 dark:text-white">{partners[selectedBooking.partner_id]?.business_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Phone:</span>
                    <p className="text-gray-900 dark:text-white">{partners[selectedBooking.partner_id]?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Address:</span>
                    <p className="text-gray-900 dark:text-white">{partners[selectedBooking.partner_id]?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Partner ID:</span>
                    <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">{selectedBooking.partner_id}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaCar className="mr-3 h-6 w-6 text-purple-400" />
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Make & Model:</span>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {vehicles[selectedBooking.vehicle_id] ? 
                        `${vehicles[selectedBooking.vehicle_id].make || ''} ${vehicles[selectedBooking.vehicle_id].model || ''}`.trim() || vehicles[selectedBooking.vehicle_id].name : 
                        'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Registration:</span>
                    <p className="text-gray-900 dark:text-white font-mono">{vehicles[selectedBooking.vehicle_id]?.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Year:</span>
                    <p className="text-gray-900 dark:text-white">{vehicles[selectedBooking.vehicle_id]?.year || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Fuel Type:</span>
                    <p className="text-gray-900 dark:text-white">{vehicles[selectedBooking.vehicle_id]?.fuel_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Transmission:</span>
                    <p className="text-gray-900 dark:text-white">{vehicles[selectedBooking.vehicle_id]?.transmission || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Seats:</span>
                    <p className="text-gray-900 dark:text-white">{vehicles[selectedBooking.vehicle_id]?.seats || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Vehicle ID:</span>
                    <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">{selectedBooking.vehicle_id}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaCalendarAlt className="mr-3 h-6 w-6 text-gray-400" />
                  Booking Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Start Date:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDateTime(selectedBooking.start_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">End Date:</span>
                    <p className="text-gray-900 dark:text-white font-medium">{formatDateTime(selectedBooking.end_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Total Amount:</span>
                    <p className="text-gray-900 dark:text-white">£{selectedBooking.total_amount?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-slate-400 text-sm">Booking ID:</span>
                    <p className="text-gray-600 dark:text-slate-400 font-mono text-sm">{selectedBooking.id}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {(() => {
                const paymentInfo = getBookingPaymentInfo(selectedBooking.id);
                return (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <FaMoneyBillWave className="mr-3 h-6 w-6 text-green-400" />
                      Payment Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <span className="text-gray-600 dark:text-slate-400 text-sm">Total Paid:</span>
                        <p className="text-green-600 dark:text-green-400 font-bold text-lg">£{paymentInfo.totalPaid}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-slate-400 text-sm">Payment Count:</span>
                        <p className="text-gray-900 dark:text-white">{paymentInfo.paymentCount} payments</p>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-slate-400 text-sm">Status:</span>
                        <p className={`px-2 py-1 rounded text-sm inline-block ${
                          paymentInfo.paymentStatus === 'paid' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                          paymentInfo.paymentStatus === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                          paymentInfo.paymentStatus === 'failed' ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' :
                          'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300'
                        }`}>
                          {paymentInfo.paymentStatus.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Payment History */}
                    {paymentInfo.payments.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-gray-900 dark:text-white font-medium mb-3">Payment History ({paymentInfo.payments.length})</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {paymentInfo.payments.map((payment) => (
                            <div key={payment.id} className="bg-white dark:bg-slate-600 rounded p-3 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900 dark:text-white font-medium">£{payment.amount}</span>
                                  <span className="text-gray-600 dark:text-slate-400">- {payment.payment_method || 'Payment'}</span>
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    payment.status === 'succeeded' || payment.status === 'paid' || payment.status === 'completed'
                                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                      : payment.status === 'pending'
                                      ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                                      : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                                  }`}>
                                    {payment.status?.toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-gray-600 dark:text-slate-400 text-xs">
                                  {formatDateTime(payment.created_at)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-slate-400">
                                {payment.transaction_id && (
                                  <div>Transaction ID: {payment.transaction_id}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {paymentInfo.payments.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-gray-600 dark:text-slate-400">No payments recorded for this booking</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
              <div className="flex justify-end">
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 