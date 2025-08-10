'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaShieldAlt, FaSearch, FaFilter, FaEye, FaClock, 
  FaMoneyBillWave, FaCar, FaStar, FaDownload, FaChartLine,
  FaCalendarAlt, FaUserCircle, FaFileAlt, FaExclamationTriangle,
  FaUsers, FaCheckCircle, FaTimes, FaRoute, FaSpinner,
  FaIdCard, FaFileContract, FaUserCheck, FaUserTimes, FaHourglassHalf
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface DriverVerification {
  id: string;
  driver_id: string;
  partner_id: string;
  full_name: string;
  email: string;
  phone: string;
  verified: boolean;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Verification details
  verification: {
    documents_uploaded: boolean;
    license_number?: string;
    license_expiry?: string;
    insurance_number?: string;
    insurance_expiry?: string;
    experience_years?: number;
    background_check_passed?: boolean;
    vehicle_insurance_verified?: boolean;
    pco_license_verified?: boolean;
    address_verified?: boolean;
    phone_verified?: boolean;
    email_verified?: boolean;
  };
  
  // Performance metrics
  performance: {
    rating: number;
    total_rentals: number;
    completed_rentals: number;
    cancelled_rentals: number;
    total_earnings: number;
    average_rating: number;
    last_rental_date?: string;
    first_rental_date?: string;
  };
  
  // Admin approval status
  admin_approval: {
    approved_by_admin: boolean;
    admin_approval_date?: string;
    admin_notes?: string;
    rejection_reason?: string;
    documents_reviewed: boolean;
    background_check_approved: boolean;
    insurance_verified: boolean;
    license_verified: boolean;
  };
}

interface DriverVerificationStats {
  total_drivers: number;
  verified_drivers: number;
  pending_verification: number;
  admin_approved: number;
  admin_pending: number;
  admin_rejected: number;
  active_drivers: number;
  inactive_drivers: number;
}

const VERIFICATION_STATUS_COLORS = {
  verified: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  incomplete: 'bg-gray-100 text-gray-800'
};

const ADMIN_STATUS_COLORS = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function DriverVerificationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [driverVerifications, setDriverVerifications] = useState<DriverVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<DriverVerification[]>([]);
  const [stats, setStats] = useState<DriverVerificationStats>({
    total_drivers: 0,
    verified_drivers: 0,
    pending_verification: 0,
    admin_approved: 0,
    admin_pending: 0,
    admin_rejected: 0,
    active_drivers: 0,
    inactive_drivers: 0
  });
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadDriverVerifications = async () => {
    try {
      setLoading(true);

      if (!user) return;

      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      if (!partnerId) {
        setDriverVerifications([]);
        setFilteredVerifications([]);
        calculateStats([]);
        return;
      }

      // Fetch all drivers who have interacted with this partner
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('driver_id')
        .eq('partner_id', partnerId)
        .not('driver_id', 'is', null);

      if (bookingsError || !bookingsData) {
        setDriverVerifications([]);
        setFilteredVerifications([]);
        calculateStats([]);
        return;
      }

      // Get unique driver IDs
      const uniqueDriverIds = [...new Set(bookingsData.map(b => b.driver_id))];

      if (uniqueDriverIds.length === 0) {
        setDriverVerifications([]);
        setFilteredVerifications([]);
        calculateStats([]);
        return;
      }

      // Fetch driver details
      const { data: driversData, error: driversError } = await supabase
        .from('users')
        .select('*')
        .in('id', uniqueDriverIds)
        .eq('role', 'DRIVER');

      if (driversError || !driversData) {
        setDriverVerifications([]);
        setFilteredVerifications([]);
        calculateStats([]);
        return;
      }

      // Enrich with verification and performance data
      const transformedVerifications: DriverVerification[] = await Promise.all(
        driversData.map(async (driver: any) => {
          // Get driver's booking history with this partner
          const { data: driverBookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('partner_id', partnerId)
            .eq('driver_id', driver.id);

          const bookings = driverBookings || [];
          const completedBookings = bookings.filter((b: any) => b.status === 'completed');
          const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled');
          const totalEarnings = completedBookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);
          const averageRating = completedBookings.reduce((sum: number, b: any) => sum + (b.driver_rating || 0), 0) / completedBookings.length || 0;

          const verification: DriverVerification = {
            id: driver.id,
            driver_id: driver.id,
            partner_id: partnerId,
            full_name: driver.full_name || driver.name || '',
            email: driver.email || '',
            phone: driver.phone || '',
            verified: driver.verified || false,
            is_approved: driver.is_approved || false,
            is_active: driver.is_active || false,
            created_at: driver.created_at,
            updated_at: driver.updated_at,

            verification: {
              documents_uploaded: Boolean(driver.documents_uploaded),
              license_number: driver.license_number || '',
              license_expiry: driver.license_expiry || '',
              insurance_number: driver.insurance_number || '',
              insurance_expiry: driver.insurance_expiry || '',
              experience_years: Number(driver.experience_years) || 0,
              background_check_passed: Boolean(driver.background_check_passed),
              vehicle_insurance_verified: Boolean(driver.vehicle_insurance_verified),
              pco_license_verified: Boolean(driver.pco_license_verified),
              address_verified: Boolean(driver.address_verified),
              phone_verified: Boolean(driver.phone_verified),
              email_verified: Boolean(driver.email_verified),
            },

            performance: {
              rating: Number(driver.rating) || 0,
              total_rentals: bookings.length,
              completed_rentals: completedBookings.length,
              cancelled_rentals: cancelledBookings.length,
              total_earnings: totalEarnings,
              average_rating: averageRating,
              last_rental_date: bookings.length > 0 ? bookings[bookings.length - 1].created_at : undefined,
              first_rental_date: bookings.length > 0 ? bookings[0].created_at : undefined,
            },

            admin_approval: {
              approved_by_admin: Boolean(driver.approved_by_admin),
              admin_approval_date: driver.admin_approval_date || '',
              admin_notes: driver.admin_notes || '',
              rejection_reason: driver.rejection_reason || '',
              documents_reviewed: Boolean(driver.documents_reviewed),
              background_check_approved: Boolean(driver.background_check_approved),
              insurance_verified: Boolean(driver.insurance_verified),
              license_verified: Boolean(driver.license_verified),
            },
          };

          return verification;
        })
      );

      setDriverVerifications(transformedVerifications);
      setFilteredVerifications(transformedVerifications);
      calculateStats(transformedVerifications);
    } catch (err) {
      console.error('Error loading driver verifications:', err);
      setDriverVerifications([]);
      setFilteredVerifications([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (verifications: DriverVerification[]) => {
    const totalDrivers = verifications.length;
    const verifiedDrivers = verifications.filter(v => v.verified).length;
    const pendingVerification = verifications.filter(v => !v.verified).length;
    const adminApproved = verifications.filter(v => v.admin_approval.approved_by_admin).length;
    const adminPending = verifications.filter(v => !v.admin_approval.approved_by_admin && v.verified).length;
    const adminRejected = verifications.filter(v => v.admin_approval.rejection_reason).length;
    const activeDrivers = verifications.filter(v => v.is_active).length;
    const inactiveDrivers = verifications.filter(v => !v.is_active).length;

    setStats({
      total_drivers: totalDrivers,
      verified_drivers: verifiedDrivers,
      pending_verification: pendingVerification,
      admin_approved: adminApproved,
      admin_pending: adminPending,
      admin_rejected: adminRejected,
      active_drivers: activeDrivers,
      inactive_drivers: inactiveDrivers
    });
  };

  useEffect(() => {
    let filtered = [...driverVerifications];

    if (searchTerm) {
      filtered = filtered.filter(verification =>
        verification.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.phone.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (verificationFilter !== 'all') {
      filtered = filtered.filter(verification => {
        switch (verificationFilter) {
          case 'verified':
            return verification.verified;
          case 'pending':
            return !verification.verified;
          case 'incomplete':
            return !verification.verification.documents_uploaded;
          default:
            return true;
        }
      });
    }

    if (adminStatusFilter !== 'all') {
      filtered = filtered.filter(verification => {
        switch (adminStatusFilter) {
          case 'approved':
            return verification.admin_approval.approved_by_admin;
          case 'pending':
            return !verification.admin_approval.approved_by_admin && verification.verified;
          case 'rejected':
            return verification.admin_approval.rejection_reason;
          default:
            return true;
        }
      });
    }

    if (activityFilter !== 'all') {
      filtered = filtered.filter(verification => {
        switch (activityFilter) {
          case 'active':
            return verification.is_active;
          case 'inactive':
            return !verification.is_active;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'full_name':
          aValue = a.full_name;
          bValue = b.full_name;
          break;
        case 'rating':
          aValue = a.performance.rating;
          bValue = b.performance.rating;
          break;
        case 'total_rentals':
          aValue = a.performance.total_rentals;
          bValue = b.performance.total_rentals;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredVerifications(filtered);
    setCurrentPage(1);
  }, [driverVerifications, searchTerm, verificationFilter, adminStatusFilter, activityFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    loadDriverVerifications();
  }, [user, authLoading]);

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

  if (!user) return null;

  const totalPages = Math.ceil(filteredVerifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVerifications = filteredVerifications.slice(startIndex, endIndex);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-GB');
  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  const formatRating = (rating: number) => rating.toFixed(1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver verifications...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Driver Verification</h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor driver verification status and admin approval
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                <FaChartLine className="w-4 h-4 mr-2" />
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaUsers className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_drivers}</p>
                <p className="text-xs text-blue-600">All drivers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaUserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified_drivers}</p>
                <p className="text-xs text-green-600">Documents verified</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaHourglassHalf className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_verification}</p>
                <p className="text-xs text-yellow-600">Awaiting verification</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaShieldAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admin_approved}</p>
                <p className="text-xs text-purple-600">Fully approved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500 p-3 rounded-lg">
                <FaUserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admin_pending}</p>
                <p className="text-xs text-indigo-600">Awaiting admin review</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaUserTimes className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admin_rejected}</p>
                <p className="text-xs text-red-600">Rejected by admin</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-teal-500 p-3 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_drivers}</p>
                <p className="text-xs text-teal-600">Currently active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Driver Verifications</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drivers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="incomplete">Incomplete</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Status</label>
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Admin Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Status</label>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Activity</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="created_at-desc">Registration Date (Recent)</option>
                  <option value="created_at-asc">Registration Date (Oldest)</option>
                  <option value="full_name-asc">Name (A-Z)</option>
                  <option value="rating-desc">Rating (High-Low)</option>
                  <option value="total_rentals-desc">Rentals (High-Low)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Driver Verifications ({filteredVerifications.length})
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredVerifications.length)} of {filteredVerifications.length} drivers
                </p>
              </div>
            </div>
          </div>

          {currentVerifications.length === 0 ? (
            <div className="text-center py-12">
              <FaShieldAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No driver verifications found</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">
                {filteredVerifications.length === 0 && driverVerifications.length > 0
                  ? 'Try adjusting your filters to see more results.'
                  : 'You don\'t have any drivers yet.'}
              </p>
              {driverVerifications.length === 0 && (
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/partner/bookings')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <FaCalendarAlt className="w-4 h-4 mr-2" />
                    View All Bookings
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver Information
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin Approval
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentVerifications.map((verification) => (
                    <tr key={verification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <FaUserCircle className="h-10 w-10 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {verification.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {verification.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {verification.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            verification.verified ? VERIFICATION_STATUS_COLORS.verified : VERIFICATION_STATUS_COLORS.pending
                          }`}>
                            {verification.verified ? 'Verified' : 'Pending'}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            {verification.verification.documents_uploaded ? 'Documents uploaded' : 'Documents pending'}
                          </div>
                          {verification.verification.license_number && (
                            <div className="text-xs text-gray-500">
                              License: {verification.verification.license_number}
                            </div>
                          )}
                          {verification.verification.experience_years > 0 && (
                            <div className="text-xs text-gray-500">
                              {verification.verification.experience_years} years experience
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            verification.admin_approval.approved_by_admin 
                              ? ADMIN_STATUS_COLORS.approved 
                              : verification.admin_approval.rejection_reason 
                                ? ADMIN_STATUS_COLORS.rejected 
                                : ADMIN_STATUS_COLORS.pending
                          }`}>
                            {verification.admin_approval.approved_by_admin 
                              ? 'Approved' 
                              : verification.admin_approval.rejection_reason 
                                ? 'Rejected' 
                                : 'Pending'}
                          </span>
                          {verification.admin_approval.admin_approval_date && (
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDate(verification.admin_approval.admin_approval_date)}
                            </div>
                          )}
                          {verification.admin_approval.rejection_reason && (
                            <div className="text-xs text-red-600 mt-1">
                              {verification.admin_approval.rejection_reason}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {verification.performance.total_rentals} rentals
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(verification.performance.total_earnings)} earned
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                            {formatRating(verification.performance.rating)}
                          </div>
                          {verification.performance.last_rental_date && (
                            <div className="text-xs text-gray-500">
                              Last rental: {formatDate(verification.performance.last_rental_date)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <FaUserCheck className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <FaUserTimes className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredVerifications.length)} of {filteredVerifications.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium border rounded-lg ${
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 