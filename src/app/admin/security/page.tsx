'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Users, 
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  Globe,
  Lock,
  Server,
  BarChart3,
  Zap,
  Target,
  Star,
  Building,
  Car,
  Filter,
  Download,
  Settings,
  Bell,
  Search,
  MoreHorizontal,
  ExternalLink,
  UserCheck,
  UserX,
  FileCheck,
  FileX,
  ShieldCheck,
  ShieldX,
  ActivitySquare,
  Calendar,
  MapPin,
  Wifi,
  Smartphone,
  Monitor,
  Tablet,
  Globe2,
  Flag,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SecurityMetrics {
  totalLogs: number;
  criticalAlerts: number;
  errors: number;
  warnings: number;
  userActions: number;
  adminActions: number;
  activeAlerts: number;
  securityEvents: number;
  uniqueUsers: number;
  uniqueIPs: number;
  todayEvents: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  responseTime: number;
  complianceScore: number;
  uptime: number;
  blockedAttempts: number;
  fileUploads: number;
  sessionCount: number;
  rateLimitViolations: number;
  securityScore: number;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  created_at: string;
  resolved: boolean;
  user_id?: string;
  ip_address?: string;
  category: string;
  source: string;
  resolved_by?: string;
  resolved_at?: string;
  user_email?: string;
  user_name?: string;
}

interface UserAction {
  id: string;
  user_id: string;
  action_type: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  timestamp: string;
  user_email?: string;
  user_name?: string;
  user_metadata?: any;
}

interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  details?: any;
  ip_address?: string;
  timestamp: string;
  admin_email?: string;
  admin_name?: string;
}

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

interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

interface RateLimit {
  id: string;
  identifier: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  created_at: string;
}

interface SecurityTrend {
  date: string;
  alerts: number;
  threats: number;
  incidents: number;
  responseTime: number;
}

interface SecurityByCategory {
  category: string;
  incidents: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  responseTime: number;
  resolutionRate: number;
}

interface TopThreats {
  id: string;
  type: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  lastSeen: string;
  source: string;
}

export default function SecurityDashboardPage() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalLogs: 0,
    criticalAlerts: 0,
    errors: 0,
    warnings: 0,
    userActions: 0,
    adminActions: 0,
    activeAlerts: 0,
    securityEvents: 0,
    uniqueUsers: 0,
    uniqueIPs: 0,
    todayEvents: 0,
    systemHealth: 'healthy',
    threatLevel: 'low',
    responseTime: 0,
    complianceScore: 0,
    uptime: 0,
    blockedAttempts: 0,
    fileUploads: 0,
    sessionCount: 0,
    rateLimitViolations: 0,
    securityScore: 0
  });
  
  const [recentAlerts, setRecentAlerts] = useState<SecurityAlert[]>([]);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [fileSecurity, setFileSecurity] = useState<FileSecurity[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [securityTrends, setSecurityTrends] = useState<SecurityTrend[]>([]);
  const [securityByCategory, setSecurityByCategory] = useState<SecurityByCategory[]>([]);
  const [topThreats, setTopThreats] = useState<TopThreats[]>([]);
  
  // Add missing state variables
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Add state for modal and detailed data
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [metricDetails, setMetricDetails] = useState<any>(null);
  const [showMetricModal, setShowMetricModal] = useState(false);
  // Generic detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);

  // Add state for user mapping
  const [userMap, setUserMap] = useState<Map<string, any>>(new Map());
  const [adminStaffMap, setAdminStaffMap] = useState<Map<string, any>>(new Map());

  // Add state for modal pagination and search
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [modalFilter, setModalFilter] = useState('');

  const router = useRouter();

  // Helper functions for user name resolution
  const getUserDisplayName = (userId: string) => {
    const user = userMap.get(userId);
    const adminStaffData = adminStaffMap.get(userId);
    
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    } else if (user?.email) {
      return user.email; // Fall back to full email
    } else if (adminStaffData?.role) {
      return `${adminStaffData.role}`;
    } else {
      return 'Unknown User';
    }
  };

  const getUserEmail = (userId: string) => {
    const user = userMap.get(userId);
    return user?.email || 'Unknown Email';
  };

  // Helper to resolve a user's role (admin staff role takes precedence)
  const getUserRole = (userId: string) => {
    const adminData = adminStaffMap.get(userId);
    if (adminData?.role) return adminData.role;
    const user = userMap.get(userId);
    return user?.user_metadata?.role || 'N/A';
  };

  useEffect(() => {
    loadSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadSecurityData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange, autoRefresh]);

  // Handle metric card click with enhanced data fetching
  const handleMetricClick = async (metricType: string) => {
    setSelectedMetric(metricType);
    setShowMetricModal(true);
    setModalSearchTerm('');
    setModalCurrentPage(1);
    setModalFilter('');
    
    try {
      // Fetch users and admin staff for name resolution
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const { data: adminStaff } = await supabase.from('admin_staff').select('*');
      
      const userMap = new Map(users.map(user => [user.id, user]));
      const adminStaffMap = new Map(adminStaff?.map(staff => [staff.user_id, staff]) || []);

      // Helper functions for name resolution
      const getUserDisplayName = (userId: string) => {
        const user = userMap.get(userId);
        const adminStaffData = adminStaffMap.get(userId);
        if (user?.user_metadata?.full_name) {
          return user.user_metadata.full_name;
        } else if (user?.email) {
          return user.email.split('@')[0];
        } else if (adminStaffData?.role) {
          return `${adminStaffData.role} User`;
        } else {
          return 'Unknown User';
        }
      };

      const getUserEmail = (userId: string) => {
        const user = userMap.get(userId);
        return user?.email || 'Unknown Email';
      };

      // Fetch fresh data based on metric type
      switch (metricType) {
        case 'totalLogs':
          const { data: freshSystemLogs } = await supabase
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedSystemLogs = (freshSystemLogs || []).map(log => ({
            ...log,
            user_name: log.user_id ? getUserDisplayName(log.user_id) : 'System',
            user_email: log.user_id ? getUserEmail(log.user_id) : 'system@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'System Logs Details',
            data: enrichedSystemLogs,
            columns: ['Timestamp', 'Level', 'Message', 'Module', 'User', 'Email', 'IP'],
            totalCount: enrichedSystemLogs.length,
            metricType: 'totalLogs'
          });
          break;
          
        case 'criticalAlerts':
          const { data: freshAlerts } = await supabase
            .from('security_alerts')
            .select('*')
            .eq('severity', 'critical')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedAlerts = (freshAlerts || []).map(alert => ({
            ...alert,
            user_name: alert.user_id ? getUserDisplayName(alert.user_id) : 'System',
            user_email: alert.user_id ? getUserEmail(alert.user_id) : 'system@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'Critical Alerts Details',
            data: enrichedAlerts,
            columns: ['Timestamp', 'Message', 'User', 'Email', 'Severity', 'Status'],
            totalCount: enrichedAlerts.length,
            metricType: 'criticalAlerts'
          });
          break;
          
        case 'userActions':
          const { data: freshUserActions } = await supabase
            .from('user_action_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedUserActions = (freshUserActions || []).map(action => ({
            ...action,
            user_name: action.user_id ? getUserDisplayName(action.user_id) : 'Unknown User',
            user_email: action.user_id ? getUserEmail(action.user_id) : 'unknown@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'User Actions Details',
            data: enrichedUserActions,
            columns: ['Timestamp', 'Action', 'User', 'Email', 'IP', 'Details'],
            totalCount: enrichedUserActions.length,
            metricType: 'userActions'
          });
          break;
          
        case 'adminActions':
          const { data: freshAdminActions } = await supabase
            .from('admin_activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with admin names
          const enrichedAdminActions = (freshAdminActions || []).map(action => ({
            ...action,
            admin_name: action.admin_id ? getUserDisplayName(action.admin_id) : 'Unknown Admin',
            admin_email: action.admin_id ? getUserEmail(action.admin_id) : 'unknown@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'Admin Actions Details',
            data: enrichedAdminActions,
            columns: ['Timestamp', 'Action', 'Admin', 'Email', 'Target', 'Details'],
            totalCount: enrichedAdminActions.length,
            metricType: 'adminActions'
          });
          break;
          
        case 'activeAlerts':
          const { data: freshActiveAlerts } = await supabase
            .from('security_alerts')
            .select('*')
            .eq('resolved', false)
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedActiveAlerts = (freshActiveAlerts || []).map(alert => ({
            ...alert,
            user_name: alert.user_id ? getUserDisplayName(alert.user_id) : 'System',
            user_email: alert.user_id ? getUserEmail(alert.user_id) : 'system@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'Active Alerts Details',
            data: enrichedActiveAlerts,
            columns: ['Timestamp', 'Message', 'User', 'Email', 'Severity', 'Status'],
            totalCount: enrichedActiveAlerts.length,
            metricType: 'activeAlerts'
          });
          break;
          
        case 'securityEvents':
          const { data: freshSecurityEvents } = await supabase
            .from('security_alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedSecurityEvents = (freshSecurityEvents || []).map(event => ({
            ...event,
            user_name: event.user_id ? getUserDisplayName(event.user_id) : 'System',
            user_email: event.user_id ? getUserEmail(event.user_id) : 'system@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'Security Events Details',
            data: enrichedSecurityEvents,
            columns: ['Timestamp', 'Event Type', 'User', 'Email', 'Severity', 'Status'],
            totalCount: enrichedSecurityEvents.length,
            metricType: 'securityEvents'
          });
          break;
          
        case 'uniqueUsers':
          const { data: freshUniqueUsers } = await supabase
            .from('user_action_logs')
            .select('user_id')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Get unique users with their names
          const uniqueUserIds = Array.from(new Set((freshUniqueUsers || []).map(action => action.user_id)));
          const enrichedUniqueUsers = uniqueUserIds.map(userId => ({
            user_id: userId,
            user_name: getUserDisplayName(userId),
            user_email: getUserEmail(userId),
            user_role: getUserRole(userId),
            action_count: (freshUniqueUsers || []).filter(action => action.user_id === userId).length
          }));
          
          setMetricDetails({
            title: 'Unique Users Details',
            data: enrichedUniqueUsers,
            columns: ['User', 'Role', 'Email', 'Action Count', 'Last Activity'],
            totalCount: enrichedUniqueUsers.length,
            metricType: 'uniqueUsers'
          });
          break;
          
        case 'uniqueIPs':
          const { data: freshUniqueIPs } = await supabase
            .from('user_action_logs')
            .select('ip_address')
            .not('ip_address', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Get unique IPs with counts
          const ipCounts: { [key: string]: number } = (freshUniqueIPs || []).reduce((acc, action) => {
            acc[action.ip_address] = (acc[action.ip_address] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });
          
          const enrichedUniqueIPs = Object.entries(ipCounts).map(([ip, count]) => ({
            ip_address: ip,
            request_count: count,
            last_seen: new Date().toISOString()
          }));
          
          setMetricDetails({
            title: 'Unique IP Addresses Details',
            data: enrichedUniqueIPs,
            columns: ['IP Address', 'Request Count', 'Last Seen'],
            totalCount: enrichedUniqueIPs.length,
            metricType: 'uniqueIPs'
          });
          break;
          
        case 'todayEvents':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const { data: freshTodayEvents } = await supabase
            .from('user_action_logs')
            .select('*')
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedTodayEvents = (freshTodayEvents || []).map(event => ({
            ...event,
            user_name: event.user_id ? getUserDisplayName(event.user_id) : 'Unknown User',
            user_email: event.user_id ? getUserEmail(event.user_id) : 'unknown@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'Today\'s Events Details',
            data: enrichedTodayEvents,
            columns: ['Timestamp', 'Action', 'User', 'Email', 'IP', 'Details'],
            totalCount: enrichedTodayEvents.length,
            metricType: 'todayEvents'
          });
          break;
          
        case 'blockedAttempts':
          const { data: freshBlockedAttempts } = await supabase
            .from('security_alerts')
            .select('*')
            .eq('alert_type', 'blocked_attempt')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedBlockedAttempts = (freshBlockedAttempts || []).map(attempt => ({
            ...attempt,
            user_name: attempt.user_id ? getUserDisplayName(attempt.user_id) : 'Unknown User',
            user_email: attempt.user_id ? getUserEmail(attempt.user_id) : 'unknown@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'Blocked Attempts Details',
            data: enrichedBlockedAttempts,
            columns: ['Timestamp', 'Attempt Type', 'User', 'Email', 'IP', 'Reason'],
            totalCount: enrichedBlockedAttempts.length,
            metricType: 'blockedAttempts'
          });
          break;
          
        case 'fileUploads':
          const { data: freshFileUploads } = await supabase
            .from('file_security')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedFileUploads = (freshFileUploads || []).map(file => ({
            ...file,
            uploader_name: file.uploaded_by ? getUserDisplayName(file.uploaded_by) : 'Unknown User',
            uploader_email: file.uploaded_by ? getUserEmail(file.uploaded_by) : 'unknown@comparepco.co.uk',
            approver_name: file.approved_by ? getUserDisplayName(file.approved_by) : 'N/A',
            approver_email: file.approved_by ? getUserEmail(file.approved_by) : 'N/A'
          }));
          
          setMetricDetails({
            title: 'File Uploads Details',
            data: enrichedFileUploads,
            columns: ['Timestamp', 'File Name', 'Uploader', 'Email', 'Status', 'Size'],
            totalCount: enrichedFileUploads.length,
            metricType: 'fileUploads'
          });
          break;
          
        case 'sessionCount':
          const { data: freshSessions } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1000);
          
          // Enrich with user names
          const enrichedSessions = (freshSessions || []).map(session => ({
            ...session,
            user_name: session.user_id ? getUserDisplayName(session.user_id) : 'Unknown User',
            user_email: session.user_id ? getUserEmail(session.user_id) : 'unknown@comparepco.co.uk'
          }));
          
          setMetricDetails({
            title: 'Active Sessions Details',
            data: enrichedSessions,
            columns: ['Created', 'User', 'Email', 'IP', 'Device', 'Status'],
            totalCount: enrichedSessions.length,
            metricType: 'sessionCount'
          });
          break;
          
        default:
          setMetricDetails({
            title: 'Metric Details',
            data: [],
            columns: ['No Data'],
            totalCount: 0,
            metricType: 'unknown'
          });
      }
    } catch (error) {
      console.error('Failed to load metric details:', error);
      toast({
        title: "Error",
        description: "Failed to load metric details",
        variant: "destructive"
      });
    }
  };

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

      // Load all security data in parallel with user data and admin staff data
      const [
        systemLogsResult,
        userActionLogsResult,
        adminActivityLogsResult,
        securityAlertsResult,
        fileSecurityResult,
        userSessionsResult,
        rateLimitsResult,
        usersResult,
        adminStaffResult
      ] = await Promise.allSettled([
        supabase.from('system_logs').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('user_action_logs').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('admin_activity_logs').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('security_alerts').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('file_security').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('user_sessions').select('*').eq('is_active', true),
        supabase.from('rate_limits').select('*').gte('created_at', startDate.toISOString()),
        supabase.auth.admin.listUsers(),
        supabase.from('admin_staff').select('*')
      ]);

      // Get users for name mapping
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data.users : [];
      const userMap = new Map(users.map(user => [user.id, user]));
      setUserMap(userMap);

      // Get admin staff for role mapping
      const adminStaff = adminStaffResult.status === 'fulfilled' ? adminStaffResult.value.data || [] : [];
      const adminStaffMap = new Map(adminStaff.map(staff => [staff.user_id, staff]));
      setAdminStaffMap(adminStaffMap);

      // Process system logs
      const systemLogs = systemLogsResult.status === 'fulfilled' ? systemLogsResult.value.data || [] : [];
      setSystemLogs(systemLogs);
      const criticalLogs = systemLogs.filter(log => log.level === 'critical');
      const errorLogs = systemLogs.filter(log => log.level === 'error');
      const warningLogs = systemLogs.filter(log => log.level === 'warn');
      setTodayLogs(systemLogs.filter(log => new Date(log.created_at).toDateString() === now.toDateString()));

      // Helper functions with local scope to resolve names/emails using freshly fetched maps
      const resolveDisplayName = (userId: string | null | undefined) => {
        if (!userId) return 'System';
        const user = userMap.get(userId);
        const adminData = adminStaffMap.get(userId);
        if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
        if (user?.email) return user.email.split('@')[0];
        if (adminData?.role) return `${adminData.role} User`;
        return 'Unknown User';
      };

      const resolveEmail = (userId: string | null | undefined) => {
        if (!userId) return 'system@comparepco.co.uk';
        const user = userMap.get(userId);
        return user?.email || 'Unknown Email';
      };

      // Process user actions with user names
      const userActions = userActionLogsResult.status === 'fulfilled' ? userActionLogsResult.value.data || [] : [];
      const userActionsWithNames = userActions.map(action => ({
        ...action,
        user_email: resolveEmail(action.user_id),
        user_name: resolveDisplayName(action.user_id)
      }));
      setUserActions(userActionsWithNames);

      // Process admin actions with names
      const adminActions = adminActivityLogsResult.status === 'fulfilled' ? adminActivityLogsResult.value.data || [] : [];
      const adminActionsWithNames = adminActions.map(action => ({
        ...action,
        admin_email: resolveEmail(action.admin_id),
        admin_name: resolveDisplayName(action.admin_id)
      }));
      setAdminActions(adminActionsWithNames);

      // Process security alerts with names
      const securityAlerts = securityAlertsResult.status === 'fulfilled' ? securityAlertsResult.value.data || [] : [];
      const securityAlertsWithNames = securityAlerts.map(alert => ({
        ...alert,
        user_email: alert.user_id ? resolveEmail(alert.user_id) : null,
        user_name: alert.user_id ? resolveDisplayName(alert.user_id) : null
      }));
      setSecurityAlerts(securityAlertsWithNames);

      // Process file security with names
      const fileSecurity = fileSecurityResult.status === 'fulfilled' ? fileSecurityResult.value.data || [] : [];
      const fileSecurityWithNames = fileSecurity.map(file => ({
        ...file,
        uploader_email: resolveEmail(file.uploaded_by),
        uploader_name: resolveDisplayName(file.uploaded_by),
        approver_email: file.approved_by ? resolveEmail(file.approved_by) : null,
        approver_name: file.approved_by ? resolveDisplayName(file.approved_by) : null
      }));
      setFileSecurity(fileSecurityWithNames);

      // Process user sessions with names
      const userSessions = userSessionsResult.status === 'fulfilled' ? userSessionsResult.value.data || [] : [];
      const userSessionsWithNames = userSessions.map(session => ({
        ...session,
        user_email: resolveEmail(session.user_id),
        user_name: resolveDisplayName(session.user_id)
      }));
      setUserSessions(userSessionsWithNames);
      const sessionCount = userSessionsWithNames.length;

      // Process rate limits
      const rateLimits = rateLimitsResult.status === 'fulfilled' ? rateLimitsResult.value.data || [] : [];
      setRateLimits(rateLimits);
      const rateLimitViolations = rateLimits.length;

      // Calculate metrics
      const totalLogs = systemLogs.length;
      const securityEvents = securityAlertsWithNames.length;
      const userActionsCount = userActionsWithNames.length;
      const adminActionsCount = adminActionsWithNames.length;
      
      // Calculate system health
      const errorRate = totalLogs > 0 ? (errorLogs.length / totalLogs) * 100 : 0;
      const systemHealth = errorRate > 10 ? 'critical' : errorRate > 5 ? 'warning' : 'healthy';
      
      // Calculate threat level
      const threatScore = (securityAlertsWithNames.filter(a => a.severity === 'critical').length * 3) + (securityAlertsWithNames.filter(a => !a.resolved).length * 2) + rateLimitViolations;
      const threatLevel = threatScore > 20 ? 'critical' : threatScore > 10 ? 'high' : threatScore > 5 ? 'medium' : 'low';
      
      // Calculate response time (simulated)
      const responseTime = Math.random() * 100 + 50;
      
      // Calculate compliance score
      const complianceScore = Math.max(0, 100 - (errorRate * 2) - (securityAlertsWithNames.filter(a => !a.resolved).length * 5));
      
      // Calculate uptime
      const uptime = Math.max(0, 100 - errorRate);
      
      // Calculate security score
      const securityScore = Math.max(0, 100 - (securityAlertsWithNames.filter(a => a.severity === 'critical').length * 10) - (rateLimitViolations * 2));

      // Set metrics
      setMetrics({
        totalLogs,
        criticalAlerts: securityAlertsWithNames.filter(a => a.severity === 'critical').length,
        errors: errorLogs.length,
        warnings: warningLogs.length,
        userActions: userActionsCount,
        adminActions: adminActionsCount,
        activeAlerts: securityAlertsWithNames.filter(a => !a.resolved).length,
        securityEvents,
        uniqueUsers: Array.from(new Set(userActionsWithNames.map(a => a.user_id))).length,
        uniqueIPs: Array.from(new Set(userActionsWithNames.map(a => a.ip_address).filter(Boolean))).length,
        todayEvents: todayLogs.length,
        systemHealth,
        threatLevel,
        responseTime,
        complianceScore,
        uptime,
        blockedAttempts: rateLimitViolations,
        fileUploads: fileSecurityWithNames.length,
        sessionCount,
        rateLimitViolations,
        securityScore
      });

      // Set recent data with user names
      setRecentAlerts(securityAlertsWithNames.slice(0, 5));
      setUserActions(userActionsWithNames.slice(0, 5));
      setAdminActions(adminActionsWithNames.slice(0, 5));
      setFileSecurity(fileSecurityWithNames.slice(0, 5));
      setUserSessions(userSessionsWithNames.slice(0, 5));
      setRateLimits(rateLimits.slice(0, 5));

      // Calculate real trends from the last 7 days
      const trends: SecurityTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        
        const dayAlerts = securityAlertsWithNames.filter(alert => {
          const alertDate = new Date(alert.created_at);
          return alertDate >= date && alertDate < nextDate;
        }).length;
        
        const dayThreats = rateLimits.filter(limit => {
          const limitDate = new Date(limit.created_at);
          return limitDate >= date && limitDate < nextDate;
        }).length;
        
        const dayIncidents = userActionsWithNames.filter(action => {
          const actionDate = new Date(action.timestamp);
          return actionDate >= date && actionDate < nextDate;
        }).length;
        
        trends.push({
          date: date.toISOString().split('T')[0],
          alerts: dayAlerts,
          threats: dayThreats,
          incidents: dayIncidents,
          responseTime: Math.random() * 100 + 50 // Simulated for now
        });
      }
      setSecurityTrends(trends);

      // Calculate real security by category from alerts
      const categoryMap = new Map<string, { incidents: number; severity: string; responseTime: number; resolutionRate: number }>();
      
      securityAlertsWithNames.forEach(alert => {
        const category = alert.category || 'Other';
        const existing = categoryMap.get(category) || { incidents: 0, severity: 'low', responseTime: 0, resolutionRate: 0 };
        
        existing.incidents++;
        existing.responseTime += 120; // Simulated response time
        if (alert.resolved) existing.resolutionRate += 1;
        
        // Determine highest severity
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        const currentSeverity = severityOrder[alert.severity as keyof typeof severityOrder] || 1;
        const existingSeverity = severityOrder[existing.severity as keyof typeof severityOrder] || 1;
        
        if (currentSeverity > existingSeverity) {
          existing.severity = alert.severity;
        }
        
        categoryMap.set(category, existing);
      });
      
      const categories: SecurityByCategory[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        incidents: data.incidents,
        severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
        responseTime: data.responseTime / data.incidents,
        resolutionRate: (data.resolutionRate / data.incidents) * 100
      }));
      setSecurityByCategory(categories);

      // Calculate real top threats from rate limits and alerts
      const threatMap = new Map<string, { count: number; severity: string; lastSeen: string; source: string }>();
      
      // Add rate limit violations as threats
      rateLimits.forEach(limit => {
        const threatType = 'Rate Limit Violation';
        const existing = threatMap.get(threatType) || { count: 0, severity: 'medium', lastSeen: limit.created_at, source: 'API Endpoints' };
        existing.count++;
        threatMap.set(threatType, existing);
      });
      
      // Add security alerts as threats
      securityAlertsWithNames.forEach(alert => {
        const threatType = alert.alert_type || 'Security Alert';
        const existing = threatMap.get(threatType) || { count: 0, severity: alert.severity, lastSeen: alert.created_at, source: alert.source };
        existing.count++;
        threatMap.set(threatType, existing);
      });
      
      const threats: TopThreats[] = Array.from(threatMap.entries()).map(([type, data], index) => ({
        id: (index + 1).toString(),
        type,
        count: data.count,
        severity: data.severity as 'low' | 'medium' | 'high' | 'critical',
        lastSeen: data.lastSeen,
        source: data.source
      }));
      setTopThreats(threats);

    } catch (error) {
      console.error('Failed to load security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Security Dashboard Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Time Range: ${timeRange}`, 20, 55);
      doc.text(`System Health: ${metrics.systemHealth}`, 20, 65);
      doc.text(`Threat Level: ${metrics.threatLevel}`, 20, 75);
      doc.text(`Total Logs: ${metrics.totalLogs}`, 20, 85);
      doc.text(`Critical Alerts: ${metrics.criticalAlerts}`, 20, 95);
      doc.text(`Active Alerts: ${metrics.activeAlerts}`, 20, 105);
      doc.text(`Security Score: ${metrics.securityScore}%`, 20, 115);
      doc.text(`Compliance Score: ${metrics.complianceScore}%`, 20, 125);
      doc.text(`Uptime: ${metrics.uptime}%`, 20, 135);

      let yPosition = 150;
      recentAlerts.slice(0, 10).forEach((alert, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${alert.message}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`Severity: ${alert.severity}`, 25, yPosition + 5);
        doc.text(`Status: ${alert.resolved ? 'Resolved' : 'Active'}`, 25, yPosition + 10);
        doc.text(`Date: ${new Date(alert.created_at).toLocaleString()}`, 25, yPosition + 15);
        yPosition += 25;
      });

      const fileName = `security-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Report Generated",
        description: "Security report has been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate security report",
        variant: "destructive"
      });
    }
  };

  // Handle alert resolution
  const handleResolveAlert = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call the secure API route
      const response = await fetch('/api/admin/resolve-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          alert_id: alertId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to resolve alert",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Alert resolved successfully",
      });

      loadSecurityData();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      });
    }
  };

  // Handle file approval
  const handleApproveFile = async (fileId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call the secure API route
      const response = await fetch('/api/admin/approve-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          file_id: fileId,
          approved: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to approve file",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "File approved successfully",
      });

      loadSecurityData();
    } catch (error) {
      console.error('Failed to approve file:', error);
      toast({
        title: "Error",
        description: "Failed to approve file",
        variant: "destructive"
      });
    }
  };

  // Handle session termination
  const handleTerminateSession = async (sessionId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call the secure API route
      const response = await fetch('/api/admin/terminate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to terminate session",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Session terminated successfully",
      });

      loadSecurityData();
    } catch (error) {
      console.error('Failed to terminate session:', error);
      toast({
        title: "Error",
        description: "Failed to terminate session",
        variant: "destructive"
      });
    }
  };

  // Handle user blocking
  const handleBlockUser = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Get user's current blocked status
      const { data: targetUser } = await supabase.auth.admin.getUserById(userId);
      const isCurrentlyBlocked = targetUser?.user?.user_metadata?.blocked || false;

      // Call the secure API route
      const response = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          blocked: !isCurrentlyBlocked
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to update user status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `User ${result.action} successfully`,
      });

      loadSecurityData();
    } catch (error) {
      console.error('Failed to block user:', error);
      toast({
        title: "Error",
        description: "Failed to block/unblock user",
        variant: "destructive"
      });
    }
  };

  // Handle view alert details
  const handleViewAlert = (alert: SecurityAlert) => {
    setDetailTitle('Security Alert Details');
    setDetailData({
      'Message': alert.message,
      'User': alert.user_name || 'Unknown',
      'Email': alert.user_email || 'Unknown',
      'Severity': alert.severity,
      'IP Address': alert.ip_address || 'Unknown',
      'Created At': new Date(alert.created_at).toLocaleString(),
      'Resolved': alert.resolved ? 'Yes' : 'No'
    });
    setShowDetailModal(true);
  };

  // Handle view user action details
  const handleViewUserAction = (action: UserAction) => {
    // Extract email from details if available
    let email = action.user_email;
    if (!email && action.details && typeof action.details === 'object') {
      email = action.details.email || 'Unknown Email';
    }
    
    // Extract IP from details if not in main field
    let ipAddress = action.ip_address;
    if (!ipAddress && action.details && typeof action.details === 'object') {
      ipAddress = action.details.ip_address || action.details.ip || 'Unknown';
    }
    
    setDetailTitle('User Action Details');
    setDetailData({
      'Action': action.action_type,
      'User': action.user_name,
      'Email': email,
      'IP Address': ipAddress,
      'Timestamp': new Date(action.timestamp).toLocaleString(),
      'Details': typeof action.details === 'object' ? JSON.stringify(action.details, null, 2) : action.details
    });
    setShowDetailModal(true);
  };

  // Handle view user details page
  const handleViewUserDetails = (userId: string) => {
    router.push(`/admin/security/user-details/${userId}`);
  };

  // Handle view file details
  const handleViewFile = (file: FileSecurity) => {
    setDetailTitle('File Upload Details');
    setDetailData({
      'File Name': file.file_path.split('/').pop(),
      'Uploader': file.uploader_name,
      'Email': file.uploader_email,
      'Status': file.is_approved ? 'Approved' : 'Pending',
      'Size (bytes)': file.file_size,
      'Uploaded At': new Date(file.created_at).toLocaleString()
    });
    setShowDetailModal(true);
  };

  // Handle view session details
  const handleViewSession = (session: UserSession) => {
    setDetailTitle('Session Details');
    setDetailData({
      'User': session.user_name,
      'Email': session.user_email,
      'IP Address': session.ip_address || 'Unknown',
      'Device': session.user_agent || 'Unknown',
      'Active': session.is_active ? 'Yes' : 'No',
      'Started': new Date(session.created_at).toLocaleString(),
      'Expires': new Date(session.expires_at).toLocaleString()
    });
    setShowDetailModal(true);
  };

  // Handle view threat details
  const handleViewThreat = (threat: TopThreats) => {
    setDetailTitle('Threat Details');
    setDetailData({
      'Type': threat.type,
      'Occurrences': threat.count,
      'Severity': threat.severity,
      'Source': threat.source,
      'Last Seen': new Date(threat.lastSeen).toLocaleString()
    });
    setShowDetailModal(true);
  };

  // Handle view trend details
  const handleViewTrend = (trend: SecurityTrend) => {
    setDetailTitle('Trend Details');
    setDetailData({
      'Date': trend.date,
      'Alerts': trend.alerts,
      'Threats': trend.threats,
      'Incidents': trend.incidents,
      'Response Time (ms)': trend.responseTime.toFixed(2)
    });
    setShowDetailModal(true);
  };

  const getHealthColor = (health: 'healthy' | 'warning' | 'critical') => {
    switch (health) {
      case 'healthy': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getThreatColor = (threat: 'low' | 'medium' | 'high' | 'critical') => {
    switch (threat) {
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: number, color: string = 'blue', metricType?: string) => (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => metricType && handleMetricClick(metricType)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center mt-2">
              {trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : trend < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-500" />
              )}
              <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600 dark:text-green-400' : trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
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

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading security dashboard...</p>
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
                <Shield className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Security Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Real-time security monitoring, threat detection, and system protection
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button onClick={loadSecurityData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleGenerateReport}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* System Status Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Alert className={getHealthColor(metrics.systemHealth)}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>System Health</AlertTitle>
            <AlertDescription>
              {metrics.systemHealth === 'healthy' && 'All systems are operating normally'}
              {metrics.systemHealth === 'warning' && 'Some issues detected. Monitor closely.'}
              {metrics.systemHealth === 'critical' && 'Critical issues detected. Immediate attention required.'}
            </AlertDescription>
          </Alert>

          <Alert className={getThreatColor(metrics.threatLevel)}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Threat Level</AlertTitle>
            <AlertDescription>
              {metrics.threatLevel === 'low' && 'No immediate threats detected'}
              {metrics.threatLevel === 'medium' && 'Moderate threat level. Enhanced monitoring active.'}
              {metrics.threatLevel === 'high' && 'High threat level. Security measures intensified.'}
              {metrics.threatLevel === 'critical' && 'Critical threat level. Emergency protocols activated.'}
            </AlertDescription>
          </Alert>
        </div>

        {/* Key Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard('Total Logs', metrics.totalLogs, <FileText className="w-6 h-6" />, 12.5, 'blue', 'totalLogs')}
          {getMetricCard('Critical Alerts', metrics.criticalAlerts, <AlertTriangle className="w-6 h-6" />, -5.2, 'red', 'criticalAlerts')}
          {getMetricCard('Active Alerts', metrics.activeAlerts, <AlertCircle className="w-6 h-6" />, 8.7, 'orange', 'activeAlerts')}
          {getMetricCard('Security Events', metrics.securityEvents, <Shield className="w-6 h-6" />, 15.3, 'indigo', 'securityEvents')}
          {getMetricCard('User Actions', metrics.userActions, <Users className="w-6 h-6" />, 22.1, 'green', 'userActions')}
          {getMetricCard('Admin Actions', metrics.adminActions, <Shield className="w-6 h-6" />, 3.4, 'purple', 'adminActions')}
          {getMetricCard('Today\'s Events', metrics.todayEvents, <Clock className="w-6 h-6" />, 18.9, 'cyan', 'todayEvents')}
          {getMetricCard('Unique Users', metrics.uniqueUsers, <Users className="w-6 h-6" />, 7.2, 'emerald', 'uniqueUsers')}
          {getMetricCard('Response Time', `${metrics.responseTime.toFixed(1)}ms`, <Zap className="w-6 h-6" />, -2.1, 'yellow', 'responseTime')}
          {getMetricCard('Compliance Score', `${metrics.complianceScore.toFixed(1)}%`, <CheckCircle className="w-6 h-6" />, 1.5, 'green', 'complianceScore')}
          {getMetricCard('System Uptime', `${metrics.uptime.toFixed(2)}%`, <Server className="w-6 h-6" />, 0.1, 'blue', 'uptime')}
          {getMetricCard('Blocked Attempts', metrics.blockedAttempts, <Lock className="w-6 h-6" />, 25.8, 'red', 'blockedAttempts')}
        </div>

        {/* Enhanced Metric Details Modal with Search and Pagination */}
        {showMetricModal && metricDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {metricDetails.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total: {metricDetails.totalCount} records
                  </p>
                </div>
                <button
                  onClick={() => setShowMetricModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search records..."
                        value={modalSearchTerm}
                        onChange={(e) => setModalSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={modalFilter}
                      onChange={(e) => setModalFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Records</option>
                      {metricDetails.metricType === 'criticalAlerts' && (
                        <>
                          <option value="critical">Critical</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </>
                      )}
                      {metricDetails.metricType === 'userActions' && (
                        <>
                          <option value="login">Login</option>
                          <option value="logout">Logout</option>
                          <option value="upload">Upload</option>
                          <option value="download">Download</option>
                        </>
                      )}
                      {metricDetails.metricType === 'totalLogs' && (
                        <>
                          <option value="error">Error</option>
                          <option value="warn">Warning</option>
                          <option value="info">Info</option>
                          <option value="critical">Critical</option>
                        </>
                      )}
                    </select>
                    <button
                      onClick={() => {
                        setModalSearchTerm('');
                        setModalFilter('');
                        setModalCurrentPage(1);
                      }}
                      className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
                {/* Filtered and Paginated Data */}
                {(() => {
                  let filteredData = metricDetails.data;
                  
                  // Apply search filter
                  if (modalSearchTerm) {
                    filteredData = filteredData.filter((item: any) => {
                      return Object.values(item).some(value => 
                        String(value).toLowerCase().includes(modalSearchTerm.toLowerCase())
                      );
                    });
                  }
                  
                  // Apply type filter
                  if (modalFilter) {
                    filteredData = filteredData.filter((item: any) => {
                      if (metricDetails.metricType === 'criticalAlerts') {
                        return item.severity === modalFilter;
                      } else if (metricDetails.metricType === 'userActions') {
                        return item.action_type === modalFilter;
                      } else if (metricDetails.metricType === 'totalLogs') {
                        return item.level === modalFilter;
                      }
                      return true;
                    });
                  }
                  
                  // Calculate pagination
                  const totalPages = Math.ceil(filteredData.length / 20);
                  const startIndex = (modalCurrentPage - 1) * 20;
                  const endIndex = startIndex + 20;
                  const paginatedData = filteredData.slice(startIndex, endIndex);
                  
                  return (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              {metricDetails.columns.map((column: string) => (
                                <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedData.map((item: any, index: number) => (
                              <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                {metricDetails.columns.map((column: string) => {
                                  let value;
                                  switch (column) {
                                    case 'Timestamp':
                                    case 'Last Action':
                                    case 'Resolved At':
                                    case 'Accessed At':
                                      const dateValue = item.timestamp || item.created_at || item.last_action || item.resolved_at || item.accessed_at;
                                      value = dateValue ? new Date(dateValue).toLocaleString() : 'N/A';
                                      break;
                                    case 'User':
                                    case 'Admin':
                                    case 'Uploader':
                                    case 'Approver':
                                      const userId = item.user_id || item.admin_id || item.uploader_id || item.approver_id;
                                      value = userId ? getUserDisplayName(userId) : 'N/A';
                                      break;
                                    case 'Email':
                                      const userEmail = item.user_id || item.admin_id || item.uploader_id || item.approver_id;
                                      value = userEmail ? getUserEmail(userEmail) : 'N/A';
                                      break;
                                    case 'Action Type':
                                    case 'Action':
                                      value = item.action_type;
                                      break;
                                    case 'Details':
                                      value = typeof item.details === 'object' && item.details !== null
                                        ? JSON.stringify(item.details, null, 2)
                                        : item.details;
                                      break;
                                    case 'Context':
                                      value = typeof item.context === 'object' && item.context !== null
                                        ? JSON.stringify(item.context, null, 2)
                                        : item.context;
                                      break;
                                    case 'File Name':
                                    case 'File':
                                      value = item.file_name || item.file_path;
                                      break;
                                    case 'File Type':
                                      value = item.file_type || item.mime_type;
                                      break;
                                    case 'Status':
                                      value = item.status || (item.resolved ? 'Resolved' : 'Active');
                                      break;
                                    case 'Session ID':
                                      value = item.session_id;
                                      break;
                                    case 'Device':
                                      value = item.device_type || item.user_agent;
                                      break;
                                    case 'IP Address':
                                    case 'IP':
                                      value = item.ip_address;
                                      break;
                                    case 'Threat Level':
                                    case 'Severity':
                                      value = item.threat_level || item.severity;
                                      break;
                                    case 'Resolved':
                                      value = item.resolved ? 'Yes' : 'No';
                                      break;
                                    case 'Resolved By':
                                      value = item.resolved_by ? getUserDisplayName(item.resolved_by) : 'N/A';
                                      break;
                                    case 'File Hash':
                                      value = item.file_hash;
                                      break;
                                    case 'Access Type':
                                      value = item.access_type;
                                      break;
                                    case 'Rate Limit Type':
                                      value = item.limit_type;
                                      break;
                                    case 'Count':
                                    case 'Action Count':
                                    case 'Log Count':
                                    case 'Total Activity':
                                      value = item.count || item.action_count || item.log_count || item.total_activity;
                                      break;
                                    case 'Blocked':
                                      value = item.blocked ? 'Yes' : 'No';
                                      break;
                                    case 'Message':
                                      value = item.message;
                                      break;
                                    case 'Module':
                                      value = item.module;
                                      break;
                                    case 'Level':
                                      value = item.level;
                                      break;
                                    case 'Target':
                                      value = item.target_type || item.target_id;
                                      break;
                                    case 'Endpoint':
                                      value = item.endpoint;
                                      break;
                                    case 'Reason':
                                      value = item.reason;
                                      break;
                                    case 'Role':
                                      const roleId = item.user_id || item.admin_id || item.uploader_id || item.approver_id;
                                      value = roleId ? getUserRole(roleId) : 'N/A';
                                      break;
                                    default:
                                      const rawValue = item[column.toLowerCase().replace(/\s/g, '_')] || item[column.toLowerCase()] || item[column];
                                      value = typeof rawValue === 'object' && rawValue !== null
                                        ? JSON.stringify(rawValue, null, 2)
                                        : rawValue;
                                  }
                                  return (
                                    <td key={column} className="py-2 px-4 text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-xs">
                                      {value || 'N/A'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setModalCurrentPage(Math.max(1, modalCurrentPage - 1))}
                              disabled={modalCurrentPage === 1}
                              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Previous
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                              Page {modalCurrentPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setModalCurrentPage(Math.min(totalPages, modalCurrentPage + 1))}
                              disabled={modalCurrentPage === totalPages}
                              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* No Results */}
                      {filteredData.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">No records found matching your criteria.</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Recent Security Alerts */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Recent Security Alerts
                </CardTitle>
                <CardDescription>Latest security alerts and threats detected by the system.</CardDescription>
              </div>
              <Link href="/admin/security/audit-logs/detail">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`}></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {alert.user_name || 'Unknown User'} • {new Date(alert.created_at).toLocaleDateString()}, {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">IP: {alert.ip_address || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'default' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAlert(alert)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!alert.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent User Activity */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Recent User Activity
                </CardTitle>
                <CardDescription>Latest user actions and system interactions.</CardDescription>
              </div>
              <Link href="/admin/security/access-control/detail">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{action.action_type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <button 
                          onClick={() => handleViewUserDetails(action.user_id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          {action.user_name}
                        </button>
                        {' • '}
                        {new Date(action.timestamp).toLocaleDateString()}, {new Date(action.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">IP: {action.ip_address || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewUserAction(action)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlockUser(action.user_id)}
                    >
                      {action.user_metadata?.blocked ? 'Unblock' : 'Block'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* File Security */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-500" />
                  File Security
                </CardTitle>
                <CardDescription>Recent file uploads and security status.</CardDescription>
              </div>
              <Link href="/admin/security/document-access/detail">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fileSecurity.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{file.file_path.split('/').pop()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {file.uploader_name} • {new Date(file.created_at).toLocaleDateString()}, {new Date(file.created_at).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email: {file.uploader_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={file.is_approved ? 'default' : 'secondary'}>
                      {file.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFile(file)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!file.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproveFile(file.id)}
                      >
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Currently active user sessions.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadSecurityData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userSessions.length > 0 ? (
              <div className="space-y-4">
                {userSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{session.user_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.user_email} • {new Date(session.created_at).toLocaleDateString()}, {new Date(session.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">IP: {session.ip_address || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.is_active ? 'default' : 'secondary'}>
                        {session.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewSession(session)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {session.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No active sessions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Threats */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Top Threats
            </CardTitle>
            <CardDescription>Most common security threats and patterns.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topThreats.map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{threat.type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {threat.count} occurrences • {threat.source}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last seen: {new Date(threat.lastSeen).toLocaleDateString()}, {new Date(threat.lastSeen).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={threat.severity === 'critical' ? 'destructive' : threat.severity === 'high' ? 'default' : 'secondary'}>
                      {threat.severity}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewThreat(threat)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Trends */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Security Trends
            </CardTitle>
            <CardDescription>Security metrics over the selected time period.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleViewTrend(trend)}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{trend.date}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {trend.alerts} alerts, {trend.threats} threats
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{trend.responseTime}ms</span>
                    {getTrendIcon(trend.alerts + trend.threats)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Generic Detail Modal */}
      {showDetailModal && detailData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{detailTitle}</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
              {Object.entries(detailData).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{key}</span>
                  <span className="text-right break-all text-gray-900 dark:text-gray-100 flex-1">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 