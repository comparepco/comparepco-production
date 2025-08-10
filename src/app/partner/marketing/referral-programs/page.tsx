'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaToggleOn, 
  FaToggleOff,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUsers,
  FaGift,
  FaCheck,
  FaTimes,
  FaShare,
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaPercent,
  FaPoundSign
} from 'react-icons/fa';

interface ReferralProgram {
  id: string;
  name: string;
  description?: string;
  rewardType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_RIDE';
  rewardValue: number;
  referralCode: string;
  maxReferrals: number;
  currentReferrals: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReferralProgramsPage() {
  const { user } = useAuth();
  const [referralPrograms, setReferralPrograms] = useState<ReferralProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ReferralProgram | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rewardType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_RIDE',
    rewardValue: 0,
    referralCode: '',
    maxReferrals: 100,
    startDate: '',
    endDate: '',
    terms: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchReferralPrograms();
    }
  }, [user?.id]);

  const fetchReferralPrograms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/partner/referral-programs?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch referral programs');
      const data = await response.json();
      setReferralPrograms(data.referralPrograms || []);
    } catch (err) {
      setError('Failed to fetch referral programs');
      console.error('Error fetching referral programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const createReferralProgram = async () => {
    try {
      const response = await fetch(`/api/partner/referral-programs?userId=${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to create referral program');
      
      setSuccessMessage('Referral program created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchReferralPrograms();
    } catch (err) {
      setError('Failed to create referral program');
    }
  };

  const updateReferralProgram = async () => {
    if (!editingProgram) return;
    
    try {
      const response = await fetch(`/api/partner/referral-programs/${editingProgram.id}?userId=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) throw new Error('Failed to update referral program');
      
      setSuccessMessage('Referral program updated successfully');
      setShowEditModal(false);
      setEditingProgram(null);
      resetForm();
      fetchReferralPrograms();
    } catch (err) {
      setError('Failed to update referral program');
    }
  };

  const deleteReferralProgram = async (id: string) => {
    try {
      const response = await fetch(`/api/partner/referral-programs/${id}?userId=${user?.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete referral program');
      
      setSuccessMessage('Referral program deleted successfully');
      fetchReferralPrograms();
    } catch (err) {
      setError('Failed to delete referral program');
    }
  };

  const toggleProgramStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/partner/referral-programs/${id}?userId=${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (!response.ok) throw new Error('Failed to toggle program status');
      
      setSuccessMessage('Referral program status updated');
      fetchReferralPrograms();
    } catch (err) {
      setError('Failed to toggle program status');
    }
  };

  const handleEdit = (program: ReferralProgram) => {
    setEditingProgram(program);
    setFormData({
      name: program.name,
      description: program.description || '',
      rewardType: program.rewardType,
      rewardValue: program.rewardValue,
      referralCode: program.referralCode,
      maxReferrals: program.maxReferrals,
      startDate: program.startDate.split('T')[0],
      endDate: program.endDate.split('T')[0],
      terms: program.terms
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rewardType: 'PERCENTAGE',
      rewardValue: 0,
      referralCode: '',
      maxReferrals: 100,
      startDate: '',
      endDate: '',
      terms: ''
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage('Referral code copied to clipboard');
  };

  const filteredPrograms = referralPrograms.filter(program => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        program.name.toLowerCase().includes(query) ||
        program.description?.toLowerCase().includes(query) ||
        program.referralCode.toLowerCase().includes(query)
      );
    }
    if (statusFilter && program.isActive !== (statusFilter === 'active')) return false;
    if (typeFilter && program.rewardType !== typeFilter) return false;
    return true;
  });

  const getRewardDisplay = (program: ReferralProgram) => {
    switch (program.rewardType) {
      case 'PERCENTAGE':
        return `${program.rewardValue}%`;
      case 'FIXED_AMOUNT':
        return `£${program.rewardValue}`;
      case 'FREE_RIDE':
        return 'Free Ride';
      default:
        return program.rewardValue.toString();
    }
  };

  const getReferralPercentage = (program: ReferralProgram) => {
    return Math.round((program.currentReferrals / program.maxReferrals) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Programs</h1>
              <p className="text-gray-600">
                Manage your referral programs and reward systems
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <FaPlus />
              <span>Create Program</span>
            </button>
          </div>
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
            <FaTimes className="text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search programs..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Types</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
                <option value="FREE_RIDE">Free Ride</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setTypeFilter('');
                }}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Referral Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-purple-600">{program.referralCode}</span>
                    <button
                      onClick={() => copyToClipboard(program.referralCode)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy referral code"
                    >
                      <FaShare className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      program.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {program.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => toggleProgramStatus(program.id, program.isActive)}
                      className={`p-1 rounded ${
                        program.isActive 
                          ? 'text-green-600 hover:text-green-800' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={program.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {program.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{program.name}</h3>
                {program.description && (
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reward:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {getRewardDisplay(program)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Referrals:</span>
                    <span className="text-sm text-gray-900">
                      {program.currentReferrals} / {program.maxReferrals}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${getReferralPercentage(program)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Valid from: {new Date(program.startDate).toLocaleDateString()}</span>
                    <span>to: {new Date(program.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(program)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteReferralProgram(program.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    Created {new Date(program.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <FaGift className="mx-auto text-gray-400 text-4xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No referral programs found</h3>
            <p className="text-gray-600">Create your first referral program to start rewarding customers for bringing new business.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Create Referral Program</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Summer Referral Program"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Description of the referral program"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type *</label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => setFormData({...formData, rewardType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_RIDE'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                    <option value="FREE_RIDE">Free Ride</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Value *</label>
                  <input
                    type="number"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData({...formData, rewardValue: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder={formData.rewardType === 'PERCENTAGE' ? '10' : '50'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code *</label>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="SUMMER2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Referrals *</label>
                <input
                  type="number"
                  value={formData.maxReferrals}
                  onChange={(e) => setFormData({...formData, maxReferrals: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({...formData, terms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Terms and conditions for the referral program"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createReferralProgram}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Edit Referral Program</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type *</label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => setFormData({...formData, rewardType: e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_RIDE'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                    <option value="FREE_RIDE">Free Ride</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Value *</label>
                  <input
                    type="number"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData({...formData, rewardValue: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code *</label>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({...formData, referralCode: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Referrals *</label>
                <input
                  type="number"
                  value={formData.maxReferrals}
                  onChange={(e) => setFormData({...formData, maxReferrals: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({...formData, terms: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProgram(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateReferralProgram}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Update Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 