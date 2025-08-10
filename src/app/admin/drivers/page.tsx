'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaCar, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaStar, FaClock, FaMapMarkerAlt, FaFileAlt, FaChevronDown, FaChevronUp, FaBuilding, FaMoneyBillWave, FaIdCard, FaShieldAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaUsers, FaUser, FaComments, FaHeadset, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { TruckIcon, CurrencyPoundIcon, CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Driver {
  id: string;
  user_id: string;
  full_name?: string;
  email: string;
  phone?: string;
  license_number?: string;
  status: 'active' | 'pending' | 'suspended' | 'rejected' | 'under_review';
  verification_status?: 'verified' | 'pending' | 'rejected' | 'incomplete';
  role?: string;
  join_date?: string;
  created_at?: string;
  total_earnings?: number;
  total_rides?: number;
  rating?: number;
  location?: string;
  address?: any;
  vehicle_info?: {
    make?: string;
    model?: string;
    year?: number;
    license_plate?: string;
    insurance_expiry?: string;
    mot_expiry?: string;
  };
  documents?: {
    driving_license?: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
      expiry_date?: string;
    };
    insurance?: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
      expiry_date?: string;
    };
    pco_license?: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
      expiry_date?: string;
    };
    proof_of_address?: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
    };
  };
  background_check?: {
    status: 'passed' | 'pending' | 'failed' | 'not_started';
    completed_date?: string;
    valid_until?: string;
  };
  last_activity?: string;
  updated_at?: string;
  is_verified?: boolean;
  email_verified?: boolean;
  profile_completed?: boolean;
  working_areas?: string[];
  experience?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  bank_details?: {
    account_name?: string;
    account_number?: string;
    sort_code?: string;
  };
}

interface Booking {
  id: string;
  driver_id: string;
  partner_id: string;
  vehicle_id?: string;
  partner_name?: string; 
  car_name: string;
  total_amount: number;
  weekly_rate?: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'pending_partner_approval' | 'pending_admin_approval' | 'rejected';
  created_at?: string;
  partner_acceptance_deadline?: string;
  pickup_location?: string;
  dropoff_location?: string;
  special_requests?: string;
  car?: {
    name?: string;
    make?: string;
    model?: string;
    year?: number;
    registration_number?: string;
    license_plate?: string;
    fuel_type?: string;
    transmission?: string;
    seats?: number;
    color?: string;
    weekly_rate?: number;
  };
  partner?: {
    name?: string;
    company_name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    business_address?: any;
  };
}

interface EnrichedDriver extends Driver {
  bookings: Booking[];
  source: 'drivers' | 'users';
}

interface CarData {
  id: string;
  name?: string;
  make?: string;
  model?: string;
  year?: number;
  registration_number?: string;
  license_plate?: string;
  fuel_type?: string;
  transmission?: string;
  seats?: number;
  color?: string;
  daily_rate?: number;
  weekly_rate?: number;
  features?: string[];
}

interface PartnerData {
  id: string;
  name?: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  business_address?: any;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  responses?: any[];
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

interface DriverProfile extends EnrichedDriver {
  support_tickets: SupportTicket[];
  activity_logs: ActivityLog[];
  expiring_documents: Array<{
    type: string;
    expiry_date: string;
    days_until_expiry: number;
    status: string;
  }>;
  completion_percentage: number;
  risk_score: number;
  last_login_at?: string;
  device_info?: {
    last_device?: string;
    browser_info?: string;
    location?: string;
  };
  chat_sessions?: any[];
}

interface ChatSession {
  id: string;
  customer: {
    id: string;
    name: string;
    type: 'driver' | 'partner' | 'customer';
    email?: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  };
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  status: 'waiting' | 'active' | 'completed' | 'closed';
  created_at: string;
  assigned_at?: string;
  completed_at?: string;
  waiting_time?: number;
  session_duration?: number;
  messages: number;
  satisfaction?: number;
  review_comment?: string;
}

const formatDate = (date: string) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return 'Invalid Date';
  }
};

const formatDateTime = (date: string) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};

const getDisplayName = (driver: Driver): string => {
  return driver.full_name || driver.email || 'Unknown Driver';
};

const getPhoneNumber = (driver: Driver): string => {
  return driver.phone || 'N/A';
};

const getLocation = (driver: Driver): string => {
  if (driver.location) return driver.location;
  if (driver.address) {
    if (typeof driver.address === 'string') return driver.address;
    if (driver.address.city) return driver.address.city;
    if (driver.address.county) return driver.address.county;
  }
  return 'Location not specified';
};

const getDocumentStatus = (driver: Driver, docType: string) => {
  if (!driver.documents) return 'missing';
  
  const doc = driver.documents[docType as keyof typeof driver.documents];
  if (!doc) return 'missing';
  
  return doc.status || 'missing';
};

export default function DriversPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enrichedDrivers, setEnrichedDrivers] = useState<EnrichedDriver[]>([]);
  const [carsData, setCarsData] = useState<Map<string, CarData>>(new Map());
  const [partnersData, setPartnersData] = useState<Map<string, PartnerData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedDriver, setSelectedDriver] = useState<EnrichedDriver | null>(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  // Filter and sort drivers
  const filteredAndSortedDrivers = useMemo(() => {
    let filtered = enrichedDrivers.filter(driver => {
      const matchesSearch = searchTerm === '' || 
        getDisplayName(driver).toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getPhoneNumber(driver).includes(searchTerm) ||
        getLocation(driver).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
      const matchesVerification = filterVerification === 'all' || driver.verification_status === filterVerification;
      
      return matchesSearch && matchesStatus && matchesVerification;
    });

    // Sort drivers
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = getDisplayName(a);
          bValue = getDisplayName(b);
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'earnings':
          aValue = a.total_earnings || 0;
          bValue = b.total_earnings || 0;
          break;
        case 'rides':
          aValue = a.total_rides || 0;
          bValue = b.total_rides || 0;
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'joinDate':
          aValue = a.join_date || a.created_at || '';
          bValue = b.join_date || b.created_at || '';
          break;
        default:
          aValue = getDisplayName(a);
          bValue = getDisplayName(b);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [enrichedDrivers, searchTerm, filterStatus, filterVerification, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = enrichedDrivers.length;
    const active = enrichedDrivers.filter(d => d.status === 'active').length;
    const pending = enrichedDrivers.filter(d => d.status === 'pending').length;
    const verified = enrichedDrivers.filter(d => d.verification_status === 'verified').length;
    const totalEarnings = enrichedDrivers.reduce((sum, d) => sum + (d.total_earnings || 0), 0);
    const totalRides = enrichedDrivers.reduce((sum, d) => sum + (d.total_rides || 0), 0);
    const avgRating = enrichedDrivers.length > 0 
      ? enrichedDrivers.reduce((sum, d) => sum + (d.rating || 0), 0) / enrichedDrivers.length 
      : 0;
    
    return {
      total,
      active,
      pending,
      verified,
      totalEarnings,
      totalRides,
      avgRating: Math.round(avgRating * 10) / 10
    };
  }, [enrichedDrivers]);

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load drivers from API
        const response = await fetch('/api/admin/drivers');
        const driversResult = await response.json();
        
        if (!response.ok) {
          console.error('Error loading drivers:', driversResult.error);
          toast.error('Failed to load drivers');
          return;
        }

        console.log('Drivers data loaded:', driversResult.drivers);
        console.log('Number of drivers:', driversResult.count);

        // Load bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (bookingsError) {
          console.warn('Error loading bookings:', bookingsError.message);
        }
        const bookingsArr = (bookingsData as any[]) || [];

        // Load vehicles
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*');

        if (vehiclesError) {
          console.error('Error loading vehicles:', vehiclesError);
        }

        // Load partners
        const { data: partnersData, error: partnersError } = await supabase
          .from('partners')
          .select('*');

        if (partnersError) {
          console.error('Error loading partners:', partnersError);
        }

        // Process data
        const carsMap = new Map<string, CarData>();
        vehiclesData?.forEach(vehicle => {
          carsMap.set(vehicle.id, {
            id: vehicle.id,
            name: vehicle.name,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            registration_number: vehicle.registration_number,
            license_plate: vehicle.license_plate,
            fuel_type: vehicle.fuel_type,
            transmission: vehicle.transmission,
            seats: vehicle.seats,
            color: vehicle.color,
            daily_rate: vehicle.daily_rate,
            weekly_rate: vehicle.weekly_rate,
            features: vehicle.features
          });
        });

        const partnersMap = new Map<string, PartnerData>();
        partnersData?.forEach(partner => {
          partnersMap.set(partner.id, {
            id: partner.id,
            name: partner.name,
            company_name: partner.company_name,
            contact_person: partner.contact_person,
            phone: partner.phone,
            email: partner.email,
            address: partner.address,
            business_address: partner.business_address
          });
        });

        // Enrich drivers with bookings
        const enriched = driversResult.drivers.map((driver: any) => {
          const driverBookings = bookingsArr.filter((booking: any) => 
            booking.driver_id === driver.id
          );

          return {
            ...driver,
            bookings: driverBookings,
            source: 'drivers' as const
          };
        });

        setEnrichedDrivers(enriched);
        setCarsData(carsMap);
        setPartnersData(partnersMap);

        console.log('Enriched drivers:', enriched);
        console.log('Number of enriched drivers:', enriched.length);

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'under_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'incomplete': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDriverPaymentInfo = (driverId: string) => {
    const driver = enrichedDrivers.find(d => d.id === driverId);
    if (!driver) return { totalEarnings: 0, totalRides: 0, avgEarnings: 0 };
    
    const totalEarnings = driver.total_earnings || 0;
    const totalRides = driver.total_rides || 0;
    const avgEarnings = totalRides > 0 ? totalEarnings / totalRides : 0;
    
    return { totalEarnings, totalRides, avgEarnings };
  };

  const getDocumentProgress = (driver: Driver) => {
    if (!driver.documents) return 0;
    const totalDocs = Object.keys(driver.documents).length;
    const approvedDocs = Object.values(driver.documents).filter(doc => doc.status === 'approved').length;
    return totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for creating driver
    toast.success('Driver creation functionality to be implemented');
  };

  const handleUpdateDriver = async (id: string, updates: Partial<Driver>) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Driver updated successfully');
      
      // Refresh data
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (driversData) {
        setEnrichedDrivers(driversData.map(driver => ({
          ...driver,
          bookings: [],
          source: 'drivers' as const
        })));
      }
    } catch (error) {
      console.error('Error updating driver:', error);
      toast.error('Failed to update driver');
    }
  };

  const handleDeleteDriver = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Driver deleted successfully');
      setEnrichedDrivers(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver');
    }
  };

  const handleStatusChange = async (id: string, status: Driver['status']) => {
    await handleUpdateDriver(id, { status });
  };

  const handleVerificationStatusChange = async (id: string, verificationStatus: Driver['verification_status']) => {
    await handleUpdateDriver(id, { verification_status: verificationStatus });
  };

  const handleViewDocuments = async (driver: Driver) => {
    // Implementation for viewing documents
    toast('Document viewer to be implemented');
  };

  const handleViewDriverProfile = async (driver: EnrichedDriver) => {
    setSelectedDriver(driver);
    setShowDriverModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading driver data...</p>
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
              <FaUser className="h-8 w-8 text-blue-600" />
              Driver Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Manage drivers, view performance, and handle verifications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Drivers</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <FaUsers className="text-2xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Active Drivers</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.active}</div>
              </div>
              <FaUsers className="text-2xl text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Earnings</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">£{stats.totalEarnings.toLocaleString()}</div>
              </div>
              <FaMoneyBillWave className="text-2xl text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Rides</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalRides}</div>
              </div>
              <FaCar className="text-2xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
              <option value="under_review">Under Review</option>
            </select>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="incomplete">Incomplete</option>
            </select>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="status">Sort by Status</option>
              <option value="earnings">Sort by Earnings</option>
              <option value="rides">Sort by Rides</option>
              <option value="rating">Sort by Rating</option>
              <option value="joinDate">Sort by Join Date</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Driver</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Verification</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Earnings</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Rides</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Rating</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Documents</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedDrivers.map(driver => {
                  const paymentInfo = getDriverPaymentInfo(driver.id);
                  const docProgress = getDocumentProgress(driver);
                  
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <FaUser className="text-white text-sm" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900 dark:text-white">{getDisplayName(driver)}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{driver.email}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{getPhoneNumber(driver)}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                          {driver.status}
                        </span>
                      </td>
                      
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationColor(driver.verification_status || 'pending')}`}>
                          {driver.verification_status || 'pending'}
                        </span>
                      </td>
                      
                      <td className="p-4">
                        <div className="text-sm text-gray-900 dark:text-white">£{paymentInfo.totalEarnings.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Avg: £{paymentInfo.avgEarnings.toFixed(2)}</div>
                      </td>
                      
                      <td className="p-4">
                        <div className="text-sm text-gray-900 dark:text-white">{paymentInfo.totalRides}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{driver.bookings.length} bookings</div>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex items-center">
                          <FaStar className="text-yellow-400 text-sm mr-1" />
                          <span className="text-sm text-gray-900 dark:text-white">{driver.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${docProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{docProgress}%</span>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDriverProfile(driver)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                          >
                            <FaEye className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleViewDocuments(driver)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                          >
                            <FaFileAlt className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredAndSortedDrivers.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No drivers found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {enrichedDrivers.length === 0 
                ? "No drivers have been added yet"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}