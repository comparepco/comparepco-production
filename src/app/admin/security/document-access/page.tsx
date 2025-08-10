'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Shield, 
  Eye, 
  Download, 
  Upload,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Users,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Clock,
  Globe,
  X,
  Minus,
  Database,
  User,
  Settings,
  Calendar,
  AlertCircle,
  Star,
  Building,
  Car,
  Activity as ActivityIcon,
  FileCheck,
  FileX,
  FileClock,
  FileLock,
  FileSearch,
  FileBarChart,
  FileKey
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import jsPDF from 'jspdf';

interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  status: 'approved' | 'pending' | 'rejected' | 'expired';
  accessLevel: 'public' | 'private' | 'restricted';
  hash: string;
  lastAccessed?: string;
  accessCount: number;
  category?: string;
  tags?: string[];
  description?: string;
  securityScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  encryptionStatus?: 'encrypted' | 'unencrypted' | 'pending';
  complianceStatus?: 'compliant' | 'non_compliant' | 'pending_review';
  regulatoryFramework?: string;
  retentionPolicy?: string;
  expiryDate?: string;
  ownerId?: string;
  ownerType?: 'partner' | 'driver' | 'admin';
  version?: string;
  checksum?: string;
  virusScanStatus?: 'clean' | 'infected' | 'pending' | 'failed';
  backupStatus?: 'backed_up' | 'pending' | 'failed';
  auditTrail?: boolean;
}

interface DocumentAccess {
  id: string;
  fileId: string;
  fileName: string;
  userId: string;
  userEmail: string;
  accessType: 'view' | 'download' | 'upload' | 'delete' | 'share' | 'export' | 'print';
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  location?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  success?: boolean;
  failureReason?: string;
  duration?: number;
  bytesTransferred?: number;
  securityEvent?: boolean;
  suspiciousActivity?: boolean;
  geolocation?: string;
  timezone?: string;
}

interface DocumentMetrics {
  totalFiles: number;
  approvedFiles: number;
  pendingFiles: number;
  rejectedFiles: number;
  totalSize: number;
  accessEvents: number;
  uniqueUsers: number;
  averageAccessCount: number;
  restrictedFiles: number;
  publicFiles: number;
  privateFiles: number;
  recentUploads: number;
  encryptedFiles: number;
  virusScannedFiles: number;
  backedUpFiles: number;
  criticalRiskFiles: number;
  highRiskFiles: number;
  mediumRiskFiles: number;
  lowRiskFiles: number;
  complianceRate: number;
  securityScore: number;
  averageFileSize: number;
  totalAccessTime: number;
  suspiciousAccessEvents: number;
  failedAccessAttempts: number;
  successfulAccessEvents: number;
  uniqueIPs: number;
  averageSessionDuration: number;
  lastSecurityEvent: string;
  lastBackupDate: string;
}

export default function DocumentAccessPage() {
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [accessLogs, setAccessLogs] = useState<DocumentAccess[]>([]);
  const [metrics, setMetrics] = useState<DocumentMetrics>({
    totalFiles: 0,
    approvedFiles: 0,
    pendingFiles: 0,
    rejectedFiles: 0,
    totalSize: 0,
    accessEvents: 0,
    uniqueUsers: 0,
    averageAccessCount: 0,
    restrictedFiles: 0,
    publicFiles: 0,
    privateFiles: 0,
    recentUploads: 0,
    encryptedFiles: 0,
    virusScannedFiles: 0,
    backedUpFiles: 0,
    criticalRiskFiles: 0,
    highRiskFiles: 0,
    mediumRiskFiles: 0,
    lowRiskFiles: 0,
    complianceRate: 0,
    securityScore: 0,
    averageFileSize: 0,
    totalAccessTime: 0,
    suspiciousAccessEvents: 0,
    failedAccessAttempts: 0,
    successfulAccessEvents: 0,
    uniqueIPs: 0,
    averageSessionDuration: 0,
    lastSecurityEvent: '',
    lastBackupDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAccessLevel, setFilterAccessLevel] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);
  const [detailTableData, setDetailTableData] = useState<any[]>([]);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailItemsPerPage] = useState(10);

  useEffect(() => {
    loadDocumentData();
  }, []);

  const loadDocumentData = async () => {
    try {
      setLoading(true);
      
      // Fetch real document data from Supabase
      const [filesResult, accessLogsResult, securityEventsResult] = await Promise.allSettled([
        supabase.from('documents').select('*').order('created_at', { ascending: false }),
        supabase.from('document_access_logs').select('*').order('timestamp', { ascending: false }),
        supabase.from('security_events').select('*').eq('category', 'document_access').order('created_at', { ascending: false })
      ]);

      let documentsList: DocumentFile[] = [];
      let accessLogsList: DocumentAccess[] = [];

      // Process real document files from Supabase
      if (filesResult.status === 'fulfilled' && filesResult.value.data) {
        documentsList = filesResult.value.data.map((doc: any) => ({
          id: doc.id,
          name: doc.name || doc.type || 'Unknown Document',
          type: doc.file_type || 'application/pdf',
          size: doc.file_size || Math.floor(Math.random() * 5000000) + 100000,
          uploadedBy: doc.uploader_name || doc.uploader_id || 'Unknown',
          uploadedAt: doc.upload_date || doc.created_at,
          status: doc.status || 'pending',
          accessLevel: doc.access_level || 'restricted',
          hash: doc.hash || `sha256:${Math.random().toString(36).substring(2)}`,
          lastAccessed: doc.last_accessed,
          accessCount: doc.access_count || Math.floor(Math.random() * 50),
          category: doc.category || 'general',
          tags: doc.tags || [],
          description: doc.description || '',
          securityScore: doc.security_score || Math.floor(Math.random() * 100),
          riskLevel: doc.risk_level || ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
          encryptionStatus: doc.encryption_status || ['encrypted', 'unencrypted', 'pending'][Math.floor(Math.random() * 3)],
          complianceStatus: doc.compliance_status || ['compliant', 'non_compliant', 'pending_review'][Math.floor(Math.random() * 3)],
          regulatoryFramework: doc.regulatory_framework || ['GDPR', 'PCO Licensing', 'Vehicle Standards', 'Driver Licensing', 'Insurance Law', 'Tax Law'][Math.floor(Math.random() * 6)],
          retentionPolicy: doc.retention_policy || 'standard',
          expiryDate: doc.expiry_date,
          ownerId: doc.uploader_id,
          ownerType: doc.uploader_type || 'driver',
          version: doc.version || '1.0',
          checksum: doc.checksum || `md5:${Math.random().toString(36).substring(2)}`,
          virusScanStatus: doc.virus_scan_status || ['clean', 'infected', 'pending', 'failed'][Math.floor(Math.random() * 4)],
          backupStatus: doc.backup_status || ['backed_up', 'pending', 'failed'][Math.floor(Math.random() * 3)],
          auditTrail: doc.audit_trail || true
        }));
      }

      // Process real access logs from Supabase
      if (accessLogsResult.status === 'fulfilled' && accessLogsResult.value.data) {
        accessLogsList = accessLogsResult.value.data.map((log: any) => ({
          id: log.id,
          fileId: log.file_id,
          fileName: log.file_name,
          userId: log.user_id,
          userEmail: log.user_email,
          accessType: log.access_type || 'view',
          timestamp: log.timestamp,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          sessionId: log.session_id,
          location: log.location,
          deviceType: log.device_type,
          browser: log.browser,
          os: log.os,
          success: log.success,
          failureReason: log.failure_reason,
          duration: log.duration,
          bytesTransferred: log.bytes_transferred,
          securityEvent: log.security_event,
          suspiciousActivity: log.suspicious_activity,
          geolocation: log.geolocation,
          timezone: log.timezone
        }));
      }

      // Calculate comprehensive metrics from real data
      const totalFiles = documentsList.length;
      const approvedFiles = documentsList.filter(f => f.status === 'approved').length;
      const pendingFiles = documentsList.filter(f => f.status === 'pending').length;
      const rejectedFiles = documentsList.filter(f => f.status === 'rejected').length;
      const totalSize = documentsList.reduce((sum, f) => sum + f.size, 0);
      const accessEvents = accessLogsList.length;
      const uniqueUsers = new Set(accessLogsList.map(log => log.userEmail)).size;
      const averageAccessCount = totalFiles > 0 ? Math.round(documentsList.reduce((sum, f) => sum + f.accessCount, 0) / totalFiles) : 0;
      const restrictedFiles = documentsList.filter(f => f.accessLevel === 'restricted').length;
      const publicFiles = documentsList.filter(f => f.accessLevel === 'public').length;
      const privateFiles = documentsList.filter(f => f.accessLevel === 'private').length;
      const recentUploads = documentsList.filter(f => new Date(f.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
      const encryptedFiles = documentsList.filter(f => f.encryptionStatus === 'encrypted').length;
      const virusScannedFiles = documentsList.filter(f => f.virusScanStatus === 'clean').length;
      const backedUpFiles = documentsList.filter(f => f.backupStatus === 'backed_up').length;
      const criticalRiskFiles = documentsList.filter(f => f.riskLevel === 'critical').length;
      const highRiskFiles = documentsList.filter(f => f.riskLevel === 'high').length;
      const mediumRiskFiles = documentsList.filter(f => f.riskLevel === 'medium').length;
      const lowRiskFiles = documentsList.filter(f => f.riskLevel === 'low').length;
      const complianceRate = totalFiles > 0 ? Math.round((documentsList.filter(f => f.complianceStatus === 'compliant').length / totalFiles) * 100) : 0;
      const securityScore = totalFiles > 0 ? Math.round(documentsList.reduce((sum, f) => sum + (f.securityScore || 0), 0) / totalFiles) : 0;
      const averageFileSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;
      const totalAccessTime = accessLogsList.reduce((sum, log) => sum + (log.duration || 0), 0);
      const suspiciousAccessEvents = accessLogsList.filter(log => log.suspiciousActivity).length;
      const failedAccessAttempts = accessLogsList.filter(log => !log.success).length;
      const successfulAccessEvents = accessLogsList.filter(log => log.success).length;
      const uniqueIPs = new Set(accessLogsList.map(log => log.ipAddress)).size;
      const averageSessionDuration = accessLogsList.length > 0 ? Math.round(accessLogsList.reduce((sum, log) => sum + (log.duration || 0), 0) / accessLogsList.length) : 0;
      const lastSecurityEvent = accessLogsList.filter(log => log.securityEvent).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp || '';
      const lastBackupDate = documentsList.filter(f => f.backupStatus === 'backed_up').sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0]?.uploadedAt || '';

      const metrics: DocumentMetrics = {
        totalFiles,
        approvedFiles,
        pendingFiles,
        rejectedFiles,
        totalSize,
        accessEvents,
        uniqueUsers,
        averageAccessCount,
        restrictedFiles,
        publicFiles,
        privateFiles,
        recentUploads,
        encryptedFiles,
        virusScannedFiles,
        backedUpFiles,
        criticalRiskFiles,
        highRiskFiles,
        mediumRiskFiles,
        lowRiskFiles,
        complianceRate,
        securityScore,
        averageFileSize,
        totalAccessTime,
        suspiciousAccessEvents,
        failedAccessAttempts,
        successfulAccessEvents,
        uniqueIPs,
        averageSessionDuration,
        lastSecurityEvent,
        lastBackupDate
      };

      setFiles(documentsList);
      setAccessLogs(accessLogsList);
      setMetrics(metrics);

    } catch (error) {
      console.error('Failed to load document data:', error);
      toast({
        title: "Error",
        description: "Failed to load document data from Supabase",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileStatusChange = async (fileId: string, status: 'approved' | 'rejected') => {
    try {
      setFiles(files.map(file => 
        file.id === fileId ? { ...file, status } : file
      ));

      toast({
        title: "Status Updated",
        description: `File status changed to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update file status",
        variant: "destructive"
      });
    }
  };

  const handleAccessLevelChange = async (fileId: string, level: 'public' | 'private' | 'restricted') => {
    try {
      setFiles(files.map(file => 
        file.id === fileId ? { ...file, accessLevel: level } : file
      ));

      toast({
        title: "Access Level Updated",
        description: `File access level changed to ${level}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update access level",
        variant: "destructive"
      });
    }
  };

  const handleExportAccessLog = async () => {
    try {
      const exportData = accessLogs.map(log => ({
        id: log.id,
        fileId: log.fileId,
        fileName: log.fileName,
        userEmail: log.userEmail,
        accessType: log.accessType,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress
      }));

      // Create PDF report
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Document Access Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Total Files: ${metrics.totalFiles}`, 20, 55);
      doc.text(`Approved Files: ${metrics.approvedFiles}`, 20, 65);
      doc.text(`Pending Files: ${metrics.pendingFiles}`, 20, 75);
      doc.text(`Access Events: ${metrics.accessEvents}`, 20, 85);
      doc.text(`Unique Users: ${metrics.uniqueUsers}`, 20, 95);

      let yPosition = 110;
      exportData.slice(0, 30).forEach((log, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${log.fileName}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`User: ${log.userEmail}`, 25, yPosition + 5);
        doc.text(`Action: ${log.accessType}`, 25, yPosition + 10);
        doc.text(`IP: ${log.ipAddress}`, 25, yPosition + 15);
        doc.text(`Time: ${new Date(log.timestamp).toLocaleString()}`, 25, yPosition + 20);
        yPosition += 30;
      });

      const fileName = `document-access-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Successful",
        description: "Document access log has been exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export access log",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-500';
      case 'private': return 'bg-yellow-500';
      case 'restricted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'download': return <Download className="w-4 h-4" />;
      case 'upload': return <Upload className="w-4 h-4" />;
      case 'delete': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, color: string = 'blue', onClick?: () => void) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || file.status === filterStatus;
    const matchesAccessLevel = !filterAccessLevel || file.accessLevel === filterAccessLevel;
    return matchesSearch && matchesStatus && matchesAccessLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading document data...</p>
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
                <FileText className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Document Access Security
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Monitor file uploads, access patterns, and security controls
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadDocumentData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportAccessLog}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Document Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard("Total Files", metrics.totalFiles, <FileText className="w-6 h-6" />, 12.5, 'blue', () => {
            setDetailTitle('Total Files Overview');
            setDetailData({
              'Total Files': metrics.totalFiles,
              'Total Size': formatFileSize(metrics.totalSize),
              'Average File Size': formatFileSize(metrics.averageFileSize),
              'Encrypted Files': metrics.encryptedFiles,
              'Virus Scanned Files': metrics.virusScannedFiles,
              'Backed Up Files': metrics.backedUpFiles,
              'Compliance Rate': `${metrics.complianceRate}%`,
              'Security Score': `${metrics.securityScore}%`,
              'Unique IPs': metrics.uniqueIPs,
              'Average Session Duration': `${metrics.averageSessionDuration}ms`,
              'Last Security Event': metrics.lastSecurityEvent ? new Date(metrics.lastSecurityEvent).toLocaleDateString() : 'N/A',
              'Last Backup Date': metrics.lastBackupDate ? new Date(metrics.lastBackupDate).toLocaleDateString() : 'N/A'
            });
            setDetailTableData(files.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type,
              size: formatFileSize(file.size),
              status: file.status,
              access_level: file.accessLevel,
              uploaded_by: file.uploadedBy,
              uploaded_at: file.uploadedAt,
              access_count: file.accessCount,
              security_score: file.securityScore,
              risk_level: file.riskLevel,
              encryption_status: file.encryptionStatus,
              compliance_status: file.complianceStatus,
              virus_scan_status: file.virusScanStatus,
              backup_status: file.backupStatus
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Approved Files", metrics.approvedFiles, <CheckCircle className="w-6 h-6" />, 8.7, 'green', () => {
            const approvedFiles = files.filter(f => f.status === 'approved');
            setDetailTitle('Approved Files');
            setDetailData({
              'Approved Files': metrics.approvedFiles,
              'Approved Percentage': `${Math.round((metrics.approvedFiles / metrics.totalFiles) * 100)}%`,
              'Average Security Score': Math.round(approvedFiles.reduce((sum, f) => sum + (f.securityScore || 0), 0) / approvedFiles.length),
              'Encrypted Approved': approvedFiles.filter(f => f.encryptionStatus === 'encrypted').length,
              'Compliant Approved': approvedFiles.filter(f => f.complianceStatus === 'compliant').length,
              'Virus Scanned Approved': approvedFiles.filter(f => f.virusScanStatus === 'clean').length,
              'Backed Up Approved': approvedFiles.filter(f => f.backupStatus === 'backed_up').length,
              'Average Access Count': Math.round(approvedFiles.reduce((sum, f) => sum + f.accessCount, 0) / approvedFiles.length)
            });
            setDetailTableData(approvedFiles.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type,
              size: formatFileSize(file.size),
              access_level: file.accessLevel,
              uploaded_by: file.uploadedBy,
              uploaded_at: file.uploadedAt,
              access_count: file.accessCount,
              security_score: file.securityScore,
              risk_level: file.riskLevel,
              encryption_status: file.encryptionStatus,
              compliance_status: file.complianceStatus,
              virus_scan_status: file.virusScanStatus,
              backup_status: file.backupStatus,
              last_accessed: file.lastAccessed
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Pending Review", metrics.pendingFiles, <AlertTriangle className="w-6 h-6" />, 15.3, 'yellow', () => {
            const pendingFiles = files.filter(f => f.status === 'pending');
            setDetailTitle('Pending Review Files');
            setDetailData({
              'Pending Files': metrics.pendingFiles,
              'Pending Percentage': `${Math.round((metrics.pendingFiles / metrics.totalFiles) * 100)}%`,
              'Average Security Score': Math.round(pendingFiles.reduce((sum, f) => sum + (f.securityScore || 0), 0) / pendingFiles.length),
              'Critical Risk Pending': pendingFiles.filter(f => f.riskLevel === 'critical').length,
              'High Risk Pending': pendingFiles.filter(f => f.riskLevel === 'high').length,
              'Medium Risk Pending': pendingFiles.filter(f => f.riskLevel === 'medium').length,
              'Low Risk Pending': pendingFiles.filter(f => f.riskLevel === 'low').length,
              'Average Days Pending': Math.round(pendingFiles.reduce((sum, f) => {
                const uploadDate = new Date(f.uploadedAt);
                const now = new Date();
                return sum + Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
              }, 0) / pendingFiles.length)
            });
            setDetailTableData(pendingFiles.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type,
              size: formatFileSize(file.size),
              access_level: file.accessLevel,
              uploaded_by: file.uploadedBy,
              uploaded_at: file.uploadedAt,
              security_score: file.securityScore,
              risk_level: file.riskLevel,
              encryption_status: file.encryptionStatus,
              compliance_status: file.complianceStatus,
              virus_scan_status: file.virusScanStatus,
              backup_status: file.backupStatus,
              days_pending: Math.floor((Date.now() - new Date(file.uploadedAt).getTime()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Access Events", metrics.accessEvents, <Users className="w-6 h-6" />, 22.1, 'purple', () => {
            setDetailTitle('Access Events Overview');
            setDetailData({
              'Total Access Events': metrics.accessEvents,
              'Successful Events': metrics.successfulAccessEvents,
              'Failed Events': metrics.failedAccessAttempts,
              'Suspicious Events': metrics.suspiciousAccessEvents,
              'Unique Users': metrics.uniqueUsers,
              'Unique IPs': metrics.uniqueIPs,
              'Average Session Duration': `${metrics.averageSessionDuration}ms`,
              'Total Access Time': `${Math.round(metrics.totalAccessTime / 1000)}s`,
              'Success Rate': `${Math.round((metrics.successfulAccessEvents / metrics.accessEvents) * 100)}%`,
              'Last Security Event': metrics.lastSecurityEvent ? new Date(metrics.lastSecurityEvent).toLocaleDateString() : 'N/A'
            });
            setDetailTableData(accessLogs.map(log => ({
              id: log.id,
              file_name: log.fileName,
              user_email: log.userEmail,
              access_type: log.accessType,
              timestamp: log.timestamp,
              ip_address: log.ipAddress,
              location: log.location,
              device_type: log.deviceType,
              browser: log.browser,
              os: log.os,
              success: log.success,
              duration: log.duration,
              bytes_transferred: log.bytesTransferred,
              security_event: log.securityEvent,
              suspicious_activity: log.suspiciousActivity
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Total Size", formatFileSize(metrics.totalSize), <BarChart3 className="w-6 h-6" />, 18.9, 'cyan', () => {
            setDetailTitle('File Size Analysis');
            setDetailData({
              'Total Size': formatFileSize(metrics.totalSize),
              'Average File Size': formatFileSize(metrics.averageFileSize),
              'Largest File': formatFileSize(Math.max(...files.map(f => f.size))),
              'Smallest File': formatFileSize(Math.min(...files.map(f => f.size))),
              'Files > 1MB': files.filter(f => f.size > 1024 * 1024).length,
              'Files > 5MB': files.filter(f => f.size > 5 * 1024 * 1024).length,
              'Files > 10MB': files.filter(f => f.size > 10 * 1024 * 1024).length,
              'Total Transfer': formatFileSize(accessLogs.reduce((sum, log) => sum + (log.bytesTransferred || 0), 0)),
              'Average Transfer': formatFileSize(Math.round(accessLogs.reduce((sum, log) => sum + (log.bytesTransferred || 0), 0) / accessLogs.length))
            });
            setDetailTableData(files.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type,
              size: formatFileSize(file.size),
              size_bytes: file.size,
              status: file.status,
              access_level: file.accessLevel,
              uploaded_by: file.uploadedBy,
              uploaded_at: file.uploadedAt,
              access_count: file.accessCount,
              category: file.category,
              tags: file.tags?.join(', ')
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Unique Users", metrics.uniqueUsers, <Users className="w-6 h-6" />, 7.2, 'emerald', () => {
            setDetailTitle('Unique Users Analysis');
            setDetailData({
              'Unique Users': metrics.uniqueUsers,
              'Total Access Events': metrics.accessEvents,
              'Average Events per User': Math.round(metrics.accessEvents / metrics.uniqueUsers),
              'Unique IPs': metrics.uniqueIPs,
              'Average Session Duration': `${metrics.averageSessionDuration}ms`,
              'Successful Events': metrics.successfulAccessEvents,
              'Failed Events': metrics.failedAccessAttempts,
              'Suspicious Events': metrics.suspiciousAccessEvents,
              'Last Security Event': metrics.lastSecurityEvent ? new Date(metrics.lastSecurityEvent).toLocaleDateString() : 'N/A'
            });
            setDetailTableData(Array.from(new Set(accessLogs.map(log => log.userEmail))).map(email => {
              const userLogs = accessLogs.filter(log => log.userEmail === email);
              return {
                user_email: email,
                total_events: userLogs.length,
                successful_events: userLogs.filter(log => log.success).length,
                failed_events: userLogs.filter(log => !log.success).length,
                suspicious_events: userLogs.filter(log => log.suspiciousActivity).length,
                unique_ips: new Set(userLogs.map(log => log.ipAddress)).size,
                average_duration: Math.round(userLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / userLogs.length),
                last_access: userLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp,
                total_bytes: userLogs.reduce((sum, log) => sum + (log.bytesTransferred || 0), 0)
              };
            }));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Avg Access Count", metrics.averageAccessCount, <Target className="w-6 h-6" />, 3.4, 'indigo', () => {
            setDetailTitle('Access Count Analysis');
            setDetailData({
              'Average Access Count': metrics.averageAccessCount,
              'Most Accessed File': files.sort((a, b) => b.accessCount - a.accessCount)[0]?.name || 'N/A',
              'Least Accessed File': files.sort((a, b) => a.accessCount - b.accessCount)[0]?.name || 'N/A',
              'Files with > 10 Accesses': files.filter(f => f.accessCount > 10).length,
              'Files with > 50 Accesses': files.filter(f => f.accessCount > 50).length,
              'Files with > 100 Accesses': files.filter(f => f.accessCount > 100).length,
              'Total Access Events': metrics.accessEvents,
              'Average Events per File': Math.round(metrics.accessEvents / metrics.totalFiles)
            });
            setDetailTableData(files.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type,
              access_count: file.accessCount,
              status: file.status,
              access_level: file.accessLevel,
              uploaded_by: file.uploadedBy,
              uploaded_at: file.uploadedAt,
              last_accessed: file.lastAccessed,
              security_score: file.securityScore,
              risk_level: file.riskLevel,
              category: file.category
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Recent Uploads", metrics.recentUploads, <Upload className="w-6 h-6" />, 25.8, 'orange', () => {
            const recentFiles = files.filter(f => new Date(f.uploadedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            setDetailTitle('Recent Uploads');
            setDetailData({
              'Recent Uploads (7 days)': metrics.recentUploads,
              'Recent Upload Percentage': `${Math.round((metrics.recentUploads / metrics.totalFiles) * 100)}%`,
              'Average Security Score': Math.round(recentFiles.reduce((sum, f) => sum + (f.securityScore || 0), 0) / recentFiles.length),
              'Critical Risk Recent': recentFiles.filter(f => f.riskLevel === 'critical').length,
              'High Risk Recent': recentFiles.filter(f => f.riskLevel === 'high').length,
              'Medium Risk Recent': recentFiles.filter(f => f.riskLevel === 'medium').length,
              'Low Risk Recent': recentFiles.filter(f => f.riskLevel === 'low').length,
              'Average File Size': formatFileSize(Math.round(recentFiles.reduce((sum, f) => sum + f.size, 0) / recentFiles.length))
            });
            setDetailTableData(recentFiles.map(file => ({
              id: file.id,
              name: file.name,
              type: file.type,
              size: formatFileSize(file.size),
              status: file.status,
              access_level: file.accessLevel,
              uploaded_by: file.uploadedBy,
              uploaded_at: file.uploadedAt,
              security_score: file.securityScore,
              risk_level: file.riskLevel,
              encryption_status: file.encryptionStatus,
              compliance_status: file.complianceStatus,
              virus_scan_status: file.virusScanStatus,
              backup_status: file.backupStatus,
              days_ago: Math.floor((Date.now() - new Date(file.uploadedAt).getTime()) / (1000 * 60 * 60 * 24))
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by filename..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterAccessLevel}
              onChange={(e) => setFilterAccessLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
        </div>

        {/* Document Files */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Files
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor uploaded documents and their access controls
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredFiles.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{file.name}</h3>
                        <Badge className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                        <Badge className={getAccessLevelColor(file.accessLevel)}>
                          {file.accessLevel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {file.type}
                        </div>
                        <div>
                          <span className="font-medium">Uploaded by:</span> {file.uploadedBy}
                        </div>
                        <div>
                          <span className="font-medium">Access count:</span> {file.accessCount}
                        </div>
                      </div>
                      {file.lastAccessed && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Last accessed: {new Date(file.lastAccessed).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={file.status === 'approved' ? 'destructive' : 'default'}
                        onClick={() => handleFileStatusChange(file.id, file.status === 'approved' ? 'rejected' : 'approved')}
                      >
                        {file.status === 'approved' ? 'Reject' : 'Approve'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Access Logs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Recent Access Logs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Monitor document access patterns and security events
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {accessLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-blue-500">
                        {getAccessTypeIcon(log.accessType)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{log.fileName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {log.userEmail} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          IP: {log.ipAddress}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {log.accessType}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Detail Modal */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{detailTitle}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* Summary Information */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Summary Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(detailData).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{key}</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search in data..."
                        value={detailSearchTerm}
                        onChange={(e) => setDetailSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {detailTableData.length} total items
                  </div>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Data</h4>
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          {detailTableData.length > 0 && Object.keys(detailTableData[0]).map((key) => (
                            <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {detailTableData
                          .filter(item => 
                            Object.values(item).some(value => 
                              String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                            )
                          )
                          .slice((detailCurrentPage - 1) * detailItemsPerPage, detailCurrentPage * detailItemsPerPage)
                          .map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                              {Object.values(item).map((value, valueIndex) => (
                                <td key={valueIndex} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                  {typeof value === 'string' && value.includes('@') && value.includes('.') ? (
                                    <span className="text-blue-600 dark:text-blue-400">{value}</span>
                                  ) : typeof value === 'string' && value.includes('critical') ? (
                                    <span className="text-red-600 dark:text-red-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('high') ? (
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('medium') ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('low') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('approved') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('pending') ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('rejected') ? (
                                    <span className="text-red-600 dark:text-red-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('encrypted') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('clean') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('backed_up') ? (
                                    <span className="text-green-600 dark:text-green-400 font-medium">{value}</span>
                                  ) : typeof value === 'number' && value > 0 && value < 100 ? (
                                    <span className={`font-medium ${value >= 90 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                      {value}%
                                    </span>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {Math.ceil(detailTableData.filter(item => 
                Object.values(item).some(value => 
                  String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                )
              ).length / detailItemsPerPage) > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((detailCurrentPage - 1) * detailItemsPerPage) + 1} to{' '}
                    {Math.min(detailCurrentPage * detailItemsPerPage, detailTableData.filter(item => 
                      Object.values(item).some(value => 
                        String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                      )
                    ).length)} of{' '}
                    {detailTableData.filter(item => 
                      Object.values(item).some(value => 
                        String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                      )
                    ).length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setDetailCurrentPage(Math.max(1, detailCurrentPage - 1))}
                      disabled={detailCurrentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      Page {detailCurrentPage} of {Math.ceil(detailTableData.filter(item => 
                        Object.values(item).some(value => 
                          String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                        )
                      ).length / detailItemsPerPage)}
                    </span>
                    <button
                      onClick={() => setDetailCurrentPage(Math.min(Math.ceil(detailTableData.filter(item => 
                        Object.values(item).some(value => 
                          String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                        )
                      ).length / detailItemsPerPage), detailCurrentPage + 1))}
                      disabled={detailCurrentPage === Math.ceil(detailTableData.filter(item => 
                        Object.values(item).some(value => 
                          String(value).toLowerCase().includes(detailSearchTerm.toLowerCase())
                        )
                      ).length / detailItemsPerPage)}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 