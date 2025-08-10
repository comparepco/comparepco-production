'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaDownload, FaFilter, FaCalendarAlt } from 'react-icons/fa';
import { useStaffManagement } from '@/hooks/useStaffManagement';
import StaffAnalytics from '@/components/partner/StaffAnalytics';

export default function StaffAnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { staff, loading, error } = useStaffManagement();
  const [dateRange, setDateRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-bold text-gray-900">Loading analytics...</div>
      </div>
    );
  }

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
    router.replace('/');
    return null;
  }

  const departments = ['all', ...Array.from(new Set(staff.map(s => s.department).filter(Boolean)))];

  const filteredStaff = staff.filter(member => {
    if (selectedDepartment !== 'all' && member.department !== selectedDepartment) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Staff Analytics</h1>
                <p className="text-gray-600">
                  Comprehensive insights into your team's performance and activity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500">
                <FaDownload /> Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {!error && (
          <StaffAnalytics staff={filteredStaff} />
        )}

        {/* Additional Insights */}
        {!error && staff.length > 0 && (
          <div className="mt-8 space-y-6">
            {/* Staff Growth Trends */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                Staff Growth Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {staff.filter(s => s.startDate && new Date(s.startDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                  </p>
                  <p className="text-sm text-gray-600">New hires (30 days)</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {staff.filter(s => s.isActive).length}
                  </p>
                  <p className="text-sm text-gray-600">Active staff</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {staff.filter(s => s.role === 'manager').length}
                  </p>
                  <p className="text-sm text-gray-600">Management team</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Top Performing Departments</h4>
                  <div className="space-y-2">
                    {Array.from(new Set(staff.map(s => s.department).filter(Boolean)))
                      .map(dept => {
                        const deptStaff = staff.filter(s => s.department === dept);
                        const avgLoginCount = deptStaff.reduce((sum, s) => sum + (s.loginCount || 0), 0) / deptStaff.length;
                        return { dept, avgLoginCount, count: deptStaff.length };
                      })
                      .sort((a, b) => b.avgLoginCount - a.avgLoginCount)
                      .slice(0, 3)
                      .map(({ dept, avgLoginCount, count }) => (
                        <div key={dept} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="font-medium text-gray-700">{dept}</span>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{Math.round(avgLoginCount)} avg logins</p>
                            <p className="text-xs text-gray-500">{count} staff</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Salary Distribution</h4>
                  <div className="space-y-2">
                    {(() => {
                      const salaryRanges = [
                        { min: 0, max: 25000, label: '£0 - £25k' },
                        { min: 25000, max: 50000, label: '£25k - £50k' },
                        { min: 50000, max: 75000, label: '£50k - £75k' },
                        { min: 75000, max: Infinity, label: '£75k+' }
                      ];
                      
                      return salaryRanges.map(range => {
                        const count = staff.filter(s => 
                          (s.salary || 0) >= range.min && (s.salary || 0) < range.max
                        ).length;
                        return { ...range, count };
                      }).filter(r => r.count > 0);
                    })().map(range => (
                      <div key={range.label} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium text-gray-700">{range.label}</span>
                        <span className="text-sm font-medium text-gray-900">{range.count} staff</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 