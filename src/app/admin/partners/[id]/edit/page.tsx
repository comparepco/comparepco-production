'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaBuilding, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar,
  FaStar, FaChartLine, FaFileAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaUserTie, FaCar, FaMoneyBillWave, FaShieldAlt, FaEdit, FaArrowLeft,
  FaSave, FaTimes, FaLock, FaEye, FaEyeSlash
} from 'react-icons/fa';

interface PartnerEditData {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  contact_person: string;
  email: string;
  phone: string;
  business_email?: string;
  director_name?: string;
  director_email?: string;
  director_phone?: string;
  address?: any;
  city?: string;
  postal_code?: string;
  website?: string;
  business_type?: string;
  registration_number?: string;
  vat_number?: string;
  status: string;
  approval_status: string;
  fleet_size?: number;
  estimated_monthly_rides?: number;
  commission_rate?: number;
  total_earnings?: number;
  completed_bookings?: number;
  rating?: number;
}

interface UserData {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}

export default function PartnerEditPage() {
  const params = useParams();
  const router = useRouter();
  const partnerId = params.id as string;
  
  const [partner, setPartner] = useState<PartnerEditData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PartnerEditData>>({});
  const [userFormData, setUserFormData] = useState<Partial<UserData>>({});
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (partnerId) {
      loadPartnerData();
    }
  }, [partnerId]);

  const loadPartnerData = async () => {
    try {
      setLoading(true);

      // Load partner data
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (partnerError) {
        console.error('Error loading partner:', partnerError);
        toast.error('Failed to load partner data');
        return;
      }

      setPartner(partnerData);
      setFormData(partnerData);

      // Load associated user data
      if (partnerData.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', partnerData.user_id)
          .single();

        if (!userError && userData) {
          setUserData(userData);
          setUserFormData(userData);
        }
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
      toast.error('Failed to load partner data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!partner) return;

    setSaving(true);
    try {
      // Validate password if provided
      if (newPassword) {
        if (newPassword.length < 6) {
          toast.error('Password must be at least 6 characters long');
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match');
          setSaving(false);
          return;
        }
      }

      // Update partner record
      const { error: partnerError } = await supabase
        .from('partners')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', partnerId);

      if (partnerError) throw partnerError;

      // Update user record if user data exists
      if (userData && userFormData) {
        const { error: userError } = await supabase
          .from('users')
          .update({
            email: userFormData.email,
            first_name: userFormData.first_name,
            last_name: userFormData.last_name,
            phone: userFormData.phone,
            is_active: userFormData.is_active,
            is_verified: userFormData.is_verified,
            updated_at: new Date().toISOString()
          })
          .eq('id', userData.id);

        if (userError) throw userError;

        // Update auth user email if changed
        if (userFormData.email !== userData.email) {
          const { error: authError } = await supabase.auth.admin.updateUserById(
            userData.id,
            { email: userFormData.email }
          );
          if (authError) {
            console.error('Error updating auth email:', authError);
            toast.error('Partner updated but email change failed');
            setSaving(false);
            return;
          }
        }

        // Update auth user password if provided
        if (newPassword) {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            userData.id,
            { password: newPassword }
          );
          if (passwordError) {
            console.error('Error updating password:', passwordError);
            toast.error('Partner updated but password change failed');
            setSaving(false);
            return;
          }
        }
      }

      toast.success('Partner updated successfully');
      router.push(`/admin/partners/${partnerId}`);
    } catch (error) {
      console.error('Error updating partner:', error);
      toast.error('Failed to update partner');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/partners/${partnerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading partner data...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaBuilding className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Partner Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The partner you're trying to edit could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                  <FaEdit className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                  Edit Partner
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {partner.company_name}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <FaTimes className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <FaSave className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form className="space-y-6">
            {/* User Account Information */}
            {userData && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FaUser className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  User Account Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="user_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Login Email *
                    </label>
                    <input
                      type="email"
                      id="user_email"
                      name="email"
                      value={userFormData.email || ''}
                      onChange={handleUserInputChange}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="user_first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="user_first_name"
                      name="first_name"
                      value={userFormData.first_name || ''}
                      onChange={handleUserInputChange}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="user_last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="user_last_name"
                      name="last_name"
                      value={userFormData.last_name || ''}
                      onChange={handleUserInputChange}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="user_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="user_phone"
                      name="phone"
                      value={userFormData.phone || ''}
                      onChange={handleUserInputChange}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="new_password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Leave blank to keep current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-4 w-4 text-gray-400" />
                        ) : (
                          <FaEye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirm_password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div>
                    <label htmlFor="user_is_active" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Account Status
                    </label>
                    <select
                      id="user_is_active"
                      name="is_active"
                      value={userFormData.is_active ? 'true' : 'false'}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="user_is_verified" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Verification Status
                    </label>
                    <select
                      id="user_is_verified"
                      name="is_verified"
                      value={userFormData.is_verified ? 'true' : 'false'}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, is_verified: e.target.value === 'true' }))}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="true">Verified</option>
                      <option value="false">Not Verified</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Company Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaBuilding className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Company Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Type
                  </label>
                  <select
                    id="business_type"
                    name="business_type"
                    value={formData.business_type || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Business Type</option>
                    <option value="transport_company">Transport Company</option>
                    <option value="taxi_service">Taxi Service</option>
                    <option value="limousine_service">Limousine Service</option>
                    <option value="car_rental">Car Rental</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="business_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Email
                  </label>
                  <input
                    type="email"
                    id="business_email"
                    name="business_email"
                    value={formData.business_email || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Director Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaUserTie className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                Director Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="director_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Director Name
                  </label>
                  <input
                    type="text"
                    id="director_name"
                    name="director_name"
                    value={formData.director_name || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="director_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Director Email
                  </label>
                  <input
                    type="email"
                    id="director_email"
                    name="director_email"
                    value={formData.director_email || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="director_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Director Phone
                  </label>
                  <input
                    type="tel"
                    id="director_phone"
                    name="director_phone"
                    value={formData.director_phone || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaCar className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                Business Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fleet_size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fleet Size
                  </label>
                  <input
                    type="number"
                    id="fleet_size"
                    name="fleet_size"
                    value={formData.fleet_size || ''}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="estimated_monthly_rides" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estimated Monthly Rides
                  </label>
                  <input
                    type="number"
                    id="estimated_monthly_rides"
                    name="estimated_monthly_rides"
                    value={formData.estimated_monthly_rides || ''}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="commission_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    id="commission_rate"
                    name="commission_rate"
                    value={formData.commission_rate || ''}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    id="registration_number"
                    name="registration_number"
                    value={formData.registration_number || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="vat_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    id="vat_number"
                    name="vat_number"
                    value={formData.vat_number || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status and Approval */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FaShieldAlt className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                Status & Approval
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="approval_status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Approval Status
                  </label>
                  <select
                    id="approval_status"
                    name="approval_status"
                    value={formData.approval_status || ''}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 