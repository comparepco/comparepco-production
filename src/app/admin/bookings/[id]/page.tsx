"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAdmin } from "@/contexts/AdminContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FaCar, 
  FaUser, 
  FaBuilding, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaUserShield,
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes
} from "react-icons/fa";

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

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAdmin();
  const { loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [relatedData, setRelatedData] = useState<{
    driver?: Driver;
    partner?: Partner;
    vehicle?: Vehicle;
  }>({});

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setBookingId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!bookingId) return;
    
    const fetchBookingAndRelatedData = async () => {
      try {
        // Fetch the booking first
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();
        
        if (bookingError || !bookingData) {
          console.error('Error fetching booking:', bookingError);
          setLoading(false);
          return;
        }
        
        setBooking(bookingData);
        
        // Debug log to see what data we have
        console.log('Booking data:', bookingData);
        
        // Fetch related data based on IDs in the booking
        const fetchPromises = [];
        const dataMap: any = {};
        
        // Fetch driver data if driver_id exists
        if (bookingData.driver_id) {
          fetchPromises.push(
            supabase
              .from('users')
              .select('*')
              .eq('id', bookingData.driver_id)
              .eq('role', 'driver')
              .single()
              .then(({ data: driverData, error: driverError }) => {
                if (!driverError && driverData) {
                  dataMap.driver = driverData;
                }
              })
          );
        }
        
        // Fetch partner data if partner_id exists
        if (bookingData.partner_id) {
          fetchPromises.push(
            supabase
              .from('partners')
              .select('*')
              .eq('id', bookingData.partner_id)
              .single()
              .then(({ data: partnerData, error: partnerError }) => {
                if (!partnerError && partnerData) {
                  dataMap.partner = partnerData;
                }
              })
          );
        }
        
        // Fetch vehicle data if vehicle_id exists
        if (bookingData.vehicle_id) {
          fetchPromises.push(
            supabase
              .from('vehicles')
              .select('*')
              .eq('id', bookingData.vehicle_id)
              .single()
              .then(({ data: vehicleData, error: vehicleError }) => {
                if (!vehicleError && vehicleData) {
                  dataMap.vehicle = vehicleData;
                }
              })
          );
        }
        
        // Wait for all related data to be fetched
        await Promise.all(fetchPromises);
        
        console.log('Related data:', dataMap);
        setRelatedData(dataMap);
        
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingAndRelatedData();
  }, [bookingId]);

  const handleCancel = async () => {
    if (!booking) return;
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id);
      
      if (error) {
        console.error('Error cancelling booking:', error);
        return;
      }
      
      setBooking((prev: Booking | null) => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (error) {
      console.error('Error cancelling booking:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!booking) return;
    setActionLoading(true);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', booking.id);
      
      if (error) {
        console.error('Error updating booking status:', error);
        return;
      }
      
      setBooking((prev: Booking | null) => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating booking status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <div className="p-10 text-center">Loading booking details...</div>
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <div className="p-10 text-center text-red-400">Booking not found.</div>
      </div>
    );
  }

  // Get comprehensive data with fallbacks
  const driver = relatedData.driver;
  const partner = relatedData.partner;
  const vehicle = relatedData.vehicle;

  // Driver information with multiple fallbacks
  const driverName = driver ? `${driver.first_name} ${driver.last_name}`.trim() : "—";
  const driverEmail = driver?.email || "—";
  const driverPhone = driver?.phone || "—";

  // Vehicle information with multiple fallbacks
  const vehicleName = vehicle?.name || (vehicle?.make && vehicle?.model ? `${vehicle.make} ${vehicle.model}`.trim() : "—");
  const vehiclePlate = vehicle?.license_plate || "—";

  // Partner information with multiple fallbacks
  const partnerName = partner?.company_name || "—";

  // Safe date formatting function
  const formatDate = (dateString: string, includeTime = false): string => {
    if (!dateString) return "—";
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "—";
      }
      
      return includeTime ? date.toLocaleString() : date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return "—";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              onClick={() => router.back()}
            >
              <FaArrowLeft />
              Back to Bookings
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Details</h1>
              <p className="text-gray-600 dark:text-slate-400">
                Booking ID: {booking.id}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
              {booking.status?.replace('_', ' ') || "pending"}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaCar className="text-2xl text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vehicle Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Vehicle Name:</span>
                <span className="font-medium">{vehicleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">License Plate:</span>
                <span className="font-medium">{vehiclePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Vehicle ID:</span>
                <span className="font-medium text-sm">{booking.vehicle_id}</span>
              </div>
              {vehicle?.make && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Make:</span>
                  <span className="font-medium">{vehicle.make}</span>
                </div>
              )}
              {vehicle?.model && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Model:</span>
                  <span className="font-medium">{vehicle.model}</span>
                </div>
              )}
              {vehicle?.year && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Year:</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
              )}
            </div>
          </div>

          {/* Driver Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaUser className="text-2xl text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Driver Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Name:</span>
                <span className="font-medium">{driverName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Email:</span>
                <span className="font-medium">{driverEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Phone:</span>
                <span className="font-medium">{driverPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Driver ID:</span>
                <span className="font-medium text-sm">{booking.driver_id}</span>
              </div>
              {driver?.is_verified && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Status:</span>
                  <span className="text-green-400 font-medium">✓ Verified</span>
                </div>
              )}
            </div>
          </div>

          {/* Partner Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaBuilding className="text-2xl text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Partner Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Company Name:</span>
                <span className="font-medium">{partnerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Partner ID:</span>
                <span className="font-medium text-sm">{booking.partner_id}</span>
              </div>
              {partner?.business_type && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Business Type:</span>
                  <span className="font-medium">{partner.business_type}</span>
                </div>
              )}
              {partner?.city && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Location:</span>
                  <span className="font-medium">{partner.city}, {partner.state}</span>
                </div>
              )}
            </div>
          </div>

          {/* Booking Dates */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaCalendarAlt className="text-2xl text-orange-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Booking Dates</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Start Date:</span>
                <span className="font-medium">{formatDate(booking.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">End Date:</span>
                <span className="font-medium">{formatDate(booking.end_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Created At:</span>
                <span className="font-medium">{formatDate(booking.created_at, true)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaMoneyBillWave className="text-2xl text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Information</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-slate-400">Total Amount:</span>
                <span className="font-medium">£{booking.total_amount?.toLocaleString() || "—"}</span>
              </div>
              {vehicle?.price_per_week && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Weekly Rate:</span>
                  <span className="font-medium">£{vehicle.price_per_week.toLocaleString()}</span>
                </div>
              )}
              {vehicle?.daily_rate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Daily Rate:</span>
                  <span className="font-medium">£{vehicle.daily_rate.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status & Actions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaUserShield className="text-2xl text-indigo-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Status & Actions</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-slate-400">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                  {booking.status?.replace('_', ' ') || "pending"}
                </span>
              </div>
              
              <div className="flex gap-2 pt-4">
                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <>
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      onClick={handleCancel}
                      disabled={actionLoading}
                    >
                      <FaTimes />
                      {actionLoading ? 'Cancelling...' : 'Cancel Booking'}
                    </button>
                    
                    {booking.status === 'pending' && (
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        onClick={() => handleStatusUpdate('confirmed')}
                        disabled={actionLoading}
                      >
                        <FaCheck />
                        Confirm Booking
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 