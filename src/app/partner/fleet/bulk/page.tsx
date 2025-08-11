'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { supabase } from '../../../../lib/supabase/client';
import { FaPlus, FaTrash, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  weekly_rate: number;
  price_per_week?: number;
  status: string;
  is_available: boolean;
  is_active: boolean;
  category?: string;
  fuel_type: string;
  transmission: string;
  mileage: number;
  ride_hailing_categories?: string[];
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: any;
  action: string;
  fields?: string[];
}

export default function BulkOperations() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [bulkFormData, setBulkFormData] = useState<any>({});
  const [processing, setProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalVehicles: 0,
    selectedVehicles: 0,
    availableVehicles: 0,
    maintenanceVehicles: 0
  });

  const bulkOperations: BulkOperation[] = [
    {
      id: 'update-status',
      name: 'Update Status',
      description: 'Change status for multiple vehicles',
      icon: FaCheck,
      action: 'update_status',
      fields: ['status']
    },
    {
      id: 'update-pricing',
      name: 'Update Pricing',
      description: 'Bulk price adjustments',
      icon: FaPlus,
      action: 'update_pricing',
      fields: ['weekly_rate']
    },
    {
      id: 'update-category',
      name: 'Update Category',
      description: 'Change vehicle categories',
      icon: FaPlus,
      action: 'update_category',
      fields: ['category']
    },
    {
      id: 'toggle-availability',
      name: 'Toggle Availability',
      description: 'Make vehicles available/unavailable',
      icon: FaPlus,
      action: 'toggle_availability',
      fields: ['is_available']
    },
    {
      id: 'export-selected',
      name: 'Export Selected',
      description: 'Export selected vehicles data',
      icon: FaPlus,
      action: 'export'
    },
    {
      id: 'delete-selected',
      name: 'Delete Selected',
      description: 'Remove selected vehicles',
      icon: FaTrash,
      action: 'delete'
    }
  ];

  const loadVehicleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch partner's vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', user?.id)
        .eq('is_active', true);

      if (vehiclesError) throw vehiclesError;

      // Ensure weekly_rate is present
      const processed = (vehiclesData || []).map((v: any) => ({
        ...v,
        weekly_rate:
          v.weekly_rate ??
          v.price_per_week ??
          (v.daily_rate ? v.daily_rate * 7 : 0)
      }));

      setVehicles(processed);

      // Calculate stats
      const totalVehicles = processed.length;
      const availableVehicles = processed.filter(v => v.is_available).length;
      const maintenanceVehicles = processed.filter(v => v.status === 'maintenance').length;

      setStats({
        totalVehicles,
        selectedVehicles: 0,
        availableVehicles,
        maintenanceVehicles
      });

    } catch (error) {
      // Error logging removed for production
      setError('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadVehicleData();
    }
  }, [user, loadVehicleData]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus;
      const matchesMake = selectedMake === 'all' || vehicle.make === selectedMake;
      const matchesModel = selectedModel === 'all' || vehicle.model === selectedModel;
      const matchesYear = selectedYear === 'all' || vehicle.year?.toString() === selectedYear;
      const matchesSearch = !searchTerm || 
                           vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesMake && matchesModel && matchesYear && matchesSearch;
    });
  }, [vehicles, selectedStatus, selectedMake, selectedModel, selectedYear, searchTerm]);

  const handleSelectAll = () => {
    if (selectedVehicles.size === filteredVehicles.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(filteredVehicles.map(v => v.id)));
    }
  };

  const handleSelectVehicle = (vehicleId: string) => {
    const newSelected = new Set(selectedVehicles);
    if (newSelected.has(vehicleId)) {
      newSelected.delete(vehicleId);
    } else {
      newSelected.add(vehicleId);
    }
    setSelectedVehicles(newSelected);
  };

  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedVehicles.size === 0) {
      setError('Please select at least one vehicle');
      return;
    }

    setSelectedOperation(operation);
    setBulkFormData({});
    setShowBulkModal(true);
  };

  const executeBulkOperation = async () => {
    if (!selectedOperation || selectedVehicles.size === 0) return;

    try {
      setProcessing(true);
      setError(null);

      const selectedVehicleIds = Array.from(selectedVehicles);
      const selectedVehicleData = vehicles.filter(v => selectedVehicleIds.includes(v.id));

      switch (selectedOperation.action) {
        case 'update_status':
          await updateVehicleStatus(selectedVehicleIds, bulkFormData.status);
          break;
        case 'update_pricing':
          await updateVehiclePricing(selectedVehicleIds, bulkFormData.weekly_rate);
          break;
        case 'update_category':
          await updateVehicleCategory(selectedVehicleIds, bulkFormData.category);
          break;
        case 'toggle_availability':
          await toggleVehicleAvailability(selectedVehicleIds, bulkFormData.is_available);
          break;
        case 'export':
          exportSelectedVehicles(selectedVehicleData);
          break;
        case 'delete':
          await deleteSelectedVehicles(selectedVehicleIds);
          break;
      }

      // Refresh data
      await loadVehicleData();
      setSelectedVehicles(new Set());
      setShowBulkModal(false);
      setSelectedOperation(null);
      setBulkFormData({});

    } catch (error) {
      // Error logging removed for production
      setError('Failed to execute bulk operation');
    } finally {
      setProcessing(false);
    }
  };

  const updateVehicleStatus = async (vehicleIds: string[], status: string) => {
    const { error } = await supabase
      .from('vehicles')
      .update({ status })
      .in('id', vehicleIds);

    if (error) throw error;
  };

  const updateVehiclePricing = async (vehicleIds: string[], weeklyRate: number) => {
    const { error } = await supabase
      .from('vehicles')
      .update({ weekly_rate: weeklyRate })
      .in('id', vehicleIds);

    if (error) throw error;
  };

  const updateVehicleCategory = async (vehicleIds: string[], category: string) => {
    const { error } = await supabase
      .from('vehicles')
      .update({ category })
      .in('id', vehicleIds);

    if (error) throw error;
  };

  const toggleVehicleAvailability = async (vehicleIds: string[], isAvailable: boolean) => {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_available: isAvailable })
      .in('id', vehicleIds);

    if (error) throw error;
  };

  const deleteSelectedVehicles = async (vehicleIds: string[]) => {
    const { error } = await supabase
      .from('vehicles')
      .update({ is_active: false })
      .in('id', vehicleIds);

    if (error) throw error;
  };

  const exportSelectedVehicles = (selectedVehicleData: Vehicle[]) => {
    const csvContent = [
      ['License Plate', 'Make', 'Model', 'Year', 'Weekly Rate', 'Status', 'Available', 'Category', 'Fuel Type', 'Transmission', 'Mileage'],
      ...selectedVehicleData.map(vehicle => [
        vehicle.license_plate,
        vehicle.make,
        vehicle.model,
        vehicle.year,
        vehicle.weekly_rate,
        vehicle.status,
        vehicle.is_available ? 'Yes' : 'No',
        vehicle.category || 'N/A',
        vehicle.fuel_type,
        vehicle.transmission,
        vehicle.mileage
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'selected_vehicles.csv';
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate filter options from vehicles data
  const makeOptions = Array.from(new Set(vehicles.map(v => v.make).filter(Boolean))).sort();
  const modelOptions = Array.from(new Set(vehicles.map(v => v.model).filter(Boolean))).sort();
  const yearOptions = Array.from(new Set(vehicles.map(v => v.year).filter(Boolean))).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Operations</h1>
            <p className="text-gray-600 mt-2">Perform mass actions on your vehicle fleet</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {selectedVehicles.size} selected
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
                <p className="text-xs text-green-600">In your fleet</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedVehicles.size}</p>
                <p className="text-xs text-green-600">For bulk operations</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableVehicles}</p>
                <p className="text-xs text-green-600">Ready for rental</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{stats.maintenanceVehicles}</p>
                <p className="text-xs text-green-600">Service required</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Operations Grid */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Bulk Operations</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bulkOperations.map((operation) => (
                <button
                  key={operation.id}
                  onClick={() => handleBulkOperation(operation)}
                  disabled={selectedVehicles.size === 0}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <operation.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-gray-900">{operation.name}</h4>
                    <p className="text-xs text-gray-500">{operation.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <FaPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="booked">Booked</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
            
            {/* Additional Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Makes</option>
                  {makeOptions.map(make => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Models</option>
                  {modelOptions.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Years</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setSelectedMake('all');
                    setSelectedModel('all');
                    setSelectedYear('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Vehicles</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                {selectedVehicles.size === filteredVehicles.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.size === filteredVehicles.length && filteredVehicles.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weekly Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <FaPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No vehicles found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.has(vehicle.id)}
                          onChange={() => handleSelectVehicle(vehicle.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.license_plate} • {vehicle.year}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        £{vehicle.weekly_rate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.is_available ? (
                          <FaPlus className="w-5 h-5 text-green-600" />
                        ) : (
                          <FaPlus className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.category || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Operation Modal */}
        {showBulkModal && selectedOperation && (
          <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
            <div className="modal-content w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedOperation.name}
                  </h3>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {selectedOperation.description} for {selectedVehicles.size} selected vehicles.
                </p>

                {selectedOperation.fields && (
                  <div className="space-y-4">
                    {selectedOperation.fields.includes('status') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={bulkFormData.status || ''}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, status: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select status</option>
                          <option value="available">Available</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="booked">Booked</option>
                          <option value="unavailable">Unavailable</option>
                        </select>
                      </div>
                    )}

                    {selectedOperation.fields.includes('weekly_rate') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weekly Rate (£)
                        </label>
                        <input
                          type="number"
                          value={bulkFormData.weekly_rate || ''}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, weekly_rate: parseFloat(e.target.value) })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter weekly rate"
                        />
                      </div>
                    )}

                    {selectedOperation.fields.includes('category') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          value={bulkFormData.category || ''}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, category: e.target.value })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select category</option>
                          <option value="x">X (Economy)</option>
                          <option value="comfort">COMFORT (Standard)</option>
                          <option value="business_comfort">BUSINESS COMFORT (Premium)</option>
                          <option value="exec">EXEC (Executive)</option>
                          <option value="green">GREEN (Electric/Hybrid)</option>
                          <option value="lux">LUX (Luxury)</option>
                          <option value="blacklane">BLACKLANE (Premium Black Car)</option>
                          <option value="wheely">WHEELY (Specialized)</option>
                        </select>
                      </div>
                    )}

                    {selectedOperation.fields.includes('is_available') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Availability
                        </label>
                        <select
                          value={bulkFormData.is_available?.toString() || ''}
                          onChange={(e) => setBulkFormData({ ...bulkFormData, is_available: e.target.value === 'true' })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select availability</option>
                          <option value="true">Available</option>
                          <option value="false">Unavailable</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeBulkOperation}
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Execute'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 