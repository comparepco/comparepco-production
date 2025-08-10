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
  Users, Car, MapPin, AlertTriangle, Zap, Award, User, Building, CheckCircle2, FileText
} from 'lucide-react';

interface CompletedBooking {
  id: string;
  driver_name: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  created_at: string;
  completed_at: string;
  total_amount: number;
  rental_company?: string;
  vehicle_info?: string;
  rating?: number;
  review?: string;
  duration?: number;
}

interface CompletedBookingMetrics {
  totalCompleted: number;
  totalRevenue: number;
  averageRating: number;
  averageDuration: number;
  totalReviews: number;
  revenueGrowth: number;
}

export default function AdminCompletedBookingsPage() {
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [metrics, setMetrics] = useState<CompletedBookingMetrics>({
    totalCompleted: 0,
    totalRevenue: 0,
    averageRating: 0,
    averageDuration: 0,
    totalReviews: 0,
    revenueGrowth: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [exportData, setExportData] = useState<any>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadCompletedBookings();
  }, [timeRange]);

  const loadCompletedBookings = async () => {
    try {
      setLoading(true);
      
      // Fetch completed bookings from Supabase
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          drivers:driver_id(first_name, last_name),
          vehicles:vehicle_id(make, model, year)
        `)
        .eq('status', 'completed');

      if (bookingsError) {
        console.error('Error loading completed bookings:', bookingsError);
        toast.error('Failed to load completed bookings');
        return;
      }

      console.log(`📊 Loaded ${bookingsData?.length || 0} completed bookings`);

      // Transform data for display
      const transformedBookings: CompletedBooking[] = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        driver_name: booking.drivers ? `${booking.drivers.first_name} ${booking.drivers.last_name}` : 'Unknown',
        pickup_location: booking.pickup_location || 'Unknown',
        dropoff_location: booking.dropoff_location || 'Unknown',
        status: booking.status,
        created_at: booking.created_at,
        completed_at: booking.completed_at || booking.updated_at || booking.created_at,
        total_amount: booking.total_amount || 0,
        rental_company: booking.rental_company || 'Unknown',
        vehicle_info: booking.vehicles ? `${booking.vehicles.make} ${booking.vehicles.model}` : 'Unknown',
        rating: booking.rating || 0,
        review: booking.review || 'No review provided',
        duration: booking.duration || 0
      }));

      setCompletedBookings(transformedBookings);

      // Calculate metrics
      const totalCompleted = transformedBookings.length;
      const totalRevenue = transformedBookings.reduce((sum, b) => sum + b.total_amount, 0);
      const totalReviews = transformedBookings.filter(b => b.rating).length;
      const averageRating = totalReviews > 0 
        ? transformedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / totalReviews 
        : 0;
      const averageDuration = totalCompleted > 0 
        ? transformedBookings.reduce((sum, b) => sum + (b.duration || 0), 0) / totalCompleted 
        : 0;
      
      // Calculate revenue growth (simulated)
      const revenueGrowth = 12.5; // This would be calculated from historical data

      setMetrics({
        totalCompleted,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        averageDuration: Math.round(averageDuration),
        totalReviews,
        revenueGrowth
      });

    } catch (error) {
      console.error('Error loading completed bookings:', error);
      toast.error('Failed to load completed bookings');
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleViewBooking = (bookingId: string) => {
    toast.success(`Viewing booking ${bookingId}`);
    // In a real app, this would navigate to booking details
  };

  const handleExportReport = async () => {
    try {
      toast.loading('Generating completed rentals report...');
      
      const reportData = {
        title: 'PCO Completed Rentals Report',
        type: 'completed_rentals',
        status: 'generated',
        format: 'pdf',
        data: {
          completedBookings,
          metrics,
          generated_at: new Date().toISOString(),
          summary: {
            totalCompleted: completedBookings.length,
            totalRevenue: completedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0),
            averageRating: completedBookings.reduce((sum, booking) => sum + (booking.rating || 0), 0) / completedBookings.length || 0
          }
        }
      };

      // Generate PDF
      const pdf = new jsPDF();
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('PCO Completed Rentals Report', 20, 20);
      
      // Add generation date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
      
      // Add summary
      pdf.setFontSize(16);
      pdf.text('Summary', 20, 50);
      pdf.setFontSize(12);
      pdf.text(`Total Completed: ${completedBookings.length}`, 20, 65);
      pdf.text(`Total Revenue: £${completedBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0).toLocaleString()}`, 20, 75);
      pdf.text(`Average Rating: ${(completedBookings.reduce((sum, booking) => sum + (booking.rating || 0), 0) / completedBookings.length || 0).toFixed(1)}★`, 20, 85);
      
      // Add completed rentals
      pdf.setFontSize(16);
      pdf.text('Completed Rentals', 20, 105);
      pdf.setFontSize(10);
      completedBookings.slice(0, 10).forEach((booking, index) => {
        const y = 120 + (index * 8);
        if (y < 280) { // Prevent overflow
          pdf.text(`Driver: ${booking.driver_name || 'Unknown'}`, 20, y);
          pdf.text(`Rating: ${booking.rating || 0}★`, 20, y + 4);
          pdf.text(`Amount: £${booking.total_amount || 0}`, 120, y);
        }
      });

      // Save PDF
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `completed-rentals-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Show export data in modal
      setExportData(reportData);
      setShowExportModal(true);
      toast.success('Completed rentals report downloaded as PDF');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleRefresh = () => {
    loadCompletedBookings();
    toast.success('Completed bookings refreshed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading completed bookings...</p>
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
                <CheckCircle2 className="w-8 h-8 mr-3 text-green-600 dark:text-green-400" />
                Completed PCO Car Rentals
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Review completed PCO car rental bookings and performance metrics
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
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.totalCompleted}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">£{metrics.totalRevenue}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.averageRating}/5</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                <Star className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{metrics.averageDuration} min</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Completed Bookings List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completed Bookings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {completedBookings.length} bookings completed successfully
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
                    Rental Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rating
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
                {completedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {booking.driver_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(booking.completed_at).toLocaleDateString()}
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
                      <div className="text-sm text-gray-900 dark:text-white">
                        {booking.rental_company}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.vehicle_info}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRatingStars(booking.rating || 0)}
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({booking.rating}/5)
                        </span>
                      </div>
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
                          onClick={() => handleExportReport()}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {completedBookings.length === 0 && (
            <div className="p-6 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-medium">No completed bookings</p>
                <p className="text-sm">No bookings have been completed yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => {
                  toast.success('Exporting completed rentals report...');
                  const reportData = {
                    title: 'Completed PCO Rentals Report',
                    data: completedBookings,
                    metrics,
                    generated_at: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `completed-rentals-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  toast.success('Completed rentals report downloaded');
                }}
                className="w-full text-left p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Export Report</span>
                </div>
              </button>
              <button 
                onClick={() => {
                  toast.success('Opening completion trends...');
                  const trendsWindow = window.open('', '_blank');
                  if (trendsWindow) {
                    trendsWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head><title>Completed Rental Trends</title></head>
                        <body>
                          <h1>📊 Completed PCO Rental Trends</h1>
                          <p>Total Completed: ${metrics.totalCompleted}</p>
                          <p>Total Revenue: £${metrics.totalRevenue}</p>
                          <p>Average Rating: ${metrics.averageRating}/5</p>
                          <p>Average Duration: ${metrics.averageDuration} minutes</p>
                          <p>Total Reviews: ${metrics.totalReviews}</p>
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
                        <head><title>Completed Rental Filters</title></head>
                        <body>
                          <h1>🔍 Filter Completed Rentals</h1>
                          <div>
                            <h3>Rating</h3>
                            <input type="checkbox" checked> 5 Stars<br>
                            <input type="checkbox" checked> 4 Stars<br>
                            <input type="checkbox" checked> 3 Stars
                          </div>
                          <div>
                            <h3>Duration</h3>
                            <input type="number" placeholder="Min minutes"> - <input type="number" placeholder="Max minutes">
                          </div>
                          <div>
                            <h3>Revenue Range</h3>
                            <input type="number" placeholder="Min £"> - <input type="number" placeholder="Max £">
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
      </div>
    </div>
  );
} 