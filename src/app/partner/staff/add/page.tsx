'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  FaUserPlus, FaBuilding, FaUserTie, FaEnvelope, FaPhone, FaMapMarkerAlt,
  FaCog, FaShieldAlt, FaCar, FaCalendarAlt, FaChartBar, FaFileAlt,
  FaUsers, FaMoneyBillWave, FaRoute, FaCheck, FaTimes, FaArrowLeft
} from 'react-icons/fa';

interface StaffFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  position: string;
  start_date: string;
  salary: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  permissions: {
    canManageFleet: boolean;
    canManageVehicles: boolean;
    canViewFleet: boolean;
    canManageDrivers: boolean;
    canViewDrivers: boolean;
    canManageBookings: boolean;
    canViewBookings: boolean;
    canViewAllBookings: boolean;
    canViewFinancials: boolean;
    canManagePayments: boolean;
    canRefundPayments: boolean;
    canViewAnalytics: boolean;
    canViewReports: boolean;
    canManageMarketing: boolean;
    canManagePromotions: boolean;
    canManageDocuments: boolean;
    canManageNotifications: boolean;
    canManageSupport: boolean;
    canManageStaff: boolean;
  };
}

const ROLES = [
  { value: 'manager', label: 'Manager', description: 'Full access to all features' },
  { value: 'supervisor', label: 'Supervisor', description: 'Manage staff and operations' },
  { value: 'coordinator', label: 'Coordinator', description: 'Coordinate bookings and fleet' },
  { value: 'assistant', label: 'Assistant', description: 'Basic access to assigned tasks' },
  { value: 'driver', label: 'Driver', description: 'Driver-specific access' },
  { value: 'accountant', label: 'Accountant', description: 'Financial and reporting access' },
  { value: 'marketing', label: 'Marketing', description: 'Marketing and promotion access' }
];

const DEPARTMENTS = [
  'Operations',
  'Fleet Management',
  'Customer Service',
  'Finance',
  'Marketing',
  'Human Resources',
  'IT Support',
  'Sales',
  'Maintenance',
  'Administration'
];

export default function AddStaffPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'assistant',
    department: 'Operations',
    position: '',
    start_date: '',
    salary: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    permissions: {
      canManageFleet: false,
      canManageVehicles: false,
      canViewFleet: true,
      canManageDrivers: false,
      canViewDrivers: false,
      canManageBookings: false,
      canViewBookings: true,
      canViewAllBookings: false,
      canViewFinancials: false,
      canManagePayments: false,
      canRefundPayments: false,
      canViewAnalytics: false,
      canViewReports: false,
      canManageMarketing: false,
      canManagePromotions: false,
      canManageDocuments: false,
      canManageNotifications: false,
      canManageSupport: false,
      canManageStaff: false,
    }
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadPartnerData();
  }, [user, router]);

  const loadPartnerData = async () => {
    try {
      const { data: partner, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error loading partner data:', error);
        toast.error('Failed to load partner data');
        return;
      }

      setPartnerData(partner);
    } catch (error) {
      console.error('Error loading partner data:', error);
      toast.error('Failed to load partner data');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role
    }));

    // Set default permissions based on role
    const defaultPermissions = getDefaultPermissions(role);
    setFormData(prev => ({
      ...prev,
      permissions: defaultPermissions
    }));
  };

  const getDefaultPermissions = (role: string) => {
    switch (role) {
      case 'manager':
        return {
          canManageFleet: true,
          canManageVehicles: true,
          canViewFleet: true,
          canManageDrivers: true,
          canViewDrivers: true,
          canManageBookings: true,
          canViewBookings: true,
          canViewAllBookings: true,
          canViewFinancials: true,
          canManagePayments: true,
          canRefundPayments: true,
          canViewAnalytics: true,
          canViewReports: true,
          canManageMarketing: true,
          canManagePromotions: true,
          canManageDocuments: true,
          canManageNotifications: true,
          canManageSupport: true,
          canManageStaff: true,
        };
      case 'supervisor':
        return {
          canManageFleet: true,
          canManageVehicles: true,
          canViewFleet: true,
          canManageDrivers: true,
          canViewDrivers: true,
          canManageBookings: true,
          canViewBookings: true,
          canViewAllBookings: true,
          canViewFinancials: false,
          canManagePayments: false,
          canRefundPayments: false,
          canViewAnalytics: true,
          canViewReports: true,
          canManageMarketing: false,
          canManagePromotions: false,
          canManageDocuments: true,
          canManageNotifications: true,
          canManageSupport: true,
          canManageStaff: false,
        };
      case 'coordinator':
        return {
          canManageFleet: false,
          canManageVehicles: false,
          canViewFleet: true,
          canManageDrivers: false,
          canViewDrivers: true,
          canManageBookings: true,
          canViewBookings: true,
          canViewAllBookings: true,
          canViewFinancials: false,
          canManagePayments: false,
          canRefundPayments: false,
          canViewAnalytics: true,
          canViewReports: false,
          canManageMarketing: false,
          canManagePromotions: false,
          canManageDocuments: false,
          canManageNotifications: true,
          canManageSupport: false,
          canManageStaff: false,
        };
      case 'driver':
        return {
          canManageFleet: false,
          canManageVehicles: false,
          canViewFleet: false,
          canManageDrivers: false,
          canViewDrivers: false,
          canManageBookings: false,
          canViewBookings: true,
          canViewAllBookings: false,
          canViewFinancials: false,
          canManagePayments: false,
          canRefundPayments: false,
          canViewAnalytics: false,
          canViewReports: false,
          canManageMarketing: false,
          canManagePromotions: false,
          canManageDocuments: false,
          canManageNotifications: false,
          canManageSupport: false,
          canManageStaff: false,
        };
      case 'accountant':
        return {
          canManageFleet: false,
          canManageVehicles: false,
          canViewFleet: true,
          canManageDrivers: false,
          canViewDrivers: true,
          canManageBookings: false,
          canViewBookings: true,
          canViewAllBookings: true,
          canViewFinancials: true,
          canManagePayments: true,
          canRefundPayments: true,
          canViewAnalytics: true,
          canViewReports: true,
          canManageMarketing: false,
          canManagePromotions: false,
          canManageDocuments: false,
          canManageNotifications: false,
          canManageSupport: false,
          canManageStaff: false,
        };
      case 'marketing':
        return {
          canManageFleet: false,
          canManageVehicles: false,
          canViewFleet: true,
          canManageDrivers: false,
          canViewDrivers: true,
          canManageBookings: false,
          canViewBookings: true,
          canViewAllBookings: true,
          canViewFinancials: false,
          canManagePayments: false,
          canRefundPayments: false,
          canViewAnalytics: true,
          canViewReports: true,
          canManageMarketing: true,
          canManagePromotions: true,
          canManageDocuments: false,
          canManageNotifications: true,
          canManageSupport: false,
          canManageStaff: false,
        };
      default:
        return {
          canManageFleet: false,
          canManageVehicles: false,
          canViewFleet: true,
          canManageDrivers: false,
          canViewDrivers: false,
          canManageBookings: false,
          canViewBookings: true,
          canViewAllBookings: false,
          canViewFinancials: false,
          canManagePayments: false,
          canRefundPayments: false,
          canViewAnalytics: false,
          canViewReports: false,
          canManageMarketing: false,
          canManagePromotions: false,
          canManageDocuments: false,
          canManageNotifications: false,
          canManageSupport: false,
          canManageStaff: false,
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // First, create the user account
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: 'temporary123', // They'll reset this
        email_confirm: true,
        user_metadata: {
          role: 'PARTNER_STAFF',
          first_name: formData.first_name,
          last_name: formData.last_name
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        toast.error('Failed to create staff account');
        return;
      }

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: 'partner_staff',
          is_active: true,
          is_verified: true
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
        toast.error('Failed to create user profile');
        return;
      }

      // Create staff record
      const { error: staffError } = await supabase
        .from('partner_staff')
        .insert({
          partner_id: partnerData.id,
          user_id: authUser.user.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          department: formData.department,
          position: formData.position,
          start_date: formData.start_date || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          address: formData.address || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_phone: formData.emergency_contact_phone || null,
          emergency_contact_relationship: formData.emergency_contact_relationship || null,
          permissions: formData.permissions,
          employment_status: 'active',
          is_active: true
        });

      if (staffError) {
        console.error('Error creating staff record:', staffError);
        toast.error('Failed to create staff record');
        return;
      }

      toast.success('Staff member added successfully!');
      router.push('/partner');

    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Failed to add staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaUserPlus className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                  Add Staff Member
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Add a new staff member to your team with specific roles and permissions
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaUserTie className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaBuilding className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Work Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Salary (£)
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaPhone className="w-5 h-5 mr-2 text-red-600 dark:text-red-400" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_relationship}
                  onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FaShieldAlt className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
              Permissions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(formData.permissions).map(([permission, value]) => (
                <div key={permission} className="flex items-center">
                  <input
                    type="checkbox"
                    id={permission}
                    checked={value}
                    onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={permission} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Adding Staff...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 