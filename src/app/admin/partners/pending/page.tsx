'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { FaBuilding, FaSearch, FaEye, FaCheckCircle, FaTimesCircle, FaList, FaTh } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PendingPartner {
  id: string;
  company_name: string | null;
  email: string | null;
  status: string | null;
  approval_status: string | null;
  created_at: string | null;
  business_type?: string | null;
  location?: string | null;
  address?: string | null;
  fleet_size?: number | null;
  estimated_vehicle_count?: number | null;
  commission_rate?: number | null;
  documents?: any;
  contact_person?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  business_email?: string | null;
  director_name?: string | null;
  director_email?: string | null;
  director_phone?: string | null;
  city?: string | null;
  postal_code?: string | null;
  documents_approved?: boolean;
  business_approved?: boolean;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_reason?: string | null;
}

interface DocumentInfo {
  status: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  url?: string;
  uploaded_at?: string;
}

export default function PartnersPendingPage() {
  const { user } = useAdmin();
  
  // Debug function to check user permissions
  const checkUserPermissions = () => {
    console.log('=== User Permission Debug ===');
    console.log('User:', user);
    console.log('User ID:', user?.id);
    console.log('User Email:', user?.email);
    console.log('User Role:', user?.role);
    console.log('User Name:', user?.name);
    console.log('Is Admin:', user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');
    console.log('===========================');
  };
  
  // Check permissions on component mount
  useEffect(() => {
    checkUserPermissions();
  }, [user]);

  const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<PendingPartner | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingDocument, setProcessingDocument] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [processingApproval, setProcessingApproval] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const handleDocumentAction = async (partnerId: string, documentType: string, action: 'approve' | 'reject') => {
    setProcessingDocument(true);
    try {
      // First, get the current documents data
      const { data: currentPartner, error: fetchError } = await supabase
        .from('partners')
        .select('documents')
        .eq('id', partnerId)
        .single();

      if (fetchError) throw fetchError;

      // Update document status in partner record
      const currentDocuments = (currentPartner?.documents as any) || {};
      const updatedDocuments = {
        ...currentDocuments,
        [documentType]: {
          ...(currentDocuments[documentType] as any),
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.name || 'Admin',
          ...(action === 'reject' && {
            rejection_reason: prompt('Please provide a reason for rejection:') || 'No reason provided'
          })
        }
      };

      const { error } = await supabase
        .from('partners')
        .update({
          documents: updatedDocuments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', partnerId);

      if (error) throw error;

      // Refresh the partners list to show updated document status
      const { data: updatedPartners, error: refreshError } = await supabase
        .from('partners')
        .select(`
          id,
          company_name,
          email,
          status,
          approval_status,
          created_at,
          business_type,
          location,
          fleet_size,
          estimated_vehicle_count,
          commission_rate,
          documents,
          contact_person,
          contact_name,
          phone,
          business_email,
          director_name,
          director_email,
          director_phone,
          address,
          city,
          postal_code,
          documents_approved,
          business_approved,
          approved_at,
          approved_by,
          rejected_at,
          rejected_by,
          rejection_reason
        `)
        .order('created_at', { ascending: false });

      if (!refreshError && updatedPartners) {
        setPendingPartners((updatedPartners as any) as PendingPartner[]);
        // Update the selected partner with full data including documents
        const updatedPartner = (updatedPartners as any).find((p: any) => p.id === partnerId);
        if (updatedPartner) {
          setSelectedPartner((updatedPartner as any) as PendingPartner);
        }
      }

      toast.success(`Document ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error: any) {
      console.error('Error updating document:', error);
      toast.error(`Failed to ${action} document: ${error.message}`);
    } finally {
      setProcessingDocument(false);
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'pending_review': return 'bg-blue-500/20 text-blue-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleApprovePartner = async (partnerId: string) => {
    setProcessingApproval(true);
    try {
      // Debug: Log user information
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      console.log('User metadata:', user);
      
      const { error } = await supabase
        .from('partners')
        .update({
          status: 'active',
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.name || 'Admin',
          business_approved: true,
          documents_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);
      
      if (error) {
        console.error('Approval error:', error);
        throw error;
      }

      // Refresh the partners list
      const { data: updatedPartners, error: refreshError } = await supabase
        .from('partners')
        .select('id, company_name, email, status, approval_status, created_at')
        .order('created_at', { ascending: false });
      
      if (!refreshError && updatedPartners) {
        setPendingPartners(updatedPartners as PendingPartner[]);
      }

      alert('Partner approved successfully');
      setShowApprovalModal(false);
      setShowDetailsModal(false);
    } catch (error: any) {
      alert(`Failed to approve partner: ${error.message}`);
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleRejectPartner = async (partnerId: string, reason: string) => {
    setProcessingApproval(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          status: 'rejected',
          approval_status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user?.name || 'Admin',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);
      
      if (error) throw error;

      // Refresh the partners list
      const { data: updatedPartners, error: refreshError } = await supabase
        .from('partners')
        .select('id, company_name, email, status, approval_status, created_at')
        .order('created_at', { ascending: false });
      
      if (!refreshError && updatedPartners) {
        setPendingPartners(updatedPartners as PendingPartner[]);
      }

      alert('Partner rejected');
      setShowApprovalModal(false);
      setShowDetailsModal(false);
    } catch (error: any) {
      alert(`Failed to reject partner: ${error.message}`);
    } finally {
      setProcessingApproval(false);
    }
  };

  useEffect(() => {
    const loadPendingPartners = async () => {
      try {
        const { data, error } = await supabase
          .from('partners')
          .select(`
            id,
            company_name,
            email,
            status,
            approval_status,
            created_at,
            business_type,
            location,
            fleet_size,
            estimated_vehicle_count,
            commission_rate,
            documents,
            contact_person,
            contact_name,
            phone,
            business_email,
            director_name,
            director_email,
            director_phone,
            address,
            city,
            postal_code,
            documents_approved,
            business_approved,
            approved_at,
            approved_by,
            rejected_at,
            rejected_by,
            rejection_reason
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPendingPartners((data as any) as PendingPartner[]);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingPartners();
  }, []);

  const filteredPartners = useMemo(() => {
    return pendingPartners.filter(partner => {
      const matchesSearch = 
        (partner.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (partner.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (partner.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      const matchesStatus = filterStatus === 'all' || partner.approval_status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [pendingPartners, searchTerm, filterStatus]);

  // Calculate statistics
  const stats = {
    total: pendingPartners.length,
    pending: pendingPartners.filter(p => p.approval_status === 'pending').length,
    under_review: pendingPartners.filter(p => p.approval_status === 'under_review').length,
    documents_requested: pendingPartners.filter(p => p.approval_status === 'documents_requested').length,
    approved: pendingPartners.filter(p => p.approval_status === 'approved').length,
    rejected: pendingPartners.filter(p => p.approval_status === 'rejected').length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>You need to be logged in.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Partner Applications</h1>
        <p className="text-gray-600 dark:text-slate-400">({filteredPartners.length} of {pendingPartners.length} total)</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-1">Total</h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        </div>
        
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-1">Pending</h3>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
        </div>
        
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-1">Under Review</h3>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.under_review}</div>
        </div>
        
        <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
          <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-1">Rejected</h3>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-3 text-gray-400 dark:text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by company name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="pending_review">Pending Review</option>
          <option value="documents_requested">Documents Requested</option>
          <option value="under_verification">Under Verification</option>
          <option value="active">Active</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Grid View"
          >
            <FaTh className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="List View"
          >
            <FaList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-400">Loading partners…</p>
        </div>
      ) : (
        <>
          {filteredPartners.length === 0 ? (
            <div className="text-center text-slate-400">
              {pendingPartners.length === 0 
                ? "No partners found in database."
                : "No partners match your search/filter criteria."
              }
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredPartners.map((p) => {
                    // Helper values
                    const appliedDate = p.created_at ? new Date(p.created_at) : null;
                    const daysWaiting = appliedDate ? Math.floor((Date.now() - appliedDate.getTime())/(1000*60*60*24)) : null;
                    const docsComplete = p.documents ? 100 : 0; // simple placeholder
                    return (
                      <div
                        key={p.id}
                        className="bg-gray-100 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-slate-700 rounded-2xl p-6 cursor-pointer hover:border-gray-300 dark:hover:border-slate-600 transition-colors relative"
                        onClick={() => {
                          setSelectedPartner(p);
                          setShowDetailsModal(true);
                        }}
                      >
                        {/* Status badge */}
                        <span className="absolute top-4 right-4 text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-full capitalize">
                          {p.status || 'pending'}
                        </span>
                        
                        {/* Company info */}
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {p.company_name || 'Unnamed Company'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {p.email || 'No email'}
                          </p>
                        </div>
                        
                        {/* Contact person */}
                        {p.contact_name && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                              Contact: {p.contact_name}
                            </p>
                          </div>
                        )}
                        
                        {/* Application date */}
                        {appliedDate && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-600 dark:text-slate-400">
                              Applied: {appliedDate.toLocaleDateString()}
                              {daysWaiting !== null && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({daysWaiting} days ago)
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {/* Quick actions */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPartner(p);
                              setShowDetailsModal(true);
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <FaEye /> View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Applied
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                        {filteredPartners.map((p) => {
                          const appliedDate = p.created_at ? new Date(p.created_at) : null;
                          const daysWaiting = appliedDate ? Math.floor((Date.now() - appliedDate.getTime())/(1000*60*60*24)) : null;
                          
                          return (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {p.company_name || 'Unnamed Company'}
                                  </div>
                                  {p.business_type && (
                                    <div className="text-sm text-gray-500 dark:text-slate-400">
                                      {p.business_type}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {p.contact_name || p.contact_person || 'N/A'}
                                </div>
                                {p.phone && (
                                  <div className="text-sm text-gray-500 dark:text-slate-400">
                                    {p.phone}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {p.email || 'N/A'}
                                </div>
                                {p.business_email && (
                                  <div className="text-sm text-gray-500 dark:text-slate-400">
                                    {p.business_email}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  p.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  p.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                  p.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}>
                                  {p.status || 'pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {appliedDate ? (
                                  <div>
                                    <div>{appliedDate.toLocaleDateString()}</div>
                                    {daysWaiting !== null && (
                                      <div className="text-xs text-gray-500 dark:text-slate-400">
                                        {daysWaiting} days ago
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => {
                                    setSelectedPartner(p);
                                    setShowDetailsModal(true);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <FaEye /> View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Partner Details</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-slate-400">Company Name</label>
                    <div className="text-gray-900 dark:text-white">{selectedPartner.company_name || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-slate-400">Email</label>
                    <div className="text-gray-900 dark:text-white">{selectedPartner.email || 'Not provided'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-slate-400">Status</label>
                    <div className="text-gray-900 dark:text-white">{selectedPartner.status || 'Unknown'}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-slate-400">Created</label>
                    <div className="text-gray-900 dark:text-white">
                      {selectedPartner.created_at ? new Date(selectedPartner.created_at).toLocaleString() : 'Not available'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Additional Information</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    <span className="text-gray-500 dark:text-slate-400">Partner ID:</span> {selectedPartner.id}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    <span className="text-gray-500 dark:text-slate-400">Days since application:</span> {
                      selectedPartner.created_at 
                        ? Math.floor((new Date().getTime() - new Date(selectedPartner.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        : 'Unknown'
                    } days
                  </p>
                </div>
              </div>

              {/* Document Management */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Document Management</h3>
                <div className="space-y-4">
                  {selectedPartner.documents ? (
                    Object.entries(selectedPartner.documents).map(([docType, doc]) => {
                      const documentInfo = doc as DocumentInfo;
                      const status = documentInfo.status || 'pending_review';
                      
                      return (
                        <div key={docType} className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="text-gray-900 dark:text-white font-medium">
                                {docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </h4>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getDocumentStatusColor(status)}`}>
                                {status.replace('_', ' ')}
                              </span>
                            </div>
                            {status === 'pending_review' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDocumentAction(selectedPartner.id, docType, 'approve')}
                                  disabled={processingDocument}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-sm flex items-center gap-1"
                                >
                                  <FaCheckCircle /> Approve
                                </button>
                                <button
                                  onClick={() => handleDocumentAction(selectedPartner.id, docType, 'reject')}
                                  disabled={processingDocument}
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded text-sm flex items-center gap-1"
                                >
                                  <FaTimesCircle /> Reject
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {documentInfo.url && (
                            <button
                              onClick={() => window.open(documentInfo.url, '_blank')}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm flex items-center gap-1"
                            >
                              <FaEye /> View Document
                            </button>
                          )}
                          
                          {documentInfo.uploaded_at && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                              Uploaded: {new Date(documentInfo.uploaded_at).toLocaleDateString()}
                            </p>
                          )}
                          
                          {documentInfo.reviewed_at && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                              Reviewed: {new Date(documentInfo.reviewed_at).toLocaleDateString()} by {documentInfo.reviewed_by}
                            </p>
                          )}
                          
                          {documentInfo.rejection_reason && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                              Rejected: {documentInfo.rejection_reason}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-4">
                      <p className="text-gray-600 dark:text-slate-400 text-center">
                        No documents uploaded yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex gap-2">
                {selectedPartner.status === 'pending' || selectedPartner.status === 'pending_review' ? (
                  <>
                    <button
                      onClick={() => {
                        setApprovalAction('approve');
                        setShowApprovalModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaCheckCircle /> Approve Partner
                    </button>
                    <button
                      onClick={() => {
                        setApprovalAction('reject');
                        setShowApprovalModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaTimesCircle /> Reject Partner
                    </button>
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-slate-400 text-sm">
                    Status: {selectedPartner.status}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Approval/Rejection Modal */}
      {showApprovalModal && selectedPartner && approvalAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Partner Application
              </h2>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 dark:text-slate-300 mb-4">
                {approvalAction === 'approve' 
                  ? `Are you sure you want to approve ${selectedPartner.company_name}?`
                  : 'Please provide a reason for rejecting this application:'
                }
              </p>
              
              {approvalAction === 'reject' && (
                <textarea
                  id="rejection-reason"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter rejection reason..."
                />
              )}
              
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalAction(null);
                  }}
                  className="px-4 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (approvalAction === 'approve') {
                      handleApprovePartner(selectedPartner.id);
                    } else {
                      const reason = (document.getElementById('rejection-reason') as HTMLTextAreaElement)?.value;
                      if (!reason) {
                        alert('Please provide a rejection reason');
                        return;
                      }
                      handleRejectPartner(selectedPartner.id, reason);
                    }
                  }}
                  disabled={processingApproval}
                  className={`${approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50`}
                >
                  {processingApproval ? 'Processing...' : `${approvalAction === 'approve' ? 'Approve' : 'Reject'} Application`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 