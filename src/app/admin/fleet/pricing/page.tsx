'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaDollarSign,
  FaPencilAlt,
  FaCheck,
  FaTimes,
  FaTruck
} from 'react-icons/fa';

interface Vehicle {
  id: string;
  name?: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  category: string;
  status: string;
  dailyRate: number;
  weeklyRate?: number;
  pricePerWeek?: number;
  partnerId: string;
  partnerName?: string;
}

interface Partner {
  id: string;
  businessName?: string;
  companyName?: string;
  name?: string;
  contactPerson?: string;
  email: string;
}

export default function VehiclePricing() {
  const { user } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWeeklyRate, setEditingWeeklyRate] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      
      // Load vehicles and partners concurrently
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');

      if (vehiclesError) {
        throw vehiclesError;
      }

      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*');

      if (partnersError) {
        throw partnersError;
      }

      // Process vehicles with enhanced partner information
      const vehiclesWithPartners = vehiclesData?.map(vehicle => {
        const partner = partnersData?.find(p => p.id === vehicle.partnerId);
        
        // Calculate weekly rate from various sources
        const weeklyRate = vehicle.weeklyRate || 
                          vehicle.pricePerWeek || 
                          (vehicle.dailyRate ? vehicle.dailyRate * 7 : 0);
        
        return {
          id: vehicle.id,
          ...vehicle,
          weeklyRate,
          partnerName: partner?.businessName || 
                      partner?.companyName || 
                      partner?.name || 
                      partner?.contactPerson || 
                      partner?.email || 
                      'Unknown Partner'
        } as Vehicle;
      });

      setVehicles(vehiclesWithPartners || []);

      // Add partners from users collection (avoid duplicates)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, role, companyName, businessName, name, contactPerson, email');

      if (usersError) {
        throw usersError;
      }

      const uniquePartners = new Set<Partner>();
      usersData?.forEach(user => {
        if (user.role === 'partner') {
          const existingPartner = Array.from(uniquePartners).find(p => p.id === user.id);
          if (!existingPartner) {
            uniquePartners.add({
              id: user.id,
              businessName: user.companyName || user.businessName,
              companyName: user.companyName,
              name: user.name || user.email,
              contactPerson: user.contactPerson,
              email: user.email
            });
          }
        }
      });
      setPartners(Array.from(uniquePartners));

    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles or partners.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrice = (vehicleId: string, currentRate: number) => {
    setEditingId(vehicleId);
    setEditingWeeklyRate(currentRate);
  };

  const handleSavePrice = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          weeklyRate: editingWeeklyRate,
          pricePerWeek: editingWeeklyRate,
          dailyRate: editingWeeklyRate / 7, // Calculate daily rate from weekly
          updatedAt: new Date()
        })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setVehicles(vehicles.map(v => 
        v.id === vehicleId 
          ? { 
              ...v, 
              weeklyRate: editingWeeklyRate,
              dailyRate: editingWeeklyRate / 7,
              updatedAt: new Date() 
            }
          : v
      ));

      setEditingId(null);
      toast.success('Price updated successfully');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error updating price');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingWeeklyRate(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rented':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPartnerDisplayName = (partner: Partner) => {
    if (partner?.businessName) return partner.businessName;
    if (partner?.companyName) return partner.companyName;
    if (partner?.name) return partner.name;
    if (partner?.contactPerson) return partner.contactPerson;
    // Only show email if no other name is available
    return partner?.email?.includes('@') ? 'Unknown Partner' : partner?.email || 'Unknown Partner';
  };

  const filterVehicles = () => {
    return vehicles.filter(vehicle => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleMatch = vehicle.make?.toLowerCase().includes(searchLower) ||
                            vehicle.model?.toLowerCase().includes(searchLower) ||
                            vehicle.registrationNumber?.toLowerCase().includes(searchLower) ||
                            vehicle.name?.toLowerCase().includes(searchLower);
        
        const partnerMatch = vehicle.partnerName?.toLowerCase().includes(searchLower);
        
        if (!vehicleMatch && !partnerMatch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && vehicle.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && vehicle.status !== statusFilter) {
        return false;
      }

      // Partner filter
      if (partnerFilter !== 'all' && vehicle.partnerId !== partnerFilter) {
        return false;
      }

      return true;
    });
  };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    vehicles.forEach(vehicle => {
      if (vehicle.category) categories.add(vehicle.category);
    });
    return Array.from(categories).sort();
  };

  const getUniqueStatuses = () => {
    const statuses = new Set<string>();
    vehicles.forEach(vehicle => {
      if (vehicle.status) statuses.add(vehicle.status);
    });
    return Array.from(statuses).sort();
  };

  // Calculate statistics based on filtered vehicles
  const filteredVehicles = filterVehicles();
  const totalVehicles = filteredVehicles.length;
  const averageWeeklyRate = filteredVehicles.length > 0 
    ? filteredVehicles.reduce((sum, v) => sum + (v.weeklyRate || 0), 0) / filteredVehicles.length 
    : 0;
  const highestWeeklyRate = Math.max(...filteredVehicles.map(v => v.weeklyRate || 0), 0);
  const lowestWeeklyRate = filteredVehicles.length > 0 
    ? Math.min(...filteredVehicles.map(v => v.weeklyRate || 0).filter(rate => rate > 0), Infinity) || 0
    : 0;

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access Fleet Pricing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center">
          <FaDollarSign className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vehicle Pricing</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage weekly rental rates for all vehicles in your fleet
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Vehicles
                </label>
                <input
                  type="text"
                  placeholder="Search by make, model, registration, partner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Categories</option>
                  {getUniqueCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  {getUniqueStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    setStatusFilter('all');
                    setPartnerFilter('all');
                  }}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pricing Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Vehicles</p>
                <p className="text-2xl font-bold text-blue-600">{totalVehicles}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Weekly Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(averageWeeklyRate)}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Highest Weekly Rate</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(highestWeeklyRate)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Lowest Weekly Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(lowestWeeklyRate)}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicles Pricing Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vehicle Weekly Rates</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vehicle Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Weekly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Daily Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaTruck className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Reg: {vehicle.registrationNumber}
                            </div>
                            {vehicle.name && (
                              <div className="text-xs text-gray-400">
                                {vehicle.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {vehicle.partnerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {vehicle.category || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === vehicle.id ? (
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-gray-500">£</span>
                              <input
                                type="number"
                                value={editingWeeklyRate}
                                onChange={(e) => setEditingWeeklyRate(Number(e.target.value))}
                                className="pl-6 pr-2 py-1 border border-gray-300 rounded-md text-sm w-24 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                min="0"
                                step="10"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(vehicle.weeklyRate || 0)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrency((vehicle.weeklyRate || 0) / 7)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === vehicle.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSavePrice(vehicle.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <FaCheck className="h-5 w-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <FaTimes className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditPrice(vehicle.id, vehicle.weeklyRate || 0)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                          >
                            <FaPencilAlt className="h-4 w-4 mr-1" />
                            Edit Price
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
