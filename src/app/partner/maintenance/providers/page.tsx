'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaWrench,
  FaSearch,
  FaFilter,
  FaDownload,
  FaPlus,
  FaEdit,
  FaTrash,
  FaStar,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaBuilding,
  FaTools,
  FaCar,
  FaShieldAlt
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ServiceProvider {
  id: string;
  partner_id: string;
  name: string;
  type: 'garage' | 'dealership' | 'mobile' | 'specialist' | 'other';
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postcode: string;
  services: string[];
  specializations: string[];
  rating: number;
  total_reviews: number;
  response_time_hours: number;
  availability: '24/7' | 'business_hours' | 'weekdays' | 'by_appointment';
  payment_methods: string[];
  certifications: string[];
  insurance_coverage: boolean;
  warranty_offered: boolean;
  emergency_service: boolean;
  status: 'active' | 'inactive' | 'suspended';
  notes: string;
  created_at: string;
  updated_at: string;
}

export default function ServiceProvidersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const didInitRef = React.useRef(false);

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filtered, setFiltered] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    type: 'garage' as const,
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postcode: '',
    services: [] as string[],
    specializations: [] as string[],
    rating: 0,
    response_time_hours: 24,
    availability: 'business_hours' as const,
    payment_methods: [] as string[],
    certifications: [] as string[],
    insurance_coverage: false,
    warranty_offered: false,
    emergency_service: false,
    notes: ''
  });

  const providerTypes = [
    { value: 'garage', label: 'Garage' },
    { value: 'dealership', label: 'Dealership' },
    { value: 'mobile', label: 'Mobile Service' },
    { value: 'specialist', label: 'Specialist' },
    { value: 'other', label: 'Other' }
  ];

  const availableServices = [
    'Oil Change',
    'Brake Service',
    'Tire Service',
    'Engine Repair',
    'Transmission Service',
    'Electrical Work',
    'Body Work',
    'Paint & Refinishing',
    'MOT Testing',
    'Diagnostic Services',
    'Air Conditioning',
    'Exhaust System',
    'Suspension Work',
    'Battery Service',
    'Wheel Alignment'
  ];

  const paymentMethods = [
    'Cash',
    'Card',
    'Bank Transfer',
    'Invoice',
    'Credit Account',
    'Insurance Direct'
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

  const loadProviders = async () => {
    try {
      setLoading(true);
      const partnerId = await getPartnerId();
      if (!partnerId) { setProviders([]); setFiltered([]); return; }

      // Mock data since service_providers table doesn't exist yet
      const mockProviders: ServiceProvider[] = [
        {
          id: '1',
          partner_id: partnerId,
          name: 'ABC Auto Services',
          type: 'garage',
          contact_person: 'John Smith',
          phone: '020 7946 0958',
          email: 'service@abcauto.co.uk',
          address: '123 High Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          services: ['Oil Change', 'Brake Service', 'MOT Testing', 'Engine Repair'],
          specializations: ['Japanese Cars', 'European Cars'],
          rating: 4.5,
          total_reviews: 127,
          response_time_hours: 4,
          availability: 'business_hours',
          payment_methods: ['Cash', 'Card', 'Invoice'],
          certifications: ['VOSA Approved', 'ISO 9001'],
          insurance_coverage: true,
          warranty_offered: true,
          emergency_service: true,
          status: 'active',
          notes: 'Reliable garage with good reputation',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          partner_id: partnerId,
          name: 'Honda Dealership London',
          type: 'dealership',
          contact_person: 'Sarah Johnson',
          phone: '020 7946 0959',
          email: 'service@hondalondon.co.uk',
          address: '456 Oxford Street',
          city: 'London',
          postcode: 'W1C 1AP',
          services: ['Oil Change', 'Brake Service', 'Engine Repair', 'Warranty Work'],
          specializations: ['Honda Vehicles'],
          rating: 4.8,
          total_reviews: 89,
          response_time_hours: 2,
          availability: 'business_hours',
          payment_methods: ['Card', 'Invoice', 'Warranty'],
          certifications: ['Honda Certified', 'VOSA Approved'],
          insurance_coverage: true,
          warranty_offered: true,
          emergency_service: false,
          status: 'active',
          notes: 'Official Honda dealership with factory-trained technicians',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          partner_id: partnerId,
          name: 'Mobile Mechanic Pro',
          type: 'mobile',
          contact_person: 'Mike Wilson',
          phone: '07700 900000',
          email: 'mike@mobilemechanicpro.co.uk',
          address: 'Mobile Service',
          city: 'London',
          postcode: 'Various',
          services: ['Oil Change', 'Brake Service', 'Battery Service', 'Diagnostic Services'],
          specializations: ['Mobile Repairs', 'Emergency Callouts'],
          rating: 4.2,
          total_reviews: 45,
          response_time_hours: 1,
          availability: '24/7',
          payment_methods: ['Cash', 'Card', 'Bank Transfer'],
          certifications: ['Mobile Mechanic Certified'],
          insurance_coverage: true,
          warranty_offered: false,
          emergency_service: true,
          status: 'active',
          notes: 'Convenient mobile service for basic repairs',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setProviders(mockProviders);
      setFiltered(mockProviders);
    } catch (e) {
      console.error('loadProviders error', e);
      setProviders([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (didInitRef.current) return; didInitRef.current = true; loadProviders();
  }, [user, authLoading]);

  useEffect(() => {
    let list = [...providers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.contact_person.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') list = list.filter(p => p.type === typeFilter);
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (serviceFilter !== 'all') list = list.filter(p => p.services.includes(serviceFilter));
    setFiltered(list);
  }, [providers, search, typeFilter, statusFilter, serviceFilter]);

  const stats = React.useMemo(() => {
    return {
      total: providers.length,
      active: providers.filter(p => p.status === 'active').length,
      averageRating: providers.length > 0 ? 
        providers.reduce((sum, p) => sum + p.rating, 0) / providers.length : 0,
      emergencyService: providers.filter(p => p.emergency_service).length,
      totalReviews: providers.reduce((sum, p) => sum + p.total_reviews, 0)
    };
  }, [providers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProvider) {
      setProviders(prev => prev.map(p => p.id === editingProvider.id ? {
        ...p,
        ...formData,
        updated_at: new Date().toISOString()
      } : p));
    } else {
      const newProvider: ServiceProvider = {
        id: Date.now().toString(),
        partner_id: await getPartnerId() || '',
        ...formData,
        total_reviews: 0,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProviders(prev => [...prev, newProvider]);
    }
    setShowForm(false);
    setEditingProvider(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'garage',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      postcode: '',
      services: [],
      specializations: [],
      rating: 0,
      response_time_hours: 24,
      availability: 'business_hours',
      payment_methods: [],
      certifications: [],
      insurance_coverage: false,
      warranty_offered: false,
      emergency_service: false,
      notes: ''
    });
  };

  const handleEdit = (provider: ServiceProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type,
      contact_person: provider.contact_person,
      phone: provider.phone,
      email: provider.email,
      address: provider.address,
      city: provider.city,
      postcode: provider.postcode,
      services: provider.services,
      specializations: provider.specializations,
      rating: provider.rating,
      response_time_hours: provider.response_time_hours,
      availability: provider.availability,
      payment_methods: provider.payment_methods,
      certifications: provider.certifications,
      insurance_coverage: provider.insurance_coverage,
      warranty_offered: provider.warranty_offered,
      emergency_service: provider.emergency_service,
      notes: provider.notes
    });
    setShowForm(true);
  };

  const handleDelete = (providerId: string) => {
    if (confirm('Are you sure you want to delete this service provider?')) {
      setProviders(prev => prev.filter(p => p.id !== providerId));
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service providers...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your network of service providers</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => {
                  setEditingProvider(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Add Provider
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
                <FaWrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Providers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-blue-600">In network</p>
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
                <p className="text-xs text-green-600">Available</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaStar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                <p className="text-xs text-yellow-600">Out of 5</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Emergency</p>
                <p className="text-2xl font-bold text-gray-900">{stats.emergencyService}</p>
                <p className="text-xs text-red-600">24/7 service</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaUser className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                <p className="text-xs text-purple-600">Customer feedback</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Providers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search providers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {providerTypes.map(type => (
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
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Services</option>
                {availableServices.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{provider.type.replace('_', ' ')}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(provider)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUser className="w-4 h-4 mr-2" />
                    {provider.contact_person}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaPhone className="w-4 h-4 mr-2" />
                    {provider.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaEnvelope className="w-4 h-4 mr-2" />
                    {provider.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                    {provider.city}, {provider.postcode}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaClock className="w-4 h-4 mr-2" />
                    {provider.response_time_hours}h response time
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  {renderStars(provider.rating)}
                  <p className="text-xs text-gray-500 mt-1">{provider.total_reviews} reviews</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-1">
                    {provider.services.slice(0, 3).map((service) => (
                      <span
                        key={service}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {service}
                      </span>
                    ))}
                    {provider.services.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{provider.services.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      provider.status === 'active' ? 'bg-green-100 text-green-800' :
                      provider.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {provider.status}
                    </span>
                    {provider.emergency_service && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Emergency
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FaWrench className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No service providers found</h3>
            <p className="mt-1 text-sm text-gray-500">Add your first service provider to get started.</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:left-72" onClick={() => setShowForm(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProvider ? 'Edit Service Provider' : 'Add New Service Provider'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      {providerTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response Time (hours)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.response_time_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, response_time_hours: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                    <input
                      type="text"
                      value={formData.postcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Services Offered</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableServices.map((service) => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, services: [...prev.services, service] }));
                            } else {
                              setFormData(prev => ({ ...prev, services: prev.services.filter(s => s !== service) }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    <select
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="business_hours">Business Hours</option>
                      <option value="24/7">24/7</option>
                      <option value="weekdays">Weekdays Only</option>
                      <option value="by_appointment">By Appointment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.insurance_coverage}
                      onChange={(e) => setFormData(prev => ({ ...prev, insurance_coverage: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Insurance Coverage</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.warranty_offered}
                      onChange={(e) => setFormData(prev => ({ ...prev, warranty_offered: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Warranty Offered</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.emergency_service}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergency_service: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Emergency Service</span>
                  </label>
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
                    {editingProvider ? 'Update Provider' : 'Add Provider'}
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