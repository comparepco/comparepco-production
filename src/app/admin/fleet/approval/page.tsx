'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { 
  FaCar, FaCheckCircle, FaTimesCircle, FaClock, FaEye, FaEyeSlash,
  FaFileAlt, FaSearch, FaExclamationTriangle, FaShieldAlt, FaArrowLeft,
  FaFilter, FaTimes
} from 'react-icons/fa';

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  partner_id: string;
  partner_name?: string;
  status: string;
  document_verification_status: 'pending' | 'approved' | 'rejected';
  visible_on_platform: boolean;
  documents: {
    [key: string]: {
      status: 'pending_review' | 'approved' | 'rejected';
      url: string;
      expiry_date: string | null;
      uploaded_at?: string;
      rejection_reason?: string;
    };
  };
  created_at: string;
  updated_at: string;
  images?: string[];
  image_urls?: string[];
  image_url?: string;
  rental_durations?: string[];
  prices?: Record<string, number>;
  daily_rate?: number;
  minimum_commitment?: { value: number; unit: string };
  insurance_included?: boolean;
  insurance_details?: {
    coverage?: string;
    excess?: number;
    terms?: string;
  };
}

const DOCUMENT_TYPES = [
  { key: 'mot', label: 'MOT Certificate', required: true },
  { key: 'private_hire_license', label: 'Private Hire License', required: true },
  { key: 'insurance', label: 'Insurance Certificate', required: false },
  { key: 'logbook', label: 'V5C Logbook', required: true }
];

const durationLabels: Record<'hourly' | 'daily' | 'weekly' | 'monthly', string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function VehicleApprovalPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<string>('pending');
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && authUser) {
      loadVehicles();
    }
  }, [authUser, authLoading, router]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      
      // Load vehicles from Supabase
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehiclesError) {
        console.error('Error loading vehicles:', vehiclesError);
        toast.error('Failed to load vehicles');
        return;
      }

      // Load partners to get partner names
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('id, company_name, contact_name, email');

      if (partnersError) {
        console.error('Error loading partners:', partnersError);
        toast.error('Failed to load partners');
        return;
      }

      // Enrich vehicles with partner names
      const enrichedVehicles = (vehiclesData || []).map(vehicle => {
        const partner = (partnersData || []).find(p => p.id === vehicle.partner_id);
        const partnerName = partner?.company_name || partner?.contact_name || partner?.email || 'Unknown Partner';
        
        return {
          ...vehicle,
          partner_name: partnerName
        } as Vehicle;
      });

      setVehicles(enrichedVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVehicle = async (vehicleId: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      // Check if all required documents are uploaded and not expired
      const requiredDocs = DOCUMENT_TYPES.filter(doc => doc.required);
      const missingDocs = requiredDocs.filter(docType => 
        !vehicle.documents[docType.key] || !vehicle.documents[docType.key].url
      );

      if (missingDocs.length > 0) {
        toast.error(`Cannot approve: Missing required documents - ${missingDocs.map(d => d.label).join(', ')}`);
        return;
      }

      // Check for expired documents
      const now = new Date();
      const expiredDocs = Object.entries(vehicle.documents).filter(([key, doc]) => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        return expiryDate < now;
      });

      if (expiredDocs.length > 0) {
        const expiredDocNames = expiredDocs.map(([key]) => 
          DOCUMENT_TYPES.find(dt => dt.key === key)?.label || key
        );
        toast.error(`Cannot approve: Expired documents found - ${expiredDocNames.join(', ')}`);
        return;
      }

      // Check for documents expiring within 30 days
      const expiringDocs = Object.entries(vehicle.documents).filter(([key, doc]) => {
        if (!doc.expiry_date) return false;
        const expiryDate = new Date(doc.expiry_date);
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate <= thirtyDaysFromNow && expiryDate > now;
      });

      if (expiringDocs.length > 0) {
        const expiringDocNames = expiringDocs.map(([key]) => 
          DOCUMENT_TYPES.find(dt => dt.key === key)?.label || key
        );
        const shouldProceed = confirm(
          `Warning: The following documents will expire within 30 days: ${expiringDocNames.join(', ')}. Do you want to proceed with approval?`
        );
        if (!shouldProceed) return;
      }

      // Approve all documents and make vehicle visible
      const updatedDocuments = { ...vehicle.documents };
      Object.keys(updatedDocuments).forEach(docType => {
        if (updatedDocuments[docType] && updatedDocuments[docType].status === 'pending_review') {
          updatedDocuments[docType].status = 'approved';
        }
      });

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          document_verification_status: 'approved',
          visible_on_platform: true,
          is_approved: true,
          is_active: true,
          documents: updatedDocuments,
          approved_by: authUser?.id || 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error approving vehicle:', updateError);
        toast.error('Failed to approve vehicle');
        return;
      }

      // Mirror to documents collection
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .eq('car_id', vehicleId);

      if (!docsError && docsData) {
        const updatePromises = docsData.map(doc => 
          supabase
            .from('documents')
            .update({
              status: 'approved',
              approved_at: new Date().toISOString(),
              approved_by: authUser?.id || 'admin',
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id)
        );

        await Promise.all(updatePromises);
      }

      // Update vehicle_documents table
      const { data: vehicleDocsData, error: vehicleDocsError } = await supabase
        .from('vehicle_documents')
        .select('id')
        .eq('vehicle_id', vehicleId);

      if (!vehicleDocsError && vehicleDocsData) {
        const updateVehicleDocPromises = vehicleDocsData.map(doc => 
          supabase
            .from('vehicle_documents')
            .update({
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id)
        );

        await Promise.all(updateVehicleDocPromises);
      }

      toast.success('Vehicle approved and made visible on platform!');
      loadVehicles(); // Refresh data
    } catch (error) {
      console.error('Error approving vehicle:', error);
      toast.error('Failed to approve vehicle');
    }
  };

  const handleRejectVehicle = async (vehicleId: string, reason: string) => {
    try {
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          document_verification_status: 'rejected',
          visible_on_platform: false,
          is_approved: false,
          is_active: false,
          rejection_reason: reason,
          rejected_by: authUser?.id || 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error rejecting vehicle:', updateError);
        toast.error('Failed to reject vehicle');
        return;
      }

      // Mirror to documents collection
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select('id')
        .eq('car_id', vehicleId);

      if (!docsError && docsData) {
        const updatePromises = docsData.map(doc => 
          supabase
            .from('documents')
            .update({
              status: 'rejected',
              rejected_at: new Date().toISOString(),
              rejected_by: authUser?.id || 'admin',
              rejection_reason: reason,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id)
        );

        await Promise.all(updatePromises);
      }

      toast.success('Vehicle rejected');
      loadVehicles(); // Refresh data
    } catch (error) {
      console.error('Error rejecting vehicle:', error);
      toast.error('Failed to reject vehicle');
    }
  };

  const togglePlatformVisibility = async (vehicleId: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          visible_on_platform: !vehicle.visible_on_platform,
          is_approved: !vehicle.visible_on_platform, // Only approve if making visible
          is_active: !vehicle.visible_on_platform, // Only activate if making visible
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error toggling visibility:', updateError);
        toast.error('Failed to update visibility');
        return;
      }

      toast.success(`Vehicle ${!vehicle.visible_on_platform ? 'shown on' : 'hidden from'} platform`);
      loadVehicles(); // Refresh data
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const handleRemoveVehicle = async (vehicleId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) {
        console.error('Error removing vehicle:', deleteError);
        toast.error('Failed to remove vehicle');
        return;
      }

      toast.success('Vehicle removed');
      loadVehicles(); // Refresh data
    } catch (error) {
      console.error('Error removing vehicle:', error);
      toast.error('Failed to remove vehicle');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <FaCheckCircle className="text-green-500" />;
      case 'rejected': return <FaTimesCircle className="text-red-500" />;
      case 'pending': return <FaClock className="text-yellow-500" />;
      default: return <FaExclamationTriangle className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.partner_name && vehicle.partner_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesVerification = verificationFilter === 'all' || vehicle.document_verification_status === verificationFilter;

    return matchesSearch && matchesVerification;
  });

  const stats = {
    total: vehicles.length,
    pending: vehicles.filter(v => v.document_verification_status === 'pending').length,
    approved: vehicles.filter(v => v.document_verification_status === 'approved').length,
    rejected: vehicles.filter(v => v.document_verification_status === 'rejected').length,
    visible: vehicles.filter(v => v.visible_on_platform).length,
  };

  const handleApproveDocument = async (vehicleId: string, docKey: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const updatedDocuments = { ...vehicle.documents };
      updatedDocuments[docKey].status = 'approved';

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          documents: updatedDocuments, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error approving document:', updateError);
        toast.error('Failed to approve document');
        return;
      }

      toast.success('Document approved');
      loadVehicles(); // Refresh data
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    }
  };

  const handleRejectDocument = async (vehicleId: string, docKey: string, reason: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const updatedDocuments = { ...vehicle.documents };
      updatedDocuments[docKey].status = 'rejected';
      updatedDocuments[docKey].rejection_reason = reason;

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ 
          documents: updatedDocuments, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', vehicleId);

      if (updateError) {
        console.error('Error rejecting document:', updateError);
        toast.error('Failed to reject document');
        return;
      }

      toast.success('Document rejected');
      loadVehicles(); // Refresh data
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vehicle Document Approval</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and approve partner vehicle documents. Only vehicles with all required documents approved will be visible on the platform.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaClock className="text-yellow-500 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Approved</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-500 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejected}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Rejected</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaEye className="text-blue-500 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.visible}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Visible on Platform</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaCar className="text-blue-500 text-2xl mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Vehicles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by vehicle, partner, plate..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Status</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Documents</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicles List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Platform Visibility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{vehicle.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{vehicle.make} {vehicle.model} ({vehicle.year})</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">{vehicle.registration_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{vehicle.partner_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(vehicle.document_verification_status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.document_verification_status)}`}>{vehicle.document_verification_status}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {Object.entries(vehicle.documents || {}).map(([key, doc]) => (
                        <span key={key} className={`inline-block w-2 h-2 rounded-full mr-1 ${doc.status === 'approved' ? 'bg-green-400' : doc.status === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'}`} title={`${key}: ${doc.status}`}></span>
                      ))}
                    </div>
                    {/* Document expiry warnings */}
                    <div className="mt-1 text-xs">
                      {Object.entries(vehicle.documents || {}).map(([key, doc]) => {
                        if (doc.expiry_date) {
                          const expiry = new Date(doc.expiry_date);
                          const now = new Date();
                          if (expiry < now) {
                            return <span key={key} className="text-red-500 mr-2">{key} expired</span>;
                          } else if ((expiry.getTime() - now.getTime()) < 1000 * 60 * 60 * 24 * 30) {
                            return <span key={key} className="text-yellow-600 mr-2">{key} expiring soon</span>;
                          }
                        }
                        return null;
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {vehicle.visible_on_platform ? (
                        <><FaEye className="text-green-500" /> <span className="text-green-600 text-sm">Visible</span></>
                      ) : (
                        <><FaEyeSlash className="text-red-500" /> <span className="text-red-600 text-sm">Hidden</span></>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {/* Approve/Reject all docs */}
                      {vehicle.document_verification_status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveVehicle(vehicle.id)} className="text-green-800 bg-green-100 hover:bg-green-200 px-3 py-1 rounded-lg transition-colors font-medium">Approve</button>
                          <button onClick={() => { const reason = prompt('Rejection reason:'); if (reason) handleRejectVehicle(vehicle.id, reason); }} className="text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors font-medium">Reject</button>
                        </>
                      )}
                      {/* Toggle visibility */}
                      <button onClick={() => togglePlatformVisibility(vehicle.id)} className={`px-3 py-1 rounded-lg transition-colors font-medium ${vehicle.visible_on_platform ? 'text-red-800 bg-red-100 hover:bg-red-200' : 'text-blue-800 bg-blue-100 hover:bg-blue-200'}`}>{vehicle.visible_on_platform ? 'Hide' : 'Show'}</button>
                      {/* Remove vehicle */}
                      <button onClick={() => { if (window.confirm('Are you sure you want to permanently delete this vehicle?')) handleRemoveVehicle(vehicle.id); }} className="text-gray-800 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-lg transition-colors font-medium">Remove</button>
                      {/* View details (modal) */}
                      <button onClick={() => setSelectedVehicle(vehicle)} className="text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors font-medium">View Details</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12">
            <FaCar className="mx-auto text-gray-400 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No vehicles found</h3>
            <p className="text-gray-600 dark:text-gray-400">No vehicles match your current filters.</p>
          </div>
        )}
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Vehicle Details</h2>
                <button onClick={() => setSelectedVehicle(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
              </div>
                              {/* Vehicle Photo Gallery */}
                {(() => {
                  const images = selectedVehicle.images || selectedVehicle.image_urls || (selectedVehicle.image_url ? [selectedVehicle.image_url] : []);
                  if (images && images.length > 0) {
                    return (
                      <div className="mb-6">
                        <div className="flex gap-2 overflow-x-auto">
                          {images.map((img: string, idx: number) => (
                            <img
                              key={img}
                              src={img}
                              alt={`Vehicle photo ${idx + 1}`}
                              className="h-24 w-36 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80"
                              onClick={() => setGalleryIndex(idx)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Vehicle Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedVehicle.name}</p>
                      <p><span className="font-medium">Make/Model:</span> {selectedVehicle.make} {selectedVehicle.model}</p>
                      <p><span className="font-medium">Year:</span> {selectedVehicle.year}</p>
                      <p><span className="font-medium">License Plate:</span> {selectedVehicle.registration_number}</p>
                      <p><span className="font-medium">Partner:</span> {selectedVehicle.partner_name}</p>
                      <p><span className="font-medium">Status:</span> {selectedVehicle.status}</p>
                      <p><span className="font-medium">Insurance:</span> 
                        {selectedVehicle.insurance_included ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full ml-2">
                            <FaShieldAlt className="w-3 h-3" />
                            Included
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full ml-2">
                            <FaExclamationTriangle className="w-3 h-3" />
                            Driver Required
                          </span>
                        )}
                      </p>
                      {selectedVehicle.insurance_included && selectedVehicle.insurance_details && (
                        <>
                          <p><span className="font-medium">Coverage:</span> {selectedVehicle.insurance_details.coverage || 'Not specified'}</p>
                          <p><span className="font-medium">Excess:</span> £{selectedVehicle.insurance_details.excess || 0}</p>
                          {selectedVehicle.insurance_details.terms && (
                            <p><span className="font-medium">Terms:</span> {selectedVehicle.insurance_details.terms}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Document Status</h3>
                  <div className="space-y-3">
                    {DOCUMENT_TYPES.map((docType) => {
                      const document = selectedVehicle.documents?.[docType.key];
                      return (
                        <div key={docType.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FaFileAlt className="text-gray-600 dark:text-gray-300" />
                            <span className="text-sm font-medium">{docType.label}</span>
                            {docType.required && <span className="text-red-500 text-xs">*</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {document ? (
                              <>
                                {getStatusIcon(document.status)}
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>{document.status}</span>
                                {document.url && (
                                  <button onClick={() => setImageModalUrl(document.url)} className="text-blue-600 hover:text-blue-800 text-xs underline">View</button>
                                )}
                                {document.status !== 'approved' && (
                                  <button onClick={() => handleApproveDocument(selectedVehicle.id, docType.key)} className="text-green-600 hover:text-green-900 px-2 py-1 bg-green-100 dark:bg-green-900 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 text-xs transition-colors">Approve</button>
                                )}
                                {document.status !== 'rejected' && (
                                  <button onClick={() => { const reason = prompt('Rejection reason:'); if (reason) handleRejectDocument(selectedVehicle.id, docType.key, reason); }} className="text-red-600 hover:text-red-900 px-2 py-1 bg-red-100 dark:bg-red-900 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 text-xs transition-colors">Reject</button>
                                )}
                              </>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Not uploaded</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Image Modal for document images */}
          {imageModalUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 max-w-2xl w-full flex flex-col items-center">
                <img src={imageModalUrl} alt="Document" className="max-h-[70vh] w-auto rounded mb-4" />
                <button onClick={() => setImageModalUrl(null)} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
              </div>
            </div>
          )}
          {/* Gallery Modal for vehicle photos */}
          {galleryIndex !== null && (() => {
            const images = selectedVehicle.images || selectedVehicle.image_urls || (selectedVehicle.image_url ? [selectedVehicle.image_url] : []);
            return (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                <div className="relative flex flex-col items-center">
                  <img src={images[galleryIndex]} alt={`Vehicle photo ${galleryIndex + 1}`} className="max-h-[80vh] w-auto rounded-lg mb-4" />
                  <div className="flex gap-4">
                    <button onClick={() => setGalleryIndex(null)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setGalleryIndex((galleryIndex - 1 + images.length) % images.length)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">Prev</button>
                        <button onClick={() => setGalleryIndex((galleryIndex + 1) % images.length)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">Next</button>
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-xs mt-2">
                    {galleryIndex + 1} / {images.length}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
} 