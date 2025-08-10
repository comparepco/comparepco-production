'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { 
  FaTachometerAlt, FaCar, FaCalendarAlt, FaUsers, FaMoneyBillWave,
  FaChartLine, FaChartBar, FaChartPie, FaExclamationTriangle, FaCheckCircle,
  FaClock, FaPlus, FaCog, FaExpand, FaCompress, FaTrash, FaSave,
  FaArrowUp, FaArrowDown, FaEye, FaEdit, FaCalendar, FaBell, FaTimes
} from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

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
  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load revenue data
      const { data: revenueData } = await supabase
        .from('bookings')
        .select('amount, created_at, status')
        .eq('partner_id', user?.id);

      // Load fleet data
      const { data: fleetData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', user?.id);

      // Load bookings data
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', user?.id);

      // Load staff data
      const { data: staffData } = await supabase
        .from('partner_staff')
        .select('*')
        .eq('partner_id', user?.id);

      // Process data
      const processedData: DashboardData = {
        revenue: {
          total: revenueData?.reduce((sum, booking) => sum + (booking.amount || 0), 0) || 0,
          monthly: revenueData?.filter(b => {
            const date = new Date(b.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).reduce((sum, booking) => sum + (booking.amount || 0), 0) || 0,
          growth: 12.5, // Mock data
          trend: generateRevenueTrend()
        },
        fleet: {
          total: fleetData?.length || 0,
          active: fleetData?.filter(v => v.is_active).length || 0,
          inactive: fleetData?.filter(v => !v.is_active).length || 0,
          maintenance: fleetData?.filter(v => v.status === 'maintenance').length || 0,
          status: generateFleetStatusData(fleetData || [])
        },
        bookings: {
          total: bookingsData?.length || 0,
          active: bookingsData?.filter(b => b.status === 'active').length || 0,
          pending: bookingsData?.filter(b => b.status === 'pending').length || 0,
          completed: bookingsData?.filter(b => b.status === 'completed').length || 0,
          timeline: generateBookingTimeline(bookingsData || [])
        },
        staff: {
          total: staffData?.length || 0,
          active: staffData?.filter(s => s.is_active).length || 0,
          performance: generateStaffPerformance(staffData || [])
        },
        alerts: {
          critical: 2,
          warnings: 5,
          info: 8,
          items: generateAlerts()
        },
        tasks: {
          total: 15,
          completed: 8,
          pending: 7,
          items: generateTasks()
        }
      };

      setDashboardData(processedData);
      
      // Update widgets with real data
      setWidgets(prevWidgets => prevWidgets.map(widget => {
        switch (widget.id) {
          case 'revenue-overview':
            return {
              ...widget,
              data: {
                value: processedData.revenue.total,
                change: processedData.revenue.growth,
                trend: processedData.revenue.growth > 0 ? 'up' : 'down'
              }
            };
          case 'fleet-status':
            return {
              ...widget,
              data: processedData.fleet.status
            };
          case 'active-bookings':
            return {
              ...widget,
              data: {
                value: processedData.bookings.active,
                change: ((processedData.bookings.active / processedData.bookings.total) * 100) || 0
              }
            };
          case 'revenue-trend':
            return {
              ...widget,
              data: processedData.revenue.trend
            };
          case 'booking-timeline':
            return {
              ...widget,
              data: processedData.bookings.timeline
            };
          case 'alerts-overview':
            return {
              ...widget,
              data: processedData.alerts.items
            };
          case 'task-progress':
            return {
              ...widget,
              data: {
                completed: processedData.tasks.completed,
                total: processedData.tasks.total,
                percentage: processedData.tasks.total > 0 ? Math.round((processedData.tasks.completed / processedData.tasks.total) * 100) : 0
              }
            };
          default:
            return widget;
        }
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data generators
  const generateRevenueTrend = () => {
    return [
      { month: 'Jan', revenue: 12000 },
      { month: 'Feb', revenue: 15000 },
      { month: 'Mar', revenue: 18000 },
      { month: 'Apr', revenue: 22000 },
      { month: 'May', revenue: 25000 },
      { month: 'Jun', revenue: 28000 }
    ];
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
    return [
      { day: 'Mon', bookings: 5 },
      { day: 'Tue', bookings: 8 },
      { day: 'Wed', bookings: 12 },
      { day: 'Thu', bookings: 10 },
      { day: 'Fri', bookings: 15 },
      { day: 'Sat', bookings: 18 },
      { day: 'Sun', bookings: 6 }
    ];
  };

  const generateStaffPerformance = (staffData: any[]) => {
    return staffData.map(staff => ({
      name: staff.name || 'Staff Member',
      performance: Math.floor(Math.random() * 100) + 50,
      tasks: Math.floor(Math.random() * 20) + 5
    }));
  };

  const generateAlerts = () => {
    return [
      { id: 1, type: 'critical', message: 'Vehicle maintenance overdue', time: '2 hours ago' },
      { id: 2, type: 'warning', message: 'Insurance renewal due soon', time: '1 day ago' },
      { id: 3, type: 'info', message: 'New booking received', time: '3 hours ago' }
    ];
  };

  const generateTasks = () => {
    return [
      { id: 1, title: 'Vehicle inspection', status: 'completed', priority: 'high' },
      { id: 2, title: 'Staff training', status: 'pending', priority: 'medium' },
      { id: 3, title: 'Document renewal', status: 'pending', priority: 'high' }
    ];
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

  const renderWidget = (widget: DashboardWidget) => {
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
        return null;
    }
  };

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
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Widget</h2>
              <button
                onClick={() => setShowAddWidget(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
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