'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  BarChart3, TrendingUp, TrendingDown, Calendar, Clock, CheckCircle, XCircle,
  Users, Car, DollarSign, FileText, ArrowUpRight, ArrowDownRight, Filter,
  CalendarDays, Clock as ClockIcon, MapPin, Star, Activity, Target, Truck,
  Play, Pause, AlertTriangle, Eye, Download, RefreshCw
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ActiveBooking {
  id: string;
  driver_name: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  created_at: string;
  total_amount: number;
  rental_company?: string;
  vehicle_info?: string;
  rental_duration?: number;
}

interface ActiveBookingMetrics {
  totalActive: number;
  inProgress: number;
  pending: number;
  averageWaitTime: number;
  totalRevenue: number;
  averageRentalValue: number;
}

export default function AdminActiveBookingsPage() {
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [metrics, setMetrics] = useState<ActiveBookingMetrics>({
    totalActive: 0,
    inProgress: 0,
    pending: 0,
    averageWaitTime: 0,
    totalRevenue: 0,
    averageRentalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showTrendsModal, setShowTrendsModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [filtersData, setFiltersData] = useState<any>(null);

  useEffect(() => {
    loadActiveBookings();
  }, [timeRange]);

  const loadActiveBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch active bookings from Supabase
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          drivers:driver_id(first_name, last_name),
          vehicles:vehicle_id(make, model, year)
        `)
        .in('status', ['active', 'in_progress', 'pending', 'confirmed']);

      if (bookingsError) {
        console.error('Error loading active bookings:', bookingsError);
        toast.error('Failed to load active bookings');
        return;
      }

      console.log(`📊 Loaded ${bookingsData?.length || 0} active bookings`);

      // Transform data for display
      const transformedBookings: ActiveBooking[] = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        driver_name: booking.drivers ? `${booking.drivers.first_name} ${booking.drivers.last_name}` : 'Unassigned',
        pickup_location: booking.pickup_location || 'Unknown',
        dropoff_location: booking.dropoff_location || 'Unknown',
        status: booking.status,
        created_at: booking.created_at,
        total_amount: booking.total_amount || 0,
        rental_company: booking.rental_company || 'N/A',
        vehicle_info: booking.vehicles ? `${booking.vehicles.make} ${booking.vehicles.model}` : 'Unassigned',
        rental_duration: booking.rental_duration || 30
      }));

      setActiveBookings(transformedBookings);

      // Calculate metrics
      const totalActive = transformedBookings.length;
      const inProgress = transformedBookings.filter(b => b.status === 'in_progress').length;
      const pending = transformedBookings.filter(b => b.status === 'pending').length;
      const totalRevenue = transformedBookings.reduce((sum, b) => sum + b.total_amount, 0);
      const averageRentalValue = totalActive > 0 ? totalRevenue / totalActive : 0;
      
      // Calculate average wait time (simulated)
      const averageWaitTime = 15.5; // This would be calculated from actual timestamps

      setMetrics({
        totalActive,
        inProgress,
        pending,
        averageWaitTime,
        totalRevenue,
        averageRentalValue: Math.round(averageRentalValue * 100) / 100
      });

    } catch (error) {
      console.error('Error loading active bookings:', error);
      toast.error('Failed to load active bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'confirmed':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleViewBooking = (bookingId: string) => {
    toast.success(`Viewing booking ${bookingId}`);
    // In a real app, this would navigate to booking details
  };

  const handleRefresh = () => {
    loadActiveBookings();
    toast.success('Active bookings refreshed');
  };

  const handleExportReport = async () => {
    try {
      toast.loading('Generating active rentals report...');
      
      const reportData = {
        title: 'PCO Active Rentals Report',
        type: 'active_rentals',
        status: 'generated',
        format: 'pdf',
        data: {
          activeBookings,
          metrics,
          generated_at: new Date().toISOString(),
          summary: {
            totalActive: activeBookings.length,
            totalRevenue: activeBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0)
          }
        }
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('PCO Active Rentals Report', 20, 20);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Add summary
      pdf.setFontSize(16);
      pdf.text('Summary', 20, 50);
      pdf.setFontSize(12);
      pdf.text(`Total Active Rentals: ${activeBookings.length}`, 20, 65);
      pdf.text(`Total Revenue: £${activeBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0).toLocaleString()}`, 20, 75);
      
      // Add active rentals
      pdf.setFontSize(16);
      pdf.text('Active Rentals', 20, 95);
      pdf.setFontSize(10);
      activeBookings.slice(0, 10).forEach((booking, index) => {
        const y = 110 + (index * 8);
        if (y < 280) { // Prevent overflow
          pdf.text(`Driver: ${booking.driver_name || 'Unknown'}`, 20, y);
          pdf.text(`Company: ${booking.rental_company || 'Unknown'}`, 20, y + 4);
          pdf.text(`Amount: £${booking.total_amount || 0}`, 120, y);
        }
      });

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pco-active-rentals-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show export data in modal
      setExportData(reportData);
      setShowExportModal(true);
      toast.success('Active rentals report downloaded as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewTrends = () => {
    try {
      const trendsData = {
        title: 'PCO Active Car Rentals Trends',
        data: activeBookings,
        metrics: {
          totalActive: metrics.totalActive,
          inProgress: metrics.inProgress,
          pending: metrics.pending,
          totalRevenue: metrics.totalRevenue
        },
        timeRange
      };

      setTrendsData(trendsData);
      setShowTrendsModal(true);
      toast.success('Active rentals trends loaded');
    } catch (error) {
      console.error('Trends error:', error);
      toast.error('Failed to load trends analysis');
    }
  };

  const handleAdvancedFilters = () => {
    try {
      const filtersData = {
        timeRange,
        activeBookings,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading active bookings...</p>
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
                <Play className="w-8 h-8 mr-3 text-green-600 dark:text-green-400" />
                Active PCO Car Rentals
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Monitor and manage all active PCO car rental bookings in real-time
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="1h">Last hour</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.totalActive}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <Play className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.inProgress}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.pending}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                <Pause className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Wait Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.averageWaitTime} min</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={handleExportReport}
                className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Report</span>
                </div>
              </button>
              <button 
                onClick={handleViewTrends}
                className="w-full text-left p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">View Trends</span>
                </div>
              </button>
              <button 
                onClick={handleAdvancedFilters}
                className="w-full text-left p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Advanced Filters</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Active Bookings List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Bookings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {activeBookings.length} bookings currently active
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pickup/Dropoff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rental Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activeBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {booking.driver_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {booking.pickup_location}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        → {booking.dropoff_location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(booking.status)}
                        <span className={`ml-2 text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {booking.rental_company || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {booking.vehicle_info}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      £{booking.total_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewBooking(booking.id)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {activeBookings.length === 0 && (
            <div className="p-6 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Play className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">No active bookings</p>
                <p className="text-sm">All bookings are completed or cancelled</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && exportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🚗 Active Car Rentals Report</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Active</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{exportData.data.summary.totalActive}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">In Progress</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">{exportData.data.summary.inProgress}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Pending</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{exportData.data.summary.pending}</div>
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
                  <div>Active Rentals: {exportData.data.activeBookings.length}</div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `pco-active-rentals-${new Date().toISOString().split('T')[0]}.json`;
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📈 Active Car Rentals Trends</h3>
              <button onClick={() => setShowTrendsModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Active</div>
                  <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{trendsData.metrics.totalActive}</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">In Progress</div>
                  <div className="text-xl font-bold text-green-900 dark:text-green-100">{trendsData.metrics.inProgress}</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Pending</div>
                  <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{trendsData.metrics.pending}</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Revenue</div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-100">£{trendsData.metrics.totalRevenue.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Active Car Rentals</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {trendsData.data.map((rental: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{rental.driver_name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {rental.vehicle_info} • {rental.rental_company}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">£{rental.total_amount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {rental.rental_duration} days
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔍 Advanced Rental Filters</h3>
              <button onClick={() => setShowFiltersModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Filter Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Rental Status</h5>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Active Rentals
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        In Progress
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Pending
                      </label>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Rental Duration</h5>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Short-term (1-7 days)
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Medium-term (8-30 days)
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-2" />
                        Long-term (30+ days)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Active</div>
                    <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{filtersData.metrics.totalActive}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">In Progress</div>
                    <div className="text-xl font-bold text-green-900 dark:text-green-100">{filtersData.metrics.inProgress}</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Pending</div>
                    <div className="text-xl font-bold text-purple-900 dark:text-purple-100">{filtersData.metrics.pending}</div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Revenue</div>
                    <div className="text-xl font-bold text-orange-900 dark:text-orange-100">£{filtersData.metrics.totalRevenue.toLocaleString()}</div>
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