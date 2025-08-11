'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaCar, FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  pricePerDay: number;
  pricePerWeek: number;
  rideHailingCategories?: string[];
  isActive: boolean;
  licensePlate: string;
  color: string;
  seats: number;
  fuelType: string;
  transmission: string;
}

interface PricingTemplate {
  id: string;
  name: string;
  category: string;
  make: string;
  model: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  rideHailingCategories?: string[];
  isActive: boolean;
}

const RIDE_HAILING_CATEGORIES = [
  'UBER_X',
  'UBER_COMFORT',
  'UBER_PREMIUM',
  'UBER_XL',
  'LYFT_STANDARD',
  'LYFT_PREMIUM',
  'LYFT_XL',
  'BOLT_STANDARD',
  'BOLT_PREMIUM',
  'BOLT_XL',
  'FREE_NOW_STANDARD',
  'FREE_NOW_PREMIUM',
  'FREE_NOW_XL'
];

const VEHICLE_CATEGORIES = [
  'Economy',
  'Compact',
  'Mid-size',
  'Full-size',
  'Luxury',
  'SUV',
  'Minivan',
  'Van',
  'Truck',
  'Electric',
  'Hybrid'
];

export default function PartnerPricingPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PricingTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: '',
    make: '',
    model: '',
    dailyRate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    rideHailingCategories: [] as string[]
  });

  const [bulkEditForm, setBulkEditForm] = useState({
    selectedCategory: '',
    selectedMake: '',
    selectedModel: '',
    dailyRate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    rideHailingCategories: [] as string[]
  });

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchVehicles();
      fetchPricingTemplates();
    }
  }, [user?.id]);

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`/api/partner/vehicles?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const data = await response.json();
      setVehicles(data.vehicles || []);
    } catch (err) {
      setError('Failed to fetch vehicles');
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchPricingTemplates = async () => {
    try {
      const response = await fetch(`/api/partner/pricing-templates?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch pricing templates');
      const data = await response.json();
      setPricingTemplates(data.templates || []);
    } catch (err) {
      setError('Failed to fetch pricing templates');
      console.error('Error fetching pricing templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      category: '',
      make: '',
      model: '',
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      rideHailingCategories: []
    });
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: PricingTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      category: template.category,
      make: template.make,
      model: template.model,
      dailyRate: template.dailyRate,
      weeklyRate: template.weeklyRate,
      monthlyRate: template.monthlyRate,
      rideHailingCategories: template.rideHailingCategories || []
    });
    setShowTemplateModal(true);
  };

  const handleSubmitTemplate = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Validation
      if (!templateForm.name || !templateForm.category) {
        setError('Please fill in all required fields');
        return;
      }

      if (templateForm.dailyRate <= 0) {
        setError('Daily rate must be greater than 0');
        return;
      }

      const url = editingTemplate 
        ? `/api/partner/pricing-templates/${editingTemplate.id}?userId=${user?.id}`
        : `/api/partner/pricing-templates?userId=${user?.id}`;

      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      if (!response.ok) throw new Error('Failed to save template');

      setShowTemplateModal(false);
      setSuccessMessage(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
      fetchPricingTemplates();
    } catch (err) {
      setError('Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkEdit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      if (!bulkEditForm.selectedCategory) {
        setError('Please select a category to update');
        return;
      }

      const response = await fetch(`/api/partner/vehicles/bulk-update-pricing?userId=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkEditForm)
      });

      if (!response.ok) throw new Error('Failed to update pricing');

      setShowBulkEditModal(false);
      setSuccessMessage('Pricing updated successfully!');
      fetchVehicles();
    } catch (err) {
      setError('Failed to update pricing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/partner/pricing-templates/${id}?userId=${user?.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete template');

      setSuccessMessage('Template deleted successfully!');
      fetchPricingTemplates();
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  const handleUpdateVehiclePricing = async (vehicleId: string, pricing: any) => {
    try {
      const response = await fetch(`/api/partner/vehicles/${vehicleId}/pricing?userId=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricing)
      });

      if (!response.ok) throw new Error('Failed to update vehicle pricing');

      setSuccessMessage('Vehicle pricing updated successfully!');
      fetchVehicles();
    } catch (err) {
      setError('Failed to update vehicle pricing');
    }
  };

  const getUniqueMakes = () => {
    const makes = new Set(vehicles.map(v => v.make).filter(Boolean));
    return Array.from(makes).sort();
  };

  const getUniqueModels = () => {
    const models = new Set(vehicles.map(v => v.model).filter(Boolean));
    return Array.from(models).sort();
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    if (categoryFilter && vehicle.category !== categoryFilter) return false;
    if (makeFilter && vehicle.make !== makeFilter) return false;
    if (modelFilter && vehicle.model !== modelFilter) return false;
    if (statusFilter && vehicle.isActive.toString() !== statusFilter) return false;
    return true;
  });

  const filteredTemplates = pricingTemplates.filter(template => {
    if (categoryFilter && template.category !== categoryFilter) return false;
    if (makeFilter && template.make !== makeFilter) return false;
    if (modelFilter && template.model !== modelFilter) return false;
    if (statusFilter && template.isActive.toString() !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pricing Management</h1>
          <p className="text-gray-600">Manage pricing for your vehicle fleet by categories, makes, and models</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <FaCheck className="text-green-500 mr-2" />
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleCreateTemplate}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center"
          >
            <FaPlus className="mr-2" />
            Create Pricing Template
          </button>
          <button
            onClick={() => setShowBulkEditModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <FaEdit className="mr-2" />
            Bulk Edit Pricing
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center"
          >
            <FaCar className="mr-2" />
            Export Pricing
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {VEHICLE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Makes</option>
                {getUniqueMakes().map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <select
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Models</option>
                {getUniqueModels().map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Templates */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pricing Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div key={template.id} className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600">{template.make} {template.model}</p>
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-1">
                      {template.category}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Daily Rate:</span>
                    <span className="font-semibold">£{template.dailyRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Weekly Rate:</span>
                    <span className="font-semibold">£{template.weeklyRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Rate:</span>
                    <span className="font-semibold">£{template.monthlyRate}</span>
                  </div>
                </div>

                {template.rideHailingCategories && template.rideHailingCategories.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Ride-hailing Categories:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.rideHailingCategories.map(category => (
                        <span key={category} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    template.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Pricing */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Vehicle Pricing</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Daily Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weekly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ride-hailing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map(vehicle => (
                    <tr key={vehicle.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.licensePlate} • {vehicle.year}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {vehicle.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        £{vehicle.dailyRate || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        £{vehicle.weeklyRate || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        £{vehicle.monthlyRate || 0}
                      </td>
                                             <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex flex-wrap gap-1">
                           {vehicle.rideHailingCategories && vehicle.rideHailingCategories.slice(0, 3).map(category => (
                             <span key={category} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                               {category}
                             </span>
                           ))}
                           {vehicle.rideHailingCategories && vehicle.rideHailingCategories.length > 3 && (
                             <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                               +{vehicle.rideHailingCategories.length - 3}
                             </span>
                           )}
                         </div>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          vehicle.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {vehicle.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditTemplate({
                            id: vehicle.id,
                            name: `${vehicle.make} ${vehicle.model}`,
                            category: vehicle.category || '',
                            make: vehicle.make || '',
                            model: vehicle.model || '',
                            dailyRate: vehicle.dailyRate || 0,
                            weeklyRate: vehicle.weeklyRate || 0,
                            monthlyRate: vehicle.monthlyRate || 0,
                            rideHailingCategories: vehicle.rideHailingCategories || [],
                            isActive: vehicle.isActive
                          })}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
            <div className="modal-content w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  {editingTemplate ? 'Edit Pricing Template' : 'Create Pricing Template'}
                </h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Economy Sedan Template"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {VEHICLE_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input
                      type="text"
                      value={templateForm.make}
                      onChange={(e) => setTemplateForm({...templateForm, make: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Toyota"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={templateForm.model}
                      onChange={(e) => setTemplateForm({...templateForm, model: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Corolla"
                    />
                  </div>
                </div>

                {/* Pricing Configuration */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Daily Rate <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={templateForm.dailyRate || ''}
                        onChange={(e) => setTemplateForm({...templateForm, dailyRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="50"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Weekly Rate</label>
                      <input
                        type="number"
                        value={templateForm.weeklyRate || ''}
                        onChange={(e) => setTemplateForm({...templateForm, weeklyRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="300"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Monthly Rate</label>
                      <input
                        type="number"
                        value={templateForm.monthlyRate || ''}
                        onChange={(e) => setTemplateForm({...templateForm, monthlyRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="1200"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Ride-hailing Categories */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Ride-hailing Categories</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {RIDE_HAILING_CATEGORIES.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={templateForm.rideHailingCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTemplateForm({
                                ...templateForm,
                                rideHailingCategories: [...templateForm.rideHailingCategories, category]
                              });
                            } else {
                              setTemplateForm({
                                ...templateForm,
                                rideHailingCategories: templateForm.rideHailingCategories.filter(c => c !== category)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTemplate}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    isSubmitting 
                      ? 'bg-purple-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    editingTemplate ? 'Update Template' : 'Create Template'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Edit Modal */}
        {showBulkEditModal && (
          <div className="modal-overlay" onClick={() => setShowBulkEditModal(false)}>
            <div className="modal-content w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Bulk Edit Pricing</h3>
                <button
                  onClick={() => setShowBulkEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Selection Criteria */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Selection Criteria</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                      <select
                        value={bulkEditForm.selectedCategory}
                        onChange={(e) => setBulkEditForm({...bulkEditForm, selectedCategory: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Categories</option>
                        {VEHICLE_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Make</label>
                      <select
                        value={bulkEditForm.selectedMake}
                        onChange={(e) => setBulkEditForm({...bulkEditForm, selectedMake: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Makes</option>
                        {getUniqueMakes().map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                      <select
                        value={bulkEditForm.selectedModel}
                        onChange={(e) => setBulkEditForm({...bulkEditForm, selectedModel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Models</option>
                        {getUniqueModels().map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* New Pricing */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">New Pricing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Daily Rate</label>
                      <input
                        type="number"
                        value={bulkEditForm.dailyRate || ''}
                        onChange={(e) => setBulkEditForm({...bulkEditForm, dailyRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="50"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Weekly Rate</label>
                      <input
                        type="number"
                        value={bulkEditForm.weeklyRate || ''}
                        onChange={(e) => setBulkEditForm({...bulkEditForm, weeklyRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="300"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Monthly Rate</label>
                      <input
                        type="number"
                        value={bulkEditForm.monthlyRate || ''}
                        onChange={(e) => setBulkEditForm({...bulkEditForm, monthlyRate: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="1200"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Ride-hailing Categories */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Ride-hailing Categories</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {RIDE_HAILING_CATEGORIES.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={bulkEditForm.rideHailingCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkEditForm({
                                ...bulkEditForm,
                                rideHailingCategories: [...bulkEditForm.rideHailingCategories, category]
                              });
                            } else {
                              setBulkEditForm({
                                ...bulkEditForm,
                                rideHailingCategories: bulkEditForm.rideHailingCategories.filter(c => c !== category)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBulkEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkEdit}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    isSubmitting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Pricing'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 