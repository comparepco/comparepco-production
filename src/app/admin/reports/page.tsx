'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import {
  FaFileAlt, FaDownload, FaChartBar, FaCalendar, FaSearch,
  FaFilter, FaEye, FaPrint, FaShare, FaClock, FaUser,
  FaMoneyBillWave, FaTruck, FaHandshake, FaHeadset, FaCheck,
  FaTimes, FaSort, FaSortUp, FaSortDown, FaRedo, FaPlus
} from 'react-icons/fa';

interface Report {
  id: string;
  name: string;
  type: 'financial' | 'operational' | 'analytical' | 'compliance' | 'performance';
  category: 'revenue' | 'bookings' | 'fleet' | 'drivers' | 'partners' | 'support' | 'general';
  status: 'scheduled' | 'generated' | 'failed' | 'archived';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  size: number;
  generated_at?: string;
  scheduled_for?: string;
  created_by: string;
  description: string;
  parameters: Record<string, any>;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export default function ReportsPage() {
  const { 
    canView, 
    canEdit, 
    canDelete, 
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (canView('reports')) {
      loadReports();
    }
  }, [canView]);

  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('Loading reports...');
      
      // Simulate reports data
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Monthly Revenue Report',
          type: 'financial',
          category: 'revenue',
          status: 'generated',
          format: 'pdf',
          size: 2048576,
          generated_at: '2024-01-20T10:00:00Z',
          created_by: 'Admin User',
          description: 'Comprehensive monthly revenue analysis',
          parameters: { month: '2024-01', include_partners: true },
          download_count: 15,
          created_at: '2024-01-20T09:00:00Z',
          updated_at: '2024-01-20T10:00:00Z'
        },
        {
          id: '2',
          name: 'Fleet Utilization Report',
          type: 'operational',
          category: 'fleet',
          status: 'generated',
          format: 'excel',
          size: 1048576,
          generated_at: '2024-01-19T14:30:00Z',
          created_by: 'Fleet Manager',
          description: 'Vehicle utilization and performance metrics',
          parameters: { date_range: 'last_30_days', include_maintenance: true },
          download_count: 8,
          created_at: '2024-01-19T14:00:00Z',
          updated_at: '2024-01-19T14:30:00Z'
        },
        {
          id: '3',
          name: 'Driver Performance Report',
          type: 'performance',
          category: 'drivers',
          status: 'scheduled',
          format: 'pdf',
          size: 0,
          scheduled_for: '2024-01-25T09:00:00Z',
          created_by: 'HR Manager',
          description: 'Driver performance and safety metrics',
          parameters: { quarter: 'Q1-2024', include_ratings: true },
          download_count: 0,
          created_at: '2024-01-18T16:00:00Z',
          updated_at: '2024-01-18T16:00:00Z'
        },
        {
          id: '4',
          name: 'Partner Analytics Report',
          type: 'analytical',
          category: 'partners',
          status: 'generated',
          format: 'csv',
          size: 512000,
          generated_at: '2024-01-17T11:15:00Z',
          created_by: 'Partner Manager',
          description: 'Partner performance and revenue analysis',
          parameters: { year: '2024', include_commission: true },
          download_count: 12,
          created_at: '2024-01-17T11:00:00Z',
          updated_at: '2024-01-17T11:15:00Z'
        },
        {
          id: '5',
          name: 'Support Ticket Analysis',
          type: 'operational',
          category: 'support',
          status: 'generated',
          format: 'excel',
          size: 1536000,
          generated_at: '2024-01-16T15:45:00Z',
          created_by: 'Support Manager',
          description: 'Support ticket trends and resolution metrics',
          parameters: { month: '2024-01', include_responses: true },
          download_count: 6,
          created_at: '2024-01-16T15:00:00Z',
          updated_at: '2024-01-16T15:45:00Z'
        }
      ];
      
      console.log('Reports loaded:', mockReports.length, 'reports');
      setReports(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (reportId: string) => {
    if (!canEdit('reports')) {
      return;
    }

    try {
      // Simulate report generation
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: 'generated',
              generated_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : report
      ));
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!canDelete('reports')) {
      return;
    }

    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      setReports(prev => prev.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'generated': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-blue-100 text-blue-800';
      case 'analytical': return 'bg-purple-100 text-purple-800';
      case 'compliance': return 'bg-orange-100 text-orange-800';
      case 'performance': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.created_by.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !filterType || report.type === filterType;
    const matchesCategory = !filterCategory || report.category === filterCategory;
    const matchesStatus = !filterStatus || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    const aValue = (a as any)[sortBy] ?? '';
    const bValue = (b as any)[sortBy] ?? '';
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const stats = {
    total: reports.length,
    generated: reports.filter(r => r.status === 'generated').length,
    scheduled: reports.filter(r => r.status === 'scheduled').length,
    failed: reports.filter(r => r.status === 'failed').length,
    totalDownloads: reports.reduce((sum, r) => sum + r.download_count, 0),
    totalSize: reports.reduce((sum, r) => sum + r.size, 0)
  };

  if (!canView('reports')) {
    return (
      <div className="p-8 text-center">
        <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view reports.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="reports">
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Generate and manage system reports</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={loadReports}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaRedo className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                {canEdit('reports') && (
                  <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <FaPlus className="w-4 h-4 mr-2" />
                    New Report
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaFileAlt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Generated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.generated}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaDownload className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Downloads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaChartBar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Size</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(stats.totalSize)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="financial">Financial</option>
                  <option value="operational">Operational</option>
                  <option value="analytical">Analytical</option>
                  <option value="compliance">Compliance</option>
                  <option value="performance">Performance</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="revenue">Revenue</option>
                  <option value="bookings">Bookings</option>
                  <option value="fleet">Fleet</option>
                  <option value="drivers">Drivers</option>
                  <option value="partners">Partners</option>
                  <option value="support">Support</option>
                  <option value="general">General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="generated">Generated</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="failed">Failed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="created_at">Created Date</option>
                  <option value="name">Name</option>
                  <option value="type">Type</option>
                  <option value="status">Status</option>
                  <option value="download_count">Downloads</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading reports...</p>
              </div>
            ) : sortedReports.length === 0 ? (
              <div className="p-8 text-center">
                <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Report Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Downloads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {report.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {report.description}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Created by {report.created_by} • {new Date(report.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.type)}`}>
                            {report.type.toUpperCase()}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {report.category}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                            {report.status.toUpperCase()}
                          </span>
                          {report.generated_at && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(report.generated_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatFileSize(report.size)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {report.format.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.download_count}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {/* View report */}}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              title="View report"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            {report.status === 'generated' && (
                              <button
                                onClick={() => {/* Download report */}}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Download report"
                              >
                                <FaDownload className="w-4 h-4" />
                              </button>
                            )}
                            {report.status === 'scheduled' && canEdit('reports') && (
                              <button
                                onClick={() => handleGenerateReport(report.id)}
                                className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                                title="Generate now"
                              >
                                <FaCheck className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete('reports') && (
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete report"
                              >
                                <FaTimes className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 