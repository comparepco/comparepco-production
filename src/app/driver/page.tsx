"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaCarSide, FaCalendarAlt, FaMoneyBillWave, FaBell, FaUserCircle, FaFileAlt, FaStar, FaCog, FaChevronRight, FaCheckCircle, FaExclamationTriangle, FaGift, FaQuestionCircle, FaSearch, FaShieldAlt, FaTools, FaBolt, FaComments, FaClock, FaHistory, FaPlus, FaEye, FaUpload, FaSignature, FaUndo, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase/client";

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
  car_info?: {
    id: string;
    make: string;
    model: string;
    year: string | number;
    registration_plate: string;
    color: string;
    fuel_type: string;
    transmission: string;
    seats: string | number;
    mileage: string | number;
    weekly_rate: number;
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
  
  // Issues
  issues?: any[];
}

const featureIcons: Record<string, React.ReactNode> = {
    'Insurance': <FaShieldAlt className="inline mr-1 text-blue-500" />,
    'MOT': <FaTools className="inline mr-1 text-yellow-500" />,
    'EV Assist': <FaBolt className="inline mr-1 text-green-500" />,
    'Breakdown': <FaTools className="inline mr-1 text-red-500" />,
    'Warranty': <FaStar className="inline mr-1 text-purple-500" />,
};

export default function DriverDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      console.log('Page Auth state:', { user, role: user?.role, authLoading });
      if (!user) {
        console.log('Page: No user, redirecting to login');
        router.replace('/auth/login');
      } else {
        // Check if user has a role, if not, try to get it from the database
        if (!user.role) {
          console.log('Page: No role in user metadata, checking database...');
          // Try to get role from database
          const getUserRole = async () => {
            try {
              const { data: userProfile, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
              
              if (userProfile && userProfile.role) {
                console.log('Page: Found role in database:', userProfile.role);
                setLoading(false);
                return;
              }
            } catch (error) {
              console.error('Page: Error getting user role:', error);
            }
          };
          getUserRole();
        } else if (user.role !== 'DRIVER' && user.role !== 'driver') {
          console.log('Page: User role is not DRIVER:', user.role);
          router.replace('/');
        } else {
          console.log('Page: User is DRIVER, setting loading to false');
          setLoading(false);
        }
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      try {
        // Fetch all bookings for stats
        const { data: allBookings, error: allBookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            car:vehicles(*),
            partner:partners(*)
          `)
          .eq('driver_id', user.id)
          .order('created_at', { ascending: false });

        if (allBookingsError) {
          console.error('Error fetching bookings:', allBookingsError);
          return;
        }

        const processedBookings = allBookings.map(booking => ({
          ...booking,
          car_name: booking.car?.make && booking.car?.model ? `${booking.car.make} ${booking.car.model}` : 'Unknown Car',
          car_image: booking.car?.image_url || '',
          car_plate: booking.car?.registration_number || '',
          partner_name: booking.partner?.company_name || booking.partner?.full_name || 'Verified Partner',
        })) as Booking[];

        setBookings(processedBookings);
        setRecentBookings(processedBookings.slice(0, 3));
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    const fetchTransactions = async () => {
      try {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('driver_id', user.id)
          .eq('type', 'expense');

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        const total = transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
        setTotalSpent(total);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchBookings();
    fetchTransactions();

    // Set up real-time subscription for bookings
    const bookingsSubscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `driver_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Booking change:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
    };
  }, [user]);

  const getStats = () => {
    return {
      total: bookings.length,
      active: bookings.filter(b => b.status === 'active').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      pending: bookings.filter(b => ['pending_partner_approval', 'pending_admin_approval', 'pending_documents'].includes(b.status)).length,
      totalSpent: totalSpent,
      openIssues: bookings.reduce((sum, b) => sum + (b.issues?.filter(i => i.status !== 'resolved').length || 0), 0)
    };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending_partner_approval': 'bg-yellow-100 text-yellow-800',
      'pending_admin_approval': 'bg-purple-100 text-purple-800',
      'pending_documents': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'rejected': 'bg-red-100 text-red-800',
      'partner_rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const stats = getStats();

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-xl font-bold">
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-8">Please <Link href="/login" className="underline">log in</Link> to view your dashboard.</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Driver'}!
          </h1>
          <p className="text-gray-600">
            Manage your car rentals and track your bookings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaCarSide className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <FaClock className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-blue-600">£{stats.totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaMoneyBillWave className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Issues</p>
                <p className="text-3xl font-bold text-red-600">{stats.openIssues}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FaExclamationTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/compare"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-full">
                <FaSearch className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Browse Cars</p>
                <p className="text-sm text-gray-600">Find your next rental</p>
              </div>
            </Link>

            <Link
              href="/driver/bookings"
              className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="p-2 bg-green-100 rounded-full">
                <FaCalendarAlt className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">My Bookings</p>
                <p className="text-sm text-gray-600">Manage your rentals</p>
              </div>
            </Link>

            <Link
              href="/driver/profile"
              className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-full">
                <FaUserCircle className="text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">My Profile</p>
                <p className="text-sm text-gray-600">Update your details</p>
              </div>
            </Link>

            <Link
              href="/driver/support"
              className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="p-2 bg-orange-100 rounded-full">
                <FaComments className="text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Get Support</p>
                <p className="text-sm text-gray-600">Need help? Contact us</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
            <Link
              href="/driver/bookings"
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <FaChevronRight className="text-sm" />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <FaCarSide className="mx-auto text-gray-400 text-4xl mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-4">Start by browsing our available cars!</p>
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                <FaSearch />
                Browse Cars
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <img 
                    src={booking.car_image || '/car-placeholder.jpg'} 
                    alt={booking.car_name}
                    className="w-16 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{booking.car_name}</h3>
                    <p className="text-sm text-gray-600">{booking.partner_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status === 'pending_partner_approval' ? 'Awaiting Partner' :
                         booking.status === 'pending_admin_approval' ? 'Awaiting Admin' :
                         booking.status === 'pending_documents' ? 'Pending Documents' :
                         booking.status === 'partner_rejected' ? 'PARTNER REJECTED' :
                         booking.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <span className="text-sm text-gray-500">
                        £{booking.total_amount?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/driver/bookings`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <FaEye />
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Service Features */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <FaShieldAlt className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Insurance Included</p>
                <p className="text-sm text-gray-600">Comprehensive coverage</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <FaTools className="text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">MOT & Maintenance</p>
                <p className="text-sm text-gray-600">All vehicles maintained</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <FaBolt className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">24/7 Support</p>
                <p className="text-sm text-gray-600">Round the clock assistance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 