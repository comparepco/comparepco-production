'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Link from 'next/link';
import {
  FaDollarSign, FaChartLine, FaUsers, FaHandshake, FaCalendar,
  FaCheckCircle, FaTimesCircle, FaClock, FaArrowUp, FaArrowDown,
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaPlus,
  FaMoneyBillWave, FaPercent, FaTrophy, FaStar,
  FaShieldAlt, FaFileAlt, FaCog, FaBell
} from 'react-icons/fa';

interface SalesData {
  totalRevenue: number;
  monthlyGrowth: number;
  totalCommissions: number;
  activePartners: number;
  pendingPayouts: number;
  topPerformers: Array<{
    id: string;
    name: string;
    revenue: number;
    commission: number;
    bookings: number;
    rating: number;
  }>;
  recentTransactions: Array<{
    id: string;
    partner: string;
    amount: number;
    type: 'commission' | 'payout' | 'bonus';
    status: 'pending' | 'completed' | 'failed';
    date: string;
  }>;
}

export default function AdminSalesDashboardPage() {
  const { 
    canView, 
    canEdit, 
    canDelete, 
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  const [salesData, setSalesData] = useState<SalesData>({
    totalRevenue: 0,
    monthlyGrowth: 0,
    totalCommissions: 0,
    activePartners: 0,
    pendingPayouts: 0,
    topPerformers: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (canView('sales')) {
      loadSalesData();
    }
  }, [canView, timeRange]);

  const loadSalesData = async () => {
    try {
      setLoading(true);
      console.log('Loading sales data...');
      
      // Simulate sales data
      const mockData: SalesData = {
        totalRevenue: 2847500,
        monthlyGrowth: 12.5,
        totalCommissions: 427125,
        activePartners: 156,
        pendingPayouts: 89250,
        topPerformers: [
          {
            id: '1',
            name: 'Premium Auto Partners',
            revenue: 285000,
            commission: 42750,
            bookings: 142,
            rating: 4.8
          },
          {
            id: '2',
            name: 'Elite Fleet Solutions',
            revenue: 198000,
            commission: 29700,
            bookings: 99,
            rating: 4.6
          },
          {
            id: '3',
            name: 'City Car Rentals',
            revenue: 165000,
            commission: 24750,
            bookings: 83,
            rating: 4.7
          }
        ],
        recentTransactions: [
          {
            id: '1',
            partner: 'Premium Auto Partners',
            amount: 42750,
            type: 'commission',
            status: 'completed',
            date: '2024-01-20T10:30:00Z'
          },
          {
            id: '2',
            partner: 'Elite Fleet Solutions',
            amount: 29700,
            type: 'payout',
            status: 'pending',
            date: '2024-01-19T14:15:00Z'
          },
          {
            id: '3',
            partner: 'City Car Rentals',
            amount: 5000,
            type: 'bonus',
            status: 'completed',
            date: '2024-01-18T09:45:00Z'
          }
        ]
      };
      
      setSalesData(mockData);
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'commission': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'payout': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'bonus': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!canView('sales')) {
    return (
      <div className="p-8 text-center">
        <FaShieldAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view sales data.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="sales">
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor revenue, commissions, and partner performance</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
                <button
                  onClick={loadSalesData}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaDownload className="w-4 h-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaDollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${salesData.totalRevenue.toLocaleString()}</p>
                  <div className="flex items-center text-sm">
                    <FaArrowUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 dark:text-green-400">+{salesData.monthlyGrowth}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaMoneyBillWave className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Commissions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${salesData.totalCommissions.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">15% of revenue</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaHandshake className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Partners</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{salesData.activePartners}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Generating revenue</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaClock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${salesData.pendingPayouts.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due this week</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaTrophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Performers
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {salesData.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{performer.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{performer.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">${performer.revenue.toLocaleString()}</p>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <FaStar className="w-3 h-3 text-yellow-400 mr-1" />
                          {performer.rating}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaFileAlt className="w-5 h-5 mr-2 text-blue-500" />
                  Recent Transactions
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {salesData.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.partner}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">${transaction.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/admin/sales/commission" className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                <FaPercent className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Commission Management</span>
              </Link>
              
              <Link href="/admin/sales/payouts" className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <FaMoneyBillWave className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Payout Management</span>
              </Link>
              
              <Link href="/admin/sales/reports" className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                <FaChartLine className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Sales Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 