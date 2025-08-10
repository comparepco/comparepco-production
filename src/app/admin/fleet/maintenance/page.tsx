'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaWrench,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendar,
  FaTruck,
  FaUser,
  FaClock,
  FaPencilAlt,
  FaDollarSign,
  FaChevronDown,
  FaChevronRight,
  FaBuilding
} from 'react-icons/fa';

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  type: string;
  description: string;
  date: string;
  cost?: number;
  mileage?: number;
  next_due_date?: string;
  next_due_mileage?: number;
  updated_by: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  name?: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  partner_id: string;
  partner_name?: string;
  mileage?: number;
  last_service_date?: string;
  next_service_date?: string;
  service_interval?: number;
  last_service_mileage?: number;
  daily_rate: number;
  weekly_rate?: number;
  status: string;
  category: string;
  images?: string[];
  mot_expiry?: string;
  insurance_expiry?: string;
  road_tax_expiry?: string;
  maintenance_records?: MaintenanceRecord[];
}

interface Partner {
  id: string;
  business_name?: string;
  company_name?: string;
  name?: string;
  contact_person?: string;
  email: string;
  phone?: string;
  vehicles?: Vehicle[];
}

interface PartnerMaintenanceStats {
  overdue: number;
  urgent: number;
  soon: number;
  ok: number;
  noSchedule: number;
  documentExpiry: number;
  totalVehicles: number;
}

export default function VehicleMaintenance() {
  const { user } = useAuth();
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());
  const [globalStats, setGlobalStats] = useState<PartnerMaintenanceStats>({
    overdue: 0,
    urgent: 0,
    soon: 0,
    ok: 0,
    noSchedule: 0,
    documentExpiry: 0,
    totalVehicles: 0
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [partnerVehicleFilters, setPartnerVehicleFilters] = useState<{[partnerId: string]: string}>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadPartnersAndVehicles();
  }, [user]);

  const loadPartnersAndVehicles = async () => {
    try {
      setLoading(true);
      // Load all data concurrently from Supabase
      const [vehiclesSnapshot, maintenanceSnapshot, partnersSnapshot] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('maintenance').select('*'),
        supabase.from('partners').select('*')
      ]);

      if (vehiclesSnapshot.error) {
        console.error('Error loading vehicles:', vehiclesSnapshot.error);
        toast.error('Failed to load vehicles');
        return;
      }
      if (partnersSnapshot.error) {
        console.error('Error loading partners:', partnersSnapshot.error);
        toast.error('Failed to load partners');
        return;
      }
      if (maintenanceSnapshot.error) {
        console.error('Error loading maintenance:', maintenanceSnapshot.error);
        toast.error('Failed to load maintenance records');
        return;
      }

      // Process partners
      const partnersData: Partner[] = [];
      (partnersSnapshot.data || []).forEach(partner => {
        partnersData.push({ id: partner.id, ...partner } as Partner);
      });

      // Add partners from users collection
      const usersResult = await supabase.from('users').select('*');
      if (usersResult.error) {
        console.error('Error loading users:', usersResult.error);
        toast.error('Failed to load users');
        return;
      }
      (usersResult.data || []).forEach(user => {
        if (user.role === 'partner') {
          // Only add if not already in partnersData from partners collection
          const existingPartner = partnersData.find(p => p.id === user.id);
          if (!existingPartner) {
            partnersData.push({
              id: user.id,
              business_name: user.company_name || user.business_name || user.name || user.full_name,
              company_name: user.company_name,
              name: user.name || user.full_name,
              contact_person: user.contact_person,
              email: user.email,
              phone: user.phone
            });
          }
        }
      });

      // Process vehicles
      const vehiclesData = (vehiclesSnapshot.data || []).map(vehicle => {
        const partner = partnersData.find(p => p.id === vehicle.partner_id);
        const weekly_rate = vehicle.weekly_rate || vehicle.price_per_week || (vehicle.daily_rate * 7);
        return {
          id: vehicle.id,
          ...vehicle,
          weekly_rate,
          partner_name: partner?.business_name || 
                        partner?.company_name || 
                        partner?.name || 
                        partner?.contact_person || 
                        partner?.email || 
                        'Unknown Partner'
        } as Vehicle;
      });

      // Group vehicles by partner - only include partners with maintenance permissions
      const partnersWithVehicles = partnersData.map(partner => {
        const partnerVehicles = vehiclesData.filter(vehicle => vehicle.partner_id === partner.id);
        return {
          ...partner,
          vehicles: partnerVehicles
        };
      }).filter(partner => {
        // Check if partner has vehicles and maintenance permissions
        if (!partner.vehicles || partner.vehicles.length === 0) return false;
        // For now, we'll include all partners with vehicles
        return true;
      });

      // Calculate global stats
      const stats = calculateGlobalStats(vehiclesData);
      setGlobalStats(stats);
      setPartners(partnersWithVehicles);
    } catch (error) {
      console.error('Error loading partners and vehicles:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateGlobalStats = (vehicles: Vehicle[]): PartnerMaintenanceStats => {
    const stats = {
      overdue: 0,
      urgent: 0,
      soon: 0,
      ok: 0,
      noSchedule: 0,
      documentExpiry: 0,
      totalVehicles: vehicles.length
    };

    vehicles.forEach(vehicle => {
      const status = getMaintenanceStatus(vehicle);
      const mileageStatus = getMileageBasedMaintenance(vehicle);
      const expiryItems = getDocumentExpiry(vehicle);

      if (status === 'overdue' || mileageStatus === 'overdue-mileage') {
        stats.overdue++;
      } else if (status === 'urgent' || mileageStatus === 'urgent-mileage') {
        stats.urgent++;
      } else if (status === 'soon' || mileageStatus === 'soon-mileage') {
        stats.soon++;
      } else if (status === 'ok' || mileageStatus === 'ok-mileage') {
        stats.ok++;
      } else if (status === 'no-schedule') {
        stats.noSchedule++;
      }

      if (expiryItems.length > 0) {
        stats.documentExpiry++;
      }
    });

    return stats;
  };

  const calculatePartnerStats = (vehicles: Vehicle[]): PartnerMaintenanceStats => {
    return calculateGlobalStats(vehicles);
  };

  const getMaintenanceStatus = (vehicle: Vehicle) => {
    if (!vehicle.next_service_date) return 'no-schedule';
    
    const now = new Date();
    const serviceDate = new Date(vehicle.next_service_date);
    const daysUntilService = Math.ceil((serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilService < 0) return 'overdue';
    if (daysUntilService <= 7) return 'urgent';
    if (daysUntilService <= 30) return 'soon';
    return 'ok';
  };

  const getMileageBasedMaintenance = (vehicle: Vehicle) => {
    if (!vehicle.service_interval || !vehicle.last_service_mileage || !vehicle.mileage) {
      return null;
    }
    
    const milesSinceLastService = vehicle.mileage - vehicle.last_service_mileage;
    const milesUntilService = vehicle.service_interval - milesSinceLastService;
    
    if (milesUntilService <= 0) return 'overdue-mileage';
    if (milesUntilService <= 500) return 'urgent-mileage';
    if (milesUntilService <= 2000) return 'soon-mileage';
    return 'ok-mileage';
  };

  const getDocumentExpiry = (vehicle: Vehicle) => {
    const now = new Date();
    const expiryItems = [];
    
    if (vehicle.mot_expiry) {
      const motDate = new Date(vehicle.mot_expiry);
      const daysUntilMot = Math.ceil((motDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilMot <= 30) {
        expiryItems.push({ type: 'MOT', days: daysUntilMot, expired: daysUntilMot < 0 });
      }
    }
    
    if (vehicle.insurance_expiry) {
      const insuranceDate = new Date(vehicle.insurance_expiry);
      const daysUntilInsurance = Math.ceil((insuranceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilInsurance <= 30) {
        expiryItems.push({ type: 'Insurance', days: daysUntilInsurance, expired: daysUntilInsurance < 0 });
      }
    }
    
    if (vehicle.road_tax_expiry) {
      const taxDate = new Date(vehicle.road_tax_expiry);
      const daysUntilTax = Math.ceil((taxDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilTax <= 30) {
        expiryItems.push({ type: 'Road Tax', days: daysUntilTax, expired: daysUntilTax < 0 });
      }
    }
    
    return expiryItems;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
      case 'overdue-mileage':
        return <FaExclamationTriangle className="h-5 w-5 text-red-500" />;
      case 'urgent':
      case 'urgent-mileage':
        return <FaExclamationTriangle className="h-5 w-5 text-orange-500" />;
      case 'soon':
      case 'soon-mileage':
        return <FaCalendar className="h-5 w-5 text-yellow-500" />;
      case 'ok':
      case 'ok-mileage':
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <FaWrench className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
      case 'overdue-mileage':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'urgent':
      case 'urgent-mileage':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'soon':
      case 'soon-mileage':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ok':
      case 'ok-mileage':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'Service Overdue';
      case 'overdue-mileage':
        return 'Mileage Overdue';
      case 'urgent':
        return 'Service Due Soon';
      case 'urgent-mileage':
        return 'Mileage Due Soon';
      case 'soon':
        return 'Due This Month';
      case 'soon-mileage':
        return 'Mileage Due Soon';
      case 'ok':
      case 'ok-mileage':
        return 'Up to Date';
      default:
        return 'No Schedule';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleEditMaintenance = (vehicle: Vehicle) => {
    setEditingVehicle({ ...vehicle });
    setShowEditModal(true);
  };

  const handleSaveMaintenance = async () => {
    if (!editingVehicle) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          next_service_date: editingVehicle.next_service_date,
          last_service_date: editingVehicle.last_service_date,
          last_service_mileage: editingVehicle.last_service_mileage,
          service_interval: editingVehicle.service_interval,
          mot_expiry: editingVehicle.mot_expiry,
          insurance_expiry: editingVehicle.insurance_expiry,
          road_tax_expiry: editingVehicle.road_tax_expiry,
          updated_at: new Date()
        })
        .eq('id', editingVehicle.id);

      if (error) {
        throw error;
      }

      // Reload data to reflect changes
      await loadPartnersAndVehicles();

      setShowEditModal(false);
      setEditingVehicle(null);
      toast.success('Maintenance schedule updated successfully');
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast.error('Error updating maintenance schedule');
    }
  };

  const togglePartnerExpansion = (partnerId: string) => {
    const newExpanded = new Set(expandedPartners);
    if (newExpanded.has(partnerId)) {
      newExpanded.delete(partnerId);
    } else {
      newExpanded.add(partnerId);
    }
    setExpandedPartners(newExpanded);
  };

  const getPartnerDisplayName = (partner: Partner) => {
    // Prioritize business names, then personal names, avoid email unless absolutely necessary
    const businessName = partner.business_name || partner.company_name;
    const personalName = partner.name || partner.contact_person;
    
    if (businessName && businessName !== partner.email) {
      return businessName;
    }
    
    if (personalName && personalName !== partner.email) {
      return personalName;
    }
    
    // Only use email if it's the only identifier available
    return partner.email || 'Unknown Partner';
  };

  const setPartnerVehicleFilter = (partnerId: string, filter: string) => {
    setPartnerVehicleFilters(prev => ({
      ...prev,
      [partnerId]: prev[partnerId] === filter ? 'all' : filter
    }));
  };

  const getFilteredVehicles = (vehicles: Vehicle[], partnerId: string) => {
    const filter = partnerVehicleFilters[partnerId] || 'all';
    
    if (filter === 'all') return vehicles;
    
    return vehicles.filter(vehicle => {
      const maintenanceStatus = getMaintenanceStatus(vehicle);
      const mileageStatus = getMileageBasedMaintenance(vehicle);
      const documentExpiry = getDocumentExpiry(vehicle);
      
      switch (filter) {
        case 'overdue': 
          return maintenanceStatus === 'overdue' || mileageStatus === 'overdue-mileage';
        case 'urgent': 
          return maintenanceStatus === 'urgent' || mileageStatus === 'urgent-mileage';
        case 'soon': 
          return maintenanceStatus === 'soon' || mileageStatus === 'soon-mileage';
        case 'ok': 
          return maintenanceStatus === 'ok' || mileageStatus === 'ok-mileage';
        case 'no-schedule': 
          return maintenanceStatus === 'no-schedule';
        case 'document-expiry': 
          return documentExpiry.length > 0;
        default: 
          return true;
      }
    });
  };

  const calculateVehicleMaintenanceStats = (vehicle: Vehicle): PartnerMaintenanceStats => {
    const stats = {
      overdue: 0,
      urgent: 0,
      soon: 0,
      ok: 0,
      noSchedule: 0,
      documentExpiry: 0,
      totalVehicles: 1
    };

    const maintenanceStatus = getMaintenanceStatus(vehicle);
    const mileageStatus = getMileageBasedMaintenance(vehicle);
    const documentExpiry = getDocumentExpiry(vehicle);

    if (maintenanceStatus === 'overdue' || mileageStatus === 'overdue-mileage') {
      stats.overdue = 1;
    } else if (maintenanceStatus === 'urgent' || mileageStatus === 'urgent-mileage') {
      stats.urgent = 1;
    } else if (maintenanceStatus === 'soon' || mileageStatus === 'soon-mileage') {
      stats.soon = 1;
    } else if (maintenanceStatus === 'ok' || mileageStatus === 'ok-mileage') {
      stats.ok = 1;
    } else if (maintenanceStatus === 'no-schedule') {
      stats.noSchedule = 1;
    }

    if (documentExpiry.length > 0) {
      stats.documentExpiry = 1;
    }

    return stats;
  };

  if (!user) { // Assuming canAccess is removed or replaced, so check if user exists
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access Fleet Maintenance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center">
          <FaWrench className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Maintenance by Partner</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Track maintenance schedules and service requirements organized by partner
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Partners or Vehicles
                </label>
                <input
                  type="text"
                  placeholder="Search by partner name, vehicle make/model, registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="md:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Partners</option>
                  <option value="overdue">Has Overdue Maintenance</option>
                  <option value="urgent">Has Urgent Maintenance</option>
                  <option value="soon">Due This Month</option>
                  <option value="document-expiry">Has Expiring Documents</option>
                  <option value="ok">All Up to Date</option>
                </select>
              </div>
            </div>
            
            {/* Global Overview - Moved inside filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'overdue' ? 'bg-red-200 dark:bg-red-800' : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
              >
                <FaExclamationTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{globalStats.overdue}</p>
                <p className="text-sm text-red-700 dark:text-red-400">Overdue</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'urgent' ? 'bg-orange-200 dark:bg-orange-800' : 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'urgent' ? 'all' : 'urgent')}
              >
                <FaExclamationTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{globalStats.urgent}</p>
                <p className="text-sm text-orange-700 dark:text-orange-400">Due Soon</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'soon' ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'soon' ? 'all' : 'soon')}
              >
                <FaCalendar className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{globalStats.soon}</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">This Month</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'ok' ? 'bg-green-200 dark:bg-green-800' : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'ok' ? 'all' : 'ok')}
              >
                <FaCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{globalStats.ok}</p>
                <p className="text-sm text-green-700 dark:text-green-400">Up to Date</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'document-expiry' ? 'bg-purple-200 dark:bg-purple-800' : 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'document-expiry' ? 'all' : 'document-expiry')}
              >
                <FaClock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{globalStats.documentExpiry}</p>
                <p className="text-sm text-purple-700 dark:text-purple-400">Docs Expiring</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'all' ? 'bg-gray-200 dark:bg-gray-600' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => setFilterStatus('all')}
              >
                <FaTruck className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-600">{globalStats.totalVehicles}</p>
                <p className="text-sm text-gray-700 dark:text-gray-400">All Vehicles</p>
              </div>
            </div>
          </div>



          {/* Partners with Vehicles */}
          <div className="space-y-4">
            {partners
              .filter((partner) => {
                // Search filter
                if (searchTerm) {
                  const searchLower = searchTerm.toLowerCase();
                  const partnerNameMatch = getPartnerDisplayName(partner).toLowerCase().includes(searchLower);
                  const vehicleMatch = partner.vehicles?.some(vehicle => 
                    vehicle.make?.toLowerCase().includes(searchLower) ||
                    vehicle.model?.toLowerCase().includes(searchLower) ||
                    vehicle.registration_number?.toLowerCase().includes(searchLower)
                  );
                  if (!partnerNameMatch && !vehicleMatch) return false;
                }

                // Status filter
                if (filterStatus !== 'all') {
                  const partnerStats = calculatePartnerStats(partner.vehicles || []);
                  
                  switch (filterStatus) {
                    case 'overdue': return partnerStats.overdue > 0;
                    case 'urgent': return partnerStats.urgent > 0;
                    case 'soon': return partnerStats.soon > 0;
                    case 'document-expiry': return partnerStats.documentExpiry > 0;
                    case 'ok': return partnerStats.overdue === 0 && partnerStats.urgent === 0 && partnerStats.documentExpiry === 0;
                    default: return true;
                  }
                }

                return true;
              })
              .map((partner) => {
              const partnerStats = calculatePartnerStats(partner.vehicles || []);
              const isExpanded = expandedPartners.has(partner.id);
              const hasMaintenanceIssues = partnerStats.overdue > 0 || partnerStats.urgent > 0 || partnerStats.documentExpiry > 0;

              return (
                <div key={partner.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  {/* Partner Header */}
                  <div 
                    className={`p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      hasMaintenanceIssues ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
                    }`}
                    onClick={() => togglePartnerExpansion(partner.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FaBuilding className="h-6 w-6 text-blue-600 mr-3" />
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {getPartnerDisplayName(partner)}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {partner.vehicles?.length || 0} vehicles • {partner.phone || 'No phone'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        {/* Partner Stats */}
                        <div className="flex space-x-2">
                          {partnerStats.overdue > 0 && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              {partnerStats.overdue} Overdue
                            </span>
                          )}
                          {partnerStats.urgent > 0 && (
                            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                              {partnerStats.urgent} Urgent
                            </span>
                          )}
                          {partnerStats.documentExpiry > 0 && (
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                              {partnerStats.documentExpiry} Docs
                            </span>
                          )}
                          {!hasMaintenanceIssues && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              All Good
                            </span>
                          )}
                        </div>
                        
                        {/* Expand/Collapse Icon */}
                        {isExpanded ? (
                          <FaChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FaChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Partner Vehicles */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="p-6">
                        {/* Partner Maintenance Stats */}
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-3">
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'overdue' 
                                ? 'bg-red-200 dark:bg-red-800 ring-2 ring-red-500' 
                                : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'overdue')}
                          >
                            <FaExclamationTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-red-600">{partnerStats.overdue}</p>
                            <p className="text-xs text-red-700 dark:text-red-400">Overdue</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'urgent' 
                                ? 'bg-orange-200 dark:bg-orange-800 ring-2 ring-orange-500' 
                                : 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'urgent')}
                          >
                            <FaExclamationTriangle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-orange-600">{partnerStats.urgent}</p>
                            <p className="text-xs text-orange-700 dark:text-orange-400">Urgent</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'soon' 
                                ? 'bg-yellow-200 dark:bg-yellow-800 ring-2 ring-yellow-500' 
                                : 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'soon')}
                          >
                            <FaCalendar className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-yellow-600">{partnerStats.soon}</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400">This Month</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'ok' 
                                ? 'bg-green-200 dark:bg-green-800 ring-2 ring-green-500' 
                                : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'ok')}
                          >
                            <FaCheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-green-600">{partnerStats.ok}</p>
                            <p className="text-xs text-green-700 dark:text-green-400">Up to Date</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'document-expiry' 
                                ? 'bg-purple-200 dark:bg-purple-800 ring-2 ring-purple-500' 
                                : 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'document-expiry')}
                          >
                            <FaClock className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-purple-600">{partnerStats.documentExpiry}</p>
                            <p className="text-xs text-purple-700 dark:text-purple-400">Docs</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'all' || !partnerVehicleFilters[partner.id]
                                ? 'bg-gray-200 dark:bg-gray-600 ring-2 ring-gray-500' 
                                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'all')}
                          >
                            <FaTruck className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-600">{partnerStats.totalVehicles}</p>
                            <p className="text-xs text-gray-700 dark:text-gray-400">All</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {getFilteredVehicles(partner.vehicles || [], partner.id).length === 0 && partner.vehicles && partner.vehicles.length > 0 && partnerVehicleFilters[partner.id] && partnerVehicleFilters[partner.id] !== 'all' ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <FaTruck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                No vehicles match the selected maintenance filter
                              </p>
                              <button
                                onClick={() => setPartnerVehicleFilter(partner.id, 'all')}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Show all vehicles
                              </button>
                            </div>
                          ) : (
                            getFilteredVehicles(partner.vehicles || [], partner.id).map((vehicle) => {
                            const status = getMaintenanceStatus(vehicle);
                            const mileageStatus = getMileageBasedMaintenance(vehicle);
                            const expiryItems = getDocumentExpiry(vehicle);
                            const finalStatus = (() => {
                              if (status === 'overdue' || mileageStatus === 'overdue-mileage') {
                                return status === 'overdue' ? status : mileageStatus || status;
                              }
                              if (status === 'urgent' || mileageStatus === 'urgent-mileage') {
                                return status === 'urgent' ? status : mileageStatus || status;
                              }
                              return status;
                            })();

                            return (
                              <div key={vehicle.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center">
                                  {vehicle.images && vehicle.images.length > 0 ? (
                                    <img
                                      src={vehicle.images[0]}
                                      alt={`${vehicle.make} ${vehicle.model}`}
                                      className="h-12 w-12 rounded-lg object-cover mr-4"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-4">
                                      <FaTruck className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">
                                      {vehicle.make} {vehicle.model} ({vehicle.year})
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Reg: {vehicle.registration_number} • {formatCurrency(vehicle.weekly_rate || 0)}/week
                                    </p>
                                    {vehicle.mileage && (
                                      <p className="text-xs text-gray-400">
                                        {vehicle.mileage.toLocaleString()} miles
                                      </p>
                                    )}
                                    {expiryItems.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {expiryItems.map((item, index) => (
                                          <span key={index} className={`text-xs px-2 py-1 rounded-full ${
                                            item.expired ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {item.type}: {item.expired ? 'Expired' : `${item.days}d`}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                      {vehicle.next_service_date ? formatDate(vehicle.next_service_date) : 'Not scheduled'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {mileageStatus && vehicle.mileage && vehicle.last_service_mileage && vehicle.service_interval ? 
                                        `${Math.max(0, vehicle.service_interval - (vehicle.mileage - vehicle.last_service_mileage)).toLocaleString()} miles left` : 
                                        'Next Service'
                                      }
                                    </p>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    {getStatusIcon(finalStatus)}
                                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(finalStatus)}`}>
                                      {getStatusText(finalStatus)}
                                    </span>
                                  </div>
                                  
                                  <button
                                    onClick={() => handleEditMaintenance(vehicle)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  >
                                    <FaPencilAlt className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {partners.length === 0 && (
            <div className="text-center py-12">
              <FaBuilding className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No partners with vehicles found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Partners need to add vehicles to track their maintenance schedules.
              </p>
            </div>
          )}
        </>
      )}

      {/* Edit Maintenance Modal */}
      {showEditModal && editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Maintenance: {editingVehicle.make} {editingVehicle.model}
                </h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Next Service Date</label>
                                    <input
                                      type="date"
                                      value={editingVehicle.next_service_date || ''}
                                      onChange={(e) => setEditingVehicle({...editingVehicle, next_service_date: e.target.value || undefined})}
                                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Service Date</label>
                                    <input
                                      type="date"
                                      value={editingVehicle.last_service_date || ''}
                                      onChange={(e) => setEditingVehicle({...editingVehicle, last_service_date: e.target.value || undefined})}
                                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Interval (miles)</label>
                    <input
                      type="number"
                      value={editingVehicle.service_interval || ''}
                      onChange={(e) => setEditingVehicle({...editingVehicle, service_interval: parseInt(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Service Mileage</label>
                    <input
                      type="number"
                      value={editingVehicle.last_service_mileage || ''}
                      onChange={(e) => setEditingVehicle({...editingVehicle, last_service_mileage: parseInt(e.target.value)})}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                                                    <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">MOT Expiry</label>
                                    <input
                                      type="date"
                                      value={editingVehicle.mot_expiry || ''}
                                      onChange={(e) => setEditingVehicle({...editingVehicle, mot_expiry: e.target.value || undefined})}
                                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Insurance Expiry</label>
                                    <input
                                      type="date"
                                      value={editingVehicle.insurance_expiry || ''}
                                      onChange={(e) => setEditingVehicle({...editingVehicle, insurance_expiry: e.target.value || undefined})}
                                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleSaveMaintenance}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

