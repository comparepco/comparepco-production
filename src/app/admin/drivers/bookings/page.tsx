"use client";
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaCar, FaBuilding, FaChevronDown, FaChevronUp, FaMoneyBillWave, FaSearch, FaEye, FaFilter, FaArrowLeft, FaDownload } from 'react-icons/fa';
import { UserGroupIcon, TruckIcon, CurrencyPoundIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  status: string;
}

interface Booking {
  id: string;
  driver_id: string;
  partner_id: string;
  partner_name?: string;
  car_name: string;
  car_plate?: string;
  total_amount: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'pending_partner_approval' | 'pending_admin_approval' | 'rejected';
  weeks?: number;
  created_at: string;
}

interface EnrichedDriver extends Driver {
  bookings: Booking[];
}

export default function DriverBookingsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<EnrichedDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  // Load drivers + bookings
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Load drivers from Supabase
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .order('created_at', { ascending: false });

        if (driversError) {
          console.error('Error loading drivers:', driversError);
        }

        // Load bookings from Supabase
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (bookingsError) {
          console.error('Error loading bookings:', bookingsError);
        }

        // Load partners from Supabase
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('*');

        if (partnersError) {
          console.error('Error loading partners:', partnersError);
        }

        // Load vehicles from Supabase
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*');

        if (vehiclesError) {
          console.error('Error loading vehicles:', vehiclesError);
        }

        // Build drivers list
        const dList: Driver[] = (driversData || []).map(d => ({
          id: d.id,
          user_id: d.user_id,
          full_name: d.full_name || d.email || 'Unknown Driver',
          email: d.email || '',
          phone: d.phone || '',
          location: d.location || '',
          status: d.status || 'active'
        }));

        // Build partners map
        const pMap = new Map();
        (partnersData || []).forEach(p => {
          pMap.set(p.id, p.company_name || p.full_name || p.email || 'Verified Partner');
        });

        // Build vehicles map
        const vMap = new Map();
        (vehiclesData || []).forEach(v => {
          vMap.set(v.id, {
            name: v.name || `${v.make || ''} ${v.model || ''}`.trim() || 'Unknown Car',
            plate: v.license_plate || v.registration_number || ''
          });
        });

        // Process bookings with enhanced data
        const bList: Booking[] = (bookingsData || []).map(b => {
          const vehicle = vMap.get(b.vehicle_id) || {};
          return {
            id: b.id,
            driver_id: b.driver_id,
            partner_id: b.partner_id,
            partner_name: b.partner_name || pMap.get(b.partner_id) || 'Verified Partner',
            car_name: b.car_name || vehicle.name || 'Unknown Car',
            car_plate: b.car_plate || vehicle.plate || '',
            total_amount: b.total_amount || 0,
            start_date: b.start_date,
            end_date: b.end_date,
            status: b.status,
            weeks: b.weeks,
            created_at: b.created_at
          };
        });

        const enriched = dList.map(dr => ({
          ...dr,
          bookings: bList.filter(b => b.driver_id === dr.id),
        }));
        
        setDrivers(enriched);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total_drivers = drivers.length;
    const total_bookings = drivers.reduce((sum, d) => sum + d.bookings.length, 0);
    const total_revenue = drivers.reduce((sum, d) => sum + d.bookings.reduce((s, b) => s + (b.total_amount || 0), 0), 0);
    const active_bookings = drivers.reduce((sum, d) => sum + d.bookings.filter(b => b.status === 'active').length, 0);
    const pending_bookings = drivers.reduce((sum, d) => sum + d.bookings.filter(b => ['pending', 'pending_partner_approval', 'pending_admin_approval'].includes(b.status)).length, 0);
    return { total_drivers, total_bookings, total_revenue, active_bookings, pending_bookings };
  }, [drivers]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    let result = drivers.filter(d => 
      d.full_name?.toLowerCase().includes(q) || 
      d.email?.toLowerCase().includes(q) ||
      d.bookings.some(b => 
        b.car_name?.toLowerCase().includes(q) ||
        b.partner_name?.toLowerCase().includes(q)
      )
    );

    if (statusFilter) {
      result = result.filter(d => d.bookings.some(b => b.status === statusFilter));
    }

    return result;
  }, [drivers, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending_partner_approval': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'pending_admin_approval': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading driver bookings...</p>
        </div>
      </div>
    );
  }

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
              <TruckIcon className="h-8 w-8 text-blue-600" />
              Driver Bookings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Overview of every booking linked to each driver.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Drivers</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_drivers}</div>
              </div>
              <UserGroupIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Bookings</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total_bookings}</div>
              </div>
              <TruckIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Active Bookings</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active_bookings}</div>
              </div>
              <TruckIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Pending Bookings</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending_bookings}</div>
              </div>
              <TruckIcon className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Revenue</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">£{stats.total_revenue.toLocaleString()}</div>
              </div>
              <CurrencyPoundIcon className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <FaSearch className="text-gray-400" />
            <input 
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 flex-1 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Search drivers, cars, or partners..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select 
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="pending_partner_approval">Awaiting Partner</option>
              <option value="pending_admin_approval">Awaiting Admin</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <FaDownload />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(d => {
                  const revenue = d.bookings.reduce((s,b)=>s+b.total_amount,0);
                  return (
                    <>
                      <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{d.full_name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{d.email}</div>
                          {d.phone && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{d.phone}</div>
                          )}
                          {d.location && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">{d.location}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{d.bookings.length}</div>
                          {d.bookings.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Active: {d.bookings.filter(b => b.status === 'active').length} | 
                              Pending: {d.bookings.filter(b => ['pending', 'pending_partner_approval', 'pending_admin_approval'].includes(b.status)).length}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">£{revenue.toLocaleString()}</div>
                          {d.bookings.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Avg: £{Math.round(revenue / d.bookings.length).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setExpandedRow(expandedRow===d.id?null:d.id)} 
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            {expandedRow===d.id? <FaChevronUp/>:<FaChevronDown/>}
                          </button>
                        </td>
                      </tr>
                      {expandedRow===d.id && (
                        <tr>
                          <td colSpan={4} className="p-0 bg-gray-50 dark:bg-gray-700">
                            <div className="p-4">
                              {d.bookings.length===0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No bookings.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-600">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Car</th>
                                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Partner</th>
                                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Dates</th>
                                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Duration</th>
                                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Amount</th>
                                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Created</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                      {d.bookings.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                                          <td className="px-4 py-2">
                                            <div className="font-medium text-gray-900 dark:text-white">{b.car_name}</div>
                                            {b.car_plate && (
                                              <div className="text-xs text-gray-500 dark:text-gray-400">{b.car_plate}</div>
                                            )}
                                          </td>
                                          <td className="px-4 py-2 text-gray-900 dark:text-white">{b.partner_name}</td>
                                          <td className="px-4 py-2">
                                            <div className="text-gray-900 dark:text-white">{formatDate(b.start_date)}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">to {formatDate(b.end_date)}</div>
                                          </td>
                                          <td className="px-4 py-2 text-gray-900 dark:text-white">
                                            {b.weeks ? `${b.weeks} weeks` : '—'}
                                          </td>
                                          <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">£{b.total_amount?.toLocaleString() || '0'}</td>
                                          <td className="px-4 py-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(b.status)}`}>
                                              {b.status === 'pending_partner_approval' ? 'Awaiting Partner' :
                                               b.status === 'pending_admin_approval' ? 'Awaiting Admin' :
                                               b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                                            <div>{formatDate(b.created_at)}</div>
                                            <Link 
                                              href={`/admin/bookings/${b.id}`}
                                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1 transition-colors"
                                            >
                                              <FaEye className="text-xs" />
                                              View Details
                                            </Link>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 