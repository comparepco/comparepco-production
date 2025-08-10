"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaUserTie, FaEye, FaEyeSlash, FaUpload, FaCheck, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  location: string;
  status: string;
  verification_status: string;
  total_earnings: number;
  total_rides: number;
  rating: number;
  join_date: string;
  created_at: string;
  updated_at: string;
  documents: {
    driving_license: { status: string; file_url: string };
    insurance: { status: string; file_url: string };
    pco_license: { status: string; file_url: string };
    proof_of_address: { status: string; file_url: string };
  };
  vehicle_info: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
    insurance_expiry: string;
    mot_expiry: string;
  };
  background_check: { status: string };
}

// Reusable File Input Component
const FileInput = ({ id, label, onFileSelect, required = false, selectedFile }: {
  id: string;
  label: string;
  onFileSelect: (id: string, file: File | null) => void;
  required?: boolean;
  selectedFile: File | null;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label} {required && '*'}</label>
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
      <div className="space-y-1 text-center">
        {selectedFile ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <FaCheck />
            <span>{selectedFile.name}</span>
          </div>
        ) : (
          <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
        )}
        <div className="flex text-sm text-gray-600 dark:text-gray-500">
          <label htmlFor={id} className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 px-2 py-1">
            <span>Upload a file</span>
            <input id={id} name={id} type="file" className="sr-only" onChange={e => onFileSelect(id, e.target.files ? e.target.files[0] : null)} />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF up to 10MB</p>
      </div>
    </div>
  </div>
);

export default function AddDriverPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    license_number: '',
    location: '',
    status: 'active',
  });

  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({
    driving_license: null,
    insurance: null,
    pco_license: null,
    proof_of_address: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (id: string, file: File | null) => {
    setDocuments(prev => ({ ...prev, [id]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password || !form.license_number) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (!documents.driving_license) {
      toast.error('Driving License is required.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating driver...');

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true,
        user_metadata: {
          full_name: form.full_name,
          role: 'driver'
        }
      });

      if (authError) {
        throw authError;
      }

      const userId = authData.user.id;
      toast.loading('Uploading documents...', { id: toastId });

      // 2. Upload documents to Supabase Storage
      const documentUrls: { [key: string]: { url: string; uploaded_at: string } } = {};
      for (const [key, file] of Object.entries(documents)) {
        if (file) {
          const url = await uploadFile(file, `${userId}/${key}`);
          documentUrls[key] = {
            url,
            uploaded_at: new Date().toISOString(),
          };
        }
      }

      toast.loading('Saving driver data...', { id: toastId });

      // 3. Create driver document in Supabase
      const driverData = {
        user_id: userId,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        license_number: form.license_number,
        location: form.location,
        status: form.status,
        documents: {
          driving_license: { status: 'pending', file_url: documentUrls.driving_license?.url || '' },
          insurance: { status: documents.insurance ? 'pending' : 'missing', file_url: documentUrls.insurance?.url || '' },
          pco_license: { status: documents.pco_license ? 'pending' : 'missing', file_url: documentUrls.pco_license?.url || '' },
          proof_of_address: { status: documents.proof_of_address ? 'pending' : 'missing', file_url: documentUrls.proof_of_address?.url || '' },
        },
        verification_status: 'incomplete',
        total_earnings: 0,
        total_rides: 0,
        rating: 0,
        join_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        vehicle_info: {
          make: '',
          model: '',
          year: new Date().getFullYear(),
          license_plate: '',
          insurance_expiry: '',
          mot_expiry: '',
        },
        background_check: { status: 'not_started' },
      };

      const { error: driverError } = await supabase
        .from('drivers')
        .insert([driverData]);

      if (driverError) {
        throw driverError;
      }

      // 4. Create user profile document
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          full_name: form.full_name,
          email: form.email,
          role: 'driver',
          phone: form.phone,
          status: form.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_verified: false,
          is_active: true
        }]);

      if (userError) {
        throw userError;
      }

      toast.success('Driver added successfully!', { id: toastId });
      router.push('/admin/drivers');

    } catch (error: any) {
      console.error('Error adding driver:', error);
      const errorMessage = error.message === 'User already registered'
        ? 'This email is already registered.'
        : (error.message || 'Failed to add driver.');
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaUserTie className="h-8 w-8 text-blue-600" />
              Add New Driver
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Create a new driver account with login credentials and initial documents.</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Core Information */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Core Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Basic driver details and contact information</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input 
                    type="text" 
                    id="full_name" 
                    name="full_name" 
                    value={form.full_name} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                    required 
                  />
                </div>
                
                <div className="relative">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password *
                  </label>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="password" 
                    name="password" 
                    value={form.password} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone *
                  </label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Driving License Number *
                  </label>
                  <input 
                    type="text" 
                    id="license_number" 
                    name="license_number" 
                    value={form.license_number} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location / City
                  </label>
                  <input 
                    type="text" 
                    id="location" 
                    name="location" 
                    value={form.location} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white" 
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Initial Documents</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Upload required driver documents for verification</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileInput 
                  id="driving_license" 
                  label="Driving License" 
                  onFileSelect={handleFileChange} 
                  required 
                  selectedFile={documents.driving_license} 
                />
                <FileInput 
                  id="insurance" 
                  label="Insurance Certificate" 
                  onFileSelect={handleFileChange} 
                  selectedFile={documents.insurance} 
                />
                <FileInput 
                  id="pco_license" 
                  label="PCO License" 
                  onFileSelect={handleFileChange} 
                  selectedFile={documents.pco_license} 
                />
                <FileInput 
                  id="proof_of_address" 
                  label="Proof of Address" 
                  onFileSelect={handleFileChange} 
                  selectedFile={documents.proof_of_address} 
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                type="button" 
                onClick={() => router.back()} 
                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding Driver...' : 'Add Driver'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 