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
  Eye, 
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Activity,
  Clock,
  Globe,
  Mail,
  Phone,
  Calendar,
  Settings,
  Key
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import Link from 'next/link';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  is_active?: boolean;
  security_role?: string;
  last_security_training?: string;
  security_permissions?: any;
  display_name?: string;
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
}

export default function AccessControlDetailPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);

  useEffect(() => {
    loadAccessControlData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadAccessControlData = async () => {
    try {
      setLoading(true);
      
      // Get all users
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

      // Get user actions
      const { data: userActionsData } = await supabase
        .from('user_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      const userActionsWithNames = userActionsData?.map(action => ({
        ...action,
        user_email: userMap.get(action.user_id)?.email || 'Unknown User',
        user_name: getUserDisplayName(action.user_id)
      })) || [];

      // Merge user data with admin staff data
      const usersWithRoles = users.map(user => {
        const adminStaffData = adminStaffMap.get(user.id);
        return {
          ...user,
          role: adminStaffData?.role || 'user',
          is_active: adminStaffData?.is_active ?? true,
          security_role: adminStaffData?.security_role || 'basic',
          last_security_training: adminStaffData?.last_security_training,
          security_permissions: adminStaffData?.security_permissions || {},
          display_name: getUserDisplayName(user.id)
        };
      });

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
      setUserActions(userActionsWithNames);

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

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (filterRole) {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(user => 
        filterStatus === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('admin_staff')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh data
      loadAccessControlData();

      toast({
        title: "User Blocked",
        description: "User has been blocked from the system",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive"
      });
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('admin_staff')
        .update({ is_active: true })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh data
      loadAccessControlData();

      toast({
        title: "User Unblocked",
        description: "User has been unblocked",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive"
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('admin_staff')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh data
      loadAccessControlData();

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      const exportData = filteredUsers.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'N/A',
        role: user.role,
        is_active: user.is_active,
        security_role: user.security_role,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
      }));

      // Create PDF
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Access Control Report', 20, 30);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      doc.text(`Total Users: ${exportData.length}`, 20, 55);

      let yPosition = 70;
      exportData.slice(0, 50).forEach((user, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${user.full_name}`, 20, yPosition);
        doc.setFontSize(8);
        doc.text(`Email: ${user.email}`, 25, yPosition + 5);
        doc.text(`Role: ${user.role}`, 25, yPosition + 10);
        doc.text(`Status: ${user.is_active ? 'Active' : 'Inactive'}`, 25, yPosition + 15);
        doc.text(`Security Role: ${user.security_role}`, 25, yPosition + 20);
        yPosition += 30;
      });

      const fileName = `access-control-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Successful",
        description: "Access control report has been exported as PDF",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export access control report",
        variant: "destructive"
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-500';
      case 'ADMIN': return 'bg-orange-500';
      case 'ADMIN_STAFF': return 'bg-blue-500';
      case 'user': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-red-500';
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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
              <div className="flex items-center gap-4">
                <Link href="/admin/security">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                  Access Control Management
                </h1>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage user access, roles, and permissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={loadAccessControlData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportUsers}>
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
                <Label htmlFor="search">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-filter">Role</Label>
                <select
                  id="role-filter"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ADMIN_STAFF">Admin Staff</option>
                  <option value="user">User</option>
                </select>
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} of {users.length} total users • Page {currentPage} of {totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No users found matching your filters</p>
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(user.is_active || false)}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {user.user_metadata?.full_name || 'Unknown User'}
                            </h3>
                            <Badge className={getRoleColor(user.role || 'user')}>
                              {user.role || 'user'}
                            </Badge>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {user.email}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Created: {new Date(user.created_at).toLocaleDateString()}</span>
                            {user.last_sign_in_at && (
                              <span>Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}</span>
                            )}
                            {user.security_role && (
                              <span>Security: {user.security_role}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.is_active ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBlockUser(user.id)}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnblockUser(user.id)}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4" />
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