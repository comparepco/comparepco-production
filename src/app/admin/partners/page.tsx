'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHandshake, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes,
  FaCheck, FaTimes as FaX, FaUserTie, FaUserCog, FaUserShield, FaClock,
  FaBan, FaPause, FaPlay
} from 'react-icons/fa';

interface Partner {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  contact_name?: string;
  contact_person?: string;
  business_email?: string;
  director_name?: string;
  director_email?: string;
  director_phone?: string;
  status: 'active' | 'pending' | 'suspended';
  approval_status?: 'pending' | 'approved' | 'rejected';
  join_date: string;
  total_bookings: number;
  total_revenue: number;
  rating: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  fleet_size?: number;
  estimated_monthly_rides?: number;
  commission_rate?: number;
}

export default function PartnersPage() {
  const { 
    canView, 
    canEdit, 
    canDelete, 
    getPermissionLevel,
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  // Removed debug/testing code

  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVerified, setFilterVerified] = useState('');

  const canViewPartners = canView('partners');
  const hasAccess = canViewPartners;

  useEffect(() => {
    if (canViewPartners) {
      loadPartners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewPartners]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      console.log('Loading partners...');
      const { data, error } = await supabase
        .from('partners')
        .select(`
          id,
          company_name,
          contact_name,
          contact_person,
          email,
          phone,
          business_email,
          director_name,
          director_email,
          director_phone,
          status,
          approval_status,
          created_at,
          updated_at,
          fleet_size,
          estimated_monthly_rides,
          commission_rate,
          total_earnings,
          completed_bookings,
          rating
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      // Transform data to match interface
      const transformedPartners = (data || []).map(partner => ({
        ...partner,
        name: partner.contact_name || partner.company_name || 'Unknown',
        join_date: partner.created_at,
        total_bookings: partner.completed_bookings || 0,
        total_revenue: partner.total_earnings || 0,
        rating: partner.rating || 0,
        is_verified: partner.approval_status === 'approved'
      }));
      
      console.log('Partners loaded:', transformedPartners.length, 'partners');
      setPartners(transformedPartners);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Failed to load partners');
      setPartners([]); // Ensure we have an empty array
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!canDelete('partners')) {
      toast.error('You don\'t have permission to delete partners');
      return;
    }

    if (!confirm('Are you sure you want to delete this partner?')) return;

    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Partner deleted successfully');
      loadPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast.error('Failed to delete partner');
    }
  };

  const handleEditPartner = (partner: Partner) => {
    if (!canEdit('partners')) {
      toast.error('You don\'t have permission to edit partners');
      return;
    }
    // Navigate to edit page
    window.open(`/admin/partners/${partner.id}/edit`, '_blank');
  };

  const handleViewPartner = (partner: Partner) => {
    if (!canView('partners')) {
      toast.error('You don\'t have permission to view partners');
      return;
    }
    // Navigate to partner details page
    window.open(`/admin/partners/${partner.id}`, '_blank');
  };

  const handleDeactivatePartner = async (partner: Partner) => {
    if (!canEdit('partners')) {
      toast.error('You don\'t have permission to deactivate partners');
      return;
    }

    if (!confirm(`Are you sure you want to deactivate ${partner.company_name || 'this partner'}? This will prevent them from accessing the platform.`)) return;

    try {
      const { error } = await supabase
        .from('partners')
        .update({
          status: 'suspended',
          approval_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (error) throw error;

      // Also update the associated user account
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (userError) {
        console.error('Error updating user account:', userError);
        // Don't throw here as the partner was already updated
      }

      toast.success(`${partner.company_name || 'Partner'} has been deactivated successfully`);
      loadPartners();
    } catch (error) {
      console.error('Error deactivating partner:', error);
      toast.error('Failed to deactivate partner');
    }
  };

  const handleSuspendPartner = async (partner: Partner) => {
    if (!canEdit('partners')) {
      toast.error('You don\'t have permission to suspend partners');
      return;
    }

    if (!confirm(`Are you sure you want to suspend ${partner.company_name || 'this partner'}? This will temporarily disable their account.`)) return;

    try {
      const { error } = await supabase
        .from('partners')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (error) throw error;

      // Also update the associated user account
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (userError) {
        console.error('Error updating user account:', userError);
        // Don't throw here as the partner was already updated
      }

      toast.success(`${partner.company_name || 'Partner'} has been suspended successfully`);
      loadPartners();
    } catch (error) {
      console.error('Error suspending partner:', error);
      toast.error('Failed to suspend partner');
    }
  };

  const handleActivatePartner = async (partner: Partner) => {
    if (!canEdit('partners')) {
      toast.error('You don\'t have permission to activate partners');
      return;
    }

    if (!confirm(`Are you sure you want to activate ${partner.company_name || 'this partner'}? This will restore their access to the platform.`)) return;

    try {
      const { error } = await supabase
        .from('partners')
        .update({
          status: 'active',
          approval_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (error) throw error;

      // Also update the associated user account
      const { error: userError } = await supabase
        .from('users')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', partner.id);

      if (userError) {
        console.error('Error updating user account:', userError);
        // Don't throw here as the partner was already updated
      }

      toast.success(`${partner.company_name || 'Partner'} has been activated successfully`);
      loadPartners();
    } catch (error) {
      console.error('Error activating partner:', error);
      toast.error('Failed to activate partner');
    }
  };

  const filteredPartners = partners?.filter(partner => {
    // Ensure partner exists and has required properties
    if (!partner) return false;
    
    const matchesSearch = (partner.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (partner.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (partner.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || partner.status === filterStatus;
    const matchesVerified = filterVerified === '' || 
                           (filterVerified === 'verified' && partner.is_verified) ||
                           (filterVerified === 'unverified' && !partner.is_verified);

    return matchesSearch && matchesStatus && matchesVerified;
  }) || [];

  const stats = {
    total: partners?.length || 0,
    active: partners?.filter(p => p?.status === 'active').length || 0,
    pending: partners?.filter(p => p?.status === 'pending').length || 0,
    verified: partners?.filter(p => p?.is_verified).length || 0,
    totalRevenue: partners?.reduce((sum, p) => sum + (p?.total_revenue || 0), 0) || 0
  };

  // Check if user has any access to partners
  if (!hasAccess) {
    return (
      <ProtectedRoute requiredPermission="partners" requiredLevel="view">
        <></>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading partners...</p>
        </div>
      </div>
    );
  }

  // Check if there are no partners
  if (!partners || partners.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaHandshake className="w-8 h-8 mr-3 text-orange-600 dark:text-orange-400" />
                  Partners Management
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Manage partner accounts, approvals, and business relationships
                </p>
              </div>
              {canEdit('partners') && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center">
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Partner
                </button>
              )}
            </div>
          </div>

          {/* Empty State */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <FaHandshake className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Partners Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by adding your first partner to the system.
            </p>
            {canEdit('partners') && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto">
                <FaPlus className="w-4 h-4 mr-2" />
                Add Your First Partner
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaHandshake className="w-8 h-8 mr-3 text-orange-600 dark:text-orange-400" />
                Partners Management
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage partner accounts, approvals, and business relationships
              </p>
            </div>
            {canEdit('partners') && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center">
                <FaPlus className="w-4 h-4 mr-2" />
                Add Partner
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FaUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Partners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FaCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FaShieldAlt className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verified</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.verified}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  £{(stats.totalRevenue / 1000).toFixed(1)}k
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification
                </label>
                <select
                  value={filterVerified}
                  onChange={(e) => setFilterVerified(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Partners</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                            <FaUser className="w-5 h-5 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {partner.contact_name || partner.company_name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {partner.email || 'No email'}
                          </div>
                          {partner.director_name && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Director: {partner.director_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {partner.company_name || 'Unknown Company'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {partner.phone || 'No phone'}
                      </div>
                      {partner.business_email && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {partner.business_email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          partner.status === 'suspended'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : partner.approval_status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : partner.approval_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : partner.approval_status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {partner.status === 'suspended' ? 'Suspended' : (partner.approval_status || 'pending')}
                        </span>
                        {partner.status === 'active' && partner.approval_status === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {partner.total_bookings || 0} bookings
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        £{((partner.total_revenue || 0) / 1000).toFixed(1)}k revenue
                      </div>
                      <div className="flex items-center mt-1">
                        <FaStar className="w-3 h-3 text-yellow-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          {(partner.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {partner.join_date ? new Date(partner.join_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewPartner(partner)}
                          className={`text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 ${
                            !canView('partners') ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={!canView('partners')}
                          title="View Partner Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditPartner(partner)}
                          className={`text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ${
                            !canEdit('partners') ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={!canEdit('partners')}
                          title="Edit Partner"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        
                        {/* Status-specific actions */}
                        {partner.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleSuspendPartner(partner)}
                              className={`text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 ${
                                !canEdit('partners') ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={!canEdit('partners')}
                              title="Suspend Partner"
                            >
                              <FaPause className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeactivatePartner(partner)}
                              className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                                !canEdit('partners') ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={!canEdit('partners')}
                              title="Deactivate Partner"
                            >
                              <FaBan className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {partner.status === 'suspended' && (
                          <button
                            onClick={() => handleActivatePartner(partner)}
                            className={`text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 ${
                              !canEdit('partners') ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!canEdit('partners')}
                            title="Activate Partner"
                          >
                            <FaPlay className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeletePartner(partner.id)}
                          className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${
                            !canDelete('partners') ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={!canDelete('partners')}
                          title="Delete Partner"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permission Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Your Permissions for Partners
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p>View: {canView('partners') ? '✅' : '❌'}</p>
            <p>Edit: {canEdit('partners') ? '✅' : '❌'}</p>
            <p>Delete: {canDelete('partners') ? '✅' : '❌'}</p>
            <p>Permission Level: {getPermissionLevel('partners')}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 