'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  FaCalendarAlt,
  FaEye,
  FaMoneyBillWave,
  FaCar,
  FaUser,
  FaBuilding,
  FaUserShield,
  FaPlus,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending_signature: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  completed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ActiveBookingsPage() {
  const { user } = useAdmin();
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Record<string, Driver>>({});
  const [partners, setPartners] = useState<Record<string, Partner>>({});
  const [vehicles, setVehicles] = useState<Record<string, Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load related data (drivers, partners, vehicles)
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
      } catch (error) {
        console.error('Error loading related data:', error);
      }
    };

    loadRelatedData();
  }, []);

  // Load active bookings
  useEffect(() => {
    const loadActiveBookings = async () => {
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
          .eq('status', 'active')
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

    loadActiveBookings();
  }, [user, authLoading, router]);

  // Filter bookings based on search term
  const filteredBookings = useMemo(() => {
    if (!searchTerm) return bookings;

    return bookings.filter(booking => {
      const driver = drivers[booking.driver_id];
      const partner = partners[booking.partner_id];
      const vehicle = vehicles[booking.vehicle_id];

      const driverName = driver ? `${driver.first_name} ${driver.last_name}` : '';
      const partnerName = partner?.company_name || '';
      const vehicleName = vehicle ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() : '';

      const searchLower = searchTerm.toLowerCase();
      return (
        driverName.toLowerCase().includes(searchLower) ||
        partnerName.toLowerCase().includes(searchLower) ||
        vehicleName.toLowerCase().includes(searchLower) ||
        booking.id.toLowerCase().includes(searchLower)
      );
    });
  }, [bookings, drivers, partners, vehicles, searchTerm]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <div className="p-10 text-center">Loading active bookings...</div>
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return "—";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Active Bookings</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Manage and monitor all currently active vehicle bookings
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-gray-600 dark:text-slate-400 text-sm">Total Active</p>
              <p className="text-gray-900 dark:text-white font-semibold text-2xl">{filteredBookings.length}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by driver, partner, or vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FaFilter />
              Filter
            </button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center">
              <FaCalendarAlt className="text-6xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-slate-400 mb-2">
                {searchTerm ? 'No bookings found' : 'No active bookings'}
              </h3>
              <p className="text-gray-500 dark:text-slate-500">
                {searchTerm ? 'Try adjusting your search terms' : 'All current bookings are inactive or completed'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredBookings.map((booking) => {
                const driver = drivers[booking.driver_id];
                const partner = partners[booking.partner_id];
                const vehicle = vehicles[booking.vehicle_id];

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
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[booking.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                          {booking.status?.replace('_', ' ') || 'active'}
                        </span>
                        
                        <Link 
                          href={`/admin/bookings/${booking.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <FaEye />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
