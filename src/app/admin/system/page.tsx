'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Link from 'next/link';
import {
  FaCog, FaServer, FaDatabase, FaCloud, FaShieldAlt,
  FaCheckCircle, FaTimesCircle, FaClock, FaArrowUp, FaArrowDown,
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaPlus,
  FaExclamationTriangle, FaInfoCircle, FaBell, FaFileAlt, FaChartLine
} from 'react-icons/fa';

interface SystemData {
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeConnections: number;
  databaseStatus: 'healthy' | 'warning' | 'error';
  apiStatus: 'healthy' | 'warning' | 'error';
  cacheStatus: 'healthy' | 'warning' | 'error';
  recentLogs: Array<{
    id: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    service: string;
  }>;
  systemMetrics: Array<{
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export default function AdminSystemPage() {
  const { 
    canView, 
    canEdit, 
    canDelete, 
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  const [systemData, setSystemData] = useState<SystemData>({
    uptime: '0',
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    activeConnections: 0,
    databaseStatus: 'healthy',
    apiStatus: 'healthy',
    cacheStatus: 'healthy',
    recentLogs: [],
    systemMetrics: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    if (canView('analytics')) {
      loadSystemData();
      const interval = setInterval(loadSystemData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [canView, refreshInterval]);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      console.log('Loading system data...');
      
      // Simulate system data
      const mockData: SystemData = {
        uptime: '15 days, 8 hours, 32 minutes',
        cpuUsage: 45.2,
        memoryUsage: 67.8,
        diskUsage: 23.4,
        activeConnections: 1247,
        databaseStatus: 'healthy',
        apiStatus: 'healthy',
        cacheStatus: 'healthy',
        recentLogs: [
          {
            id: '1',
            level: 'info',
            message: 'Database backup completed successfully',
            timestamp: '2024-01-20T10:30:00Z',
            service: 'database'
          },
          {
            id: '2',
            level: 'warning',
            message: 'High memory usage detected',
            timestamp: '2024-01-20T10:25:00Z',
            service: 'system'
          },
          {
            id: '3',
            level: 'info',
            message: 'API rate limit reset',
            timestamp: '2024-01-20T10:20:00Z',
            service: 'api'
          }
        ],
        systemMetrics: [
          { name: 'Response Time', value: 245, unit: 'ms', trend: 'down' },
          { name: 'Throughput', value: 1250, unit: 'req/s', trend: 'up' },
          { name: 'Error Rate', value: 0.12, unit: '%', trend: 'stable' },
          { name: 'Cache Hit Rate', value: 89.5, unit: '%', trend: 'up' }
        ]
      };
      
      setSystemData(mockData);
    } catch (error) {
      console.error('Error loading system data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <FaArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <FaArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <FaCheckCircle className="w-4 h-4 text-blue-500" />;
      default: return <FaInfoCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!canView('analytics')) {
    return (
      <div className="p-8 text-center">
        <FaShieldAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view system data.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="analytics">
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor system health and performance</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value={10}>10s refresh</option>
                  <option value={30}>30s refresh</option>
                  <option value={60}>1m refresh</option>
                  <option value={300}>5m refresh</option>
                </select>
                <button
                  onClick={loadSystemData}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaDownload className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaServer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemData.uptime}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaDatabase className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Database</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemData.databaseStatus)}`}>
                    {systemData.databaseStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaCloud className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemData.apiStatus)}`}>
                    {systemData.apiStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaShieldAlt className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cache</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemData.cacheStatus)}`}>
                    {systemData.cacheStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaCog className="w-5 h-5 mr-2 text-blue-500" />
                  System Metrics
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">CPU Usage</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current load</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{systemData.cpuUsage}%</p>
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${systemData.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Memory Usage</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">RAM utilization</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{systemData.memoryUsage}%</p>
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${systemData.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Disk Usage</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Storage space</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{systemData.diskUsage}%</p>
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${systemData.diskUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Active Connections</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current users</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{systemData.activeConnections}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaChartLine className="w-5 h-5 mr-2 text-green-500" />
                  Performance Trends
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {systemData.systemMetrics.map((metric) => (
                    <div key={metric.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{metric.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{metric.unit}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{metric.value}</p>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Logs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FaFileAlt className="w-5 h-5 mr-2 text-orange-500" />
                Recent System Logs
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {systemData.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{log.message}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {log.service} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 