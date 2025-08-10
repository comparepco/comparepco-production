'use client';

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import Link from 'next/link';
import {
  FaBullhorn, FaChartLine, FaUsers, FaEnvelope, FaCalendar,
  FaCheckCircle, FaTimesCircle, FaClock, FaArrowUp, FaArrowDown,
  FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaPlus,
  FaMoneyBillWave, FaPercent, FaTrophy, FaStar, FaShieldAlt, 
  FaFileAlt, FaCog, FaBell, FaQrcode, FaShare, FaRocket
} from 'react-icons/fa';

interface MarketingData {
  totalCampaigns: number;
  activeCampaigns: number;
  totalReach: number;
  conversionRate: number;
  totalSpent: number;
  roi: number;
  topCampaigns: Array<{
    id: string;
    name: string;
    type: 'email' | 'social' | 'referral' | 'promo';
    reach: number;
    conversions: number;
    spend: number;
    status: 'active' | 'paused' | 'completed';
  }>;
  recentActivities: Array<{
    id: string;
    type: 'campaign_created' | 'email_sent' | 'promo_activated' | 'referral_earned';
    description: string;
    value: number;
    date: string;
  }>;
}

export default function AdminMarketingDashboardPage() {
  const { 
    canView, 
    canEdit, 
    canDelete, 
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  const [marketingData, setMarketingData] = useState<MarketingData>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalReach: 0,
    conversionRate: 0,
    totalSpent: 0,
    roi: 0,
    topCampaigns: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    if (canView('marketing')) {
      loadMarketingData();
    }
  }, [canView, timeRange]);

  const loadMarketingData = async () => {
    try {
      setLoading(true);
      console.log('Loading marketing data...');
      
      // Simulate marketing data
      const mockData: MarketingData = {
        totalCampaigns: 24,
        activeCampaigns: 8,
        totalReach: 125000,
        conversionRate: 3.2,
        totalSpent: 45000,
        roi: 280,
        topCampaigns: [
          {
            id: '1',
            name: 'Summer Vehicle Promotion',
            type: 'promo',
            reach: 25000,
            conversions: 850,
            spend: 8000,
            status: 'active'
          },
          {
            id: '2',
            name: 'Partner Referral Program',
            type: 'referral',
            reach: 18000,
            conversions: 720,
            spend: 5000,
            status: 'active'
          },
          {
            id: '3',
            name: 'Email Newsletter Q1',
            type: 'email',
            reach: 32000,
            conversions: 960,
            spend: 12000,
            status: 'completed'
          }
        ],
        recentActivities: [
          {
            id: '1',
            type: 'campaign_created',
            description: 'New email campaign created',
            value: 0,
            date: '2024-01-20T10:30:00Z'
          },
          {
            id: '2',
            type: 'email_sent',
            description: 'Bulk email sent to 15,000 subscribers',
            value: 15000,
            date: '2024-01-19T14:15:00Z'
          },
          {
            id: '3',
            type: 'promo_activated',
            description: 'New promo code activated',
            value: 0,
            date: '2024-01-18T09:45:00Z'
          }
        ]
      };
      
      setMarketingData(mockData);
    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'social': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'referral': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'promo': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'campaign_created': return <FaBullhorn className="w-4 h-4 text-blue-500" />;
      case 'email_sent': return <FaEnvelope className="w-4 h-4 text-green-500" />;
      case 'promo_activated': return <FaQrcode className="w-4 h-4 text-orange-500" />;
      case 'referral_earned': return <FaShare className="w-4 h-4 text-purple-500" />;
      default: return <FaBell className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!canView('marketing')) {
    return (
      <div className="p-8 text-center">
        <FaShieldAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view marketing data.</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission="marketing">
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marketing Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor campaigns, reach, and marketing performance</p>
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
                  onClick={loadMarketingData}
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
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FaBullhorn className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{marketingData.totalCampaigns}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{marketingData.activeCampaigns} active</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FaUsers className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reach</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{marketingData.totalReach.toLocaleString()}</p>
                  <div className="flex items-center text-sm">
                    <FaArrowUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600 dark:text-green-400">+{marketingData.conversionRate}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <FaMoneyBillWave className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">${marketingData.totalSpent.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">This period</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <FaChartLine className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ROI</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{marketingData.roi}%</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Return on investment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaTrophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Top Campaigns
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {marketingData.topCampaigns.map((campaign, index) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{campaign.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(campaign.type)}`}>
                              {campaign.type}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {campaign.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{campaign.reach.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{campaign.conversions} conversions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <FaBell className="w-5 h-5 mr-2 text-blue-500" />
                  Recent Activities
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {marketingData.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{activity.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {activity.value > 0 && (
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">{activity.value.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/marketing/campaigns" className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                <FaBullhorn className="w-5 h-5 text-blue-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Campaigns</span>
              </Link>
              
              <Link href="/admin/marketing/email" className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <FaEnvelope className="w-5 h-5 text-green-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Email Marketing</span>
              </Link>
              
              <Link href="/admin/marketing/promotions" className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                <FaQrcode className="w-5 h-5 text-purple-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Promotions</span>
              </Link>
              
              <Link href="/admin/marketing/referral" className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                <FaShare className="w-5 h-5 text-orange-600 mr-3" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Referral Program</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 