'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaBuilding,
  FaTruck,
  FaUser,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaTimes
} from 'react-icons/fa';

type Claim = {
  id: string;
  partner_id: string;
  car_id: string;
  driver_id?: string;
  booking_id?: string;
  description?: string;
  status: 'open' | 'need_info' | 'closed';
  severity?: 'low'|'medium'|'high';
  created_at?: string;
};

type Grouped = Record<string, Record<string, Claim[]>>; // partnerId -> carId -> claims

type Booking = { id: string; start_date: string; car_id: string };

export default function AdminFleetClaimsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'open'|'need_info'|'closed'|'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [allClaims, setAllClaims] = useState<Claim[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimId, setSelectedClaimId] = useState<string|null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string|null>(null);
  const [expandedDriver, setExpandedDriver] = useState<string|null>(null);
  const [driverBookings, setDriverBookings] = useState<Record<string, Booking[]>>({});

  // Lookup maps
  const partnerMap = useMemo(() => Object.fromEntries(partners.map(p => [p.id, p])), [partners]);
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);
  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);

  // Stats
  const stats = useMemo(() => {
    const s = { open: 0, need_info: 0, closed: 0, total: 0 };
    allClaims.forEach(c => {
      s.total++;
      if (c.status === 'open') s.open++;
      else if (c.status === 'need_info') s.need_info++;
      else if (c.status === 'closed') s.closed++;
    });
    return s;
  }, [allClaims]);

  // Group by partner -> driver (not vehicle)
  const grouped = useMemo(() => {
    const out: Record<string, Record<string, Claim[]>> = {};
    allClaims.forEach(claim => {
      const partnerId = claim.partner_id || 'unknown';
      const driverId = claim.driver_id || 'unknown';
      if (!out[partnerId]) out[partnerId] = {};
      if (!out[partnerId][driverId]) out[partnerId][driverId] = [];
      out[partnerId][driverId].push(claim);
    });
    return out;
  }, [allClaims]);

  // Filtered for search and status
  const filteredGrouped = useMemo(() => {
    const out: typeof grouped = {};
    Object.entries(grouped).forEach(([partnerId, drivers]) => {
      Object.entries(drivers).forEach(([driverId, claims]) => {
        const filtered = claims.filter(c => {
          const statusOk = statusFilter === 'all' || c.status === statusFilter;
          const searchOk = !searchTerm ||
            (partnerMap[partnerId]?.business_name || partnerMap[partnerId]?.company_name || partnerMap[partnerId]?.name || partnerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (driverMap[driverId]?.name || driverId).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.car_id && (vehicleMap[c.car_id]?.name || vehicleMap[c.car_id]?.make + ' ' + vehicleMap[c.car_id]?.model || c.car_id).toLowerCase().includes(searchTerm.toLowerCase()));
          return statusOk && searchOk;
        });
        if (filtered.length) {
          if (!out[partnerId]) out[partnerId] = {};
          out[partnerId][driverId] = filtered;
        }
      });
    });
    return out;
  }, [grouped, statusFilter, searchTerm, partnerMap, vehicleMap, driverMap]);

  // Fetch all data
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
      const [vehiclesSnapshot, claimsSnapshot, partnersSnapshot, driversSnapshot] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('claims').select('*'),
        supabase.from('partners').select('*'),
        supabase.from('drivers').select('*')
      ]);

      if (claimsSnapshot.error) {
        console.error('Error loading claims:', claimsSnapshot.error);
        toast.error('Failed to load claims');
        return;
      }

      if (partnersSnapshot.error) {
        console.error('Error loading partners:', partnersSnapshot.error);
        toast.error('Failed to load partners');
        return;
      }

      if (vehiclesSnapshot.error) {
        console.error('Error loading vehicles:', vehiclesSnapshot.error);
        toast.error('Failed to load vehicles');
        return;
      }

      if (driversSnapshot.error) {
        console.error('Error loading drivers:', driversSnapshot.error);
        toast.error('Failed to load drivers');
        return;
      }

      const claims: Claim[] = (claimsSnapshot.data || []).map(claim => ({
        id: claim.id,
        ...claim
      } as Claim));

      setAllClaims(claims);
      setPartners(partnersSnapshot.data || []);
      setVehicles(vehiclesSnapshot.data || []);
      setDrivers(driversSnapshot.data || []);

      // Fetch missing partners/drivers referenced in claims but not in collections
      const currentPartnerIds = new Set((partnersSnapshot.data || []).map(p => p.id));
      const currentDriverIds = new Set((driversSnapshot.data || []).map((d: any) => d.id));
      const missingPartnerIds = claims.map(c => c.partner_id).filter(pid => pid && !currentPartnerIds.has(pid));
      const missingDriverIds = claims.map(c => c.driver_id).filter(did => did && !currentDriverIds.has(did));
      const uniqueMissingPartners = Array.from(new Set(missingPartnerIds));
      const uniqueMissingDrivers = Array.from(new Set(missingDriverIds));

      if (uniqueMissingPartners.length) {
        const fetched: any[] = [];
        for (const pid of uniqueMissingPartners) {
          if (!pid) continue;
          try {
            const { data, error } = await supabase.from('partners').select('*').eq('id', pid).single();
            if (data && !error) fetched.push(data);
          } catch {}
        }
        if (fetched.length) setPartners(prev => [...prev, ...fetched]);
      }

      if (uniqueMissingDrivers.length) {
        const fetchedD: any[] = [];
        for (const did of uniqueMissingDrivers) {
          if (!did) continue;
          try {
            const { data, error } = await supabase.from('drivers').select('*').eq('id', did).single();
            if (data && !error) fetchedD.push(data);
          } catch {}
        }
        if (fetchedD.length) setDrivers(prev => [...prev, ...fetchedD]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsForDriver = async (driverId: string) => {
    if (driverBookings[driverId]) return; // cached
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('driver_id', driverId)
      .order('start_date', { ascending: false });
    
    if (!error && data) {
      const list: Booking[] = data.map(booking => ({
        id: booking.id,
        start_date: booking.start_date,
        car_id: booking.car_id
      }));
      setDriverBookings(prev => ({ ...prev, [driverId]: list }));
    }
  };

  // Helper display functions
  const getPartnerDisplayName = (partner: any) => partner?.business_name || partner?.company_name || partner?.name || partner?.contact_person || partner?.email || partner?.id || 'Unknown Partner';
  const getVehicleDisplayName = (vehicle: any) => vehicle?.name || (vehicle?.make ? vehicle.make + ' ' + vehicle.model : vehicle?.id) || vehicle?.id || 'Unknown Vehicle';
  const getDriverDisplayName = (driver: any) => driver?.name || driver?.full_name || driver?.email || driver?.id || 'Unknown Driver';

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      open: 'bg-blue-600 text-white',
      need_info: 'bg-yellow-500 text-white',
      closed: 'bg-green-600 text-white',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${map[status] || 'bg-gray-500 text-white'}`}>{status.replace('_',' ')}</span>;
  };

  // Severity badge
  const SeverityBadge = ({ severity }: { severity?: string }) => {
    if (!severity) return null;
    const map: Record<string, string> = {
      low: 'bg-gray-700 text-gray-200',
      medium: 'bg-yellow-700 text-yellow-200',
      high: 'bg-red-700 text-red-200',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${map[severity] || 'bg-gray-600 text-white'}`}>{severity}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading vehicle claims...</p>
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
              <FaExclamationTriangle className="h-8 w-8 text-red-600" />
              Vehicle Claims
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track vehicle claims from partners and drivers
          </p>
        </div>

        {/* Dashboard-style stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center shadow">
            <FaExclamationTriangle className="w-8 h-8 mb-2 text-blue-600" />
            <div className="text-3xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm font-semibold mt-1 text-gray-600 dark:text-gray-400">Open</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center shadow">
            <FaInfoCircle className="w-8 h-8 mb-2 text-yellow-600" />
            <div className="text-3xl font-bold text-yellow-600">{stats.need_info}</div>
            <div className="text-sm font-semibold mt-1 text-gray-600 dark:text-gray-400">Need Info</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center shadow">
            <FaCheckCircle className="w-8 h-8 mb-2 text-green-600" />
            <div className="text-3xl font-bold text-green-600">{stats.closed}</div>
            <div className="text-sm font-semibold mt-1 text-gray-600 dark:text-gray-400">Closed</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center shadow">
            <FaBuilding className="w-8 h-8 mb-2 text-gray-600" />
            <div className="text-3xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm font-semibold mt-1 text-gray-600 dark:text-gray-400">Total Claims</div>
          </div>
        </div>

        {/* Search and filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-2">
              {['all','open','need_info','closed'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatusFilter(s as any)} 
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                    statusFilter === s 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {s.replace('_',' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input 
                  type="text" 
                  placeholder="Search claims..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Open: {stats.open} | Need Info: {stats.need_info} | Closed: {stats.closed} | Total: {stats.total}
              </div>
            </div>
          </div>
        </div>

        {Object.keys(filteredGrouped).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FaTruck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No claims found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No claims have been submitted yet.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(filteredGrouped).map(([partnerId, drivers]) => {
              const partner = partnerMap[partnerId];
              const open = expandedPartner === partnerId;
              return (
                <div key={partnerId} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow">
                  <button 
                    className="w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 rounded-t-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
                    onClick={() => setExpandedPartner(open ? null : partnerId)}
                  >
                    <span className="font-semibold flex items-center gap-2 text-lg text-gray-900 dark:text-white">
                      <FaBuilding className="w-6 h-6 text-blue-600" />
                      {getPartnerDisplayName(partner)}
                    </span>
                    {open ? <FaChevronDown className="w-5 h-5 text-gray-400" /> : <FaChevronRight className="w-5 h-5 text-gray-400" />}
                  </button>
                  {open && (
                    <div className="p-6 space-y-4 border-t border-gray-200 dark:border-gray-700">
                      {Object.entries(drivers).map(([driverId, claims]) => {
                        const driver = driverMap[driverId];
                        const dOpen = expandedDriver === driverId;
                        return (
                          <div key={driverId} className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <button 
                              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-t-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                              onClick={() => setExpandedDriver(dOpen ? null : driverId)}
                            >
                              <span className="text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                                <FaUser className="w-5 h-5 text-gray-600" />
                                {getDriverDisplayName(driver)} 
                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({claims.length} claims)</span>
                              </span>
                              {dOpen ? <FaChevronDown className="w-5 h-5 text-gray-400" /> : <FaChevronRight className="w-5 h-5 text-gray-400" />}
                            </button>
                            {dOpen && (
                              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left">
                                    <thead>
                                      <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                                        <th className="p-3 font-medium">Date</th>
                                        <th className="p-3 font-medium">Vehicle</th>
                                        <th className="p-3 font-medium">Status</th>
                                        <th className="p-3 font-medium">Severity</th>
                                        <th className="p-3 font-medium">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {claims.map(c => (
                                        <tr 
                                          key={c.id} 
                                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors" 
                                          onClick={() => setSelectedClaimId(c.id)}
                                        >
                                          <td className="p-3 whitespace-nowrap text-gray-900 dark:text-white">
                                            {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
                                          </td>
                                          <td className="p-3 whitespace-nowrap text-gray-900 dark:text-white">
                                            {getVehicleDisplayName(vehicleMap[c.car_id])}
                                          </td>
                                          <td className="p-3">
                                            <StatusBadge status={c.status} />
                                          </td>
                                          <td className="p-3">
                                            <SeverityBadge severity={c.severity} />
                                          </td>
                                          <td className="p-3 truncate max-w-xs text-gray-900 dark:text-white">
                                            {c.description}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Claim Detail Modal - Placeholder for now */}
        {selectedClaimId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Claim Details</h3>
                <button
                  onClick={() => setSelectedClaimId(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Claim detail component will be implemented here. Claim ID: {selectedClaimId}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 