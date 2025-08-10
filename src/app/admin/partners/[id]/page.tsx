'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar,
  FaStar, FaChartLine, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaUserTie, FaCar, FaMoneyBillWave, FaShieldAlt, FaEdit, FaArrowLeft
} from 'react-icons/fa';

interface PartnerDetails {
  id: string;
  user_id?: string;
  company_name: string;
  contact_name: string;
  contact_person: string;
  email: string;
  phone: string;
  business_email?: string;
  director_name?: string;
  director_email?: string;
  director_phone?: string;
  address?: any;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  description?: string;
  business_type?: string;
  registration_number?: string;
  vat_number?: string;
  status: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
  fleet_size?: number;
  estimated_monthly_rides?: number;
  commission_rate?: number;
  total_earnings?: number;
  completed_bookings?: number;
  rating?: number;
  documents?: any;
  // Approval fields
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  documents_approved?: boolean;
  business_approved?: boolean;
  // User data
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
  };
}

export default function PartnerDetailsPage() {
  const params = useParams();
  const partnerId = params.id as string;
  
  const [partner, setPartner] = useState<PartnerDetails | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('PartnerDetailsPage mounted with partnerId:', partnerId);
    if (partnerId) {
      loadPartnerDetails();
    } else {
      setError('No partner ID provided');
      setLoading(false);
    }
  }, [partnerId]);

  const loadPartnerDetails = async () => {
    try {
      setLoading(true);
      console.log('Loading partner details for ID:', partnerId);

      // Load partner details with all fields
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select(`
          id,
          user_id,
          company_name,
          contact_name,
          contact_person,
          email,
          phone,
          business_email,
          director_name,
          director_email,
          director_phone,
          address,
          location,
          city,
          state,
          country,
          postal_code,
          website,
          description,
          business_type,
          registration_number,
          vat_number,
          status,
          approval_status,
          created_at,
          updated_at,
          fleet_size,
          estimated_monthly_rides,
          commission_rate,
          total_earnings,
          completed_bookings,
          rating,
          approved_at,
          approved_by,
          rejected_at,
          rejected_by,
          rejection_reason,
          documents_approved,
          business_approved
        `)
        .eq('id', partnerId)
        .single();

      if (partnerError) {
        console.error('Error loading partner:', partnerError);
        const errorMessage = `Failed to load partner details: ${partnerError.message}`;
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!partnerData) {
        console.error('No partner data found for ID:', partnerId);
        const errorMessage = 'Partner not found';
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      console.log('Partner data loaded:', partnerData);
      setPartner(partnerData);

      // Load associated user data
      if (partnerData.user_id) {
        console.log('Loading user data for user_id:', partnerData.user_id);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', partnerData.user_id)
          .single();

        if (userError) {
          console.error('Error loading user data:', userError);
        } else if (userData) {
          console.log('User data loaded:', userData);
          setPartner(prev => ({
            ...prev!,
            user: userData
          }));
        } else {
          console.log('No user data found for user_id:', partnerData.user_id);
        }
      } else {
        console.log('No user_id found in partner data');
      }

      // Load partner documents
      console.log('Loading documents for partner_id:', partnerId);
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Error loading documents:', docsError);
      } else {
        console.log('Documents loaded:', docsData?.length || 0, 'documents');
        setDocuments(docsData || []);
      }

    } catch (error) {
      console.error('Error loading partner details:', error);
      const errorMessage = 'Failed to load partner details';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePartner = async () => {
    if (!partner) return;

    setApproving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          approval_status: 'approved',
          status: 'active',
          approved_at: new Date().toISOString(),
          approved_by: 'Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Partner approved successfully');
      loadPartnerDetails(); // Reload to update status
    } catch (error) {
      console.error('Error approving partner:', error);
      toast.error('Failed to approve partner');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectPartner = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setApproving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          approval_status: 'rejected',
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: 'Admin',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (error) throw error;

      toast.success('Partner rejected');
      loadPartnerDetails(); // Reload to update status
    } catch (error) {
      console.error('Error rejecting partner:', error);
      toast.error('Failed to reject partner');
    } finally {
      setApproving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading partner details...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Partner ID: {partnerId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaBuilding className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Partner
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaBuilding className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Partner Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The partner you're looking for could not be found.
          </p>
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaBuilding className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                  {partner.company_name}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Partner Details
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(partner.approval_status)}`}>
                {partner.approval_status || 'pending'}
              </span>
              {partner.approval_status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleApprovePartner}
                    disabled={approving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <FaCheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={handleRejectPartner}
                    disabled={approving}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <FaTimesCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Partner Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Company Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaBuilding className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Company Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.company_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Type</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.business_type || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Person</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.contact_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Email</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Phone</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.phone}</dd>
              </div>
              {partner.business_email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Email</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.business_email}</dd>
                </div>
              )}
              {partner.website && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {partner.website}
                    </a>
                  </dd>
                </div>
              )}
              {partner.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.description}</dd>
                </div>
              )}
              {partner.registration_number && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Registration Number</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.registration_number}</dd>
                </div>
              )}
              {partner.vat_number && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">VAT Number</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.vat_number}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Director Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaUserTie className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Director Information
            </h2>
            <dl className="space-y-3">
              {partner.director_name ? (
                <>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Director Name</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{partner.director_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Director Email</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{partner.director_email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Director Phone</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{partner.director_phone}</dd>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No director information provided</p>
              )}
            </dl>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FaMapMarkerAlt className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
            Address Information
          </h2>
          <dl className="space-y-3">
            {partner.address && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Address</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.address}</dd>
              </div>
            )}
            {partner.city && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">City</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.city}</dd>
              </div>
            )}
            {partner.state && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">State/Province</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.state}</dd>
              </div>
            )}
            {partner.country && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.country}</dd>
              </div>
            )}
            {partner.postal_code && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Postal Code</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.postal_code}</dd>
              </div>
            )}
            {partner.location && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.location}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* User Account Information */}
        {partner.user && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaUser className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              User Account Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Login Email</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.user.email}</dd>
              </div>
              {partner.user.first_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.user.first_name}</dd>
                </div>
              )}
              {partner.user.last_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.user.last_name}</dd>
                </div>
              )}
              {partner.user.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.user.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</dt>
                <dd className="text-sm text-gray-900 dark:text-white capitalize">{partner.user.role}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    partner.user.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {partner.user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Verification Status</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    partner.user.is_verified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {partner.user.is_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {new Date(partner.user.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* Business Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaCar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Fleet Information
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fleet Size</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.fleet_size || 0} vehicles</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Monthly Rides</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.estimated_monthly_rides || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Commission Rate</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.commission_rate || 15}%</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaChartLine className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
              Performance
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</dt>
                <dd className="text-sm text-gray-900 dark:text-white">{partner.completed_bookings || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</dt>
                <dd className="text-sm text-gray-900 dark:text-white">£{(partner.total_earnings || 0).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</dt>
                <dd className="text-sm text-gray-900 dark:text-white flex items-center">
                  <FaStar className="w-4 h-4 text-yellow-400 mr-1" />
                  {(partner.rating || 0).toFixed(1)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaShieldAlt className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
              Approval Status
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Approval</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    partner.business_approved
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {partner.business_approved ? 'Approved' : 'Pending'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Documents Approval</dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    partner.documents_approved
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {partner.documents_approved ? 'Approved' : 'Pending'}
                  </span>
                </dd>
              </div>
              {partner.approved_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved At</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(partner.approved_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {partner.approved_by && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved By</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.approved_by}</dd>
                </div>
              )}
              {partner.rejected_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected At</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(partner.rejected_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {partner.rejected_by && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected By</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{partner.rejected_by}</dd>
                </div>
              )}
              {partner.rejection_reason && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejection Reason</dt>
                  <dd className="text-sm text-red-600 dark:text-red-400">{partner.rejection_reason}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FaCalendar className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Timeline
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Partner Created</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {new Date(partner.created_at).toLocaleDateString()} at {new Date(partner.created_at).toLocaleTimeString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {new Date(partner.updated_at).toLocaleDateString()} at {new Date(partner.updated_at).toLocaleTimeString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Documents Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FaFileAlt className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
            Submitted Documents
          </h2>
          {documents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No documents submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{doc.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.approval_status)}`}>
                      {doc.approval_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{doc.type}</p>
                  {doc.rejection_reason && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Rejected: {doc.rejection_reason}
                    </p>
                  )}
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Document
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 