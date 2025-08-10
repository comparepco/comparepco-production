'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaEye, FaSearch, FaFilter, FaClock, FaDownload, FaUser, FaUsers, FaCar, FaIdCard, FaHome, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface DocumentVerification {
  driver_id: string;
  driver_name: string;
  driver_email: string;
  documents: {
    driving_license: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
      expiry_date?: string;
      file_url?: string;
      rejection_reason?: string;
    };
    insurance: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
      expiry_date?: string;
      file_url?: string;
      rejection_reason?: string;
    };
    pco_license: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
      expiry_date?: string;
      file_url?: string;
      rejection_reason?: string;
    };
    proof_of_address: {
      status: 'approved' | 'pending' | 'rejected' | 'missing';
      upload_date?: string;
      file_url?: string;
      rejection_reason?: string;
    };
  };
  overall_status: 'complete' | 'incomplete' | 'pending_review' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  last_updated: string;
}

interface VerificationAction {
  document_type: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export default function DriverVerificationPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [verifications, setVerifications] = useState<DocumentVerification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<DocumentVerification | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDocument, setFilterDocument] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  // Load verification data from Supabase
  useEffect(() => {
    const loadVerifications = async () => {
      setIsLoading(true);
      try {
        const { data: driversData, error } = await supabase
          .from('drivers')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error loading verifications:', error);
          toast.error('Failed to load verifications');
        } else {
          const verificationsData = (driversData || []).map(driver => ({
            driver_id: driver.id,
            driver_name: driver.full_name || driver.email,
            driver_email: driver.email,
            documents: driver.documents || {
              driving_license: { status: 'missing' },
              insurance: { status: 'missing' },
              pco_license: { status: 'missing' },
              proof_of_address: { status: 'missing' },
            },
            overall_status: calculateOverallStatus(driver.documents),
            submitted_at: driver.created_at,
            reviewed_at: driver.reviewed_at,
            reviewed_by: driver.reviewed_by,
            last_updated: driver.updated_at,
          })) as DocumentVerification[];
          
          setVerifications(verificationsData);
        }
      } catch (error) {
        console.error('Error loading verifications:', error);
        toast.error('Failed to load verifications');
      } finally {
        setIsLoading(false);
      }
    };

    loadVerifications();
  }, []);

  const calculateOverallStatus = (documents: any) => {
    if (!documents) return 'incomplete';
    
    const docStatuses = Object.values(documents);
    const hasPending = docStatuses.some((doc: any) => doc.status === 'pending');
    const hasRejected = docStatuses.some((doc: any) => doc.status === 'rejected');
    const allApproved = docStatuses.every((doc: any) => doc.status === 'approved');
    const allMissing = docStatuses.every((doc: any) => doc.status === 'missing');
    
    if (allApproved) return 'complete';
    if (hasRejected) return 'rejected';
    if (hasPending) return 'pending_review';
    if (allMissing) return 'incomplete';
    return 'incomplete';
  };

  const handleDocumentAction = async (verification: DocumentVerification, documentType: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setProcessingAction(true);
      
      const updateData = {
        [`documents.${documentType}.status`]: action === 'approve' ? 'approved' : 'rejected',
        [`documents.${documentType}.reviewed_at`]: new Date().toISOString(),
        [`documents.${documentType}.reviewed_by`]: authUser?.email || 'Admin',
        updated_at: new Date().toISOString(),
      };

      if (action === 'reject' && reason) {
        updateData[`documents.${documentType}.rejection_reason`] = reason;
      }

      const { error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', verification.driver_id);

      if (error) {
        throw error;
      }
      
      toast.success(`Document ${action}ed successfully`);
      setShowModal(false);
      setRejectionReason('');
      
      // Refresh data
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (driversData) {
        const verificationsData = driversData.map(driver => ({
          driver_id: driver.id,
          driver_name: driver.full_name || driver.email,
          driver_email: driver.email,
          documents: driver.documents || {
            driving_license: { status: 'missing' },
            insurance: { status: 'missing' },
            pco_license: { status: 'missing' },
            proof_of_address: { status: 'missing' },
          },
          overall_status: calculateOverallStatus(driver.documents),
          submitted_at: driver.created_at,
          reviewed_at: driver.reviewed_at,
          reviewed_by: driver.reviewed_by,
          last_updated: driver.updated_at,
        })) as DocumentVerification[];
        
        setVerifications(verificationsData);
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to ${action} document`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBulkAction = async (verifications: DocumentVerification[], action: 'approve_all' | 'reject_pending') => {
    try {
      setProcessingAction(true);
      
      for (const verification of verifications) {
        const updates: any = {
          updated_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          reviewed_by: authUser?.email || 'Admin',
        };

        Object.keys(verification.documents).forEach(docType => {
          const doc = verification.documents[docType as keyof typeof verification.documents];
          if (action === 'approve_all' && doc.status === 'pending') {
            updates[`documents.${docType}.status`] = 'approved';
            updates[`documents.${docType}.reviewed_at`] = new Date().toISOString();
            updates[`documents.${docType}.reviewed_by`] = authUser?.email || 'Admin';
          } else if (action === 'reject_pending' && doc.status === 'pending') {
            updates[`documents.${docType}.status`] = 'rejected';
            updates[`documents.${docType}.reviewed_at`] = new Date().toISOString();
            updates[`documents.${docType}.reviewed_by`] = authUser?.email || 'Admin';
            updates[`documents.${docType}.rejection_reason`] = 'Bulk rejection';
          }
        });

        const { error } = await supabase
          .from('drivers')
          .update(updates)
          .eq('id', verification.driver_id);

        if (error) {
          console.error('Error updating driver:', error);
        }
      }
      
      toast.success(`Bulk ${action.replace('_', ' ')} completed successfully`);
      
      // Refresh data
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (driversData) {
        const verificationsData = driversData.map(driver => ({
          driver_id: driver.id,
          driver_name: driver.full_name || driver.email,
          driver_email: driver.email,
          documents: driver.documents || {
            driving_license: { status: 'missing' },
            insurance: { status: 'missing' },
            pco_license: { status: 'missing' },
            proof_of_address: { status: 'missing' },
          },
          overall_status: calculateOverallStatus(driver.documents),
          submitted_at: driver.created_at,
          reviewed_at: driver.reviewed_at,
          reviewed_by: driver.reviewed_by,
          last_updated: driver.updated_at,
        })) as DocumentVerification[];
        
        setVerifications(verificationsData);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to perform bulk action');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'missing': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'incomplete': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDocumentIcon = (docType: string) => {
    switch (docType) {
      case 'driving_license': return <FaIdCard className="text-blue-500" />;
      case 'insurance': return <FaCar className="text-green-500" />;
      case 'pco_license': return <FaFileAlt className="text-purple-500" />;
      case 'proof_of_address': return <FaHome className="text-orange-500" />;
      default: return <FaFileAlt className="text-gray-500" />;
    }
  };

  const getDocumentName = (docType: string) => {
    switch (docType) {
      case 'driving_license': return 'Driving License';
      case 'insurance': return 'Insurance Certificate';
      case 'pco_license': return 'PCO License';
      case 'proof_of_address': return 'Proof of Address';
      default: return docType;
    }
  };

  const filteredVerifications = useMemo(() => {
    return verifications.filter(verification => {
      const matchesSearch = 
        verification.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.driver_email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || verification.overall_status === filterStatus;
      
      const matchesDocument = filterDocument === 'all' || 
        Object.entries(verification.documents).some(([docType, doc]) => 
          filterDocument === docType && doc.status === 'pending'
        );
      
      return matchesSearch && matchesStatus && matchesDocument;
    });
  }, [verifications, searchTerm, filterStatus, filterDocument]);

  // Calculate stats
  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.overall_status === 'pending_review').length,
    approved: verifications.filter(v => v.overall_status === 'complete').length,
    rejected: verifications.filter(v => v.overall_status === 'rejected').length,
    incomplete: verifications.filter(v => v.overall_status === 'incomplete').length,
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading verification data...</p>
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
              <FaFileAlt className="h-8 w-8 text-blue-600" />
              Driver Verification
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Review and verify driver documents ({filteredVerifications.length} pending review)</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Pending Review</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</div>
              </div>
              <FaClock className="text-2xl text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Approved</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approved}</div>
              </div>
              <FaCheckCircle className="text-2xl text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Rejected</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rejected}</div>
              </div>
              <FaTimesCircle className="text-2xl text-red-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Incomplete</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.incomplete}</div>
              </div>
              <FaExclamationTriangle className="text-2xl text-orange-400" />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction(filteredVerifications.filter(v => v.overall_status === 'pending_review'), 'approve_all')}
              disabled={processingAction}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FaCheckCircle /> Approve All Pending
            </button>
            <button
              onClick={() => handleBulkAction(filteredVerifications.filter(v => v.overall_status === 'pending_review'), 'reject_pending')}
              disabled={processingAction}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <FaTimesCircle /> Reject All Pending
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap mb-6">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search drivers..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="complete">Complete</option>
            <option value="rejected">Rejected</option>
            <option value="incomplete">Incomplete</option>
          </select>
          
          <select
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterDocument}
            onChange={(e) => setFilterDocument(e.target.value)}
          >
            <option value="all">All Documents</option>
            <option value="driving_license">Driving License</option>
            <option value="insurance">Insurance</option>
            <option value="pco_license">PCO License</option>
            <option value="proof_of_address">Proof of Address</option>
          </select>
        </div>

        {/* Verification List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVerifications.map(verification => (
            <div key={verification.driver_id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-lg" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{verification.driver_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{verification.driver_email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(verification.overall_status)}`}>
                    {verification.overall_status.replace('_', ' ')}
                  </span>
                </div>
                
                {/* Documents Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Object.entries(verification.documents).map(([docType, doc]) => (
                    <div key={docType} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {getDocumentIcon(docType)}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{getDocumentName(docType)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        {doc.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDocumentAction(verification, docType, 'approve')}
                              className="p-1 text-green-600 hover:text-green-700 transition-colors"
                              title="Approve"
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedVerification(verification);
                                setShowModal(true);
                              }}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Reject"
                            >
                              <FaTimesCircle />
                            </button>
                          </div>
                        )}
                        {doc.file_url && (
                          <button
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                            title="View Document"
                          >
                            <FaEye />
                          </button>
                        )}
                      </div>
                      {'expiry_date' in doc && doc.expiry_date && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Expires: {formatDate(doc.expiry_date)}
                        </div>
                      )}
                      {doc.rejection_reason && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                          Rejected: {doc.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <FaClock />
                    <span>Submitted: {formatDate(verification.submitted_at)}</span>
                  </div>
                  {verification.reviewed_at && (
                    <span>Reviewed: {formatDate(verification.reviewed_at)}</span>
                  )}
                </div>
                
                {verification.reviewed_by && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Reviewed by: {verification.reviewed_by}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVerifications.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No verifications found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {verifications.length === 0 
                ? "No driver documents submitted yet"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        )}

        {/* Rejection Modal */}
        {showModal && selectedVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reject Document</h2>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Please provide a reason for rejecting this document:
                </p>
                
                <textarea
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setRejectionReason('');
                    }}
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={processingAction}
                    onClick={() => {
                      if (rejectionReason.trim()) {
                        handleDocumentAction(selectedVerification, 'document', 'reject', rejectionReason);
                      } else {
                        toast.error('Please provide a rejection reason');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {processingAction ? 'Rejecting...' : 'Reject Document'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 