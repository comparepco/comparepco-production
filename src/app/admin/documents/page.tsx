'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { 
  FaFileAlt, FaSearch, FaFilter, FaCheck, FaTimes, FaExclamationTriangle, 
  FaCalendarAlt, FaUser, FaBuilding, FaDownload, FaEye, FaClock, FaFolderOpen,
  FaThumbsUp, FaThumbsDown, FaExclamationCircle, FaTrash, FaArrowLeft,
  FaShieldAlt, FaCertificate, FaIdCard, FaCar, FaHome, FaBriefcase, FaFileInvoice,
  FaFileContract, FaFileSignature, FaFileMedical, FaFileUpload, FaFileDownload, 
  FaFileArchive, FaFileExport, FaChartBar, FaChartLine, FaChartPie, FaChartArea, 
  FaDatabase, FaServer, FaNetworkWired, FaCloud, FaLock, FaUnlock, FaKey, 
  FaFingerprint, FaEyeSlash, FaEyeDropper, FaLowVision, FaUsers, FaUserTie, 
  FaUserShield, FaUserCheck, FaUserTimes, FaUserClock
} from 'react-icons/fa';
import Link from 'next/link';

interface Document {
  id: string;
  name: string;
  type: 'driving_license' | 'insurance' | 'pco_license' | 'proof_of_address' | 'business_license' | 'tax_certificate' | 'vehicle_registration' | 'mot_certificate' | 'businessLicense' | 'insuranceCertificate' | 'operatorLicense' | 'taxCertificate';
  status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'expired';
  uploader_id: string;
  uploader_name: string;
  uploader_type: 'partner' | 'driver';
  file_url?: string;
  upload_date: string;
  expiry_date?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
  category: string;
  file_size?: number;
  file_type?: string;
  verification_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  notes?: string;
  reviewer_notes?: string;
  compliance_status?: 'compliant' | 'non_compliant' | 'pending_review';
  regulatory_framework?: string;
  expiry_warning_days?: number;
}

interface DocumentMetrics {
  totalDocuments: number;
  pendingDocuments: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  expiringSoon: number;
  totalPartners: number;
  totalDrivers: number;
  averageProcessingTime: number;
  complianceRate: number;
  criticalDocuments: number;
  highRiskDocuments: number;
  mediumRiskDocuments: number;
  lowRiskDocuments: number;
  documentsByCategory: Record<string, number>;
  documentsByType: Record<string, number>;
  averageFileSize: number;
  totalFileSize: number;
  verificationRate: number;
  lastUploadDate: string;
  lastApprovalDate: string;
}

const StatsCard = ({ title, value, icon: Icon, color, onClick }: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  onClick?: () => void;
}) => (
  <div 
    className={`bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">{title}</h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
      </div>
      <Icon className={`text-2xl ${color}`} />
    </div>
  </div>
);

export default function AdminDocumentsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  
  // Approval modal state
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [documentToApprove, setDocumentToApprove] = useState<Document | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  
  // Bulk approval modal state
  const [bulkApprovalModalOpen, setBulkApprovalModalOpen] = useState(false);
  const [bulkExpiryDate, setBulkExpiryDate] = useState('');

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);
  const [detailTableData, setDetailTableData] = useState<any[]>([]);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailItemsPerPage] = useState(10);

  const metrics = useMemo((): DocumentMetrics => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const total = documents.length;
    const pending = documents.filter(d => d.status === 'pending' || d.status === 'pending_review').length;
    const approved = documents.filter(d => d.status === 'approved').length;
    const rejected = documents.filter(d => d.status === 'rejected').length;
    const expired = documents.filter(d => d.status === 'expired').length;
    const expiringSoon = documents.filter(d => 
      d.expiry_date && 
      d.status === 'approved' &&
      new Date(d.expiry_date) <= thirtyDaysFromNow &&
      new Date(d.expiry_date) > now
    ).length;

    const totalPartners = new Set(documents.filter(d => d.uploader_type === 'partner').map(d => d.uploader_id)).size;
    const totalDrivers = new Set(documents.filter(d => d.uploader_type === 'driver').map(d => d.uploader_id)).size;

    // Calculate average processing time (time from upload to approval/rejection)
    const processedDocs = documents.filter(d => d.approved_at || d.rejected_at);
    const totalProcessingTime = processedDocs.reduce((sum, doc) => {
      const uploadTime = new Date(doc.upload_date).getTime();
      const processTime = new Date(doc.approved_at || doc.rejected_at || '').getTime();
      return sum + (processTime - uploadTime);
    }, 0);
    const averageProcessingTime = processedDocs.length > 0 ? Math.round(totalProcessingTime / processedDocs.length / (1000 * 60 * 60 * 24)) : 0; // in days

    const complianceRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const criticalDocuments = documents.filter(d => d.risk_level === 'critical').length;
    const highRiskDocuments = documents.filter(d => d.risk_level === 'high').length;
    const mediumRiskDocuments = documents.filter(d => d.risk_level === 'medium').length;
    const lowRiskDocuments = documents.filter(d => d.risk_level === 'low').length;

    // Documents by category
    const documentsByCategory = documents.reduce((acc, doc) => {
      const category = doc.category || 'other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Documents by type
    const documentsByType = documents.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalFileSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
    const averageFileSize = documents.length > 0 ? Math.round(totalFileSize / documents.length) : 0;

    const verifiedDocs = documents.filter(d => d.verification_score && d.verification_score > 0).length;
    const verificationRate = documents.length > 0 ? Math.round((verifiedDocs / documents.length) * 100) : 0;

    const lastUploadDate = documents.length > 0 ? documents[0].upload_date : '';
    const lastApprovalDate = documents.filter(d => d.approved_at).sort((a, b) => 
      new Date(b.approved_at!).getTime() - new Date(a.approved_at!).getTime()
    )[0]?.approved_at || '';

    return {
      totalDocuments: total,
      pendingDocuments: pending,
      approvedDocuments: approved,
      rejectedDocuments: rejected,
      expiredDocuments: expired,
      expiringSoon,
      totalPartners,
      totalDrivers,
      averageProcessingTime,
      complianceRate,
      criticalDocuments,
      highRiskDocuments,
      mediumRiskDocuments,
      lowRiskDocuments,
      documentsByCategory,
      documentsByType,
      averageFileSize,
      totalFileSize,
      verificationRate,
      lastUploadDate,
      lastApprovalDate
    };
  }, [documents]);

  // Load documents from Supabase
  useEffect(() => {
    const loadDocuments = async () => {
      if (!authLoading && !authUser) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      try {
        const { data: documentsData, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading documents:', error);
          toast.error('Failed to load documents');
        } else {
          let documentsList = (documentsData || []).map(doc => ({
            id: doc.id,
            name: doc.name || doc.type || 'Unknown Document',
            type: doc.type,
            status: doc.status || 'pending',
            uploader_id: doc.uploader_id || doc.user_id,
            uploader_name: doc.uploader_name || 'Unknown',
            uploader_type: doc.uploader_type || 'driver',
            file_url: doc.file_url,
            upload_date: doc.upload_date,
            expiry_date: doc.expiry_date,
            rejection_reason: doc.rejection_reason,
            approved_by: doc.approved_by,
            approved_at: doc.approved_at,
            rejected_by: doc.rejected_by,
            rejected_at: doc.rejected_at,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            category: getDocumentCategory(doc.type),
            file_size: doc.file_size || Math.floor(Math.random() * 5000000) + 100000, // 100KB to 5MB
            file_type: doc.file_type || 'pdf',
            verification_score: doc.verification_score || Math.floor(Math.random() * 100),
            risk_level: doc.risk_level || ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
            priority: doc.priority || ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
            tags: doc.tags || [],
            notes: doc.notes || '',
            reviewer_notes: doc.reviewer_notes || '',
            compliance_status: doc.compliance_status || ['compliant', 'non_compliant', 'pending_review'][Math.floor(Math.random() * 3)],
            regulatory_framework: doc.regulatory_framework || ['GDPR', 'PCO Licensing', 'Vehicle Standards', 'Driver Licensing', 'Insurance Law', 'Tax Law'][Math.floor(Math.random() * 6)],
            expiry_warning_days: doc.expiry_warning_days || Math.floor(Math.random() * 30) + 1
          })) as Document[];

          // If no real data, create comprehensive mock data
          if (documentsList.length === 0) {
            const mockDocuments: Document[] = [
              {
                id: '1',
                name: 'Driving License - John Smith',
                type: 'driving_license',
                status: 'approved',
                uploader_id: 'driver-1',
                uploader_name: 'John Smith',
                uploader_type: 'driver',
                file_url: 'https://example.com/driving-license-1.pdf',
                upload_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                approved_by: 'admin@comparepcoc.co.uk',
                approved_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'driver',
                file_size: 2048576,
                file_type: 'pdf',
                verification_score: 95,
                risk_level: 'low',
                priority: 'high',
                tags: ['verified', 'clean'],
                notes: 'Valid UK driving license',
                reviewer_notes: 'Document verified and approved',
                compliance_status: 'compliant',
                regulatory_framework: 'Driver Licensing',
                expiry_warning_days: 15
              },
              {
                id: '2',
                name: 'PCO License - Sarah Johnson',
                type: 'pco_license',
                status: 'pending',
                uploader_id: 'driver-2',
                uploader_name: 'Sarah Johnson',
                uploader_type: 'driver',
                file_url: 'https://example.com/pco-license-2.pdf',
                upload_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'driver',
                file_size: 1536000,
                file_type: 'pdf',
                verification_score: 0,
                risk_level: 'medium',
                priority: 'high',
                tags: ['pending_review'],
                notes: 'PCO license application',
                reviewer_notes: '',
                compliance_status: 'pending_review',
                regulatory_framework: 'PCO Licensing',
                expiry_warning_days: 30
              },
              {
                id: '3',
                name: 'Business License - ABC Transport Ltd',
                type: 'business_license',
                status: 'approved',
                uploader_id: 'partner-1',
                uploader_name: 'ABC Transport Ltd',
                uploader_type: 'partner',
                file_url: 'https://example.com/business-license-3.pdf',
                upload_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                expiry_date: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString(),
                approved_by: 'admin@comparepcoc.co.uk',
                approved_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'business',
                file_size: 3072000,
                file_type: 'pdf',
                verification_score: 88,
                risk_level: 'medium',
                priority: 'medium',
                tags: ['verified', 'business'],
                notes: 'Valid business license',
                reviewer_notes: 'Business license verified and approved',
                compliance_status: 'compliant',
                regulatory_framework: 'Business Licensing',
                expiry_warning_days: 20
              },
              {
                id: '4',
                name: 'Insurance Certificate - XYZ Fleet',
                type: 'insurance',
                status: 'rejected',
                uploader_id: 'partner-2',
                uploader_name: 'XYZ Fleet',
                uploader_type: 'partner',
                file_url: 'https://example.com/insurance-4.pdf',
                upload_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                rejected_by: 'admin@comparepcoc.co.uk',
                rejected_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                rejection_reason: 'Insurance certificate expired',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'insurance',
                file_size: 2560000,
                file_type: 'pdf',
                verification_score: 0,
                risk_level: 'high',
                priority: 'critical',
                tags: ['rejected', 'expired'],
                notes: 'Insurance certificate submission',
                reviewer_notes: 'Certificate expired, please provide current certificate',
                compliance_status: 'non_compliant',
                regulatory_framework: 'Insurance Law',
                expiry_warning_days: 0
              },
              {
                id: '5',
                name: 'Vehicle Registration - Toyota Prius',
                type: 'vehicle_registration',
                status: 'approved',
                uploader_id: 'driver-3',
                uploader_name: 'Mike Wilson',
                uploader_type: 'driver',
                file_url: 'https://example.com/vehicle-reg-5.pdf',
                upload_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                expiry_date: new Date(Date.now() + 340 * 24 * 60 * 60 * 1000).toISOString(),
                approved_by: 'admin@comparepcoc.co.uk',
                approved_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'vehicle',
                file_size: 1024000,
                file_type: 'pdf',
                verification_score: 92,
                risk_level: 'low',
                priority: 'medium',
                tags: ['verified', 'vehicle'],
                notes: 'Vehicle registration document',
                reviewer_notes: 'Registration verified and approved',
                compliance_status: 'compliant',
                regulatory_framework: 'Vehicle Standards',
                expiry_warning_days: 25
              },
              {
                id: '6',
                name: 'Proof of Address - Emma Davis',
                type: 'proof_of_address',
                status: 'pending',
                uploader_id: 'driver-4',
                uploader_name: 'Emma Davis',
                uploader_type: 'driver',
                file_url: 'https://example.com/address-proof-6.pdf',
                upload_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'driver',
                file_size: 512000,
                file_type: 'pdf',
                verification_score: 0,
                risk_level: 'medium',
                priority: 'medium',
                tags: ['pending_review'],
                notes: 'Proof of address document',
                reviewer_notes: '',
                compliance_status: 'pending_review',
                regulatory_framework: 'Driver Licensing',
                expiry_warning_days: 180
              },
              {
                id: '7',
                name: 'Tax Certificate - Premier Cars',
                type: 'tax_certificate',
                status: 'approved',
                uploader_id: 'partner-3',
                uploader_name: 'Premier Cars',
                uploader_type: 'partner',
                file_url: 'https://example.com/tax-cert-7.pdf',
                upload_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                expiry_date: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000).toISOString(),
                approved_by: 'admin@comparepcoc.co.uk',
                approved_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'business',
                file_size: 4096000,
                file_type: 'pdf',
                verification_score: 97,
                risk_level: 'high',
                priority: 'high',
                tags: ['verified', 'tax'],
                notes: 'Tax compliance certificate',
                reviewer_notes: 'Tax certificate verified and approved',
                compliance_status: 'compliant',
                regulatory_framework: 'Tax Law',
                expiry_warning_days: 10
              },
              {
                id: '8',
                name: 'MOT Certificate - Ford Focus',
                type: 'mot_certificate',
                status: 'expired',
                uploader_id: 'driver-5',
                uploader_name: 'David Brown',
                uploader_type: 'driver',
                file_url: 'https://example.com/mot-cert-8.pdf',
                upload_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
                expiry_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                approved_by: 'admin@comparepcoc.co.uk',
                approved_at: new Date(Date.now() - 395 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 395 * 24 * 60 * 60 * 1000).toISOString(),
                category: 'vehicle',
                file_size: 1536000,
                file_type: 'pdf',
                verification_score: 85,
                risk_level: 'critical',
                priority: 'critical',
                tags: ['expired', 'vehicle'],
                notes: 'MOT certificate',
                reviewer_notes: 'MOT certificate has expired',
                compliance_status: 'non_compliant',
                regulatory_framework: 'Vehicle Standards',
                expiry_warning_days: 0
              }
            ];
            documentsList = mockDocuments;
          }

          // Enrich with uploader names if missing
          const enrichedDocuments = await Promise.all(
            documentsList.map(async (doc) => {
              if (!doc.uploader_name || doc.uploader_name === 'Unknown' || !doc.uploader_id) {
                try {
                  // Try to get uploader info from partners
                  let { data: partnerData } = await supabase
                    .from('partners')
                    .select('id, name, company_name')
                    .eq('id', doc.uploader_id)
                    .single();

                  if (partnerData) {
                    doc.uploader_name = partnerData.company_name || partnerData.name || doc.uploader_name;
                    doc.uploader_type = 'partner';
                  } else {
                    // Try drivers
                    const { data: driverData } = await supabase
                      .from('drivers')
                      .select('id, name')
                      .eq('id', doc.uploader_id)
                      .single();

                    if (driverData) {
                      doc.uploader_name = driverData.name || doc.uploader_name;
                      doc.uploader_type = 'driver';
                    }
                  }
                } catch (error) {
                  console.error('Error fetching uploader info:', error);
                }
              }
              return doc;
            })
          );

          setDocuments(enrichedDocuments);
          console.log('📋 Loaded documents:', enrichedDocuments.length, enrichedDocuments);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [authUser, authLoading, router]);

  // Filter documents based on filters
  useEffect(() => {
    let filtered = documents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.uploader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(d => d.status === 'pending' || d.status === 'pending_review');
      } else {
        filtered = filtered.filter(d => d.status === statusFilter);
      }
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(d => d.type === typeFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, statusFilter, typeFilter]);

  // Helper function to get default expiry period for document types (in months)
  const getDefaultExpiryPeriod = (documentType: string): number => {
    const expiryPeriods: Record<string, number> = {
      // Driver documents
      driving_license: 120, // 10 years
      insurance: 12, // 1 year
      pco_license: 36, // 3 years
      proof_of_address: 6, // 6 months
      vehicle_registration: 12, // 1 year
      mot_certificate: 12, // 1 year
      
      // Partner documents
      businessLicense: 12, // 1 year
      business_license: 12, // 1 year
      insuranceCertificate: 12, // 1 year
      operatorLicense: 60, // 5 years
      taxCertificate: 12, // 1 year
      tax_certificate: 12, // 1 year
    };
    
    return expiryPeriods[documentType] || 12; // Default to 1 year
  };

  // Helper function to calculate default expiry date
  const getDefaultExpiryDate = (documentType: string): string => {
    const months = getDefaultExpiryPeriod(documentType);
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    return expiryDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  };

  // Add a categorization function for document types:
  function getDocumentCategory(type: string): string {
    switch (type) {
      case 'tax_certificate':
      case 'taxCertificate':
      case 'business_license':
      case 'businessLicense':
      case 'operator_license':
      case 'operatorLicense':
        return 'business';
      case 'insurance_certificate':
      case 'insuranceCertificate':
        return 'insurance';
      case 'vehicle_registration':
      case 'mot_certificate':
        return 'vehicle';
      case 'driving_license':
      case 'pco_license':
      case 'proof_of_address':
      case 'passport':
      case 'national_insurance':
      case 'right_to_work':
        return 'driver';
      case 'compliance_certificate':
      case 'safety_certificate':
        return 'compliance';
      default:
        return 'other';
    }
  }

  const handleApproveDocument = async (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) return;
    
    setDocumentToApprove(document);
    setExpiryDate(getDefaultExpiryDate(document.type));
    setApprovalModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!documentToApprove) return;
    
    try {
      const updateData: any = {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: authUser?.id,
        updated_at: new Date().toISOString()
      };
      
      // Add expiry date if provided
      if (expiryDate) {
        updateData.expiry_date = new Date(expiryDate).toISOString();
      }
      
      // Update document in Supabase
      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentToApprove.id);

      if (error) {
        throw error;
      }

      // Mirror update into partner/driver embedded documents
      const uploaderId = documentToApprove.uploader_id;
      const docType = documentToApprove.type;

      // Helper to update embedded doc info
      const updateEmbeddedDoc = async (tableName: string, recordId: string) => {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            [`documents.${docType}.status`]: 'approved',
            [`documents.${docType}.approved_at`]: new Date().toISOString(),
            [`documents.${docType}.approved_by`]: authUser?.name || 'Admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', recordId);

        if (updateError) {
          console.error(`Error updating ${tableName}:`, updateError);
        }
      };

      // Update partner / driver records accordingly
      if (documentToApprove.uploader_type === 'partner') {
        await updateEmbeddedDoc('partners', uploaderId);

        // Check if all partner documents are now approved and auto-activate partner
        const { data: partnerData } = await supabase
          .from('partners')
          .select('documents, status')
          .eq('id', uploaderId)
          .single();

        if (partnerData) {
          const docsObj = partnerData.documents || {};
          const allApproved = Object.values(docsObj).every((d: any) => d && d.status === 'approved');
          if (allApproved && partnerData.status !== 'active') {
            await supabase
              .from('partners')
              .update({
                status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: authUser?.name || 'Admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', uploaderId);
          }
        }
      } else if (documentToApprove.uploader_type === 'driver') {
        await updateEmbeddedDoc('drivers', uploaderId);

        // Auto activate driver if all documents are approved
        const { data: driverData } = await supabase
          .from('drivers')
          .select('documents, status')
          .eq('id', uploaderId)
          .single();

        if (driverData) {
          const docsObj = driverData.documents || {};
          const allApproved = Object.values(docsObj).every((d: any) => d && d.status === 'approved');
          if (allApproved && driverData.status !== 'active') {
            await supabase
              .from('drivers')
              .update({
                status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: authUser?.name || 'Admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', uploaderId);
          }
        }
      }
      
      toast.success('Document approved with expiry date set');
      
      // Close modal and reset state
      setApprovalModalOpen(false);
      setDocumentToApprove(null);
      setExpiryDate('');

      // Refresh documents
      const { data: updatedDocs } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedDocs) {
        setDocuments(updatedDocs.map(doc => ({
          id: doc.id,
          name: doc.name || doc.type || 'Unknown Document',
          type: doc.type,
          status: doc.status || 'pending',
          uploader_id: doc.uploader_id || doc.user_id,
          uploader_name: doc.uploader_name || 'Unknown',
          uploader_type: doc.uploader_type || 'driver',
          file_url: doc.file_url,
          upload_date: doc.upload_date,
          expiry_date: doc.expiry_date,
          rejection_reason: doc.rejection_reason,
          approved_by: doc.approved_by,
          approved_at: doc.approved_at,
          rejected_by: doc.rejected_by,
          rejected_at: doc.rejected_at,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          category: getDocumentCategory(doc.type)
        })));
      }
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    }
  };

  const handleRejectDocument = async (documentId: string) => {
    const reason = prompt('Enter rejection reason (optional):') || 'Document rejected by admin';
    
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'rejected',
          rejected_at: now,
          rejected_by: authUser?.id,
          rejection_reason: reason,
          updated_at: now
        })
        .eq('id', documentId);

      if (error) {
        throw error;
      }

      // Mirror to partner/driver embedded docs
      const rejectedDoc = documents.find(d => d.id === documentId);
      if (rejectedDoc) {
        const docType = rejectedDoc.type;

        const mirrorReject = async (tableName: string, recordId: string) => {
          const { error: updateError } = await supabase
            .from(tableName)
            .update({
              [`documents.${docType}.status`]: 'rejected',
              [`documents.${docType}.rejected_at`]: now,
              [`documents.${docType}.rejected_by`]: authUser?.name || 'Admin',
              [`documents.${docType}.rejection_reason`]: reason,
              updated_at: now
            })
            .eq('id', recordId);

          if (updateError) {
            console.error(`Error updating ${tableName}:`, updateError);
          }
        };

        if (rejectedDoc.uploader_type === 'partner') {
          await mirrorReject('partners', rejectedDoc.uploader_id);
        } else if (rejectedDoc.uploader_type === 'driver') {
          await mirrorReject('drivers', rejectedDoc.uploader_id);
        }
      }

      toast.success('Document rejected successfully');
      
      // Refresh documents
      const { data: updatedDocs } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedDocs) {
        setDocuments(updatedDocs.map(doc => ({
          id: doc.id,
          name: doc.name || doc.type || 'Unknown Document',
          type: doc.type,
          status: doc.status || 'pending',
          uploader_id: doc.uploader_id || doc.user_id,
          uploader_name: doc.uploader_name || 'Unknown',
          uploader_type: doc.uploader_type || 'driver',
          file_url: doc.file_url,
          upload_date: doc.upload_date,
          expiry_date: doc.expiry_date,
          rejection_reason: doc.rejection_reason,
          approved_by: doc.approved_by,
          approved_at: doc.approved_at,
          rejected_by: doc.rejected_by,
          rejected_at: doc.rejected_at,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          category: getDocumentCategory(doc.type)
        })));
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    }
  };

  useEffect(() => {
    const loadDocuments = async () => {
      if (!authLoading && !authUser) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      try {
        const { data: documentsData, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading documents:', error);
          toast.error('Failed to load documents');
        } else {
          const documentsList = (documentsData || []).map(doc => ({
            id: doc.id,
            name: doc.name || doc.type || 'Unknown Document',
            type: doc.type,
            status: doc.status || 'pending',
            uploader_id: doc.uploader_id || doc.user_id,
            uploader_name: doc.uploader_name || 'Unknown',
            uploader_type: doc.uploader_type || 'driver',
            file_url: doc.file_url,
            upload_date: doc.upload_date,
            expiry_date: doc.expiry_date,
            rejection_reason: doc.rejection_reason,
            approved_by: doc.approved_by,
            approved_at: doc.approved_at,
            rejected_by: doc.rejected_by,
            rejected_at: doc.rejected_at,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            category: doc.category
          })) as Document[];

          setDocuments(documentsList);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [authUser, authLoading, router]);

  // Filter documents based on filters
  useEffect(() => {
    let filtered = documents;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.uploader_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter(d => d.status === 'pending' || d.status === 'pending_review');
      } else {
        filtered = filtered.filter(d => d.status === statusFilter);
      }
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(d => d.type === typeFilter);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, statusFilter, typeFilter]);



  const handleBulkApprove = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select documents to approve');
      return;
    }

    // Set default expiry date to 1 year from now for bulk approval
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    setBulkExpiryDate(defaultDate.toISOString().split('T')[0]);
    setBulkApprovalModalOpen(true);
  };

  const handleConfirmBulkApproval = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select documents to approve');
      return;
    }

    try {
      // Process documents one by one to avoid complex Promise handling
      for (const docId of selectedDocuments) {
        const updateData: any = {
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: authUser?.id,
          updated_at: new Date().toISOString()
        };
        
        // Add expiry date if provided
        if (bulkExpiryDate) {
          updateData.expiry_date = new Date(bulkExpiryDate).toISOString();
        }
        
        // Update document
        await supabase
          .from('documents')
          .update(updateData)
          .eq('id', docId);

        // Mirror to partner/driver embedded document
        const matchingDoc = documents.find(d => d.id === docId);
        if (matchingDoc) {
          const docType2 = matchingDoc.type;

          if (matchingDoc.uploader_type === 'partner') {
            await supabase
              .from('partners')
              .update({
                [`documents.${docType2}.status`]: 'approved',
                [`documents.${docType2}.approved_at`]: new Date().toISOString(),
                [`documents.${docType2}.approved_by`]: authUser?.name || 'Admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', matchingDoc.uploader_id);
          }
          if (matchingDoc.uploader_type === 'driver') {
            await supabase
              .from('drivers')
              .update({
                [`documents.${docType2}.status`]: 'approved',
                [`documents.${docType2}.approved_at`]: new Date().toISOString(),
                [`documents.${docType2}.approved_by`]: authUser?.name || 'Admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', matchingDoc.uploader_id);
          }
        }
      }

      // Post-bulk-approval: Check and activate partners if all their documents are now approved
      const partnerIds = new Set<string>();
      const driverIds = new Set<string>();
      selectedDocuments.forEach(docId => {
        const matchingDoc = documents.find(d => d.id === docId);
        if (matchingDoc?.uploader_type === 'partner') {
          partnerIds.add(matchingDoc.uploader_id);
        }
        if (matchingDoc?.uploader_type === 'driver') {
          driverIds.add(matchingDoc.uploader_id);
        }
      });

      // Check each partner to see if all their documents are now approved
      for (const partnerId of Array.from(partnerIds)) {
        const { data: partnerData } = await supabase
          .from('partners')
          .select('documents, status')
          .eq('id', partnerId)
          .single();

        if (partnerData) {
          const docsObj = partnerData.documents || {};
          const allApproved = Object.values(docsObj).every((d: any) => d && d.status === 'approved');
          if (allApproved && partnerData.status !== 'active') {
            await supabase
              .from('partners')
              .update({
                status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: authUser?.name || 'Admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', partnerId);
          }
        }
      }

      // Check each driver to see if all their documents are now approved
      for (const driverId of Array.from(driverIds)) {
        const { data: driverData } = await supabase
          .from('drivers')
          .select('documents, status')
          .eq('id', driverId)
          .single();

        if (driverData) {
          const docsObj = driverData.documents || {};
          const allApproved = Object.values(docsObj).every((d: any) => d && d.status === 'approved');
          if (allApproved && driverData.status !== 'active') {
            await supabase
              .from('drivers')
              .update({
                status: 'active',
                approved_at: new Date().toISOString(),
                approved_by: authUser?.name || 'Admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', driverId);
          }
        }
      }

      toast.success(`Successfully approved ${selectedDocuments.length} documents`);
      setSelectedDocuments([]);
      setBulkApprovalModalOpen(false);
      setBulkExpiryDate('');

      // Refresh documents
      const { data: updatedDocs } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedDocs) {
        setDocuments(updatedDocs.map(doc => ({
          id: doc.id,
          name: doc.name || doc.type || 'Unknown Document',
          type: doc.type,
          status: doc.status || 'pending',
          uploader_id: doc.uploader_id || doc.user_id,
          uploader_name: doc.uploader_name || 'Unknown',
          uploader_type: doc.uploader_type || 'driver',
          file_url: doc.file_url,
          upload_date: doc.upload_date,
          expiry_date: doc.expiry_date,
          rejection_reason: doc.rejection_reason,
          approved_by: doc.approved_by,
          approved_at: doc.approved_at,
          rejected_by: doc.rejected_by,
          rejected_at: doc.rejected_at,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          category: getDocumentCategory(doc.type)
        })));
      }
    } catch (error) {
      console.error('Error bulk approving documents:', error);
      toast.error('Failed to approve documents');
    }
  };

  const handleBulkReject = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select documents to reject');
      return;
    }

    const reason = prompt('Enter rejection reason (optional):') || 'Documents rejected by admin';

    try {
      // Process documents one by one to avoid complex Promise handling
      for (const docId of selectedDocuments) {
        const updateData: any = {
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: authUser?.id,
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        };
        
        // Update document
        await supabase
          .from('documents')
          .update(updateData)
          .eq('id', docId);

        // Mirror to partner/driver embedded docs
        const matchDoc = documents.find(d => d.id === docId);
        if (matchDoc) {
          const docType2 = matchDoc.type;

          if (matchDoc.uploader_type === 'partner') {
            await supabase
              .from('partners')
              .update({
                [`documents.${docType2}.status`]: 'rejected',
                [`documents.${docType2}.rejected_at`]: new Date().toISOString(),
                [`documents.${docType2}.rejected_by`]: authUser?.name || 'Admin',
                [`documents.${docType2}.rejection_reason`]: reason,
                updated_at: new Date().toISOString()
              })
              .eq('id', matchDoc.uploader_id);
          }
          if (matchDoc.uploader_type === 'driver') {
            await supabase
              .from('drivers')
              .update({
                [`documents.${docType2}.status`]: 'rejected',
                [`documents.${docType2}.rejected_at`]: new Date().toISOString(),
                [`documents.${docType2}.rejected_by`]: authUser?.name || 'Admin',
                [`documents.${docType2}.rejection_reason`]: reason,
                updated_at: new Date().toISOString()
              })
              .eq('id', matchDoc.uploader_id);
          }
        }
      }
      toast.success(`${selectedDocuments.length} documents rejected`);
      setSelectedDocuments([]);

      // Refresh documents
      const { data: updatedDocs } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (updatedDocs) {
        setDocuments(updatedDocs.map(doc => ({
          id: doc.id,
          name: doc.name || doc.type || 'Unknown Document',
          type: doc.type,
          status: doc.status || 'pending',
          uploader_id: doc.uploader_id || doc.user_id,
          uploader_name: doc.uploader_name || 'Unknown',
          uploader_type: doc.uploader_type || 'driver',
          file_url: doc.file_url,
          upload_date: doc.upload_date,
          expiry_date: doc.expiry_date,
          rejection_reason: doc.rejection_reason,
          approved_by: doc.approved_by,
          approved_at: doc.approved_at,
          rejected_by: doc.rejected_by,
          rejected_at: doc.rejected_at,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          category: getDocumentCategory(doc.type)
        })));
      }
    } catch (error) {
      console.error('Error bulk rejecting documents:', error);
      toast.error('Failed to reject documents');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select documents to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete ${selectedDocuments.length} selected documents? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const deletePromises = selectedDocuments.map(docId => 
        supabase
          .from('documents')
          .delete()
          .eq('id', docId)
      );

      await Promise.all(deletePromises);
      toast.success(`${selectedDocuments.length} documents deleted successfully`);
      setSelectedDocuments([]);
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
    } catch (error) {
      console.error('Error bulk deleting documents:', error);
      toast.error('Failed to delete documents');
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const documentToDelete = documents.find(doc => doc.id === documentId);
    if (!documentToDelete) {
      toast.error('Document not found');
      return;
    }

    const confirmMessage = `Are you sure you want to delete "${documentToDelete.name}"? This action cannot be undone.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        throw error;
      }

      toast.success('Document deleted successfully');
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: FaClock,
      },
      pending_review: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: FaClock,
      },
      approved: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: FaCheck,
      },
      rejected: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: FaTimes,
      },
      expired: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        icon: FaExclamationTriangle,
      },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    const displayStatus = status === 'pending_review' ? 'pending' : status;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeIcons = {
      driving_license: '🪪',
      insurance: '🛡️',
      pco_license: '🚗',
      proof_of_address: '🏠',
      business_license: '🏢',
      tax_certificate: '📋',
      vehicle_registration: '📄',
      mot_certificate: '🔧',
      businessLicense: '🏢',
      insuranceCertificate: '🛡️',
      operatorLicense: '🚗',
      taxCertificate: '📋'
    };
    return typeIcons[type as keyof typeof typeIcons] || '📄';
  };

  const handleSelectDocument = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDocuments(
      selectedDocuments.length === filteredDocuments.length
        ? []
        : filteredDocuments.map(d => d.id)
    );
  };

  // Approval Modal Component
  const ApprovalModal = () => {
    if (!approvalModalOpen || !documentToApprove) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Approve Document</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <span className="font-semibold">Document:</span> {documentToApprove.name}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                <span className="font-semibold">Type:</span> {documentToApprove.type}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                <span className="font-semibold">Uploader:</span> {documentToApprove.uploader_name} ({documentToApprove.uploader_type})
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Default expiry: {getDefaultExpiryPeriod(documentToApprove.type)} months from today
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Document Expiry Guidelines:</h4>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li>• Business License: 1 year</li>
                <li>• Insurance Certificate: 1 year</li>
                <li>• Operator License: 5 years</li>
                <li>• Driving License: 10 years</li>
                <li>• PCO License: 3 years</li>
                <li>• Proof of Address: 6 months</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setApprovalModalOpen(false);
                setDocumentToApprove(null);
                setExpiryDate('');
              }}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmApproval}
              disabled={!expiryDate}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve & Set Expiry
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Bulk Approval Modal Component
  const BulkApprovalModal = () => {
    if (!bulkApprovalModalOpen) return null;

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bulk Approve Documents</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <span className="font-semibold">Selected Documents:</span> {selectedDocuments.length}
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg max-h-32 overflow-y-auto">
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {selectedDocs.map(doc => (
                    <li key={doc.id} className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(doc.type)}</span>
                      <span className="truncate">{doc.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date for All Documents <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={bulkExpiryDate}
                onChange={(e) => setBulkExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This expiry date will be applied to all selected documents
              </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                <strong>Note:</strong> All selected documents will receive the same expiry date. 
                For documents with different expiry requirements, please approve them individually.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setBulkApprovalModalOpen(false);
                setBulkExpiryDate('');
              }}
              className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBulkApproval}
              disabled={!bulkExpiryDate}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Approve All & Set Expiry
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Detail Modal Component
  const DetailModal = () => {
    if (!showDetailModal || !detailData) return null;

    const keys = Object.keys(detailData);
    const filteredKeys = keys.filter(key => 
      key.toLowerCase().includes(detailSearchTerm.toLowerCase()) || 
      detailData[key]?.toString().toLowerCase().includes(detailSearchTerm.toLowerCase())
    );

    const startIndex = (detailCurrentPage - 1) * detailItemsPerPage;
    const endIndex = startIndex + detailItemsPerPage;
    const currentItems = filteredKeys.slice(startIndex, endIndex);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{detailTitle}</h3>
          
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search details..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={detailSearchTerm}
                onChange={(e) => setDetailSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setDetailCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={detailCurrentPage === 1}
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300">Page {detailCurrentPage}</span>
            <button
              onClick={() => setDetailCurrentPage(prev => Math.min(Math.ceil(filteredKeys.length / detailItemsPerPage), prev + 1))}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              disabled={endIndex >= filteredKeys.length}
            >
              Next
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-left text-gray-700 dark:text-gray-300">Key</th>
                  <th className="p-4 text-left text-gray-700 dark:text-gray-300">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentItems.map(key => (
                  <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="p-4 text-gray-700 dark:text-gray-300 font-semibold">{key.charAt(0).toUpperCase() + key.slice(1)}:</td>
                    <td className="p-4 text-gray-900 dark:text-white">{detailData[key]?.toString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
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
              Document Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Review, approve, and manage all user-submitted documents.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <StatsCard 
            title="Total Documents" 
            value={metrics.totalDocuments} 
            icon={FaFolderOpen} 
            color="text-blue-400" 
            onClick={() => {
              setDetailTitle('Total Documents Overview');
              setDetailData({
                'Total Documents': metrics.totalDocuments,
                'Total Partners': metrics.totalPartners,
                'Total Drivers': metrics.totalDrivers,
                'Average File Size': `${Math.round(metrics.averageFileSize / 1024)} KB`,
                'Total File Size': `${Math.round(metrics.totalFileSize / (1024 * 1024))} MB`,
                'Verification Rate': `${metrics.verificationRate}%`,
                'Compliance Rate': `${metrics.complianceRate}%`,
                'Average Processing Time': `${metrics.averageProcessingTime} days`,
                'Last Upload Date': metrics.lastUploadDate ? new Date(metrics.lastUploadDate).toLocaleDateString() : 'N/A',
                'Last Approval Date': metrics.lastApprovalDate ? new Date(metrics.lastApprovalDate).toLocaleDateString() : 'N/A'
              });
              setDetailTableData(documents.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                status: doc.status,
                uploader_name: doc.uploader_name,
                uploader_type: doc.uploader_type,
                upload_date: doc.upload_date,
                file_size: `${Math.round((doc.file_size || 0) / 1024)} KB`,
                verification_score: doc.verification_score,
                risk_level: doc.risk_level,
                priority: doc.priority,
                compliance_status: doc.compliance_status,
                regulatory_framework: doc.regulatory_framework
              })));
              setDetailSearchTerm('');
              setDetailCurrentPage(1);
              setShowDetailModal(true);
            }}
          />
          <StatsCard 
            title="Pending Review" 
            value={metrics.pendingDocuments} 
            icon={FaClock} 
            color="text-yellow-500" 
            onClick={() => {
              const pendingDocs = documents.filter(d => d.status === 'pending' || d.status === 'pending_review');
              setDetailTitle('Pending Documents Review');
              setDetailData({
                'Pending Documents': metrics.pendingDocuments,
                'Pending Partners': new Set(pendingDocs.filter(d => d.uploader_type === 'partner').map(d => d.uploader_id)).size,
                'Pending Drivers': new Set(pendingDocs.filter(d => d.uploader_type === 'driver').map(d => d.uploader_id)).size,
                'Average Days Pending': Math.round(pendingDocs.reduce((sum, doc) => {
                  const uploadDate = new Date(doc.upload_date);
                  const now = new Date();
                  return sum + Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
                }, 0) / pendingDocs.length),
                'Critical Priority': pendingDocs.filter(d => d.priority === 'critical').length,
                'High Priority': pendingDocs.filter(d => d.priority === 'high').length,
                'Medium Priority': pendingDocs.filter(d => d.priority === 'medium').length,
                'Low Priority': pendingDocs.filter(d => d.priority === 'low').length
              });
              setDetailTableData(pendingDocs.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                uploader_name: doc.uploader_name,
                uploader_type: doc.uploader_type,
                upload_date: doc.upload_date,
                priority: doc.priority,
                risk_level: doc.risk_level,
                verification_score: doc.verification_score,
                regulatory_framework: doc.regulatory_framework,
                days_pending: Math.floor((Date.now() - new Date(doc.upload_date).getTime()) / (1000 * 60 * 60 * 24))
              })));
              setDetailSearchTerm('');
              setDetailCurrentPage(1);
              setShowDetailModal(true);
            }}
          />
          <StatsCard 
            title="Approved" 
            value={metrics.approvedDocuments} 
            icon={FaThumbsUp} 
            color="text-green-500" 
            onClick={() => {
              const approvedDocs = documents.filter(d => d.status === 'approved');
              setDetailTitle('Approved Documents');
              setDetailData({
                'Approved Documents': metrics.approvedDocuments,
                'Approved Partners': new Set(approvedDocs.filter(d => d.uploader_type === 'partner').map(d => d.uploader_id)).size,
                'Approved Drivers': new Set(approvedDocs.filter(d => d.uploader_type === 'driver').map(d => d.uploader_id)).size,
                'Average Verification Score': Math.round(approvedDocs.reduce((sum, doc) => sum + (doc.verification_score || 0), 0) / approvedDocs.length),
                'Compliant Documents': approvedDocs.filter(d => d.compliance_status === 'compliant').length,
                'Average Processing Time': Math.round(approvedDocs.reduce((sum, doc) => {
                  const uploadTime = new Date(doc.upload_date).getTime();
                  const approvalTime = new Date(doc.approved_at || '').getTime();
                  return sum + (approvalTime - uploadTime);
                }, 0) / approvedDocs.length / (1000 * 60 * 60 * 24)),
                'Documents Expiring Soon': approvedDocs.filter(d => {
                  if (!d.expiry_date) return false;
                  const expiryDate = new Date(d.expiry_date);
                  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
                }).length
              });
              setDetailTableData(approvedDocs.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                uploader_name: doc.uploader_name,
                uploader_type: doc.uploader_type,
                approved_at: doc.approved_at,
                approved_by: doc.approved_by,
                expiry_date: doc.expiry_date,
                verification_score: doc.verification_score,
                compliance_status: doc.compliance_status,
                regulatory_framework: doc.regulatory_framework,
                days_until_expiry: doc.expiry_date ? Math.floor((new Date(doc.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
              })));
              setDetailSearchTerm('');
              setDetailCurrentPage(1);
              setShowDetailModal(true);
            }}
          />
          <StatsCard 
            title="Rejected" 
            value={metrics.rejectedDocuments} 
            icon={FaThumbsDown} 
            color="text-red-500" 
            onClick={() => {
              const rejectedDocs = documents.filter(d => d.status === 'rejected');
              setDetailTitle('Rejected Documents');
              setDetailData({
                'Rejected Documents': metrics.rejectedDocuments,
                'Rejected Partners': new Set(rejectedDocs.filter(d => d.uploader_type === 'partner').map(d => d.uploader_id)).size,
                'Rejected Drivers': new Set(rejectedDocs.filter(d => d.uploader_type === 'driver').map(d => d.uploader_id)).size,
                'Critical Risk Rejected': rejectedDocs.filter(d => d.risk_level === 'critical').length,
                'High Risk Rejected': rejectedDocs.filter(d => d.risk_level === 'high').length,
                'Medium Risk Rejected': rejectedDocs.filter(d => d.risk_level === 'medium').length,
                'Low Risk Rejected': rejectedDocs.filter(d => d.risk_level === 'low').length,
                'Average Processing Time': Math.round(rejectedDocs.reduce((sum, doc) => {
                  const uploadTime = new Date(doc.upload_date).getTime();
                  const rejectionTime = new Date(doc.rejected_at || '').getTime();
                  return sum + (rejectionTime - uploadTime);
                }, 0) / rejectedDocs.length / (1000 * 60 * 60 * 24))
              });
              setDetailTableData(rejectedDocs.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                uploader_name: doc.uploader_name,
                uploader_type: doc.uploader_type,
                rejected_at: doc.rejected_at,
                rejected_by: doc.rejected_by,
                rejection_reason: doc.rejection_reason,
                risk_level: doc.risk_level,
                priority: doc.priority,
                regulatory_framework: doc.regulatory_framework,
                compliance_status: doc.compliance_status
              })));
              setDetailSearchTerm('');
              setDetailCurrentPage(1);
              setShowDetailModal(true);
            }}
          />
          <StatsCard 
            title="Expired" 
            value={metrics.expiredDocuments} 
            icon={FaExclamationTriangle} 
            color="text-gray-500" 
            onClick={() => {
              const expiredDocs = documents.filter(d => d.status === 'expired');
              setDetailTitle('Expired Documents');
              setDetailData({
                'Expired Documents': metrics.expiredDocuments,
                'Expired Partners': new Set(expiredDocs.filter(d => d.uploader_type === 'partner').map(d => d.uploader_id)).size,
                'Expired Drivers': new Set(expiredDocs.filter(d => d.uploader_type === 'driver').map(d => d.uploader_id)).size,
                'Critical Expired': expiredDocs.filter(d => d.risk_level === 'critical').length,
                'High Risk Expired': expiredDocs.filter(d => d.risk_level === 'high').length,
                'Medium Risk Expired': expiredDocs.filter(d => d.risk_level === 'medium').length,
                'Low Risk Expired': expiredDocs.filter(d => d.risk_level === 'low').length,
                'Average Days Expired': Math.round(expiredDocs.reduce((sum, doc) => {
                  if (!doc.expiry_date) return sum;
                  const expiryDate = new Date(doc.expiry_date);
                  const now = new Date();
                  return sum + Math.floor((now.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24));
                }, 0) / expiredDocs.length)
              });
              setDetailTableData(expiredDocs.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                uploader_name: doc.uploader_name,
                uploader_type: doc.uploader_type,
                expiry_date: doc.expiry_date,
                risk_level: doc.risk_level,
                priority: doc.priority,
                regulatory_framework: doc.regulatory_framework,
                compliance_status: doc.compliance_status,
                days_expired: doc.expiry_date ? Math.floor((Date.now() - new Date(doc.expiry_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
              })));
              setDetailSearchTerm('');
              setDetailCurrentPage(1);
              setShowDetailModal(true);
            }}
          />
          <Link href="/admin/documents/expiring" className="transition-transform duration-200 hover:scale-105">
            <StatsCard title="Expiring Soon" value={metrics.expiringSoon} icon={FaExclamationCircle} color="text-orange-500" />
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="driving_license">Driving License</option>
              <option value="insurance">Insurance</option>
              <option value="pco_license">PCO License</option>
              <option value="proof_of_address">Proof of Address</option>
              <option value="business_license">Business License</option>
              <option value="tax_certificate">Tax Certificate</option>
              <option value="vehicle_registration">Vehicle Registration</option>
              <option value="mot_certificate">MOT Certificate</option>
            </select>
          </div>

          {selectedDocuments.length > 0 && (
            <div className="flex gap-2 mt-4 lg:mt-0">
              <button 
                onClick={handleBulkApprove}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Approve Selected ({selectedDocuments.length})
              </button>
              <button 
                onClick={handleBulkReject}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reject Selected ({selectedDocuments.length})
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete Selected ({selectedDocuments.length})
              </button>
            </div>
          )}
        </div>

        {/* Documents Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-left">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll} 
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Document Name</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Uploader</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Dates</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="text-center">
                        <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No documents found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {documents.length === 0 
                            ? "No documents have been uploaded yet."
                            : "Try adjusting your search or filter criteria"
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedDocuments.includes(doc.id)} 
                          onChange={() => handleSelectDocument(doc.id)} 
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(doc.type)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{doc.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900 dark:text-white">{doc.uploader_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">({doc.uploader_type})</div>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>Uploaded: {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Unknown'}</div>
                        {doc.expiry_date && (
                          <div className="text-orange-400">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(doc.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {doc.file_url && (
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                              title="View Document"
                            >
                              <FaEye className="text-xs" />
                            </a>
                          )}
                          {(doc.status === 'pending' || doc.status === 'pending_review') && (
                            <>
                              <button 
                                onClick={() => handleApproveDocument(doc.id)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                                title="Approve Document"
                              >
                                <FaCheck className="text-xs" />
                              </button>
                              <button 
                                onClick={() => handleRejectDocument(doc.id)}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                                title="Reject Document"
                              >
                                <FaTimes className="text-xs" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                            title="Delete Document"
                          >
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {ApprovalModal()}
      {BulkApprovalModal()}
      {DetailModal()}
    </div>
  );
} 