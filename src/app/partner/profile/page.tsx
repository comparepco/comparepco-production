'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  FaUser, FaEnvelope, FaPhone, FaBuilding, FaUserTie, FaCalendarAlt,
  FaMapMarkerAlt, FaShieldAlt, FaKey, FaCog, FaEdit, FaSave, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaClock, FaIdCard, FaBriefcase,
  FaGraduationCap, FaAddressCard, FaNotesMedical, FaExclamationCircle, FaCar,
  FaGlobe, FaFileAlt, FaDownload, FaEye, FaEyeSlash, FaUpload, FaTrash,
  FaCarSide, FaRoute, FaChartLine, FaPoundSign, FaCheck, FaTimes as FaTimesIcon,
  FaInfoCircle, FaStar, FaCertificate, FaFileContract, FaFileInvoice
} from 'react-icons/fa';

interface PartnerInfo {
  id: string;
  companyName: string;
  businessType: string;
  taxId?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  website?: string;
  description?: string;
  logo?: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields from registration
  contactName?: string;
  email?: string;
  registrationNumber?: string;
  vatNumber?: string;
  operatingAreas?: string[];
  vehicleTypes?: string[];
  fleetSize?: number;
  estimatedMonthlyRides?: number;
  commissionRate?: number;
  documents?: {
    [key: string]: {
      url: string;
      uploaded_at: string;
    };
  };
}

interface StaffProfile {
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

export default function PartnerProfile() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
        router.replace('/');
      } else {
        setLoading(false);
        loadProfile();
      }
    }
  }, [user, authLoading, router]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      // Load staff profile
      const staffResponse = await fetch(`/api/partner/staff?userId=${user.id}`);
      const staffData = await staffResponse.json();

      if (staffResponse.ok && staffData.staff && staffData.staff.length > 0) {
        const staffProfile = staffData.staff[0];
        setProfile(staffProfile);
        setEditForm({
          firstName: staffProfile.user?.firstName || '',
          lastName: staffProfile.user?.lastName || '',
          email: staffProfile.user?.email || '',
          phone: staffProfile.user?.phone || '',
          department: staffProfile.department || '',
          position: staffProfile.position || '',
          address: staffProfile.address || '',
          emergency_contact_name: staffProfile.emergencyContactName || '',
          emergency_contact_phone: staffProfile.emergencyContactPhone || '',
          emergency_contact_relationship: staffProfile.emergencyContactRelationship || '',
          notes: staffProfile.notes || ''
        });

        // Load partner information
        if (staffProfile.partnerId) {
          const partnerResponse = await fetch(`/api/partner/get-partner-info?partnerId=${staffProfile.partnerId}`);
          const partnerData = await partnerResponse.json();
          
          if (partnerResponse.ok && partnerData.partner) {
            setPartnerInfo(partnerData.partner);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/partner/staff`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId: profile.id,
          updates: editForm
        })
      });

      if (response.ok) {
        setEditing(false);
        await loadProfile(); // Reload profile data
      } else {
        const error = await response.json();
        console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setEditForm({
        firstName: profile.user?.firstName || '',
        lastName: profile.user?.lastName || '',
        email: profile.user?.email || '',
        phone: profile.user?.phone || '',
        department: profile.department || '',
        position: profile.position || '',
        address: profile.address || '',
        emergency_contact_name: profile.emergencyContactName || '',
        emergency_contact_phone: profile.emergencyContactPhone || '',
        emergency_contact_relationship: profile.emergencyContactRelationship || '',
        notes: profile.notes || ''
      });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        alert('Password updated successfully');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'supervisor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'coordinator': return 'bg-green-100 text-green-800 border-green-200';
      case 'assistant': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getApprovalColor = (isApproved: boolean) => {
    return isApproved 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Not specified';
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(salary);
  };

  const getBusinessTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'transport_company': 'Transport Company',
      'pco_operator': 'PCO Operator',
      'taxi_fleet': 'Taxi Fleet',
      'minicab_operator': 'Minicab Operator',
      'private_hire_operator': 'Private Hire Operator',
      'car_rental': 'Car Rental Company',
      'executive_transport': 'Executive Transport',
      'airport_transfer': 'Airport Transfer Service'
    };
    return types[type] || type;
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-bold text-gray-900">Loading profile...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: FaUser },
    { id: 'company', label: 'Company Info', icon: FaBuilding },
    { id: 'business', label: 'Business Details', icon: FaBriefcase },
    { id: 'documents', label: 'Documents', icon: FaFileAlt },
    { id: 'security', label: 'Security', icon: FaShieldAlt },
    { id: 'permissions', label: 'Permissions', icon: FaKey }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                <FaUser className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Profile</h1>
                <p className="text-gray-600">
                  Manage your personal and company information
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaUserTie className="text-gray-400" />
                <span className="capitalize">{user.role?.replace('_', ' ') || 'User'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  Personal Information
                </h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <FaEdit className="text-sm" />
                    Edit Profile
                  </button>
                )}
              </div>
              
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <FaSave className="text-sm" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <FaTimes className="text-sm" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <FaUser className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium text-gray-900">
                          {profile.user?.firstName || ''} {profile.user?.lastName || ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FaEnvelope className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{profile.user?.email || 'No email'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FaPhone className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">{profile.user?.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <FaBriefcase className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(profile.role)}`}>
                          {profile.role}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FaBuilding className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium text-gray-900">{profile.department || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <FaIdCard className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Position</p>
                        <p className="font-medium text-gray-900">{profile.position || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Company Information Tab */}
          {activeTab === 'company' && partnerInfo && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaBuilding className="text-blue-600" />
                  Company Information
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getApprovalColor(partnerInfo.isApproved)}`}>
                    {partnerInfo.isApproved ? 'Approved' : 'Pending Approval'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(partnerInfo.isActive)}`}>
                    {partnerInfo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaBuilding className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Company Name</p>
                      <p className="font-medium text-gray-900">{partnerInfo.companyName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaBriefcase className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Business Type</p>
                      <p className="font-medium text-gray-900">{getBusinessTypeLabel(partnerInfo.businessType)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{partnerInfo.email || partnerInfo.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaPhone className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{partnerInfo.phone}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {partnerInfo.website && (
                    <div className="flex items-center gap-3">
                      <FaGlobe className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a href={partnerInfo.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-800">
                          {partnerInfo.website}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">
                        {partnerInfo.address}, {partnerInfo.city}, {partnerInfo.postalCode}
                      </p>
                    </div>
                  </div>
                  
                  {partnerInfo.taxId && (
                    <div className="flex items-center gap-3">
                      <FaIdCard className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Tax ID</p>
                        <p className="font-medium text-gray-900">{partnerInfo.taxId}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium text-gray-900">{formatDate(partnerInfo.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Business Details Tab */}
          {activeTab === 'business' && partnerInfo && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <FaBriefcase className="text-blue-600" />
                Business Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FaCar className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Fleet Size</p>
                      <p className="font-medium text-gray-900">{partnerInfo.fleetSize || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaRoute className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Estimated Monthly Rides</p>
                      <p className="font-medium text-gray-900">{partnerInfo.estimatedMonthlyRides || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FaPoundSign className="text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Commission Rate</p>
                      <p className="font-medium text-gray-900">{partnerInfo.commissionRate || 'Not specified'}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {partnerInfo.operatingAreas && partnerInfo.operatingAreas.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Operating Areas</p>
                      <div className="flex flex-wrap gap-1">
                        {partnerInfo.operatingAreas.map((area, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {partnerInfo.vehicleTypes && partnerInfo.vehicleTypes.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Vehicle Types</p>
                      <div className="flex flex-wrap gap-1">
                        {partnerInfo.vehicleTypes.map((type, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && partnerInfo && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <FaFileAlt className="text-blue-600" />
                Company Documents
              </h2>
              
              {partnerInfo.documents ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(partnerInfo.documents).map(([key, doc]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaFileContract className="text-gray-400" />
                          <span className="font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(doc.uploaded_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <FaEye className="w-3 h-3" />
                          View
                        </a>
                        <a
                          href={doc.url}
                          download
                          className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                        >
                          <FaDownload className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaFileAlt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <FaShieldAlt className="text-blue-600" />
                Security Settings
              </h2>
              
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <button
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <FaSave className="text-sm" />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
                <FaKey className="text-blue-600" />
                My Permissions
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(profile.permissions || {}).map(([key, value]) => {
                  if (!key.startsWith('can')) return null;
                  
                  const labels: Record<string, string> = {
                    canViewFleet: 'View Fleet',
                    canManageFleet: 'Manage Fleet',
                    canViewStaff: 'View Staff',
                    canManageStaff: 'Manage Staff',
                    canViewBookings: 'View Bookings',
                    canManageBookings: 'Manage Bookings',
                    canViewClaims: 'View Claims',
                    canManageClaims: 'Manage Claims',
                    canViewFinancials: 'View Financials',
                    canViewAnalytics: 'View Analytics',
                    canManageDocuments: 'Manage Documents'
                  };
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm text-gray-600">{labels[key] || key}</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        value 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        {value ? <FaCheck className="w-3 h-3 mr-1" /> : <FaTimesIcon className="w-3 h-3 mr-1" />}
                        {value ? 'Allowed' : 'Denied'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 