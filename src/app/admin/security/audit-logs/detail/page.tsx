'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  AlertTriangle, 
  Eye, 
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Calendar,
  User,
  Globe,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import Link from 'next/link';

interface AuditLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  module: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  ip_address?: string;
  context?: any;
  action_type?: string;
  resource_type?: string;
  resource_id?: string;
  target_type?: string;
  details?: any;
}

export default function AuditLogsDetailPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(20);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterLevel, filterModule, dateRange]);

  const loadAuditLogs = async () => {
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

      const [systemLogsResult, userActionLogsResult, adminActivityLogsResult] = await Promise.allSettled([
        supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('user_action_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(500)
      ]);

      const allLogs: AuditLog[] = [];

      // Process system logs
      if (systemLogsResult.status === 'fulfilled' && systemLogsResult.value.data) {
        systemLogsResult.value.data.forEach((log: any) => {
          allLogs.push({
            id: log.id,
            timestamp: log.created_at,
            level: log.level,
            message: log.message,
            module: log.module,
            user_id: log.user_id,
            user_email: log.user_id ? getUserEmail(log.user_id) : undefined,
            user_name: log.user_id ? getUserDisplayName(log.user_id) : undefined,
            ip_address: log.ip_address,
            context: log.context
          });
        });
      }

      // Process user action logs
      if (userActionLogsResult.status === 'fulfilled' && userActionLogsResult.value.data) {
        userActionLogsResult.value.data.forEach((log: any) => {
          allLogs.push({
            id: log.id,
            timestamp: log.created_at,
            level: 'info',
            message: `User action: ${log.action_type}`,
            module: 'user_actions',
            user_id: log.user_id,
            user_email: getUserEmail(log.user_id),
            user_name: getUserDisplayName(log.user_id),
            ip_address: log.ip_address,
            action_type: log.action_type,
            resource_type: log.resource_type,
            details: log.details
          });
        });
      }

      // Process admin activity logs
      if (adminActivityLogsResult.status === 'fulfilled' && adminActivityLogsResult.value.data) {
        adminActivityLogsResult.value.data.forEach((log: any) => {
          allLogs.push({
            id: log.id,
            timestamp: log.created_at,
            level: 'info',
            message: `Admin action: ${log.action_type}`,
            module: 'admin_actions',
            user_id: log.admin_id,
            user_email: getUserEmail(log.admin_id),
            user_name: getUserDisplayName(log.admin_id),
            ip_address: log.ip_address,
            action_type: log.action_type,
            target_type: log.target_type,
            details: log.details
          });
        });
      }

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(allLogs);
      setFilteredLogs(allLogs);

    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Level filter
    if (filterLevel) {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    // Module filter
    if (filterModule) {
      filtered = filtered.filter(log => log.module === filterModule);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(dateRange.end));
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const handleExportLogs = async () => {
    try {
      const exportData = filteredLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        module: log.module,
        user_name: log.user_name,
        user_email: log.user_email,
        ip_address: log.ip_address,
        action_type: log.action_type,
        resource_type: log.resource_type
      }));

      // Create PDF
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Audit Logs Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Total Logs: ${exportData.length}`, 20, 55);

      let yPosition = 70;
      exportData.slice(0, 50).forEach((log, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${log.timestamp} - ${log.level.toUpperCase()}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`Module: ${log.module}`, 25, yPosition + 5);
        doc.text(`Message: ${log.message}`, 25, yPosition + 10);
        if (log.user_name) {
          doc.text(`User: ${log.user_name} (${log.user_email})`, 25, yPosition + 15);
        }
        yPosition += 25;
      });

      const fileName = `audit-logs-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Successful",
        description: "Audit logs have been exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive"
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warn': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'warn': return <AlertCircle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
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
                  System Audit Logs
                </h1>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Comprehensive system activity and security monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadAuditLogs} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportLogs}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Logs</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search messages, modules, users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="level-filter">Log Level</Label>
                <select
                  id="level-filter"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <Label htmlFor="module-filter">Module</Label>
                <select
                  id="module-filter"
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Modules</option>
                  <option value="auth">Authentication</option>
                  <option value="security">Security</option>
                  <option value="database">Database</option>
                  <option value="api">API</option>
                  <option value="file">File System</option>
                  <option value="user_actions">User Actions</option>
                  <option value="admin_actions">Admin Actions</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <Label htmlFor="date-start">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              System Audit Logs
            </CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {logs.length} total logs • Page {currentPage} of {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No logs found matching your filters</p>
                </div>
              ) : (
                paginatedLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getLevelIcon(log.level)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getLevelColor(log.level)}>
                              {log.level.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {log.module}
                            </Badge>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">{log.message}</p>
                          <div className="mt-2 space-y-1">
                            {log.user_name && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <User className="w-3 h-3 inline mr-1" />
                                {log.user_name} ({log.user_email})
                              </p>
                            )}
                            {log.ip_address && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <Globe className="w-3 h-3 inline mr-1" />
                                {log.ip_address}
                              </p>
                            )}
                            {log.action_type && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <Activity className="w-3 h-3 inline mr-1" />
                                Action: {log.action_type}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
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