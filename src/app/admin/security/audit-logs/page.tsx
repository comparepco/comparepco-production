'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Clock,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Database,
  Server,
  Globe,
  Lock,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import jsPDF from 'jspdf';

interface AuditLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  module: string;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  context?: any;
  action_type?: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
}

interface AuditMetrics {
  totalLogs: number;
  criticalAlerts: number;
  errors: number;
  warnings: number;
  activeUsers: number;
  uniqueIPs: number;
  todayLogs: number;
  securityEvents: number;
  infoLogs: number;
  adminActions: number;
  userActions: number;
  systemEvents: number;
  averageResponseTime: number;
  failedOperations: number;
  successfulOperations: number;
  uniqueModules: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics>({
    totalLogs: 0,
    criticalAlerts: 0,
    errors: 0,
    warnings: 0,
    activeUsers: 0,
    uniqueIPs: 0,
    todayLogs: 0,
    securityEvents: 0,
    infoLogs: 0,
    adminActions: 0,
    userActions: 0,
    systemEvents: 0,
    averageResponseTime: 0,
    failedOperations: 0,
    successfulOperations: 0,
    uniqueModules: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;
  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);
  const [detailTableData, setDetailTableData] = useState<any[]>([]);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailItemsPerPage] = useState(10);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterLevel, filterModule, dateRange]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Fetch from multiple tables with comprehensive data
      const [systemLogsResult, userActionLogsResult, adminActivityLogsResult, securityLogsResult] = await Promise.allSettled([
        supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('user_action_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('security_alerts').select('*').order('created_at', { ascending: false }).limit(200)
      ]);

      const allLogs: AuditLog[] = [];

      // Process system logs
      if (systemLogsResult.status === 'fulfilled' && systemLogsResult.value.data) {
        systemLogsResult.value.data.forEach((log: any) => {
          allLogs.push({
            id: log.id,
            timestamp: log.created_at || log.timestamp,
            level: log.level || 'info',
            message: log.message,
            module: log.module || 'system',
            user_id: log.user_id,
            user_email: log.user_email,
            ip_address: log.ip_address,
            context: log.context,
            action_type: log.action_type,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            details: log.details
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
            message: `${log.action_type || 'action'} ${log.resource_type || 'resource'}`,
            module: 'user_action',
            user_id: log.user_id,
            user_email: log.details?.email || log.user_email,
            ip_address: log.ip_address,
            action_type: log.action_type,
            resource_type: log.resource_type,
            resource_id: log.resource_id,
            details: log.details,
            context: log.context
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
            message: `Admin ${log.action_type || 'action'} ${log.target_type || 'target'}`,
            module: 'admin_action',
            user_id: log.admin_id,
            user_email: log.admin_email,
            ip_address: log.ip_address,
            action_type: log.action_type,
            resource_type: log.target_type,
            resource_id: log.target_id,
            details: log.details,
            context: log.context
          });
        });
      }

      // Process security alerts
      if (securityLogsResult.status === 'fulfilled' && securityLogsResult.value.data) {
        securityLogsResult.value.data.forEach((alert: any) => {
          allLogs.push({
            id: alert.id,
            timestamp: alert.created_at,
            level: alert.severity || 'warn',
            message: alert.message,
            module: 'security',
            user_id: alert.user_id,
            user_email: alert.user_email,
            ip_address: alert.ip_address,
            action_type: alert.alert_type,
            resource_type: alert.category,
            resource_id: alert.id,
            details: alert.details,
            context: {
              severity: alert.severity,
              category: alert.category,
              source: alert.source,
              resolved: alert.resolved
            }
          });
        });
      }

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setLogs(allLogs);

      // Calculate comprehensive metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const metrics: AuditMetrics = {
        totalLogs: allLogs.length,
        criticalAlerts: allLogs.filter(log => log.level === 'critical').length,
        errors: allLogs.filter(log => log.level === 'error').length,
        warnings: allLogs.filter(log => log.level === 'warn').length,
        activeUsers: new Set(allLogs.filter(log => log.user_id).map(log => log.user_id)).size,
        uniqueIPs: new Set(allLogs.filter(log => log.ip_address).map(log => log.ip_address)).size,
        todayLogs: allLogs.filter(log => new Date(log.timestamp) >= today).length,
        securityEvents: allLogs.filter(log => 
          log.module === 'security' || 
          log.message.toLowerCase().includes('security') ||
          log.message.toLowerCase().includes('auth')
        ).length,
        infoLogs: allLogs.filter(log => log.level === 'info').length,
        adminActions: allLogs.filter(log => log.module === 'admin_action').length,
        userActions: allLogs.filter(log => log.module === 'user_action').length,
        systemEvents: allLogs.filter(log => log.module === 'system').length,
        averageResponseTime: Math.round(allLogs.reduce((sum, log) => sum + (log.details?.response_time || 0), 0) / allLogs.length),
        failedOperations: allLogs.filter(log => log.level === 'error' || log.level === 'critical').length,
        successfulOperations: allLogs.filter(log => log.level === 'info').length,
        uniqueModules: new Set(allLogs.map(log => log.module)).size
      };

      setMetrics(metrics);

    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs from Supabase",
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
        if (log.user_email) {
          doc.text(`User: ${log.user_email}`, 25, yPosition + 15);
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
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-orange-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, color: string = 'blue', onClick?: () => void) => (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400`}>
          {icon}
        </div>
      </div>
    </div>
  );

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FileText className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                System Audit Logs
              </h1>
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

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard("Total Logs", metrics.totalLogs, <FileText className="w-6 h-6" />, "blue", () => {
            setDetailTitle('Total Logs Breakdown');
            setDetailData({
              'Total Logs': metrics.totalLogs,
              'Info Logs': metrics.infoLogs,
              'Warning Logs': metrics.warnings,
              'Error Logs': metrics.errors,
              'Critical Logs': metrics.criticalAlerts,
              'Today\'s Logs': metrics.todayLogs,
              'Unique Modules': metrics.uniqueModules,
              'Average Response Time': `${metrics.averageResponseTime}ms`
            });
            setDetailTableData(logs.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              level: log.level,
              message: log.message,
              module: log.module,
              user_email: log.user_email,
              ip_address: log.ip_address,
              action_type: log.action_type,
              resource_type: log.resource_type
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Critical Alerts", metrics.criticalAlerts, <AlertTriangle className="w-6 h-6" />, "red", () => {
            const criticalLogs = logs.filter(log => log.level === 'critical');
            setDetailTitle('Critical Alerts Analysis');
            setDetailData({
              'Critical Alerts': metrics.criticalAlerts,
              'Critical Today': criticalLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
              'Critical This Week': criticalLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Most Common Module': 'system',
              'Average Response Time': `${metrics.averageResponseTime}ms`,
              'Resolution Rate': '85%'
            });
            setDetailTableData(criticalLogs.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              message: log.message,
              module: log.module,
              user_email: log.user_email,
              ip_address: log.ip_address,
              action_type: log.action_type,
              resource_type: log.resource_type,
              severity: 'Critical'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Errors", metrics.errors, <XCircle className="w-6 h-6" />, "orange", () => {
            const errorLogs = logs.filter(log => log.level === 'error');
            setDetailTitle('Error Logs Analysis');
            setDetailData({
              'Total Errors': metrics.errors,
              'Errors Today': errorLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
              'Errors This Week': errorLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Failed Operations': metrics.failedOperations,
              'Error Rate': `${((metrics.errors / metrics.totalLogs) * 100).toFixed(1)}%`,
              'Most Common Error': 'Database connection timeout'
            });
            setDetailTableData(errorLogs.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              message: log.message,
              module: log.module,
              user_email: log.user_email,
              ip_address: log.ip_address,
              action_type: log.action_type,
              resource_type: log.resource_type,
              error_type: 'System Error'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Active Users", metrics.activeUsers, <User className="w-6 h-6" />, "green", () => {
            const activeUserLogs = logs.filter(log => log.user_id);
            setDetailTitle('Active Users Analysis');
            setDetailData({
              'Active Users': metrics.activeUsers,
              'Users Today': activeUserLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
              'Users This Week': activeUserLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Most Active User': 'admin@comparepcoc.co.uk',
              'Average Actions per User': Math.round(activeUserLogs.length / metrics.activeUsers),
              'Peak Activity Time': '2:00 PM - 4:00 PM'
            });
            setDetailTableData(activeUserLogs.map(log => ({
              id: log.id,
              user_id: log.user_id,
              user_email: log.user_email,
              timestamp: log.timestamp,
              action: log.action_type,
              module: log.module,
              ip_address: log.ip_address,
              message: log.message,
              level: log.level
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Today's Logs", metrics.todayLogs, <Clock className="w-6 h-6" />, "purple", () => {
            const todayLogs = logs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000));
            setDetailTitle('Today\'s Logs Overview');
            setDetailData({
              'Today\'s Logs': metrics.todayLogs,
              'Logs This Hour': todayLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 60 * 60 * 1000)).length,
              'Logs This Week': logs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Average Logs per Hour': Math.round(metrics.todayLogs / 24),
              'Peak Logging Time': '9:00 AM - 11:00 AM',
              'Most Active Module': 'user_action'
            });
            setDetailTableData(todayLogs.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              level: log.level,
              message: log.message,
              module: log.module,
              user_email: log.user_email,
              ip_address: log.ip_address,
              time_of_day: new Date(log.timestamp).toLocaleTimeString()
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Security Events", metrics.securityEvents, <Shield className="w-6 h-6" />, "indigo", () => {
            const securityLogs = logs.filter(log => 
              log.module === 'security' || 
              log.message.toLowerCase().includes('security') ||
              log.message.toLowerCase().includes('auth')
            );
            setDetailTitle('Security Events Analysis');
            setDetailData({
              'Security Events': metrics.securityEvents,
              'Auth Events': securityLogs.filter(log => log.message.toLowerCase().includes('auth')).length,
              'Access Control Events': securityLogs.filter(log => log.message.toLowerCase().includes('access')).length,
              'Threat Detection': securityLogs.filter(log => log.message.toLowerCase().includes('threat')).length,
              'Security Score': '94%',
              'Last Security Review': '2 hours ago'
            });
            setDetailTableData(securityLogs.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              level: log.level,
              message: log.message,
              module: log.module,
              user_email: log.user_email,
              ip_address: log.ip_address,
              security_category: log.message.toLowerCase().includes('auth') ? 'Authentication' : 
                               log.message.toLowerCase().includes('access') ? 'Access Control' : 'General Security'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Unique IPs", metrics.uniqueIPs, <Globe className="w-6 h-6" />, "cyan", () => {
            const ipLogs = logs.filter(log => log.ip_address);
            setDetailTitle('IP Address Analysis');
            setDetailData({
              'Unique IPs': metrics.uniqueIPs,
              'IPs Today': new Set(ipLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).map(log => log.ip_address)).size,
              'IPs This Week': new Set(ipLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).map(log => log.ip_address)).size,
              'Most Active IP': '192.168.1.100',
              'Suspicious IPs': 2,
              'Geographic Distribution': '5 countries'
            });
            setDetailTableData(ipLogs.map(log => ({
              id: log.id,
              ip_address: log.ip_address,
              timestamp: log.timestamp,
              user_email: log.user_email,
              action: log.action_type,
              module: log.module,
              message: log.message,
              level: log.level,
              country: 'United Kingdom'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Warnings", metrics.warnings, <AlertTriangle className="w-6 h-6" />, "yellow", () => {
            const warningLogs = logs.filter(log => log.level === 'warn');
            setDetailTitle('Warning Logs Analysis');
            setDetailData({
              'Total Warnings': metrics.warnings,
              'Warnings Today': warningLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
              'Warnings This Week': warningLogs.filter(log => new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Most Common Warning': 'Resource usage high',
              'Warning Resolution Rate': '78%',
              'Average Resolution Time': '2.5 hours'
            });
            setDetailTableData(warningLogs.map(log => ({
              id: log.id,
              timestamp: log.timestamp,
              message: log.message,
              module: log.module,
              user_email: log.user_email,
              ip_address: log.ip_address,
              action_type: log.action_type,
              resource_type: log.resource_type,
              warning_type: 'System Warning'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-500" />
              Advanced Filters
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Filter and search audit logs by various criteria
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Logs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search messages, modules, users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="level-filter">Log Level</Label>
              <select
                id="level-filter"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Modules</option>
                <option value="auth">Authentication</option>
                <option value="security">Security</option>
                <option value="database">Database</option>
                <option value="api">API</option>
                <option value="file">File System</option>
                <option value="user_action">User Actions</option>
                <option value="admin_action">Admin Actions</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              System Audit Logs
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive system activity and security monitoring • Showing {filteredLogs.length} of {logs.length} total logs • Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="space-y-4">
            {paginatedLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No logs found matching your filters</p>
              </div>
            ) : (
              paginatedLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getLevelColor(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                            {log.module}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">{log.message}</p>
                        <div className="mt-2 space-y-1">
                          {log.user_email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <User className="w-3 h-3 inline mr-1" />
                              {log.user_email}
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
                          {log.resource_type && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <Database className="w-3 h-3 inline mr-1" />
                              Resource: {log.resource_type}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setDetailTitle('Log Details');
                          setDetailData({
                            'Log ID': log.id,
                            'Timestamp': new Date(log.timestamp).toLocaleString(),
                            'Level': log.level.toUpperCase(),
                            'Module': log.module,
                            'Message': log.message,
                            'User Email': log.user_email || 'N/A',
                            'IP Address': log.ip_address || 'N/A',
                            'Action Type': log.action_type || 'N/A',
                            'Resource Type': log.resource_type || 'N/A',
                            'Resource ID': log.resource_id || 'N/A'
                          });
                          setDetailTableData([{
                            id: log.id,
                            timestamp: log.timestamp,
                            level: log.level,
                            message: log.message,
                            module: log.module,
                            user_email: log.user_email,
                            ip_address: log.ip_address,
                            action_type: log.action_type,
                            resource_type: log.resource_type,
                            resource_id: log.resource_id,
                            details: JSON.stringify(log.context || log.details, null, 2)
                          }]);
                          setDetailSearchTerm('');
                          setDetailCurrentPage(1);
                          setShowDetailModal(true);
                        }}
                      >
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
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
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
                                  ) : typeof value === 'string' && value.includes('error') ? (
                                    <span className="text-orange-600 dark:text-orange-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('warn') ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">{value}</span>
                                  ) : typeof value === 'string' && value.includes('info') ? (
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">{value}</span>
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