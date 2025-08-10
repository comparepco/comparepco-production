'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaChartBar,
  FaChartLine,
  FaStar,
  FaCalendar,
  FaDollarSign,
  FaTruck,
  FaFire,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaTimes
} from 'react-icons/fa';

export default function FleetAnalytics() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analyticsData, setAnalyticsData] = useState({
    mostRentedVehicles: [] as any[],
    trendingVehicles: [] as any[],
    revenueByVehicle: [] as any[],
    categoryPerformance: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && authUser) {
      loadAnalyticsData();
    }
  }, [authUser, authLoading, router, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load all data concurrently from Supabase
      const [vehiclesSnapshot, bookingsSnapshot, partnersSnapshot] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('partners').select('*')
      ]);

      if (vehiclesSnapshot.error) {
        console.error('Error loading vehicles:', vehiclesSnapshot.error);
        toast.error('Failed to load vehicles data');
        return;
      }

      if (bookingsSnapshot.error) {
        console.error('Error loading bookings:', bookingsSnapshot.error);
        toast.error('Failed to load bookings data');
        return;
      }

      if (partnersSnapshot.error) {
        console.error('Error loading partners:', partnersSnapshot.error);
        toast.error('Failed to load partners data');
        return;
      }

      const vehicles = vehiclesSnapshot.data || [];
      const bookings = bookingsSnapshot.data || [];

      // Process partners
      const partnersData: any[] = [];
      (partnersSnapshot.data || []).forEach(partner => {
        partnersData.push({ 
          id: partner.id, 
          business_name: partner.business_name || partner.company_name || partner.name,
          company_name: partner.company_name,
          name: partner.name,
          email: partner.email
        });
      });

      // Add partners from users collection (avoid duplicates)
      // This part of the logic needs to be adapted if 'users' table is no longer used for partners
      // For now, we'll assume partners are directly in the 'partners' table or derived from it.
      // If 'users' table is still used, this section would need to be re-evaluated.
      // For this edit, we'll keep the original logic but note the potential issue.
      // The original code had `usersResult.data || []` which is no longer available.
      // Assuming 'partners' table directly contains all partner data.
      setPartners(partnersData);

      // Calculate most rented vehicles
      const mostRented = vehicles.map(vehicle => {
        const vehicleBookings = bookings.filter((b: any) => b.car_id === vehicle.id);
        const totalBookings = vehicleBookings.length;
        const totalRevenue = vehicleBookings
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
        
        return {
          ...vehicle,
          totalBookings,
          totalRevenue
        };
      }).sort((a, b) => b.totalBookings - a.totalBookings).slice(0, 10);

      // Calculate trending vehicles
      const daysAgo = parseInt(timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      const recentBookings = bookings.filter((b: any) => {
        if (!b.created_at) return false;
        const bookingDate = new Date(b.created_at);
        return bookingDate >= cutoffDate;
      });

      const trending = vehicles.map(vehicle => {
        const recentVehicleBookings = recentBookings.filter((b: any) => b.car_id === vehicle.id);
        const allVehicleBookings = bookings.filter((b: any) => b.car_id === vehicle.id);
        
        const recentCount = recentVehicleBookings.length;
        const totalCount = allVehicleBookings.length;
        const trendScore = recentCount > 0 ? (recentCount / Math.max(totalCount, 1)) * 100 : 0;

        return {
          ...vehicle,
          recentBookings: recentCount,
          totalBookings: totalCount,
          trendScore
        };
      }).filter(v => v.recentBookings > 0)
        .sort((a, b) => b.trendScore - a.trendScore)
        .slice(0, 8);

      // Calculate revenue by vehicle
      const revenueByVehicle = vehicles.map(vehicle => {
        const vehicleBookings = bookings.filter((b: any) => b.car_id === vehicle.id && b.status === 'completed');
        const totalRevenue = vehicleBookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
        const bookingCount = vehicleBookings.length;

        return {
          ...vehicle,
          totalRevenue,
          bookingCount,
          averageRevenue: bookingCount > 0 ? totalRevenue / bookingCount : 0
        };
      }).filter(v => v.totalRevenue > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      // Calculate category performance
      const categoryStats: { [key: string]: any } = {};

      vehicles.forEach(vehicle => {
        const category = vehicle.category || 'Other';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            vehicleCount: 0,
            totalBookings: 0,
            totalRevenue: 0
          };
        }

        categoryStats[category].vehicleCount++;
        const vehicleBookings = bookings.filter((b: any) => b.car_id === vehicle.id);
        categoryStats[category].totalBookings += vehicleBookings.length;
        categoryStats[category].totalRevenue += vehicleBookings
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
      });

      const categoryPerformance = Object.values(categoryStats)
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

      setAnalyticsData({
        mostRentedVehicles: mostRented,
        trendingVehicles: trending,
        revenueByVehicle,
        categoryPerformance
      });

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
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

  const getPartnerDisplayName = (partner: any) => {
    if (partner?.business_name) return partner.business_name;
    if (partner?.company_name) return partner.company_name;
    if (partner?.name) return partner.name;
    // Only show email if no other name is available
    return partner?.email?.includes('@') ? 'Unknown Partner' : partner?.email || 'Unknown Partner';
  };

  const filterVehicles = (vehicles: any[]) => {
    return vehicles.filter(vehicle => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleMatch = vehicle.make?.toLowerCase().includes(searchLower) ||
                            vehicle.model?.toLowerCase().includes(searchLower) ||
                            vehicle.registration_number?.toLowerCase().includes(searchLower) ||
                            vehicle.name?.toLowerCase().includes(searchLower);
        
        const partner = partners.find(p => p.id === vehicle.partner_id);
        const partnerMatch = partner && getPartnerDisplayName(partner).toLowerCase().includes(searchLower);
        
        if (!vehicleMatch && !partnerMatch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && vehicle.category !== categoryFilter) {
        return false;
      }

      // Partner filter
      if (partnerFilter !== 'all' && vehicle.partner_id !== partnerFilter) {
        return false;
      }

      return true;
    });
  };

  const getFilteredAnalytics = () => {
    const filteredVehicles = filterVehicles(analyticsData.mostRentedVehicles);
    const filteredTrending = filterVehicles(analyticsData.trendingVehicles);
    const filteredRevenue = filterVehicles(analyticsData.revenueByVehicle);
    
    return {
      mostRentedVehicles: filteredVehicles,
      trendingVehicles: filteredTrending,
      revenueByVehicle: filteredRevenue,
      categoryPerformance: analyticsData.categoryPerformance
    };
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    analyticsData.mostRentedVehicles.forEach(vehicle => {
      if (vehicle.category) categories.add(vehicle.category);
    });
    return Array.from(categories).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading fleet analytics...</p>
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
              <FaChartBar className="h-8 w-8 text-blue-600" />
              Fleet Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Analyze fleet performance, trending vehicles, and rental patterns</p>
        </div>

        {/* Time Range Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Time Range</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select the time period for analytics</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Vehicles
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by make, model, registration, partner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Partner
              </label>
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Partners</option>
                {partners
                  .filter((partner, index, self) => 
                    index === self.findIndex(p => p.id === partner.id)
                  )
                  .map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {getPartnerDisplayName(partner)}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setPartnerFilter('all');
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaTimes className="text-sm" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Most Rented Vehicles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FaChartBar className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Most Rented Vehicles</h2>
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Vehicles with the highest number of bookings
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getFilteredAnalytics().mostRentedVehicles.slice(0, 6).map((vehicle, index) => (
                <div key={vehicle.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {vehicle.name || `${vehicle.make} ${vehicle.model}`}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {vehicle.registration_number} • {vehicle.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {vehicle.totalBookings} bookings
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatCurrency(vehicle.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trending Vehicles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center">
                <FaChartLine className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Trending Vehicles</h2>
              </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Vehicles with increasing booking activity (last {timeRange} days)
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {getFilteredAnalytics().trendingVehicles.map((vehicle, index) => (
                <div key={vehicle.id} className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <FaFire className="h-5 w-5 text-green-600" />
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      {vehicle.trendScore.toFixed(0)}% trend
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {vehicle.name || `${vehicle.make} ${vehicle.model}`}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {vehicle.recentBookings} recent bookings
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {formatCurrency(vehicle.daily_rate || 0)}/day
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Revenue Generators */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <FaDollarSign className="h-6 w-6 text-yellow-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Top Revenue Generators</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {getFilteredAnalytics().revenueByVehicle.slice(0, 5).map((vehicle, index) => (
                  <div key={vehicle.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {vehicle.name || `${vehicle.make} ${vehicle.model}`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {vehicle.bookingCount} bookings
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(vehicle.totalRevenue)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Avg: {formatCurrency(vehicle.averageRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <FaTruck className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Category Performance</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {analyticsData.categoryPerformance.map((category) => (
                  <div key={category.category} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">{category.category}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{category.vehicleCount} vehicles</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Total Bookings</p>
                        <p className="font-medium text-gray-900 dark:text-white">{category.totalBookings}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Revenue</p>
                        <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(category.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 