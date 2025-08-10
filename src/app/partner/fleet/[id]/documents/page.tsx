'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../../../lib/supabase/client';
import {
  FaArrowLeft, FaFileAlt, FaEye, FaCheckCircle, 
  FaExclamationTriangle, FaClock, FaTimesCircle, FaDownload
} from 'react-icons/fa';

interface VehicleDocument {
  status: 'pending_review' | 'approved' | 'rejected';
  url: string;
  expiryDate: string | null;
  uploadedAt?: string;
  rejectionReason?: string;
}

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  partner_id: string;
  documents: {
    [key: string]: VehicleDocument;
  };
  document_verification_status: 'pending' | 'approved' | 'rejected';
  visible_on_platform: boolean;
}

const DOCUMENT_TYPES = [
  { key: 'mot', label: 'MOT Certificate', required: true, hasExpiry: true },
  { key: 'private_hire_license', label: 'Private Hire License', required: true, hasExpiry: true },
  { key: 'insurance', label: 'Insurance Certificate', required: false, hasExpiry: true },
  { key: 'logbook', label: 'V5C Logbook', required: true, hasExpiry: false },
  { key: 'roadTax', label: 'Road Tax Certificate', required: false, hasExpiry: true }
];

export default function VehicleDocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const loadVehicle = useCallback(async () => {
    try {
      const { data: vehicleData, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error || !vehicleData) {
        alert('Vehicle not found');
        router.push('/partner/fleet');
        return;
      }

      const vehicleAny = vehicleData as any;
      
      // Verify this vehicle belongs to the current partner
      const partnerId = user?.role === 'PARTNER_STAFF' ? (user as any).partnerId : user?.id;
      if (vehicleAny.partner_id !== partnerId) {
        alert('Unauthorized access');
        router.push('/partner/fleet');
        return;
      }

      setVehicle({ 
        ...vehicleAny, 
        id: vehicleId,
        documents: vehicleAny.documents || {},
        document_verification_status: vehicleAny.document_verification_status || 'pending',
        visible_on_platform: vehicleAny.visible_on_platform || false
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      alert('Failed to load vehicle');
      router.push('/partner/fleet');
    }
  }, [vehicleId, user, router]);

  useEffect(() => {
    console.log('Documents page - Auth loading:', authLoading, 'User:', user);
    if (!authLoading) {
      if (!user) {
        console.log('No user, redirecting to login');
        router.replace('/auth/login');
      } else if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
        console.log('Wrong role:', user.role, 'redirecting to home');
        router.replace('/');
      } else if (user.role === 'PARTNER_STAFF' && !(user as any).permissions?.canManageFleet) {
        console.log('Staff without fleet permission, redirecting to partner');
        console.log('User permissions:', (user as any).permissions);
        router.replace('/partner');
      } else {
        console.log('Loading vehicle for vehicleId:', vehicleId);
        loadVehicle();
      }
    }
  }, [user, authLoading, router, loadVehicle]);

  const handleDocumentUpload = async (docType: string, file: File) => {
    if (!vehicle) return;

    setUploadingDoc(docType);
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `vehicles/${vehicleId}/documents`);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload document');
      }

      const uploadData = await uploadRes.json();

      // Update vehicle document
      const updatedDocuments = {
        ...vehicle.documents,
        [docType]: {
          status: 'pending_review' as const,
          url: uploadData.url,
          expiryDate: vehicle.documents[docType]?.expiryDate || null,
          uploadedAt: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('vehicles')
        .update({
          documents: updatedDocuments,
          document_verification_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;

      // Update local state
      setVehicle(prev => prev ? {
        ...prev,
        documents: updatedDocuments,
        document_verification_status: 'pending'
      } : null);

      alert('Document uploaded successfully! Admin will review within 24-48 hours.');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleExpiryDateChange = async (docType: string, expiryDate: string) => {
    if (!vehicle) return;

    setSaving(true);
    try {
      const updatedDocuments = {
        ...vehicle.documents,
        [docType]: {
          ...vehicle.documents[docType],
          expiryDate: expiryDate || null
        }
      };

      const { error } = await supabase
        .from('vehicles')
        .update({
          documents: updatedDocuments,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicle(prev => prev ? {
        ...prev,
        documents: updatedDocuments
      } : null);
    } catch (error) {
      console.error('Error updating expiry date:', error);
      alert('Failed to update expiry date');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <FaCheckCircle className="text-green-600" />;
      case 'rejected': return <FaTimesCircle className="text-red-600" />;
      case 'pending_review': return <FaClock className="text-yellow-600" />;
      default: return <FaExclamationTriangle className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending_review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry date';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl font-bold text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/partner/fleet"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft /> Back to Fleet
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Documents</h1>
                <p className="text-gray-600">{vehicle.name} - {vehicle.license_plate}</p>
              </div>
            </div>
            
            {/* Overall Status */}
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.document_verification_status)}`}>
                {getStatusIcon(vehicle.document_verification_status)}
                {vehicle.document_verification_status === 'pending' && 'Pending Review'}
                {vehicle.document_verification_status === 'approved' && 'Documents Approved'}
                {vehicle.document_verification_status === 'rejected' && 'Documents Rejected'}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {vehicle.visible_on_platform ? 'Visible on platform' : 'Hidden from platform'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Alert */}
        {vehicle.document_verification_status === 'pending' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FaClock className="text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Documents Under Review</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Your vehicle documents are being reviewed by our admin team. This usually takes 24-48 hours. 
                  Your vehicle will be hidden from the platform until all documents are approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {vehicle.document_verification_status === 'rejected' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FaTimesCircle className="text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Documents Rejected</h3>
                <p className="text-red-700 text-sm mt-1">
                  Some of your documents have been rejected. Please check the individual document status below and re-upload as needed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DOCUMENT_TYPES.map((docType) => {
            const document = vehicle.documents[docType.key];
            const hasDocument = document && document.url;
            
            return (
              <div key={docType.key} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FaFileAlt className="text-gray-600" />
                    <h3 className="font-medium text-gray-900">
                      {docType.label}
                      {docType.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                  </div>
                  
                  {hasDocument && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                      {getStatusIcon(document.status)}
                      {document.status === 'pending_review' && 'Pending'}
                      {document.status === 'approved' && 'Approved'}
                      {document.status === 'rejected' && 'Rejected'}
                    </div>
                  )}
                </div>

                {hasDocument ? (
                  <div className="space-y-4">
                    {/* Document Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(document.url, '_blank')}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FaEye className="w-4 h-4" />
                        View Document
                      </button>
                      <a
                        href={document.url}
                        download
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FaDownload className="w-4 h-4" />
                        Download
                      </a>
                    </div>

                    {/* Expiry Date */}
                    {docType.hasExpiry && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={document.expiryDate || ''}
                          onChange={(e) => handleExpiryDateChange(docType.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                          disabled={saving}
                        />
                        {document.expiryDate && (
                          <p className="text-sm text-gray-500 mt-1">
                            Expires: {formatDate(document.expiryDate)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {document.status === 'rejected' && document.rejectionReason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                        <p className="text-sm text-red-700 mt-1">{document.rejectionReason}</p>
                      </div>
                    )}

                    {/* Re-upload option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Replace Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.svg,.tiff,.tif,.bmp,.cr2,.nef,.arw,.dng,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocumentUpload(docType.key, file);
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        disabled={uploadingDoc === docType.key}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaFileAlt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-4">No {docType.label.toLowerCase()} uploaded</p>
                    
                    {/* Expiry Date Input (for new uploads) */}
                    {docType.hasExpiry && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date (optional)
                        </label>
                        <input
                          type="date"
                          onChange={(e) => handleExpiryDateChange(docType.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                        />
                      </div>
                    )}
                    
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.svg,.tiff,.tif,.bmp,.cr2,.nef,.arw,.dng,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload(docType.key, file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      disabled={uploadingDoc === docType.key}
                    />
                    
                    {uploadingDoc === docType.key && (
                      <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Uploading...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">Document Requirements</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All documents must be current and valid</li>
            <li>• Upload clear, readable images or PDFs (max 10MB each)</li>
            <li>• Required documents: MOT Certificate, Private Hire License, V5C Logbook</li>
            <li>• Optional: Insurance Certificate, Road Tax Certificate</li>
            <li>• Your vehicle will be hidden from the platform until all required documents are approved</li>
            <li>• Admin review typically takes 24-48 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 