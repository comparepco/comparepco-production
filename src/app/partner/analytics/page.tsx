'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaChartLine, FaSearch, FaFilter, FaEye, FaHistory, 
  FaMoneyBillWave, FaCar, FaStar, FaDownload, FaCalendarAlt,
  FaUserCircle, FaFileAlt, FaExclamationTriangle, FaThumbsUp,
  FaThumbsDown, FaComments, FaPhone, FaEnvelope, FaPlus,
  FaUpload, FaSignature, FaUndo, FaBolt, FaTools, FaShieldAlt,
  FaChevronRight, FaBuilding, FaUser, FaEdit, FaTrash, FaBell,
  FaExchangeAlt, FaPaperPlane, FaCheck, FaInfoCircle, FaTh,
  FaList, FaTrophy, FaAward, FaMedal, FaUserCheck, FaFileContract,
  FaHandshake, FaSpinner, FaClock, FaMapMarkerAlt, FaCreditCard,
  FaReceipt, FaChartBar, FaChartPie, FaArrowUp, FaArrowDown,
  FaUsers, FaCalendar, FaDollarSign, FaPercent, FaEquals,
  FaCog, FaRedo, FaExpand, FaCompress
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type Definitions
interface AnalyticsData {
  // Revenue metrics
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  revenueGrowth: number;
  
  // Booking metrics
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  pendingBookings: number;
  bookingGrowth: number;
  
  // Vehicle metrics
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  utilizationRate: number;
  
  // Driver metrics
  totalDrivers: number;
  activeDrivers: number;
  newDrivers: number;
  averageRating: number;
  
  // Performance metrics
  averageRentalDuration: number;
  repeatCustomerRate: number;
  customerSatisfaction: number;
  commissionEarned: number;
  
  // Time series data
  revenueByMonth: Array<{ month: string; revenue: number; bookings: number }>;
  bookingsByStatus: Array<{ status: string; count: number; color: string }>;
  vehicleUtilization: Array<{ category: string; utilization: number; revenue: number }>;
  topPerformingVehicles: Array<{ vehicle: string; revenue: number; bookings: number; rating: number }>;
  driverPerformance: Array<{ driver: string; bookings: number; revenue: number; rating: number }>;
  weeklyTrends: Array<{ week: string; revenue: number; bookings: number; newDrivers: number }>;
}

interface AnalyticsFilters {
  dateRange: '7days' | '30days' | '90days' | '1year' | 'all';
  vehicleCategory: string;
  driverType: string;
  status: string;
}

const CHART_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State management
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    revenueGrowth: 0,
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    bookingGrowth: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    rentedVehicles: 0,
    maintenanceVehicles: 0,
    utilizationRate: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    newDrivers: 0,
    averageRating: 0,
    averageRentalDuration: 0,
    repeatCustomerRate: 0,
    customerSatisfaction: 0,
    commissionEarned: 0,
    revenueByMonth: [],
    bookingsByStatus: [],
    vehicleUtilization: [],
    topPerformingVehicles: [],
    driverPerformance: [],
    weeklyTrends: []
  });
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    dateRange: '30days',
    vehicleCategory: 'all',
    driverType: 'all',
    status: 'all'
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<string>('revenue');

  // Load analytics data
  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) return;

      // Derive partnerId
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        console.error('No partner ID found for analytics');
        return;
      }

      // Calculate date range
      const now = new Date();
      let startDate: Date;
      switch (filters.dateRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // All time
      }

      // Fetch bookings data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      // Fetch vehicles data
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', partnerId);

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        return;
      }

      // Process analytics data
      const processedData = await processAnalyticsData(bookingsData || [], vehiclesData || []);
      setAnalyticsData(processedData);

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Process analytics data
  const processAnalyticsData = async (bookings: any[], vehicles: any[]) => {
    // Calculate basic metrics
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => ['active', 'in_progress'].includes(b.status)).length;
    const completedBookings = bookings.filter(b => ['completed', 'completed_early', 'completed_late'].includes(b.status)).length;
    const pendingBookings = bookings.filter(b => ['pending_partner_approval', 'pending_driver_approval', 'pending_documents', 'pending_payment'].includes(b.status)).length;

    // Calculate vehicle metrics
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.is_available && v.is_active).length;
    const rentedVehicles = vehicles.filter(v => !v.is_available && v.is_active).length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
    const utilizationRate = totalVehicles > 0 ? (rentedVehicles / totalVehicles) * 100 : 0;

    // Calculate revenue by month
    const revenueByMonth = calculateRevenueByMonth(bookings);
    
    // Calculate bookings by status
    const bookingsByStatus = calculateBookingsByStatus(bookings);
    
    // Calculate vehicle utilization
    const vehicleUtilization = calculateVehicleUtilization(vehicles, bookings);
    
    // Calculate top performing vehicles
    const topPerformingVehicles = await calculateTopPerformingVehicles(vehicles, bookings);
    
    // Calculate driver performance
    const driverPerformance = await calculateDriverPerformance(bookings);
    
    // Calculate weekly trends
    const weeklyTrends = calculateWeeklyTrends(bookings);

    // Calculate growth rates (simplified)
    const revenueGrowth = 12.5; // Mock data
    const bookingGrowth = 8.3; // Mock data

    // Calculate driver metrics
    const uniqueDrivers = new Set(bookings.map(b => b.driver_id)).size;
    const averageRating = 4.2; // Mock data

    return {
      totalRevenue,
      monthlyRevenue: totalRevenue / 12, // Simplified
      weeklyRevenue: totalRevenue / 52, // Simplified
      revenueGrowth,
      totalBookings,
      activeBookings,
      completedBookings,
      pendingBookings,
      bookingGrowth,
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      utilizationRate,
      totalDrivers: uniqueDrivers,
      activeDrivers: uniqueDrivers * 0.8, // Mock data
      newDrivers: uniqueDrivers * 0.2, // Mock data
      averageRating,
      averageRentalDuration: 2.5, // Mock data
      repeatCustomerRate: 65, // Mock data
      customerSatisfaction: 4.2, // Mock data
      commissionEarned: totalRevenue * 0.15, // 15% commission
      revenueByMonth,
      bookingsByStatus,
      vehicleUtilization,
      topPerformingVehicles,
      driverPerformance,
      weeklyTrends
    };
  };

  // Helper functions for calculations
  const calculateRevenueByMonth = (bookings: any[]) => {
    const monthlyData: { [key: string]: { revenue: number; bookings: number } } = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, bookings: 0 };
      }
      
      monthlyData[monthKey].revenue += booking.total_amount || 0;
      monthlyData[monthKey].bookings += 1;
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }));
  };

  const calculateBookingsByStatus = (bookings: any[]) => {
    const statusCounts: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      const status = booking.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count], index) => ({
      status: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  };

  const calculateVehicleUtilization = (vehicles: any[], bookings: any[]) => {
    const categoryData: { [key: string]: { utilization: number; revenue: number; count: number } } = {};
    
    vehicles.forEach(vehicle => {
      const category = vehicle.category || vehicle.ride_hailing_categories?.[0] || 'Other';
      if (!categoryData[category]) {
        categoryData[category] = { utilization: 0, revenue: 0, count: 0 };
      }
      categoryData[category].count += 1;
    });

    bookings.forEach(booking => {
      // This would need to be enhanced with actual vehicle-category mapping
      const category = 'X'; // Simplified
      if (categoryData[category]) {
        categoryData[category].revenue += booking.total_amount || 0;
        categoryData[category].utilization += 1;
      }
    });

    return Object.entries(categoryData).map(([category, data]) => ({
      category,
      utilization: data.count > 0 ? (data.utilization / data.count) * 100 : 0,
      revenue: data.revenue
    }));
  };

  const calculateTopPerformingVehicles = async (vehicles: any[], bookings: any[]) => {
    // Simplified calculation - in real implementation, you'd map bookings to vehicles
    return vehicles.slice(0, 5).map((vehicle, index) => ({
      vehicle: `${vehicle.make} ${vehicle.model}`,
      revenue: Math.random() * 5000 + 1000, // Mock data
      bookings: Math.floor(Math.random() * 20) + 5, // Mock data
      rating: Math.random() * 2 + 3 // Mock data between 3-5
    }));
  };

  const calculateDriverPerformance = async (bookings: any[]) => {
    // Simplified calculation - in real implementation, you'd fetch driver details
    const driverStats: { [key: string]: { bookings: number; revenue: number; rating: number } } = {};
    
    bookings.forEach(booking => {
      const driverId = booking.driver_id;
      if (!driverStats[driverId]) {
        driverStats[driverId] = { bookings: 0, revenue: 0, rating: 0 };
      }
      driverStats[driverId].bookings += 1;
      driverStats[driverId].revenue += booking.total_amount || 0;
      driverStats[driverId].rating = Math.random() * 2 + 3; // Mock rating
    });

    return Object.entries(driverStats).slice(0, 5).map(([driverId, stats]) => ({
      driver: `Driver ${driverId.slice(-4)}`,
      bookings: stats.bookings,
      revenue: stats.revenue,
      rating: stats.rating
    }));
  };

  const calculateWeeklyTrends = (bookings: any[]) => {
    const weeklyData: { [key: string]: { revenue: number; bookings: number; newDrivers: number } } = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { revenue: 0, bookings: 0, newDrivers: 0 };
      }
      
      weeklyData[weekKey].revenue += booking.total_amount || 0;
      weeklyData[weekKey].bookings += 1;
      weeklyData[weekKey].newDrivers = Math.floor(Math.random() * 3); // Mock data
    });

    return Object.entries(weeklyData).map(([week, data]) => ({
      week,
      revenue: data.revenue,
      bookings: data.bookings,
      newDrivers: data.newDrivers
    }));
  };

  // Wait for auth state
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadAnalyticsData();
  }, [user, authLoading, filters]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Format functions
  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Comprehensive insights into your rental business performance
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
                <option value="all">All Time</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <button 
                onClick={loadAnalyticsData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <FaRedo className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue)}</p>
                <div className="flex items-center text-xs">
                  <FaArrowUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-green-600">+{formatPercentage(analyticsData.revenueGrowth)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalBookings)}</p>
                <div className="flex items-center text-xs">
                  <FaArrowUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-green-600">+{formatPercentage(analyticsData.bookingGrowth)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaCar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.utilizationRate)}</p>
                <p className="text-xs text-gray-600">{analyticsData.rentedVehicles}/{analyticsData.totalVehicles} vehicles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.averageRating.toFixed(1)}</p>
                <p className="text-xs text-gray-600">Customer satisfaction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedChart('revenue')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedChart === 'revenue' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setSelectedChart('bookings')}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedChart === 'bookings' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Bookings
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [
                      selectedChart === 'revenue' ? formatCurrency(value) : formatNumber(value),
                      selectedChart === 'revenue' ? 'Revenue' : 'Bookings'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedChart === 'revenue' ? 'revenue' : 'bookings'} 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.bookingsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.bookingsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [formatNumber(value), 'Bookings']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Vehicle Utilization by Category */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Vehicle Utilization by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.vehicleUtilization}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [formatPercentage(value), 'Utilization']} />
                  <Bar dataKey="utilization" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performing Vehicles */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Vehicles</h3>
            <div className="space-y-4">
              {analyticsData.topPerformingVehicles.map((vehicle, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{vehicle.vehicle}</p>
                    <p className="text-sm text-gray-600">{vehicle.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(vehicle.revenue)}</p>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaStar className="w-3 h-3 text-yellow-400 mr-1" />
                      {vehicle.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Driver Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Drivers</h3>
            <div className="space-y-4">
              {analyticsData.driverPerformance.map((driver, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{driver.driver}</p>
                    <p className="text-sm text-gray-600">{driver.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(driver.revenue)}</p>
                    <div className="flex items-center text-sm text-gray-600">
                      <FaStar className="w-3 h-3 text-yellow-400 mr-1" />
                      {driver.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-lg">
                <FaUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.activeDrivers)}</p>
                <p className="text-xs text-gray-600">+{formatNumber(analyticsData.newDrivers)} new this period</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-pink-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData.averageRentalDuration} weeks</p>
                <p className="text-xs text-gray-600">Per rental</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-lg">
                <FaPercent className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Repeat Rate</p>
                <p className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.repeatCustomerRate)}</p>
                <p className="text-xs text-gray-600">Customer retention</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-teal-500 p-3 rounded-lg">
                <FaDollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Commission</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.commissionEarned)}</p>
                <p className="text-xs text-gray-600">Platform fees</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 