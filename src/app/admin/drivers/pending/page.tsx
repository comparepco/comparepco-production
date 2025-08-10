'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaUser, FaUsers, FaCheckCircle, FaTimesCircle, FaEye, FaSearch, FaFilter, FaClock, FaFileAlt, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaExclamationTriangle, FaCar, FaIdCard, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface PendingDriver {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string | {
    street: string;
    city: string;
    county?: string;
    postcode: string;
    country: string;
  };
  date_of_birth: string;
  license_number: string;
  national_insurance_number: string;
  status: 'pending_verification' | 'pending_review' | 'documents_requested' | 'under_verification' | 'approved' | 'rejected';
  verification_status: string;
  application_date: string;
  experience_years: number;
  previous_experience: string[];
  working_areas: string[];
  vehicle_preferences: string[];
  documents: {
    driving_license: {
      status: 'pending_review' | 'approved' | 'rejected';
      url?: string;
      uploaded_at?: string;
      rejection_reason?: string;
    };
    pco_license: {
      status: 'pending_review' | 'approved' | 'rejected';
      url?: string;
      uploaded_at?: string;
      rejection_reason?: string;
    };
    insurance: {
      status: 'pending_review' | 'approved' | 'rejected';
      url?: string;
      uploaded_at?: string;
      rejection_reason?: string;
    };
    proof_of_address: {
      status: 'pending_review' | 'approved' | 'rejected';
      url?: string;
      uploaded_at?: string;
      rejection_reason?: string;
    };
    dbs_check?: {
      status: 'pending_review' | 'approved' | 'rejected';
      url?: string;
      uploaded_at?: string;
      rejection_reason?: string;
    };
  };
  documents_required: string[];
  documents_uploaded: string[];
  terms_accepted: boolean;
  data_processing_consent: boolean;
  marketing_consent: boolean;
  expected_earnings: number;
  working_hours: string;
  availability: string[];
  total_earnings: number;
  completed_trips: number;
  rating: number;
  is_active: boolean;
  can_accept_rides: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_comments?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export default function DriversPendingPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverIdFromUrl = searchParams.get('driverId');
  
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  // Filter drivers based on search and filter criteria
  const filteredDrivers = useMemo(() => {
    return pendingDrivers.filter(driver => {
      const matchesSearch = searchTerm === '' || 
        driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone.includes(searchTerm) ||
        driver.license_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
      
      const matchesExperience = filterExperience === 'all' || 
        (filterExperience === 'new' && driver.experience_years <= 1) ||
        (filterExperience === 'experienced' && driver.experience_years > 1 && driver.experience_years <= 5) ||
        (filterExperience === 'veteran' && driver.experience_years > 5);
      
      return matchesSearch && matchesStatus && matchesExperience;
    });
  }, [pendingDrivers, searchTerm, filterStatus, filterExperience]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = pendingDrivers.length;
    const pendingReview = pendingDrivers.filter(d => d.status === 'pending_review').length;
    const documentsRequested = pendingDrivers.filter(d => d.status === 'documents_requested').length;
    const underVerification = pendingDrivers.filter(d => d.status === 'under_verification').length;
    const avgWaitTime = pendingDrivers.length > 0 
      ? pendingDrivers.reduce((sum, driver) => sum + getDaysWaiting(driver.application_date), 0) / pendingDrivers.length 
      : 0;
    
    return {
      total,
      pendingReview,
      documentsRequested,
      underVerification,
      avgWaitTime
    };
  }, [pendingDrivers]);

  // Load pending drivers from Supabase
  useEffect(() => {
    const loadPendingDrivers = async () => {
      setIsLoading(true);
      try {
        const { data: driversData, error } = await supabase
          .from('drivers')
          .select('*')
          .in('status', ['pending', 'pending_verification', 'pending_review', 'documents_requested', 'under_verification'])
          .order('application_date', { ascending: false });

        if (error) {
          console.error('Error loading pending drivers:', error);
          toast.error('Failed to load pending drivers');
        } else {
          setPendingDrivers(driversData || []);
          
          // If driverId is in URL, find and select that driver
          if (driverIdFromUrl) {
            const driver = driversData?.find(d => d.id === driverIdFromUrl);
            if (driver) {
              setSelectedDriver(driver);
              setShowDetailsModal(true);
              // Scroll to the driver in the list
              setTimeout(() => {
                const element = document.getElementById(`driver-${driver.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('Error loading pending drivers:', error);
        toast.error('Failed to load pending drivers');
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingDrivers();
  }, [driverIdFromUrl]);

  const handleApprove = async (driverId: string) => {
    try {
      setProcessingAction(true);
      
      const { error } = await supabase
        .from('drivers')
        .update({
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: authUser?.email || 'Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        throw error;
      }
      
      toast.success('Driver approved successfully');
      
      // Refresh drivers
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .in('status', ['pending', 'pending_verification', 'pending_review', 'documents_requested', 'under_verification'])
        .order('application_date', { ascending: false });
      
      setPendingDrivers(driversData || []);
    } catch (error) {
      console.error('Error approving driver:', error);
      toast.error('Failed to approve driver');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async (driverId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setProcessingAction(true);
      
      const { error } = await supabase
        .from('drivers')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: authUser?.email || 'Admin',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) {
        throw error;
      }
      
      toast.success('Driver rejected');
      
      // Refresh drivers
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .in('status', ['pending', 'pending_verification', 'pending_review', 'documents_requested', 'under_verification'])
        .order('application_date', { ascending: false });
      
      setPendingDrivers(driversData || []);
    } catch (error) {
      console.error('Error rejecting driver:', error);
      toast.error('Failed to reject driver');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDocumentAction = async (driverId: string, documentType: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      setProcessingAction(true);
      
      const updateData = {
        [`documents.${documentType}.status`]: action === 'approve' ? 'approved' : 'rejected',
        [`documents.${documentType}.reviewed_at`]: new Date().toISOString(),
        [`documents.${documentType}.reviewed_by`]: authUser?.email || 'Admin',
        updated_at: new Date().toISOString(),
        ...(reason && { [`documents.${documentType}.rejection_reason`]: reason })
      };

      const { error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', driverId);

      if (error) {
        throw error;
      }
      
      toast.success(`Document ${action}d successfully`);

      // If approved, check if ALL driver documents are approved and mark driver as active
      if (action === 'approve') {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', driverId)
          .single();

        if (driverData) {
          const docsObj = driverData?.documents || {};
          const allApproved = Object.values(docsObj).every((d: any) => d && d.status === 'approved');
          if (allApproved && driverData.status !== 'active') {
            await supabase
              .from('drivers')
              .update({
                status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: authUser?.email || 'Admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', driverId);
          }
        }
      }
      
      // Refresh drivers
      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .in('status', ['pending', 'pending_verification', 'pending_review', 'documents_requested', 'under_verification'])
        .order('application_date', { ascending: false });
      
      setPendingDrivers(driversData || []);
    } catch (error) {
      console.error(`Error ${action}ing document:`, error);
      toast.error(`Failed to ${action} document`);
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'documents_requested': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'under_verification': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getExperienceLabel = (years: number) => {
    if (years <= 1) return 'New Driver';
    if (years <= 5) return 'Experienced';
    return 'Veteran';
  };

  const getDocumentProgress = (driver: PendingDriver) => {
    const totalDocs = Object.keys(driver.documents).length;
    const approvedDocs = Object.values(driver.documents).filter(doc => doc.status === 'approved').length;
    return totalDocs > 0 ? Math.round((approvedDocs / totalDocs) * 100) : 0;
  };

  const getDaysWaiting = (applicationDate: string) => {
    if (!applicationDate) return 0;
    const date = new Date(applicationDate);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pending drivers...</p>
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
              Pending Driver Applications
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Review and approve new driver applications ({filteredDrivers.length} pending)</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Pending</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <FaUsers className="text-2xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Pending Review</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingReview}</div>
              </div>
              <FaClock className="text-2xl text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Docs Requested</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.documentsRequested}</div>
              </div>
              <FaFileAlt className="text-2xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Under Verification</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.underVerification}</div>
              </div>
              <FaIdCard className="text-2xl text-purple-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Avg Wait Time</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(stats.avgWaitTime)}d</div>
              </div>
              <FaClock className="text-2xl text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center flex-wrap mb-6">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search applications..."
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
            <option value="pending">Pending</option>
            <option value="pending_review">Pending Review</option>
            <option value="documents_requested">Documents Requested</option>
            <option value="under_verification">Under Verification</option>
          </select>
          
          <select
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filterExperience}
            onChange={(e) => setFilterExperience(e.target.value)}
          >
            <option value="all">All Experience Levels</option>
            <option value="new">New Drivers (≤1 year)</option>
            <option value="experienced">Experienced (2-5 years)</option>
            <option value="veteran">Veterans (5+ years)</option>
          </select>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map(driver => {
            const daysWaiting = getDaysWaiting(driver.application_date);
            const docProgress = getDocumentProgress(driver);
            const isUrgent = daysWaiting > 7;
            
            return (
              <div key={driver.id} id={`driver-${driver.id}`} className={`bg-white dark:bg-gray-800 rounded-lg border ${isUrgent ? 'border-orange-500' : 'border-gray-200 dark:border-gray-700'} overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                        <FaUser className="text-white text-lg" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{driver.full_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{driver.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                        {driver.status.replace('_', ' ')}
                      </span>
                      {isUrgent && (
                        <div className="flex items-center gap-1">
                          <FaExclamationTriangle className="text-orange-400 text-xs" />
                          <span className="text-xs text-orange-400">Urgent</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Experience:</span>
                      <span className="text-gray-900 dark:text-white">{getExperienceLabel(driver.experience_years)} ({driver.experience_years} years)</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">License:</span>
                      <span className="text-gray-900 dark:text-white">{driver.license_number}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                      <span className="text-gray-900 dark:text-white">{driver.phone}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Working Areas:</span>
                      <span className="text-gray-900 dark:text-white">{driver.working_areas?.slice(0, 2).join(', ')}{driver.working_areas?.length > 2 ? '...' : ''}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Expected Earnings:</span>
                      <span className="text-green-600 dark:text-green-400">£{driver.expected_earnings?.toLocaleString() || 0}/month</span>
                    </div>
                  </div>
                  
                  {/* Document Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500 dark:text-gray-400">Documents</span>
                      <span className="text-gray-900 dark:text-white">{docProgress}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${docProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt />
                      <span>Applied: {formatDate(driver.application_date)}</span>
                    </div>
                    <span className={`${isUrgent ? 'text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {daysWaiting} days waiting
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {driver.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setApprovalAction('approve');
                              setShowApprovalModal(true);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setApprovalAction('reject');
                              setShowApprovalModal(true);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowDetailsModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors flex items-center gap-1"
                    >
                      <FaEye /> View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredDrivers.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No pending applications found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {pendingDrivers.length === 0 
                ? "No driver applications are pending review"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedDriver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full mx-4 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Driver Application Details</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.full_name}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.email}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Phone</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.phone}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.date_of_birth ? formatDate(selectedDriver.date_of_birth) : 'Not provided'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-500 dark:text-gray-400">Address</label>
                      <div className="text-gray-900 dark:text-white">
                        {typeof selectedDriver.address === 'string' ? selectedDriver.address : `${selectedDriver.address?.street}, ${selectedDriver.address?.city}, ${selectedDriver.address?.postcode}`}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* License Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">License Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">License Number</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.license_number}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">National Insurance Number</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.national_insurance_number}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Experience Years</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.experience_years} years</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Previous Experience</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.previous_experience?.join(', ') || 'None'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Working Areas</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.working_areas?.join(', ') || 'Not specified'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Vehicle Preferences</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.vehicle_preferences?.join(', ') || 'No preference'}</div>
                    </div>
                  </div>
                </div>
                
                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedDriver.documents).map(([docType, doc]) => (
                      <div key={docType} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {docType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
                        {'url' in doc && doc.url && (
                          <button
                            onClick={() => window.open(doc.url, '_blank')}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center gap-1"
                          >
                            <FaEye /> View Document
                          </button>
                        )}
                        {doc.uploaded_at && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Uploaded: {formatDate(doc.uploaded_at)}
                          </div>
                        )}
                        {doc.rejection_reason && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                            Rejected: {doc.rejection_reason}
                          </div>
                        )}
                        {doc.status === 'pending_review' && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleDocumentAction(selectedDriver.id, docType, 'approve')}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDocumentAction(selectedDriver.id, docType, 'reject', 'Document quality insufficient')}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Terms and Consent */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Terms and Consent</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Terms Accepted</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.terms_accepted ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Data Processing Consent</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.data_processing_consent ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Marketing Consent</label>
                      <div className="text-gray-900 dark:text-white">{selectedDriver.marketing_consent ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedDriver && approvalAction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {approvalAction === 'approve' ? 'Approve' : 'Reject'} Driver Application
                </h2>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {approvalAction === 'approve' 
                    ? 'Are you sure you want to approve this driver application?'
                    : 'Please provide a reason for rejecting this application:'
                  }
                </p>
                
                <textarea
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder={approvalAction === 'approve' ? 'Optional approval comments...' : 'Enter rejection reason...'}
                />
                
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setApprovalAction(null);
                    }}
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={processingAction}
                    className={`${approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50`}
                  >
                    {processingAction ? 'Processing...' : `${approvalAction === 'approve' ? 'Approve' : 'Reject'} Application`}
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