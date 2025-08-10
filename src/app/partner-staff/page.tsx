'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { 
  FaTachometerAlt, FaCar, FaCalendarAlt, FaUsers, FaMoneyBillWave,
  FaChartLine, FaChartBar, FaChartPie, FaExclamationTriangle, FaCheckCircle,
  FaClock, FaPlus, FaCog, FaExpand, FaCompress, FaTrash, FaSave,
  FaArrowUp, FaArrowDown, FaEye, FaEdit, FaCalendar, FaBell, FaTimes,
  FaBuilding, FaUserTie, FaPhone, FaEnvelope, FaMapMarkerAlt, FaWrench,
  FaGasPump, FaReceipt, FaCloud, FaRoute, FaShieldAlt, FaTools,
  FaDownload, FaFilePdf, FaFileExcel, FaSync, FaGripVertical, FaUserCog
} from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StaffMember {
  id: string;
  partner_id: string;
  user_id: string;
  role: string;
  department: string;
  position: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  permissions: any;
  employment_status: string;
  performance_rating: number;
}

interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'progress' | 'calendar' | 'maintenance' | 'driver' | 'fuel' | 'expense' | 'notification' | 'quick-action' | 'weather' | 'map' | 'schedule' | 'analytics';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: WidgetPosition;
  data: any;
  settings?: any;
  requiredRole?: string;
  requiredPermission?: string;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [staffData, setStaffData] = useState<StaffMember | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load staff data and determine role-based widgets
  useEffect(() => {
    if (!user) return;
    loadStaffData();
  }, [user]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      
      // Get staff member data
      const { data: staffMember, error } = await supabase
        .from('partner_staff')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      setStaffData(staffMember);
      
      // Set role-based widgets
      setWidgets(getRoleBasedWidgets(staffMember));
      
    } catch (error) {
      console.error('Error loading staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBasedWidgets = (staff: StaffMember): DashboardWidget[] => {
    const baseWidgets: DashboardWidget[] = [
      {
        id: 'personal-schedule',
        type: 'schedule',
        title: 'My Schedule',
        size: 'medium',
        position: { x: 0, y: 0, w: 1, h: 1 },
        data: { today: [], upcoming: [] },
        requiredRole: 'all'
      },
      {
        id: 'notifications',
        type: 'notification',
        title: 'My Notifications',
        size: 'small',
        position: { x: 1, y: 0, w: 1, h: 1 },
        data: { unread: 0, items: [] },
        requiredRole: 'all'
      },
      {
        id: 'task-progress',
        type: 'progress',
        title: 'My Tasks',
        size: 'medium',
        position: { x: 2, y: 0, w: 1, h: 1 },
        data: { completed: 0, total: 0, percentage: 0 },
        requiredRole: 'all'
      }
    ];

    // Role-specific widgets
    switch (staff.role) {
      case 'fleet_manager':
        return [
          ...baseWidgets,
          {
            id: 'fleet-status',
            type: 'chart',
            title: 'Fleet Status',
            size: 'medium',
            position: { x: 0, y: 1, w: 1, h: 1 },
            data: [],
            requiredRole: 'fleet_manager'
          },
          {
            id: 'maintenance-alerts',
            type: 'maintenance',
            title: 'Maintenance Alerts',
            size: 'medium',
            position: { x: 1, y: 1, w: 1, h: 1 },
            data: [],
            requiredRole: 'fleet_manager'
          },
          {
            id: 'vehicle-performance',
            type: 'analytics',
            title: 'Vehicle Performance',
            size: 'large',
            position: { x: 0, y: 2, w: 2, h: 1 },
            data: { utilization: 0, efficiency: 0, trends: [] },
            requiredRole: 'fleet_manager'
          }
        ];

      case 'driver_manager':
        return [
          ...baseWidgets,
          {
            id: 'driver-performance',
            type: 'driver',
            title: 'Driver Performance',
            size: 'medium',
            position: { x: 0, y: 1, w: 1, h: 1 },
            data: [],
            requiredRole: 'driver_manager'
          },
          {
            id: 'driver-schedule',
            type: 'schedule',
            title: 'Driver Schedule',
            size: 'medium',
            position: { x: 1, y: 1, w: 1, h: 1 },
            data: { today: [], upcoming: [] },
            requiredRole: 'driver_manager'
          },
          {
            id: 'driver-analytics',
            type: 'analytics',
            title: 'Driver Analytics',
            size: 'large',
            position: { x: 0, y: 2, w: 2, h: 1 },
            data: { utilization: 0, efficiency: 0, trends: [] },
            requiredRole: 'driver_manager'
          }
        ];

      case 'booking_manager':
        return [
          ...baseWidgets,
          {
            id: 'active-bookings',
            type: 'metric',
            title: 'Active Bookings',
            size: 'small',
            position: { x: 0, y: 1, w: 1, h: 1 },
            data: { value: 0, change: 0 },
            requiredRole: 'booking_manager'
          },
          {
            id: 'booking-timeline',
            type: 'chart',
            title: 'Booking Timeline',
            size: 'large',
            position: { x: 1, y: 1, w: 1, h: 1 },
            data: [],
            requiredRole: 'booking_manager'
          },
          {
            id: 'revenue-overview',
            type: 'metric',
            title: 'Revenue Overview',
            size: 'medium',
            position: { x: 0, y: 2, w: 1, h: 1 },
            data: { value: 0, change: 0, trend: 'up' },
            requiredRole: 'booking_manager'
          }
        ];

      case 'maintenance_technician':
        return [
          ...baseWidgets,
          {
            id: 'maintenance-tasks',
            type: 'maintenance',
            title: 'My Maintenance Tasks',
            size: 'medium',
            position: { x: 0, y: 1, w: 1, h: 1 },
            data: [],
            requiredRole: 'maintenance_technician'
          },
          {
            id: 'parts-inventory',
            type: 'list',
            title: 'Parts Inventory',
            size: 'small',
            position: { x: 1, y: 1, w: 1, h: 1 },
            data: [],
            requiredRole: 'maintenance_technician'
          },
          {
            id: 'maintenance-schedule',
            type: 'schedule',
            title: 'Maintenance Schedule',
            size: 'large',
            position: { x: 0, y: 2, w: 2, h: 1 },
            data: { today: [], upcoming: [] },
            requiredRole: 'maintenance_technician'
          }
        ];

      case 'accountant':
        return [
          ...baseWidgets,
          {
            id: 'expense-overview',
            type: 'expense',
            title: 'Expense Overview',
            size: 'medium',
            position: { x: 0, y: 1, w: 1, h: 1 },
            data: { total: 0, categories: [], monthly: [] },
            requiredRole: 'accountant'
          },
          {
            id: 'revenue-trend',
            type: 'chart',
            title: 'Revenue Trend',
            size: 'large',
            position: { x: 1, y: 1, w: 1, h: 1 },
            data: [],
            requiredRole: 'accountant'
          },
          {
            id: 'fuel-tracking',
            type: 'fuel',
            title: 'Fuel Tracking',
            size: 'small',
            position: { x: 0, y: 2, w: 1, h: 1 },
            data: { totalCost: 0, averageEfficiency: 0, consumption: [] },
            requiredRole: 'accountant'
          }
        ];

      default:
        return baseWidgets;
    }
  };

  // Real-time updates for staff
  useEffect(() => {
    if (!realTimeEnabled || !user) return;

    const interval = setInterval(() => {
      loadStaffData();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [realTimeEnabled, user]);

  // Widget rendering functions (simplified for staff)
  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'metric':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {widget.id === 'revenue-overview' ? `£${widget.data.value?.toLocaleString()}` : widget.data.value}
              </div>
              <div className="flex items-center justify-center space-x-2">
                {widget.data.change > 0 ? (
                  <FaArrowUp className="w-4 h-4 text-green-500" />
                ) : (
                  <FaArrowDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${widget.data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(widget.data.change)}% from last month
                </span>
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
            </div>
            <div className="space-y-3">
              {widget.data.today?.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">{item.task}</span>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'completed' ? 'bg-green-100 text-green-700' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notification':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">{widget.data.unread}</span>
            </div>
            <div className="space-y-3">
              {widget.data.items?.map((item: any) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.type === 'critical' ? 'bg-red-500' :
                    item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">{widget.data.percentage}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${widget.data.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{widget.data.completed} completed</span>
                <span>{widget.data.total} total</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
            </div>
            <p className="text-gray-500">Widget content coming soon...</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading staff dashboard...</p>
        </div>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaUserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Staff Account Not Found
          </h2>
          <p className="text-gray-600">
            Your staff account could not be found. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-sm text-gray-500">
                Welcome, {staffData.first_name} {staffData.last_name} ({staffData.position})
              </p>
              {realTimeEnabled && (
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Real-time Toggle */}
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  realTimeEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={realTimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
              >
                <FaSync className={`w-4 h-4 ${realTimeEnabled ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Notification Bell */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <FaBell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Bar */}
      {realTimeEnabled && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2 text-green-700">
                <FaSync className="w-3 h-3 animate-spin" />
                <span>Real-time updates enabled</span>
              </div>
              <span className="text-green-600">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Staff Info */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600">
                  {staffData.first_name.charAt(0)}{staffData.last_name.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {staffData.first_name} {staffData.last_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {staffData.position} • {staffData.department}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg">
                <FaCheckCircle className="w-4 h-4" />
                <span>Active</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaCog className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={`${
                widget.size === 'small' ? 'col-span-1' :
                widget.size === 'medium' ? 'col-span-1 md:col-span-1 lg:col-span-1' :
                'col-span-1 md:col-span-2 lg:col-span-2'
              }`}
            >
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 