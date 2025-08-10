'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Link from 'next/link';
import {
  FaTruck, FaCar, FaMotorcycle, FaShuttleVan, FaBus, FaSearch, FaFilter,
  FaPlus, FaEdit, FaTrash, FaEye, FaChartLine, FaCog, FaBell,
  FaCheck, FaTimes, FaClock, FaUser, FaMoneyBillWave, FaCalendar,
  FaTag, FaSort, FaSortUp, FaSortDown, FaRedo, FaDownload,
  FaShieldAlt, FaTools, FaGasPump, FaRoute, FaMapMarkerAlt
} from 'react-icons/fa';

interface Vehicle {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  type: 'car' | 'truck' | 'van' | 'motorcycle' | 'bus';
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  location: string;
  driver_id?: string;
  driver_name?: string;
  fuel_level: number;
  mileage: number;
  last_maintenance: string;
  next_maintenance: string;
  daily_rate: number;
  total_revenue: number;
  bookings_count: number;
  created_at: string;
  updated_at: string;
}

export default function FleetPage() {
  const { 
    canView, 
    canEdit, 
    canDelete, 
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('vehicle_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (canView('fleet')) {
      loadVehicles();
    }
  }, [canView]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      console.log('Loading fleet vehicles...');
      
      // Simulate fleet data
      const mockVehicles: Vehicle[] = [
        {
          id: '1',
          vehicle_number: 'VH-001',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          type: 'car',
          status: 'available',
          location: 'San Francisco, CA',
          driver_id: 'DRV-001',
          driver_name: 'John Smith',
          fuel_level: 85,
          mileage: 15000,
          last_maintenance: '2024-01-10',
          next_maintenance: '2024-04-10',
          daily_rate: 75,
          total_revenue: 12500,
          bookings_count: 45,
          created_at: '2023-06-15T10:00:00Z',
          updated_at: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          vehicle_number: 'VH-002',
          make: 'Honda',
          model: 'Civic',
          year: 2022,
          type: 'car',
          status: 'in_use',
          location: 'Los Angeles, CA',
          driver_id: 'DRV-002',
          driver_name: 'Maria Garcia',
          fuel_level: 60,
          mileage: 22000,
          last_maintenance: '2024-01-05',
          next_maintenance: '2024-04-05',
          daily_rate: 65,
          total_revenue: 9800,
          bookings_count: 38,
          created_at: '2022-09-20T10:00:00Z',
          updated_at: '2024-01-21T09:15:00Z'
        },
        {
          id: '3',
          vehicle_number: 'VH-003',
          make: 'Ford',
          model: 'Transit',
          year: 2021,
          type: 'van',
          status: 'maintenance',
          location: 'San Diego, CA',
          fuel_level: 30,
          mileage: 35000,
          last_maintenance: '2024-01-15',
          next_maintenance: '2024-04-15',
          daily_rate: 95,
          total_revenue: 15800,
          bookings_count: 52,
          created_at: '2021-12-10T10:00:00Z',
          updated_at: '2024-01-19T16:45:00Z'
        }
      ];
      
      console.log('Fleet vehicles loaded:', mockVehicles.length, 'vehicles');
      setVehicles(mockVehicles);
    } catch (error) {
      console.error('Error loading fleet vehicles:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!canDelete('fleet')) {
      return;
    }

    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const getStatusColor = (status: Vehicle['status']) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'in_use': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_service': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Vehicle['type']) => {
    switch (type) {
      case 'car': return FaCar;
      case 'truck': return FaTruck;
      case 'van': return FaShuttleVan;
      case 'motorcycle': return FaMotorcycle;
      case 'bus': return FaBus;
      default: return FaCar;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || vehicle.status === filterStatus;
    const matchesType = !filterType || vehicle.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    const aValue = (a as any)[sortBy] ?? '';
    const bValue = (b as any)[sortBy] ?? '';
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    inUse: vehicles.filter(v => v.status === 'in_use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    outOfService: vehicles.filter(v => v.status === 'out_of_service').length,
    totalRevenue: vehicles.reduce((sum, v) => sum + v.total_revenue, 0),
    totalBookings: vehicles.reduce((sum, v) => sum + v.bookings_count, 0),
    averageDailyRate: vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + v.daily_rate, 0) / vehicles.length) : 0
  };

  if (!canView('fleet')) {
    return (
      <div className="p-8 text-center">
        <FaShieldAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view fleet management.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="fleet">
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your vehicle fleet and operations</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={loadVehicles}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRedo className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                {canEdit('fleet') && (
                  <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Vehicle
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaTruck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.available}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaMoneyBillWave className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaChartLine className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Daily Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.averageDailyRate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/admin/fleet/vehicles" className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <FaCar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicles</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Manage vehicle inventory</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/fleet/maintenance" className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <FaTools className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Maintenance</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Schedule and track maintenance</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/fleet/pricing" className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <FaMoneyBillWave className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Set rates and pricing</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/fleet/analytics" className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <FaChartLine className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fleet performance insights</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="in_use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out_of_service">Out of Service</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="car">Car</option>
                  <option value="truck">Truck</option>
                  <option value="van">Van</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="bus">Bus</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="vehicle_number">Vehicle Number</option>
                  <option value="make">Make</option>
                  <option value="model">Model</option>
                  <option value="status">Status</option>
                  <option value="daily_rate">Daily Rate</option>
                  <option value="total_revenue">Total Revenue</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vehicles Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading fleet vehicles...</p>
              </div>
            ) : sortedVehicles.length === 0 ? (
              <div className="p-8 text-center">
                <FaTruck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No vehicles found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Daily Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedVehicles.map((vehicle) => {
                      const TypeIcon = getTypeIcon(vehicle.type);
                      return (
                        <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <TypeIcon className="w-8 h-8 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {vehicle.vehicle_number}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  {vehicle.type.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                              {vehicle.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {vehicle.location}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {vehicle.driver_name || 'Unassigned'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              ${vehicle.daily_rate}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              ${vehicle.total_revenue.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {vehicle.bookings_count} bookings
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {/* View vehicle details */}}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View details"
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              {canEdit('fleet') && (
                                <button
                                  onClick={() => {/* Edit vehicle */}}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Edit vehicle"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete('fleet') && (
                                <button
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete vehicle"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 