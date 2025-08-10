'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaFilter,
  FaDownload,
  FaTools,
  FaWrench,
  FaShieldAlt,
  FaEye,
  FaCar,
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';

type MaintenanceType = 'service' | 'repair' | 'mot' | 'insurance' | 'inspection' | 'other';

interface MaintenanceRecord {
  id: string;
  partner_id: string;
  car_id: string;
  car_name: string;
  car_plate: string;
  type: MaintenanceType;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  estimated_cost?: number;
  mileage: number;
  provider: { name: string; contact: string };
  created_at: string;
}

export default function MaintenanceSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const didInitRef = React.useRef(false);

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [filtered, setFiltered] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MaintenanceType>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'overdue'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const getPartnerId = async () => {
    if (!user) return null;
    try {
      if (user.role === 'PARTNER') return user.id; // partners map 1:1 in most places
      if (user.role === 'PARTNER_STAFF') {
        const { data } = await supabase
          .from('partner_staff')
          .select('partner_id')
          .eq('user_id', user.id)
          .maybeSingle();
        return data?.partner_id ?? null;
      }
      return null;
    } catch (e) {
      console.error('getPartnerId error', e);
      return null;
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const partnerId = await getPartnerId();
      if (!partnerId) {
        setRecords([]);
        setFiltered([]);
        return;
      }

      // Only scheduled/in_progress plus anything past due for schedule view
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('partner_id', partnerId)
        .in('status', ['scheduled', 'in_progress', 'overdue'])
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const enriched = (data || []).map((rec: any) => {
        const isOverdue = rec.status === 'scheduled' && new Date(rec.scheduled_date) < now;
        return { ...rec, status: isOverdue ? 'overdue' : rec.status } as MaintenanceRecord;
      });

      setRecords(enriched);
      setFiltered(enriched);
    } catch (e) {
      console.error('loadRecords error', e);
      setRecords([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (didInitRef.current) return;
    didInitRef.current = true;
    loadRecords();
  }, [user, authLoading]);

  useEffect(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.car_name.toLowerCase().includes(q) ||
        r.car_plate.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') list = list.filter((r) => r.type === typeFilter);
    if (priorityFilter !== 'all') list = list.filter((r) => r.priority === priorityFilter);
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (dateRange.start && dateRange.end) {
      const s = new Date(dateRange.start).getTime();
      const e = new Date(dateRange.end).getTime();
      list = list.filter((r) => {
        const t = new Date(r.scheduled_date).getTime();
        return t >= s && t <= e;
      });
    }
    setFiltered(list);
  }, [records, search, typeFilter, priorityFilter, statusFilter, dateRange]);

  const stats = React.useMemo(() => {
    return {
      total: records.length,
      scheduled: records.filter((r) => r.status === 'scheduled').length,
      inProgress: records.filter((r) => r.status === 'in_progress').length,
      overdue: records.filter((r) => r.status === 'overdue').length,
    };
  }, [records]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading maintenance schedule...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Service Schedule</h1>
              <p className="mt-1 text-sm text-gray-600">Plan and track upcoming maintenance</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button onClick={() => router.push('/partner/maintenance')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaTools className="w-4 h-4 mr-2" />
                Manage Records
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export
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
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-blue-600">Schedule items</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaWrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-xs text-green-600">Currently being serviced</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
                <p className="text-xs text-yellow-600">Awaiting start</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaShieldAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                <p className="text-xs text-red-600">Past due date</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Schedule</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Types</option>
                <option value="service">Service</option>
                <option value="repair">Repair</option>
                <option value="mot">MOT</option>
                <option value="insurance">Insurance</option>
                <option value="inspection">Inspection</option>
                <option value="other">Other</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="overdue">Overdue</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Maintenance ({filtered.length})</h3>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No scheduled maintenance</h3>
              <p className="mt-1 text-sm text-gray-500">Adjust filters or add new maintenance from Manage Records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{r.car_name}</div>
                        <div className="text-sm text-gray-500">{r.car_plate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{r.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{r.title || r.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(r.scheduled_date).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{r.priority}</td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize">{r.status.replace('_', ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => router.push('/partner/maintenance')} className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                          <FaEye className="w-4 h-4 mr-1" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}