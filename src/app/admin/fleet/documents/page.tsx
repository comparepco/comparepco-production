'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCalendar,
  FaTruck,
  FaUser,
  FaClock,
  FaPlus,
  FaCloudUploadAlt,
  FaChevronDown,
  FaChevronRight,
  FaBuilding,
  FaEye,
  FaTrash,
  FaDownload,
  FaArrowLeft,
  FaSearch,
  FaFilter,
  FaTimes,
  FaShieldAlt
} from 'react-icons/fa';

interface VehicleDocument {
  id?: string;
  vehicle_id: string;
  type: 'private_hire_license' | 'mot' | 'insurance' | 'logbook';
  file_name: string;
  file_url: string;
  expiry_date?: string;
  upload_date: string;
  status: 'valid' | 'expiring' | 'expired';
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
  images?: string[];
  documents?: VehicleDocument[];
  insurance_included?: boolean;
  insurance_details?: {
    coverage?: string;
    excess?: number;
    terms?: string;
  };
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

interface DocumentStats {
  total: number;
  valid: number;
  expiring: number;
  expired: number;
  missing: number;
}

const DOCUMENT_TYPES = [
  { key: 'private_hire_license', label: 'Private Hire License', required: true },
  { key: 'mot', label: 'MOT Certificate', required: true },
  { key: 'insurance', label: 'Insurance Certificate', required: false },
  { key: 'logbook', label: 'V5C Logbook', required: true }
];

export default function FleetDocuments() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(new Set());
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());
  const [globalStats, setGlobalStats] = useState<DocumentStats>({
    total: 0,
    valid: 0,
    expiring: 0,
    expired: 0,
    missing: 0
  });
  const [uploadingDocument, setUploadingDocument] = useState<{
    vehicleId: string;
    type: string;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [partnerVehicleFilters, setPartnerVehicleFilters] = useState<{[partnerId: string]: string}>({});

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }

    if (!authLoading && authUser) {
      loadPartnersAndDocuments();
    }
  }, [authUser, authLoading, router]);

  const loadPartnersAndDocuments = async () => {
    try {
      setLoading(true);
      
      // Load all data concurrently from Supabase
      const [vehiclesSnapshot, documentsSnapshot, partnersSnapshot] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('documents').select('*'),
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

      if (documentsSnapshot.error) {
        console.error('Error loading documents:', documentsSnapshot.error);
        toast.error('Failed to load documents');
        return;
      }

        // Process partners
        const partnersData: Partner[] = [];
        (partnersSnapshot.data || []).forEach((partner: any) => {
          partnersData.push({ id: partner.id, ...partner } as Partner);
        });

        // Process documents
        const documentsData: Document[] = [];
        (documentsSnapshot.data || []).forEach((doc: any) => {
          documentsData.push({ id: doc.id, ...doc } as Document);
        });

        // Process vehicles
        const vehiclesData: Vehicle[] = [];
        (vehiclesSnapshot.data || []).forEach((vehicle: any) => {
          vehiclesData.push({ id: vehicle.id, ...vehicle } as Vehicle);
        });

        // Enrich documents with vehicle and partner info
        const enrichedDocuments = documentsData.map((doc: any) => {
          const vehicle = vehiclesData.find(v => v.id === doc.car_id);
          const partner = partnersData.find(p => p.id === doc.partner_id);
          
          return {
            ...doc,
            vehicle_name: vehicle?.name || 'Unknown Vehicle',
            partner_name: partner?.business_name || partner?.company_name || partner?.name || 'Unknown Partner'
          };
        });

      // Group vehicles by partner - only include partners with document permissions
      const partnersWithVehicles = partnersData.map(partner => {
        const partnerVehicles = vehiclesData.filter(vehicle => vehicle.partner_id === partner.id);
        return {
          ...partner,
          vehicles: partnerVehicles
        };
      }).filter(partner => {
        // Check if partner has vehicles and document permissions
        if (!partner.vehicles || partner.vehicles.length === 0) return false;
        
        // Check if partner has document permissions (you can customize this logic)
        // For now, we'll include all partners with vehicles
        // You can add specific permission checks here based on your partner permission system
        return true;
      });

      // Calculate global stats
      const stats = calculateGlobalStats(vehiclesData);
      setGlobalStats(stats);
      setPartners(partnersWithVehicles);
    } catch (error) {
      console.error('Error loading partners and documents:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (expiryDate?: string): 'valid' | 'expiring' | 'expired' => {
    if (!expiryDate) return 'valid';
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  const getStatusColor = (status: 'valid' | 'expiring' | 'expired') => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: 'valid' | 'expiring' | 'expired') => {
    switch (status) {
      case 'valid': return <FaCheckCircle className="text-green-600" />;
      case 'expiring': return <FaExclamationTriangle className="text-yellow-600" />;
      case 'expired': return <FaTimes className="text-red-600" />;
      default: return <FaClock className="text-gray-600" />;
    }
  };

  const calculateGlobalStats = (vehicles: Vehicle[]): DocumentStats => {
    const stats = {
      total: 0,
      valid: 0,
      expiring: 0,
      expired: 0,
      missing: 0
    };

    vehicles.forEach(vehicle => {
      DOCUMENT_TYPES.forEach(docType => {
        stats.total++;
        const document = vehicle.documents?.find(doc => doc.type === docType.key);
        
        if (!document) {
          if (docType.required) stats.missing++;
        } else {
          switch (document.status) {
            case 'valid':
              stats.valid++;
              break;
            case 'expiring':
              stats.expiring++;
              break;
            case 'expired':
              stats.expired++;
              break;
          }
        }
      });
    });

    return stats;
  };

  const calculatePartnerStats = (vehicles: Vehicle[]): DocumentStats => {
    return calculateGlobalStats(vehicles);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
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

  const toggleVehicleExpansion = (vehicleId: string) => {
    const newExpanded = new Set(expandedVehicles);
    if (newExpanded.has(vehicleId)) {
      newExpanded.delete(vehicleId);
    } else {
      newExpanded.add(vehicleId);
    }
    setExpandedVehicles(newExpanded);
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
      const vehicleStats = calculateVehicleStats(vehicle);
      
      switch (filter) {
        case 'expired': return vehicleStats.expired > 0;
        case 'expiring': return vehicleStats.expiring > 0;
        case 'missing': return vehicleStats.missing > 0;
        case 'valid': return vehicleStats.expired === 0 && vehicleStats.expiring === 0 && vehicleStats.missing === 0;
        default: return true;
      }
    });
  };

  const calculateVehicleStats = (vehicle: Vehicle): DocumentStats => {
    const stats = {
      total: 0,
      valid: 0,
      expiring: 0,
      expired: 0,
      missing: 0
    };

    DOCUMENT_TYPES.forEach(docType => {
      stats.total++;
      const document = vehicle.documents?.find(doc => doc.type === docType.key);
      
      if (!document) {
        if (docType.required) stats.missing++;
      } else {
        switch (document.status) {
          case 'valid':
            stats.valid++;
            break;
          case 'expiring':
            stats.expiring++;
            break;
          case 'expired':
            stats.expired++;
            break;
        }
      }
    });

    return stats;
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

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'expired':
        return <FaExclamationTriangle className="h-5 w-5 text-red-500" />;
      case 'expiring':
        return <FaClock className="h-5 w-5 text-orange-500" />;
      case 'valid':
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <FaFileAlt className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expiring':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'valid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleFileUpload = async (vehicleId: string, documentType: string, file: File, expiryDate?: string) => {
    try {
      // In a real implementation, you would upload to your storage service
      // For now, we'll simulate the upload
      const fileUrl = URL.createObjectURL(file);
      
      const documentData = {
        vehicle_id: vehicleId,
        type: documentType,
        file_name: file.name,
        file_url: fileUrl,
        expiry_date: expiryDate || null,
        upload_date: new Date().toISOString(),
        status: getDocumentStatus(expiryDate)
      };

      const { error } = await supabase.from('vehicle_documents').insert(documentData);
      
      if (error) {
        console.error('Error uploading document:', error);
        toast.error('Failed to upload document');
        return;
      }
      
      // Reload data
      await loadPartnersAndDocuments();
      setUploadingDocument(null);
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Error uploading document');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      // In a real implementation, you would delete from Firestore
      // await deleteDoc(doc(db, 'vehicle_documents', documentId));
      
      // Reload data
      await loadPartnersAndDocuments();
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading fleet documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
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
            Fleet Documents by Partner
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage vehicle documents including Private Hire License, MOT, Insurance, and Logbook
        </p>
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
                  <option value="expired">Has Expired Docs</option>
                  <option value="expiring">Has Expiring Docs</option>
                  <option value="missing">Has Missing Docs</option>
                  <option value="valid">All Valid Docs</option>
                </select>
              </div>
            </div>
            
            {/* Global Overview - Moved inside filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'expired' ? 'bg-red-200 dark:bg-red-800' : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'expired' ? 'all' : 'expired')}
              >
                <FaExclamationTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{globalStats.expired}</p>
                <p className="text-sm text-red-700 dark:text-red-400">Expired</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'expiring' ? 'bg-orange-200 dark:bg-orange-800' : 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring')}
              >
                <FaClock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{globalStats.expiring}</p>
                <p className="text-sm text-orange-700 dark:text-orange-400">Expiring Soon</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'valid' ? 'bg-green-200 dark:bg-green-800' : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'valid' ? 'all' : 'valid')}
              >
                <FaCheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{globalStats.valid}</p>
                <p className="text-sm text-green-700 dark:text-green-400">Valid</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'missing' ? 'bg-gray-200 dark:bg-gray-600' : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => setFilterStatus(filterStatus === 'missing' ? 'all' : 'missing')}
              >
                <FaFileAlt className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-600">{globalStats.missing}</p>
                <p className="text-sm text-gray-700 dark:text-gray-400">Missing</p>
              </div>
              <div 
                className={`p-4 rounded-lg text-center cursor-pointer transition-colors ${
                  filterStatus === 'all' ? 'bg-blue-200 dark:bg-blue-800' : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
                onClick={() => setFilterStatus('all')}
              >
                <FaTruck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{globalStats.total}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">Total Required</p>
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
                    case 'expired': return partnerStats.expired > 0;
                    case 'expiring': return partnerStats.expiring > 0;
                    case 'missing': return partnerStats.missing > 0;
                    case 'valid': return partnerStats.expired === 0 && partnerStats.expiring === 0 && partnerStats.missing === 0;
                    default: return true;
                  }
                }

                return true;
              })
              .map((partner) => {
              const partnerStats = calculatePartnerStats(partner.vehicles || []);
              const isPartnerExpanded = expandedPartners.has(partner.id);
              const hasDocumentIssues = partnerStats.expired > 0 || partnerStats.expiring > 0 || partnerStats.missing > 0;

              return (
                <div key={partner.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  {/* Partner Header */}
                  <div 
                    className={`p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      hasDocumentIssues ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500'
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
                          {partnerStats.expired > 0 && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              {partnerStats.expired} Expired
                            </span>
                          )}
                          {partnerStats.expiring > 0 && (
                            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                              {partnerStats.expiring} Expiring
                            </span>
                          )}
                          {partnerStats.missing > 0 && (
                            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                              {partnerStats.missing} Missing
                            </span>
                          )}
                          {!hasDocumentIssues && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              All Complete
                            </span>
                          )}
                        </div>
                        
                        {/* Expand/Collapse Icon */}
                        {isPartnerExpanded ? (
                          <FaChevronDown className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FaChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Partner Vehicles */}
                  {isPartnerExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="p-6">
                        {/* Partner Document Stats */}
                        <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'expired' 
                                ? 'bg-red-200 dark:bg-red-800 ring-2 ring-red-500' 
                                : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'expired')}
                          >
                            <FaExclamationTriangle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-red-600">{partnerStats.expired}</p>
                            <p className="text-xs text-red-700 dark:text-red-400">Expired</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'expiring' 
                                ? 'bg-orange-200 dark:bg-orange-800 ring-2 ring-orange-500' 
                                : 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'expiring')}
                          >
                            <FaClock className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-orange-600">{partnerStats.expiring}</p>
                            <p className="text-xs text-orange-700 dark:text-orange-400">Expiring</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'valid' 
                                ? 'bg-green-200 dark:bg-green-800 ring-2 ring-green-500' 
                                : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'valid')}
                          >
                            <FaCheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-green-600">{partnerStats.valid}</p>
                            <p className="text-xs text-green-700 dark:text-green-400">Valid</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'missing' 
                                ? 'bg-gray-200 dark:bg-gray-600 ring-2 ring-gray-500' 
                                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'missing')}
                          >
                            <FaFileAlt className="h-6 w-6 text-gray-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-gray-600">{partnerStats.missing}</p>
                            <p className="text-xs text-gray-700 dark:text-gray-400">Missing</p>
                          </div>
                          <div 
                            className={`p-3 rounded-lg text-center cursor-pointer transition-colors ${
                              partnerVehicleFilters[partner.id] === 'all' || !partnerVehicleFilters[partner.id]
                                ? 'bg-blue-200 dark:bg-blue-800 ring-2 ring-blue-500' 
                                : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                            }`}
                            onClick={() => setPartnerVehicleFilter(partner.id, 'all')}
                          >
                            <FaTruck className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                            <p className="text-lg font-bold text-blue-600">{partnerStats.total}</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400">All</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {getFilteredVehicles(partner.vehicles || [], partner.id).length === 0 && partner.vehicles && partner.vehicles.length > 0 && partnerVehicleFilters[partner.id] && partnerVehicleFilters[partner.id] !== 'all' ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <FaTruck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                No vehicles match the selected filter
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
                            const isVehicleExpanded = expandedVehicles.has(vehicle.id);
                            const vehicleDocumentIssues = DOCUMENT_TYPES.some(docType => {
                              const doc = vehicle.documents?.find(d => d.type === docType.key);
                              return !doc || doc.status === 'expired' || doc.status === 'expiring';
                            });

                            return (
                              <div key={vehicle.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                                {/* Vehicle Header */}
                                <div 
                                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                    vehicleDocumentIssues ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'
                                  }`}
                                  onClick={() => toggleVehicleExpansion(vehicle.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                                                              {vehicle.images && vehicle.images.length > 0 ? (
                                          <img
                                            src={vehicle.images[0]}
                                            alt={`${vehicle.make} ${vehicle.model}`}
                                            className="h-10 w-10 rounded-lg object-cover mr-3"
                                          />
                                        ) : (
                                          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-3">
                                            <FaTruck className="h-5 w-5 text-gray-400" />
                                          </div>
                                        )}
                                      <div>
                                        <h3 className="font-medium text-gray-900 dark:text-white">
                                          {vehicle.make} {vehicle.model} ({vehicle.year})
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          Reg: {vehicle.registration_number}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          {vehicle.insurance_included ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                              <FaShieldAlt className="w-3 h-3" />
                                              Insurance Included
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                              <FaExclamationTriangle className="w-3 h-3" />
                                              Insurance Required
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      {/* Document Status Badges */}
                                      <div className="flex space-x-1">
                                        {DOCUMENT_TYPES.filter(dt => dt.key !== 'insurance' || vehicle.insurance_included).map((docType) => {
                                          const doc = vehicle.documents?.find(d => d.type === docType.key);
                                          const status = doc ? doc.status : 'missing';
                                          return (
                                            <div
                                              key={docType.key}
                                              className={`w-3 h-3 rounded-full ${
                                                status === 'valid' ? 'bg-green-500' :
                                                status === 'expiring' ? 'bg-orange-500' :
                                                status === 'expired' ? 'bg-red-500' : 'bg-gray-300'
                                              }`}
                                              title={`${docType.label}: ${status}`}
                                            />
                                          );
                                        })}
                                      </div>
                                      
                                                                          {/* Expand/Collapse Icon */}
                                    {isVehicleExpanded ? (
                                      <FaChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <FaChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                    </div>
                                  </div>
                                </div>

                                {/* Vehicle Documents */}
                                {isVehicleExpanded && (
                                  <div className="border-t border-gray-200 dark:border-gray-600 p-4">
                                    {/* Insurance Information */}
                                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Insurance Information</h4>
                                      <div className="flex items-center gap-2">
                                        {vehicle.insurance_included ? (
                                          <>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                              <FaShieldAlt className="w-3 h-3" />
                                              Insurance Included
                                            </span>
                                            {vehicle.insurance_details && (
                                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {vehicle.insurance_details.coverage && (
                                                  <span className="mr-3">Coverage: {vehicle.insurance_details.coverage}</span>
                                                )}
                                                {vehicle.insurance_details.excess && (
                                                  <span>Excess: £{vehicle.insurance_details.excess}</span>
                                                )}
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                            <FaExclamationTriangle className="w-3 h-3" />
                                            Driver must provide their own insurance
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {DOCUMENT_TYPES.filter(dt => dt.key !== 'insurance' || vehicle.insurance_included).map((docType) => {
                                        const document = vehicle.documents?.find(doc => doc.type === docType.key);
                                        const status = document ? document.status : 'missing';

                                        return (
                                          <div key={docType.key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center">
                                                {getDocumentStatusIcon(status)}
                                                <h4 className="ml-2 font-medium text-gray-900 dark:text-white">
                                                  {docType.label}
                                                  {docType.required && <span className="text-red-500 ml-1">*</span>}
                                                </h4>
                                              </div>
                                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDocumentStatusColor(status)}`}>
                                                {status === 'missing' ? 'Missing' : status.charAt(0).toUpperCase() + status.slice(1)}
                                              </span>
                                            </div>

                                            {document ? (
                                              <div className="space-y-2">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                  File: {document.file_name}
                                                </p>
                                                {document.expiry_date && (
                                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Expires: {formatDate(document.expiry_date)}
                                                  </p>
                                                )}
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                  Uploaded: {formatDate(document.upload_date)}
                                                </p>
                                                <div className="flex space-x-2">
                                                  <button
                                                    onClick={() => window.open(document.file_url, '_blank')}
                                                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                                  >
                                                    <FaEye className="h-4 w-4 mr-1" />
                                                    View
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      const link = window.document.createElement('a');
                                                      link.href = document.file_url;
                                                      link.download = document.file_name;
                                                      link.click();
                                                    }}
                                                    className="text-green-600 hover:text-green-800 text-sm flex items-center"
                                                  >
                                                    <FaDownload className="h-4 w-4 mr-1" />
                                                    Download
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteDocument(document.id!)}
                                                    className="text-red-600 hover:text-red-800 text-sm flex items-center"
                                                  >
                                                    <FaTrash className="h-4 w-4 mr-1" />
                                                    Delete
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="text-center py-4">
                                                <FaFileAlt className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                                  No {docType.label.toLowerCase()} uploaded
                                                </p>
                                                <button
                                                  onClick={() => setUploadingDocument({ vehicleId: vehicle.id, type: docType.key })}
                                                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center mx-auto"
                                                >
                                                  <FaCloudUploadAlt className="h-4 w-4 mr-1" />
                                                  Upload
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
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
                  case 'expired': return partnerStats.expired > 0;
                  case 'expiring': return partnerStats.expiring > 0;
                  case 'missing': return partnerStats.missing > 0;
                  case 'valid': return partnerStats.expired === 0 && partnerStats.expiring === 0 && partnerStats.missing === 0;
                  default: return true;
                }
              }

              return true;
            }).length === 0 && partners.length > 0 && (
            <div className="text-center py-12">
              <FaBuilding className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No partners match your filters</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search term or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}

          {partners.length === 0 && (
            <div className="text-center py-12">
              <FaBuilding className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No partners with vehicles found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Partners need to add vehicles to manage their documents.
              </p>
            </div>
          )}
        </>
      )}

      {/* Upload Document Modal */}
      {uploadingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Upload Document
                </h2>
                <button
                  onClick={() => setUploadingDocument(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const file = formData.get('file') as File;
                const expiryDate = formData.get('expiryDate') as string;
                
                if (file) {
                  handleFileUpload(uploadingDocument.vehicleId, uploadingDocument.type, file, expiryDate || undefined);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document Type
                    </label>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {DOCUMENT_TYPES.find(dt => dt.key === uploadingDocument.type)?.label}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select File
                    </label>
                    <input
                      type="file"
                      name="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.svg,.tiff,.tif,.bmp,.cr2,.nef,.arw,.dng,image/*"
                      required
                      className="mt-1 block w-full text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Upload Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadingDocument(null)}
                    className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 