'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter,
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHeadset, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes,
  FaCheck, FaTimes as FaX, FaUserTie, FaUserCog, FaUserShield, FaHandshake,
  FaUserFriends, FaTruck, FaBook, FaChartBar, FaBullhorn, FaCheckCircle,
  FaExclamationTriangle, FaInfoCircle, FaArrowUp, FaArrowDown, FaLock, FaUnlock,
  FaClock, FaUserPlus, FaUserMinus, FaUserCheck, FaUserTimes
} from 'react-icons/fa';

interface SupportStaff {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'SUPPORT_AGENT' | 'SUPPORT_SUPERVISOR' | 'SUPPORT_MANAGER';
  department: string;
  position: string;
  specializations: string[];
  is_available: boolean;
  is_online: boolean;
  max_concurrent_chats: number;
  current_chats: number;
  average_response_time: number;
  satisfaction_rating: number;
  total_tickets_handled: number;
  total_chats_handled: number;
  join_date: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
}

interface AdminStaff {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ADMIN_STAFF';
  department: string;
  position: string;
  is_active: boolean;
  is_online: boolean;
}

const SUPPORT_ROLES = [
  { value: 'SUPPORT_AGENT', label: 'Support Agent', description: 'Handle customer inquiries and basic support' },
  { value: 'SUPPORT_SUPERVISOR', label: 'Support Supervisor', description: 'Oversee agents and handle escalations' },
  { value: 'SUPPORT_MANAGER', label: 'Support Manager', description: 'Manage support operations and strategy' }
];

const SUPPORT_DEPARTMENTS = [
  'General Support',
  'Technical Support',
  'Billing Support',
  'Account Support',
  'Emergency Support',
  'VIP Support'
];

const SUPPORT_POSITIONS = [
  'Agent',
  'Senior Agent',
  'Team Lead',
  'Supervisor',
  'Manager',
  'Senior Manager'
];

const SPECIALIZATIONS = [
  'Customer Service',
  'Technical Issues',
  'Billing & Payments',
  'Account Management',
  'Product Support',
  'Emergency Support',
  'VIP Support',
  'Complaints',
  'Refunds',
  'Documentation'
];

export default function SupportStaffManagement() {
  const { user } = useAuth();
  const [supportStaff, setSupportStaff] = useState<SupportStaff[]>([]);
  const [adminStaff, setAdminStaff] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<SupportStaff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SUPPORT_AGENT' as SupportStaff['role'],
    department: '',
    position: '',
    specializations: [] as string[],
    max_concurrent_chats: 5,
    is_available: true,
    is_online: false
  });

  // Assignment form
  const [assignmentForm, setAssignmentForm] = useState({
    adminStaffId: '',
    role: 'SUPPORT_AGENT' as SupportStaff['role'],
    department: '',
    position: '',
    specializations: [] as string[],
    max_concurrent_chats: 5
  });

  useEffect(() => {
    loadSupportStaff();
    loadAdminStaff();
  }, []);

  const loadSupportStaff = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_staff')
        .select(`
          *,
          user:user_id(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSupportStaff(data || []);
    } catch (error) {
      console.error('Error loading support staff:', error);
      toast.error('Failed to load support staff');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setAdminStaff(data || []);
    } catch (error) {
      console.error('Error loading admin staff:', error);
    }
  };

  const handleAssignAdminStaff = async () => {
    try {
      if (!assignmentForm.adminStaffId || !assignmentForm.department || !assignmentForm.position) {
        toast.error('Please fill in all required fields');
        return;
      }

      const selectedAdminStaff = adminStaff.find(staff => staff.id === assignmentForm.adminStaffId);
      if (!selectedAdminStaff) {
        toast.error('Selected admin staff not found');
        return;
      }

      // Create support staff record
      const { error } = await supabase
        .from('support_staff')
        .insert({
          user_id: selectedAdminStaff.user_id,
          name: selectedAdminStaff.name,
          email: selectedAdminStaff.email,
          role: assignmentForm.role,
          department: assignmentForm.department,
          position: assignmentForm.position,
          specializations: assignmentForm.specializations,
          max_concurrent_chats: assignmentForm.max_concurrent_chats,
          is_available: true,
          is_online: false,
          current_chats: 0,
          average_response_time: 0,
          satisfaction_rating: 0,
          total_tickets_handled: 0,
          total_chats_handled: 0,
          join_date: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      toast.success('Admin staff assigned to support successfully');
      setShowAssignModal(false);
      resetAssignmentForm();
      loadSupportStaff();
    } catch (error) {
      console.error('Error assigning admin staff:', error);
      toast.error('Failed to assign admin staff to support');
    }
  };

  const handleRemoveFromSupport = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member from support?')) return;

    try {
      const { error } = await supabase
        .from('support_staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      toast.success('Staff member removed from support successfully');
      loadSupportStaff();
    } catch (error) {
      console.error('Error removing staff from support:', error);
      toast.error('Failed to remove staff from support');
    }
  };

  const handleAddStaff = async () => {
    try {
      const { error } = await supabase
        .from('support_staff')
        .insert({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          specializations: formData.specializations,
          max_concurrent_chats: formData.max_concurrent_chats,
          is_available: formData.is_available,
          is_online: false,
          current_chats: 0,
          total_tickets_handled: 0,
          total_chats_handled: 0,
          average_response_time: 0,
          satisfaction_rating: 0,
          join_date: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      toast.success('Support staff added successfully');
      setShowAddModal(false);
      resetForm();
      loadSupportStaff();
    } catch (error) {
      console.error('Error adding support staff:', error);
      toast.error('Failed to add support staff');
    }
  };

  const handleUpdateStaff = async () => {
    try {
      if (!selectedStaff) return;

      const { error } = await supabase
        .from('support_staff')
        .update({
          role: formData.role,
          department: formData.department,
          position: formData.position,
          specializations: formData.specializations,
          max_concurrent_chats: formData.max_concurrent_chats,
          is_available: formData.is_available,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStaff.id);

      if (error) throw error;

      toast.success('Support staff updated successfully');
      setShowEditModal(false);
      setSelectedStaff(null);
      resetForm();
      loadSupportStaff();
    } catch (error) {
      console.error('Error updating support staff:', error);
      toast.error('Failed to update support staff');
    }
  };

  const handleEditStaff = (staff: SupportStaff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      position: staff.position,
      specializations: staff.specializations,
      max_concurrent_chats: staff.max_concurrent_chats,
      is_available: staff.is_available,
      is_online: staff.is_online
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'SUPPORT_AGENT',
      department: '',
      position: '',
      specializations: [],
      max_concurrent_chats: 5,
      is_available: true,
      is_online: false
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      adminStaffId: '',
      role: 'SUPPORT_AGENT',
      department: '',
      position: '',
      specializations: [],
      max_concurrent_chats: 5
    });
  };

  const updateSpecialization = (specialization: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked 
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }));
  };

  const updateAssignmentSpecialization = (specialization: string, checked: boolean) => {
    setAssignmentForm(prev => ({
      ...prev,
      specializations: checked 
        ? [...prev.specializations, specialization]
        : prev.specializations.filter(s => s !== specialization)
    }));
  };

  const filteredStaff = supportStaff.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || staff.role === filterRole;
    const matchesDepartment = !filterDepartment || staff.department === filterDepartment;
    const matchesStatus = !filterStatus || 
                         (filterStatus === 'online' && staff.is_online) ||
                         (filterStatus === 'offline' && !staff.is_online) ||
                         (filterStatus === 'available' && staff.is_available) ||
                         (filterStatus === 'unavailable' && !staff.is_available);

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const stats = {
    total: supportStaff.length,
    online: supportStaff.filter(s => s.is_online).length,
    available: supportStaff.filter(s => s.is_available).length,
    agents: supportStaff.filter(s => s.role === 'SUPPORT_AGENT').length,
    supervisors: supportStaff.filter(s => s.role === 'SUPPORT_SUPERVISOR').length,
    managers: supportStaff.filter(s => s.role === 'SUPPORT_MANAGER').length,
    totalTickets: supportStaff.reduce((sum, s) => sum + s.total_tickets_handled, 0),
    totalChats: supportStaff.reduce((sum, s) => sum + s.total_chats_handled, 0),
    avgSatisfaction: supportStaff.length > 0 
      ? supportStaff.reduce((sum, s) => sum + s.satisfaction_rating, 0) / supportStaff.length 
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading support staff...</p>
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
                <FaHeadset className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Support Staff Management
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage customer support staff, assign roles, and monitor performance
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
              >
                <FaUserPlus className="w-4 h-4 mr-2" />
                Assign Admin Staff
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Add Support Staff
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <FaUserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.online}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.available}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FaStar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgSatisfaction.toFixed(1)}/5</p>
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
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
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
                  {SUPPORT_ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
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
                  {SUPPORT_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
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
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Support Staff Table */}
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
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Specializations
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
                          staff.role === 'SUPPORT_MANAGER'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : staff.role === 'SUPPORT_SUPERVISOR'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {staff.role.replace('SUPPORT_', '')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {staff.department} • {staff.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.is_online
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {staff.is_online ? 'Online' : 'Offline'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.is_available
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {staff.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {staff.total_tickets_handled} tickets
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {staff.total_chats_handled} chats
                      </div>
                      <div className="flex items-center mt-1">
                        <FaStar className="w-3 h-3 text-yellow-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          {staff.satisfaction_rating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {staff.specializations.slice(0, 3).map((spec, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {spec}
                          </span>
                        ))}
                        {staff.specializations.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            +{staff.specializations.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditStaff(staff)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromSupport(staff.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <FaUserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assign Admin Staff Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Assign Admin Staff to Support
                  </h2>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      resetAssignmentForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Select Admin Staff */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Admin Staff *
                    </label>
                    <select
                      value={assignmentForm.adminStaffId}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, adminStaffId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Choose admin staff member</option>
                      {adminStaff.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.email}) - {staff.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Support Role *
                    </label>
                    <select
                      value={assignmentForm.role}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, role: e.target.value as SupportStaff['role'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {SUPPORT_ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department *
                    </label>
                    <select
                      value={assignmentForm.department}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Department</option>
                      {SUPPORT_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position *
                    </label>
                    <select
                      value={assignmentForm.position}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Position</option>
                      {SUPPORT_POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specializations
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPECIALIZATIONS.map(spec => (
                        <label key={spec} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={assignmentForm.specializations.includes(spec)}
                            onChange={(e) => updateAssignmentSpecialization(spec, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Max Concurrent Chats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Concurrent Chats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={assignmentForm.max_concurrent_chats}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, max_concurrent_chats: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      resetAssignmentForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignAdminStaff}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    Assign to Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Support Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Add Support Staff
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Support Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as SupportStaff['role'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {SUPPORT_ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
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
                      {SUPPORT_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
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
                      {SUPPORT_POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specializations
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPECIALIZATIONS.map(spec => (
                        <label key={spec} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.specializations.includes(spec)}
                            onChange={(e) => updateSpecialization(spec, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Max Concurrent Chats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Concurrent Chats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.max_concurrent_chats}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent_chats: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Available for support</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStaff}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Add Support Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal */}
        {showEditModal && selectedStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Edit Support Staff
                  </h2>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedStaff(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Support Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as SupportStaff['role'] }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {SUPPORT_ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {SUPPORT_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position
                    </label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {SUPPORT_POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Specializations
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPECIALIZATIONS.map(spec => (
                        <label key={spec} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.specializations.includes(spec)}
                            onChange={(e) => updateSpecialization(spec, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Max Concurrent Chats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Concurrent Chats
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formData.max_concurrent_chats}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent_chats: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_available}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Available for support</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedStaff(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStaff}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Update Staff
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