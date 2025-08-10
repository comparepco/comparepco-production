'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaTruck,
  FaChartBar,
  FaDollarSign,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaWrench,
  FaArrowLeft,
  FaChartLine,
  FaUsers,
  FaCalendar
} from 'react-icons/fa';

export default function FleetDashboard() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [fleetStats, setFleetStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    totalRevenue: 0,
    averageRate: 0,
    utilizationRate: 0,
    maintenanceDue: 0,
    pendingVehicles: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && authUser) {
      loadFleetData();
    }
  }, [authUser, authLoading, router]);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      
      // Load all data concurrently from Supabase
      const [vehiclesResult, bookingsResult] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('bookings').select('*')
      ]);

      if (vehiclesResult.error) {
        console.error('Error loading vehicles:', vehiclesResult.error);
        toast.error('Failed to load vehicles');
        return;
      }

      if (bookingsResult.error) {
        console.error('Error loading bookings:', bookingsResult.error);
        toast.error('Failed to load bookings');
        return;
      }

      const vehicles = vehiclesResult.data || [];
      const bookings = bookingsResult.data || [];

      // Calculate fleet statistics
      const totalVehicles = vehicles.length;
      const availableVehicles = vehicles.filter((v: any) => v.is_available).length;
      const rentedVehicles = vehicles.filter((v: any) => !v.is_available).length;
      const maintenanceVehicles = vehicles.filter((v: any) => !v.is_active).length;
      const approvedVehicles = vehicles.filter((v: any) => v.is_approved).length;
      const pendingVehicles = vehicles.filter((v: any) => !v.is_approved).length;

      // Calculate revenue from completed bookings
      const completedBookings = bookings.filter((b: any) => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum: number, booking: any) => sum + (booking.total_amount || 0), 0);

      // Calculate average daily rate
      const averageRate = vehicles.length > 0 
        ? vehicles.reduce((sum: number, v: any) => sum + (v.price_per_day || 0), 0) / vehicles.length 
        : 0;

      // Calculate utilization rate
      const utilizationRate = totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0;

      // Count vehicles due for maintenance
      const now = new Date();
      const maintenanceDue = vehicles.filter((v: any) => {
        if (!v.next_service) return false;
        const serviceDate = new Date(v.next_service);
        return serviceDate <= now;
      }).length;

      setFleetStats({
        totalVehicles,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
        totalRevenue,
        averageRate,
        utilizationRate,
        maintenanceDue,
        pendingVehicles
      });

    } catch (error) {
      console.error('Error loading fleet data:', error);
      toast.error('Failed to load fleet data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading fleet dashboard...</p>
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
              <FaTruck className="h-8 w-8 text-blue-600" />
              Fleet Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your fleet performance, vehicle status, and key metrics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTruck className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fleetStats.totalVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fleetStats.availableVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Currently Rented</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fleetStats.rentedVehicles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{fleetStats.pendingVehicles}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaChartLine className="h-5 w-5 text-blue-600" />
              Fleet Utilization
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Utilization Rate</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{fleetStats.utilizationRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${fleetStats.utilizationRate}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {fleetStats.rentedVehicles} of {fleetStats.totalVehicles} vehicles currently rented
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaDollarSign className="h-5 w-5 text-green-600" />
              Average Daily Rate
            </h3>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(fleetStats.averageRate)}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Across all vehicles</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaWrench className="h-5 w-5 text-yellow-600" />
              Maintenance Alerts
            </h3>
            <div className="flex items-center">
              {fleetStats.maintenanceDue > 0 ? (
                <FaExclamationTriangle className="h-8 w-8 text-yellow-500 mr-3" />
              ) : (
                <FaCheckCircle className="h-8 w-8 text-green-500 mr-3" />
              )}
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{fleetStats.maintenanceDue}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {fleetStats.maintenanceDue > 0 ? 'Vehicles need attention' : 'All vehicles up to date'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaUsers className="h-5 w-5 text-blue-600" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/fleet/availability')}
              className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <FaTruck className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-blue-900 dark:text-blue-200">Vehicle Availability</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">Check vehicle status and bookings</p>
            </button>
            
            <button
              onClick={() => router.push('/admin/fleet/claims')}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <FaExclamationTriangle className="h-6 w-6 text-red-600 mb-2" />
              <h4 className="font-medium text-red-900 dark:text-red-200">Claims Management</h4>
              <p className="text-sm text-red-600 dark:text-red-400">Review and manage vehicle claims</p>
            </button>
            
            <button
              onClick={() => router.push('/admin/fleet/maintenance')}
              className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <FaWrench className="h-6 w-6 text-yellow-600 mb-2" />
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200">Maintenance</h4>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Schedule and track maintenance</p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaCalendar className="h-5 w-5 text-gray-600" />
            Recent Activity
          </h3>
          <div className="text-center py-8">
            <FaChartBar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Activity tracking will be implemented here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 