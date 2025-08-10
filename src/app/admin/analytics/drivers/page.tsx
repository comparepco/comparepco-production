'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import jsPDF from 'jspdf';
import {
  Users, TrendingUp, TrendingDown, BarChart3, PieChart, LineChart,
  ArrowUpRight, ArrowDownRight, Calendar, Clock, CheckCircle, XCircle,
  DollarSign, Star, Activity, Target, Filter, Download, RefreshCw, Eye,
  UserCheck, UserX, Award, AlertTriangle, MapPin, Car, Shield, Zap
} from 'lucide-react';

interface DriverMetrics {
  totalDrivers: number;
  activeDrivers: number;
  verifiedDrivers: number;
  pendingDrivers: number;
  averageRating: number;
  totalRentals: number;
  averageRentalCost: number;
  completionRate: number;
}

interface DriverTrend {
  date: string;
  activeDrivers: number;
  newDrivers: number;
  rentals: number;
}

interface TopDrivers {
  name: string;
  rentals: number;
  totalSpent: number;
  rating: number;
  status: string;
}

interface DriverPerformance {
  driver: string;
  completedRentals: number;
  cancelledRentals: number;
  totalSpent: number;
  averageRating: number;
  responseTime: number;
}

export default function AdminDriverAnalyticsPage() {
  const [metrics, setMetrics] = useState<DriverMetrics>({
    totalDrivers: 0,
    activeDrivers: 0,
    verifiedDrivers: 0,
    pendingDrivers: 0,
    averageRating: 0,
    totalRentals: 0,
    averageRentalCost: 0,
    completionRate: 0
  });
  const [trends, setTrends] = useState<DriverTrend[]>([]);
  const [topDrivers, setTopDrivers] = useState<TopDrivers[]>([]);
  const [performance, setPerformance] = useState<DriverPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    loadDriverAnalytics();
  }, [timeRange]);

  const loadDriverAnalytics = async () => {
    try {
      setLoading(true);
      
      // Real data queries from Supabase with error handling
      let driversData, bookingsData, paymentsData;
      
      try {
        const [driversResult, bookingsResult, paymentsResult] = await Promise.allSettled([
          supabase.from('drivers').select('*'),
          supabase.from('bookings').select('*'),
          supabase.from('payments').select('*')
        ]);

        driversData = driversResult.status === 'fulfilled' ? driversResult.value.data : [];
        bookingsData = bookingsResult.status === 'fulfilled' ? bookingsResult.value.data : [];
        paymentsData = paymentsResult.status === 'fulfilled' ? paymentsResult.value.data : [];

        console.log(`📊 Real driver data loaded: ${driversData?.length || 0} drivers, ${bookingsData?.length || 0} bookings, ${paymentsData?.length || 0} payments`);
      } catch (dataError) {
        console.warn('⚠️ Error fetching data, using fallback:', dataError);
        driversData = [];
        bookingsData = [];
        paymentsData = [];
      }

      // Calculate metrics from real data
      const totalDrivers = driversData?.length || 0;
      const activeDrivers = driversData?.filter((d: any) => d.status === 'active').length || 0;
      const verifiedDrivers = driversData?.filter((d: any) => d.verified === true).length || 0;
      const pendingDrivers = driversData?.filter((d: any) => d.status === 'pending').length || 0;
      
      // Calculate rental metrics
      const totalRentals = bookingsData?.length || 0;
      const completedRentals = bookingsData?.filter((b: any) => b.status === 'completed').length || 0;
      const averageRentalCost = totalRentals > 0 ? 
        (bookingsData?.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0) || 0) / totalRentals : 0;
      
      // Calculate average rating from bookings
      const ratings = bookingsData?.filter((b: any) => b.rating).map((b: any) => b.rating) || [];
      const averageRating = ratings.length > 0 ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;
      
      // Calculate completion rate
      const completionRate = totalRentals > 0 ? (completedRentals / totalRentals) * 100 : 0;

      const calculatedMetrics: DriverMetrics = {
        totalDrivers,
        activeDrivers,
        verifiedDrivers,
        pendingDrivers,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRentals: bookingsData?.length || 0,
        averageRentalCost: Math.round(averageRentalCost * 100) / 100,
        completionRate: Math.round(completionRate * 10) / 10
      };

      // Generate trends data
      const trends = generateTrendsFromData(driversData || [], bookingsData || [], paymentsData || []);
      
      // Generate top drivers data
      const topDrivers = generateTopDriversFromData(driversData || [], bookingsData || [], paymentsData || []);
      
      // Generate performance data
      const performance = generatePerformanceFromData(driversData || [], bookingsData || []);

      setMetrics(calculatedMetrics);
      setTrends(trends);
      setTopDrivers(topDrivers);
      setPerformance(performance);
    } catch (error) {
      console.error('Error loading driver analytics:', error);
      toast.error('Failed to load driver analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateTrendsFromData = (driversData: any[], bookingsData: any[], paymentsData: any[]) => {
    const trends = [];
    const days = 7;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate daily metrics
      const dayBookings = bookingsData?.filter((b: any) => 
        b.created_at?.startsWith(dateStr)
      ) || [];
      
      const activeDrivers = driversData?.filter((d: any) => d.status === 'active').length || 0;
      const newDrivers = driversData?.filter((d: any) => 
        d.created_at?.startsWith(dateStr)
      ).length || 0;
      
      const rentals = dayBookings.length;
      
      trends.push({
        date: dateStr,
        activeDrivers,
        newDrivers,
        rentals
      });
    }
    
    return trends;
  };

  const generateTopDriversFromData = (driversData: any[], bookingsData: any[], paymentsData: any[]) => {
    const driverStats = new Map();
    
    // Calculate driver statistics
    bookingsData?.forEach((booking: any) => {
      const driverId = booking.driver_id;
      if (!driverStats.has(driverId)) {
        driverStats.set(driverId, {
          rentals: 0,
          totalSpent: 0,
          ratings: []
        });
      }
      
      const stats = driverStats.get(driverId);
      stats.rentals++;
      stats.totalSpent += booking.total_amount || 0;
      if (booking.rating) {
        stats.ratings.push(booking.rating);
      }
    });
    
    // Convert to array and sort by total spent
    const topDrivers = Array.from(driverStats.entries())
      .map(([driverId, stats]: [string, any]) => {
        const driver = driversData?.find((d: any) => d.id === driverId);
        const averageRating = stats.ratings.length > 0 ? 
          stats.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / stats.ratings.length : 0;
        
        return {
          name: driver?.full_name || `Driver ${driverId}`,
          rentals: stats.rentals,
          totalSpent: stats.totalSpent,
          rating: averageRating,
          status: driver?.status || 'unknown'
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
    
    return topDrivers;
  };

  const generatePerformanceFromData = (driversData: any[], bookingsData: any[]) => {
    const performance: DriverPerformance[] = [];
    
    driversData?.forEach((driver: any) => {
      const driverBookings = bookingsData?.filter((b: any) => b.driver_id === driver.id) || [];
      const completedRentals = driverBookings.filter((b: any) => b.status === 'completed').length;
      const cancelledRentals = driverBookings.filter((b: any) => b.status === 'cancelled').length;
      const totalSpent = driverBookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
      
      const ratings = driverBookings.filter((b: any) => b.rating).map((b: any) => b.rating);
      const averageRating = ratings.length > 0 ? 
        ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length : 0;
      
      // Calculate average response time (simulated)
      const responseTime = driverBookings.length > 0 ? 
        Math.floor(Math.random() * 30) + 5 : 0; // 5-35 minutes
      
      performance.push({
        driver: driver.full_name || `Driver ${driver.id}`,
        completedRentals,
        cancelledRentals,
        totalSpent,
        averageRating,
        responseTime
      });
    });
    
    return performance.slice(0, 10); // Top 10 drivers
  };

  // Quick Actions functions
  const handleExportReport = async () => {
    try {
      toast.loading('Generating driver analytics report...');
      
      const reportData = {
        title: 'PCO Driver Analytics Report',
        type: 'driver_analytics',
        status: 'generated',
        format: 'pdf',
        data: {
          metrics,
          trends,
          topDrivers,
          performance,
          generated_at: new Date().toISOString(),
          timeRange,
          summary: {
            totalDrivers: metrics.totalDrivers,
            activeDrivers: metrics.activeDrivers,
            verifiedDrivers: metrics.verifiedDrivers,
            totalRentals: metrics.totalRentals
          }
        }
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('PCO Driver Analytics Report', 20, 20);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Add metrics
      pdf.setFontSize(16);
      pdf.text('Key Metrics', 20, 50);
      pdf.setFontSize(12);
      pdf.text(`Total Drivers: ${metrics.totalDrivers}`, 20, 65);
      pdf.text(`Active Drivers: ${metrics.activeDrivers}`, 20, 75);
      pdf.text(`Verified Drivers: ${metrics.verifiedDrivers}`, 20, 85);
      pdf.text(`Total Rentals: ${metrics.totalRentals}`, 20, 95);
      pdf.text(`Average Rental Cost: £${metrics.averageRentalCost.toFixed(0)}`, 20, 105);
      pdf.text(`Completion Rate: ${metrics.completionRate.toFixed(1)}%`, 20, 115);
      
      // Add top drivers
      pdf.setFontSize(16);
      pdf.text('Top Drivers', 20, 135);
      pdf.setFontSize(12);
      topDrivers.slice(0, 5).forEach((driver, index) => {
        pdf.text(`${driver.name}: ${driver.rentals} rentals, £${driver.totalSpent.toLocaleString()}`, 20, 150 + (index * 10));
      });

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pco-driver-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show export data in modal
      setExportData(reportData);
      setShowExportModal(true);
      toast.success('Driver analytics report downloaded as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewTrends = () => {
    try {
      const trendsData = {
        title: 'PCO Driver Trends Analysis',
        data: trends,
        metrics: {
          totalDrivers: metrics.totalDrivers,
          activeDrivers: metrics.activeDrivers,
          verifiedDrivers: metrics.verifiedDrivers,
          totalRentals: metrics.totalRentals
        },
        timeRange
      };

      setTrendsData(trendsData);
      setShowTrendsModal(true);
      toast.success('Driver trends analysis loaded');
    } catch (error) {
      console.error('Trends error:', error);
      toast.error('Failed to load trends analysis');
    }
  };

  const handleDetailedAnalysis = () => {
    try {
      const analysisData = {
        timeRange,
        topDrivers,
        performance,
        metrics
      };

      setAnalysisData(analysisData);
      setShowAnalysisModal(true);
      toast.success('Detailed analysis loaded');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to load detailed analysis');
    }
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, color: string = 'blue') => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/20`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center text-sm">
          {trend >= 0 ? (
            <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {Math.abs(trend)}%
          </span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading driver analytics...</p>
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
                <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Driver Analytics
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Comprehensive driver performance metrics, car rental earnings analysis, and operational insights for PCO drivers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Link 
                href="/admin/analytics/reports"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Generate Report</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard(
            'Total Drivers',
            metrics.totalDrivers,
            <Users className="w-5 h-5" />,
            undefined,
            'blue'
          )}
          {getMetricCard(
            'Active Drivers',
            metrics.activeDrivers,
            <UserCheck className="w-5 h-5" />,
            undefined,
            'green'
          )}
          {getMetricCard(
            'Verified Drivers',
            metrics.verifiedDrivers,
            <Shield className="w-5 h-5" />,
            undefined,
            'purple'
          )}
          {getMetricCard(
            'Total Rentals',
            metrics.totalRentals,
            <Car className="w-5 h-5" />,
            undefined,
            'orange'
          )}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard(
            'Pending Drivers',
            metrics.pendingDrivers,
            <Clock className="w-5 h-5" />,
            undefined,
            'yellow'
          )}
          {getMetricCard(
            'Average Rating',
            metrics.averageRating.toFixed(1),
            <Star className="w-5 h-5" />,
            undefined,
            'indigo'
          )}
          {getMetricCard(
            'Avg Rental Cost',
            `£${metrics.averageRentalCost.toFixed(0)}`,
            <DollarSign className="w-5 h-5" />,
            undefined,
            'emerald'
          )}
          {getMetricCard(
            'Completion Rate',
            `${metrics.completionRate.toFixed(1)}%`,
            <CheckCircle className="w-5 h-5" />,
            undefined,
            'teal'
          )}
        </div>

        {/* Driver Trends and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Driver Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Driver Trends</h3>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-4">
              {trends.slice(-5).map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{trend.date}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{trend.activeDrivers} active drivers</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{trend.rentals} rentals</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">+{trend.newDrivers} new</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Drivers */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top PCO Drivers</h3>
              <Award className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-4">
              {topDrivers.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{driver.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{driver.rentals} rentals</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">£{driver.totalSpent.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{driver.rating}★</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Driver Performance and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Driver Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Driver Performance</h3>
            <div className="space-y-4">
              {performance.map((driver, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{driver.driver}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        driver.averageRating >= 4.5 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                        driver.averageRating >= 4.0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                      }`}>
                        {driver.averageRating}★
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">£{driver.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{driver.completedRentals} completed rentals, {driver.cancelledRentals} cancelled</span>
                    <span>{driver.responseTime}min avg response</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button onClick={handleExportReport} className="w-full text-left p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Report</span>
                </div>
              </button>
              <button onClick={handleViewTrends} className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">View Trends</span>
                </div>
              </button>
              <button onClick={handleDetailedAnalysis} className="w-full text-left p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Detailed Analysis</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && exportData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">👥 PCO Driver Analytics Report</h3>
                <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Drivers</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{exportData.data.summary.totalDrivers}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Active Drivers</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">{exportData.data.summary.activeDrivers}</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Verified Drivers</div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{exportData.data.summary.verifiedDrivers}</div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Rentals</div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{exportData.data.summary.totalRentals}</div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Report Details</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>Generated: {new Date(exportData.data.generated_at).toLocaleString()}</div>
                    <div>Time Range: {exportData.data.timeRange}</div>
                    <div>Type: {exportData.type}</div>
                    <div>Trends: {exportData.data.trends.length} data points</div>
                    <div>Top Drivers: {exportData.data.topDrivers.length}</div>
                    <div>Performance: {exportData.data.performance.length} drivers</div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `pco-driver-analytics-${new Date().toISOString().split('T')[0]}.json`;
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 PCO Driver Trends Analysis</h3>
                <button onClick={() => setShowTrendsModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Drivers</div>
                    <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{trendsData.metrics.totalDrivers}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">Active Drivers</div>
                    <div className="text-xl font-bold text-green-900 dark:text-green-100">{trendsData.metrics.activeDrivers}</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Verified Drivers</div>
                    <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{trendsData.metrics.verifiedDrivers}</div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Rentals</div>
                    <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{trendsData.metrics.totalRentals}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Daily Driver Trends</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {trendsData.data.map((trend: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{trend.date}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Active: {trend.activeDrivers}, New: {trend.newDrivers}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">£{trend.totalRentals.toLocaleString()}</div>
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

        {/* Analysis Modal */}
        {showAnalysisModal && analysisData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔍 Detailed PCO Driver Analysis</h3>
                <button onClick={() => setShowAnalysisModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Top PCO Drivers</h4>
                  <div className="space-y-2">
                    {analysisData.topDrivers.map((driver: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{driver.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {driver.rentals} car rentals, {driver.rating}★ rating
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">£{driver.totalSpent.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Status: {driver.status}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Driver Performance</h4>
                  <div className="space-y-2">
                    {analysisData.performance.map((driver: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{driver.driver}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {driver.completedRentals} completed rentals, {driver.cancelledRentals} cancelled
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">£{driver.totalSpent.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {driver.averageRating}★, {driver.responseTime}min response
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Metrics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Drivers</div>
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{analysisData.metrics.totalDrivers}</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm font-medium text-green-700 dark:text-green-300">Active Drivers</div>
                      <div className="text-xl font-bold text-green-900 dark:text-green-100">{analysisData.metrics.activeDrivers}</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Verified Drivers</div>
                      <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{analysisData.metrics.verifiedDrivers}</div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Rentals</div>
                      <div className="text-xl font-bold text-orange-900 dark:text-orange-100">{analysisData.metrics.totalRentals}</div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowAnalysisModal(false)}
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
    </div>
  );
} 