"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  FaCar, FaCalendarAlt, FaFileAlt, FaGasPump, FaTools, 
  FaCheckCircle, FaExclamationTriangle, FaClock, FaMapMarkerAlt,
  FaPhone, FaEnvelope, FaBell, FaHistory, FaUndo, FaExchangeAlt,
  FaUserCircle, FaBuilding, FaIdCard, FaShieldAlt, FaWrench
} from "react-icons/fa";

interface Booking {
  id: string;
  status: string;
  car_id: string;
  driver_id: string;
  partner_id: string;
  weeks: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  
  // Enhanced data structure
  driver?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    verified: boolean;
  };
  partner?: {
    id: string;
    full_name: string;
    email: string;
    business_address: string;
    company_name: string;
    phone?: string;
  };
  car?: {
    id: string;
    make: string;
    model: string;
    year: string;
    registration_number: string;
    color: string;
    fuel_type: string;
    transmission: string;
    seats: string;
    mileage: string;
    image_url: string;
    price_per_week: number;
  };
  
  // Legacy fields for compatibility
  car_name?: string;
  car_image?: string;
  car_plate?: string;
  partner_name?: string;
  partner_phone?: string;
  partner_email?: string;
  
  // Return and completion tracking
  return_requested?: boolean;
  return_requested_at?: string;
  return_approved?: boolean;
  return_approved_at?: string;
  completed_at?: string;
  
  // Vehicle change tracking
  vehicle_history?: any[];
  current_vehicle_id?: string;
  
  // Agreement tracking
  agreement_signed?: boolean;
  agreement_signed_at?: string;
  agreement_url?: string;
  
  // Issues
  issues?: any[];
}

export default function DriverVehiclesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [vehicleChangeHistory, setVehicleChangeHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'DRIVER') {
        router.replace('/');
      } else {
        setLoading(false);
        loadBookingData();
      }
    }
  }, [user, authLoading, router]);

  const loadBookingData = async () => {
    if (!user) return;

    try {
      // Load current active/accepted booking
      const { data: currentBookings, error: currentError } = await supabase
        .from('bookings')
        .select(`
          *,
          car:vehicles(*),
          partner:partners(*)
        `)
        .eq('driver_id', user.id)
        .in('status', ['partner_accepted', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (currentError) {
        console.error('Error loading current booking:', currentError);
      } else if (currentBookings && currentBookings.length > 0) {
        const booking = currentBookings[0] as Booking;
        setCurrentBooking(booking);
        
        // Load vehicle change history for this booking
        if (booking.vehicle_history) {
          setVehicleChangeHistory(booking.vehicle_history);
        }
      } else {
        setCurrentBooking(null);
        setVehicleChangeHistory([]);
      }

      // Load booking history for completed bookings
      const { data: historyData, error: historyError } = await supabase
        .from('bookings')
        .select(`
          *,
          car:vehicles(*),
          partner:partners(*)
        `)
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (historyError) {
        console.error('Error loading booking history:', historyError);
      } else {
        setBookingHistory(historyData || []);
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'partner_accepted': 'bg-green-100 text-green-800',
      'active': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rented Vehicle</h1>
        <p className="text-gray-600">View your current rented vehicle details and history</p>
      </div>

      {currentBooking ? (
        <>
          {/* Current Vehicle Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Vehicle Image & Basic Info */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 text-center">
                  {currentBooking.car?.image_url || currentBooking.car_image ? (
                    <img 
                      src={currentBooking.car?.image_url || currentBooking.car_image} 
                      alt="Vehicle"
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <FaCar className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {currentBooking.car_name || `${currentBooking.car?.make} ${currentBooking.car?.model}` || 'Vehicle Details'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {currentBooking.car?.registration_number || currentBooking.car_plate || 'Registration N/A'}
                  </p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentBooking.status)}`}>
                    {currentBooking.status === 'partner_accepted' ? 'ACCEPTED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="lg:col-span-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaCar className="text-blue-600" />
                  Vehicle Specifications
                </h4>
                <div className="space-y-3 text-sm">
                  {currentBooking.car?.year && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Year:</span>
                      <span className="font-medium text-gray-900">{currentBooking.car.year}</span>
                    </div>
                  )}
                  {currentBooking.car?.color && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Color:</span>
                      <span className="font-medium text-gray-900">{currentBooking.car.color}</span>
                    </div>
                  )}
                  {currentBooking.car?.fuel_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{currentBooking.car.fuel_type}</span>
                    </div>
                  )}
                  {currentBooking.car?.transmission && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transmission:</span>
                      <span className="font-medium text-gray-900 capitalize">{currentBooking.car.transmission}</span>
                    </div>
                  )}
                  {currentBooking.car?.seats && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seats:</span>
                      <span className="font-medium text-gray-900">{currentBooking.car.seats}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weekly Rate:</span>
                    <span className="font-medium text-green-600">£{currentBooking.car?.price_per_week || 0}</span>
                  </div>
                </div>
              </div>

              {/* Booking & Partner Info */}
              <div className="lg:col-span-1">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaBuilding className="text-purple-600" />
                  Rental Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booking ID:</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{currentBooking.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(currentBooking.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(currentBooking.end_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{currentBooking.weeks || 0} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Partner:</span>
                    <span className="font-medium text-gray-900">
                      {currentBooking.partner?.company_name || currentBooking.partner_name || 'N/A'}
                    </span>
                  </div>
                  {(currentBooking.partner?.phone || currentBooking.partner_phone) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium text-gray-900">
                        {currentBooking.partner?.phone || currentBooking.partner_phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                {currentBooking.return_requested && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <FaUndo />
                    <span className="text-sm font-medium">Return Requested</span>
                    {currentBooking.return_requested_at && (
                      <span className="text-xs text-gray-500">
                        on {formatDate(currentBooking.return_requested_at)}
                      </span>
                    )}
                  </div>
                )}
                {currentBooking.issues && currentBooking.issues.length > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <FaExclamationTriangle />
                    <span className="text-sm font-medium">{currentBooking.issues.length} Open Issue(s)</span>
                  </div>
                )}
                {currentBooking.agreement_signed && (
                  <div className="flex items-center gap-2 text-green-600">
                    <FaCheckCircle />
                    <span className="text-sm font-medium">Agreement Signed</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Change History */}
          {vehicleChangeHistory && vehicleChangeHistory.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaExchangeAlt className="text-orange-600" />
                Vehicle Change History
              </h3>
              <div className="space-y-3">
                {vehicleChangeHistory.map((change, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {change.reason || 'Vehicle Changed'}
                      </p>
                      <p className="text-sm text-gray-600">
                        From: {change.previous_vehicle || 'Previous Vehicle'} → 
                        To: {change.new_vehicle || 'Current Vehicle'}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(change.changed_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href={`/driver/bookings`}
                className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FaCalendarAlt className="text-blue-600 text-xl" />
                <div>
                  <p className="font-semibold text-gray-900">View Booking Details</p>
                  <p className="text-sm text-gray-600">See full rental information</p>
                </div>
              </a>

              {currentBooking.partner?.phone && (
                <a
                  href={`tel:${currentBooking.partner.phone}`}
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FaPhone className="text-green-600 text-xl" />
                  <div>
                    <p className="font-semibold text-gray-900">Contact Partner</p>
                    <p className="text-sm text-gray-600">Call for support</p>
                  </div>
                </a>
              )}

              <a
                href={`/driver/support`}
                className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <FaBell className="text-orange-600 text-xl" />
                <div>
                  <p className="font-semibold text-gray-900">Get Support</p>
                  <p className="text-sm text-gray-600">Report issues or get help</p>
                </div>
              </a>
            </div>
          </div>
        </>
      ) : (
        /* No Current Vehicle */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FaCar className="mx-auto h-16 w-16 text-gray-400 mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-4">No Vehicle Rented</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You don't have a vehicle rented yet. Vehicle information will appear here once your booking has been accepted by a partner.
          </p>
          <div className="space-y-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <FaCar />
              Browse Available Cars
            </a>
            <div className="text-sm text-gray-500">
              <p>Once you make a booking and it's accepted, vehicle details will appear here.</p>
            </div>
          </div>
        </div>
      )}

      {/* Booking History */}
      {bookingHistory.length > 0 && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaHistory className="text-gray-600" />
            Previous Rentals
          </h3>
          <div className="space-y-4">
            {bookingHistory.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FaCar className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.car_name || `${booking.car?.make} ${booking.car?.model}` || 'Vehicle'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {booking.partner?.company_name || booking.partner_name || 'Partner'} • 
                      {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {booking.weeks || 0} weeks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 