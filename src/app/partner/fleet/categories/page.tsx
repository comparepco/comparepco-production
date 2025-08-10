'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import { 
  FaTags, FaCar, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, 
  FaDownload, FaExclamationTriangle, FaCheckCircle, FaClock, FaPoundSign, 
  FaTachometerAlt, FaStar, FaTimes, FaSave, FaChartLine, FaUsers, 
  FaCalendarAlt, FaInfoCircle, FaSpinner 
} from 'react-icons/fa';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface VehicleCategory {
  id: string;
  name: string;
  description: string;
  daily_rate_range: string;
  vehicle_count: number;
  total_revenue: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
  min_rate?: number;
  max_rate?: number;
  target_market?: string;
  features?: string[];
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  daily_rate: number;
  category?: string;
  ride_hailing_categories?: string[];
  status: string;
  is_available: boolean;
  total_bookings?: number;
  total_revenue?: number;
  average_rating?: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  daily_rate_range: string;
  min_rate: number;
  max_rate: number;
  target_market: string;
  features: string[];
  is_active: boolean;
}

export default function VehicleCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    daily_rate_range: '',
    min_rate: 0,
    max_rate: 0,
    target_market: '',
    features: [],
    is_active: true
  });
  const [processing, setProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    totalVehicles: 0,
    totalRevenue: 0
  });

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadCategoryData();
    }
  }, [user]);

  // Memoize expensive computations
  const categoryStats = useMemo(() => {
    return {
      totalCategories: categories.length,
      activeCategories: categories.filter(cat => cat.is_active).length,
      totalVehicles: vehicles.length,
      totalRevenue: categories.reduce((sum, cat) => sum + cat.total_revenue, 0)
    };
  }, [categories, vehicles]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch partner's vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', user?.id)
        .eq('is_active', true);

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Fetch partner's vehicle categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vehicle_categories')
        .select('*')
        .eq('partner_id', user?.id)
        .order('created_at', { ascending: false });

      if (categoriesError) throw categoriesError;
      
      // Auto-sync missing categories from vehicles
      const existingCategoryNames = new Set((categoriesData || []).map(cat => cat.name.toLowerCase()));
      const vehicleCategories = new Set<string>();
      
      // Collect all categories from vehicles (both category and ride_hailing_categories fields)
      vehiclesData?.forEach(vehicle => {
        if (vehicle.category) {
          vehicleCategories.add(vehicle.category.toLowerCase());
        }
        if (vehicle.ride_hailing_categories && Array.isArray(vehicle.ride_hailing_categories)) {
          vehicle.ride_hailing_categories.forEach((cat: string) => vehicleCategories.add(cat.toLowerCase()));
        }
      });

      // Create missing categories
      const missingCategories = Array.from(vehicleCategories).filter(catName => !existingCategoryNames.has(catName));
      
      if (missingCategories.length > 0) {
        const newCategories = missingCategories.map(catName => ({
          partner_id: user?.id,
          name: catName.toUpperCase(),
          description: `${catName.toUpperCase()} category vehicles`,
          daily_rate_range: '£0-0',
          min_rate: 0,
          max_rate: 0,
          target_market: 'General',
          features: [],
          vehicle_count: 0,
          total_revenue: 0,
          average_rating: 0,
          is_active: true
        }));

        const { data: insertedCategories, error: insertError } = await supabase
          .from('vehicle_categories')
          .insert(newCategories)
          .select();

        if (insertError) {
          console.error('Error creating missing categories:', insertError);
        } else {
          // Merge existing and new categories
          const allCategories = [...(categoriesData || []), ...(insertedCategories || [])];
          setCategories(allCategories);
          
          // Update stats with new categories
          const totalCategories = allCategories.length;
          const activeCategories = allCategories.filter(cat => cat.is_active).length;
          const totalVehicles = vehiclesData?.length || 0;
          const totalRevenue = allCategories.reduce((sum, cat) => sum + cat.total_revenue, 0);

          setStats({
            totalCategories,
            activeCategories,
            totalVehicles,
            totalRevenue
          });
          
          return; // Exit early since we've set the data
        }
      }

      // If no missing categories, use original data
      setCategories(categoriesData || []);

      // Calculate stats
      const totalCategories = categoriesData?.length || 0;
      const activeCategories = categoriesData?.filter(cat => cat.is_active).length || 0;
      const totalVehicles = vehiclesData?.length || 0;
      const totalRevenue = categoriesData?.reduce((sum, cat) => sum + cat.total_revenue, 0) || 0;

      setStats({
        totalCategories,
        activeCategories,
        totalVehicles,
        totalRevenue
      });

    } catch (error) {
      console.error('Error loading category data:', error);
      setError('Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName.toUpperCase()) {
      case 'X': return 'bg-green-100 text-green-800';
      case 'COMFORT': return 'bg-blue-100 text-blue-800';
      case 'BUSINESS COMFORT': return 'bg-purple-100 text-purple-800';
      case 'EXEC': return 'bg-indigo-100 text-indigo-800';
      case 'GREEN': return 'bg-teal-100 text-teal-800';
      case 'LUX': return 'bg-yellow-100 text-yellow-800';
      case 'BLACKLANE': return 'bg-black text-white';
      case 'WHEELY': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportCategoryData = () => {
    const csvContent = [
      ['Category', 'Description', 'Weekly Rate Range', 'Target Market', 'Vehicle Count', 'Total Revenue', 'Average Rating', 'Status', 'Features'],
      ...filteredCategories.map(cat => [
        cat.name,
        cat.description,
        cat.daily_rate_range,
        cat.target_market || '',
        cat.vehicle_count.toString(),
        `£${cat.total_revenue.toLocaleString()}`,
        cat.average_rating.toFixed(1),
        cat.is_active ? 'Active' : 'Inactive',
        (cat.features || []).join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle_categories_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Predefined PCO categories
  const predefinedCategories = [
    { name: 'X', description: 'Economy vehicles for budget-conscious drivers', min_rate: 30, max_rate: 50, target_market: 'Budget-conscious drivers', features: ['Fuel efficient', 'Compact size', 'Basic features'] },
    { name: 'COMFORT', description: 'Standard vehicles for everyday use', min_rate: 50, max_rate: 80, target_market: 'Everyday drivers', features: ['Comfortable', 'Mid-size', 'Standard features'] },
    { name: 'BUSINESS COMFORT', description: 'Premium vehicles for business travelers', min_rate: 80, max_rate: 120, target_market: 'Business travelers', features: ['Premium comfort', 'Professional appearance', 'Advanced features'] },
    { name: 'EXEC', description: 'Executive vehicles for high-end clients', min_rate: 120, max_rate: 200, target_market: 'High-end clients', features: ['Luxury', 'Executive class', 'Premium features'] },
    { name: 'GREEN', description: 'Electric and hybrid vehicles for eco-conscious drivers', min_rate: 70, max_rate: 130, target_market: 'Eco-conscious drivers', features: ['Electric/Hybrid', 'Environmentally friendly', 'Modern technology'] },
    { name: 'LUX', description: 'Luxury vehicles for premium experience', min_rate: 150, max_rate: 300, target_market: 'Luxury seekers', features: ['Ultra-luxury', 'Premium brand', 'Exclusive features'] },
    { name: 'BLACKLANE', description: 'Premium black car service vehicles', min_rate: 200, max_rate: 400, target_market: 'Black car service', features: ['Professional service', 'Black car standard', 'Chauffeur ready'] },
    { name: 'WHEELY', description: 'Specialized vehicles for unique requirements', min_rate: 100, max_rate: 250, target_market: 'Specialized needs', features: ['Specialized', 'Unique requirements', 'Custom solutions'] }
  ];

  const handleAddCategory = () => {
    setFormData({
      name: '',
      description: '',
      daily_rate_range: '',
      min_rate: 0,
      max_rate: 0,
      target_market: '',
      features: [],
      is_active: true
    });
    setShowAddModal(true);
  };

  const selectPredefinedCategory = (category: typeof predefinedCategories[0]) => {
    setFormData({
      name: category.name,
      description: category.description,
      daily_rate_range: `£${category.min_rate}-${category.max_rate}`,
      min_rate: category.min_rate,
      max_rate: category.max_rate,
      target_market: category.target_market,
      features: category.features,
      is_active: true
    });
  };

  const handleEditCategory = (category: VehicleCategory) => {
    setFormData({
      name: category.name,
      description: category.description,
      daily_rate_range: category.daily_rate_range,
      min_rate: category.min_rate || 0,
      max_rate: category.max_rate || 0,
      target_market: category.target_market || '',
      features: category.features || [],
      is_active: category.is_active
    });
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleViewCategory = (category: VehicleCategory) => {
    setSelectedCategory(category);
    setShowViewModal(true);
  };

  const handleDeleteCategory = (category: VehicleCategory) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const saveCategory = async (isEdit: boolean = false) => {
    try {
      setProcessing(true);
      setError(null);
      
      // Validate form data
      if (!formData.name || !formData.description || !formData.daily_rate_range) {
        setError('Please fill in all required fields');
        return;
      }

      if (isEdit && selectedCategory) {
        // Update existing category in Supabase
        const { error: updateError } = await supabase
          .from('vehicle_categories')
          .update({
            name: formData.name,
            description: formData.description,
            daily_rate_range: `£${formData.min_rate}-${formData.max_rate}`,
            min_rate: formData.min_rate,
            max_rate: formData.max_rate,
            target_market: formData.target_market,
            features: formData.features,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedCategory.id)
          .eq('partner_id', user?.id);

        if (updateError) throw updateError;
      } else {
        // Add new category to Supabase
        const { data: newCategory, error: insertError } = await supabase
          .from('vehicle_categories')
          .insert({
            partner_id: user?.id,
            name: formData.name,
            description: formData.description,
            daily_rate_range: `£${formData.min_rate}-${formData.max_rate}`,
            min_rate: formData.min_rate,
            max_rate: formData.max_rate,
            target_market: formData.target_market,
            features: formData.features,
            is_active: formData.is_active,
            vehicle_count: 0,
            total_revenue: 0,
            average_rating: 4.0
          })
          .select()
          .single();

        if (insertError) throw insertError;
      }

      // Close modal and reset
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        daily_rate_range: '',
        min_rate: 0,
        max_rate: 0,
        target_market: '',
        features: [],
        is_active: true
      });
      
      // Reload data to update stats
      await loadCategoryData();
      
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Failed to save category');
    } finally {
      setProcessing(false);
    }
  };

  const deleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setProcessing(true);
      setError(null);
      
      // Check if category has vehicles
      if (selectedCategory.vehicle_count > 0) {
        setError('Cannot delete category with assigned vehicles. Please reassign vehicles first.');
        return;
      }

      // Delete category from Supabase
      const { error: deleteError } = await supabase
        .from('vehicle_categories')
        .delete()
        .eq('id', selectedCategory.id)
        .eq('partner_id', user?.id);

      if (deleteError) throw deleteError;
      
      setShowDeleteModal(false);
      setSelectedCategory(null);
      
      // Reload data to update stats
      await loadCategoryData();
      
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryInsights = (category: VehicleCategory) => {
    const insights = [];
    
    if (category.vehicle_count === 0) {
      insights.push('No vehicles assigned to this category');
    } else {
      insights.push(`${category.vehicle_count} vehicle${category.vehicle_count > 1 ? 's' : ''} assigned`);
    }
    
    if (category.total_revenue > 0) {
      insights.push(`£${category.total_revenue.toLocaleString()} total revenue generated`);
    } else {
      insights.push('No revenue generated yet');
    }
    
    if (category.average_rating >= 4.5) {
      insights.push('Excellent customer satisfaction');
    } else if (category.average_rating >= 4.0) {
      insights.push('Good customer satisfaction');
    } else {
      insights.push('Below average customer satisfaction');
    }
    
    const utilizationRate = category.vehicle_count > 0 ? (category.vehicle_count / stats.totalVehicles) * 100 : 0;
    insights.push(`${utilizationRate.toFixed(1)}% fleet utilization`);
    
    return insights;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Categories</h1>
            <p className="text-gray-600 mt-2">Organize and manage your fleet by categories</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={exportCategoryData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FaDownload className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={handleAddCategory}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Add Category
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaTags className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categoryStats.totalCategories}</p>
                <p className="text-xs text-green-600">Vehicle classifications</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categoryStats.activeCategories}</p>
                <p className="text-xs text-green-600">With vehicles assigned</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-yellow-500 p-3 rounded-lg">
                <FaCar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{categoryStats.totalVehicles}</p>
                <p className="text-xs text-green-600">Across all categories</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-purple-500 p-3 rounded-lg">
                <FaPoundSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">£{categoryStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">Category earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FaTags className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No categories found</p>
              <p className="text-sm text-gray-500">Get started by adding your first vehicle category</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(category.name)}`}>
                      {category.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewCategory(category)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Weekly Rate Range:</span>
                      <span className="text-sm font-medium text-gray-900">{category.daily_rate_range}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Vehicles:</span>
                      <span className="text-sm font-medium text-gray-900">{category.vehicle_count}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Total Revenue:</span>
                      <span className="text-sm font-medium text-gray-900">£{category.total_revenue.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Avg Rating:</span>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 mr-1">{category.average_rating.toFixed(1)}</span>
                        <FaStar className="w-3 h-3 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

             {/* Add Category Modal */}
       {showAddModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
           <div className="relative bg-white p-8 border border-gray-300 rounded-lg shadow-xl w-full max-w-2xl max-h-full">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-semibold text-gray-900">Add New Category</h3>
               <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                 <FaTimes className="w-5 h-5" />
               </button>
             </div>

             {/* Predefined Categories Section */}
             <div className="mb-6 p-4 bg-gray-50 rounded-lg">
               <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Select PCO Categories</h4>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                 {predefinedCategories.map((category) => (
                   <button
                     key={category.name}
                     onClick={() => selectPredefinedCategory(category)}
                     className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                   >
                     <div className="font-medium text-sm text-gray-900">{category.name}</div>
                     <div className="text-xs text-gray-600 mt-1">{category.description}</div>
                     <div className="text-xs text-blue-600 mt-1">£{category.min_rate}-{category.max_rate}</div>
                   </button>
                 ))}
               </div>
             </div>

             <div className="mb-4">
               <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
               <input
                 type="text"
                 id="name"
                 value={formData.name}
                 onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 placeholder="e.g., Economy, Luxury, Blacklane"
               />
             </div>
             <div className="mb-4">
               <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
               <textarea
                 id="description"
                 value={formData.description}
                 onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 rows={3}
                 placeholder="Brief description of the category"
               />
             </div>
             <div className="mb-4">
               <label htmlFor="daily_rate_range" className="block text-sm font-medium text-gray-700">Weekly Rate Range</label>
               <input
                 type="text"
                 id="daily_rate_range"
                 value={formData.daily_rate_range}
                 onChange={(e) => setFormData(prev => ({ ...prev, daily_rate_range: e.target.value }))}
                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 placeholder="Enter weekly rate range"
               />
             </div>
             <div className="mb-4">
               <label htmlFor="min_rate" className="block text-sm font-medium text-gray-700">Minimum Weekly Rate</label>
               <input
                 type="number"
                 id="min_rate"
                 value={formData.min_rate}
                 onChange={(e) => setFormData(prev => ({ ...prev, min_rate: parseFloat(e.target.value) || 0 }))}
                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 placeholder="e.g., 50"
               />
             </div>
             <div className="mb-4">
               <label htmlFor="max_rate" className="block text-sm font-medium text-gray-700">Maximum Weekly Rate</label>
               <input
                 type="number"
                 id="max_rate"
                 value={formData.max_rate}
                 onChange={(e) => setFormData(prev => ({ ...prev, max_rate: parseFloat(e.target.value) || 0 }))}
                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 placeholder="e.g., 100"
               />
             </div>
             <div className="mb-4">
               <label htmlFor="target_market" className="block text-sm font-medium text-gray-700">Target Market</label>
               <input
                 type="text"
                 id="target_market"
                 value={formData.target_market}
                 onChange={(e) => setFormData(prev => ({ ...prev, target_market: e.target.value }))}
                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 placeholder="e.g., Budget-conscious drivers, Business travelers"
               />
             </div>
             <div className="mb-4">
               <label htmlFor="features" className="block text-sm font-medium text-gray-700">Features (comma-separated)</label>
               <input
                 type="text"
                 id="features"
                 value={formData.features.join(', ')}
                 onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value.split(',').map(f => f.trim()) }))}
                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                 placeholder="e.g., Fuel efficient, Compact size, Basic features"
               />
             </div>
             <div className="mb-4">
               <label htmlFor="is_active" className="flex items-center">
                 <input
                   type="checkbox"
                   id="is_active"
                   checked={formData.is_active}
                   onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                 />
                 <span className="ml-2 text-sm text-gray-700">Active</span>
               </label>
             </div>
             <div className="flex justify-end space-x-2">
               <button
                 onClick={() => setShowAddModal(false)}
                 className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 onClick={() => saveCategory(false)}
                 disabled={processing}
                 className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
               >
                 {processing ? 'Saving...' : 'Save Category'}
                 {processing && <FaSpinner className="ml-2 h-4 w-4 animate-spin" />}
               </button>
             </div>
           </div>
         </div>
       )}

             {/* Edit Category Modal */}
       {showEditModal && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
           <div className="relative bg-white p-8 border border-gray-300 rounded-lg shadow-xl w-full max-w-md max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Edit Category</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Economy, Luxury, Blacklane"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={3}
                placeholder="Brief description of the category"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="daily_rate_range" className="block text-sm font-medium text-gray-700">Weekly Rate Range</label>
              <input
                type="text"
                id="daily_rate_range"
                value={formData.daily_rate_range}
                onChange={(e) => setFormData(prev => ({ ...prev, daily_rate_range: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., £50-100, £100-200"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="min_rate" className="block text-sm font-medium text-gray-700">Minimum Weekly Rate</label>
              <input
                type="number"
                id="min_rate"
                value={formData.min_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, min_rate: parseFloat(e.target.value) || 0 }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., 50"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="max_rate" className="block text-sm font-medium text-gray-700">Maximum Weekly Rate</label>
              <input
                type="number"
                id="max_rate"
                value={formData.max_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, max_rate: parseFloat(e.target.value) || 0 }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., 100"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="target_market" className="block text-sm font-medium text-gray-700">Target Market</label>
              <input
                type="text"
                id="target_market"
                value={formData.target_market}
                onChange={(e) => setFormData(prev => ({ ...prev, target_market: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Budget-conscious drivers, Business travelers"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="features" className="block text-sm font-medium text-gray-700">Features (comma-separated)</label>
              <input
                type="text"
                id="features"
                value={formData.features.join(', ')}
                onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value.split(',').map(f => f.trim()) }))}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Fuel efficient, Compact size, Basic features"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="is_active" className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => saveCategory(true)}
                disabled={processing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {processing ? 'Saving...' : 'Save Category'}
                {processing && <FaSpinner className="ml-2 h-4 w-4 animate-spin" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Category Modal */}
      {showViewModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white p-8 border border-gray-300 rounded-lg shadow-xl w-full max-w-md max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Category Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Category Name:</p>
                <p className="text-lg font-bold text-gray-900">{selectedCategory.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Description:</p>
                <p className="text-gray-900">{selectedCategory.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Weekly Rate Range:</p>
                <p className="text-lg font-bold text-gray-900">{selectedCategory.daily_rate_range}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Target Market:</p>
                <p className="text-gray-900">{selectedCategory.target_market || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Features:</p>
                <p className="text-gray-900">{selectedCategory.features?.join(', ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status:</p>
                <p className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  selectedCategory.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {selectedCategory.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Insights</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                {getCategoryInsights(selectedCategory).map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white p-8 border border-gray-300 rounded-lg shadow-xl w-full max-w-md max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete the category "{selectedCategory.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteCategory}
                disabled={processing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {processing ? 'Deleting...' : 'Delete Category'}
                {processing && <FaSpinner className="ml-2 h-4 w-4 animate-spin" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 