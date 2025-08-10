'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  FaUser,
  FaClock,
  FaMoneyBillWave,
  FaCar,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaTachometerAlt,
  FaChartLine,
  FaExclamationTriangle,
  FaUserCheck,
  FaUserTimes,
  FaFileAlt,
  FaStar,
  FaRoute,
  FaArrowLeft,
  FaDownload,
  FaFilter
} from 'react-icons/fa';

interface DriverAnalytics {
  total_drivers: number;
  active_drivers: number;
  pending_verification: number;
  approved_drivers: number;
  rejected_drivers: number;
  total_trips: number;
  total_earnings: number;
  average_rating: number;
  documents_needing_review: number;
  expired_documents: number;
  new_applications_today: number;
  average_verification_time: number;
}

interface DriverPerformance {
  driver_id: string;
  driver_name: string;
  email: string;
  status: string;
  total_bookings: number;
  total_paid: number;
  average_rating: number;
  completed_bookings: number;
  cancelled_bookings: number;
  documents_status: string;
  join_date: string;
  last_active: string;
  verification_time?: number;
}

interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  verification_status: string;
  total_earnings: number;
  total_rides: number;
  rating: number;
  join_date: string;
  created_at: string;
  updated_at: string;
  documents: any;
}

interface Booking {
  id: string;
  driver_id: string;
  status: string;
  total_amount: number;
  driver_earnings?: number;
  driver_rating?: number;
  created_at: string;
}

export default function DriverAnalyticsPage() {
  const { user } = useAdmin();
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load drivers from Supabase
        const { data: driversData, error: driversError } = await supabase
          .from('drivers')
          .select('*')
          .order('created_at', { ascending: false });

        if (driversError) {
          console.error('Error loading drivers:', driversError);
        } else {
          setDrivers(driversData || []);
        }

        // Load bookings from Supabase
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (bookingsError) {
          console.error('Error loading bookings:', bookingsError);
        } else {
          setBookings(bookingsData || []);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading analytics data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getFilteredData = useMemo(() => {
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

    const filteredDrivers = drivers.filter(driver => {
      const driverDate = new Date(driver.created_at);
      return driverDate >= startDate;
    });

    const filteredBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return bookingDate >= startDate;
    });

    return { filteredDrivers, filteredBookings };
  }, [drivers, bookings, timeRange]);

  const analytics = useMemo((): DriverAnalytics => {
    const { filteredDrivers, filteredBookings } = getFilteredData;
    
    const statusCounts = filteredDrivers.reduce((acc, driver) => {
      acc[driver.status] = (acc[driver.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEarnings = filteredBookings
      .filter(b => ['completed', 'active'].includes(b.status))
      .reduce((sum, b) => sum + (b.driver_earnings || b.total_amount || 0), 0);

    const completedBookings = filteredBookings.filter(b => b.status === 'completed');
    const averageRating = completedBookings.length > 0 
      ? completedBookings.reduce((sum, b) => sum + (b.driver_rating || 0), 0) / completedBookings.length
      : 0;

    const documentsNeedingReview = filteredDrivers.reduce((count, driver) => {
      if (!driver.documents) return count;
      const pendingDocs = Object.values(driver.documents).filter((doc: any) => doc.status === 'pending_review');
      return count + pendingDocs.length;
    }, 0);

    const expiredDocuments = filteredDrivers.reduce((count, driver) => {
      if (!driver.documents) return count;
      const now = new Date();
      const expiredDocs = Object.values(driver.documents).filter((doc: any) => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        return expiryDate < now;
      });
      return count + expiredDocs.length;
    }, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newApplicationsToday = filteredDrivers.filter(driver => {
      const applicationDate = new Date(driver.created_at);
      return applicationDate >= today;
    }).length;

    const verificationTimes = filteredDrivers
      .filter(d => d.status === 'approved' && d.created_at && d.updated_at)
      .map(d => {
        const created = new Date(d.created_at);
        const approved = new Date(d.updated_at);
        return (approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // Days
      });

    const averageVerificationTime = verificationTimes.length > 0 
      ? verificationTimes.reduce((sum, time) => sum + time, 0) / verificationTimes.length
      : 0;

    return {
      total_drivers: filteredDrivers.length,
      active_drivers: statusCounts['active'] || 0,
      pending_verification: (statusCounts['pending'] || 0) + (statusCounts['pending_verification'] || 0) + (statusCounts['pending_review'] || 0) + (statusCounts['documents_requested'] || 0) + (statusCounts['under_verification'] || 0) + (statusCounts['incomplete'] || 0),
      approved_drivers: statusCounts['approved'] || 0,
      rejected_drivers: statusCounts['rejected'] || 0,
      total_trips: filteredBookings.length,
      total_earnings: totalEarnings,
      average_rating: Math.round(averageRating * 10) / 10,
      documents_needing_review: documentsNeedingReview,
      expired_documents: expiredDocuments,
      new_applications_today: newApplicationsToday,
      average_verification_time: Math.round(averageVerificationTime)
    };
  }, [getFilteredData]);

  const driverPerformance = useMemo((): DriverPerformance[] => {
    const { filteredDrivers, filteredBookings } = getFilteredData;
    
    return filteredDrivers.map(driver => {
      const driverBookings = filteredBookings.filter(booking => booking.driver_id === driver.id);
      const completedBookings = driverBookings.filter(booking => booking.status === 'completed');
      const cancelledBookings = driverBookings.filter(booking => ['cancelled', 'rejected'].includes(booking.status));
      const activeBookings = driverBookings.filter(booking => booking.status === 'active');
      const pendingBookings = driverBookings.filter(booking => ['pending', 'pending_partner_approval', 'pending_admin_approval'].includes(booking.status));
      
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + (booking.driver_earnings || booking.total_amount || 0), 0);
      const averageRating = completedBookings.length > 0 
        ? completedBookings.reduce((sum, booking) => sum + (booking.driver_rating || 0), 0) / completedBookings.length
        : 0;

      const documentsStatus = driver.documents ? 
        Object.values(driver.documents).every((doc: any) => doc.status === 'approved') ? 'Complete' :
        Object.values(driver.documents).some((doc: any) => doc.status === 'rejected') ? 'Issues' :
        'Pending' : 'Missing';

      let verificationTime;
      if (driver.status === 'approved' && driver.created_at && driver.updated_at) {
        const created = new Date(driver.created_at);
        const approved = new Date(driver.updated_at);
        verificationTime = Math.round((approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        driver_id: driver.id,
        driver_name: driver.full_name || driver.email || 'Unknown Driver',
        email: driver.email || '',
        status: driver.status || 'unknown',
        total_bookings: driverBookings.length,
        total_paid: totalEarnings,
        average_rating: Math.round(averageRating * 10) / 10,
        completed_bookings: completedBookings.length,
        cancelled_bookings: cancelledBookings.length,
        documents_status: documentsStatus,
        join_date: driver.created_at,
        last_active: driver.updated_at,
        verification_time: verificationTime
      };
    }).sort((a, b) => b.total_bookings - a.total_bookings);
  }, [getFilteredData]);

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
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaChartLine className="h-8 w-8 text-blue-600" />
              Driver Analytics
            </h1>
          </div>
          
          {/* Time Range Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-500" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FaDownload />
              Export Report
            </button>
          </div>
        </div>

        {/* Booking Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.total_trips}</p>
              </div>
              <FaRoute className="text-purple-500 text-xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Pending Partner</p>
                <p className="text-2xl font-bold text-orange-500">
                  {getFilteredData.filteredBookings.filter(b => b.status === 'pending_partner_approval').length}
                </p>
              </div>
              <FaHourglassHalf className="text-orange-500 text-xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Pending Admin</p>
                <p className="text-2xl font-bold text-purple-500">
                  {getFilteredData.filteredBookings.filter(b => b.status === 'pending_admin_approval').length}
                </p>
              </div>
              <FaExclamationTriangle className="text-purple-500 text-xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Active Bookings</p>
                <p className="text-2xl font-bold text-green-500">
                  {getFilteredData.filteredBookings.filter(b => b.status === 'active').length}
                </p>
              </div>
              <FaCar className="text-green-500 text-xl" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Completed</p>
                <p className="text-2xl font-bold text-blue-500">
                  {getFilteredData.filteredBookings.filter(b => b.status === 'completed').length}
                </p>
              </div>
              <FaCheckCircle className="text-blue-500 text-xl" />
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Drivers</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.total_drivers}</div>
              </div>
              <FaUser className="text-2xl text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Earnings</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">£{analytics.total_earnings.toLocaleString()}</div>
              </div>
              <FaMoneyBillWave className="text-2xl text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Average Rating</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.average_rating}</div>
              </div>
              <FaStar className="text-2xl text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Pending Verification</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.pending_verification}</div>
              </div>
              <FaHourglassHalf className="text-2xl text-orange-400" />
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Driver Status Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaUserCheck className="text-green-500" />
                  Approved Drivers
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.approved_drivers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaCar className="text-blue-500" />
                  Active Drivers
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.active_drivers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaHourglassHalf className="text-yellow-500" />
                  Pending Verification
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.pending_verification}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaUserTimes className="text-red-500" />
                  Rejected
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.rejected_drivers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <FaRoute className="text-purple-500" />
                  Total Trips
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.total_trips}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Document & Verification Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Documents Needing Review</span>
                <span className="font-semibold text-orange-500">{analytics.documents_needing_review}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Expired Documents</span>
                <span className="font-semibold text-red-500">{analytics.expired_documents}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">New Applications Today</span>
                <span className="font-semibold text-blue-500">{analytics.new_applications_today}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Avg Verification Time</span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.average_verification_time} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">Earnings per Driver</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  £{analytics.approved_drivers > 0 ? Math.round(analytics.total_earnings / analytics.approved_drivers) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Performance Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Driver Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-6 text-gray-700 dark:text-gray-300">Driver</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Total Bookings</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Completed</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Cancelled</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Total Paid</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Rating</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Documents</th>
                  <th className="text-right py-3 px-6 text-gray-700 dark:text-gray-300">Verification Time</th>
                </tr>
              </thead>
              <tbody>
                {driverPerformance.slice(0, 20).map((driver) => (
                  <tr key={driver.driver_id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-6">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{driver.driver_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{driver.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        driver.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        driver.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                        driver.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {driver.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-medium text-gray-900 dark:text-white">{driver.total_bookings}</td>
                    <td className="py-3 px-6 text-right text-green-600 dark:text-green-400">{driver.completed_bookings}</td>
                    <td className="py-3 px-6 text-right text-red-600 dark:text-red-400">{driver.cancelled_bookings}</td>
                    <td className="py-3 px-6 text-right text-gray-900 dark:text-white">£{driver.total_paid.toLocaleString()}</td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <FaStar className="text-yellow-500 text-xs" />
                        <span className="text-gray-900 dark:text-white">{driver.average_rating || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        driver.documents_status === 'Complete' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        driver.documents_status === 'Issues' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        driver.documents_status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {driver.documents_status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right text-gray-900 dark:text-white">
                      {driver.verification_time ? `${driver.verification_time}d` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {driverPerformance.length > 20 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-600">
              Showing top 20 drivers. Total: {driverPerformance.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 