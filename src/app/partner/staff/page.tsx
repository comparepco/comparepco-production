'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaUserPlus,
  FaPhone, FaEnvelope, FaIdCard, FaCheckCircle, FaTimes, FaClock,
  FaShieldAlt, FaKey, FaLock, FaUserShield, FaExclamationTriangle,
  FaStar, FaCalendarAlt, FaMapMarkerAlt, FaUserTie, FaCog, FaFileAlt,
  FaBell, FaHistory, FaChartLine, FaUserEdit, FaCar, FaMoneyBillWave,
  FaFilter, FaSort, FaChevronDown, FaCog as FaSettings,
  FaBuilding, FaUserGraduate, FaBriefcase, FaAddressCard, FaNotesMedical
} from 'react-icons/fa';
import StaffCard from '@/components/partner/StaffCard';
import StaffForm from '@/components/partner/StaffForm';

interface StaffMember {
  id: string;
  partnerId: string;
  userId: string;
  role: string;
  department?: string;
  position?: string;
  startDate?: string;
  salary?: number;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
  lastLogin?: string;
  loginCount?: number;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export default function StaffPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [creating, setCreating] = useState(false);
  const [permissions, setPermissions] = useState<any>({
    canViewStaff: true,
    canManageStaff: true,
    canViewFleet: true,
    canManageFleet: true,
    canViewBookings: true,
    canManageBookings: true,
    canViewClaims: true,
    canManageClaims: true,
    canViewFinancials: true,
    canViewAnalytics: true,
    canManageDocuments: true
  });
  const [partnerId, setPartnerId] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
        router.replace('/');
      } else {
        setLoading(false);
        getPartnerId();
      }
    }
  }, [user, authLoading, router]);

  const getPartnerId = async () => {
    if (!user) return;

    try {
      let currentPartnerId = null;
      
      // If user is PARTNER, get their partner record ID
      if (user.role === 'PARTNER') {
        console.log('Getting partner ID for PARTNER user:', user.id);
        const response = await fetch(`/api/partner/get-partner-id?userId=${user.id}`);
        const data = await response.json();
        
        if (response.ok && data.partnerId) {
          currentPartnerId = data.partnerId;
          console.log('Found partner ID:', currentPartnerId);
        } else {
          console.error('Failed to get partner ID:', data.error);
          // Fallback: try to get partner ID directly from partners table
          console.log('Trying fallback method...');
          const fallbackResponse = await fetch(`/api/partner/get-partner-id?userId=${user.id}&fallback=true`);
          const fallbackData = await fallbackResponse.json();
          if (fallbackResponse.ok && fallbackData.partnerId) {
            currentPartnerId = fallbackData.partnerId;
            console.log('Found partner ID via fallback:', currentPartnerId);
          }
        }
      }
      // If user is partner_staff, get their partner_id
      else if (user.role === 'PARTNER_STAFF') {
        console.log('Getting partner ID for PARTNER_STAFF user:', user.id);
        const response = await fetch(`/api/partner/staff?userId=${user.id}`);
        const data = await response.json();
        
        if (response.ok && data.staff && data.staff.length > 0) {
          currentPartnerId = data.staff[0].partner_id || data.staff[0].partnerId;
          console.log('Found partner ID from staff record:', currentPartnerId);
        } else {
          console.error('Failed to get partner ID from staff record:', data.error);
        }
      }
      
      if (currentPartnerId) {
        console.log('Setting partner ID:', currentPartnerId);
        setPartnerId(currentPartnerId);
        loadStaff(currentPartnerId);
      } else {
        console.error('No partner ID found for user:', user.id, 'role:', user.role);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error getting partner ID:', error);
      setLoading(false);
    }
  };

  const loadStaff = async (partnerId: string) => {
    if (!partnerId) return;

    try {
      const response = await fetch(`/api/partner/staff?partnerId=${partnerId}`);
      const data = await response.json();

      if (response.ok) {
        setStaff(data.staff || []);
        setFilteredStaff(data.staff || []);
      } else {
        console.error('Error loading staff:', data.error);
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...staff];

    if (searchTerm) {
      filtered = filtered.filter(member =>
        `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${member.user?.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${member.user?.phone || ''}`.includes(searchTerm) ||
        `${member.role || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${member.department || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(member => 
        statusFilter === 'active' ? member.isActive : !member.isActive
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(member => member.department === departmentFilter);
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, roleFilter, statusFilter, departmentFilter]);

  const handleCreateStaff = async (formData: any) => {
    setCreating(true);

    try {
      const requestData = {
        ...formData,
        partnerId
      };
      console.log('Creating staff with data:', requestData);
      
      const response = await fetch('/api/partner/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (response.ok) {
        await loadStaff(partnerId);
        setShowAddStaff(false);
        alert(`Staff member ${formData.firstName} ${formData.lastName} has been created successfully!`);
      } else {
        alert(data.error || 'Failed to create staff member');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      alert('Failed to create staff member');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStaff = async (staffId: string, updates: any) => {
    try {
      const response = await fetch('/api/partner/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, updates })
      });

      const data = await response.json();

      if (response.ok) {
        await loadStaff(partnerId);
        alert('Staff member updated successfully!');
      } else {
        alert(data.error || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Failed to update staff member');
    }
  };

  const handleDeleteStaff = async (member: StaffMember) => {
    if (!confirm(`Are you sure you want to delete ${member.user?.firstName || ''} ${member.user?.lastName || ''} || 'this staff member'}?`)) return;

    try {
      const response = await fetch('/api/partner/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: member.id })
      });

      const data = await response.json();

      if (response.ok) {
        await loadStaff(partnerId);
        alert('Staff member deleted successfully!');
      } else {
        alert(data.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member');
    }
  };

  const handleToggleStatus = async (member: StaffMember) => {
    try {
      await handleUpdateStaff(member.id, { isActive: !member.isActive });
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleViewDetails = (member: StaffMember) => {
    setSelectedStaff(member);
    setShowDetails(true);
  };

  const handleEditPermissions = (member: StaffMember) => {
    setSelectedStaff(member);
    setShowPermissions(true);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-bold text-gray-900">Loading staff...</div>
      </div>
    );
  }

  if (!user) return null;

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.isActive).length,
    managers: staff.filter(s => s.role === 'manager').length,
    supervisors: staff.filter(s => s.role === 'supervisor').length,
    inactive: staff.filter(s => !s.isActive).length
  };

  const uniqueDepartments = Array.from(new Set(staff.map(s => s.department).filter(Boolean)));
  const uniqueRoles = Array.from(new Set(staff.map(s => s.role)));

  return (
    <>
      {/* MAIN PAGE */}
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
                  <p className="text-gray-600">
                    Manage your team members and their permissions
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaUsers className="text-gray-400" />
                  <span>{filteredStaff.length} of {staff.length} team members</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      console.log('Debug: Checking partners...');
                      const response = await fetch('/api/partner/list');
                      const data = await response.json();
                      console.log('Partners in database:', data);
                      alert(`Found ${data.count} partners in database`);
                    }}
                    className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-3 rounded-lg hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-500 font-medium transition-colors"
                  >
                    Debug Partners
                  </button>
                  <button
                    onClick={() => router.push('/partner/staff/analytics')}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 font-medium transition-colors"
                  >
                    <FaChartLine className="text-sm" />
                    Analytics
                  </button>
                  <button
                    onClick={() => setShowAddStaff(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
                  >
                    <FaUserPlus className="text-sm" />
                    Add Staff Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Staff</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-green-600 mt-1">All team members</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                  <FaUsers className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                  <p className="text-xs text-green-600 mt-1">Currently working</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                  <FaCheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Managers</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.managers}</p>
                  <p className="text-xs text-purple-600 mt-1">Senior leadership</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                  <FaUserShield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Supervisors</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.supervisors}</p>
                  <p className="text-xs text-orange-600 mt-1">Team leaders</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
                  <FaUserTie className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Inactive</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.inactive}</p>
                  <p className="text-xs text-gray-600 mt-1">Not available</p>
                </div>
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-3 rounded-xl">
                  <FaClock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters and Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200"
                />
              </div>
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200 appearance-none bg-white"
                >
                  <option value="">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200 appearance-none bg-white"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black transition-all duration-200 appearance-none bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Staff Grid */}
          {filteredStaff.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {staff.length === 0
                  ? 'Get started by adding your first team member to manage your operations'
                  : 'No staff members match your current filters. Try adjusting your search criteria.'
                }
              </p>
              {staff.length === 0 && (
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  <FaUserPlus className="text-sm" />
                  Add First Staff Member
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  member={member}
                  onViewDetails={handleViewDetails}
                  onEditPermissions={handleEditPermissions}
                  onDelete={handleDeleteStaff}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Form Modal */}
      <StaffForm
        isOpen={showAddStaff}
        onClose={() => setShowAddStaff(false)}
        onSubmit={handleCreateStaff}
        loading={creating}
      />

      {/* Staff Management Modal */}
      {showDetails && selectedStaff && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowDetails(false)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Manage Staff Member</h2>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedStaff.user?.firstName || ''} {selectedStaff.user?.lastName || ''} || 'Unknown'</p>
                      <p><span className="font-medium">Email:</span> {selectedStaff.user?.email || 'No email'}</p>
                      <p><span className="font-medium">Phone:</span> {selectedStaff.user?.phone || 'No phone'}</p>
                      <p><span className="font-medium">Staff ID:</span> {selectedStaff.id}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Work Information</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Role:</span> <span className="capitalize">{selectedStaff.role}</span></p>
                      <p><span className="font-medium">Department:</span> {selectedStaff.department || 'Not specified'}</p>
                      <p><span className="font-medium">Position:</span> {selectedStaff.position || 'Not specified'}</p>
                      <p><span className="font-medium">Status:</span> {selectedStaff.isActive ? 'Active' : 'Inactive'}</p>
                      <p><span className="font-medium">Start Date:</span> {selectedStaff.startDate ? new Date(selectedStaff.startDate).toLocaleDateString() : 'Not specified'}</p>
                      <p><span className="font-medium">Salary:</span> {selectedStaff.salary ? `£${selectedStaff.salary.toLocaleString()}` : 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {selectedStaff.emergencyContactName && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Emergency Contact</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Name:</span> {selectedStaff.emergencyContactName}</p>
                      <p><span className="font-medium">Phone:</span> {selectedStaff.emergencyContactPhone}</p>
                      <p><span className="font-medium">Relationship:</span> {selectedStaff.emergencyContactRelationship}</p>
                    </div>
                  </div>
                )}

                {selectedStaff.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                    <p className="text-gray-700">{selectedStaff.notes}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Permissions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(selectedStaff.permissions).map(([key, value]) => (
                      <div key={key} className={`flex items-center gap-2 p-2 rounded ${value ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-600'}`}>
                        {value ? <FaCheckCircle className="text-green-600" /> : <FaTimes className="text-gray-400" />}
                        <span className="text-sm">{key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Permissions Modal */}
      {showPermissions && selectedStaff && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowPermissions(false)}
          />
          
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Manage Permissions</h2>
                  <button
                    onClick={() => setShowPermissions(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                <p className="text-gray-600 mt-1">{selectedStaff.user?.firstName || ''} {selectedStaff.user?.lastName || ''} || 'Unknown Staff'</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {(() => {
                    const categories: { label: string; keys: string[] }[] = [
                      { label: 'Fleet & Vehicles', keys: ['canManageFleet', 'canManageVehicles', 'canManageMaintenence', 'canViewFleet'] },
                      { label: 'Drivers', keys: ['canManageDrivers', 'canViewDrivers'] },
                      { label: 'Bookings & Claims', keys: ['canManageBookings', 'canViewBookings', 'canManageClaims', 'canViewAllBookings'] },
                      { label: 'Finance & Payments', keys: ['canManagePayments', 'canRefundPayments', 'canViewPayments', 'canViewFinancials', 'canManageRevenue'] },
                      { label: 'Analytics & Reports', keys: ['canViewAnalytics', 'canViewReports'] },
                      { label: 'Marketing & Promotions', keys: ['canManageMarketing', 'canManagePromotions'] },
                      { label: 'Documents & Notifications', keys: ['canManageDocuments', 'canManageNotifications'] },
                      { label: 'Staff & Support', keys: ['canManageStaff', 'canManageSupport'] }
                    ];

                    return categories.map(cat => (
                      <div key={cat.label} className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">{cat.label}</h4>
                        <div className="space-y-2">
                          {cat.keys.map(key => (
                            <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-900">
                                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              <input
                                type="checkbox"
                                checked={selectedStaff.permissions[key] || false}
                                onChange={(e) => {
                                  const updatedPermissions = {
                                    ...selectedStaff.permissions,
                                    [key]: e.target.checked,
                                    isAdmin: false,
                                    canAccessAdmin: false,
                                    canManagePartners: false,
                                    canViewAllData: false
                                  };
                                  setSelectedStaff(prev => prev ? { ...prev, permissions: updatedPermissions } : null);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                  <div className="flex">
                    <FaExclamationTriangle className="text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Staff members can only be assigned business-specific permissions. Global admin permissions are restricted to business owners only.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => {
                      handleUpdateStaff(selectedStaff.id, { permissions: selectedStaff.permissions });
                      setShowPermissions(false);
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Update Permissions
                  </button>
                  <button
                    onClick={() => setShowPermissions(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
} 