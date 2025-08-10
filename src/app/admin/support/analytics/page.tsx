'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHeadset, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes,
  FaCheck, FaTimes as FaX, FaUserTie, FaUserCog, FaUserShield,
  FaArrowUp, FaArrowDown, FaExclamationTriangle, FaInfoCircle, FaCheckCircle,
  FaClock
} from 'react-icons/fa';

interface PerformanceMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  urgentTickets: number;
  averageResponseTime: number;
  averageSatisfaction: number;
  totalChats: number;
  activeChats: number;
  waitingChats: number;
  averageWaitTime: number;
  averageSessionDuration: number;
  onlineStaff: number;
  availableStaff: number;
  totalStaff: number;
  averageStaffSatisfaction: number;
}

interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  department: string;
  tickets_handled: number;
  chats_handled: number;
  average_response_time: number;
  average_satisfaction: number;
  total_satisfaction_ratings: number;
  online_hours: number;
  is_online: boolean;
  is_available: boolean;
}

interface TimeSeriesData {
  date: string;
  tickets: number;
  chats: number;
  satisfaction: number;
  response_time: number;
}

export default function SupportAnalytics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    urgentTickets: 0,
    averageResponseTime: 0,
    averageSatisfaction: 0,
    totalChats: 0,
    activeChats: 0,
    waitingChats: 0,
    averageWaitTime: 0,
    averageSessionDuration: 0,
    onlineStaff: 0,
    availableStaff: 0,
    totalStaff: 0,
    averageStaffSatisfaction: 0
  });
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
    setupRealtimeSubscriptions();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range based on period
      const now = new Date();
      const periodStart = new Date();
      if (period === '7d') {
        periodStart.setDate(now.getDate() - 7);
      } else if (period === '30d') {
        periodStart.setDate(now.getDate() - 30);
      } else if (period === '90d') {
        periodStart.setDate(now.getDate() - 90);
      }

      // Load tickets data
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .gte('created_at', periodStart.toISOString());

      if (ticketsError) throw ticketsError;

      // Load chats data
      const { data: chats, error: chatsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .gte('created_at', periodStart.toISOString());

      if (chatsError) throw chatsError;

      // Load staff data
      const { data: staff, error: staffError } = await supabase
        .from('support_staff')
        .select('*');

      if (staffError) throw staffError;

      // Calculate metrics
      const recentTickets = tickets || [];
      const recentChats = chats || [];
      const staffMembers = staff || [];

      const calculatedMetrics: PerformanceMetrics = {
        totalTickets: recentTickets.length,
        openTickets: recentTickets.filter(t => t.status === 'open').length,
        resolvedTickets: recentTickets.filter(t => t.status === 'resolved').length,
        urgentTickets: recentTickets.filter(t => t.priority === 'urgent').length,
        averageResponseTime: recentTickets.length > 0 
          ? recentTickets.reduce((sum, t) => sum + (t.response_time_minutes || 0), 0) / recentTickets.length 
          : 0,
        averageSatisfaction: recentTickets.length > 0
          ? recentTickets.reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0) / recentTickets.length
          : 0,
        totalChats: recentChats.length,
        activeChats: recentChats.filter(c => c.status === 'active').length,
        waitingChats: recentChats.filter(c => c.status === 'waiting').length,
        averageWaitTime: recentChats.length > 0
          ? recentChats.reduce((sum, c) => sum + (c.waiting_time_minutes || 0), 0) / recentChats.length
          : 0,
        averageSessionDuration: recentChats.length > 0
          ? recentChats.reduce((sum, c) => sum + (c.session_duration_minutes || 0), 0) / recentChats.length
          : 0,
        onlineStaff: staffMembers.filter(s => s.is_online).length,
        availableStaff: staffMembers.filter(s => s.is_available).length,
        totalStaff: staffMembers.length,
        averageStaffSatisfaction: staffMembers.length > 0
          ? staffMembers.reduce((sum, s) => sum + (s.average_satisfaction_rating || 0), 0) / staffMembers.length
          : 0
      };

      setMetrics(calculatedMetrics);

      // Load staff performance data
      const { data: performanceData, error: perfError } = await supabase
        .from('support_performance')
        .select('*')
        .gte('date', periodStart.toISOString().split('T')[0]);

      if (perfError) throw perfError;

      // Transform staff performance data
      const staffPerf = staffMembers.map(staff => {
        const perf = performanceData?.find(p => p.staff_id === staff.id);
        return {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          department: staff.department,
          tickets_handled: perf?.tickets_handled || 0,
          chats_handled: perf?.chats_handled || 0,
          average_response_time: staff.average_response_time_minutes || 0,
          average_satisfaction: staff.average_satisfaction_rating || 0,
          total_satisfaction_ratings: perf?.total_satisfaction_ratings || 0,
          online_hours: perf?.online_hours || 0,
          is_online: staff.is_online,
          is_available: staff.is_available
        };
      });

      setStaffPerformance(staffPerf);

      // Generate time series data
      const timeSeries: TimeSeriesData[] = [];
      const currentDate = new Date(periodStart);
      while (currentDate <= now) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayTickets = recentTickets.filter(t => 
          t.created_at.startsWith(dateStr)
        );
        const dayChats = recentChats.filter(c => 
          c.created_at.startsWith(dateStr)
        );

        timeSeries.push({
          date: dateStr,
          tickets: dayTickets.length,
          chats: dayChats.length,
          satisfaction: dayTickets.length > 0 
            ? dayTickets.reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0) / dayTickets.length
            : 0,
          response_time: dayTickets.length > 0
            ? dayTickets.reduce((sum, t) => sum + (t.response_time_minutes || 0), 0) / dayTickets.length
            : 0
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setTimeSeriesData(timeSeries);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const subscription = supabase
      .channel('support_analytics')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets'
      }, () => {
        loadAnalytics();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      }, () => {
        loadAnalytics();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_staff'
      }, () => {
        loadAnalytics();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <FaArrowUp className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <FaArrowDown className="w-4 h-4 text-red-500" />;
    } else {
      return <FaChartLine className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getResponseTimeColor = (time: number) => {
    if (time <= 5) return 'text-green-600';
    if (time <= 15) return 'text-yellow-600';
    if (time <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Support Analytics & Performance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor support performance, trends, and staff efficiency
          </p>
        </div>

        {/* Period Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Time Period:
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <button
              onClick={loadAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaRedo className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalTickets}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.openTickets} open, {metrics.urgentTickets} urgent
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FaFileAlt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Chats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalChats}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.activeChats} active, {metrics.waitingChats} waiting
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FaHeadset className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
                <p className={`text-2xl font-bold ${getResponseTimeColor(metrics.averageResponseTime)}`}>
                  {metrics.averageResponseTime.toFixed(1)}m
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target: &lt; 15 minutes
                </p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FaClock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction</p>
                <p className={`text-2xl font-bold ${getSatisfactionColor(metrics.averageSatisfaction)}`}>
                  {metrics.averageSatisfaction.toFixed(1)}/5
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.totalStaff} staff online
                </p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FaStar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Chat Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FaHeadset className="w-5 h-5 mr-2" />
                Chat Performance
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Wait Time</span>
                  <span className={`font-semibold ${getResponseTimeColor(metrics.averageWaitTime)}`}>
                    {metrics.averageWaitTime.toFixed(1)}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Session Duration</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.averageSessionDuration.toFixed(1)}m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Active Chats</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.activeChats}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Waiting Chats</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.waitingChats}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FaUsers className="w-5 h-5 mr-2" />
                Staff Performance
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Online Staff</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.onlineStaff}/{metrics.totalStaff}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Available Staff</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.availableStaff}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Avg Staff Satisfaction</span>
                  <span className={`font-semibold ${getSatisfactionColor(metrics.averageStaffSatisfaction)}`}>
                    {metrics.averageStaffSatisfaction.toFixed(1)}/5
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Resolution Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {metrics.totalTickets > 0 ? ((metrics.resolvedTickets / metrics.totalTickets) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Staff Performance Details
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tickets Handled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Chats Handled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Avg Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Satisfaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {staffPerformance.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <FaUser className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {staff.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {staff.department}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {staff.tickets_handled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {staff.chats_handled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getResponseTimeColor(staff.average_response_time)}`}>
                          {staff.average_response_time}m
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getSatisfactionColor(staff.average_satisfaction)}`}>
                          {staff.average_satisfaction.toFixed(1)}/5
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${staff.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {staff.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Time Series Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Performance Trends
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {timeSeriesData.slice(-7).map((data, index) => (
                <div key={data.date} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(data.date).toLocaleDateString()}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Tickets:</span>
                      <span className="font-medium">{data.tickets}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Chats:</span>
                      <span className="font-medium">{data.chats}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Satisfaction:</span>
                      <span className={`font-medium ${getSatisfactionColor(data.satisfaction)}`}>
                        {data.satisfaction.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 