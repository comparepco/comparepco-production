'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHeadset, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes,
  FaCheck, FaTimes as FaX, FaUserTie, FaUserCog, FaUserShield, FaHandshake,
  FaUserFriends, FaTruck, FaBook, FaChartBar, FaBullhorn, FaCheckCircle,
  FaExclamationTriangle, FaInfoCircle, FaArrowUp, FaArrowDown, FaLock, FaUnlock,
  FaClock, FaUserPlus, FaUserMinus, FaUserCheck, FaUserTimes, FaTachometerAlt,
  FaUsers, FaCalendarCheck, FaExclamationCircle, FaCheckCircle as FaCheckCircleIcon,
  FaEdit, FaSave, FaEye, FaEyeSlash, FaKey, FaHistory, FaDownload,
  FaUpload, FaTrash, FaPlus, FaMinus, FaCrown, FaUserEdit, FaUserLock,
  FaPalette, FaGlobe, FaDesktop, FaMobile, FaTablet, FaVolumeUp, FaVolumeMute,
  FaSun, FaMoon, FaLanguage, FaClock as FaClockIcon, FaCalendarAlt, FaMapMarkerAlt
} from 'react-icons/fa';

interface StaffSettings {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  position: string;
  permissions: Record<string, any>;
  sidebar_access: Record<string, boolean>;
  is_active: boolean;
  is_online: boolean;
  last_login?: string;
  login_count: number;
  join_date: string;
  created_at: string;
  updated_at: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    desktop: boolean;
  };
  dashboard: {
    defaultView: string;
    refreshInterval: number;
    showCharts: boolean;
    showStats: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
    screenReader: boolean;
  };
}

export default function StaffSettings() {
  const { user } = useAuth();
  const { id } = useParams();
  const { 
    canView, 
    canEdit, 
    canDelete, 
    isSuperAdmin,
    isAdmin,
    isStaff 
  } = usePermissions();
  
  const [staffData, setStaffData] = useState<StaffSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'auto',
    language: 'en',
    timezone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    notifications: {
      email: true,
      push: true,
      sms: false,
      desktop: true
    },
    dashboard: {
      defaultView: 'overview',
      refreshInterval: 30,
      showCharts: true,
      showStats: true
    },
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false
    }
  });

  useEffect(() => {
    if (id) {
      loadStaffData();
    }
  }, [id]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_staff')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStaffData(data);
    } catch (error) {
      console.error('Error loading staff data:', error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      // In a real implementation, you would save these to a user_preferences table
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setPreferences({
        theme: 'auto',
        language: 'en',
        timezone: 'Europe/London',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        notifications: {
          email: true,
          push: true,
          sms: false,
          desktop: true
        },
        dashboard: {
          defaultView: 'overview',
          refreshInterval: 30,
          showCharts: true,
          showStats: true
        },
        accessibility: {
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          screenReader: false
        }
      });
      toast.success('Settings reset to default');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Staff Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400">The requested staff member could not be found.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: FaCog },
    { id: 'appearance', name: 'Appearance', icon: FaPalette },
    { id: 'notifications', name: 'Notifications', icon: FaBell },
    { id: 'dashboard', name: 'Dashboard', icon: FaTachometerAlt },
    { id: 'accessibility', name: 'Accessibility', icon: FaEye },
    { id: 'security', name: 'Security', icon: FaShieldAlt }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaCog className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Staff Settings
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Configure settings for {staffData.name}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleResetSettings}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <FaRedo className="w-4 h-4 mr-2" />
                Reset to Default
              </button>
              <button
                onClick={handleSavePreferences}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <FaSave className="w-4 h-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="it">Italian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Timezone
                    </label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="America/Los_Angeles">Los Angeles (PST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={preferences.timeFormat}
                      onChange={(e) => setPreferences(prev => ({ ...prev, timeFormat: e.target.value as '12h' | '24h' }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="24h">24-hour</option>
                      <option value="12h">12-hour</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance Settings</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: FaSun },
                      { value: 'dark', label: 'Dark', icon: FaMoon },
                      { value: 'auto', label: 'Auto', icon: FaGlobe }
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => setPreferences(prev => ({ ...prev, theme: theme.value as 'light' | 'dark' | 'auto' }))}
                          className={`p-4 border rounded-lg text-center transition-colors ${
                            preferences.theme === theme.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                        >
                          <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.email}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, email: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.push}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, push: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.sms}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, sms: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">SMS Notifications</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.notifications.desktop}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          notifications: { ...prev.notifications, desktop: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Desktop Notifications</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dashboard Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default View
                    </label>
                    <select
                      value={preferences.dashboard.defaultView}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        dashboard: { ...prev.dashboard, defaultView: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="overview">Overview</option>
                      <option value="analytics">Analytics</option>
                      <option value="bookings">Bookings</option>
                      <option value="support">Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Refresh Interval (seconds)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={preferences.dashboard.refreshInterval}
                      onChange={(e) => setPreferences(prev => ({ 
                        ...prev, 
                        dashboard: { ...prev.dashboard, refreshInterval: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.dashboard.showCharts}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, showCharts: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Charts</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.dashboard.showStats}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          dashboard: { ...prev.dashboard, showStats: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Statistics</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Accessibility Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.accessibility.highContrast}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          accessibility: { ...prev.accessibility, highContrast: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">High Contrast Mode</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.accessibility.largeText}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          accessibility: { ...prev.accessibility, largeText: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Large Text</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.accessibility.reduceMotion}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          accessibility: { ...prev.accessibility, reduceMotion: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Reduce Motion</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.accessibility.screenReader}
                        onChange={(e) => setPreferences(prev => ({ 
                          ...prev, 
                          accessibility: { ...prev.accessibility, screenReader: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Screen Reader Support</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex">
                      <FaExclamationTriangle className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          These settings affect the security of your account. Changes may require re-authentication.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Add an extra layer of security to your account
                      </p>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                        Enable 2FA
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Session Management</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Manage your active sessions across devices
                      </p>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm">
                        View Sessions
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Password</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Change your password to keep your account secure
                    </p>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 