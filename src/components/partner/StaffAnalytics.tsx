import React from 'react';
import { 
  FaUsers, FaUserTie, FaUserShield, FaCheckCircle, FaClock, 
  FaChartLine, FaCalendarAlt, FaPoundSign, FaBuilding, FaStar, FaShieldAlt
} from 'react-icons/fa';

interface StaffMember {
  id: string;
  role: string;
  department?: string;
  salary?: number;
  startDate?: string;
  isActive: boolean;
  lastLogin?: string;
  loginCount?: number;
  permissions: Record<string, boolean>;
}

interface StaffAnalyticsProps {
  staff: StaffMember[];
}

export default function StaffAnalytics({ staff }: StaffAnalyticsProps) {
  const activeStaff = staff.filter(s => s.isActive);
  const inactiveStaff = staff.filter(s => !s.isActive);
  
  const totalSalary = staff.reduce((sum, member) => sum + (member.salary || 0), 0);
  const avgSalary = staff.length > 0 ? totalSalary / staff.length : 0;
  
  const roleDistribution = staff.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const departmentDistribution = staff.reduce((acc, member) => {
    const dept = member.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const permissionStats = staff.reduce((acc, member) => {
    Object.entries(member.permissions).forEach(([key, value]) => {
      if (key.startsWith('can') && value) {
        acc[key] = (acc[key] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);
  
  const recentLogins = staff.filter(s => s.lastLogin && 
    new Date(s.lastLogin).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length;
  
  const avgLoginCount = staff.length > 0 ? 
    staff.reduce((sum, s) => sum + (s.loginCount || 0), 0) / staff.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <FaUsers />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Staff</p>
              <p className="text-xl font-bold text-gray-900">{staff.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-600 p-2 rounded-lg">
              <FaCheckCircle />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">{activeStaff.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
              <FaUserShield />
            </div>
            <div>
              <p className="text-sm text-gray-600">Managers</p>
              <p className="text-xl font-bold text-gray-900">{roleDistribution.manager || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
              <FaPoundSign />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Salary</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(avgSalary)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaUserTie className="text-blue-600" />
            Role Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(roleDistribution).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="font-medium text-gray-700 capitalize">{role}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / staff.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaBuilding className="text-green-600" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(departmentDistribution).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{dept}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(count / staff.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Usage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-purple-600" />
            Permission Usage
          </h3>
          <div className="space-y-3">
            {Object.entries(permissionStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([permission, count]) => (
                <div key={permission} className="flex items-center justify-between">
                  <span className="font-medium text-gray-700 text-sm">
                    {permission.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(count / staff.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartLine className="text-orange-600" />
            Activity Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Recent Logins (7 days)</span>
              <span className="text-lg font-bold text-gray-900">{recentLogins}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Avg Login Count</span>
              <span className="text-lg font-bold text-gray-900">{Math.round(avgLoginCount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Active Rate</span>
              <span className="text-lg font-bold text-gray-900">
                {staff.length > 0 ? Math.round((activeStaff.length / staff.length) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Total Salary Budget</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(totalSalary)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {staff.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaCalendarAlt className="text-blue-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {staff
              .filter(s => s.lastLogin)
              .sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())
              .slice(0, 5)
              .map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <FaUserTie className="text-sm" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.role}</p>
                      <p className="text-sm text-gray-600">
                        Last login: {formatDate(member.lastLogin!)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {member.loginCount || 0} logins
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{member.department}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
} 