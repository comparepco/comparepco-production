'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  FaCalendarAlt,
  FaClock,
  FaMoneyBillWave,
  FaCar,
  FaUser,
  FaBuilding,
  FaUserShield,
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaTachometerAlt,
  FaFilter,
  FaDownload,
  FaEye
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

interface BookingAnalytics {
  totalBookings: number;
  pendingPartnerApproval: number;
  pendingAdminApproval: number;
  confirmed: number;
  active: number;
  completed: number;
  rejected: number;
  cancelled: number;
  totalRevenue: number;
  averageResponseTime: number;
  overdueBookings: number;
  urgentBookings: number;
}

interface PartnerPerformance {
  partnerId: string;
  partnerName: string;
  partnerLocation: string;
  totalBookings: number;
  acceptedBookings: number;
  rejectedBookings: number;
  averageResponseTime: number;
  overdueCount: number;
  acceptanceRate: number;
}

export default function BookingAnalyticsPage() {
  const { user } = useAdmin();
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Record<string, Partner>>({});
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return;

      if (!user) {
        router.replace('/auth/login');
        return;
      }

      try {
        setLoading(true);

        // Load partners
        const { data: partnersData } = await supabase
          .from('partners')
          .select('*');

        const partnersMap: Record<string, Partner> = {};
        partnersData?.forEach(partner => {
          partnersMap[partner.id] = partner;
        });
        setPartners(partnersMap);

        // Load bookings
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
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, router]);

  const getFilteredBookings = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return bookingDate >= startDate;
    });
  }, [bookings, timeRange]);

  const analytics = useMemo((): BookingAnalytics => {
    const filtered = getFilteredBookings;
    
    // Normalise status so partner_rejected is treated as rejected for analytics
    const statusCounts = filtered.reduce((acc, booking) => {
      let status = booking.status;
      if (status === 'partner_rejected') status = 'rejected';
      if (status === 'partner_accepted') status = 'confirmed';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalRevenue = filtered
      .filter(b => b.status === 'confirmed' || b.status === 'active' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // For now, we'll use a placeholder for response time since it's not in the current schema
    // You can add this field to your bookings table if needed
    const averageResponseTime = 0; // Placeholder

    // For now, we'll use placeholders for overdue and urgent bookings
    // You can add these fields to your bookings table if needed
    const overdueBookings = 0; // Placeholder
    const urgentBookings = 0; // Placeholder

    return {
      totalBookings: filtered.length,
      pendingPartnerApproval: statusCounts['pending_partner_approval'] || 0,
      pendingAdminApproval: statusCounts['pending_admin_approval'] || 0,
      confirmed: statusCounts['confirmed'] || 0,
      active: statusCounts['active'] || 0,
      completed: statusCounts['completed'] || 0,
      rejected: statusCounts['rejected'] || 0,
      cancelled: statusCounts['cancelled'] || 0,
      totalRevenue,
      averageResponseTime: Math.round(averageResponseTime),
      overdueBookings,
      urgentBookings
    };
  }, [getFilteredBookings]);

  const partnerPerformance = useMemo((): PartnerPerformance[] => {
    const partnerMap = new Map<string, PartnerPerformance>();

    getFilteredBookings.forEach(booking => {
      const partnerId = booking.partner_id;
      if (!partnerId) return;

      if (!partnerMap.has(partnerId)) {
        const partnerData = partners[partnerId] || {};
        partnerMap.set(partnerId, {
          partnerId,
          partnerName: partnerData.company_name || 'Unknown Partner',
          partnerLocation: partnerData.city || partnerData.state || 'Location not specified',
          totalBookings: 0,
          acceptedBookings: 0,
          rejectedBookings: 0,
          averageResponseTime: 0,
          overdueCount: 0,
          acceptanceRate: 0
        });
      }

      const partner = partnerMap.get(partnerId)!;
      partner.totalBookings++;

      const status = booking.status;

      if (status === 'confirmed' || status === 'partner_accepted' || status === 'active' || status === 'completed') {
        partner.acceptedBookings++;
      } else if (status === 'rejected' || status === 'partner_rejected') {
        partner.rejectedBookings++;
      }

      // Placeholder for response time calculation
      // You can add partner_response_time field to your bookings table if needed
      partner.averageResponseTime = 0;
    });

    // Calculate acceptance rates
    partnerMap.forEach(partner => {
      const totalResponded = partner.acceptedBookings + partner.rejectedBookings;
      partner.acceptanceRate = totalResponded > 0 ? (partner.acceptedBookings / totalResponded) * 100 : 0;
      partner.averageResponseTime = Math.round(partner.averageResponseTime);
    });

    return Array.from(partnerMap.values())
      .sort((a, b) => b.totalBookings - a.totalBookings);
  }, [getFilteredBookings, partners]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
        <div className="p-10 text-center">Loading booking analytics...</div>
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
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Booking Analytics</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Comprehensive insights into booking performance and partner metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FaDownload />
              Export Data
            </button>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <span className="text-gray-600 dark:text-slate-400">Time Range:</span>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalBookings}</p>
              </div>
              <FaCalendarAlt className="text-blue-400 text-2xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">£{analytics.totalRevenue.toLocaleString()}</p>
              </div>
              <FaMoneyBillWave className="text-green-400 text-2xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Avg Response Time</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{analytics.averageResponseTime}m</p>
              </div>
              <FaClock className="text-yellow-400 text-2xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Overdue Bookings</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.overdueBookings}</p>
              </div>
              <FaExclamationTriangle className="text-red-400 text-2xl" />
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Status Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                <span className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <FaHourglassHalf />
                  Pending Partner Approval
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.pendingPartnerApproval}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <span className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <FaUserShield />
                  Pending Admin Approval
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.pendingAdminApproval}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <FaCheckCircle />
                  Confirmed
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.confirmed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <span className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <FaCar />
                  Active
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.active}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <span className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <FaTimesCircle />
                  Rejected
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.rejected}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <span className="text-orange-700 dark:text-orange-400">Urgent Bookings (&lt;30min)</span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.urgentBookings}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                <span className="text-red-700 dark:text-red-400">Overdue Bookings</span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.overdueBookings}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <span className="text-blue-700 dark:text-blue-400">Average Response Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.averageResponseTime} minutes</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <span className="text-green-700 dark:text-green-400">Revenue per Booking</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  £{analytics.totalBookings > 0 ? Math.round(analytics.totalRevenue / analytics.totalBookings) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Performance Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Partner Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Partner</th>
                  <th className="text-left py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Location</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Total Bookings</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Accepted</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Rejected</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Acceptance Rate</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Avg Response (min)</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-gray-600 dark:text-slate-400">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {partnerPerformance.map((partner) => (
                  <tr key={partner.partnerId} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{partner.partnerName}</td>
                    <td className="py-4 px-6 text-gray-600 dark:text-slate-400">{partner.partnerLocation}</td>
                    <td className="py-4 px-6 text-right text-gray-900 dark:text-white">{partner.totalBookings}</td>
                    <td className="py-4 px-6 text-right text-green-600 dark:text-green-400">{partner.acceptedBookings}</td>
                    <td className="py-4 px-6 text-right text-red-600 dark:text-red-400">{partner.rejectedBookings}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        partner.acceptanceRate >= 80 ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' :
                        partner.acceptanceRate >= 60 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                      }`}>
                        {partner.acceptanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-gray-900 dark:text-white">{partner.averageResponseTime}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        partner.overdueCount === 0 ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' :
                        partner.overdueCount <= 2 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' :
                        'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                      }`}>
                        {partner.overdueCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 