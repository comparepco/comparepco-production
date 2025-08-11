'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaFileAlt, FaUpload, FaDownload, FaEye, FaTrash, FaCalendarAlt,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaPlus, FaEdit,
  FaShieldAlt, FaCar, FaUser, FaIdCard, FaClipboardCheck, FaSearch,
  FaFilter, FaSortAmountDown, FaFileContract, FaFileInvoice, FaCloudUploadAlt
} from 'react-icons/fa';
import { supabase } from '../../../lib/supabase/client';

interface Car {
  id: string;
  name: string;
  license_plate: string;
  make?: string;
  model?: string;
  [key: string]: any;
}

interface Document {
  id: string;
  name: string;
  type: 'insurance' | 'mot' | 'registration' | 'contract' | 'license' | 'other';
  car_id?: string;
  car_name?: string;
  driver_id?: string;
  driver_name?: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  expiry_date?: string;
  status: 'valid' | 'expiring' | 'expired' | 'pending_review' | 'approved' | 'rejected';
  notes?: string;
  category?: 'business' | 'vehicle' | 'driver' | string;
  uploader_id: string;
  created_at: string;
  updated_at: string;
}

const documentTypes = [
  { value: 'insurance', label: 'Insurance Certificate', icon: FaShieldAlt, color: 'blue' },
  { value: 'mot', label: 'MOT Certificate', icon: FaCheckCircle, color: 'green' },
  { value: 'registration', label: 'Vehicle Registration', icon: FaCar, color: 'purple' },
  { value: 'contract', label: 'Rental Contract', icon: FaFileContract, color: 'orange' },
  { value: 'license', label: 'Driving License', icon: FaIdCard, color: 'red' },
  { value: 'other', label: 'Other Document', icon: FaFileAlt, color: 'gray' }
];

const statusColors = {
  valid: 'bg-green-100 text-green-800',
  expiring: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
};

// ---------- date helpers ----------
const parseDate = (value: any): Date => {
  if (!value) return new Date(NaN);
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  if (typeof value === 'object') {
    if (typeof (value as any).toDate === 'function') return (value as any).toDate();
    if ('seconds' in value) return new Date((value as any).seconds * 1000);
  }
  return new Date(value);
};

const formatDate = (value: any): string => {
  const d = parseDate(value);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};
// ---------- end helpers ----------

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [carFilter, setCarFilter] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [vehicleDocuments, setVehicleDocuments] = useState<Document[]>([]);
  const [expandedCars, setExpandedCars] = useState<Set<string>>(new Set());
  const [vehicleFilter, setVehicleFilter] = useState<string>('');
  const [makeFilter, setMakeFilter] = useState<string>('');
  const [modelFilter, setModelFilter] = useState<string>('');
  const [businessExpanded, setBusinessExpanded] = useState<boolean>(false);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const [newDocument, setNewDocument] = useState({
    name: '',
    type: 'other' as const,
    carId: '',
    driverId: '',
    file: null as File | null,
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
        router.replace('/');
      } else {
        // Permission checking is now handled by ProtectedRoute component
        setLoading(false);
        loadData();
      }
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Get partner ID
      let partnerId: string;
      if (user.role === 'PARTNER_STAFF') {
        const { data: staffData, error: staffError } = await supabase
          .from('partner_staff')
          .select('partner_id')
          .eq('user_id', user.id)
          .single();
        
        if (staffError || !staffData?.partner_id) {
          console.error('No partner found for staff member');
          return;
        }
        partnerId = staffData.partner_id;
      } else {
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (partnerError || !partnerData?.id) {
          console.error('No partner found for user');
          return;
        }
        partnerId = partnerData.id;
      }

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', partnerId);

      if (vehiclesError) {
        console.error('Error loading vehicles:', vehiclesError);
      } else {
        const carsList = vehiclesData || [];
        setCars(carsList);

        // Extract vehicle documents from each car
        const vehicleDocs: Document[] = [];
        carsList.forEach((car: any) => {
          if (car.documents) {
            Object.entries(car.documents).forEach(([docType, docData]: [string, any]) => {
              if (docData && docData.url) {
                const fullCarName = `${car.make || ''} ${car.model || ''} (${car.license_plate || ''})`.trim();

                vehicleDocs.push({
                  id: `${car.id}_${docType}`,
                  name: `${docType.charAt(0).toUpperCase() + docType.slice(1)} for ${fullCarName}`,
                  type: docType as any,
                  car_id: car.id,
                  car_name: fullCarName,
                  file_name: docData.url.split('/').pop() || '',
                  file_url: docData.url,
                  file_size: 0,
                  mime_type: '',
                  expiry_date: docData.expiry_date || null,
                  status: docData.status || 'valid',
                  notes: '',
                  category: 'vehicle',
                  uploader_id: car.partner_id,
                  created_at: docData.uploaded_at || new Date().toISOString(),
                  updated_at: docData.uploaded_at || new Date().toISOString()
                });
              }
            });
          }
        });
        setVehicleDocuments(vehicleDocs);
      }

      // Load drivers who have booked this partner's vehicles
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('driver_id, driver_name, driver_email, driver_phone, created_at')
        .eq('partner_id', partnerId);

      if (bookingsError) {
        console.error('Error loading bookings:', bookingsError);
      } else {
        const uniqueDrivers = new Map();
        
        bookingsData?.forEach(booking => {
          if (booking.driver_id && booking.driver_name) {
            uniqueDrivers.set(booking.driver_id, {
              id: booking.driver_id,
              name: booking.driver_name,
              email: booking.driver_email || '',
              phone: booking.driver_phone || '',
              lastBookingDate: booking.created_at
            });
          }
        });
        
        setDrivers(Array.from(uniqueDrivers.values()));
      }

      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error loading documents:', documentsError);
      } else {
        const deriveCategory = (docType: string) => {
          switch (docType) {
            case 'license':
              return 'driver';
            case 'insurance':
            case 'mot':
            case 'registration':
              return 'vehicle';
            default:
              return 'business';
          }
        };

        const documentList = (documentsData || []).map((doc: any) => {
          const document = {
            id: doc.id,
            ...doc
          } as Document;

          // Derive category if missing
          if (!document.category) {
            document.category = deriveCategory(document.type);
          }

          return document;
        });
        setDocuments(documentList);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    const allDocs = [...documents, ...vehicleDocuments];
    let filtered = [...allDocs];

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.car_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (carFilter) {
      filtered = filtered.filter(doc => doc.car_id === carFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, vehicleDocuments, searchTerm, typeFilter, statusFilter, carFilter]);

  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocument.file || !user) return;

    setUploading(true);
    try {
      // Get partner info
      let partnerId: string;
      let partnerName: string;
      
      if (user.role === 'PARTNER_STAFF') {
        const { data: staffData, error: staffError } = await supabase
          .from('partner_staff')
          .select('partner_id, partners!inner(company_name)')
          .eq('user_id', user.id)
          .single();
        
        if (staffError || !staffData?.partner_id) {
          throw new Error('No partner found for staff member');
        }
        partnerId = staffData.partner_id;
        partnerName = (staffData.partners as any)?.company_name || user.email || 'Unknown Partner';
      } else {
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('id, company_name')
          .eq('user_id', user.id)
          .single();
        
        if (partnerError || !partnerData?.id) {
          throw new Error('No partner found for user');
        }
        partnerId = partnerData.id;
        partnerName = partnerData.company_name || user.email || 'Unknown Partner';
      }

      // Upload file to storage
      const formData = new FormData();
      formData.append('file', newDocument.file);
      formData.append('folder', `partners/${partnerId}/documents`);
      formData.append('filename', `${newDocument.type}_${Date.now()}`);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }

      const uploadResult = await uploadResponse.json();
      const downloadURL = uploadResult.url;

      // Get car name if carId is provided
      let carName = '';
      if (newDocument.carId) {
        const car = cars.find(c => c.id === newDocument.carId);
        carName = car ? `${car.make || ''} ${car.model || ''} (${car.license_plate || ''})`.trim() : '';
      }

      // Get driver name if driverId is provided
      let driverName = '';
      if (newDocument.driverId) {
        const driver = drivers.find(d => d.id === newDocument.driverId);
        driverName = driver ? driver.name : '';
      }

      // Determine category based on document type
      const getCategory = (docType: string) => {
        switch (docType) {
          case 'license':
            return 'driver';
          case 'insurance':
          case 'mot':
          case 'registration':
            return 'vehicle';
          case 'contract':
            // If contract has a driver, it's a driver document, otherwise business
            return newDocument.driverId ? 'driver' : 'business';
          default:
            return 'business';
        }
      };

      const documentData = {
        partner_id: partnerId,
        uploader_id: user.id,
        name: newDocument.name,
        type: newDocument.type,
        category: getCategory(newDocument.type),
        car_id: newDocument.carId || null,
        car_name: carName || null,
        driver_id: newDocument.driverId || null,
        driver_name: driverName || null,
        file_name: newDocument.file.name,
        file_url: downloadURL,
        file_size: newDocument.file.size,
        mime_type: newDocument.file.type,
        expiry_date: newDocument.expiryDate || null,
        notes: newDocument.notes,
        uploader_name: partnerName,
        uploader_email: user.email,
        uploader_type: user.role === 'PARTNER' ? 'partner' : 'staff',
        partner_name: partnerName,
        status: 'pending_review'
      };

      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (insertError) {
        throw new Error('Failed to save document to database');
      }

      // If it's a vehicle document, update vehicle documents
      if (['insurance', 'mot', 'registration'].includes(newDocument.type) && newDocument.carId) {
        await supabase
          .from('vehicles')
          .update({
            documents: {
              ...cars.find(c => c.id === newDocument.carId)?.documents,
              [newDocument.type]: {
                url: downloadURL,
                file_name: newDocument.file.name,
                expiry_date: newDocument.expiryDate || null,
                status: 'pending_review',
                document_id: document.id
              }
            }
          })
          .eq('id', newDocument.carId);
      }

      setShowUpload(false);
      setNewDocument({
        name: '',
        type: 'other',
        carId: '',
        driverId: '',
        file: null,
        expiryDate: '',
        notes: ''
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (document: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (error) {
        throw error;
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const getDocumentIcon = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.icon : FaFileAlt;
  };

  const getDocumentColor = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.color : 'gray';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpiryStatus = (document: Document) => {
    if (!document.expiry_date) return null;
    
    const expiryDate = (document.expiry_date as any)?.toDate
      ? (document.expiry_date as any).toDate()
      : new Date(document.expiry_date as string);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { type: 'expired', message: `Expired ${Math.abs(daysUntilExpiry)} days ago`, color: 'text-red-600' };
    } else if (daysUntilExpiry <= 30) {
      return { type: 'expiring', message: `Expires in ${daysUntilExpiry} days`, color: 'text-yellow-600' };
    } else {
      return { type: 'valid', message: `Expires ${expiryDate.toLocaleDateString()}`, color: 'text-green-600' };
    }
  };

  const getStatusBadge = (status: string, expiryStatus?: any) => {
    if (expiryStatus?.type === 'expired') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Expired</span>;
    } else if (expiryStatus?.type === 'expiring') {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Expiring Soon</span>;
    }
    
    switch (status) {
      case 'valid':
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Valid</span>;
      case 'expiring':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Expiring Soon</span>;
      case 'expired':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Expired</span>;
      case 'pending_review':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending Review</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold">Loading documents...</div>
      </div>
    );
  }

  if (!user) return null;

  const businessDocuments = filteredDocuments.filter(d => d.category === 'business');

  const vehicleCategoryDocuments = filteredDocuments.filter(d => d.category === 'vehicle');

  let vehicleDocsToGroup = vehicleCategoryDocuments;
  if (makeFilter) {
    vehicleDocsToGroup = vehicleDocsToGroup.filter(d => {
      const car = cars.find(c => c.id === d.car_id);
      return car?.make?.toLowerCase() === makeFilter.toLowerCase();
    });
  }
  if (modelFilter) {
    vehicleDocsToGroup = vehicleDocsToGroup.filter(d => {
      const car = cars.find(c => c.id === d.car_id);
      return car?.model?.toLowerCase() === modelFilter.toLowerCase();
    });
  }
  if (vehicleFilter) {
    vehicleDocsToGroup = vehicleDocsToGroup.filter(d => d.car_id === vehicleFilter);
  }

  // Group vehicle documents first by car, then by document type so we can display a single primary card + history per (car, docType)
  const vehicleDocsByCar: {
    [carId: string]: {
      carName: string;
      docsByType: { [docType: string]: Document[] };
    };
  } = {};

  vehicleDocsToGroup.forEach((doc) => {
    const carId = doc.car_id || 'uncategorised';
    if (!vehicleDocsByCar[carId]) {
      vehicleDocsByCar[carId] = {
        carName: doc.car_name || 'Unassigned Vehicle',
        docsByType: {},
      };
    }

    if (!vehicleDocsByCar[carId].docsByType[doc.type]) {
      vehicleDocsByCar[carId].docsByType[doc.type] = [];
    }

    vehicleDocsByCar[carId].docsByType[doc.type].push(doc);
  });

  // Combine Firestore and per-vehicle docs for overall statistics
  const allDocs = [...documents, ...vehicleDocuments];
  const stats = {
    total: allDocs.length,
    valid: allDocs.filter((d) => d.status === 'valid').length,
    expiring: allDocs.filter((d) => d.status === 'expiring').length,
    expired: allDocs.filter((d) => d.status === 'expired').length,
  };

  const uniqueMakes = Array.from(new Set(cars.map(c => c.make).filter(Boolean)));
  const uniqueModels = Array.from(new Set(cars.filter(c=> !makeFilter || c.make===makeFilter).map(c => c.model).filter(Boolean)));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600">
            {filteredDocuments.length} of {documents.length} documents
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <FaUpload /> Upload Document
          </button>
        </div>
      </div>

      {/* Stats Cards (partner-dashboard style) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        {[
          {
            key: '',
            title: 'Total Documents',
            subtitle: 'All uploaded',
            count: stats.total,
            icon: FaFileAlt,
            color: 'blue',
          },
          {
            key: 'valid',
            title: 'Valid',
            subtitle: 'Up to date',
            count: stats.valid,
            icon: FaCheckCircle,
            color: 'green',
          },
          {
            key: 'expiring',
            title: 'Expiring',
            subtitle: 'Within 30 days',
            count: stats.expiring,
            icon: FaClock,
            color: 'yellow',
          },
          {
            key: 'expired',
            title: 'Expired',
            subtitle: 'Past due',
            count: stats.expired,
            icon: FaExclamationTriangle,
            color: 'red',
          },
        ].map((card) => {
          const gradientMap: Record<string,string> = {
            blue:'from-blue-500 to-blue-600',
            green:'from-green-500 to-green-600',
            yellow:'from-yellow-500 to-orange-600',
            red:'from-red-500 to-red-600'
          };
          const subtitleColor: Record<string,string> = {
            blue:'text-blue-600',
            green:'text-green-600',
            yellow:'text-yellow-600',
            red:'text-red-600'
          };
          const Icon = card.icon;
          const isActive = statusFilter === card.key || (card.key === '' && statusFilter === '');
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.key as any)}
              className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${isActive ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{card.count}</p>
                  <p className={`text-xs mt-1 ${subtitleColor[card.color]}`}>{card.subtitle}</p>
                </div>
                <div className={`bg-gradient-to-br ${gradientMap[card.color]} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="">All Types</option>
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <select
            value={carFilter}
            onChange={(e) => setCarFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
          >
            <option value="">All Cars</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>{`${car.make ?? ''} ${car.model ?? ''} (${car.license_plate ?? ''})`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Business Documents */}
      <div className="bg-white rounded-xl shadow-sm border mb-10">
        <button type="button" onClick={()=>setBusinessExpanded(prev=>!prev)} className="border-b border-gray-200 p-4 w-full flex flex-row items-center justify-between bg-gray-50 hover:bg-gray-100 text-left">
          <h2 className="text-lg font-semibold text-gray-900">Business Documents</h2>
          <span className="text-sm text-gray-500">{businessExpanded ? '▲' : '▼'}</span>
        </button>
        {businessExpanded && (businessDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FaFileAlt className="mx-auto text-gray-400 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No business documents</h3>
            <p className="text-gray-600 mb-6">
              Upload business documents (e.g. contracts, company certificates) to see them here.
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => setShowUpload(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                <FaUpload /> Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {businessDocuments.map((document) => {
              const Icon = getDocumentIcon(document.type);
              const color = getDocumentColor(document.type);
              const expiryStatus = getExpiryStatus(document);
              
              return (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
                      <Icon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{document.name}</h3>
                      <p className="text-sm text-gray-600 truncate">{document.file_name}</p>
                      {document.car_name && (
                        <p className="text-sm text-blue-600">🚗 {document.car_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium">{formatFileSize(document.file_size)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{documentTypes.find(t => t.value === document.type)?.label}</span>
                    </div>
                    {expiryStatus && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[document.status as keyof typeof statusColors]}`}>
                          {expiryStatus.message}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {document.status === 'expired' && (
                      <button
                        onClick={() => {
                          setNewDocument({
                            name: document.name,
                            type: document.type as any,
                            carId: document.car_id || '',
                            driverId: '',
                            file: null,
                            expiryDate: '',
                            notes: document.notes || ''
                          });
                          setShowUpload(true);
                        }}
                        className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition"
                        title="Re-upload"
                      >
                        <FaCloudUploadAlt />
                      </button>
                    )}
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition"
                    >
                      <FaEye /> View
                    </a>
                    <a
                      href={document.file_url}
                      download={document.file_name}
                      className="inline-flex items-center justify-center text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition"
                      title="Download"
                    >
                      <FaDownload />
                    </a>
                    <button
                      onClick={() => {
                        setSelectedDocument(document);
                        setShowDetails(true);
                      }}
                      className="inline-flex items-center justify-center text-gray-600 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-lg transition"
                      title="Details"
                    >
                      <FaEdit />
                    </button>
                    {document.status !== 'expired' && (
                      <button
                        onClick={() => deleteDocument(document)}
                        className="inline-flex items-center justify-center text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Vehicle Documents */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Vehicle Documents</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={makeFilter}
              onChange={e => {
                setMakeFilter(e.target.value);
                setModelFilter('');
                setVehicleFilter('');
                setExpandedCars(new Set());
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Makes</option>
              {uniqueMakes.map(mk => (
                <option key={mk} value={mk}>{mk}</option>
              ))}
            </select>
            <select
              value={modelFilter}
              onChange={e => {
                setModelFilter(e.target.value);
                setVehicleFilter('');
                setExpandedCars(new Set());
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Models</option>
              {uniqueModels.map(md => (
                <option key={md} value={md}>{md}</option>
              ))}
            </select>
          </div>
        </div>
        {vehicleCategoryDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FaFileAlt className="mx-auto text-gray-400 text-6xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No vehicle documents
            </h3>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            {Object.entries(vehicleDocsByCar).map(([carId, group]) => (
              <div key={carId} className="border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedCars((prev: Set<string>) => {
                      const newSet = new Set(prev);
                      if (newSet.has(carId)) {
                        newSet.delete(carId);
                      } else {
                        newSet.add(carId);
                      }
                      return newSet;
                    });
                  }}
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 text-left"
                >
                  <span className="font-semibold text-blue-700">{group.carName}</span>
                  <span className="text-sm text-gray-500">{expandedCars.has(carId) ? '▲' : '▼'}</span>
                </button>
                {expandedCars.has(carId) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                    {Object.entries(group.docsByType).map(([docType, docs]) => {
                      // Sort docs newest first (createdAt desc) so index 0 is latest
                      const sortedDocs = [...docs].sort((a, b) => {
                        const aDate = (a.created_at as any)?.toDate ? (a.created_at as any).toDate() : new Date(a.created_at || 0);
                        const bDate = (b.created_at as any)?.toDate ? (b.created_at as any).toDate() : new Date(b.created_at || 0);
                        return bDate.getTime() - aDate.getTime();
                      });

                      // Determine primary document following priority: non-expired first, else latest expired
                      const primaryDoc =
                        sortedDocs.find((d) => d.status !== 'expired') || sortedDocs[0];

                      const historyDocs = sortedDocs.filter((d) => d.id !== primaryDoc.id);

                      const Icon = getDocumentIcon(primaryDoc.type);
                      const color = getDocumentColor(primaryDoc.type);
                      const expiryStatus = getExpiryStatus(primaryDoc);

                      const historyKey = `${carId}-${docType}`;

                      return (
                        <div key={historyKey} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          {/* Primary document header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
                              <Icon />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {documentTypes.find((t) => t.value === docType)?.label}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">{primaryDoc.file_name}</p>
                              {primaryDoc.car_name && (
                                <p className="text-sm text-blue-600">🚗 {primaryDoc.car_name}</p>
                              )}
                            </div>

                            {historyDocs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedHistory((prev: Set<string>) => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(historyKey)) {
                                      newSet.delete(historyKey);
                                    } else {
                                      newSet.add(historyKey);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                              >
                                {expandedHistory.has(historyKey) ? 'Hide History' : `History (${historyDocs.length})`}
                              </button>
                            )}
                          </div>

                          {/* Primary details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Size:</span>
                              <span className="font-medium">{formatFileSize(primaryDoc.file_size)}</span>
                            </div>
                            {expiryStatus && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[primaryDoc.status as keyof typeof statusColors]}`}>
                                  {expiryStatus.message}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons for primary */}
                          <div className="flex items-center gap-2 mb-2">
                            {primaryDoc.status === 'expired' && (
                              <button
                                onClick={() => {
                                  setNewDocument({
                                    name: primaryDoc.name,
                                    type: primaryDoc.type as any,
                                    carId: primaryDoc.car_id || '',
                                    driverId: '',
                                    file: null,
                                    expiryDate: '',
                                    notes: primaryDoc.notes || '',
                                  });
                                  setShowUpload(true);
                                }}
                                className="inline-flex items-center justify-center text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition"
                                title="Re-upload"
                              >
                                <FaCloudUploadAlt />
                              </button>
                            )}
                            <a
                              href={primaryDoc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition"
                            >
                              <FaEye /> View
                            </a>
                            <a
                              href={primaryDoc.file_url}
                              download={primaryDoc.file_name}
                              className="inline-flex items-center justify-center text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition"
                              title="Download"
                            >
                              <FaDownload />
                            </a>
                          </div>

                          {/* History list */}
                          {expandedHistory.has(historyKey) && historyDocs.length > 0 && (
                            <div className="mt-4 border-t pt-4 space-y-3">
                              {historyDocs.map((hist) => {
                                const histExpiry = getExpiryStatus(hist);
                                return (
                                  <div key={hist.id} className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
                                      <Icon />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">{hist.file_name}</p>
                                      {histExpiry && (
                                        <p className="text-xs text-gray-600">{histExpiry.message}</p>
                                      )}
                                    </div>
                                    <a
                                      href={hist.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                                    >
                                      <FaEye className="w-4 h-4" /> View
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <>
          {/* Backdrop */}
          <div 
            className="modal-overlay-backdrop"
            onClick={() => setShowUpload(false)}
          />
          
          {/* Modal Content */}
          <div className="modal-overlay pointer-events-none">
            <div className="modal-content w-full max-w-2xl mx-4 pointer-events-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
              </div>
            
            <form onSubmit={uploadDocument} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  placeholder="e.g., Insurance Certificate 2024"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Associated Car</label>
                  <select
                    value={newDocument.carId}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, carId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="">No specific car</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>{`${car.make ?? ''} ${car.model ?? ''} (${car.license_plate ?? ''})`}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Associated Driver</label>
                <select
                  value={newDocument.driverId}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, driverId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">No specific driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} {driver.email && `(${driver.email})`}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select a driver who has booked your vehicles (useful for rental contracts, etc.)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document File *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.svg,.tiff,.tif,.bmp,.cr2,.nef,.arw,.dng,image/*"
                  onChange={(e) => setNewDocument(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG, WEBP, HEIC, HEIF, GIF, SVG, TIFF, TIF, BMP, CR2, NEF, ARW, DNG, and image/* (Max 10MB)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newDocument.expiryDate}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, expiryDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newDocument.notes}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Additional notes about this document..."
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </>
      )}

      {/* Document Details Modal */}
      {showDetails && selectedDocument && (
        <>
          {/* Backdrop */}
          <div 
            className="modal-overlay-backdrop"
            onClick={() => setShowDetails(false)}
          />
          
          {/* Modal Content */}
          <div className="modal-overlay pointer-events-none">
            <div className="modal-content w-full max-w-2xl mx-4 pointer-events-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Document Details</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-${getDocumentColor(selectedDocument!.type)}-100 text-${getDocumentColor(selectedDocument!.type)}-600`}>
                  {React.createElement(getDocumentIcon(selectedDocument!.type), { className: "text-2xl" })}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedDocument!.name}</h3>
                  <p className="text-gray-600">{selectedDocument!.file_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Document Type</p>
                    <p className="text-gray-900">{documentTypes.find(t => t.value === selectedDocument!.type)?.label}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">File Size</p>
                    <p className="text-gray-900">{formatFileSize(selectedDocument!.file_size)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Upload Date</p>
                    <p className="text-gray-900">
                      {formatDate(selectedDocument!.created_at)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedDocument!.car_name && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Associated Car</p>
                      <p className="text-gray-900">{selectedDocument!.car_name}</p>
                    </div>
                  )}
                  {selectedDocument!.driver_name && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Associated Driver</p>
                      <p className="text-gray-900">{selectedDocument!.driver_name}</p>
                    </div>
                  )}
                  {selectedDocument!.expiry_date && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Expiry Date</p>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900">
                          {formatDate(selectedDocument!.expiry_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}