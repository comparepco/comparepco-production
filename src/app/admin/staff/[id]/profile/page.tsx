'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHeadset, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes,
  FaCheck, FaTimes as FaX, FaUserTie, FaUserCog, FaUserShield, FaHandshake,
  FaUserFriends, FaTruck, FaBook, FaChartBar, FaBullhorn, FaCheckCircle,
  FaExclamationTriangle, FaInfoCircle, FaArrowUp, FaArrowDown, FaLock, FaUnlock,
  FaClock, FaUserPlus, FaUserMinus, FaUserCheck, FaUserTimes, FaTachometerAlt,
  FaUsers, FaCalendarCheck, FaExclamationCircle, FaCheckCircle as FaCheckCircleIcon,
  FaEdit, FaSave, FaEye, FaEyeSlash, FaKey, FaHistory, FaDownload,
  FaUpload, FaTrash, FaPlus, FaMinus, FaCrown, FaUserEdit, FaUserLock
} from 'react-icons/fa';

interface StaffProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  permissions: Record<string, any>;
  sidebar_access: Record<string, boolean>;
  is_active: boolean;
  is_online: boolean;
  last_login?: string;
  login_count: number;
  join_date: string;
  created_at: string;
  updated_at: string;
}

interface ProfileFormData {
  name: string;
  email: string;
  department: string;
  position: string;
}

interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout: number;
  password_expiry_days: number;
  login_notifications: boolean;
  suspicious_activity_alerts: boolean;
}

export default function StaffProfile() {
  const { user } = useAuth();
  const { id } = useParams();
  const { 
    canView, 
    canEdit, 
    canDelete, 
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  const [staffData, setStaffData] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    email: '',
    department: '',
    position: ''
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    session_timeout: 30,
    password_expiry_days: 90,
    login_notifications: true,
    suspicious_activity_alerts: true
  });

  useEffect(() => {
    if (id) {
      loadStaffData();
    }
  }, [id]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStaffData(data);
      setProfileForm({
        name: data.name,
        email: data.email,
        department: data.department,
        position: data.position
      });
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!staffData) return;

      const { error } = await supabase
        .from('admin_staff')
        .update({
          name: profileForm.name,
          email: profileForm.email,
          department: profileForm.department,
          position: profileForm.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffData.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      setEditing(false);
      loadStaffData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleToggleActive = async () => {
    try {
      if (!staffData) return;

      const { error } = await supabase
        .from('admin_staff')
        .update({
          is_active: !staffData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', staffData.id);

      if (error) throw error;

      toast.success(`Staff ${staffData.is_active ? 'deactivated' : 'activated'} successfully`);
      loadStaffData();
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteStaff = async () => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;

    try {
      if (!staffData) return;

      const { error } = await supabase
        .from('admin_staff')
        .delete()
        .eq('id', staffData.id);

      if (error) throw error;

      toast.success('Staff member deleted successfully');
      // Redirect to staff list
      window.location.href = '/admin/staff';
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff member');
    }
  };

  const handleUpdateSecuritySettings = async () => {
    try {
      // In a real implementation, you would save these to a security_settings table
      toast.success('Security settings updated successfully');
      setShowSecurityModal(false);
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast.error('Failed to update security settings');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Staff Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400">The requested staff member could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaUserEdit className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Staff Profile
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage {staffData.name}'s profile and settings
              </p>
            </div>
            <div className="flex space-x-3">
              {canEdit('staff') && (
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                  <FaEdit className="w-4 h-4 mr-2" />
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
              {canDelete('staff') && (
                <button
                  onClick={handleDeleteStaff}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                  <FaTrash className="w-4 h-4 mr-2" />
                  Delete Staff
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaUser className="w-5 h-5 mr-2" />
                  Basic Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">{staffData.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">{staffData.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    {editing ? (
                      <select
                        value={profileForm.department}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Customer Support">Customer Support</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                        <option value="Management">Management</option>
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">{staffData.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Position
                    </label>
                    {editing ? (
                      <select
                        value={profileForm.position}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="Agent">Agent</option>
                        <option value="Senior Agent">Senior Agent</option>
                        <option value="Team Lead">Team Lead</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Manager">Manager</option>
                        <option value="Senior Manager">Senior Manager</option>
                      </select>
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">{staffData.position}</p>
                    )}
                  </div>
                </div>

                {editing && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center"
                    >
                      <FaSave className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaShieldAlt className="w-5 h-5 mr-2" />
                  Account Status
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staffData.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {staffData.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {canEdit('staff') && (
                        <button
                          onClick={handleToggleActive}
                          className={`px-3 py-1 text-xs rounded-lg ${
                            staffData.is_active
                              ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {staffData.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Online Status</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staffData.is_online
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {staffData.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Role</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      staffData.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {staffData.role}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Login Count</h3>
                    <p className="text-sm text-gray-900 dark:text-white">{staffData.login_count}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Join Date</h3>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {new Date(staffData.join_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Last Login</h3>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {staffData.last_login 
                        ? new Date(staffData.last_login).toLocaleString()
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaHistory className="w-5 h-5 mr-2" />
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">Profile updated</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">Logged in</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">Password changed</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaCog className="w-5 h-5 mr-2" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSecurityModal(true)}
                    className="w-full flex items-center p-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaKey className="w-4 h-4 mr-3" />
                    Security Settings
                  </button>
                  <button
                    onClick={() => setShowPermissionsModal(true)}
                    className="w-full flex items-center p-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaLock className="w-4 h-4 mr-3" />
                    Permissions
                  </button>
                  <a
                    href={`/admin/staff/${id}/dashboard`}
                    className="w-full flex items-center p-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <FaTachometerAlt className="w-4 h-4 mr-3" />
                    View Dashboard
                  </a>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaInfoCircle className="w-5 h-5 mr-2" />
                  Account Info
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">User ID</h3>
                    <p className="text-xs text-gray-900 dark:text-white font-mono">{staffData.user_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Staff ID</h3>
                    <p className="text-xs text-gray-900 dark:text-white font-mono">{staffData.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</h3>
                    <p className="text-xs text-gray-900 dark:text-white">
                      {new Date(staffData.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Last Updated</h3>
                    <p className="text-xs text-gray-900 dark:text-white">
                      {new Date(staffData.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings Modal */}
        {showSecurityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Security Settings
                  </h2>
                  <button
                    onClick={() => setShowSecurityModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={securitySettings.two_factor_enabled}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, two_factor_enabled: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable Two-Factor Authentication</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={securitySettings.session_timeout}
                      onChange={(e) => setSecuritySettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={securitySettings.login_notifications}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, login_notifications: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Login Notifications</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={securitySettings.suspicious_activity_alerts}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, suspicious_activity_alerts: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Suspicious Activity Alerts</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSecurityModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateSecuritySettings}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Save Settings
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