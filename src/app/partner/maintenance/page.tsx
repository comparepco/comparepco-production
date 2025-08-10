'use client';
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MaintenanceDashboard from '@/components/maintenance/MaintenanceDashboard';
import { 
  FaTools, FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaEye,
  FaSearch, FaFilter, FaDownload, FaUpload, FaCar, FaWrench,
  FaOilCan, FaBolt, FaShieldAlt, FaExclamationTriangle,
  FaCheckCircle, FaClock, FaMapMarkerAlt, FaMoneyBillWave,
  FaFileAlt, FaBarcode, FaPhone, FaStar, FaTachometerAlt
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MaintenanceRecord {
  id: string;
  partner_id: string;
  car_id: string;
  car_name: string;
  car_plate: string;
  type: 'service' | 'repair' | 'mot' | 'insurance' | 'inspection' | 'other';
  title: string;
  description: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string;
  completed_date?: string;
  cost: number;
  estimated_cost?: number;
  mileage: number;
  next_service_mileage?: number;
  provider: {
    name: string;
    contact: string;
    address: string;
    rating?: number;
  };
  parts: Array<{
    name: string;
    quantity: number;
    cost: number;
    part_number?: string;
  }>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Car {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  mileage: number;
  status: string;
  image_url: string;
  last_service?: string;
  next_service?: string;
  insurance_expiry?: string;
  mot_expiry?: string;
  partner_id: string;
}

const maintenanceTypes = [
  { value: 'service', label: 'Regular Service', icon: <FaTools /> },
  { value: 'repair', label: 'Repair', icon: <FaWrench /> },
  { value: 'mot', label: 'MOT Test', icon: <FaShieldAlt /> },
  { value: 'insurance', label: 'Insurance', icon: <FaShieldAlt /> },
  { value: 'inspection', label: 'Inspection', icon: <FaEye /> },
  { value: 'other', label: 'Other', icon: <FaTools /> }
];

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800'
};

export default function MaintenancePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editRecord, setEditRecord] = useState<MaintenanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [carFilter, setCarFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  const [formData, setFormData] = useState({
    carId: '',
    type: 'service',
    title: '',
    description: '',
    priority: 'medium',
    scheduledDate: '',
    cost: 0,
    estimatedCost: 0,
    mileage: 0,
    nextServiceMileage: 0,
    providerName: '',
    providerContact: '',
    providerAddress: '',
    parts: [] as Array<{ name: string; quantity: number; cost: number; partNumber?: string; }>,
    notes: ''
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
        router.replace('/');
      } else {
        setLoading(false);
        loadData();
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const vehicleId = params.get('vehicleId');
    if (vehicleId) {
      setCarFilter(vehicleId);
    }
  }, [user, authLoading, router]);

  const getPartnerId = async () => {
    if (!user) return null;

    try {
      let partnerId = null;
      
      if (user.role === 'PARTNER') {
        const response = await fetch(`/api/partner/get-partner-id?userId=${user.id}`);
        const data = await response.json();
        
        if (response.ok && data.partnerId) {
          partnerId = data.partnerId;
        }
      } else if (user.role === 'PARTNER_STAFF') {
        const response = await fetch(`/api/partner/staff?userId=${user.id}`);
        const data = await response.json();

        if (response.ok && data.staff && data.staff.length > 0) {
          partnerId = data.staff[0].partner_id || data.staff[0].partnerId;
        }
      }

      return partnerId;
    } catch (error) {
      console.error('Error getting partner ID:', error);
      return null;
    }
  };

  const loadData = async () => {
    if (!user) return;

    const partnerId = await getPartnerId();
    
    if (!partnerId) {
      console.error('No partner ID found for maintenance data');
      return;
    }

    try {
      // Load cars for maintenance tracking
      const { data: carsData, error: carsError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', partnerId);

      if (carsError) {
        console.error('Error loading cars:', carsError);
      } else {
        const carsList = carsData?.map(car => ({
          id: car.id,
          name: `${car.make} ${car.model}`,
          make: car.make,
          model: car.model,
          year: car.year,
          license_plate: car.license_plate,
          mileage: car.mileage || 0,
          status: car.status,
          image_url: car.image_url,
          partner_id: car.partner_id
        })) as Car[];
        setCars(carsList || []);
      }

      // Load maintenance records using API
      const response = await fetch(`/api/partner/maintenance?partnerId=${partnerId}`);
      const data = await response.json();

      if (response.ok) {
        const recordList = data.records || [];

        // Auto-update overdue status
        const now = new Date();
        const overdueUpdates = recordList
          .filter((rec: MaintenanceRecord) => rec.status === 'scheduled' && new Date(rec.scheduled_date) < now)
          .map((rec: MaintenanceRecord) => 
            fetch('/api/partner/maintenance', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: rec.id,
                updates: { status: 'overdue' }
              })
            })
          );

        if (overdueUpdates.length > 0) {
          await Promise.all(overdueUpdates);
        }

        // Update local records with overdue status
        const updatedRecords = recordList.map((rec: MaintenanceRecord) => {
          if (rec.status === 'scheduled' && new Date(rec.scheduled_date) < now) {
            return { ...rec, status: 'overdue' };
          }
          return rec;
        });

        setRecords(updatedRecords);
        setFilteredRecords(updatedRecords);
      } else {
        console.error('Error loading maintenance records:', data.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    let filtered = [...records];

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.car_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(record => record.type === typeFilter);
    }

    if (priorityFilter) {
      filtered = filtered.filter(record => record.priority === priorityFilter);
    }

    if (carFilter) {
      filtered = filtered.filter(record => record.car_id === carFilter);
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.scheduled_date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }

    setFilteredRecords(filtered);
  }, [records, searchTerm, statusFilter, typeFilter, priorityFilter, carFilter, dateRange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const partnerId = await getPartnerId();
      if (!partnerId) throw new Error('No partner ID found');

      const selectedCar = cars.find(car => car.id === formData.carId);
      if (!selectedCar) throw new Error('Please select a car');

      const recordData = {
        partner_id: partnerId,
        car_id: formData.carId,
        car_name: selectedCar.name,
        car_plate: selectedCar.license_plate,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        status: 'scheduled',
        priority: formData.priority,
        scheduled_date: formData.scheduledDate,
        cost: formData.cost,
        estimated_cost: formData.estimatedCost,
        mileage: formData.mileage,
        next_service_mileage: formData.nextServiceMileage,
        provider: {
          name: formData.providerName,
          contact: formData.providerContact,
          address: formData.providerAddress
        },
        parts: formData.parts,
        attachments: [],
        notes: formData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id
      };

      if (editRecord) {
        const response = await fetch('/api/partner/maintenance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editRecord.id,
            updates: recordData
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update maintenance record');
        }
      } else {
        const response = await fetch('/api/partner/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create maintenance record');
        }
      }

      setShowForm(false);
      setEditRecord(null);
      resetForm();
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error saving maintenance record:', error);
      alert('Failed to save maintenance record');
    }
  };

  const resetForm = () => {
    setFormData({
      carId: '',
      type: 'service',
      title: '',
      description: '',
      priority: 'medium',
      scheduledDate: '',
      cost: 0,
      estimatedCost: 0,
      mileage: 0,
      nextServiceMileage: 0,
      providerName: '',
      providerContact: '',
      providerAddress: '',
      parts: [],
      notes: ''
    });
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setEditRecord(record);
    setFormData({
      carId: record.car_id,
      type: record.type,
      title: record.title,
      description: record.description,
      priority: record.priority,
      scheduledDate: record.scheduled_date.split('T')[0],
      cost: record.cost,
      estimatedCost: record.estimated_cost || 0,
      mileage: record.mileage,
      nextServiceMileage: record.next_service_mileage || 0,
      providerName: record.provider.name,
      providerContact: record.provider.contact,
      providerAddress: record.provider.address,
      parts: record.parts,
      notes: record.notes
    });
    setShowForm(true);
  };

  const handleDelete = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        const response = await fetch('/api/partner/maintenance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: recordId })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete maintenance record');
        }

        await loadData(); // Reload data
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    }
  };

  const updateStatus = async (recordId: string, status: string) => {
    try {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString()
      };
      
      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }

      const response = await fetch('/api/partner/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordId,
          updates: updateData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update maintenance status');
      }

      await loadData(); // Reload data
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getUpcomingMaintenanceAlerts = () => {
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return records.filter(record => {
      const scheduledDate = new Date(record.scheduled_date);
      return record.status === 'scheduled' && scheduledDate <= nextWeek && scheduledDate >= now;
    });
  };

  const getOverdueRecords = () => {
    const now = new Date();
    return records.filter(record => {
      const scheduledDate = new Date(record.scheduled_date);
      return record.status === 'scheduled' && scheduledDate < now;
    });
  };

  const handleStatusClick = (status: string) => {
    if (status === 'all') {
      setStatusFilter('');
    } else {
      setStatusFilter(status);
    }
  };

  const handleExport = () => {
    // Create CSV data
    const csvHeaders = [
      'ID',
      'Car Name',
      'Car Plate',
      'Type',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Scheduled Date',
      'Completed Date',
      'Cost (£)',
      'Estimated Cost (£)',
      'Mileage',
      'Next Service Mileage',
      'Provider Name',
      'Provider Contact',
      'Provider Address',
      'Notes',
      'Created At',
      'Updated At'
    ];

    const csvData = filteredRecords.map(record => [
      record.id,
      record.car_name,
      record.car_plate,
      record.type,
      record.title,
      record.description,
      record.status,
      record.priority,
      record.scheduled_date,
      record.completed_date || '',
      record.cost.toFixed(2),
      record.estimated_cost?.toFixed(2) || '',
      record.mileage,
      record.next_service_mileage || '',
      record.provider?.name || '',
      record.provider?.contact || '',
      record.provider?.address || '',
      record.notes,
      record.created_at,
      record.updated_at
    ]);

    // Combine headers and data
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maintenance_records_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-bold">Loading maintenance...</div>
      </div>
    );
  }

  if (!user) return null;

  const upcomingAlerts = getUpcomingMaintenanceAlerts();
  const overdueRecords = getOverdueRecords();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
              <p className="text-gray-600">
                {filteredRecords.length} of {records.length} records
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditRecord(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <FaPlus /> Schedule Maintenance
              </button>
              <button 
                onClick={handleExport}
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                <FaDownload /> Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(upcomingAlerts.length > 0 || overdueRecords.length > 0) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-2">
            {overdueRecords.length > 0 && (
              <div className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaExclamationTriangle />
                  <span className="font-medium">
                    {overdueRecords.length} overdue maintenance item(s) need immediate attention
                  </span>
                </div>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  {overdueRecords.map(rec => (
                    <li key={rec.id}>
                      {rec.car_name} ({rec.car_plate}) – {(maintenanceTypes.find(t => t.value === rec.type)?.label || rec.type)}: {rec.title || rec.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {upcomingAlerts.length > 0 && (
              <div className="bg-yellow-100 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock />
                  <span className="font-medium">
                    {upcomingAlerts.length} maintenance item(s) scheduled for this week
                  </span>
                </div>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  {upcomingAlerts.map(rec => (
                    <li key={rec.id}>
                      {rec.car_name} ({rec.car_plate}) – {(maintenanceTypes.find(t => t.value === rec.type)?.label || rec.type)}: {rec.title || rec.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Maintenance Dashboard */}
        <MaintenanceDashboard 
          records={records} 
          onStatusClick={handleStatusClick}
        />
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search maintenance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="overdue">Overdue</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Types</option>
              {maintenanceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={carFilter}
              onChange={(e) => setCarFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Cars</option>
              {cars.map(car => (
                <option key={car.id} value={car.id}>{car.name} ({car.license_plate})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Maintenance Records */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Maintenance Records</h2>
          </div>
          
          {filteredRecords.length === 0 ? (
            <div className="p-12 text-center">
              <FaTools className="mx-auto text-gray-400 text-6xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No maintenance records</h3>
              <p className="text-gray-600 mb-6">
                {records.length === 0
                  ? 'Schedule your first maintenance to get started'
                  : 'No records match your current filters'
                }
              </p>
              {records.length === 0 && (
                <button
                  onClick={() => {
                    setEditRecord(null);
                    resetForm();
                    setShowForm(true);
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  <FaPlus /> Schedule First Maintenance
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <div key={record.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {maintenanceTypes.find(t => t.value === record.type)?.icon}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{record.title}</h3>
                          <p className="text-sm text-gray-600">
                            {record.car_name} ({record.car_plate})
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{record.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt />
                          {new Date(record.scheduled_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaTachometerAlt />
                          {record.mileage?.toLocaleString()} miles
                        </span>
                        <span className="flex items-center gap-1">
                          <FaMoneyBillWave />
                          £{record.cost || record.estimated_cost || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <FaWrench />
                          {record.provider.name}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[record.status]}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[record.priority]}`}>
                          {record.priority} priority
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {record.status === 'scheduled' && (
                          <button
                            onClick={() => updateStatus(record.id, 'in_progress')}
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Start"
                          >
                            <FaClock />
                          </button>
                        )}
                        {record.status === 'in_progress' && (
                          <button
                            onClick={() => updateStatus(record.id, 'completed')}
                            className="text-green-600 hover:text-green-700 p-1"
                            title="Complete"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-gray-600 hover:text-gray-700 p-1"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <>
          {/* Backdrop Blur */}
          <div 
            className="fixed inset-0 z-40" 
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)'
            } as React.CSSProperties}
            onClick={() => {
              setShowForm(false);
              setEditRecord(null);
              resetForm();
            }}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editRecord ? 'Edit Maintenance' : 'Schedule Maintenance'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Car *
                  </label>
                  <select
                    value={formData.carId}
                    onChange={(e) => setFormData(prev => ({ ...prev, carId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    <option value="">Select a car</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.name} ({car.license_plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  >
                    {maintenanceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Cost (£)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Mileage
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.mileage}
                    onChange={(e) => setFormData(prev => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Service Provider</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider Name
                    </label>
                    <input
                      type="text"
                      value={formData.providerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact
                    </label>
                    <input
                      type="text"
                      value={formData.providerContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, providerContact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.providerAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, providerAddress: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  {editRecord ? 'Update Maintenance' : 'Schedule Maintenance'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditRecord(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 