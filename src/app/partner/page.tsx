'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaCar, FaUsers, FaCalendarAlt, FaMoneyBillWave, FaChartBar, 
  FaChartPie, FaChartLine, FaExclamationTriangle, FaBell, 
  FaClock, FaMapMarkerAlt, FaTachometerAlt, FaTools, FaUserTie,
  FaFileAlt, FaCreditCard, FaShieldAlt, FaStar, FaCheckCircle,
  FaTimes, FaEye, FaEdit, FaPlus, FaDownload, FaSync, FaBuilding,
  FaRoute, FaGasPump, FaWrench, FaFileInvoice, FaHandshake,
  FaUserCheck, FaCalendarCheck, FaChartArea, FaPercent, FaPoundSign,
  FaCheck
} from 'react-icons/fa';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface DashboardData {
  fleet: {
    total: number;
    active: number;
    maintenance: number;
    available: number;
    revenue: number;
    utilization: number;
  };
  bookings: {
    total: number;
    active: number;
    completed: number;
    pending: number;
    revenue: number;
    averageRating: number;
  };
  staff: {
    total: number;
    active: number;
    roles: { [key: string]: number };
  };
  revenue: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    growth: number;
  };
  drivers: {
    total: number;
    active: number;
    available: number;
    averageRating: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  documents: {
    pending: number;
    approved: number;
    rejected: number;
  };
  payments: {
    pending: number;
    completed: number;
    total: number;
  };
  maintenance: {
    scheduled: number;
    overdue: number;
    completed: number;
  };
  analytics: {
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    bookingTrends: Array<{ date: string; bookings: number }>;
    fleetUtilization: Array<{ vehicle: string; utilization: number }>;
    topVehicles: Array<{ vehicle: string; revenue: number }>;
  };
  notifications: {
    unread: number;
    recent: Array<{ id: string; message: string; type: string; time: string }>;
  };
}

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  data?: any;
  requiredRole?: string;
  requiredPermission?: string;
}

const WIDGET_SIZES = {
  small: { w: 4, h: 4 },
  medium: { w: 6, h: 4 },
  large: { w: 8, h: 5 },
  xlarge: { w: 12, h: 6 }
};

// 30 Comprehensive Widgets for Partner Dashboard
const staticWidgets: DashboardWidget[] = [
  // Top Row - Key Metrics (Large Widgets)
  { id: 'revenue-overview', type: 'metric', title: 'Revenue Overview', position: { x: 0, y: 0, w: 8, h: 5 } },
  { id: 'fleet-status', type: 'metric', title: 'Fleet Status', position: { x: 8, y: 0, w: 8, h: 5 } },
  
  // Second Row - Business Metrics
  { id: 'active-bookings', type: 'metric', title: 'Active Bookings', position: { x: 0, y: 5, w: 4, h: 4 } },
  { id: 'staff-overview', type: 'metric', title: 'Staff Overview', position: { x: 4, y: 5, w: 4, h: 4 } },
  { id: 'driver-performance', type: 'metric', title: 'Driver Performance', position: { x: 8, y: 5, w: 4, h: 4 } },
  { id: 'payment-status', type: 'metric', title: 'Payment Status', position: { x: 12, y: 5, w: 4, h: 4 } },
  
  // Third Row - Charts and Analytics
  { id: 'revenue-chart', type: 'chart', title: 'Monthly Revenue Trend', position: { x: 0, y: 9, w: 8, h: 5 } },
  { id: 'booking-trends', type: 'chart', title: 'Booking Trends', position: { x: 8, y: 9, w: 8, h: 5 } },
  
  // Fourth Row - Fleet Management
  { id: 'fleet-utilization', type: 'chart', title: 'Fleet Utilization', position: { x: 0, y: 14, w: 6, h: 4 } },
  { id: 'maintenance-alerts', type: 'alert', title: 'Maintenance Alerts', position: { x: 6, y: 14, w: 6, h: 4 } },
  { id: 'vehicle-performance', type: 'chart', title: 'Top Performing Vehicles', position: { x: 12, y: 14, w: 4, h: 4 } },
  
  // Fifth Row - Staff and Operations
  { id: 'staff-roles', type: 'chart', title: 'Staff by Role', position: { x: 0, y: 18, w: 4, h: 4 } },
  { id: 'recent-activity', type: 'activity', title: 'Recent Activity', position: { x: 4, y: 18, w: 4, h: 4 } },
  { id: 'document-status', type: 'metric', title: 'Document Status', position: { x: 8, y: 18, w: 4, h: 4 } },
  { id: 'notifications', type: 'notification', title: 'Notifications', position: { x: 12, y: 18, w: 4, h: 4 } },
  
  // Sixth Row - Financial and Analytics
  { id: 'financial-summary', type: 'metric', title: 'Financial Summary', position: { x: 0, y: 22, w: 6, h: 4 } },
  { id: 'profit-margin', type: 'chart', title: 'Profit Margin Analysis', position: { x: 6, y: 22, w: 6, h: 4 } },
  { id: 'expense-breakdown', type: 'chart', title: 'Expense Breakdown', position: { x: 12, y: 22, w: 4, h: 4 } },
  
  // Seventh Row - Customer and Service
  { id: 'customer-satisfaction', type: 'metric', title: 'Customer Satisfaction', position: { x: 0, y: 26, w: 4, h: 4 } },
  { id: 'service-areas', type: 'map', title: 'Service Areas', position: { x: 4, y: 26, w: 4, h: 4 } },
  { id: 'booking-sources', type: 'chart', title: 'Booking Sources', position: { x: 8, y: 26, w: 4, h: 4 } },
  { id: 'peak-hours', type: 'chart', title: 'Peak Booking Hours', position: { x: 12, y: 26, w: 4, h: 4 } },
  
  // Eighth Row - Compliance and Quality
  { id: 'compliance-status', type: 'metric', title: 'Compliance Status', position: { x: 0, y: 30, w: 4, h: 4 } },
  { id: 'quality-metrics', type: 'metric', title: 'Quality Metrics', position: { x: 4, y: 30, w: 4, h: 4 } },
  { id: 'safety-score', type: 'metric', title: 'Safety Score', position: { x: 8, y: 30, w: 4, h: 4 } },
  { id: 'insurance-status', type: 'metric', title: 'Insurance Status', position: { x: 12, y: 30, w: 4, h: 4 } },
  
  // Ninth Row - Growth and Development
  { id: 'growth-metrics', type: 'chart', title: 'Business Growth', position: { x: 0, y: 34, w: 6, h: 4 } },
  { id: 'market-position', type: 'metric', title: 'Market Position', position: { x: 6, y: 34, w: 3, h: 4 } },
  { id: 'competitor-analysis', type: 'chart', title: 'Competitor Analysis', position: { x: 9, y: 34, w: 3, h: 4 } },
  { id: 'future-projects', type: 'project', title: 'Future Projects', position: { x: 12, y: 34, w: 4, h: 4 } }
];

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);



  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch partner data
      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!partnerData) {
        console.error('Partner not found');
        return;
      }

      // Fetch fleet data
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', partnerData.id);

      // Fetch bookings data
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerData.id);

      // Fetch staff data
      const { data: staff } = await supabase
        .from('partner_staff')
        .select('*')
        .eq('partner_id', partnerData.id);

      // Fetch drivers data
      const { data: drivers } = await supabase
        .from('drivers')
        .select('*')
        .eq('partner_id', partnerData.id);

      // Process data
      const processedData: DashboardData = {
        fleet: {
          total: vehicles?.length || 0,
          active: vehicles?.filter(v => v.is_active).length || 0,
          maintenance: vehicles?.filter(v => v.status === 'maintenance').length || 0,
          available: vehicles?.filter(v => v.is_available).length || 0,
          revenue: vehicles?.reduce((sum, v) => sum + (v.daily_rate || 0), 0) || 0,
          utilization: vehicles?.length ? (vehicles.filter(v => v.is_available).length / vehicles.length) * 100 : 0
        },
        bookings: {
          total: bookings?.length || 0,
          active: bookings?.filter(b => b.status === 'active').length || 0,
          completed: bookings?.filter(b => b.status === 'completed').length || 0,
          pending: bookings?.filter(b => b.status === 'pending').length || 0,
          revenue: bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
          averageRating: 4.5 // Mock data
        },
        staff: {
          total: staff?.length || 0,
          active: staff?.filter(s => s.is_active).length || 0,
          roles: staff?.reduce((acc, s) => {
            acc[s.role] = (acc[s.role] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number }) || {}
        },
        revenue: {
          total: bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0,
          monthly: 15000, // Mock data
          weekly: 3500, // Mock data
          daily: 500, // Mock data
          growth: 12.5 // Mock data
        },
        drivers: {
          total: drivers?.length || 0,
          active: drivers?.filter(d => d.is_active).length || 0,
          available: drivers?.filter(d => d.is_available).length || 0,
          averageRating: drivers?.reduce((sum, d) => sum + (d.rating || 0), 0) / (drivers?.length || 1) || 0
        },
        alerts: {
          critical: 2,
          warning: 5,
          info: 8
        },
        documents: {
          pending: 3,
          approved: 15,
          rejected: 1
        },
        payments: {
          pending: 5,
          completed: 45,
          total: 50
        },
        maintenance: {
          scheduled: 8,
          overdue: 2,
          completed: 25
        },
        analytics: {
          monthlyRevenue: [
            { month: 'Jan', revenue: 12000 },
            { month: 'Feb', revenue: 13500 },
            { month: 'Mar', revenue: 14200 },
            { month: 'Apr', revenue: 15800 },
            { month: 'May', revenue: 16500 },
            { month: 'Jun', revenue: 17200 }
          ],
          bookingTrends: [
            { date: 'Mon', bookings: 12 },
            { date: 'Tue', bookings: 15 },
            { date: 'Wed', bookings: 18 },
            { date: 'Thu', bookings: 14 },
            { date: 'Fri', bookings: 22 },
            { date: 'Sat', bookings: 25 },
            { date: 'Sun', bookings: 20 }
          ],
          fleetUtilization: [
            { vehicle: 'Vehicle 1', utilization: 85 },
            { vehicle: 'Vehicle 2', utilization: 92 },
            { vehicle: 'Vehicle 3', utilization: 78 },
            { vehicle: 'Vehicle 4', utilization: 88 }
          ],
          topVehicles: [
            { vehicle: 'Toyota Prius', revenue: 2500 },
            { vehicle: 'Honda Civic', revenue: 2200 },
            { vehicle: 'Ford Focus', revenue: 2000 },
            { vehicle: 'Vauxhall Astra', revenue: 1800 }
          ]
        },
        notifications: {
          unread: 5,
          recent: [
            { id: '1', message: 'New booking received', type: 'success', time: '2 min ago' },
            { id: '2', message: 'Vehicle maintenance due', type: 'warning', time: '1 hour ago' },
            { id: '3', message: 'Payment received', type: 'info', time: '3 hours ago' }
          ]
        }
      };

      setDashboardData(processedData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    if (!dashboardData) return null;

    switch (widget.type) {
      case 'metric':
        return renderMetricWidget(widget);
      case 'chart':
        return renderChartWidget(widget);
      case 'alert':
        return renderAlertWidget(widget);
      case 'activity':
        return renderActivityWidget(widget);
      case 'notification':
        return renderNotificationWidget(widget);
      case 'map':
        return renderMapWidget(widget);
      case 'project':
        return renderProjectWidget(widget);
      default:
        return <div>Unknown widget type</div>;
    }
  };

    const renderRevenueExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <div className="flex items-center space-x-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs">Live</span>
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Export Report
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold">£{dashboardData?.revenue.total.toLocaleString()}</p>
          <p className="text-sm opacity-90">All time</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Monthly Revenue</h3>
          <p className="text-3xl font-bold">£{dashboardData?.revenue.monthly.toLocaleString()}</p>
          <p className="text-sm opacity-90">This month</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Growth Rate</h3>
          <p className="text-3xl font-bold">+{dashboardData?.revenue.growth}%</p>
          <p className="text-sm opacity-90">vs last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardData?.analytics.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Vehicle Rentals</span>
              <span className="font-semibold">£{((dashboardData?.revenue.total || 0) * 0.75).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Maintenance Services</span>
              <span className="font-semibold">£{((dashboardData?.revenue.total || 0) * 0.15).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '15%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Insurance</span>
              <span className="font-semibold">£{((dashboardData?.revenue.total || 0) * 0.10).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFleetExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Total Vehicles: {dashboardData?.fleet.total}</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Active</h3>
          <p className="text-3xl font-bold">{dashboardData?.fleet.active}</p>
          <p className="text-sm opacity-90">Available for booking</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Maintenance</h3>
          <p className="text-3xl font-bold">{dashboardData?.fleet.maintenance}</p>
          <p className="text-sm opacity-90">Under service</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Inactive</h3>
          <p className="text-3xl font-bold">{(dashboardData?.fleet.total || 0) - (dashboardData?.fleet.active || 0) - (dashboardData?.fleet.maintenance || 0)}</p>
          <p className="text-sm opacity-90">Out of service</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Utilization</h3>
          <p className="text-3xl font-bold">{dashboardData?.fleet.utilization.toFixed(1)}%</p>
          <p className="text-sm opacity-90">Fleet efficiency</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Fleet Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: dashboardData?.fleet.active || 0, color: '#10B981' },
                    { name: 'Maintenance', value: dashboardData?.fleet.maintenance || 0, color: '#F59E0B' },
                    { name: 'Inactive', value: (dashboardData?.fleet.total || 0) - (dashboardData?.fleet.active || 0) - (dashboardData?.fleet.maintenance || 0), color: '#EF4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Active', value: dashboardData?.fleet.active || 0, color: '#10B981' },
                    { name: 'Maintenance', value: dashboardData?.fleet.maintenance || 0, color: '#F59E0B' },
                    { name: 'Inactive', value: (dashboardData?.fleet.total || 0) - (dashboardData?.fleet.active || 0) - (dashboardData?.fleet.maintenance || 0), color: '#EF4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Recent Fleet Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Vehicle added</span>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Maintenance scheduled</span>
              </div>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Insurance renewed</span>
              </div>
              <span className="text-xs text-gray-500">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookingsExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Total Bookings: {dashboardData?.bookings.total}</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Active</h3>
          <p className="text-3xl font-bold">{dashboardData?.bookings.active}</p>
          <p className="text-sm opacity-90">Currently running</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Pending</h3>
          <p className="text-3xl font-bold">{dashboardData?.bookings.pending}</p>
          <p className="text-sm opacity-90">Awaiting confirmation</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Completed</h3>
          <p className="text-3xl font-bold">{dashboardData?.bookings.completed}</p>
          <p className="text-sm opacity-90">Successfully finished</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold">£{dashboardData?.bookings.revenue.toLocaleString()}</p>
          <p className="text-sm opacity-90">Total earnings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Booking Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData?.analytics.bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="bookings" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium">Toyota Prius</span>
                  <p className="text-xs text-gray-500">Driver: John Smith</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium">Honda Civic</span>
                  <p className="text-xs text-gray-500">Driver: Sarah Johnson</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <span className="text-sm font-medium">Ford Focus</span>
                  <p className="text-xs text-gray-500">Driver: Mike Wilson</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">3 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStaffExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Total Staff: {dashboardData?.staff.total}</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Staff</h3>
          <p className="text-3xl font-bold">{dashboardData?.staff.active}</p>
          <p className="text-sm opacity-90">Currently working</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Fleet Managers</h3>
          <p className="text-3xl font-bold">{dashboardData?.staff.roles.fleet_manager || 0}</p>
          <p className="text-sm opacity-90">Vehicle management</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Booking Managers</h3>
          <p className="text-3xl font-bold">{dashboardData?.staff.roles.booking_manager || 0}</p>
          <p className="text-sm opacity-90">Booking coordination</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Staff Role Distribution</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(dashboardData?.staff.roles || {}).map(([role, count]) => (
            <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{role.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDriversExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Total Drivers: {dashboardData?.drivers.total}</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Driver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Active Drivers</h3>
          <p className="text-3xl font-bold">{dashboardData?.drivers.active}</p>
          <p className="text-sm opacity-90">Currently available</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Available</h3>
          <p className="text-3xl font-bold">{dashboardData?.drivers.available}</p>
          <p className="text-sm opacity-90">Ready for bookings</p>
        </div>
                 <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
           <h3 className="text-lg font-semibold mb-2">On Duty</h3>
           <p className="text-3xl font-bold">{(dashboardData?.drivers.active || 0) - (dashboardData?.drivers.available || 0)}</p>
           <p className="text-sm opacity-90">Currently working</p>
         </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Avg Rating</h3>
          <p className="text-3xl font-bold">{dashboardData?.drivers.averageRating.toFixed(1)}</p>
          <p className="text-sm opacity-90">Driver satisfaction</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Driver Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-600">{dashboardData?.drivers.averageRating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">{dashboardData?.drivers.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total Drivers</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600">{dashboardData?.drivers.available}</span>
            </div>
            <p className="text-sm text-gray-600">Available Now</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaintenanceExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Maintenance Overview</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Schedule Maintenance
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Scheduled</h3>
          <p className="text-3xl font-bold">{dashboardData?.maintenance.scheduled}</p>
          <p className="text-sm opacity-90">Planned maintenance</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Overdue</h3>
          <p className="text-3xl font-bold">{dashboardData?.maintenance.overdue}</p>
          <p className="text-sm opacity-90">Past due date</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Completed</h3>
          <p className="text-3xl font-bold">{dashboardData?.maintenance.completed}</p>
          <p className="text-sm opacity-90">This month</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Maintenance Schedule</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div>
              <h4 className="font-medium text-red-900">Toyota Prius - Oil Change</h4>
              <p className="text-sm text-red-700">Overdue by 2 days</p>
            </div>
            <button className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reschedule</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div>
              <h4 className="font-medium text-yellow-900">Honda Civic - Brake Check</h4>
              <p className="text-sm text-yellow-700">Due in 3 days</p>
            </div>
            <button className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">View Details</button>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
            <div>
              <h4 className="font-medium text-green-900">Ford Focus - Tire Rotation</h4>
              <p className="text-sm text-green-700">Completed yesterday</p>
            </div>
            <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">View Report</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocumentsExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Document Management</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Pending</h3>
          <p className="text-3xl font-bold">{dashboardData?.documents.pending}</p>
          <p className="text-sm opacity-90">Awaiting review</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Approved</h3>
          <p className="text-3xl font-bold">{dashboardData?.documents.approved}</p>
          <p className="text-sm opacity-90">Valid documents</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Rejected</h3>
          <p className="text-3xl font-bold">{dashboardData?.documents.rejected}</p>
          <p className="text-sm opacity-90">Need attention</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Document Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaFileAlt className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium">Vehicle Insurance</h4>
                <p className="text-sm text-gray-600">Toyota Prius - Expires in 30 days</p>
              </div>
            </div>
            <span className="text-sm text-yellow-600 font-medium">Pending Review</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaFileAlt className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium">PCO License</h4>
                <p className="text-sm text-gray-600">Valid until Dec 2024</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">Approved</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaFileAlt className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-medium">MOT Certificate</h4>
                <p className="text-sm text-gray-600">Expired - Needs renewal</p>
              </div>
            </div>
            <span className="text-sm text-red-600 font-medium">Rejected</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentsExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Payment Overview</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Process Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Pending</h3>
          <p className="text-3xl font-bold">{dashboardData?.payments.pending}</p>
          <p className="text-sm opacity-90">Awaiting processing</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Completed</h3>
          <p className="text-3xl font-bold">{dashboardData?.payments.completed}</p>
          <p className="text-sm opacity-90">Successfully processed</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total</h3>
          <p className="text-3xl font-bold">£{dashboardData?.payments.total.toLocaleString()}</p>
          <p className="text-sm opacity-90">All payments</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaCreditCard className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium">Driver Commission</h4>
                <p className="text-sm text-gray-600">John Smith - Booking #1234</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-600">£150.00</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaCreditCard className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium">Maintenance Payment</h4>
                <p className="text-sm text-gray-600">AutoCare Services</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-yellow-600">£85.50</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FaCreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium">Insurance Premium</h4>
                <p className="text-sm text-gray-600">Monthly payment</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-blue-600">£200.00</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertsExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Alert Center</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          View All Alerts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Critical</h3>
          <p className="text-3xl font-bold">{dashboardData?.alerts.critical}</p>
          <p className="text-sm opacity-90">Immediate action needed</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Warning</h3>
          <p className="text-3xl font-bold">{dashboardData?.alerts.warning}</p>
          <p className="text-sm opacity-90">Attention required</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Info</h3>
          <p className="text-3xl font-bold">{dashboardData?.alerts.info}</p>
          <p className="text-sm opacity-90">Informational</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center space-x-3">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h4 className="font-medium text-red-900">Vehicle Breakdown</h4>
                <p className="text-sm text-red-700">Toyota Prius - Engine warning light</p>
              </div>
            </div>
            <span className="text-sm text-red-600 font-medium">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
            <div className="flex items-center space-x-3">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-900">Document Expiry</h4>
                <p className="text-sm text-yellow-700">Insurance expires in 7 days</p>
              </div>
            </div>
            <span className="text-sm text-yellow-600 font-medium">1 day ago</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center space-x-3">
              <FaExclamationTriangle className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">New Booking</h4>
                <p className="text-sm text-blue-700">High-value booking received</p>
              </div>
            </div>
            <span className="text-sm text-blue-600 font-medium">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsExpanded = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Notification Center</span>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Mark All Read
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Unread</h3>
          <p className="text-3xl font-bold">{dashboardData?.notifications.unread}</p>
          <p className="text-sm opacity-90">New notifications</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Total</h3>
          <p className="text-3xl font-bold">{dashboardData?.notifications.recent.length}</p>
          <p className="text-sm opacity-90">All notifications</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Notifications</h3>
        <div className="space-y-4">
          {dashboardData?.notifications.recent.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  notification.type === 'success' ? 'bg-green-500' :
                  notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div>
                  <h4 className="font-medium">{notification.message}</h4>
                  <p className="text-sm text-gray-600">{notification.time}</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                Mark Read
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDefaultExpanded = (widget: DashboardWidget) => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{widget.title}</h2>
        <p className="text-gray-600">Detailed insights and analytics for this widget</p>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Widget Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Widget Type</p>
            <p className="font-medium">{widget.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Widget ID</p>
            <p className="font-medium">{widget.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Position</p>
            <p className="font-medium">X: {widget.position.x}, Y: {widget.position.y}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Size</p>
            <p className="font-medium">{widget.position.w} x {widget.position.h}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExpandedWidget = (widget: DashboardWidget) => {
    switch (widget.id) {
      case 'revenue-overview':
        return renderRevenueExpanded();
      case 'fleet-status':
        return renderFleetExpanded();
      case 'active-bookings':
        return renderBookingsExpanded();
      case 'staff-overview':
        return renderStaffExpanded();
      case 'driver-management':
        return renderDriversExpanded();
      case 'maintenance-schedule':
        return renderMaintenanceExpanded();
      case 'document-status':
        return renderDocumentsExpanded();
      case 'payment-overview':
        return renderPaymentsExpanded();
      case 'alert-center':
        return renderAlertsExpanded();
      case 'notification-center':
        return renderNotificationsExpanded();
      default:
        return renderDefaultExpanded(widget);
    }
  };

  const renderMetricWidget = (widget: DashboardWidget) => {
    const getMetricData = () => {
      switch (widget.id) {
        case 'revenue-overview':
          return {
            title: 'Total Revenue',
            value: `£${dashboardData?.revenue.total.toLocaleString()}`,
            change: `+${dashboardData?.revenue.growth}%`,
            icon: FaMoneyBillWave,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            chart: true,
            chartData: [
              { month: 'Jan', revenue: 12000 },
              { month: 'Feb', revenue: 13500 },
              { month: 'Mar', revenue: 14200 },
              { month: 'Apr', revenue: 15800 },
              { month: 'May', revenue: 16500 },
              { month: 'Jun', revenue: 17200 }
            ]
          };
        case 'fleet-status':
          return {
            title: 'Fleet Status',
            value: `${dashboardData?.fleet.active}/${dashboardData?.fleet.total}`,
            subtitle: 'Active Vehicles',
            icon: FaCar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            chart: true,
            chartData: [
              { status: 'Active', count: dashboardData?.fleet.active || 0, color: '#10B981' },
              { status: 'Maintenance', count: dashboardData?.fleet.maintenance || 0, color: '#F59E0B' },
              { status: 'Inactive', count: (dashboardData?.fleet.total || 0) - (dashboardData?.fleet.active || 0) - (dashboardData?.fleet.maintenance || 0), color: '#6B7280' }
            ]
          };
        case 'active-bookings':
          return {
            title: 'Active Bookings',
            value: dashboardData?.bookings.active,
            subtitle: 'Currently Active',
            icon: FaCalendarAlt,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            chart: true,
            chartData: [
              { status: 'Active', count: dashboardData?.bookings.active || 0, color: '#8B5CF6' },
              { status: 'Pending', count: dashboardData?.bookings.pending || 0, color: '#F59E0B' },
              { status: 'Completed', count: dashboardData?.bookings.completed || 0, color: '#10B981' }
            ]
          };
        case 'staff-overview':
          return {
            title: 'Staff Members',
            value: dashboardData?.staff.total,
            subtitle: 'Total Staff',
            icon: FaUsers,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            chart: true,
            chartData: Object.entries(dashboardData?.staff.roles || {}).map(([role, count]) => ({
              role,
              count,
              color: role === 'manager' ? '#3B82F6' : role === 'supervisor' ? '#10B981' : role === 'coordinator' ? '#F59E0B' : '#6B7280'
            }))
          };
        case 'driver-performance':
          return {
            title: 'Driver Rating',
            value: dashboardData?.drivers.averageRating.toFixed(1),
            subtitle: 'Average Rating',
            icon: FaStar,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            chart: true,
            chartData: [
              { rating: '5★', count: 15, color: '#10B981' },
              { rating: '4★', count: 8, color: '#F59E0B' },
              { rating: '3★', count: 3, color: '#EF4444' }
            ]
          };
        case 'payment-status':
          return {
            title: 'Payments',
            value: `${dashboardData?.payments.completed}/${dashboardData?.payments.total}`,
            subtitle: 'Completed',
            icon: FaCreditCard,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            chart: true,
            chartData: [
              { status: 'Completed', count: dashboardData?.payments.completed || 0, color: '#10B981' },
              { status: 'Pending', count: dashboardData?.payments.pending || 0, color: '#F59E0B' }
            ]
          };
        case 'document-status':
          return {
            title: 'Documents',
            value: `${dashboardData?.documents.approved || 0}/${(dashboardData?.documents.pending || 0) + (dashboardData?.documents.approved || 0)}`,
            subtitle: 'Approved',
            icon: FaFileAlt,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            chart: true,
            chartData: [
              { status: 'Approved', count: dashboardData?.documents.approved || 0, color: '#10B981' },
              { status: 'Pending', count: dashboardData?.documents.pending || 0, color: '#F59E0B' },
              { status: 'Rejected', count: dashboardData?.documents.rejected || 0, color: '#EF4444' }
            ]
          };
        case 'financial-summary':
          return {
            title: 'Monthly Revenue',
            value: `£${dashboardData?.revenue.monthly.toLocaleString()}`,
            change: `+${dashboardData?.revenue.growth}%`,
            icon: FaPoundSign,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            chart: true,
            chartData: [
              { month: 'Jan', revenue: 12000 },
              { month: 'Feb', revenue: 13500 },
              { month: 'Mar', revenue: 14200 },
              { month: 'Apr', revenue: 15800 },
              { month: 'May', revenue: 16500 },
              { month: 'Jun', revenue: 17200 }
            ]
          };
        case 'customer-satisfaction':
          return {
            title: 'Satisfaction',
            value: '4.8/5.0',
            subtitle: 'Average Rating',
            icon: FaStar,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            chart: true,
            chartData: [
              { rating: '5★', count: 45, color: '#10B981' },
              { rating: '4★', count: 25, color: '#F59E0B' },
              { rating: '3★', count: 8, color: '#EF4444' }
            ]
          };
        case 'compliance-status':
          return {
            title: 'Compliance',
            value: '98%',
            subtitle: 'Compliance Rate',
            icon: FaShieldAlt,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            chart: true,
            chartData: [
              { status: 'Compliant', count: 98, color: '#10B981' },
              { status: 'Non-Compliant', count: 2, color: '#EF4444' }
            ]
          };
        case 'quality-metrics':
          return {
            title: 'Quality Score',
            value: '95%',
            subtitle: 'Quality Rating',
            icon: FaCheckCircle,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            chart: true,
            chartData: [
              { status: 'Excellent', count: 60, color: '#10B981' },
              { status: 'Good', count: 25, color: '#3B82F6' },
              { status: 'Average', count: 10, color: '#F59E0B' },
              { status: 'Poor', count: 5, color: '#EF4444' }
            ]
          };
        case 'safety-score':
          return {
            title: 'Safety Score',
            value: '4.9/5.0',
            subtitle: 'Safety Rating',
            icon: FaShieldAlt,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            chart: true,
            chartData: [
              { score: '5.0', count: 35, color: '#10B981' },
              { score: '4.5', count: 20, color: '#F59E0B' },
              { score: '4.0', count: 10, color: '#EF4444' }
            ]
          };
        case 'insurance-status':
          return {
            title: 'Insurance',
            value: '100%',
            subtitle: 'Covered Vehicles',
            icon: FaShieldAlt,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            chart: true,
            chartData: [
              { status: 'Covered', count: 100, color: '#10B981' },
              { status: 'Expiring Soon', count: 5, color: '#F59E0B' }
            ]
          };
        case 'market-position':
          return {
            title: 'Market Share',
            value: '12%',
            subtitle: 'Local Market',
            icon: FaChartBar,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            chart: true,
            chartData: [
              { company: 'Us', share: 12, color: '#8B5CF6' },
              { company: 'Competitor A', share: 8, color: '#3B82F6' },
              { company: 'Competitor B', share: 6, color: '#10B981' },
              { company: 'Others', share: 74, color: '#6B7280' }
            ]
          };
        default:
          return {
            title: 'Metric',
            value: '0',
            icon: FaChartBar,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            chart: false
          };
      }
    };

    const data = getMetricData();
    const IconComponent = data.icon;

    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-600">{data.title}</h3>
          <div className={`p-2 rounded-lg ${data.bgColor}`}>
            <IconComponent className={`w-4 h-4 ${data.color}`} />
          </div>
        </div>
        
        <div className="mb-3">
          <span className="text-2xl font-bold text-gray-900">{data.value}</span>
          {data.change && (
            <span className="ml-2 text-sm text-green-600">{data.change}</span>
          )}
        </div>
        
        {data.subtitle && (
          <p className="text-sm text-gray-500 mb-3">{data.subtitle}</p>
        )}

        {data.chart && data.chartData && (
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {data.chartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

    const renderChartWidget = (widget: DashboardWidget) => {
    const getChartData = () => {
      switch (widget.id) {
        case 'revenue-chart':
          return {
            data: dashboardData?.analytics.monthlyRevenue || [],
            type: 'line',
            color: '#10B981',
            gradient: true,
            showGrid: true,
            showLegend: true
          };
        case 'booking-trends':
          return {
            data: dashboardData?.analytics.bookingTrends || [],
            type: 'bar',
            color: '#3B82F6',
            showGrid: true,
            showLegend: false
          };
        case 'fleet-utilization':
          return {
            data: dashboardData?.analytics.fleetUtilization || [],
            type: 'bar',
            color: '#8B5CF6',
            showGrid: true,
            showLegend: false
          };
        case 'vehicle-performance':
          return {
            data: dashboardData?.analytics.topVehicles || [],
            type: 'bar',
            color: '#F59E0B',
            showGrid: true,
            showLegend: false
          };
        case 'staff-roles':
          return {
            data: Object.entries(dashboardData?.staff.roles || {}).map(([role, count]) => ({
              name: role,
              value: count
            })),
            type: 'pie',
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
            showLegend: true
          };
        case 'profit-margin':
          return {
            data: [
              { month: 'Jan', margin: 25, target: 30 },
              { month: 'Feb', margin: 28, target: 30 },
              { month: 'Mar', margin: 30, target: 30 },
              { month: 'Apr', margin: 32, target: 30 },
              { month: 'May', margin: 35, target: 30 },
              { month: 'Jun', margin: 38, target: 30 }
            ],
            type: 'area',
            color: '#10B981',
            gradient: true,
            showGrid: true,
            showLegend: true
          };
        case 'expense-breakdown':
          return {
            data: [
              { category: 'Fuel', amount: 2500, percentage: 40 },
              { category: 'Maintenance', amount: 1800, percentage: 29 },
              { category: 'Insurance', amount: 1200, percentage: 19 },
              { category: 'Other', amount: 800, percentage: 12 }
            ],
            type: 'pie',
            colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
            showLegend: true
          };
        case 'booking-sources':
          return {
            data: [
              { source: 'Website', bookings: 45, percentage: 45 },
              { source: 'App', bookings: 35, percentage: 35 },
              { source: 'Phone', bookings: 20, percentage: 20 }
            ],
            type: 'pie',
            colors: ['#3B82F6', '#10B981', '#F59E0B'],
            showLegend: true
          };
        case 'peak-hours':
          return {
            data: [
              { hour: '9AM', bookings: 8, percentage: 10 },
              { hour: '10AM', bookings: 12, percentage: 15 },
              { hour: '11AM', bookings: 15, percentage: 19 },
              { hour: '12PM', bookings: 18, percentage: 23 },
              { hour: '1PM', bookings: 14, percentage: 18 },
              { hour: '2PM', bookings: 10, percentage: 13 }
            ],
            type: 'bar',
            color: '#8B5CF6',
            showGrid: true,
            showLegend: false
          };
        case 'growth-metrics':
          return {
            data: [
              { month: 'Jan', growth: 5, target: 10 },
              { month: 'Feb', growth: 8, target: 10 },
              { month: 'Mar', growth: 12, target: 10 },
              { month: 'Apr', growth: 15, target: 10 },
              { month: 'May', growth: 18, target: 10 },
              { month: 'Jun', growth: 22, target: 10 }
            ],
            type: 'line',
            color: '#10B981',
            gradient: true,
            showGrid: true,
            showLegend: true
          };
        case 'competitor-analysis':
          return {
            data: [
              { company: 'Us', share: 25, color: '#8B5CF6' },
              { company: 'Competitor A', share: 20, color: '#3B82F6' },
              { company: 'Competitor B', share: 15, color: '#10B981' },
              { company: 'Others', share: 40, color: '#6B7280' }
            ],
            type: 'bar',
            color: '#3B82F6',
            showGrid: true,
            showLegend: false
          };
        default:
          return { data: [], type: 'line', color: '#6B7280', showGrid: true, showLegend: false };
      }
    };

    const chartData = getChartData();

    const renderChart = () => {
      switch (chartData.type) {
        case 'line':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.data}>
                {chartData.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={Object.keys(chartData.data[0] || {})[0]} 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {chartData.showLegend && <Legend />}
                <Line 
                  type="monotone" 
                  dataKey={Object.keys(chartData.data[0] || {})[1]} 
                  stroke={chartData.color} 
                  strokeWidth={3}
                  dot={{ fill: chartData.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: chartData.color, strokeWidth: 2 }}
                />
                {(chartData.data[0] as any)?.target && (
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          );
        case 'bar':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.data}>
                {chartData.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={Object.keys(chartData.data[0] || {})[0]} 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {chartData.showLegend && <Legend />}
                <Bar 
                  dataKey={Object.keys(chartData.data[0] || {})[1]} 
                  fill={chartData.color}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          );
        case 'pie':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.data.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || chartData.colors?.[index % (chartData.colors?.length || 1)] || '#8884d8'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {chartData.showLegend && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          );
        case 'area':
          return (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.data}>
                {chartData.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
                <XAxis 
                  dataKey={Object.keys(chartData.data[0] || {})[0]} 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                {chartData.showLegend && <Legend />}
                <defs>
                  <linearGradient id={`gradient-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartData.color} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={chartData.color} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey={Object.keys(chartData.data[0] || {})[1]} 
                  stroke={chartData.color} 
                  fill={`url(#gradient-${widget.id})`}
                  strokeWidth={2}
                />
                {(chartData.data[0] as any)?.target && (
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          );
        default:
          return <div>Chart not available</div>;
      }
    };

    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>
        <div className="flex-1">
          {renderChart()}
        </div>
      </div>
    );
  };

  const renderAlertWidget = (widget: DashboardWidget) => {
    const alerts = [
      { id: 1, type: 'critical', message: 'Vehicle MOT expires in 3 days', vehicle: 'Toyota Prius' },
      { id: 2, type: 'warning', message: 'Insurance renewal due next week', vehicle: 'Honda Civic' },
      { id: 3, type: 'info', message: 'Scheduled maintenance for 2 vehicles', vehicle: 'Ford Focus' }
    ];

    return (
      <div className="h-full flex flex-col p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{widget.title}</h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                alert.type === 'critical' ? 'bg-red-500' :
                alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{alert.message}</p>
                <p className="text-xs text-gray-500">{alert.vehicle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActivityWidget = (widget: DashboardWidget) => {
    const activities = [
      { id: 1, type: 'booking', message: 'New booking received', time: '2 min ago', icon: FaCalendarAlt },
      { id: 2, type: 'payment', message: 'Payment received', time: '1 hour ago', icon: FaMoneyBillWave },
      { id: 3, type: 'maintenance', message: 'Maintenance completed', time: '3 hours ago', icon: FaWrench },
      { id: 4, type: 'driver', message: 'Driver performance review', time: '1 day ago', icon: FaUserTie }
    ];

    return (
      <div className="h-full flex flex-col p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{widget.title}</h3>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <activity.icon className="w-3 h-3 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNotificationWidget = (widget: DashboardWidget) => {
    return (
      <div className="h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
            {dashboardData?.notifications.unread}
          </span>
        </div>
        <div className="space-y-3">
          {dashboardData?.notifications.recent.map((notification) => (
            <div key={notification.id} className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">{notification.message}</p>
                <p className="text-xs text-gray-500">{notification.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMapWidget = (widget: DashboardWidget) => {
    return (
      <div className="h-full flex flex-col p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{widget.title}</h3>
        <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <FaMapMarkerAlt className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Map View</p>
            <p className="text-xs text-gray-400">Service areas visualization</p>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectWidget = (widget: DashboardWidget) => {
    const projects = [
      { id: 1, name: 'Fleet Expansion', status: 'In Progress', progress: 75 },
      { id: 2, name: 'App Development', status: 'Planning', progress: 25 },
      { id: 3, name: 'Market Expansion', status: 'Research', progress: 10 }
    ];

    return (
      <div className="h-full flex flex-col p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">{widget.title}</h3>
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{project.name}</span>
                <span className="text-xs text-gray-500">{project.status}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Partner Status Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FaBuilding className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Welcome back, Partner!</h1>
                <p className="text-sm text-gray-600">Here's what's happening with your business today</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 px-3 py-1 rounded-full flex items-center space-x-2">
                <FaCheck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Approved</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <FaEdit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your fleet and bookings efficiently</p>
              {realTimeEnabled && (
                <div className="flex items-center space-x-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search vehicles, drivers, bookings..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FaEye className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              </div>
              
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
              
              {/* Export Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  <FaDownload className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={() => console.log('Export to PDF')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg"
                  >
                    <FaFileAlt className="w-4 h-4 text-red-600" />
                    <span>Export to PDF</span>
                  </button>
                  <button
                    onClick={() => console.log('Export to Excel')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <FaFileAlt className="w-4 h-4 text-green-600" />
                    <span>Export to Excel</span>
                  </button>
                  <button
                    onClick={() => console.log('Export Data')}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg"
                  >
                    <FaDownload className="w-4 h-4 text-blue-600" />
                    <span>Export Data (JSON)</span>
                  </button>
                </div>
              </div>
              

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



      {/* KPI Cards */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.staff.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  {dashboardData?.staff.active || 0} active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fleet Size</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.fleet.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                  <FaCar className="text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  {dashboardData?.fleet.active || 0} active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData?.bookings.total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                  <FaCalendarAlt className="text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  {dashboardData?.bookings.completed || 0} completed
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">£{dashboardData?.revenue.monthly?.toLocaleString() || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <FaMoneyBillWave className="text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  4.2 ★ rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <FaCar className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-900">Add Vehicle</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <FaUsers className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-900">Add Driver</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <FaCalendarAlt className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-900">New Booking</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <FaWrench className="w-6 h-6 text-yellow-600 mb-2" />
              <span className="text-sm font-medium text-yellow-900">Schedule Maintenance</span>
            </button>
            <button className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <FaExclamationTriangle className="w-6 h-6 text-red-600 mb-2" />
              <span className="text-sm font-medium text-red-900">Report Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Fleet Status</p>
                <p className="text-2xl font-bold">{dashboardData?.fleet.active || 0}/{dashboardData?.fleet.total || 0}</p>
                <p className="text-sm opacity-90">Active Vehicles</p>
              </div>
              <FaCar className="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Revenue</p>
                <p className="text-2xl font-bold">£{dashboardData?.revenue.monthly?.toLocaleString() || 0}</p>
                <p className="text-sm opacity-90">This Month</p>
              </div>
              <FaMoneyBillWave className="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Bookings</p>
                <p className="text-2xl font-bold">{dashboardData?.bookings.active || 0}</p>
                <p className="text-sm opacity-90">Active Now</p>
              </div>
              <FaCalendarAlt className="w-8 h-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Alerts</p>
                <p className="text-2xl font-bold">{dashboardData?.alerts.critical || 0}</p>
                <p className="text-sm opacity-90">Critical Issues</p>
              </div>
              <FaExclamationTriangle className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="relative bg-gray-50 rounded-lg p-4 min-h-[1200px] border-2 border-dashed border-gray-300">
          {/* Grid Container with proper sizing */}
          <div 
            className="relative w-full h-full"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(16, 1fr)`,
              gridTemplateRows: `repeat(38, 80px)`,
              gap: '8px',
              minHeight: `${38 * 80}px`,
              height: 'auto',
              overflow: 'visible'
            }}
          >
            {/* Static widgets positioned within the grid */}
            {staticWidgets.map((widget) => (
              <div
                key={widget.id}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                style={{
                  gridColumn: `${widget.position.x + 1} / span ${widget.position.w}`,
                  gridRow: `${widget.position.y + 1} / span ${widget.position.h}`,
                }}
                onClick={() => setExpandedWidget(widget.id)}
              >
                {/* Widget Content */}
                <div className="p-4 h-full overflow-hidden relative">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}

            {/* Widget Expansion Modal */}
            {expandedWidget && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {staticWidgets.find(w => w.id === expandedWidget)?.title}
                    </h2>
                    <button
                      onClick={() => setExpandedWidget(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FaTimes className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {renderExpandedWidget(staticWidgets.find(w => w.id === expandedWidget)!)}
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