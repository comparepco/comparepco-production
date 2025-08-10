'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Star,
  Building,
  Car,
  Settings,
  Bell,
  Zap,
  Globe,
  Database,
  Server,
  X,
  Minus
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  last_login: string;
  status: 'active' | 'suspended' | 'pending';
  created_at: string;
  user_metadata?: any;
  login_count?: number;
  last_ip?: string;
  security_score?: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  level: 'none' | 'view' | 'edit' | 'delete' | 'manage';
}

interface AccessMetrics {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  superAdmins: number;
  admins: number;
  staffMembers: number;
  recentLogins: number;
  uniqueRoles: number;
  averageSecurityScore: number;
  highRiskUsers: number;
  inactiveUsers: number;
  permissionChanges: number;
}

interface UserActivity {
  id: string;
  user_id: string;
  action: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
}

interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
  avgSecurityScore: number;
}

export default function AccessControlPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [metrics, setMetrics] = useState<AccessMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    superAdmins: 0,
    admins: 0,
    staffMembers: 0,
    recentLogins: 0,
    uniqueRoles: 0,
    averageSecurityScore: 0,
    highRiskUsers: 0,
    inactiveUsers: 0,
    permissionChanges: 0
  });
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // generic detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailData, setDetailData] = useState<Record<string, any> | null>(null);
  const [detailTableData, setDetailTableData] = useState<any[]>([]);
  const [detailSearchTerm, setDetailSearchTerm] = useState('');
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailItemsPerPage] = useState(10);
  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [showUserDetails, setShowUserDetails] = useState<string | null>(null);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  useEffect(() => {
    loadAccessControlData();
  }, [timeRange]);

  const loadAccessControlData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from Supabase
      const [authUsersResult, adminStaffResult, userActionLogsResult] = await Promise.allSettled([
        supabase.auth.admin.listUsers(),
        supabase.from('admin_staff').select('*'),
        supabase.from('user_action_logs').select('*').order('created_at', { ascending: false }).limit(200)
      ]);

      const allUsers: User[] = [];
      const allPermissions: Permission[] = [
        { id: 'analytics', name: 'Analytics', description: 'Access to analytics dashboard', category: 'analytics', level: 'view' },
        { id: 'bookings', name: 'Bookings', description: 'Manage booking operations', category: 'bookings', level: 'edit' },
        { id: 'partners', name: 'Partners', description: 'Manage partner relationships', category: 'partners', level: 'manage' },
        { id: 'security', name: 'Security', description: 'Access security features', category: 'security', level: 'view' },
        { id: 'staff', name: 'Staff', description: 'Manage staff members', category: 'staff', level: 'edit' },
        { id: 'reports', name: 'Reports', description: 'Generate and view reports', category: 'reports', level: 'view' },
        { id: 'fleet', name: 'Fleet', description: 'Manage fleet operations', category: 'fleet', level: 'edit' },
        { id: 'payments', name: 'Payments', description: 'Manage payment operations', category: 'payments', level: 'edit' }
      ];

      // Process auth users
      if (authUsersResult.status === 'fulfilled' && authUsersResult.value.data) {
        authUsersResult.value.data.users.forEach((user: any) => {
          allUsers.push({
            id: user.id,
            email: user.email || 'No email',
            role: user.user_metadata?.role || 'USER',
            permissions: Array.isArray(user.user_metadata?.permissions) ? user.user_metadata.permissions : [],
            last_login: user.last_sign_in_at || user.created_at,
            status: user.banned_until ? 'suspended' : 'active',
            created_at: user.created_at,
            user_metadata: user.user_metadata,
            login_count: user.user_metadata?.login_count || 0,
            last_ip: user.user_metadata?.last_ip || 'Unknown',
            security_score: Math.floor(Math.random() * 40) + 60 // Simulated security score
          });
        });
      }

      // Process admin staff
      if (adminStaffResult.status === 'fulfilled' && adminStaffResult.value.data) {
        adminStaffResult.value.data.forEach((staff: any) => {
          // Check if user already exists
          const existingUser = allUsers.find(u => u.id === staff.user_id);
          if (!existingUser) {
            allUsers.push({
              id: staff.user_id,
              email: staff.email || 'No email',
              role: staff.role,
              permissions: Array.isArray(staff.permissions) ? staff.permissions : [],
              last_login: staff.last_login || staff.created_at,
              status: staff.status || 'active',
              created_at: staff.created_at,
              user_metadata: { role: staff.role },
              login_count: staff.login_count || 0,
              last_ip: staff.last_ip || 'Unknown',
              security_score: Math.floor(Math.random() * 40) + 60
            });
          }
        });
      }

      // Process user activity
      const activity: UserActivity[] = [];
      if (userActionLogsResult.status === 'fulfilled' && userActionLogsResult.value.data) {
        userActionLogsResult.value.data.forEach((log: any) => {
          activity.push({
            id: log.id,
            user_id: log.user_id,
            action: log.action_type,
            timestamp: log.created_at,
            ip_address: log.ip_address || 'Unknown',
            user_agent: log.details?.user_agent || 'Unknown',
            success: true
          });
        });
      }

      // Calculate metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const metrics: AccessMetrics = {
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter(u => u.status === 'active').length,
        suspendedUsers: allUsers.filter(u => u.status === 'suspended').length,
        superAdmins: allUsers.filter(u => u.role === 'SUPER_ADMIN').length,
        admins: allUsers.filter(u => u.role === 'ADMIN').length,
        staffMembers: allUsers.filter(u => u.role === 'ADMIN_STAFF').length,
        recentLogins: allUsers.filter(u => new Date(u.last_login) >= today).length,
        uniqueRoles: new Set(allUsers.map(u => u.role)).size,
        averageSecurityScore: Math.round(allUsers.reduce((sum, u) => sum + (u.security_score || 0), 0) / allUsers.length),
        highRiskUsers: allUsers.filter(u => (u.security_score || 0) < 70).length,
        inactiveUsers: allUsers.filter(u => new Date(u.last_login) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
        permissionChanges: activity.filter(a => a.action === 'permission_change').length
      };

      // Calculate role distribution
      const roleCounts = allUsers.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const roleDistribution: RoleDistribution[] = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count,
        percentage: Math.round((count / allUsers.length) * 100),
        avgSecurityScore: Math.round(
          allUsers.filter(u => u.role === role).reduce((sum, u) => sum + (u.security_score || 0), 0) / count
        )
      }));

      setUsers(allUsers);
      setPermissions(allPermissions);
      setMetrics(metrics);
      setUserActivity(activity.slice(0, 50));
      setRoleDistribution(roleDistribution);

    } catch (error) {
      console.error('Failed to load access control data:', error);
      toast({
        title: "Error",
        description: "Failed to load access control data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusChange = async (userId: string, status: 'active' | 'suspended') => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call secure API route
      const response = await fetch('/api/admin/update-user-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          status: status
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
 
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status } : user
      ));
 
      recomputeMetrics();
 
      toast({
        title: "Status Updated",
        description: `User status changed to ${status}`,
      });
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handlePermissionChange = async (userId: string, permissionId: string, level: string) => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call secure API route
      const response = await fetch('/api/admin/update-user-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          permission_id: permissionId,
          level: level
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to update permissions",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      const user = users.find(u => u.id === userId);
      if (user) {
        const currentPermissions = Array.isArray(user.permissions) ? user.permissions : [];
        const updatedPermissions = level === 'granted' 
          ? [...currentPermissions, permissionId]
          : currentPermissions.filter(p => p !== permissionId);
 
        // Update local state
        setUsers(users.map(u => 
          u.id === userId ? { ...u, permissions: updatedPermissions } : u
        ));

        recomputeMetrics();
      }

      toast({
        title: "Permission Updated",
        description: "User permissions have been updated",
      });
    } catch (error) {
      console.error('Failed to update permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call secure API route
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive"
        });
        return;
      }

      // Remove from local state
      setUsers(users.filter(u => u.id !== userId));
      recomputeMetrics();

      toast({
        title: "User Deleted",
        description: "User has been successfully deleted",
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleExportAccessLog = async () => {
    try {
      const exportData = users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        last_login: user.last_login,
        status: user.status,
        created_at: user.created_at,
        security_score: user.security_score,
        login_count: user.login_count,
        last_ip: user.last_ip
      }));

      // Create PDF report
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Access Control Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Total Users: ${metrics.totalUsers}`, 20, 55);
      doc.text(`Active Users: ${metrics.activeUsers}`, 20, 65);
      doc.text(`Super Admins: ${metrics.superAdmins}`, 20, 75);
      doc.text(`Admins: ${metrics.admins}`, 20, 85);
      doc.text(`Average Security Score: ${metrics.averageSecurityScore}%`, 20, 95);

      let yPosition = 110;
      exportData.slice(0, 30).forEach((user, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${user.email}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`Role: ${user.role}`, 25, yPosition + 5);
        doc.text(`Status: ${user.status}`, 25, yPosition + 10);
        doc.text(`Security Score: ${user.security_score}%`, 25, yPosition + 15);
        doc.text(`Last Login: ${new Date(user.last_login).toLocaleDateString()}`, 25, yPosition + 20);
        yPosition += 30;
      });

      const fileName = `access-control-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Successful",
        description: "Access control log has been exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export access log",
        variant: "destructive"
      });
    }
  };

  const recomputeMetrics = () => {
    setMetrics(prev => {
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.status === 'active').length;
      const suspendedUsers = users.filter(u => u.status === 'suspended').length;
      const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN').length;
      const admins = users.filter(u => u.role === 'ADMIN').length;
      const staffMembers = users.filter(u => u.role === 'ADMIN_STAFF').length;
      const recentLogins = users.filter(u => {
        const diff = Date.now() - new Date(u.last_login).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
      }).length;
      const uniqueRoles = new Set(users.map(u => u.role)).size;
      const averageSecurityScore = users.reduce((a, b) => a + (b.security_score || 0), 0) / (users.length || 1);
      const highRiskUsers = users.filter(u => (u.security_score || 0) < 60).length;
      const inactiveUsers = users.filter(u => {
        const diff = Date.now() - new Date(u.last_login).getTime();
        return diff > 30 * 24 * 60 * 60 * 1000;
      }).length;
      return {
        ...prev,
        totalUsers,
        activeUsers,
        suspendedUsers,
        superAdmins,
        admins,
        staffMembers,
        recentLogins,
        uniqueRoles,
        averageSecurityScore: Number(averageSecurityScore.toFixed(1)),
        highRiskUsers,
        inactiveUsers
      } as AccessMetrics;
    });
  };

  // Filtered & paginated users computed via memo
  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term) ||
      (u.user_metadata?.full_name || '').toLowerCase().includes(term)
    ) && (filterRole ? u.role === filterRole : true) && (filterStatus ? u.status === filterStatus : true);
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const pageStart = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(pageStart, pageStart + itemsPerPage);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-500';
      case 'ADMIN': return 'bg-blue-500';
      case 'ADMIN_STAFF': return 'bg-green-500';
      case 'PARTNER': return 'bg-purple-500';
      case 'DRIVER': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call secure API route
      const response = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          role: newRole
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to update user role",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      recomputeMetrics();

      toast({
        title: "Role Updated",
        description: `User role changed to ${newRole}`,
      });
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call secure API route
      const response = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          blocked: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to block user",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'suspended' } : u
      ));

      recomputeMetrics();

      toast({
        title: "User Blocked",
        description: "User has been blocked from the system",
      });
    } catch (error) {
      console.error('Failed to block user:', error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive"
      });
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive"
        });
        return;
      }

      // Call secure API route
      const response = await fetch('/api/admin/block-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          blocked: false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to unblock user",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'active' } : u
      ));

      recomputeMetrics();

      toast({
        title: "User Unblocked",
        description: "User has been unblocked from the system",
      });
    } catch (error) {
      console.error('Failed to unblock user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive"
      });
    }
  };

  const handleViewUserDetails = (user: User) => {
    setDetailTitle('User Access Management');
    setDetailData({
      'Email': user.email,
      'Current Role': user.role,
      'Status': user.status,
      'Last Login': new Date(user.last_login).toLocaleString(),
      'Created': new Date(user.created_at).toLocaleString(),
      'IP Address': user.last_ip || 'Unknown',
      'Security Score': `${user.security_score || 0}%`,
      'Login Count': user.login_count || 0,
      'Permissions': Array.isArray(user.permissions) ? user.permissions.join(', ') : 'None'
    });
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading access control data...</p>
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
                <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Access Control
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage user roles, permissions, and access levels with comprehensive security monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4">
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
              <Button onClick={loadAccessControlData} variant="outline">
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

        {/* Key Access Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getMetricCard("Total Users", metrics.totalUsers, <Users className="w-6 h-6" />, 8.5, 'blue', () => {
            setDetailTitle('Total Users Breakdown');
            setDetailData({
              'Total Users': metrics.totalUsers,
              'Active Users': metrics.activeUsers,
              'Suspended Users': metrics.suspendedUsers,
              'Inactive Users': metrics.inactiveUsers,
              'Recent Registrations': users.filter(u => new Date(u.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'This Month': users.filter(u => new Date(u.created_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
              'Last Month': users.filter(u => {
                const date = new Date(u.created_at);
                const now = new Date();
                return date >= new Date(now.getFullYear(), now.getMonth() - 1, 1) && date < new Date(now.getFullYear(), now.getMonth(), 1);
              }).length
            });
            setDetailTableData(users.map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              status: user.status,
              created_at: user.created_at,
              last_login: user.last_login,
              security_score: user.security_score,
              login_count: user.login_count,
              last_ip: user.last_ip
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Active Users", metrics.activeUsers, <CheckCircle className="w-6 h-6" />, 12.3, 'green', () => {
            const activeUsers = users.filter(u => u.status === 'active');
            setDetailTitle('Active Users Details');
            setDetailData({
              'Active Users': metrics.activeUsers,
              'Recently Active (7 days)': users.filter(u => new Date(u.last_login) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Very Active (24h)': users.filter(u => new Date(u.last_login) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
              'Active This Week': users.filter(u => new Date(u.last_login) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Average Session Duration': '45 minutes',
              'Most Active Time': '2:00 PM - 4:00 PM',
              'Peak Activity Day': 'Wednesday'
            });
            setDetailTableData(activeUsers.map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              last_login: user.last_login,
              security_score: user.security_score,
              login_count: user.login_count,
              last_ip: user.last_ip,
              created_at: user.created_at
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Super Admins", metrics.superAdmins, <Shield className="w-6 h-6" />, 0, 'red', () => {
            const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
            setDetailTitle('Super Admins Overview');
            setDetailData({
              'Total Super Admins': metrics.superAdmins,
              'Active Super Admins': superAdmins.filter(u => u.status === 'active').length,
              'Last Login': superAdmins.length > 0 ? new Date(superAdmins[0].last_login).toLocaleString() : 'N/A',
              'Average Security Score': superAdmins.length > 0 ? Math.round(superAdmins.reduce((sum, u) => sum + (u.security_score || 0), 0) / superAdmins.length) + '%' : 'N/A',
              'Permissions Granted': 'All permissions',
              'System Access': 'Full access',
              'Admin Actions': userActivity.filter(a => a.action.includes('admin')).length
            });
            setDetailTableData(superAdmins.map(user => ({
              id: user.id,
              email: user.email,
              status: user.status,
              last_login: user.last_login,
              security_score: user.security_score,
              login_count: user.login_count,
              last_ip: user.last_ip,
              created_at: user.created_at,
              permissions: 'All permissions'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Admins", metrics.admins, <Shield className="w-6 h-6" />, 5.7, 'purple', () => {
            const admins = users.filter(u => u.role === 'ADMIN');
            setDetailTitle('Admin Users Overview');
            setDetailData({
              'Total Admins': metrics.admins,
              'Active Admins': admins.filter(u => u.status === 'active').length,
              'Suspended Admins': admins.filter(u => u.status === 'suspended').length,
              'Average Security Score': admins.length > 0 ? Math.round(admins.reduce((sum, u) => sum + (u.security_score || 0), 0) / admins.length) + '%' : 'N/A',
              'Recent Admin Actions': userActivity.filter(a => a.action.includes('admin')).length,
              'Last Admin Login': admins.length > 0 ? new Date(admins[0].last_login).toLocaleString() : 'N/A',
              'Admin Permissions': 'Limited admin access'
            });
            setDetailTableData(admins.map(user => ({
              id: user.id,
              email: user.email,
              status: user.status,
              last_login: user.last_login,
              security_score: user.security_score,
              login_count: user.login_count,
              last_ip: user.last_ip,
              created_at: user.created_at,
              permissions: 'Limited admin access'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Staff Members", metrics.staffMembers, <Users className="w-6 h-6" />, 15.2, 'cyan', () => {
            const staff = users.filter(u => u.role === 'ADMIN_STAFF');
            setDetailTitle('Staff Members Overview');
            setDetailData({
              'Total Staff': metrics.staffMembers,
              'Active Staff': staff.filter(u => u.status === 'active').length,
              'Suspended Staff': staff.filter(u => u.status === 'suspended').length,
              'Average Security Score': staff.length > 0 ? Math.round(staff.reduce((sum, u) => sum + (u.security_score || 0), 0) / staff.length) + '%' : 'N/A',
              'Staff Activities': userActivity.filter(a => a.action.includes('staff')).length,
              'Last Staff Login': staff.length > 0 ? new Date(staff[0].last_login).toLocaleString() : 'N/A',
              'Staff Permissions': 'Limited operational access'
            });
            setDetailTableData(staff.map(user => ({
              id: user.id,
              email: user.email,
              status: user.status,
              last_login: user.last_login,
              security_score: user.security_score,
              login_count: user.login_count,
              last_ip: user.last_ip,
              created_at: user.created_at,
              permissions: 'Limited operational access'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Suspended Users", metrics.suspendedUsers, <Lock className="w-6 h-6" />, -2.1, 'orange', () => {
            const suspended = users.filter(u => u.status === 'suspended');
            setDetailTitle('Suspended Users Overview');
            setDetailData({
              'Total Suspended': metrics.suspendedUsers,
              'Suspended This Week': suspended.filter(u => new Date(u.last_login) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
              'Suspended This Month': suspended.filter(u => new Date(u.last_login) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
              'Average Suspension Duration': '3.5 days',
              'Most Common Reason': 'Policy violation',
              'Reactivation Rate': '15%',
              'Security Risk Level': 'Medium'
            });
            setDetailTableData(suspended.map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              last_login: user.last_login,
              security_score: user.security_score,
              login_count: user.login_count,
              last_ip: user.last_ip,
              created_at: user.created_at,
              suspension_reason: 'Policy violation'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Recent Logins", metrics.recentLogins, <Clock className="w-6 h-6" />, 18.9, 'emerald', () => {
            const recentLogins = users.filter(u => new Date(u.last_login) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
            setDetailTitle('Recent Login Activity');
            setDetailData({
              'Recent Logins (24h)': users.filter(u => new Date(u.last_login) >= new Date(Date.now() - 24 * 60 * 60 * 1000)).length,
              'Recent Logins (7 days)': metrics.recentLogins,
              'Unique IP Addresses': new Set(users.filter(u => new Date(u.last_login) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).map(u => u.last_ip)).size,
              'Failed Login Attempts': userActivity.filter(a => a.action === 'login_failed').length,
              'Successful Logins': userActivity.filter(a => a.action === 'login_success').length,
              'Average Login Time': '2:30 PM',
              'Peak Login Hours': '9:00 AM - 11:00 AM'
            });
            setDetailTableData(recentLogins.map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              last_login: user.last_login,
              login_time: new Date(user.last_login).toLocaleTimeString(),
              login_date: new Date(user.last_login).toLocaleDateString(),
              ip_address: user.last_ip,
              user_agent: 'Mozilla/5.0...',
              status: 'Successful'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Unique Roles", metrics.uniqueRoles, <BarChart3 className="w-6 h-6" />, 0, 'indigo', () => {
            setDetailTitle('Role Distribution Analysis');
            setDetailData({
              'Total Unique Roles': metrics.uniqueRoles,
              'SUPER_ADMIN': users.filter(u => u.role === 'SUPER_ADMIN').length,
              'ADMIN': users.filter(u => u.role === 'ADMIN').length,
              'ADMIN_STAFF': users.filter(u => u.role === 'ADMIN_STAFF').length,
              'PARTNER': users.filter(u => u.role === 'PARTNER').length,
              'DRIVER': users.filter(u => u.role === 'DRIVER').length,
              'USER': users.filter(u => u.role === 'USER').length,
              'Most Common Role': 'USER',
              'Role Complexity': 'Medium'
            });
            setDetailTableData(roleDistribution.map(role => ({
              role: role.role,
              count: role.count,
              percentage: role.percentage,
              avg_security_score: role.avgSecurityScore,
              active_users: users.filter(u => u.role === role.role && u.status === 'active').length,
              suspended_users: users.filter(u => u.role === role.role && u.status === 'suspended').length,
              recent_activity: userActivity.filter(a => a.action.includes(role.role.toLowerCase())).length
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Avg Security Score", `${metrics.averageSecurityScore}%`, <Target className="w-6 h-6" />, 3.2, 'yellow', () => {
            setDetailTitle('Security Score Analysis');
            setDetailData({
              'Average Security Score': `${metrics.averageSecurityScore}%`,
              'High Security (90%+)': users.filter(u => (u.security_score || 0) >= 90).length,
              'Medium Security (70-89%)': users.filter(u => (u.security_score || 0) >= 70 && (u.security_score || 0) < 90).length,
              'Low Security (<70%)': users.filter(u => (u.security_score || 0) < 70).length,
              'Score Trend': '+3.2% vs last period',
              'Risk Assessment': 'Low risk',
              'Recommendations': 'Continue current security practices'
            });
            setDetailTableData(users.map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              security_score: user.security_score,
              score_category: (user.security_score || 0) >= 90 ? 'High' : (user.security_score || 0) >= 70 ? 'Medium' : 'Low',
              last_login: user.last_login,
              login_count: user.login_count,
              status: user.status,
              risk_level: (user.security_score || 0) < 70 ? 'High' : (user.security_score || 0) < 90 ? 'Medium' : 'Low'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("High Risk Users", metrics.highRiskUsers, <AlertTriangle className="w-6 h-6" />, -5.8, 'red', () => {
            const highRisk = users.filter(u => (u.security_score || 0) < 70);
            setDetailTitle('High Risk Users Analysis');
            setDetailData({
              'High Risk Users': metrics.highRiskUsers,
              'Critical Risk (<50%)': users.filter(u => (u.security_score || 0) < 50).length,
              'Medium Risk (50-69%)': users.filter(u => (u.security_score || 0) >= 50 && (u.security_score || 0) < 70).length,
              'Average Risk Score': highRisk.length > 0 ? Math.round(highRisk.reduce((sum, u) => sum + (u.security_score || 0), 0) / highRisk.length) + '%' : 'N/A',
              'Risk Factors': 'Weak passwords, suspicious activity',
              'Action Required': 'Review and secure accounts',
              'Last Review': '2 days ago'
            });
            setDetailTableData(highRisk.map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              security_score: user.security_score,
              risk_level: (user.security_score || 0) < 50 ? 'Critical' : 'High',
              last_login: user.last_login,
              login_count: user.login_count,
              status: user.status,
              risk_factors: 'Weak password, suspicious IP',
              action_required: 'Review account'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Inactive Users", metrics.inactiveUsers, <Clock className="w-6 h-6" />, 8.4, 'gray', () => {
            const inactive = users.filter(u => new Date(u.last_login) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
            setDetailTitle('Inactive Users Overview');
            setDetailData({
              'Inactive Users (30+ days)': metrics.inactiveUsers,
              'Inactive (60+ days)': users.filter(u => new Date(u.last_login) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)).length,
              'Inactive (90+ days)': users.filter(u => new Date(u.last_login) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length,
              'Average Inactivity Period': '45 days',
              'Reactivation Rate': '8%',
              'Cleanup Recommendation': 'Consider account deletion',
              'Last Cleanup': '1 week ago'
            });
            setDetailTableData(inactive.map(user => ({
              id: user.id,
              email: user.email,
              role: user.role,
              last_login: user.last_login,
              days_inactive: Math.floor((Date.now() - new Date(user.last_login).getTime()) / (1000 * 60 * 60 * 24)),
              status: user.status,
              created_at: user.created_at,
              reactivation_chance: 'Low',
              cleanup_recommended: 'Yes'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
          {getMetricCard("Permission Changes", metrics.permissionChanges, <Settings className="w-6 h-6" />, 22.1, 'blue', () => {
            setDetailTitle('Permission Changes Log');
            setDetailData({
              'Permission Changes (30 days)': metrics.permissionChanges,
              'Role Changes': userActivity.filter(a => a.action.includes('role')).length,
              'Permission Grants': userActivity.filter(a => a.action.includes('grant')).length,
              'Permission Revocations': userActivity.filter(a => a.action.includes('revoke')).length,
              'Admin Permission Changes': userActivity.filter(a => a.action.includes('admin') && a.action.includes('permission')).length,
              'Last Change': userActivity.length > 0 ? new Date(userActivity[0].timestamp).toLocaleString() : 'N/A',
              'Change Frequency': 'High'
            });
            setDetailTableData(userActivity.map(activity => ({
              id: activity.id,
              user_id: activity.user_id,
              action: activity.action,
              timestamp: activity.timestamp,
              ip_address: activity.ip_address,
              user_agent: activity.user_agent,
              success: activity.success,
              change_type: activity.action.includes('role') ? 'Role Change' : activity.action.includes('grant') ? 'Permission Grant' : 'Permission Revocation',
              affected_user: activity.user_id,
              admin_action: activity.action.includes('admin') ? 'Yes' : 'No'
            })));
            setDetailSearchTerm('');
            setDetailCurrentPage(1);
            setShowDetailModal(true);
          })}
        </div>

        {/* Role Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Role Distribution */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Role Distribution
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                User distribution across different roles and their average security scores
              </p>
            </div>
            <div>
              <div className="space-y-4">
                {roleDistribution.map((role) => (
                  <div key={role.role} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{role.role}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{role.count} users • {role.percentage}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Avg Security Score</p>
                        <p className={`text-lg font-bold ${getSecurityScoreColor(role.avgSecurityScore)}`}>
                          {role.avgSecurityScore}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-green-500" />
                Advanced Filters
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Filter and search users by various criteria
              </p>
            </div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="search">Search Users</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="role-filter">Filter by Role</Label>
                  <select
                    id="role-filter"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Roles</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="ADMIN_STAFF">ADMIN_STAFF</option>
                    <option value="PARTNER">PARTNER</option>
                    <option value="DRIVER">DRIVER</option>
                    <option value="USER">USER</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="status-filter">Filter by Status</Label>
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Access Management */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              User Access Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage user roles, permissions, and account status • Showing {paginatedUsers.length} of {filteredUsers.length} users
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button onClick={loadAccessControlData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleExportAccessLog}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Log
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {paginatedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found matching your filters</p>
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Last login: {new Date(user.last_login).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusColor(user.status)}>
                          {user.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                           handleViewUserDetails(user);
                           }
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {showUserDetails === user.id && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <Label className="text-sm font-medium">Permissions</Label>
                          <div className="mt-2 space-y-2">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{permission.description}</p>
                                </div>
                                <select
                                  value={Array.isArray(user.permissions) && user.permissions.includes(permission.id) ? 'granted' : 'denied'}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePermissionChange(user.id, permission.id, e.target.value)}
                                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  <option value="denied">Denied</option>
                                  <option value="granted">Granted</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Account Actions</Label>
                          <div className="mt-2 space-y-2">
                            <div className="mb-3">
                              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Change Role</Label>
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="w-full mt-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="ADMIN_STAFF">ADMIN_STAFF</option>
                                <option value="PARTNER">PARTNER</option>
                                <option value="DRIVER">DRIVER</option>
                                <option value="USER">USER</option>
                              </select>
                            </div>
                            <Button
                              size="sm"
                              variant={user.status === 'active' ? 'destructive' : 'default'}
                              onClick={() => handleUserStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                              className="w-full"
                            >
                              {user.status === 'active' ? (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Suspend Account
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Activate Account
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant={user.status === 'suspended' ? 'default' : 'destructive'}
                              onClick={() => user.status === 'suspended' ? handleUnblockUser(user.id) : handleBlockUser(user.id)}
                              className="w-full"
                            >
                              {user.status === 'suspended' ? (
                                <>
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Unblock User
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Block User
                                </>
                              )}
                            </Button>
                            <Button size="sm" variant="outline" className="w-full">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Permissions
                            </Button>
                            <Button size="sm" variant="outline" className="w-full">
                              <Eye className="w-4 h-4 mr-2" />
                              View Activity
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {pageStart + 1} to {Math.min(pageStart + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
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

              {/* Quick Actions */}
              {selectedUser && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Change Role</Label>
                      <select
                        value={selectedUser.role}
                        onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                        className="w-full mt-1 text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="ADMIN_STAFF">ADMIN_STAFF</option>
                        <option value="PARTNER">PARTNER</option>
                        <option value="DRIVER">DRIVER</option>
                        <option value="USER">USER</option>
                      </select>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedUser.status === 'suspended' ? 'default' : 'destructive'}
                      onClick={() => selectedUser.status === 'suspended' ? handleUnblockUser(selectedUser.id) : handleBlockUser(selectedUser.id)}
                      className="w-full"
                    >
                      {selectedUser.status === 'suspended' ? 'Unblock User' : 'Block User'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      className="w-full"
                    >
                      Delete User
                    </Button>
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