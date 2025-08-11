'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { 
  FaCar, FaPlus, FaSearch, FaEdit, FaTrash, FaStar, FaFileAlt,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaBan, FaTools,
  FaMoneyBillWave, FaChartLine, FaCog
} from 'react-icons/fa';

interface Vehicle {
  id: string;
  name?: string;
  make: string | null;
  model: string | null;
  year: number | null;
  license_plate: string | null;
  category?: string;
  fuel_type?: string;
  transmission?: string;
  mileage?: number;
  location?: string;
  color?: string;
  seats?: number;
  doors?: number;
  engine?: string;
  description?: string;
  price_per_week?: number;
  price_per_day?: number;
  features?: string[];
  insurance_expiry?: string | null;
  mot_expiry?: string | null;
  next_service?: string | null;
  status: string | null;
  partner_id: string | null;
  image_urls?: string[];
  documents?: {
    [key: string]: {
      status: string;
      url: string;
      expiry_date: string | null;
    };
  };
  insurance_included?: boolean;
  insurance_details?: {
    coverage?: string;
    excess?: number;
    terms?: string;
  };
  total_bookings?: number;
  total_revenue?: number;
  average_rating?: number;
  document_verification_status?: string;
  created_at: string | null;
  updated_at: string | null;
}

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  booked: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending_approval: 'bg-yellow-100 text-yellow-800'
} as const;

const statusIcons = {
  available: FaCheckCircle,
  booked: FaClock,
  maintenance: FaBan,
  inactive: FaBan,
  pending_approval: FaExclamationTriangle
};

// Helper function to get status icon safely
const getStatusIcon = (status: string) => {
  return statusIcons[status as keyof typeof statusIcons] || FaExclamationTriangle;
};

export default function FleetPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [_showBulkActions, setShowBulkActions] = useState(false);
  const [_showDocumentModal, setShowDocumentModal] = useState(false);
  const [stats] = useState({
    total: 0,
    available: 0,
    booked: 0,
    maintenance: 0,
    totalRevenue: 0,
    totalBookings: 0,
    avgRating: '0.0',
    pendingDocs: 0,
    expiringSoon: 0
  });

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const partnerId = user?.id; // Assuming user.id is the partner_id for now
      if (!partnerId) { setVehicles([]); setFilteredVehicles([]); return; }

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vehiclesList = data || [];
      setVehicles(vehiclesList);
      setFilteredVehicles(vehiclesList);
    } catch (e) {
      // Handle error silently or log to monitoring service
      setVehicles([]);
      setFilteredVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
        router.replace('/');
      } else {
        loadVehicles();
      }
    }
  }, [user, authLoading, router, loadVehicles]);

  useEffect(() => {
    let filtered = [...vehicles];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        (vehicle.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (vehicle.make?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (vehicle.model?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (vehicle.license_plate?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(vehicle => vehicle.category === categoryFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Vehicle];
      let bValue: any = b[sortBy as keyof Vehicle];

      if (sortBy === 'next_service' || sortBy === 'insurance_expiry' || sortBy === 'mot_expiry') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Reset pagination when filters change
  useEffect(() => {
    // setCurrentPage(1); // This state was removed
  }, [searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Pagination
  // const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage); // This state was removed
  // const startIndex = (currentPage - 1) * itemsPerPage; // This state was removed
  // const endIndex = startIndex + itemsPerPage; // This state was removed
  // const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex); // This state was removed

  // const goToPage = (page: number) => { // This function was removed
  //   setCurrentPage(page);
  // };

  // const renderPagination = () => { // This function was removed
  //   const pages = [];
  //   const maxVisiblePages = 5;
    
  //   let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  //   const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
  //   if (endPage - startPage + 1 < maxVisiblePages) {
  //     startPage = Math.max(1, endPage - maxVisiblePages + 1);
  //   }

  //   // First page + ellipsis
  //   if (startPage > 1) {
  //     pages.push(
  //       <button
  //         key={1}
  //         onClick={() => goToPage(1)}
  //         className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
  //       >
  //         1
  //       </button>
  //     );
  //     if (startPage > 2) {
  //       pages.push(
  //         <span key="ellipsis1" className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300">
  //           ...
  //         </span>
  //       );
  //     }
  //   }

  //   // Previous button
  //   if (currentPage > 1) {
  //     pages.push(
  //       <button
  //         key="prev"
  //         onClick={() => goToPage(currentPage - 1)}
  //         className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
  //       >
  //         ‹
  //       </button>
  //     );
  //   }

  //   // Page numbers
  //   for (let i = startPage; i <= endPage; i++) {
  //     pages.push(
  //       <button
  //         key={i}
  //         onClick={() => goToPage(i)}
  //         className={`px-3 py-2 text-sm font-medium border ${
  //           i === currentPage
  //             ? 'bg-blue-600 text-white border-blue-600'
  //             : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700'
  //         }`}
  //       >
  //         {i}
  //       </button>
  //     );
  //   }

  //   // Next button
  //   if (currentPage < totalPages) {
  //     pages.push(
  //       <button
  //         key="next"
  //         onClick={() => goToPage(currentPage + 1)}
  //         className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
  //       >
  //         ›
  //       </button>
  //     );
  //   }

  //   // Last page + ellipsis
  //   if (endPage < totalPages) {
  //     if (endPage < totalPages - 1) {
  //       pages.push(
  //         <span key="ellipsis2" className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300">
  //           ...
  //         </span>
  //       );
  //     }
  //     pages.push(
  //       <button
  //         key={totalPages}
  //         onClick={() => goToPage(totalPages)}
  //         className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
  //       >
  //         {totalPages}
  //       </button>
  //     );
  //   }

  //   return pages;
  // };

  // Remove unused functions
  // const handleSelectVehicle = (_vehicleId: string) => {
  //   // Function removed - not used
  // };

  // const handleSelectAll = () => {
  //   // Function removed - not used
  // };

  // const handleBulkAction = async () => {
  //   // Function removed - not used
  //   loadVehicles(); // Reload data
  // };

  const updateVehicleStatus = async (vehicleId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles(prev => prev.map(v => 
        v.id === vehicleId ? { ...v, status } : v
      ));
      setFilteredVehicles(prev => prev.map(v => 
        v.id === vehicleId ? { ...v, status } : v
      ));
    } catch (e) {
      // Handle error silently or log to monitoring service
    }
  };

  const deleteVehicle = async (vehicle: Vehicle) => {
    if (!confirm(`Are you sure you want to delete ${vehicle.make} ${vehicle.model}?`)) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicle.id);

      if (error) throw error;

      setVehicles(prev => prev.filter(v => v.id !== vehicle.id));
      setFilteredVehicles(prev => prev.filter(v => v.id !== vehicle.id));
    } catch (e) {
      // Handle error silently or log to monitoring service
    }
  };

  const getAlertStatus = (vehicle: Vehicle) => {
    const alerts = [];
    
    // Check MOT expiry
    if (vehicle.mot_expiry) {
      const motDate = new Date(vehicle.mot_expiry);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      if (motDate <= new Date()) {
        alerts.push({ type: 'error', message: 'MOT expired' });
      } else if (motDate <= thirtyDaysFromNow) {
        alerts.push({ type: 'warning', message: 'MOT expiring soon' });
      }
    }
    
    // Check insurance expiry
    if (vehicle.insurance_expiry) {
      const insuranceDate = new Date(vehicle.insurance_expiry);
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      if (insuranceDate <= new Date()) {
        alerts.push({ type: 'error', message: 'Insurance expired' });
      } else if (insuranceDate <= thirtyDaysFromNow) {
        alerts.push({ type: 'warning', message: 'Insurance expiring soon' });
      }
    }
    
    return alerts[0] || null;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-bold text-gray-900">Loading fleet...</div>
      </div>
    );
  }

  if (!user) return null;

  const canManageFleet = user.role === 'PARTNER' || (user.role === 'PARTNER_STAFF' && user.permissions?.canManageFleet);

  // Remove unused variables
  // const makes = [...new Set(vehicles.map(v => v.make).filter(Boolean))];
  // const models = [...new Set(vehicles.map(v => v.model).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Vehicles</h1>
              <p className="text-gray-600 mt-1">
                View and manage all vehicles in your fleet
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canManageFleet && (
                <Link
                  href="/partner/fleet/add"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg"
                >
                  <FaPlus className="w-4 h-4" />
                  Add Vehicle
                </Link>
              )}
              <button
                onClick={() => setShowBulkActions(true)}
                className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <FaTools className="w-4 h-4" />
                Bulk Actions
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaCar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-green-600">All fleet vehicles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
                <p className="text-xs text-green-600">Ready for booking</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Booked</p>
                <p className="text-2xl font-bold text-gray-900">{stats.booked}</p>
                <p className="text-xs text-green-600">Currently rented</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">All time earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/partner/fleet/add" className="block">
            <div className="bg-blue-500 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group h-full">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Add Vehicle</h3>
                    <p className="text-blue-100 text-sm">Register a new vehicle to your fleet</p>
                  </div>
                  <div className="bg-blue-400 p-3 rounded-lg">
                    <FaPlus className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <div 
            onClick={() => router.push('/partner/analytics')}
            className="bg-green-500 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group h-full"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">View Reports</h3>
                  <p className="text-green-100 text-sm">Analyze fleet performance & revenue</p>
                </div>
                <div className="bg-green-400 p-3 rounded-lg">
                  <FaChartLine className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setShowDocumentModal(true)}
            className="bg-purple-500 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group h-full"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Manage Documents</h3>
                  <p className="text-purple-100 text-sm">Update insurance, MOT & service records</p>
                </div>
                <div className="bg-purple-400 p-3 rounded-lg">
                  <FaFileAlt className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setShowBulkActions(true)}
            className="bg-orange-500 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group h-full"
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Bulk Actions</h3>
                  <p className="text-orange-100 text-sm">Update multiple vehicles at once</p>
                </div>
                <div className="bg-orange-400 p-3 rounded-lg">
                  <FaCog className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200"
            >
              <option value="">All Categories</option>
              {/* Assuming categoriesData is available and contains categories */}
              {/* {categoriesData?.map(category => ( */}
              {/*   <option key={category.id} value={category.name}>{category.name}</option> */}
              {/* ))} */}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200"
            >
              <option value="name">Sort by Name</option>
              <option value="make">Sort by Make</option>
              <option value="model">Sort by Model</option>
              <option value="year">Sort by Year</option>
              <option value="price_per_week">Sort by Price/Week</option>
              <option value="total_revenue">Sort by Total Revenue</option>
              <option value="average_rating">Sort by Average Rating</option>
              <option value="total_bookings">Sort by Total Bookings</option>
              <option value="next_service">Sort by Next Service</option>
              <option value="insurance_expiry">Sort by Insurance Expiry</option>
              <option value="mot_expiry">Sort by MOT Expiry</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Enhanced Bulk Actions */}
          {/* {selectedVehicles.length > 0 && canManageFleet && ( */}
          {/*   <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200"> */}
          {/*     <span className="text-sm font-medium text-blue-900"> */}
          {/*       {selectedVehicles.length} vehicle(s) selected */}
          {/*     </span> */}
          {/*     <select */}
          {/*       value={bulkAction} */}
          {/*       onChange={(e) => setBulkAction(e.target.value)} */}
          {/*       className="px-4 py-2 border border-blue-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500" */}
          {/*     > */}
          {/*       <option value="">Choose action...</option> */}
          {/*       <option value="activate">Activate</option> */}
          {/*       <option value="deactivate">Deactivate</option> */}
          {/*       <option value="maintenance">Set to Maintenance</option> */}
          {/*       <option value="delete">Delete</option> */}
          {/*     </select> */}
          {/*     <button */}
          {/*       onClick={handleBulkAction} */}
          {/*       disabled={!bulkAction} */}
          {/*       className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-all duration-200" */}
          {/*     > */}
          {/*       Apply */}
          {/*     </button> */}
          {/*     <button */}
          {/*       onClick={() => setSelectedVehicles([])} */}
          {/*       className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-all duration-200" */}
          {/*     > */}
          {/*       Clear */}
          {/*     </button> */}
          {/*   </div> */}
          {/* )} */}
        </div>

        {/* Enhanced Vehicle List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          {filteredVehicles.length === 0 ? (
            <div className="p-16 text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCar className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No vehicles found</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {vehicles.length === 0
                  ? 'Add your first vehicle to get started with fleet management'
                  : 'No vehicles match your current filters. Try adjusting your search criteria.'
                }
              </p>
              {vehicles.length === 0 && (
                <Link
                  href="/partner/fleet/add"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  <FaPlus className="w-5 h-5" />
                  Add First Vehicle
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {/* {canManageFleet && ( */}
                      {/*   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> */}
                      {/*     <input */}
                      {/*       type="checkbox" */}
                      {/*       checked={selectedVehicles.length === filteredVehicles.length && filteredVehicles.length > 0} */}
                      {/*       onChange={handleSelectAll} */}
                      {/*       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" */}
                      {/*     /> */}
                      {/*   </th> */}
                      {/* )} */}
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pricing
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                      {/* {canManageFleet && ( */}
                      {/*   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"> */}
                      {/*     Actions */}
                      {/*   </th> */}
                      {/* )} */}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVehicles.map((vehicle) => {
                      const alert = getAlertStatus(vehicle);
                      const StatusIcon = getStatusIcon(vehicle.status || '');
                      
                      return (
                        <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors duration-200">
                          {/* {canManageFleet && ( */}
                          {/*   <td className="px-6 py-4 whitespace-nowrap"> */}
                          {/*     <input */}
                          {/*       type="checkbox" */}
                          {/*       checked={selectedVehicles.includes(vehicle.id)} */}
                          {/*       onChange={() => handleSelectVehicle(vehicle.id)} */}
                          {/*       className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" */}
                          {/*     /> */}
                          {/*   </td> */}
                          {/* )} */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                              <Image
                                src={vehicle.image_urls?.[0] || '/placeholder-car.jpg'}
                                alt={vehicle.name || 'Vehicle'}
                                width={64}
                                height={48}
                                className="rounded-xl"
                              />
                              <div>
                                <div className="font-semibold text-gray-900">{vehicle.name || `${vehicle.make} ${vehicle.model}`}</div>
                                <div className="text-sm text-gray-500 font-mono">{vehicle.license_plate}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                              <div className="text-gray-500">{vehicle.fuel_type} • {vehicle.transmission}</div>
                              <div className="text-gray-500">{vehicle.seats} seats • {vehicle.mileage?.toLocaleString() || 0} miles</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[vehicle.status || ''] || 'bg-gray-100 text-gray-800'}`}>
                                <StatusIcon className="w-3 h-3" />
                                {vehicle.status}
                              </span>
                              {alert && (
                                <div className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                                  alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {alert.message}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-semibold text-lg">£{vehicle.price_per_week || 0}/week</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center gap-1 mb-1">
                                <FaStar className="w-4 h-4 text-yellow-500" />
                                <span className="font-semibold">{vehicle.average_rating || 0}</span>
                              </div>
                              <div className="text-gray-500">{vehicle.total_bookings || 0} bookings</div>
                              <div className="text-gray-500 font-semibold">£{vehicle.total_revenue?.toLocaleString() || 0}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {/* {canManageFleet && ( */}
                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/partner/fleet/${vehicle.id}/edit`}
                                  className="text-blue-600 hover:text-blue-700 transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </Link>
                                <Link
                                  href={`/partner/fleet/${vehicle.id}/documents`}
                                  className="text-green-600 hover:text-green-700 transition-colors"
                                  title="Documents"
                                >
                                  <FaFileAlt className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => deleteVehicle(vehicle)}
                                  className="text-red-600 hover:text-red-700 transition-colors"
                                  title="Delete"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                                <select
                                  value={vehicle.status || ''}
                                  onChange={(e) => updateVehicleStatus(vehicle.id, e.target.value)}
                                  className="text-xs border-gray-300 rounded-lg px-3 py-1.5 text-black focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="available">Available</option>
                                  <option value="booked">Booked</option>
                                  <option value="maintenance">Maintenance</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </div>
                            {/* </div> */}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Enhanced Pagination */}
              {/* {totalPages > 1 && ( */}
              {/*   <div className="px-8 py-6 border-t border-gray-200 bg-gray-50"> */}
              {/*     <div className="flex items-center justify-between"> */}
              {/*       <div className="flex items-center text-sm text-gray-700"> */}
              {/*         <span className="font-medium"> */}
              {/*           Showing {startIndex + 1} to {Math.min(endIndex, filteredVehicles.length)} of {filteredVehicles.length} results */}
              {/*         </span> */}
              {/*       </div> */}
                      
              {/*       <div className="flex items-center space-x-1"> */}
              {/*         {renderPagination()} */}
              {/*       </div> */}
              {/*     </div> */}
              {/*   </div> */}
              {/* )} */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 