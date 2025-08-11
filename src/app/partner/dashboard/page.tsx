'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { 
  FaCar, FaMoneyBillWave, FaChartBar, FaChartPie,
  FaClock, FaPlus, FaCog, FaTrash, FaSave,
  FaArrowUp, FaArrowDown, FaTimes
} from 'react-icons/fa';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
         XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'progress' | 'calendar';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data: any;
  settings?: any;
}

interface DashboardData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    trend: any[];
  };
  fleet: {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    status: any[];
  };
  bookings: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    timeline: any[];
  };
  staff: {
    total: number;
    active: number;
    performance: any[];
  };
  alerts: {
    critical: number;
    warnings: number;
    info: number;
    items: any[];
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    items: any[];
  };
}

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Initialize default widgets
  useEffect(() => {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'revenue-overview',
        type: 'metric',
        title: 'Total Revenue',
        size: 'medium',
        position: { x: 0, y: 0 },
        data: { value: 0, change: 0, trend: 'up' }
      },
      {
        id: 'fleet-status',
        type: 'chart',
        title: 'Fleet Status',
        size: 'medium',
        position: { x: 1, y: 0 },
        data: []
      },
      {
        id: 'active-bookings',
        type: 'metric',
        title: 'Active Bookings',
        size: 'small',
        position: { x: 2, y: 0 },
        data: { value: 0, change: 0 }
      },
      {
        id: 'revenue-trend',
        type: 'chart',
        title: 'Revenue Trend',
        size: 'large',
        position: { x: 0, y: 1 },
        data: []
      },
      {
        id: 'staff-performance',
        type: 'chart',
        title: 'Staff Performance',
        size: 'medium',
        position: { x: 1, y: 1 },
        data: []
      },
      {
        id: 'alerts-overview',
        type: 'list',
        title: 'Recent Alerts',
        size: 'small',
        position: { x: 2, y: 1 },
        data: []
      },
      {
        id: 'task-progress',
        type: 'progress',
        title: 'Task Progress',
        size: 'medium',
        position: { x: 0, y: 2 },
        data: { completed: 0, total: 0, percentage: 0 }
      },
      {
        id: 'booking-timeline',
        type: 'chart',
        title: 'Booking Timeline',
        size: 'large',
        position: { x: 1, y: 2 },
        data: []
      }
    ];
    setWidgets(defaultWidgets);
  }, []);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel for better performance
      const [revenueResult, fleetResult, bookingsResult, staffResult] = await Promise.all([
        supabase.from('bookings').select('amount, created_at, status').eq('partner_id', user?.id),
        supabase.from('vehicles').select('*').eq('partner_id', user?.id),
        supabase.from('bookings').select('*').eq('partner_id', user?.id),
        supabase.from('partner_staff').select('*').eq('partner_id', user?.id)
      ]);

      const revenueData = revenueResult.data || [];
      const fleetData = fleetResult.data || [];
      const bookingsData = bookingsResult.data || [];
      const staffData = staffResult.data || [];

      // Process data efficiently
      const processedData: DashboardData = {
        revenue: {
          total: revenueData.reduce((sum, booking) => sum + (booking.amount || 0), 0),
          monthly: revenueData.filter(b => {
            const date = new Date(b.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).reduce((sum, booking) => sum + (booking.amount || 0), 0),
          growth: calculateGrowth(revenueData),
          trend: generateRevenueTrend(bookingsData)
        },
        fleet: {
          total: fleetData.length,
          active: fleetData.filter(v => v.is_active).length,
          inactive: fleetData.filter(v => !v.is_active).length,
          maintenance: fleetData.filter(v => v.status === 'maintenance').length,
          status: generateFleetStatusData(fleetData)
        },
        bookings: {
          total: bookingsData.length,
          active: bookingsData.filter(b => b.status === 'active').length,
          pending: bookingsData.filter(b => b.status === 'pending').length,
          completed: bookingsData.filter(b => b.status === 'completed').length,
          timeline: generateBookingTimeline(bookingsData)
        },
        staff: {
          total: staffData.length,
          active: staffData.filter(s => s.is_active).length,
          performance: generateStaffPerformance(staffData)
        },
        alerts: {
          critical: 2,
          warnings: 5,
          info: 8,
          items: generateAlerts(fleetData, bookingsData)
        },
        tasks: {
          total: 15,
          completed: 8,
          pending: 7,
          items: generateTasks(fleetData, staffData)
        }
      };

      setDashboardData(processedData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user, loadDashboardData]);

  // Helper function to calculate growth
  const calculateGrowth = (revenueData: any[]) => {
    if (!revenueData || revenueData.length === 0) return 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const currentMonthRevenue = revenueData.filter(b => {
      const date = new Date(b.created_at);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).reduce((sum, b) => sum + (b.amount || 0), 0);
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthRevenue = revenueData.filter(b => {
      const date = new Date(b.created_at);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    }).reduce((sum, b) => sum + (b.amount || 0), 0);
    
    return previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
  };

  // Real data generators
  const generateRevenueTrend = (bookingsData: any[]) => {
    if (!bookingsData || bookingsData.length === 0) return [];
    
    const currentDate = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthBookings = bookingsData.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate.getMonth() === month.getMonth() && bookingDate.getFullYear() === month.getFullYear();
      });
      const monthRevenue = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      months.push({
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      });
    }
    
    return months;
  };

  const generateFleetStatusData = (fleetData: any[]) => {
    const statusCounts = {
      active: fleetData.filter(v => v.is_active).length,
      inactive: fleetData.filter(v => !v.is_active).length,
      maintenance: fleetData.filter(v => v.status === 'maintenance').length,
      outOfService: fleetData.filter(v => v.status === 'out_of_service').length
    };

    return [
      { name: 'Active', value: statusCounts.active, color: '#10B981' },
      { name: 'Inactive', value: statusCounts.inactive, color: '#6B7280' },
      { name: 'Maintenance', value: statusCounts.maintenance, color: '#F59E0B' },
      { name: 'Out of Service', value: statusCounts.outOfService, color: '#EF4444' }
    ];
  };

  const generateBookingTimeline = (bookingsData: any[]) => {
    if (!bookingsData || bookingsData.length === 0) return [];
    
    const currentDate = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dayBookings = bookingsData.filter(b => {
        const bookingDate = new Date(b.created_at);
        return bookingDate.toDateString() === date.toDateString();
      });
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        bookings: dayBookings.length
      });
    }
    
    return days;
  };

  const generateStaffPerformance = (staffData: any[]) => {
    if (!staffData || staffData.length === 0) return [];
    
    return staffData.map(staff => ({
      name: staff.first_name && staff.last_name ? `${staff.first_name} ${staff.last_name}` : staff.name || 'Staff Member',
      performance: staff.is_active ? 85 : 60, // Based on active status
      tasks: staff.role === 'manager' ? 15 : staff.role === 'supervisor' ? 12 : 8 // Based on role
    }));
  };

  const generateAlerts = (vehiclesData: any[], bookingsData: any[]) => {
    const alerts = [];
    
    // Check for vehicles needing maintenance
    const maintenanceVehicles = vehiclesData?.filter(v => v.status === 'maintenance') || [];
    if (maintenanceVehicles.length > 0) {
      alerts.push({
        id: 1,
        type: 'critical',
        message: `${maintenanceVehicles.length} vehicle(s) under maintenance`,
        time: '2 hours ago'
      });
    }
    
    // Check for recent bookings
    const recentBookings = bookingsData?.filter(b => {
      const bookingDate = new Date(b.created_at);
      const hoursAgo = (new Date().getTime() - bookingDate.getTime()) / (1000 * 60 * 60);
      return hoursAgo < 24;
    }) || [];
    
    if (recentBookings.length > 0) {
      alerts.push({
        id: 2,
        type: 'info',
        message: `${recentBookings.length} new booking(s) received`,
        time: '3 hours ago'
      });
    }
    
    // Check for vehicles with low fuel or other issues
    const lowFuelVehicles = vehiclesData?.filter(v => v.fuel_level && v.fuel_level < 20) || [];
    if (lowFuelVehicles.length > 0) {
      alerts.push({
        id: 3,
        type: 'warning',
        message: `${lowFuelVehicles.length} vehicle(s) with low fuel`,
        time: '1 day ago'
      });
    }
    
    return alerts;
  };

  const generateTasks = (fleetData: any[], staffData: any[]) => {
    const tasks = [];
    
    // Generate tasks based on fleet data
    const maintenanceVehicles = fleetData?.filter(v => v.status === 'maintenance') || [];
    if (maintenanceVehicles.length > 0) {
      tasks.push({
        id: 1,
        title: `Complete maintenance for ${maintenanceVehicles.length} vehicle(s)`,
        status: 'pending',
        priority: 'high'
      });
    }
    
    // Generate tasks based on staff data
    const newStaff = staffData?.filter(s => {
      const createdDate = new Date(s.created_at);
      const daysSinceCreated = (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated < 7;
    }) || [];
    
    if (newStaff.length > 0) {
      tasks.push({
        id: 2,
        title: `Complete onboarding for ${newStaff.length} new staff member(s)`,
        status: 'pending',
        priority: 'medium'
      });
    }
    
    // Add general tasks
    tasks.push({
      id: 3,
      title: 'Review monthly performance reports',
      status: 'pending',
      priority: 'medium'
    });
    
    return tasks;
  };

  // Widget rendering functions
  const renderMetricWidget = (widget: DashboardWidget) => {
    const data = widget.data;
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
          <div className="flex space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FaCog className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {widget.id === 'revenue-overview' ? `£${data.value?.toLocaleString()}` : data.value}
          </div>
          <div className="flex items-center justify-center space-x-2">
            {data.change > 0 ? (
              <FaArrowUp className="w-4 h-4 text-green-500" />
            ) : (
              <FaArrowDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${data.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(data.change)}% from last month
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderChartWidget = (widget: DashboardWidget) => {
    const data = widget.data;
    
    if (widget.id === 'fleet-status') {
      return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
            <div className="flex space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <FaCog className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {data.map((item: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (widget.id === 'revenue-trend') {
      return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
            <div className="flex space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <FaCog className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (widget.id === 'booking-timeline') {
      return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
            <div className="flex space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <FaCog className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  const renderListWidget = (widget: DashboardWidget) => {
    const data = widget.data;
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
          <div className="flex space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FaCog className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {data.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'critical' ? 'bg-red-500' :
                  item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <span className="text-sm text-gray-700">{item.message}</span>
              </div>
              <span className="text-xs text-gray-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProgressWidget = (widget: DashboardWidget) => {
    const data = widget.data;
    
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{widget.title}</h3>
          <div className="flex space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FaCog className="w-4 h-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">{data.percentage}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${data.percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{data.completed} completed</span>
            <span>{data.total} total</span>
          </div>
        </div>
      </div>
    );
  };

  // Memoized widget renderer for better performance
  const renderWidget = useCallback((widget: DashboardWidget) => {
    switch (widget.type) {
      case 'metric':
        return renderMetricWidget(widget);
      case 'chart':
        return renderChartWidget(widget);
      case 'list':
        return renderListWidget(widget);
      case 'progress':
        return renderProgressWidget(widget);
      default:
        return <div>Unknown widget type</div>;
    }
  }, []);

  // Memoized widget components to prevent unnecessary re-renders
  const MemoizedWidget = React.memo(({ widget }: { widget: DashboardWidget }) => {
    return (
      <div
        className={`${
          widget.size === 'small' ? 'col-span-1' :
          widget.size === 'medium' ? 'col-span-1 md:col-span-1 lg:col-span-1' :
          'col-span-1 md:col-span-2 lg:col-span-2'
        }`}
      >
        {renderWidget(widget)}
      </div>
    );
  });

  // Memoize the processed data to prevent unnecessary re-computations
  const processedData = useMemo(() => {
    if (!dashboardData) return null;
    return dashboardData;
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <FaClock className="w-4 h-4" />
                <span>Last updated: 1 minute ago</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddWidget(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <FaPlus className="w-4 h-4" />
                <span>Add Widget</span>
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <FaSave className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <MemoizedWidget key={widget.id} widget={widget} />
          ))}
        </div>
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="modal-overlay" onClick={() => setShowAddWidget(false)}>
          <div className="modal-content w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Widget</h2>
              <button
                onClick={() => setShowAddWidget(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Charts</h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FaChartBar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Revenue Chart</div>
                        <div className="text-sm text-gray-500">Monthly revenue trends</div>
                      </div>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FaChartPie className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Fleet Status</div>
                        <div className="text-sm text-gray-500">Vehicle status distribution</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Metrics</h3>
                <div className="space-y-2">
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FaMoneyBillWave className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">Total Revenue</div>
                        <div className="text-sm text-gray-500">Overall revenue counter</div>
                      </div>
                    </div>
                  </button>
                  <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <FaCar className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Active Vehicles</div>
                        <div className="text-sm text-gray-500">Currently active fleet</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 