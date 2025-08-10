'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaShieldAlt,
  FaSearch,
  FaFilter,
  FaDownload,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaFileAlt,
  FaCar,
  FaTools,
  FaUser,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Warranty {
  id: string;
  partner_id: string;
  vehicle_id: string;
  vehicle_name: string;
  vehicle_plate: string;
  warranty_type: 'manufacturer' | 'extended' | 'service' | 'parts' | 'other';
  provider: string;
  policy_number: string;
  start_date: string;
  end_date: string;
  coverage_details: string;
  terms_conditions: string;
  contact_info: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  cost: number;
  deductible?: number;
  claims_count: number;
  last_claim_date?: string;
  documents: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function WarrantyManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const didInitRef = React.useRef(false);

  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [filtered, setFiltered] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  // Form data
  const [formData, setFormData] = useState({
    vehicle_id: '',
    vehicle_name: '',
    vehicle_plate: '',
    warranty_type: 'manufacturer' as const,
    provider: '',
    policy_number: '',
    start_date: '',
    end_date: '',
    coverage_details: '',
    terms_conditions: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    cost: 0,
    deductible: 0,
    notes: ''
  });

  const warrantyTypes = [
    { value: 'manufacturer', label: 'Manufacturer Warranty' },
    { value: 'extended', label: 'Extended Warranty' },
    { value: 'service', label: 'Service Contract' },
    { value: 'parts', label: 'Parts Warranty' },
    { value: 'other', label: 'Other' }
  ];

  const getPartnerId = async () => {
    if (!user) return null;
    if (user.role === 'PARTNER') return user.id;
    if (user.role === 'PARTNER_STAFF') {
      const { data } = await supabase
        .from('partner_staff')
        .select('partner_id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.partner_id ?? null;
    }
    return null;
  };

  const loadWarranties = async () => {
    try {
      setLoading(true);
      const partnerId = await getPartnerId();
      if (!partnerId) { setWarranties([]); setFiltered([]); return; }

      // Mock data since warranty table doesn't exist yet
      const mockWarranties: Warranty[] = [
        {
          id: '1',
          partner_id: partnerId,
          vehicle_id: 'v1',
          vehicle_name: 'Honda CR-V',
          vehicle_plate: 'TEST-001',
          warranty_type: 'manufacturer',
          provider: 'Honda UK',
          policy_number: 'HW-2024-001',
          start_date: '2024-01-15',
          end_date: '2027-01-15',
          coverage_details: '3-year manufacturer warranty covering engine, transmission, and major components',
          terms_conditions: 'Standard manufacturer terms apply. Regular servicing required.',
          contact_info: {
            name: 'Honda Customer Service',
            phone: '0800 200 600',
            email: 'warranty@honda.co.uk',
            address: 'Honda UK Ltd, Mount Pleasant, London'
          },
          status: 'active',
          cost: 0,
          claims_count: 0,
          documents: [
            { name: 'Warranty Certificate', url: '#', type: 'pdf' },
            { name: 'Terms & Conditions', url: '#', type: 'pdf' }
          ],
          notes: 'Standard manufacturer warranty',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          partner_id: partnerId,
          vehicle_id: 'v2',
          vehicle_name: 'Toyota Camry',
          vehicle_plate: 'TEST-002',
          warranty_type: 'extended',
          provider: 'Warranty Direct',
          policy_number: 'WD-2024-002',
          start_date: '2024-03-01',
          end_date: '2026-03-01',
          coverage_details: 'Extended warranty covering mechanical breakdown and electrical systems',
          terms_conditions: 'Comprehensive coverage with £100 deductible per claim',
          contact_info: {
            name: 'Warranty Direct Claims',
            phone: '0333 321 4567',
            email: 'claims@warrantydirect.co.uk',
            address: 'Warranty Direct Ltd, Manchester'
          },
          status: 'active',
          cost: 899.00,
          deductible: 100,
          claims_count: 1,
          last_claim_date: '2024-06-15',
          documents: [
            { name: 'Extended Warranty Policy', url: '#', type: 'pdf' },
            { name: 'Claims Form', url: '#', type: 'pdf' }
          ],
          notes: 'Extended warranty purchased for additional coverage',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          partner_id: partnerId,
          vehicle_id: 'v3',
          vehicle_name: 'Ford Focus',
          vehicle_plate: 'TEST-003',
          warranty_type: 'service',
          provider: 'Ford Protect',
          policy_number: 'FP-2023-003',
          start_date: '2023-08-01',
          end_date: '2024-08-01',
          coverage_details: 'Service contract covering scheduled maintenance and wear items',
          terms_conditions: 'Covers oil changes, filters, and scheduled maintenance',
          contact_info: {
            name: 'Ford Protect Service',
            phone: '020 7946 0958',
            email: 'service@fordprotect.co.uk',
            address: 'Ford Motor Company Ltd, Brentwood'
          },
          status: 'expired',
          cost: 299.00,
          claims_count: 3,
          last_claim_date: '2024-07-20',
          documents: [
            { name: 'Service Contract', url: '#', type: 'pdf' },
            { name: 'Service History', url: '#', type: 'pdf' }
          ],
          notes: 'Service contract expired, considering renewal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setWarranties(mockWarranties);
      setFiltered(mockWarranties);
    } catch (e) {
      console.error('loadWarranties error', e);
      setWarranties([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (didInitRef.current) return; didInitRef.current = true; loadWarranties();
  }, [user, authLoading]);

  useEffect(() => {
    let list = [...warranties];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => 
        w.vehicle_name.toLowerCase().includes(q) || 
        w.provider.toLowerCase().includes(q) ||
        w.policy_number.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') list = list.filter(w => w.warranty_type === typeFilter);
    if (statusFilter !== 'all') list = list.filter(w => w.status === statusFilter);
    if (providerFilter !== 'all') list = list.filter(w => w.provider === providerFilter);
    setFiltered(list);
  }, [warranties, search, typeFilter, statusFilter, providerFilter]);

  const stats = React.useMemo(() => {
    const now = new Date();
    return {
      total: warranties.length,
      active: warranties.filter(w => w.status === 'active').length,
      expired: warranties.filter(w => w.status === 'expired').length,
      expiringSoon: warranties.filter(w => {
        if (w.status !== 'active') return false;
        const endDate = new Date(w.end_date);
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
      totalValue: warranties.reduce((sum, w) => sum + w.cost, 0)
    };
  }, [warranties]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWarranty) {
      setWarranties(prev => prev.map(w => w.id === editingWarranty.id ? {
        ...w,
        ...formData,
        contact_info: {
          name: formData.contact_name,
          phone: formData.contact_phone,
          email: formData.contact_email,
          address: formData.contact_address
        },
        updated_at: new Date().toISOString()
      } : w));
    } else {
      const newWarranty: Warranty = {
        id: Date.now().toString(),
        partner_id: await getPartnerId() || '',
        vehicle_id: formData.vehicle_id,
        vehicle_name: formData.vehicle_name,
        vehicle_plate: formData.vehicle_plate,
        warranty_type: formData.warranty_type,
        provider: formData.provider,
        policy_number: formData.policy_number,
        start_date: formData.start_date,
        end_date: formData.end_date,
        coverage_details: formData.coverage_details,
        terms_conditions: formData.terms_conditions,
        contact_info: {
          name: formData.contact_name,
          phone: formData.contact_phone,
          email: formData.contact_email,
          address: formData.contact_address
        },
        status: 'active',
        cost: formData.cost,
        deductible: formData.deductible,
        claims_count: 0,
        documents: [],
        notes: formData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setWarranties(prev => [...prev, newWarranty]);
    }
    setShowForm(false);
    setEditingWarranty(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      vehicle_name: '',
      vehicle_plate: '',
      warranty_type: 'manufacturer',
      provider: '',
      policy_number: '',
      start_date: '',
      end_date: '',
      coverage_details: '',
      terms_conditions: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      contact_address: '',
      cost: 0,
      deductible: 0,
      notes: ''
    });
  };

  const handleEdit = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setFormData({
      vehicle_id: warranty.vehicle_id,
      vehicle_name: warranty.vehicle_name,
      vehicle_plate: warranty.vehicle_plate,
      warranty_type: warranty.warranty_type,
      provider: warranty.provider,
      policy_number: warranty.policy_number,
      start_date: warranty.start_date,
      end_date: warranty.end_date,
      coverage_details: warranty.coverage_details,
      terms_conditions: warranty.terms_conditions,
      contact_name: warranty.contact_info.name,
      contact_phone: warranty.contact_info.phone,
      contact_email: warranty.contact_info.email,
      contact_address: warranty.contact_info.address,
      cost: warranty.cost,
      deductible: warranty.deductible || 0,
      notes: warranty.notes
    });
    setShowForm(true);
  };

  const handleDelete = (warrantyId: string) => {
    if (confirm('Are you sure you want to delete this warranty?')) {
      setWarranties(prev => prev.filter(w => w.id !== warrantyId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading warranty management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Warranty Management</h1>
              <p className="mt-1 text-sm text-gray-600">Track and manage vehicle warranties</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => {
                  setEditingWarranty(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Add Warranty
              </button>
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaShieldAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Warranties</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-blue-600">All policies</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-xs text-green-600">Current coverage</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
                <p className="text-xs text-yellow-600">Within 30 days</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
                <p className="text-xs text-red-600">Past due date</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaFileAlt className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.totalValue.toFixed(2)}</p>
                <p className="text-xs text-purple-600">Policy costs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Warranties</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search warranties..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {warrantyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Providers</option>
                {Array.from(new Set(warranties.map(w => w.provider))).map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Warranties Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Warranties ({filtered.length})</h3>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaShieldAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No warranties found</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first warranty to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((warranty) => {
                    const isExpiringSoon = warranty.status === 'active' && 
                      new Date(warranty.end_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    
                    return (
                      <tr key={warranty.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{warranty.vehicle_name}</div>
                          <div className="text-sm text-gray-500">{warranty.vehicle_plate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">
                            {warranty.warranty_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{warranty.provider}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{warranty.policy_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(warranty.end_date).toLocaleDateString()}
                          </div>
                          {isExpiringSoon && (
                            <div className="text-xs text-yellow-600">Expiring soon</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            warranty.status === 'active' ? 'bg-green-100 text-green-800' :
                            warranty.status === 'expired' ? 'bg-red-100 text-red-800' :
                            warranty.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {warranty.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(warranty)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(warranty.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            style={{ left: (typeof window !== 'undefined' ? (document.getElementById('partner-sidebar')?.offsetWidth || 0) : 0) }}
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingWarranty ? 'Edit Warranty' : 'Add New Warranty'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name *</label>
                    <input
                      type="text"
                      value={formData.vehicle_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicle_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                    <input
                      type="text"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicle_plate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Type</label>
                    <select
                      value={formData.warranty_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, warranty_type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      {warrantyTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                    <input
                      type="text"
                      value={formData.policy_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, policy_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Details</label>
                  <textarea
                    value={formData.coverage_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverage_details: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost (£)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deductible (£)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.deductible}
                      onChange={(e) => setFormData(prev => ({ ...prev, deductible: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={formData.contact_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={formData.contact_address}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    {editingWarranty ? 'Update Warranty' : 'Add Warranty'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
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