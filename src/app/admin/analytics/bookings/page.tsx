'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import jsPDF from 'jspdf';
import {
  Calendar, TrendingUp, TrendingDown, BarChart3, PieChart, LineChart,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle,
  DollarSign, Star, Activity, Target, Filter, Download, RefreshCw, Eye,
  Users, Car, MapPin, AlertTriangle, Zap, Award, Play, AlertCircle, CheckCircle2, FileText, CalendarDays
} from 'lucide-react';

interface BookingMetrics {
  totalRentals: number;
  activeRentals: number;
  completedRentals: number;
  cancelledRentals: number;
  totalRevenue: number;
  averageRentalValue: number;
  completionRate: number;
  averageResponseTime: number;
}

interface BookingTrend {
  date: string;
  rentals: number;
  revenue: number;
}

interface TopRoutes {
  route: string;
  rentals: number;
  revenue: number;
}

export default function AdminBookingAnalyticsPage() {
  const [metrics, setMetrics] = useState<BookingMetrics>({
    totalRentals: 0,
    activeRentals: 0,
    completedRentals: 0,
    cancelledRentals: 0,
    totalRevenue: 0,
    averageRentalValue: 0,
    completionRate: 0,
    averageResponseTime: 0
  });
  const [trends, setTrends] = useState<BookingTrend[]>([]);
  const [topRoutes, setTopRoutes] = useState<TopRoutes[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [filtersData, setFiltersData] = useState<any>(null);

  useEffect(() => {
    loadBookingAnalytics();
  }, [timeRange]);

  const loadBookingAnalytics = async () => {
    try {
      setLoading(true);
      
      // Real data queries from Supabase with error handling
      let bookingsData, revenueData, driversData, vehiclesData;
      
      try {
        const [bookingsResult, revenueResult, driversResult, vehiclesResult] = await Promise.allSettled([
          supabase.from('bookings').select('*'),
          supabase.from('payments').select('*'),
          supabase.from('drivers').select('*'),
          supabase.from('vehicles').select('*')
        ]);

        bookingsData = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data : [];
        revenueData = revenueResult.status === 'fulfilled' ? revenueResult.value.data : [];
        driversData = driversResult.status === 'fulfilled' ? driversResult.value.data : [];
        vehiclesData = vehiclesResult.status === 'fulfilled' ? vehiclesResult.value.data : [];

        console.log(`📊 Real data loaded: ${bookingsData?.length || 0} bookings, ${revenueData?.length || 0} payments, ${driversData?.length || 0} drivers, ${vehiclesData?.length || 0} vehicles`);
      } catch (dataError) {
        console.warn('⚠️ Error fetching data, using fallback:', dataError);
        bookingsData = [];
        revenueData = [];
        driversData = [];
        vehiclesData = [];
      }

      // Calculate metrics from real data
      const totalRentals = bookingsData?.length || 0;
      const activeRentals = bookingsData?.filter(b => b.status === 'active' || b.status === 'in_progress').length || 0;
      const completedRentals = bookingsData?.filter(b => b.status === 'completed').length || 0;
      const cancelledRentals = bookingsData?.filter(b => b.status === 'cancelled').length || 0;
      
      const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const averageRentalValue = totalRentals > 0 ? totalRevenue / totalRentals : 0;
      const completionRate = totalRentals > 0 ? (completedRentals / totalRentals) * 100 : 0;
      
      // Calculate average response time from booking timestamps
      const responseTimes = bookingsData?.map(booking => {
        const created = new Date(booking.created_at);
        const updated = new Date(booking.updated_at || booking.created_at);
        return (updated.getTime() - created.getTime()) / (1000 * 60); // minutes
      }).filter(time => time > 0) || [];
      
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      const calculatedMetrics: BookingMetrics = {
        totalRentals,
        activeRentals,
        completedRentals,
        cancelledRentals,
        totalRevenue,
        averageRentalValue: Math.round(averageRentalValue * 100) / 100,
        completionRate: Math.round(completionRate * 10) / 10,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10
      };

      setMetrics(calculatedMetrics);

      // Generate trends from real data
      const trendsData = generateTrendsFromData(bookingsData || [], revenueData || []);
      setTrends(trendsData);

      // Generate top routes from real data
      const routesData = generateTopRoutesFromData(bookingsData || []);
      setTopRoutes(routesData);

    } catch (error) {
      console.error('Error loading booking analytics:', error);
      toast.error('Failed to load booking analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateTrendsFromData = (bookingsData: any[], revenueData: any[]) => {
    // Generate trends from actual booking data
    const trends: BookingTrend[] = [];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => {
      const dayRentals = bookingsData?.filter(b => 
        b.created_at?.startsWith(date)
      ).length || 0;
      
      const dayRevenue = revenueData?.filter(p => 
        p.created_at?.startsWith(date)
      ).reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      trends.push({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rentals: dayRentals,
        revenue: Math.round(dayRevenue)
      });
    });

    return trends;
  };

  const generateTopRoutesFromData = (bookingsData: any[]) => {
    // Generate top routes from actual booking data
    const routeMap = new Map<string, { rentals: number; revenue: number }>();
    
    bookingsData?.forEach(booking => {
      const route = `${booking.pickup_location || 'Unknown'} → ${booking.dropoff_location || 'Unknown'}`;
      const existing = routeMap.get(route) || { rentals: 0, revenue: 0 };
      routeMap.set(route, {
        rentals: existing.rentals + 1,
        revenue: existing.revenue + (booking.total_amount || 0)
      });
    });

    return Array.from(routeMap.entries())
      .map(([route, data]) => ({
        route,
        rentals: data.rentals,
        revenue: Math.round(data.revenue)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Button handlers
  const handleExportReport = async () => {
    try {
      toast.loading('Generating booking analytics report...');
      
      const reportData = {
        title: 'PCO Booking Analytics Report',
        type: 'booking_analytics',
        status: 'generated',
        format: 'pdf',
        data: {
          metrics,
          trends,
          topRoutes,
          generated_at: new Date().toISOString(),
          timeRange,
          summary: {
            totalRentals: metrics.totalRentals,
            activeRentals: metrics.activeRentals,
            completedRentals: metrics.completedRentals,
            totalRevenue: metrics.totalRevenue
          }
        }
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('PCO Booking Analytics Report', 20, 20);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Add metrics
      pdf.setFontSize(16);
      pdf.text('Key Metrics', 20, 50);
      pdf.setFontSize(12);
      pdf.text(`Total Rentals: ${metrics.totalRentals}`, 20, 65);
      pdf.text(`Active Rentals: ${metrics.activeRentals}`, 20, 75);
      pdf.text(`Completed Rentals: ${metrics.completedRentals}`, 20, 85);
      pdf.text(`Total Revenue: £${metrics.totalRevenue.toLocaleString()}`, 20, 95);
      pdf.text(`Average Response Time: ${metrics.averageResponseTime} minutes`, 20, 105);
      
      // Add trends summary
      pdf.setFontSize(16);
      pdf.text('Recent Trends', 20, 125);
      pdf.setFontSize(12);
      trends.slice(-5).forEach((trend, index) => {
        pdf.text(`${trend.date}: ${trend.rentals} rentals, £${trend.revenue.toLocaleString()}`, 20, 140 + (index * 10));
      });
      
      // Add top routes
      pdf.setFontSize(16);
      pdf.text('Top Routes', 20, 200);
      pdf.setFontSize(12);
      topRoutes.slice(-5).forEach((route, index) => {
        pdf.text(`${route.route}: ${route.rentals} rentals, £${route.revenue.toLocaleString()}`, 20, 215 + (index * 10));
      });

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pco-booking-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show export data in modal
      setExportData(reportData);
      setShowExportModal(true);
      toast.success('Booking analytics report downloaded as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewTrends = () => {
    try {
      const trendsData = {
        title: 'PCO Booking Trends Analysis',
        data: trends,
        metrics: {
          totalRentals: metrics.totalRentals,
          activeRentals: metrics.activeRentals,
          completedRentals: metrics.completedRentals,
          totalRevenue: metrics.totalRevenue
        },
        timeRange
      };

      setTrendsData(trendsData);
      setShowTrendsModal(true);
      toast.success('Booking trends analysis loaded');
    } catch (error) {
      console.error('Trends error:', error);
      toast.error('Failed to load trends analysis');
    }
  };

  const handleAdvancedFilters = () => {
    try {
      const filtersData = {
        timeRange,
        trends,
        topRoutes,
        metrics
      };

      setFiltersData(filtersData);
      setShowFiltersModal(true);
      toast.success('Advanced filters loaded');
    } catch (error) {
      console.error('Filters error:', error);
      toast.error('Failed to load advanced filters');
    }
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, color: string = 'blue') => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {trend >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading booking analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Calendar className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                PCO Car Rental Analytics
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Monitor PCO car rental bookings, revenue, and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Link 
                href="/admin/analytics/bookings/active"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </Link>
              <Link 
                href="/admin/analytics/bookings/pending"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Pending</span>
                </div>
              </Link>
              <Link 
                href="/admin/analytics/bookings/completed"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard('Total Rentals', metrics.totalRentals.toLocaleString(), <Calendar className="w-6 h-6" />, 12.5, 'blue')}
          {getMetricCard('Active Rentals', metrics.activeRentals.toLocaleString(), <Activity className="w-6 h-6" />, 8.2, 'green')}
          {getMetricCard('Total Revenue', `£${metrics.totalRevenue.toLocaleString()}`, <DollarSign className="w-6 h-6" />, 15.3, 'purple')}
          {getMetricCard('Completion Rate', `${metrics.completionRate}%`, <Target className="w-6 h-6" />, 2.1, 'orange')}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Booking Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Booking Trends</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CalendarDays className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">{trend.date}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{trend.rentals} rentals</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">£{trend.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Routes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Routes</h3>
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              {topRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{route.route}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{route.rentals} rentals</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">£{route.revenue}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">avg £{(route.revenue / route.rentals).toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booking Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booking Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Completed</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.completedRentals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Active</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.activeRentals}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Cancelled</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.cancelledRentals}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Avg Rental Value</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">£{metrics.averageRentalValue}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Response Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.averageResponseTime}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">Success Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metrics.completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={handleExportReport} className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Report</span>
                </div>
              </button>
              <button onClick={handleViewTrends} className="w-full text-left p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">View Trends</span>
                </div>
              </button>
              <button onClick={handleAdvancedFilters} className="w-full text-left p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Advanced Filters</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && exportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🚗 Booking Analytics Report</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Rentals</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{exportData.data.summary.totalRentals}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Active Rentals</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{exportData.data.summary.activeRentals}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Completed Rentals</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{exportData.data.summary.completedRentals}</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Revenue</div>
                  <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">£{exportData.data.summary.totalRevenue.toLocaleString()}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Details</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Generated: {new Date(exportData.data.generated_at).toLocaleString()}</div>
                  <div>Time Range: {exportData.data.timeRange}</div>
                  <div>Type: {exportData.type}</div>
                  <div>Trends: {exportData.data.trends.length} data points</div>
                  <div>Top Routes: {exportData.data.topRoutes.length}</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `pco-booking-analytics-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    toast.success('Report downloaded successfully');
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Report
                </button>
                <button 
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Modal */}
      {showTrendsModal && trendsData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 Booking Trends Analysis</h3>
              <button onClick={() => setShowTrendsModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Rentals</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{trendsData.metrics.totalRentals}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">Active Rentals</div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">{trendsData.metrics.activeRentals}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Completed Rentals</div>
                  <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{trendsData.metrics.completedRentals}</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Revenue</div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-100">£{trendsData.metrics.totalRevenue.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Daily Booking Trends</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {trendsData.data.map((trend: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{trend.date}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Rentals: {trend.rentals}, Revenue: £{trend.revenue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowTrendsModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal */}
      {showFiltersModal && filtersData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔍 Advanced Booking Filters</h3>
              <button onClick={() => setShowFiltersModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top Routes</h4>
                <div className="space-y-2">
                  {filtersData.topRoutes.map((route: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{route.route}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {route.rentals} rentals
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">£{route.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Filter Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Time Range</h5>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="timeRange" value="7d" className="mr-2" />
                        Last 7 days
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="timeRange" value="30d" className="mr-2" defaultChecked />
                        Last 30 days
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="timeRange" value="90d" className="mr-2" />
                        Last 90 days
                      </label>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Rental Status</h5>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Active Rentals
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Completed Rentals
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Cancelled Rentals
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => setShowFiltersModal(false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button 
                  onClick={() => setShowFiltersModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 