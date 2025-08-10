import React from 'react';
import { 
  FaUserTie, FaEnvelope, FaPhone, FaCheckCircle, FaClock, 
  FaEdit, FaTrash, FaEye, FaKey, FaCalendarAlt, FaMapMarkerAlt,
  FaPoundSign, FaShieldAlt, FaExclamationTriangle, FaBuilding
} from 'react-icons/fa';

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
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  loginCount?: number;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

interface StaffCardProps {
  member: StaffMember;
  onViewDetails: (member: StaffMember) => void;
  onEditPermissions: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
  onToggleStatus: (member: StaffMember) => void;
}

export default function StaffCard({ 
  member, 
  onViewDetails, 
  onEditPermissions, 
  onDelete, 
  onToggleStatus 
}: StaffCardProps) {
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

  const activePermissions = Object.entries(member.permissions)
    .filter(([key, value]) => key.startsWith('can') && value)
    .slice(0, 3); // Show only first 3 permissions

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <FaUserTie className="text-xl" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
              {member.user?.firstName || ''} {member.user?.lastName || ''} || 'Unknown Staff'
            </h3>
            <p className="text-sm font-medium text-blue-600 capitalize">
              {member.role}
            </p>
            {member.department && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FaBuilding className="w-3 h-3" />
                {member.department}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${getStatusColor(member.isActive)}`}>
            {member.isActive ? <FaCheckCircle className="w-3 h-3 mr-1" /> : <FaClock className="w-3 h-3 mr-1" />}
            {member.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaEnvelope className="w-4 h-4 text-gray-400" />
          <span>{member.user?.email || 'No email'}</span>
        </div>
        
        {member.user?.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaPhone className="w-4 h-4 text-gray-400" />
            <span>{member.user.phone}</span>
          </div>
        )}

        {member.startDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaCalendarAlt className="w-4 h-4 text-gray-400" />
            <span>Started: {formatDate(member.startDate)}</span>
          </div>
        )}

        {member.salary && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaPoundSign className="w-4 h-4 text-gray-400" />
            <span>{formatSalary(member.salary)}</span>
          </div>
        )}

        {member.lastLogin && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FaClock className="w-4 h-4 text-gray-400" />
            <span>Last login: {formatDate(member.lastLogin)}</span>
          </div>
        )}
      </div>

      {/* Permissions Preview */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 mb-2">PERMISSIONS</p>
        <div className="flex flex-wrap gap-2">
          {activePermissions.length > 0 ? (
            activePermissions.map(([key, value]) => {
              const labels: Record<string, string> = {
                canManageFleet: 'Fleet',
                canManageDrivers: 'Drivers', 
                canViewReports: 'Reports',
                canManageBookings: 'Bookings',
                canViewFinancials: 'Finance',
                canManageMaintenence: 'Maintenance',
                canManageClaims: 'Claims'
              };
              return (
                <span key={key} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <FaCheckCircle className="w-3 h-3 mr-1" />
                  {labels[key] || key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                </span>
              );
            })
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
              <FaShieldAlt className="w-3 h-3 mr-1" />
              No permissions assigned
            </span>
          )}
          {activePermissions.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              +{Object.entries(member.permissions).filter(([key, value]) => key.startsWith('can') && value).length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditPermissions(member)}
            className="bg-purple-50 hover:bg-purple-100 text-purple-600 p-2 rounded-lg transition-colors duration-200 border border-purple-200 hover:shadow-sm"
            title="Manage Permissions"
          >
            <FaKey className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewDetails(member)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors duration-200 border border-blue-200 hover:shadow-sm"
            title="Manage Details"
          >
            <FaEdit className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(member)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 border hover:shadow-sm ${
              member.isActive 
                ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200' 
                : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
            }`}
          >
            {member.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(member)}
            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors duration-200 border border-red-200 hover:shadow-sm"
            title="Remove Staff"
          >
            <FaTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 