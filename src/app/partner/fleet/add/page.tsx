'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaCar, FaArrowLeft, FaSave, FaTimes, FaUpload, FaTrash,
  FaCog, FaShieldAlt, FaFileAlt, FaCloudUploadAlt, FaMoneyBillWave,
  FaCheckCircle, FaTags, FaInfoCircle
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const carCategories = [
  { value: 'x', label: 'X (Economy)' },
  { value: 'comfort', label: 'COMFORT (Standard)' },
  { value: 'business_comfort', label: 'BUSINESS COMFORT (Premium)' },
  { value: 'exec', label: 'EXEC (Executive)' },
  { value: 'green', label: 'GREEN (Electric/Hybrid)' },
  { value: 'lux', label: 'LUX (Luxury)' },
  { value: 'blacklane', label: 'BLACKLANE (Premium Black Car)' },
  { value: 'wheely', label: 'WHEELY (Specialized)' }
];

const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const transmissionTypes = ['Manual', 'Automatic'];

const commonFeatures = [
  'Air Conditioning',
  'Bluetooth',
  'GPS Navigation',
  'Parking Sensors',
  'Reversing Camera',
  'Heated Seats',
  'Sunroof',
  'Cruise Control',
  'USB Charging',
  'Child Safety Locks',
  'Anti-lock Brakes',
  'Electronic Stability Control',
  'Dual Airbags',
  'Side Airbags',
  'Keyless Entry',
  'Start/Stop Button',
  'Alloy Wheels',
  'Fog Lights',
  'Rain Sensors',
  'Automatic Lights'
];

const requiredDocuments = [
  { key: 'mot', label: 'MOT Certificate', description: 'Valid MOT certificate for the vehicle' },
  { key: 'insurance', label: 'Insurance Certificate', description: 'Comprehensive insurance certificate' },
  { key: 'logbook', label: 'Vehicle Logbook (V5C)', description: 'Original vehicle registration document' },
  { key: 'private_hire_license', label: 'Private Hire License', description: 'PCO license for the vehicle' }
];

function safeDate(val: any) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export default function AddVehiclePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [vehicleData, setVehicleData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    category: 'comfort', // Keep for backward compatibility
    fuel_type: 'Petrol',
    transmission: 'Manual',
    mileage: 0,
    location: '',
    color: '',
    seats: 5,
    doors: 4,
    engine: '',
    description: '',
    price_per_week: 200,
    price_per_day: 35,
    features: [] as string[],
    insurance_expiry: '',
    mot_expiry: '',
    road_tax_expiry: '',
    next_service: '',
    insurance_included: false,
    insurance_details: {
      coverage: '',
      excess: 0,
      terms: ''
    },
    pricing: {
      min_term_months: 1,
      deposit_required: false,
      deposit_amount: 0,
      deposit_notes: '',
      tier_rates: {} as { [key: number]: number }
    },
    ride_hailing_categories: ['comfort'] as string[] // Default to COMFORT
  });

  const [vehicleDocuments, setVehicleDocuments] = useState<{
    [key: string]: { status: string; url: string; expiry_date: string | null; file?: File }
  }>({
    mot: { status: 'pending_review', url: '', expiry_date: null },
    private_hire_license: { status: 'pending_review', url: '', expiry_date: null },
    insurance: { status: 'pending_review', url: '', expiry_date: null },
    logbook: { status: 'pending_review', url: '', expiry_date: null }
  });

  const [uploadStatus, setUploadStatus] = useState<{
    [key: string]: { loading: boolean; error: string | null }
  }>({});

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'PARTNER' && user.role !== 'PARTNER_STAFF') {
        router.replace('/');
      } else if (user.role === 'PARTNER_STAFF' && !(user as any).permissions?.canManageFleet) {
        router.replace('/partner');
      }
    }
  }, [user, authLoading, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 images total
    const remainingSlots = 10 - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    setImageFiles(prev => [...prev, ...filesToAdd]);

    // Generate previews
    filesToAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const uploadPromises = imageFiles.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload-car-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload image');
      const data = await res.json();
      return data.url;
    });
    
    return await Promise.all(uploadPromises);
  };

  const handleFeatureToggle = (feature: string) => {
    setVehicleData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleCategoryToggle = (category: string) => {
    setVehicleData(prev => {
      const currentCategories = prev.ride_hailing_categories;
      
      if (currentCategories.includes(category)) {
        // Remove category if already selected
        return {
          ...prev,
          ride_hailing_categories: currentCategories.filter(c => c !== category)
        };
      } else {
        // Add category if not already selected (max 3)
        if (currentCategories.length < 3) {
          return {
            ...prev,
            ride_hailing_categories: [...currentCategories, category]
          };
        }
        // If already 3 selected, replace the last one
        const newCategories = [...currentCategories.slice(0, 2), category];
        return {
          ...prev,
          ride_hailing_categories: newCategories
        };
      }
    });
  };

  const handleDocumentUpload = async (key: string, file: File | null) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus(prev => ({
        ...prev,
        [key]: { loading: false, error: 'Invalid file type. Only PDF, JPEG, and PNG files are allowed.' }
      }));
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadStatus(prev => ({
        ...prev,
        [key]: { loading: false, error: 'File size too large. Maximum size is 10MB.' }
      }));
      return;
    }

    setUploadStatus(prev => ({
      ...prev,
      [key]: { loading: true, error: null }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }
      
      const data = await res.json();
      
      setVehicleDocuments(prev => ({
        ...prev,
        [key]: { 
          status: 'pending_review', 
          url: data.url, 
          expiry_date: prev[key]?.expiry_date || null,
          file: file
        }
      }));

      setUploadStatus(prev => ({
        ...prev,
        [key]: { loading: false, error: null }
      }));
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadStatus(prev => ({
        ...prev,
        [key]: { loading: false, error: error instanceof Error ? error.message : 'Failed to upload document. Please try again.' }
      }));
    }
  };

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Show progress toast
      const loadingToast = toast.loading('Adding vehicle...');

      // Upload images
      const imageUrls = await uploadImages();

      // Clean documents - remove File objects before saving to Supabase
      const cleanedDocuments: {[key: string]: { status: string; url: string; expiry_date: string | null }} = {};
      Object.keys(vehicleDocuments).forEach(key => {
        cleanedDocuments[key] = {
          status: vehicleDocuments[key].status,
          url: vehicleDocuments[key].url,
          expiry_date: vehicleDocuments[key].expiry_date
        };
      });

      // Simplified partner ID detection to avoid RLS recursion
      let partnerId = user?.id;
      
      // For PARTNER_STAFF, we'll use the user ID as the partner ID
      // This avoids the RLS recursion issue with partner_staff table
      if (user?.role === 'PARTNER_STAFF') {
        // Use the user ID as the partner ID to avoid RLS issues
        // The actual partner relationship can be handled at the application level
        partnerId = user.id;
      }

      // Alternative approach: Get partner ID from session
      if (!partnerId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.user_metadata?.partner_id) {
            partnerId = session.user.user_metadata.partner_id;
          }
        } catch (error) {
          console.error('Error getting session:', error);
        }
      }
      
      if (!partnerId) {
        throw new Error('No partner ID found. Please ensure you are logged in as a partner.');
      }

      console.log('User:', user);
      console.log('Partner ID:', partnerId);

      // Create vehicle document for Supabase
      const newVehicle = {
        name: vehicleData.name,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        license_plate: vehicleData.license_plate,
        category: vehicleData.category,
        fuel_type: vehicleData.fuel_type.toUpperCase(),
        transmission: vehicleData.transmission.toUpperCase(),
        mileage: vehicleData.mileage,
        location: vehicleData.location,
        color: vehicleData.color,
        seats: vehicleData.seats,
        doors: vehicleData.doors,
        engine: vehicleData.engine,
        description: vehicleData.description,
        price_per_week: vehicleData.price_per_week,
        price_per_day: vehicleData.price_per_day,
        features: vehicleData.features,
        insurance_expiry: safeDate(vehicleData.insurance_expiry),
        mot_expiry: safeDate(vehicleData.mot_expiry),
        road_tax_expiry: safeDate(vehicleData.road_tax_expiry),
        next_service: safeDate(vehicleData.next_service),
        insurance_included: vehicleData.insurance_included,
        insurance_details: vehicleData.insurance_details,
        pricing: {
          min_term_months: Number(vehicleData.pricing.min_term_months),
          deposit_required: Boolean(vehicleData.pricing.deposit_required),
          deposit_amount: Number(vehicleData.pricing.deposit_amount || 0),
          deposit_notes: vehicleData.pricing.deposit_notes || '',
          tier_rates: vehicleData.pricing.tier_rates || {}
        },
        partner_id: partnerId,
        is_available: true,
        is_approved: false,
        is_active: true,
        image_urls: imageUrls,
        documents: cleanedDocuments,
        ride_hailing_categories: vehicleData.ride_hailing_categories,
        document_verification_status: 'pending',
        visible_on_platform: false
      };

      console.log('Attempting to insert vehicle:', newVehicle);
      
      // Try to insert the vehicle with better error handling
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([newVehicle])
        .select()
        .single();

      if (vehicleError) {
        console.error('Vehicle insert error details:', {
          code: vehicleError.code,
          message: vehicleError.message,
          details: vehicleError.details,
          hint: vehicleError.hint
        });
        throw new Error(`Vehicle creation failed: ${vehicleError.message}`);
      }

      if (!vehicle) {
        throw new Error('Vehicle was not created. Please try again.');
      }

      console.log('Vehicle created successfully:', vehicle);

      const vehicleId = vehicle.id;

      // Mirror each document to vehicle_documents collection AND documents table
      await Promise.all(Object.entries(vehicleDocuments).map(async ([docType, docData]) => {
        if (docData.url) {
          // 1. Insert into vehicle_documents table
          const { error: docError } = await (supabase as any)
            .from('vehicle_documents')
            .insert({
              vehicle_id: vehicleId,
              type: docType,
              file_url: docData.url,
              file_name: docData.file?.name || '',
              expiry_date: docData.expiry_date || null,
              upload_date: new Date().toISOString(),
              status: docData.status || 'pending_review',
              partner_id: partnerId
            });
          
          if (docError) console.error('Error saving to vehicle_documents:', docError);

          // 2. Insert into documents table for admin review
          const { error: documentsError } = await supabase
            .from('documents')
            .insert({
              partner_id: partnerId,
              uploader_id: user?.id,
              name: `${docType.toUpperCase()} Certificate`,
              type: docType,
              category: 'vehicle',
              car_id: vehicleId,
              car_name: vehicleData.name,
              file_name: docData.file?.name || '',
              file_url: docData.url,
              file_size: docData.file?.size || 0,
              mime_type: docData.file?.type || '',
              expiry_date: docData.expiry_date || null,
              status: 'pending_review',
              uploader_name: user?.name || user?.email || 'Partner',
              uploader_email: user?.email || '',
              uploader_type: 'partner',
              partner_name: user?.name || 'Partner',
              notes: `Vehicle: ${vehicleData.name} (${vehicleData.license_plate})`
            });

          if (documentsError) console.error('Error saving to documents:', documentsError);
        }
      }));

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Vehicle added successfully! Admin will review within 24-48 hours.');
      
      setSubmitSuccess(true);
      
      // Redirect after a short delay to show the success message
      setTimeout(() => {
        router.push('/partner/fleet?success=Vehicle added successfully');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding vehicle:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add vehicle. Please try again.';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl font-bold text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const canManageFleet = user.role === 'PARTNER' || (user.role === 'PARTNER_STAFF' && (user as any).permissions?.canManageFleet);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link
                href="/partner/fleet"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft /> Back to Fleet
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add Vehicle</h1>
                <p className="text-gray-600">Add a new vehicle to your fleet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Photos */}
          <div className="bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <FaCloudUploadAlt className="text-white text-lg" />
              </div>
              Vehicle Photos
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* Image Previews */}
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-40 object-cover rounded-xl border-2 border-gray-200 shadow-md group-hover:shadow-lg transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {/* Add Photo Button */}
                {imageFiles.length < 10 && (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 group">
                    <div className="bg-blue-500 p-3 rounded-full mb-3 group-hover:bg-blue-600 transition-colors">
                      <FaUpload className="text-white text-xl" />
                    </div>
                    <span className="text-sm font-medium text-blue-700">Add Photo</span>
                    <span className="text-xs text-blue-600 mt-1">Click to upload</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <FaInfoCircle className="text-blue-600" />
                  Upload up to 10 photos total. Supported formats: JPG, PNG (Max 10MB each)
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gradient-to-br from-white to-green-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-green-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <FaCar className="text-white text-lg" />
              </div>
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Vehicle Name *</label>
                <input
                  type="text"
                  value={vehicleData.name}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="e.g., BMW 3 Series 2020"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">License Plate *</label>
                <input
                  type="text"
                  value={vehicleData.license_plate}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm font-mono"
                  placeholder="AB12 CDE"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Make *</label>
                <input
                  type="text"
                  value={vehicleData.make}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="e.g., BMW"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Model *</label>
                <input
                  type="text"
                  value={vehicleData.model}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="e.g., 3 Series"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Year *</label>
                <input
                  type="number"
                  value={vehicleData.year}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) || 2020 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
            </div>
          </div>

          {/* Vehicle Categories */}
          <div className="bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-purple-500 p-2 rounded-lg">
                <FaTags className="text-white text-lg" />
              </div>
              Vehicle Categories
            </h2>
            
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Select Categories * (Select up to 3)
              </label>
              <div className="flex flex-wrap gap-3">
                {carCategories.map(category => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleCategoryToggle(category.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 shadow-md hover:shadow-lg ${
                      vehicleData.ride_hailing_categories.includes(category.value)
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div className="font-bold text-base">{category.label.split(' (')[0]}</div>
                    <div className={`text-xs mt-1 ${vehicleData.ride_hailing_categories.includes(category.value) ? 'text-purple-100' : 'text-gray-500'}`}>
                      ({category.label.split(' (')[1]?.replace(')', '')})
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-sm text-purple-800 font-medium">
                  Selected: {vehicleData.ride_hailing_categories.length}/3
                </p>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-lg">
                <FaCog className="text-white text-lg" />
              </div>
              Specifications
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Fuel Type *</label>
                <select
                  value={vehicleData.fuel_type}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, fuel_type: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  required
                >
                  {fuelTypes.map(fuel => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Transmission *</label>
                <select
                  value={vehicleData.transmission}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, transmission: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  required
                >
                  {transmissionTypes.map(trans => (
                    <option key={trans} value={trans}>{trans}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Seats *</label>
                <input
                  type="number"
                  value={vehicleData.seats}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, seats: parseInt(e.target.value) || 5 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  min="2"
                  max="9"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Doors *</label>
                <input
                  type="number"
                  value={vehicleData.doors}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, doors: parseInt(e.target.value) || 4 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  min="2"
                  max="5"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Engine</label>
                <input
                  type="text"
                  value={vehicleData.engine}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, engine: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="e.g., 2.0L Turbo"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Color</label>
                <input
                  type="text"
                  value={vehicleData.color}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="e.g., Black"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Mileage</label>
                <input
                  type="number"
                  value={vehicleData.mileage}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  min="0"
                  placeholder="Current mileage"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Location</label>
                <input
                  type="text"
                  value={vehicleData.location}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="e.g., London, Central"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-white to-emerald-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <FaMoneyBillWave className="text-white text-lg" />
              </div>
              Pricing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Weekly Rate (£) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">£</span>
                  <input
                    type="number"
                    value={vehicleData.price_per_week}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, price_per_week: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Daily Rate (£) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">£</span>
                  <input
                    type="number"
                    value={vehicleData.price_per_day}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, price_per_day: parseInt(e.target.value) || 0 }))}
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-600" />
              Pricing
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate (£) *</label>
                <input
                  type="number"
                  value={vehicleData.price_per_week}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, price_per_week: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Term Pricing */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Term-Based Weekly Rates (£)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(term => (
                  <div key={term}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{term} Mo.</label>
                    <input
                      type="number"
                      value={(vehicleData.pricing as any)?.tier_rates?.[term] || ''}
                      onChange={(e)=>{
                        const val=parseInt(e.target.value)||0;
                        setVehicleData(prev=>(
                          {
                            ...prev,
                            pricing:{
                              ...prev.pricing,
                              tier_rates:{
                                ...(prev.pricing as any)?.tier_rates,
                                [term]:val
                              }
                            }
                          }
                        ));
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm text-black"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Rules */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Term (Months)</label>
                <select
                  value={vehicleData.pricing.min_term_months}
                  onChange={e => setVehicleData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, min_term_months: Number(e.target.value) }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m} Month{m > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center mt-6 md:mt-0">
                <input
                  type="checkbox"
                  checked={vehicleData.pricing.deposit_required}
                  onChange={e => setVehicleData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, deposit_required: e.target.checked }
                  }))}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Deposit Required?</span>
              </div>
              {vehicleData.pricing.deposit_required && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (£)</label>
                  <input
                    type="number"
                    value={vehicleData.pricing.deposit_amount}
                    onChange={e => setVehicleData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, deposit_amount: Number(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                    min="0"
                  />
                </div>
              )}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Notes</label>
                <input
                  type="text"
                  value={vehicleData.pricing.deposit_notes}
                  onChange={e => setVehicleData(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, deposit_notes: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Any notes about deposit requirements..."
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg">
                <FaShieldAlt className="text-white text-lg" />
              </div>
              Insurance
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <input
                  type="checkbox"
                  checked={vehicleData.insurance_included}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, insurance_included: e.target.checked }))}
                  className="mr-3 w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-semibold text-gray-700">Insurance Included in Rental</span>
              </div>
              
              {vehicleData.insurance_included && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Coverage Type</label>
                    <input
                      type="text"
                      value={vehicleData.insurance_details.coverage}
                      onChange={(e) => setVehicleData(prev => ({
                        ...prev,
                        insurance_details: { ...prev.insurance_details, coverage: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      placeholder="e.g., Comprehensive"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Excess Amount (£)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">£</span>
                      <input
                        type="number"
                        value={vehicleData.insurance_details.excess}
                        onChange={(e) => setVehicleData(prev => ({
                          ...prev,
                          insurance_details: { ...prev.insurance_details, excess: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Insurance Terms</label>
                    <textarea
                      value={vehicleData.insurance_details.terms}
                      onChange={(e) => setVehicleData(prev => ({
                        ...prev,
                        insurance_details: { ...prev.insurance_details, terms: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                      rows={3}
                      placeholder="Enter insurance terms and conditions..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCog className="text-purple-600" />
              Features & Equipment
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {commonFeatures.map(feature => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={vehicleData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Required Documents */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFileAlt className="text-red-600" />
              Required Documents
            </h2>
            
            <div className="space-y-6">
              {requiredDocuments.map((doc) => (
                <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{doc.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        vehicleDocuments[doc.key]?.url 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vehicleDocuments[doc.key]?.url ? 'Uploaded' : 'Required'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={vehicleDocuments[doc.key]?.expiry_date || ''}
                        onChange={(e) => setVehicleDocuments(prev => ({
                          ...prev,
                          [doc.key]: { 
                            ...prev[doc.key], 
                            expiry_date: e.target.value 
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Upload Document</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            handleDocumentUpload(doc.key, file);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black text-sm"
                        />
                        {uploadStatus[doc.key]?.loading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </div>
                      {uploadStatus[doc.key]?.error && (
                        <p className="text-xs text-red-600 mt-1">{uploadStatus[doc.key].error}</p>
                      )}
                    </div>
                    
                    {vehicleDocuments[doc.key]?.url && (
                      <div className="flex items-center space-x-2">
                        <FaCheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">Document uploaded successfully</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents & Dates */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFileAlt className="text-orange-600" />
              Important Dates
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
                <input
                  type="date"
                  value={vehicleData.insurance_expiry}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, insurance_expiry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MOT Expiry</label>
                <input
                  type="date"
                  value={vehicleData.mot_expiry}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, mot_expiry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Road Tax Expiry</label>
                <input
                  type="date"
                  value={vehicleData.road_tax_expiry}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, road_tax_expiry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Service</label>
                <input
                  type="date"
                  value={vehicleData.next_service}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, next_service: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
            <textarea
              value={vehicleData.description}
              onChange={(e) => setVehicleData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Add any additional details about the vehicle..."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            {canManageFleet ? (
              <button
                type="submit"
                disabled={saving || submitSuccess}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding Vehicle...
                  </>
                ) : submitSuccess ? (
                  <>
                    <FaCheckCircle />
                    Vehicle Added Successfully!
                  </>
                ) : (
                  <>
                    <FaSave />
                    Add Vehicle
                  </>
                )}
              </button>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-semibold text-center">
                No Permission to Add Vehicles
              </div>
            )}
            <Link
              href="/partner/fleet"
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 text-center transition-colors"
            >
              Back to Fleet
            </Link>
          </div>

          {/* Error Display */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FaTimes className="w-4 h-4 text-red-600" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <p className="text-red-700 mt-1">{submitError}</p>
            </div>
          )}

          {/* Success Display */}
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">Success</span>
              </div>
              <p className="text-green-700 mt-1">Vehicle added successfully! Admin will review within 24-48 hours.</p>
              <div className="mt-3 text-sm text-green-600">
                <p>• Your vehicle has been added to the system</p>
                <p>• Required documents are being reviewed by admin</p>
                <p>• You'll be notified once the vehicle is approved</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 