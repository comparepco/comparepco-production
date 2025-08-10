'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Activity, 
  Shield, 
  AlertTriangle, 
  FileText, 
  Clock, 
  MapPin,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface UserDetails {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    blocked?: boolean;
    blocked_at?: string;
    blocked_by?: string;
  };
  created_at: string;
  last_sign_in_at?: string;
  role?: string;
  is_active?: boolean;
}

interface UserAction {
  id: string;
  action_type: string;
  timestamp: string;
  ip_address?: string;
  details?: any;
  resource_type?: string;
  resource_id?: string;
}

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  resolved: boolean;
  ip_address?: string;
}

interface FileSecurity {
  id: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_approved: boolean;
  created_at: string;
  upload_ip?: string;
}

interface UserSession {
  id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [fileSecurity, setFileSecurity] = useState<FileSecurity[]>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);

      // Get user details
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user.user) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        });
        router.push('/admin/security');
        return;
      }

      // Get admin staff role
      const { data: adminStaff } = await supabase
        .from('admin_staff')
        .select('role, is_active')
        .eq('user_id', userId)
        .single();

      const userWithRole = {
        ...user.user,
        role: adminStaff?.role,
        is_active: adminStaff?.is_active
      };

      setUserDetails(userWithRole);

      // Load user actions
      const { data: actions } = await supabase
        .from('user_action_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      setUserActions(actions || []);

      // Load security alerts
      const { data: alerts } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      setSecurityAlerts(alerts || []);

      // Load file security
      const { data: files } = await supabase
        .from('file_security')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      setFileSecurity(files || []);

      // Load user sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);

      setUserSessions(sessions || []);

    } catch (error) {
      console.error('Failed to load user details:', error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
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

      const isCurrentlyBlocked = userDetails?.user_metadata?.blocked || false;

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

      loadUserDetails();
    } catch (error) {
      console.error('Failed to block user:', error);
      toast({
        title: "Error",
        description: "Failed to block/unblock user",
        variant: "destructive"
      });
    }
  };

  const handleExportUserReport = async () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('User Security Report', 20, 20);
      
      // User details
      doc.setFontSize(12);
      doc.text(`User: ${userDetails?.user_metadata?.full_name || userDetails?.email}`, 20, 40);
      doc.text(`Email: ${userDetails?.email}`, 20, 50);
      doc.text(`Role: ${userDetails?.role || 'User'}`, 20, 60);
      doc.text(`Status: ${userDetails?.user_metadata?.blocked ? 'Blocked' : 'Active'}`, 20, 70);
      doc.text(`Created: ${new Date(userDetails?.created_at || '').toLocaleDateString()}`, 20, 80);
      
      // Statistics
      doc.text(`Total Actions: ${userActions.length}`, 20, 100);
      doc.text(`Security Alerts: ${securityAlerts.length}`, 20, 110);
      doc.text(`File Uploads: ${fileSecurity.length}`, 20, 120);
      doc.text(`Active Sessions: ${userSessions.filter(s => s.is_active).length}`, 20, 130);
      
      // Recent actions
      doc.text('Recent Actions:', 20, 150);
      userActions.slice(0, 10).forEach((action, index) => {
        const y = 160 + (index * 10);
        doc.setFontSize(10);
        doc.text(`${action.action_type} - ${new Date(action.timestamp).toLocaleString()}`, 30, y);
      });
      
      doc.save(`user-report-${userId}.pdf`);
      
      toast({
        title: "Success",
        description: "User report exported successfully",
      });
    } catch (error) {
      console.error('Failed to export report:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const filteredData = () => {
    let data: any[] = [];
    
    if (filterType === 'actions') {
      data = userActions;
    } else if (filterType === 'alerts') {
      data = securityAlerts;
    } else if (filterType === 'files') {
      data = fileSecurity;
    } else if (filterType === 'sessions') {
      data = userSessions;
    } else {
      data = [...userActions, ...securityAlerts, ...fileSecurity, ...userSessions];
    }

    if (searchTerm) {
      data = data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return data;
  };

  const paginatedData = () => {
    const data = filteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredData().length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Details
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive view of user activity and security
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportUserReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={loadUserDetails}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* User Profile */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{userDetails?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{userDetails?.user_metadata?.full_name || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium">{userDetails?.role || 'User'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{new Date(userDetails?.created_at || '').toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <Badge variant={userDetails?.user_metadata?.blocked ? 'destructive' : 'default'}>
              {userDetails?.user_metadata?.blocked ? 'Blocked' : 'Active'}
            </Badge>
            <Button
              variant={userDetails?.user_metadata?.blocked ? 'outline' : 'destructive'}
              onClick={handleBlockUser}
              className="flex items-center gap-2"
            >
              {userDetails?.user_metadata?.blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {userDetails?.user_metadata?.blocked ? 'Unblock User' : 'Block User'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{userActions.length}</p>
                <p className="text-sm text-gray-500">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{securityAlerts.length}</p>
                <p className="text-sm text-gray-500">Security Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{fileSecurity.length}</p>
                <p className="text-sm text-gray-500">File Uploads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{userSessions.filter(s => s.is_active).length}</p>
                <p className="text-sm text-gray-500">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search all user activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Activity</option>
                <option value="actions">User Actions</option>
                <option value="alerts">Security Alerts</option>
                <option value="files">File Uploads</option>
                <option value="sessions">Sessions</option>
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                  setCurrentPage(1);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>
            Showing {paginatedData().length} of {filteredData().length} records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-4 font-medium">Type</th>
                  <th className="text-left py-2 px-4 font-medium">Action</th>
                  <th className="text-left py-2 px-4 font-medium">Timestamp</th>
                  <th className="text-left py-2 px-4 font-medium">IP Address</th>
                  <th className="text-left py-2 px-4 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData().map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-2 px-4">
                      <Badge variant="outline">
                        {item.action_type ? 'Action' : item.alert_type ? 'Alert' : item.file_path ? 'File' : 'Session'}
                      </Badge>
                    </td>
                    <td className="py-2 px-4">
                      {item.action_type || item.alert_type || 'File Upload' || 'Session'}
                    </td>
                    <td className="py-2 px-4">
                      {new Date(item.timestamp || item.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-4">
                      {item.ip_address || 'Unknown'}
                    </td>
                    <td className="py-2 px-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 