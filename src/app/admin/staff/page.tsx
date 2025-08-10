'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PermissionSet, SidebarAccess } from '@/lib/auth/permissions';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHeadset, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes,
  FaCheck, FaTimes as FaX, FaUserTie, FaUserCog, FaUserShield, FaHandshake,
  FaUserFriends, FaTruck, FaBook, FaChartBar, FaBullhorn, FaCheckCircle,
  FaExclamationTriangle, FaInfoCircle, FaArrowUp, FaArrowDown, FaLock, FaUnlock,
  FaLink, FaCogs, FaPlug
} from 'react-icons/fa';

interface AdminStaff {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ADMIN_STAFF';
  department: string;
  position: string;
  permissions: PermissionSet;
  sidebar_access: SidebarAccess;
  is_active: boolean;
  is_online: boolean;
  online_status?: 'online' | 'offline' | 'away' | 'busy';
  last_activity?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  last_login?: string;
  login_count: number;
  join_date: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}



type PermissionLevel = 'none' | 'view' | 'edit' | 'delete' | 'manage';

interface PermissionCategory {
  name: string;
  key: keyof PermissionSet;
  icon: React.ReactNode;
  description: string;
  permissions: {
    key: keyof PermissionSet;
    label: string;
    description: string;
  }[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Dashboard & Analytics',
    key: 'dashboard',
    icon: <FaChartBar className="w-4 h-4" />,
    description: 'Access to dashboard and analytics features',
    permissions: [
      { key: 'dashboard', label: 'Dashboard', description: 'View main dashboard' },
      { key: 'analytics', label: 'Analytics', description: 'Access to all analytics pages' }
    ]
  },
  {
    name: 'User Management',
    key: 'users',
    icon: <FaUsers className="w-4 h-4" />,
    description: 'Manage users, partners, and drivers',
    permissions: [
      { key: 'users', label: 'Users', description: 'Manage all users' },
      { key: 'partners', label: 'Partners', description: 'Manage partner accounts' },
      { key: 'drivers', label: 'Drivers', description: 'Manage driver accounts' }
    ]
  },
  {
    name: 'Operations',
    key: 'bookings',
    icon: <FaCalendar className="w-4 h-4" />,
    description: 'Core business operations',
    permissions: [
      { key: 'bookings', label: 'Bookings', description: 'Manage bookings and reservations' },
      { key: 'fleet', label: 'Fleet', description: 'Manage vehicle fleet' },
      { key: 'documents', label: 'Documents', description: 'Manage documents and compliance' },
      { key: 'payments', label: 'Payments', description: 'Manage payments and transactions' },
      { key: 'claims', label: 'Claims', description: 'Manage insurance claims' }
    ]
  },
  {
    name: 'Support & Communication',
    key: 'support',
    icon: <FaHeadset className="w-4 h-4" />,
    description: 'Customer support and notifications',
    permissions: [
      { key: 'support', label: 'Support', description: 'Manage customer support' },
      { key: 'notifications', label: 'Notifications', description: 'Manage system notifications' }
    ]
  },
  {
    name: 'Business Management',
    key: 'sales',
    icon: <FaMoneyBillWave className="w-4 h-4" />,
    description: 'Business and marketing features',
    permissions: [
      { key: 'sales', label: 'Sales', description: 'Manage sales and revenue' },
      { key: 'marketing', label: 'Marketing', description: 'Manage marketing campaigns' },
      { key: 'quality', label: 'Quality', description: 'Quality assurance and testing' },
      { key: 'security', label: 'Security', description: 'Security and compliance' }
    ]
  },
  {
    name: 'System Administration',
    key: 'staff',
    icon: <FaCog className="w-4 h-4" />,
    description: 'System administration features',
    permissions: [
      { key: 'staff', label: 'Staff', description: 'Manage admin staff' },
      { key: 'settings', label: 'Settings', description: 'System settings' },
      { key: 'integrations', label: 'Integrations', description: 'Third-party integrations' },
      { key: 'workflow', label: 'Workflow', description: 'Process automation' },
      { key: 'reports', label: 'Reports', description: 'Generate reports' }
    ]
  }
];

const SIDEBAR_SECTIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaChartBar /> },
  { key: 'analytics', label: 'Analytics', icon: <FaChartLine /> },
  { key: 'users', label: 'Users', icon: <FaUsers /> },
  { key: 'partners', label: 'Partners', icon: <FaHandshake /> },
  { key: 'drivers', label: 'Drivers', icon: <FaUserTie /> },
  { key: 'bookings', label: 'Bookings', icon: <FaCalendar /> },
  { key: 'fleet', label: 'Fleet', icon: <FaTruck /> },
  { key: 'documents', label: 'Documents', icon: <FaFileAlt /> },
  { key: 'payments', label: 'Payments', icon: <FaCreditCard /> },
  { key: 'claims', label: 'Claims', icon: <FaExclamationTriangle /> },
  { key: 'support', label: 'Support', icon: <FaHeadset /> },
  { key: 'notifications', label: 'Notifications', icon: <FaBell /> },
  { key: 'sales', label: 'Sales', icon: <FaMoneyBillWave /> },
  { key: 'marketing', label: 'Marketing', icon: <FaBullhorn /> },
  { key: 'quality', label: 'Quality', icon: <FaCheckCircle /> },
  { key: 'security', label: 'Security', icon: <FaShieldAlt /> },
  { key: 'staff', label: 'Staff', icon: <FaUserCog /> },
  { key: 'settings', label: 'Settings', icon: <FaCog /> },
  { key: 'integrations', label: 'Integrations', icon: <FaLink /> },
  { key: 'workflow', label: 'Workflow', icon: <FaCogs /> },
  { key: 'reports', label: 'Reports', icon: <FaFileAlt /> }
];

const DEPARTMENTS = [
  'Administration',
  'Customer Support',
  'Operations',
  'Sales',
  'Marketing',
  'Quality Assurance',
  'Security',
  'IT Support',
  'Finance',
  'Human Resources'
];

const POSITIONS = [
  'Manager',
  'Supervisor',
  'Specialist',
  'Coordinator',
  'Analyst',
  'Representative',
  'Administrator',
  'Lead',
  'Assistant'
];

export default function AdminStaffManagement() {
  const { user } = useAuth();
  const [staffMembers, setStaffMembers] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<AdminStaff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN_STAFF' as 'ADMIN' | 'ADMIN_STAFF',
    department: '',
    position: '',
    permissions: {
      dashboard: 'view' as PermissionLevel,
      analytics: 'view' as PermissionLevel,
      users: 'view' as PermissionLevel,
      partners: 'view' as PermissionLevel,
      drivers: 'view' as PermissionLevel,
      bookings: 'view' as PermissionLevel,
      fleet: 'view' as PermissionLevel,
      documents: 'view' as PermissionLevel,
      payments: 'view' as PermissionLevel,
      claims: 'view' as PermissionLevel,
      support: 'view' as PermissionLevel,
      notifications: 'view' as PermissionLevel,
      sales: 'view' as PermissionLevel,
      marketing: 'view' as PermissionLevel,
      quality: 'view' as PermissionLevel,
      security: 'view' as PermissionLevel,
      staff: 'view' as PermissionLevel,
      settings: 'view' as PermissionLevel,
      integrations: 'view' as PermissionLevel,
      workflow: 'view' as PermissionLevel,
      reports: 'view' as PermissionLevel
    },
    sidebar_access: {
      dashboard: false,
      analytics: false,
      users: false,
      partners: false,
      drivers: false,
      bookings: false,
      fleet: false,
      documents: false,
      payments: false,
      claims: false,
      support: false,
      notifications: false,
      sales: false,
      marketing: false,
      quality: false,
      security: false,
      staff: false,
      settings: false,
      integrations: false,
      workflow: false,
      reports: false
    }
  });

  useEffect(() => {
    console.log('AdminStaffManagement component mounted');
    loadStaffMembers();
    const cleanup = setupRealtimeSubscriptions();
    return cleanup;
  }, []);

  const loadStaffMembers = async () => {
    try {
      console.log('Starting to load staff members...');
      setLoading(true);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user);
      console.log('User error:', userError);
      
      if (userError || !user) {
        console.log('User not authenticated, this might be the issue');
      }
      
      // Test if supabase client is working
      console.log('Supabase client:', supabase);
      
      const { data, error } = await supabase
        .from('admin_staff')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        
        // If there's an RLS error, try with a different approach
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log('RLS policy issue detected, trying alternative approach...');
          
          // Try to get the data through an API route instead
          const response = await fetch('/api/admin/get-staff');
          if (response.ok) {
            const apiData = await response.json();
            setStaffMembers(apiData.staff || []);
            return;
          }
        }
        
        throw error;
      }
      
      console.log('Loaded staff members:', data);
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error loading staff members:', error);
      toast({
        title: 'Failed to load staff members',
        description: error instanceof Error ? error.message : 'Failed to load staff members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    try {
      const subscription = supabase
        .channel('admin_staff_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_staff' }, () => {
          console.log('Staff data changed, reloading...');
          loadStaffMembers();
        })
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });

      return () => {
        console.log('Unsubscribing from staff changes');
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const handleAddStaff = async () => {
    try {
      if (!formData.name || !formData.email || !formData.password || !formData.department || !formData.position) {
        toast({
          title: 'Please fill in all required fields',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Validate password strength
      if (formData.password.length < 8) {
        toast({
          title: 'Password too short',
          description: 'Password must be at least 8 characters long',
          variant: 'destructive',
        });
        return;
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        toast({
          title: 'Password requirements not met',
          description: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          variant: 'destructive',
        });
        return;
      }

      // Get current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // Call the API route to create staff member
      const response = await fetch('/api/admin/create-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentSession?.access_token ? { Authorization: `Bearer ${currentSession.access_token}` } : {})
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          permissions: formData.permissions,
          sidebar_access: formData.sidebar_access
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create staff member');
      }

      toast({
        title: `Staff member ${formData.name} added successfully!`,
        description: `Staff member ${formData.name} added successfully! They can now log in with their email and password.`,
        duration: 5000,
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
      });
      setShowAddModal(false);
      resetForm();
      loadStaffMembers();
    } catch (error) {
      console.error('Error adding staff member:', error);
      toast({
        title: 'Failed to add staff member',
        description: error instanceof Error ? error.message : 'Failed to add staff member',
        variant: 'destructive',
        duration: 6000,
        className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
      });
    }
  };

  const handleUpdateStaff = async () => {
    try {
      if (!selectedStaff) return;

      // Get current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      // Call the API route to update staff member
      const response = await fetch('/api/admin/update-staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(currentSession?.access_token ? { Authorization: `Bearer ${currentSession.access_token}` } : {})
        },
        body: JSON.stringify({
          staffId: selectedStaff.id,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          permissions: formData.permissions,
          sidebar_access: formData.sidebar_access
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update staff member');
      }

      toast({
        title: 'Staff member updated successfully',
        description: 'Staff member updated successfully',
        duration: 5000,
        className: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
      });
      setShowEditModal(false);
      setSelectedStaff(null);
      resetForm();
      loadStaffMembers();
    } catch (error) {
      console.error('Error updating staff member:', error);
      toast({
        title: 'Failed to update staff member',
        description: error instanceof Error ? error.message : 'Failed to update staff member',
        variant: 'destructive',
        duration: 6000,
        className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      // Call the API route to delete staff member
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const response = await fetch(`/api/admin/delete-staff?id=${staffId}`, {
        method: 'DELETE',
        headers: currentSession?.access_token ? { Authorization: `Bearer ${currentSession.access_token}` } : undefined,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete staff member');
      }

      toast({
        title: 'Staff member deleted successfully',
        description: 'Staff member deleted successfully',
        duration: 5000,
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
      });
      loadStaffMembers();
    } catch (error) {
      console.error('Error deleting staff member:', error);
      toast({
        title: 'Failed to delete staff member',
        description: error instanceof Error ? error.message : 'Failed to delete staff member',
        variant: 'destructive',
        duration: 6000,
        className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
      });
    }
  };

  const handleViewDetails = (staff: AdminStaff) => {
    setSelectedStaff(staff);
    setShowDetailsModal(true);
  };

  const handleEditStaff = (staff: AdminStaff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      password: '',
      role: staff.role,
      department: staff.department,
      position: staff.position,
      permissions: staff.permissions,
      sidebar_access: {
        ...staff.sidebar_access,
        // Ensure notifications and settings are always enabled for ADMIN_STAFF
        notifications: staff.role === 'ADMIN_STAFF' ? true : staff.sidebar_access.notifications,
        settings: staff.role === 'ADMIN_STAFF' ? true : staff.sidebar_access.settings
      }
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ADMIN_STAFF' as 'ADMIN' | 'ADMIN_STAFF',
      department: '',
      position: '',
      permissions: {
        dashboard: 'view' as PermissionLevel,
        analytics: 'view' as PermissionLevel,
        users: 'view' as PermissionLevel,
        partners: 'view' as PermissionLevel,
        drivers: 'view' as PermissionLevel,
        bookings: 'view' as PermissionLevel,
        fleet: 'view' as PermissionLevel,
        documents: 'view' as PermissionLevel,
        payments: 'view' as PermissionLevel,
        claims: 'view' as PermissionLevel,
        support: 'view' as PermissionLevel,
        notifications: 'view' as PermissionLevel,
        sales: 'view' as PermissionLevel,
        marketing: 'view' as PermissionLevel,
        quality: 'view' as PermissionLevel,
        security: 'view' as PermissionLevel,
        staff: 'view' as PermissionLevel,
        settings: 'view' as PermissionLevel,
        integrations: 'view' as PermissionLevel,
        workflow: 'view' as PermissionLevel,
        reports: 'view' as PermissionLevel
      },
      sidebar_access: {
        dashboard: false,
        analytics: false,
        users: false,
        partners: false,
        drivers: false,
        bookings: false,
        fleet: false,
        documents: false,
        payments: false,
        claims: false,
        support: false,
        notifications: true, // Always enabled for ADMIN_STAFF
        sales: false,
        marketing: false,
        quality: false,
        security: false,
        staff: false,
        settings: true, // Always enabled for ADMIN_STAFF
        integrations: false,
        workflow: false,
        reports: false
      }
    });
    setSelectedStaff(null);
  };

  const updatePermission = (category: keyof PermissionSet, level: PermissionLevel) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [category]: level
      }
    }));
  };

  const updateSidebarAccess = (section: keyof SidebarAccess, enabled: boolean) => {
    // Prevent disabling notifications and settings for ADMIN_STAFF
    if (formData.role === 'ADMIN_STAFF' && (section === 'notifications' || section === 'settings')) {
      return; // Don't allow disabling these for ADMIN_STAFF
    }
    
    setFormData(prev => ({
      ...prev,
      sidebar_access: {
        ...prev.sidebar_access,
        [section]: enabled
      }
    }));
  };

  const getPermissionLevel = (category: keyof PermissionSet): PermissionLevel => {
    return formData.permissions[category] || 'none';
  };

  const getSidebarAccess = (section: keyof SidebarAccess): boolean => {
    // Always return true for notifications and settings if role is ADMIN_STAFF
    if (formData.role === 'ADMIN_STAFF' && (section === 'notifications' || section === 'settings')) {
      return true;
    }
    return formData.sidebar_access[section] || false;
  };

  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || staff.department === filterDepartment;
    const matchesRole = !filterRole || staff.role === filterRole;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'active' && staff.is_active) ||
                         (filterStatus === 'inactive' && !staff.is_active);

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  const stats = {
    total: staffMembers.length,
    active: staffMembers.filter(s => s.is_active).length,
    online: staffMembers.filter(s => s.is_online).length,
    admins: staffMembers.filter(s => s.role === 'ADMIN').length,
    staff: staffMembers.filter(s => s.role === 'ADMIN_STAFF').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading staff management...</p>
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
                <FaUserCog className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Admin Staff Management
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage admin staff, roles, permissions, and access control
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add Staff Member
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FaUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FaCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FaUserTie className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.online}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FaUserShield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.admins}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <FaUserCog className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.staff}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="ADMIN_STAFF">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role & Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <FaUser className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {staff.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {staff.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {staff.role}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {staff.department} • {staff.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {staff.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            staff.online_status === 'online' ? 'bg-green-500' :
                            staff.online_status === 'away' ? 'bg-yellow-500' :
                            staff.online_status === 'busy' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}></div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            staff.online_status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            staff.online_status === 'away' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            staff.online_status === 'busy' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {staff.online_status || 'offline'}
                          </span>
                        </div>
                      </div>
                      {staff.last_activity && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Last active: {new Date(staff.last_activity).toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {staff.last_login 
                        ? new Date(staff.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {Object.values(staff.permissions).filter(p => p !== 'none').length} permissions
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {Object.values(staff.sidebar_access).filter(Boolean).length} sidebar sections
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(staff)}
                          className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg transition-colors duration-200"
                          title="View details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditStaff(staff)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg transition-colors duration-200"
                          title="Edit staff member"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg transition-colors duration-200"
                          title="Delete staff member"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {showAddModal ? 'Add Staff Member' : 'Edit Staff Member'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Password {showAddModal ? '*' : '(leave blank to keep current)'}
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder={showAddModal ? "Enter password" : "Enter new password (optional)"}
                        />
                        {showAddModal && (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <p>Password requirements:</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                                At least 8 characters long
                              </li>
                              <li className={/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : ''}>
                                Contains lowercase letter
                              </li>
                              <li className={/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : ''}>
                                Contains uppercase letter
                              </li>
                              <li className={/(?=.*\d)/.test(formData.password) ? 'text-green-600' : ''}>
                                Contains number
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Role *
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => {
                            const newRole = e.target.value as 'ADMIN' | 'ADMIN_STAFF';
                            setFormData(prev => ({
                              ...prev,
                              role: newRole,
                              // Automatically enable notifications and settings for ADMIN_STAFF
                              sidebar_access: {
                                ...prev.sidebar_access,
                                notifications: newRole === 'ADMIN_STAFF' ? true : prev.sidebar_access.notifications,
                                settings: newRole === 'ADMIN_STAFF' ? true : prev.sidebar_access.settings
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="ADMIN_STAFF">Admin Staff</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Department *
                        </label>
                        <select
                          value={formData.department}
                          onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Department</option>
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Position *
                        </label>
                        <select
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Position</option>
                          {POSITIONS.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Access */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Sidebar Access</h3>
                    <div className="space-y-3">
                      {SIDEBAR_SECTIONS.map(section => {
                        const isLocked = formData.role === 'ADMIN_STAFF' && (section.key === 'notifications' || section.key === 'settings');
                        const isChecked = getSidebarAccess(section.key as keyof SidebarAccess);
                        
                        return (
                          <label key={section.key} className={`flex items-center ${isLocked ? 'opacity-75' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => updateSidebarAccess(section.key as keyof SidebarAccess, e.target.checked)}
                              disabled={isLocked}
                              className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${isLocked ? 'cursor-not-allowed' : ''}`}
                            />
                            <span className={`ml-3 text-sm text-gray-700 dark:text-gray-300 flex items-center ${isLocked ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                              {section.icon}
                              <span className="ml-2">{section.label}</span>
                              {isLocked && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 flex items-center">
                                  <FaLock className="w-3 h-3 mr-1" />
                                  Required
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {formData.role === 'ADMIN_STAFF' && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
                          <FaInfoCircle className="w-3 h-3 mr-1" />
                          Notifications and Settings are automatically enabled for Admin Staff members
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permissions */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PERMISSION_CATEGORIES.map(category => (
                      <div key={category.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          {category.icon}
                          <h4 className="ml-2 font-medium text-gray-900 dark:text-white">{category.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
                        
                        {category.permissions.map(permission => (
                          <div key={permission.key} className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {permission.label}
                            </label>
                            <select
                              value={getPermissionLevel(permission.key)}
                              onChange={(e) => updatePermission(permission.key, e.target.value as PermissionLevel)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="none">No Access</option>
                              <option value="view">View Only</option>
                              <option value="edit">Edit</option>
                              <option value="delete">Delete</option>
                              <option value="manage">Full Management</option>
                            </select>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{permission.description}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showAddModal ? handleAddStaff : handleUpdateStaff}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    {showAddModal ? 'Add Staff Member' : 'Update Staff Member'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Details Modal */}
        {showDetailsModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Staff Member Details
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedStaff(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedStaff.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedStaff.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedStaff.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {selectedStaff.role}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Department</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedStaff.department}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Position</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedStaff.position}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Join Date</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {new Date(selectedStaff.join_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Online Status */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Online Status</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedStaff.online_status === 'online' ? 'bg-green-500' :
                            selectedStaff.online_status === 'away' ? 'bg-yellow-500' :
                            selectedStaff.online_status === 'busy' ? 'bg-red-500' :
                            'bg-gray-400'
                          }`}></div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedStaff.online_status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            selectedStaff.online_status === 'away' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            selectedStaff.online_status === 'busy' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {selectedStaff.online_status || 'offline'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Last Activity</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedStaff.last_activity 
                            ? new Date(selectedStaff.last_activity).toLocaleString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedStaff.last_login 
                            ? new Date(selectedStaff.last_login).toLocaleString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Login Count</label>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedStaff.login_count}</p>
                      </div>
                      {selectedStaff.session_id && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Session ID</label>
                          <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedStaff.session_id}</p>
                        </div>
                      )}
                      {selectedStaff.ip_address && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</label>
                          <p className="text-sm text-gray-900 dark:text-white">{selectedStaff.ip_address}</p>
                        </div>
                      )}
                      {selectedStaff.user_agent && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">User Agent</label>
                          <p className="text-sm text-gray-900 dark:text-white text-xs break-all">{selectedStaff.user_agent}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Permissions Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Active Permissions</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {Object.values(selectedStaff.permissions).filter(p => p !== 'none').length} permissions
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Sidebar Access</label>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {Object.values(selectedStaff.sidebar_access).filter(Boolean).length} sections
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedStaff(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleEditStaff(selectedStaff);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Edit Staff Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 