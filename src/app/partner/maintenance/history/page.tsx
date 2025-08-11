'use client';
import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaHistory,
  FaSearch,
  FaDownload
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MaintenanceRecord {
  id: string;
  partner_id: string;
  car_id: string;
  car_name: string;
  car_plate: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  mileage: number;
  created_at: string;
}

export default function MaintenanceHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const didInitRef = React.useRef(false);

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [filtered, setFiltered] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const getPartnerId = async () => {
    if (!user) return null;
    if (user.role === 'PARTNER') return user.id;
    if (user.role === 'PARTNER_STAFF') {
      const { data } = await supabase
        .from('partner_staff')
        .select('partner_id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.partner_id ?? null;
    }
    return null;
  };

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const partnerId = await getPartnerId();
      if (!partnerId) { setRecords([]); setFiltered([]); return; }

      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('partner_id', partnerId)
        .in('status', ['completed', 'cancelled'])
        .order('completed_date', { ascending: false });
      if (error) throw error;
      setRecords((data || []) as any);
      setFiltered((data || []) as any);
    } catch (e) {
      // Handle error silently or log to monitoring service
      setRecords([]); setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (didInitRef.current) return; didInitRef.current = true; loadRecords();
  }, [user, authLoading, router, loadRecords]);

  useEffect(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.car_name.toLowerCase().includes(q) || r.car_plate.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') list = list.filter(r => r.type === typeFilter);
    if (dateRange.start && dateRange.end) {
      const s = new Date(dateRange.start).getTime();
      const e = new Date(dateRange.end).getTime();
      list = list.filter(r => {
        const t = new Date(r.completed_date || r.scheduled_date).getTime();
        return t >= s && t <= e;
      });
    }
    setFiltered(list);
  }, [records, search, typeFilter, dateRange]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Service History</h1>
              <p className="mt-1 text-sm text-gray-600">Completed and cancelled maintenance</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" /> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 sm:p-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option value="all">All Types</option>
              <option value="service">Service</option>
              <option value="repair">Repair</option>
              <option value="mot">MOT</option>
              <option value="insurance">Insurance</option>
              <option value="inspection">Inspection</option>
              <option value="other">Other</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">History ({filtered.length})</h3>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No history</h3>
              <p className="mt-1 text-sm text-gray-500">No completed or cancelled records found.</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(r.scheduled_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{r.completed_date ? new Date(r.completed_date).toLocaleDateString() : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">£{(r.cost || 0).toFixed(2)}</td>
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