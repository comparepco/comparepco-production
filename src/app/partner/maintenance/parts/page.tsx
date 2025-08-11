'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  FaBoxes,
  FaSearch,
  FaFilter,
  FaDownload,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaBarcode,
  FaMoneyBillWave,
  FaWarehouse,
  FaTruck,
  FaTools
} from 'react-icons/fa';
import { createClient } from '@supabase/supabase-js';
import { useSidebar } from '@/contexts/SidebarContext';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Part {
  id: string;
  partner_id: string;
  name: string;
  part_number: string;
  category: string;
  description: string;
  quantity: number;
  min_quantity: number;
  unit_cost: number;
  supplier: string;
  supplier_contact: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  last_restocked: string;
  created_at: string;
  updated_at: string;
}

export default function PartsInventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const didInitRef = React.useRef(false);
  const { sidebarLeft } = useSidebar();

  const [parts, setParts] = useState<Part[]>([]);
  const [filtered, setFiltered] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    category: '',
    description: '',
    quantity: 0,
    min_quantity: 0,
    unit_cost: 0,
    supplier: '',
    supplier_contact: '',
    location: '',
    status: 'in_stock' as const
  });

  const categories = [
    'Engine Parts',
    'Brake System',
    'Suspension',
    'Electrical',
    'Body Parts',
    'Interior',
    'Tires & Wheels',
    'Fluids & Lubricants',
    'Tools & Equipment',
    'Other'
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

  const loadParts = async () => {
    try {
      setLoading(true);
      const partnerId = await getPartnerId();
      if (!partnerId) { setParts([]); setFiltered([]); return; }

      // For now, we'll create mock data since parts_inventory table doesn't exist
      // In production, this would be a real Supabase query
      const mockParts: Part[] = [
        {
          id: '1',
          partner_id: partnerId,
          name: 'Oil Filter',
          part_number: 'OF-001',
          category: 'Engine Parts',
          description: 'High-quality oil filter for various engine types',
          quantity: 45,
          min_quantity: 10,
          unit_cost: 12.50,
          supplier: 'AutoParts Pro',
          supplier_contact: 'contact@autopartspro.com',
          location: 'Warehouse A - Shelf 1',
          status: 'in_stock',
          last_restocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          partner_id: partnerId,
          name: 'Brake Pads',
          part_number: 'BP-002',
          category: 'Brake System',
          description: 'Ceramic brake pads for front wheels',
          quantity: 8,
          min_quantity: 15,
          unit_cost: 45.00,
          supplier: 'Brake Masters',
          supplier_contact: 'sales@brakemasters.co.uk',
          location: 'Warehouse B - Shelf 3',
          status: 'low_stock',
          last_restocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          partner_id: partnerId,
          name: 'Air Filter',
          part_number: 'AF-003',
          category: 'Engine Parts',
          description: 'Premium air filter for improved engine performance',
          quantity: 0,
          min_quantity: 5,
          unit_cost: 18.75,
          supplier: 'Filter World',
          supplier_contact: 'orders@filterworld.com',
          location: 'Warehouse A - Shelf 2',
          status: 'out_of_stock',
          last_restocked: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setParts(mockParts);
      setFiltered(mockParts);
    } catch (e) {
      console.error('loadParts error', e);
      setParts([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (didInitRef.current) return; didInitRef.current = true; loadParts();
  }, [user, authLoading]);

  useEffect(() => {
    let list = [...parts];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.part_number.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') list = list.filter(p => p.category === categoryFilter);
    if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter);
    if (supplierFilter !== 'all') list = list.filter(p => p.supplier === supplierFilter);
    setFiltered(list);
  }, [parts, search, categoryFilter, statusFilter, supplierFilter]);

  const stats = React.useMemo(() => {
    return {
      total: parts.length,
      inStock: parts.filter(p => p.status === 'in_stock').length,
      lowStock: parts.filter(p => p.status === 'low_stock').length,
      outOfStock: parts.filter(p => p.status === 'out_of_stock').length,
      totalValue: parts.reduce((sum, p) => sum + (p.quantity * p.unit_cost), 0)
    };
  }, [parts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would save to Supabase
    if (editingPart) {
      setParts(prev => prev.map(p => p.id === editingPart.id ? { ...p, ...formData, updated_at: new Date().toISOString() } : p));
    } else {
      const newPart: Part = {
        id: Date.now().toString(),
        partner_id: await getPartnerId() || '',
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setParts(prev => [...prev, newPart]);
    }
    setShowForm(false);
    setEditingPart(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      part_number: '',
      category: '',
      description: '',
      quantity: 0,
      min_quantity: 0,
      unit_cost: 0,
      supplier: '',
      supplier_contact: '',
      location: '',
      status: 'in_stock'
    });
  };

  const handleEdit = (part: Part) => {
    setEditingPart(part);
    setFormData({
      name: part.name,
      part_number: part.part_number,
      category: part.category,
      description: part.description,
      quantity: part.quantity,
      min_quantity: part.min_quantity,
      unit_cost: part.unit_cost,
      supplier: part.supplier,
      supplier_contact: part.supplier_contact,
      location: part.location,
      status: part.status
    });
    setShowForm(true);
  };

  const handleDelete = (partId: string) => {
    if (confirm('Are you sure you want to delete this part?')) {
      setParts(prev => prev.filter(p => p.id !== partId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading parts inventory...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
              <p className="mt-1 text-sm text-gray-600">Manage vehicle parts and supplies</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => {
                  setEditingPart(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Add Part
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
                <FaBoxes className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-blue-600">In inventory</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inStock}</p>
                <p className="text-xs text-green-600">Well stocked</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStock}</p>
                <p className="text-xs text-yellow-600">Need reorder</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-3 rounded-lg">
                <FaClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStock}</p>
                <p className="text-xs text-red-600">Urgent reorder</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaMoneyBillWave className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">£{stats.totalValue.toFixed(2)}</p>
                <p className="text-xs text-purple-600">Inventory value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Parts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search parts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="discontinued">Discontinued</option>
              </select>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Suppliers</option>
                {Array.from(new Set(parts.map(p => p.supplier))).map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Parts Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Parts Inventory ({filtered.length})</h3>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FaBoxes className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No parts found</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first part to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{part.name}</div>
                        <div className="text-sm text-gray-500">{part.part_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{part.quantity}</div>
                        <div className="text-xs text-gray-500">Min: {part.min_quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{part.unit_cost.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          part.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                          part.status === 'low_stock' ? 'bg-yellow-100 text-yellow-800' :
                          part.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {part.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{part.supplier}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(part)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(part.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            style={{ left: sidebarLeft }}
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingPart ? 'Edit Part' : 'Add New Part'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                    <input
                      type="text"
                      value={formData.part_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, part_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, min_quantity: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (£)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unit_cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Contact</label>
                    <input
                      type="text"
                      value={formData.supplier_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_contact: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="in_stock">In Stock</option>
                      <option value="low_stock">Low Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    {editingPart ? 'Update Part' : 'Add Part'}
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