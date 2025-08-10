'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  FileCheck, 
  FileX, 
  Eye, 
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Globe,
  Activity,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import Link from 'next/link';

interface FileSecurity {
  id: string;
  file_path: string;
  file_hash: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  upload_ip?: string;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  uploader_email?: string;
  uploader_name?: string;
  approver_email?: string;
  approver_name?: string;
}

interface FileAccessLog {
  id: string;
  file_id: string;
  user_id: string;
  access_type: string;
  ip_address?: string;
  timestamp: string;
  user_email?: string;
  user_name?: string;
}

export default function DocumentAccessDetailPage() {
  const [files, setFiles] = useState<FileSecurity[]>([]);
  const [accessLogs, setAccessLogs] = useState<FileAccessLog[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filesPerPage] = useState(20);

  useEffect(() => {
    loadDocumentAccessData();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, filterStatus, filterType]);

  const loadDocumentAccessData = async () => {
    try {
      setLoading(true);
      
      // Get users for name mapping
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const userMap = new Map(users.map(user => [user.id, user]));

      // Get admin staff for role mapping
      const { data: adminStaff } = await supabase
        .from('admin_staff')
        .select('*');
      const adminStaffMap = new Map(adminStaff?.map(staff => [staff.user_id, staff]) || []);

      // Helper function to get user display name
      const getUserDisplayName = (userId: string) => {
        const user = userMap.get(userId);
        const adminStaffData = adminStaffMap.get(userId);
        
        if (user?.user_metadata?.full_name) {
          return user.user_metadata.full_name;
        } else if (user?.email) {
          return user.email.split('@')[0]; // Use email prefix as name
        } else if (adminStaffData?.role) {
          return `${adminStaffData.role} User`;
        } else {
          return 'Unknown User';
        }
      };

      // Helper function to get user email
      const getUserEmail = (userId: string) => {
        const user = userMap.get(userId);
        return user?.email || 'Unknown Email';
      };

      // Get file security data
      const { data: fileSecurityData } = await supabase
        .from('file_security')
        .select('*')
        .order('created_at', { ascending: false });

      const filesWithNames = fileSecurityData?.map(file => ({
        ...file,
        uploader_email: getUserEmail(file.uploaded_by),
        uploader_name: getUserDisplayName(file.uploaded_by),
        approver_email: file.approved_by ? getUserEmail(file.approved_by) : null,
        approver_name: file.approved_by ? getUserDisplayName(file.approved_by) : null
      })) || [];

      // Get file access logs
      const { data: accessLogsData } = await supabase
        .from('file_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      const accessLogsWithNames = accessLogsData?.map(log => ({
        ...log,
        user_email: getUserEmail(log.user_id),
        user_name: getUserDisplayName(log.user_id)
      })) || [];

      setFiles(filesWithNames);
      setFilteredFiles(filesWithNames);
      setAccessLogs(accessLogsWithNames);

    } catch (error) {
      console.error('Failed to load document access data:', error);
      toast({
        title: "Error",
        description: "Failed to load document access data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = files;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.uploader_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.uploader_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(file => 
        filterStatus === 'approved' ? file.is_approved : !file.is_approved
      );
    }

    // Type filter
    if (filterType) {
      filtered = filtered.filter(file => file.mime_type.includes(filterType));
    }

    setFilteredFiles(filtered);
    setCurrentPage(1);
  };

  const handleApproveFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('file_security')
        .update({ 
          is_approved: true, 
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) throw error;

      // Refresh data
      loadDocumentAccessData();

      toast({
        title: "File Approved",
        description: "File has been approved for access",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve file",
        variant: "destructive"
      });
    }
  };

  const handleRejectFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('file_security')
        .update({ 
          is_approved: false, 
          approved_by: (await supabase.auth.getUser()).data.user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', fileId);

      if (error) throw error;

      // Refresh data
      loadDocumentAccessData();

      toast({
        title: "File Rejected",
        description: "File has been rejected",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject file",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const { error } = await supabase
        .from('file_security')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      // Refresh data
      loadDocumentAccessData();

      toast({
        title: "File Deleted",
        description: "File has been permanently deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleExportFiles = async () => {
    try {
      const exportData = filteredFiles.map(file => ({
        id: file.id,
        file_path: file.file_path,
        file_size: file.file_size,
        mime_type: file.mime_type,
        uploader_name: file.uploader_name,
        uploader_email: file.uploader_email,
        is_approved: file.is_approved,
        approver_name: file.approver_name,
        created_at: file.created_at,
        approved_at: file.approved_at
      }));

      // Create PDF
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Document Access Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Total Files: ${exportData.length}`, 20, 55);

      let yPosition = 70;
      exportData.slice(0, 50).forEach((file, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${file.file_path.split('/').pop()}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`Uploader: ${file.uploader_name} (${file.uploader_email})`, 25, yPosition + 5);
        doc.text(`Size: ${(file.file_size / 1024).toFixed(1)} KB`, 25, yPosition + 10);
        doc.text(`Type: ${file.mime_type}`, 25, yPosition + 15);
        doc.text(`Status: ${file.is_approved ? 'Approved' : 'Pending'}`, 25, yPosition + 20);
        if (file.approver_name) {
          doc.text(`Approved by: ${file.approver_name}`, 25, yPosition + 25);
        }
        yPosition += 35;
      });

      const fileName = `document-access-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Successful",
        description: "Document access report has been exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export document access report",
        variant: "destructive"
      });
    }
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('image')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('video')) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusColor = (isApproved: boolean) => {
    return isApproved ? 'bg-green-500' : 'bg-yellow-500';
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'bg-red-500';
    if (mimeType.includes('image')) return 'bg-blue-500';
    if (mimeType.includes('video')) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * filesPerPage,
    currentPage * filesPerPage
  );

  const totalPages = Math.ceil(filteredFiles.length / filesPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading document access data...</p>
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
              <div className="flex items-center gap-4">
                <Link href="/admin/security">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FileText className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                  Document Access Management
                </h1>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage file uploads, security approvals, and access controls
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadDocumentAccessData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportFiles}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Search Files</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by filename or uploader..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <Label htmlFor="type-filter">File Type</Label>
                <select
                  id="type-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="application">Applications</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Security Management
            </CardTitle>
            <CardDescription>
              Showing {filteredFiles.length} of {files.length} total files • Page {currentPage} of {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No files found matching your filters</p>
                </div>
              ) : (
                paginatedFiles.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(file.is_approved)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {file.file_path.split('/').pop()}
                            </h3>
                            <Badge className={getFileTypeColor(file.mime_type)}>
                              {file.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </Badge>
                            <Badge variant={file.is_approved ? 'default' : 'secondary'}>
                              {file.is_approved ? 'Approved' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Uploaded by: {file.uploader_name || file.uploader_email || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Size: {(file.file_size / 1024).toFixed(1)} KB</span>
                            <span>Uploaded: {new Date(file.created_at).toLocaleDateString()}</span>
                            {file.approved_at && (
                              <span>Approved: {new Date(file.approved_at).toLocaleDateString()}</span>
                            )}
                            {file.upload_ip && (
                              <span>IP: {file.upload_ip}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!file.is_approved ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveFile(file.id)}
                          >
                            <FileCheck className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectFile(file.id)}
                          >
                            <FileX className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 