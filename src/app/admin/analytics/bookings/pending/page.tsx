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
  Users, Car, MapPin, AlertTriangle, Zap, Award, User, Building, AlertCircle, FileText
} from 'lucide-react';

interface PendingBooking {
  id: string;
  driver_name: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  created_at: string;
  total_amount: number;
  estimated_duration?: number;
  priority?: string;
  driver_phone?: string;
  special_requests?: string;
  rental_company?: string;
}

interface PendingBookingMetrics {
  totalPending: number;
  highPriority: number;
  averageWaitTime: number;
  totalRevenue: number;
  averageBookingValue: number;
  oldestBooking: string;
}

export default function AdminPendingBookingsPage() {
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [metrics, setMetrics] = useState<PendingBookingMetrics>({
    totalPending: 0,
    highPriority: 0,
    averageWaitTime: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    oldestBooking: ''
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [exportData, setExportData] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadPendingBookings();
  }, [timeRange]);

  const loadPendingBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch pending bookings from Supabase
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['pending', 'confirmed', 'awaiting_driver']);

      if (bookingsError) {
        console.error('Error loading pending bookings:', bookingsError);
        toast.error('Failed to load pending bookings');
        return;
      }

      console.log(`📊 Loaded ${bookingsData?.length || 0} pending bookings`);

      // Transform data for display
      const transformedBookings: PendingBooking[] = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        driver_name: booking.driver_name || `Driver ${booking.id}`,
        pickup_location: booking.pickup_location || 'Unknown',
        dropoff_location: booking.dropoff_location || 'Unknown',
        status: booking.status,
        created_at: booking.created_at,
        total_amount: booking.total_amount || 0,
        estimated_duration: booking.estimated_duration || 30,
        priority: booking.priority || 'normal',
        driver_phone: booking.driver_phone || 'N/A',
        special_requests: booking.special_requests || 'None',
        rental_company: booking.rental_company || 'N/A'
      }));

      setPendingBookings(transformedBookings);

      // Calculate metrics
      const totalPending = transformedBookings.length;
      const highPriority = transformedBookings.filter(b => b.priority === 'high').length;
      const totalRevenue = transformedBookings.reduce((sum, b) => sum + b.total_amount, 0);
      const averageBookingValue = totalPending > 0 ? totalRevenue / totalPending : 0;
      
      // Calculate average wait time and oldest booking
      const now = new Date();
      const waitTimes = transformedBookings.map(b => {
        const created = new Date(b.created_at);
        return (now.getTime() - created.getTime()) / (1000 * 60); // minutes
      });
      const averageWaitTime = waitTimes.length > 0 ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length : 0;
      
      const oldestBooking = transformedBookings.length > 0 
        ? new Date(Math.min(...transformedBookings.map(b => new Date(b.created_at).getTime()))).toLocaleDateString()
        : 'N/A';

      setMetrics({
        totalPending,
        highPriority,
        averageWaitTime: Math.round(averageWaitTime),
        totalRevenue,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100,
        oldestBooking
      });

    } catch (error) {
      console.error('Error loading pending bookings:', error);
      toast.error('Failed to load pending bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'awaiting_driver':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'confirmed':
        return 'text-green-600 dark:text-green-400';
      case 'awaiting_driver':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleApproveBooking = (bookingId: string) => {
    toast.success(`Booking ${bookingId} approved`);
    // In a real app, this would update the booking status
  };

  const handleRejectBooking = (bookingId: string) => {
    toast.error(`Booking ${bookingId} rejected`);
    // In a real app, this would update the booking status
  };

  const handleViewBooking = (bookingId: string) => {
    toast.success(`Viewing booking ${bookingId}`);
    // In a real app, this would navigate to booking details
  };

  const handleRefresh = () => {
    loadPendingBookings();
    toast.success('Pending bookings refreshed');
  };

  const handleExportReport = async () => {
    try {
      toast.loading('Generating pending rentals report...');
      
      const reportData = {
        title: 'PCO Pending Rentals Report',
        type: 'pending_rentals',
        status: 'generated',
        format: 'pdf',
        data: {
          pendingBookings,
          metrics,
          generated_at: new Date().toISOString(),
          summary: {
            totalPending: pendingBookings.length,
            highPriority: pendingBookings.filter(b => b.priority === 'high').length,
            mediumPriority: pendingBookings.filter(b => b.priority === 'medium').length,
            lowPriority: pendingBookings.filter(b => b.priority === 'low').length
          }
        }
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('PCO Pending Rentals Report', 20, 20);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Add summary
      pdf.setFontSize(16);
      pdf.text('Summary', 20, 50);
      pdf.setFontSize(12);
      pdf.text(`Total Pending: ${pendingBookings.length}`, 20, 65);
      pdf.text(`High Priority: ${pendingBookings.filter(b => b.priority === 'high').length}`, 20, 75);
      pdf.text(`Medium Priority: ${pendingBookings.filter(b => b.priority === 'medium').length}`, 20, 85);
      pdf.text(`Low Priority: ${pendingBookings.filter(b => b.priority === 'low').length}`, 20, 95);
      
      // Add pending rentals
      pdf.setFontSize(16);
      pdf.text('Pending Rentals', 20, 115);
      pdf.setFontSize(10);
      pendingBookings.slice(0, 10).forEach((booking, index) => {
        const y = 130 + (index * 8);
        if (y < 280) { // Prevent overflow
          pdf.text(`Driver: ${booking.driver_name || 'Unknown'}`, 20, y);
          pdf.text(`Priority: ${booking.priority}`, 20, y + 4);
          pdf.text(`Amount: £${booking.total_amount || 0}`, 120, y);
        }
      });

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pending-rentals-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show export data in modal
      setExportData(reportData);
      setShowExportModal(true);
      toast.success('Pending rentals report downloaded as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pending bookings...</p>
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
                <AlertCircle className="w-8 h-8 mr-3 text-yellow-600 dark:text-yellow-400" />
                Pending PCO Car Rentals
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Review and manage pending PCO car rental requests
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
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.totalPending}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Priority</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.highPriority}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Wait Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.averageWaitTime} min</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">£{metrics.totalRevenue}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <DollarSign className="w-6 h-6" />
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
                onClick={() => {
                  toast.success('Opening pending trends...');
                  const trendsWindow = window.open('', '_blank');
                  if (trendsWindow) {
                    trendsWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head><title>Pending Rental Trends</title></head>
                        <body>
                          <h1>📊 Pending PCO Rental Trends</h1>
                          <p>Total Pending: ${metrics.totalPending}</p>
                          <p>High Priority: ${metrics.highPriority}</p>
                          <p>Average Wait Time: ${metrics.averageWaitTime} minutes</p>
                          <p>Total Revenue: £${metrics.totalRevenue}</p>
                        </body>
                      </html>
                    `);
                    trendsWindow.document.close();
                  }
                }}
                className="w-full text-left p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">View Trends</span>
                </div>
              </button>
              <button 
                onClick={() => {
                  toast.success('Opening advanced filters...');
                  const filterWindow = window.open('', '_blank');
                  if (filterWindow) {
                    filterWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head><title>Pending Rental Filters</title></head>
                        <body>
                          <h1>🔍 Filter Pending Rentals</h1>
                          <div>
                            <h3>Priority</h3>
                            <input type="checkbox" checked> High Priority<br>
                            <input type="checkbox" checked> Normal Priority<br>
                            <input type="checkbox" checked> Low Priority
                          </div>
                          <div>
                            <h3>Wait Time</h3>
                            <input type="number" placeholder="Min minutes"> - <input type="number" placeholder="Max minutes">
                          </div>
                          <button onclick="window.close()">Apply Filters</button>
                        </body>
                      </html>
                    `);
                    filterWindow.document.close();
                  }
                }}
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

        {/* Pending Bookings List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Bookings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pendingBookings.length} bookings awaiting approval
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
                    Priority
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
                {pendingBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {booking.driver_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.driver_phone}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(booking.priority || 'normal')}`}>
                        {booking.priority || 'normal'}
                      </span>
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
                        <button
                          onClick={() => handleApproveBooking(booking.id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {pendingBookings.length === 0 && (
            <div className="p-6 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">No pending bookings</p>
                <p className="text-sm">All bookings have been processed</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 