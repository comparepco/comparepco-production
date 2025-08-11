'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../../../contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../../../../lib/supabase/client';
import { 
  FaArrowLeft, FaCar, FaCloudUploadAlt, FaTimes, FaUpload, FaTrash, FaSave,
  FaMoneyBillWave, FaShieldAlt, FaFileAlt
} from 'react-icons/fa';

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

function safeDate(val: any) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export default function EditVehiclePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const carId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [vehicleData, setVehicleData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    category: 'economy',
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
    ride_hailing_categories: [] as string[]
  });

  const loadVehicle = useCallback(async () => {
    try {
      const { data: carData, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', carId)
        .single();

      if (error || !carData) {
        alert('Vehicle not found');
        router.push('/partner/fleet');
        return;
      }
      
      // Verify this car belongs to the current partner
      const partnerId = user?.role === 'PARTNER_STAFF' ? (user as any).partnerId : user?.id;
      if (carData.partner_id !== partnerId) {
        alert('Unauthorized access');
        router.push('/partner/fleet');
        return;
      }

      const carDataAny = carData as any;
      setVehicleData({
        name: carDataAny.name || '',
        make: carDataAny.make || '',
        model: carDataAny.model || '',
        year: carDataAny.year || new Date().getFullYear(),
        license_plate: carDataAny.license_plate || '',
        category: carDataAny.category || 'economy',
        fuel_type: carDataAny.fuel_type || 'Petrol',
        transmission: carDataAny.transmission || 'Manual',
        mileage: carDataAny.mileage || 0,
        location: carDataAny.location || '',
        color: carDataAny.color || '',
        seats: carDataAny.seats || 5,
        doors: carDataAny.doors || 4,
        engine: carDataAny.engine || '',
        description: carDataAny.description || '',
        price_per_week: carDataAny.price_per_week || carDataAny.weekly_rate || 200,
        price_per_day: carDataAny.price_per_day || carDataAny.daily_rate || 35,
        features: carDataAny.features || [],
        insurance_expiry: carDataAny.insurance_expiry ? new Date(carDataAny.insurance_expiry).toISOString().split('T')[0] : '',
        mot_expiry: carDataAny.mot_expiry ? new Date(carDataAny.mot_expiry).toISOString().split('T')[0] : '',
        road_tax_expiry: carDataAny.road_tax_expiry ? new Date(carDataAny.road_tax_expiry).toISOString().split('T')[0] : '',
        next_service: carDataAny.next_service ? new Date(carDataAny.next_service).toISOString().split('T')[0] : '',
        insurance_included: carDataAny.insurance_included || false,
        insurance_details: carDataAny.insurance_details || {
          coverage: '',
          excess: 0,
          terms: ''
        },
        pricing: carDataAny.pricing || {
          min_term_months: 1,
          deposit_required: false,
          deposit_amount: 0,
          deposit_notes: '',
          tier_rates: {} as { [key: number]: number }
        },
        ride_hailing_categories: Array.isArray(carDataAny.ride_hailing_categories)
          ? carDataAny.ride_hailing_categories
          : Object.values(carDataAny.ride_hailing_categories || {})
      });

      setExistingImages(carDataAny.image_urls || []);
      setLoading(false);
    } catch (error) {
      // Handle error silently or log to monitoring service
      alert('Failed to load vehicle');
      router.push('/partner/fleet');
    }
  }, [carId, user, router]);

  useEffect(() => {
    if (carId) {
      loadVehicle();
    }
  }, [carId, loadVehicle]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 images total (existing + new)
    const totalImages = existingImages.length + imageFiles.length;
    const remainingSlots = 10 - totalImages;
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

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Upload new images
      const newImageUrls = await uploadNewImages();
      
      // Combine existing and new images
      const allImageUrls = [...existingImages, ...newImageUrls];

      // Update vehicle document
      const updateData = {
        name: vehicleData.name,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        license_plate: vehicleData.license_plate,
        category: vehicleData.category,
        fuel_type: vehicleData.fuel_type,
        transmission: vehicleData.transmission,
        mileage: vehicleData.mileage,
        location: vehicleData.location,
        color: vehicleData.color,
        seats: vehicleData.seats,
        doors: vehicleData.doors,
        engine: vehicleData.engine,
        description: vehicleData.description,
        price_per_week: vehicleData.price_per_week,
        price_per_day: vehicleData.price_per_day,
        image_urls: allImageUrls,
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
        ride_hailing_categories: vehicleData.ride_hailing_categories,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', carId);
      
      if (error) throw error;
      
      router.push('/partner/fleet?success=Vehicle updated successfully');
    } catch (error) {
      // Handle error silently or log to monitoring service
      alert('Failed to update vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', carId);
      
      if (error) throw error;
      
      router.push('/partner/fleet?success=Vehicle deleted successfully');
    } catch (error) {
      // Handle error silently or log to monitoring service
      alert('Failed to delete vehicle');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl font-bold text-gray-900">Loading vehicle...</div>
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
                <p className="text-gray-600">Update vehicle information</p>
              </div>
            </div>
            {canManageFleet && (
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 flex items-center gap-2 transition-colors"
              >
                <FaTrash /> Delete Vehicle
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Photos */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCloudUploadAlt className="text-blue-600" />
              Vehicle Photos
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Existing Images */}
                {existingImages.map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative">
                    <Image
                      src={imageUrl}
                      alt={`Vehicle ${index + 1}`}
                      width={128}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    {canManageFleet && (
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* New Image Previews */}
                {imagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative">
                    <Image
                      src={preview}
                      alt={`New ${index + 1}`}
                      width={128}
                      height={128}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    {canManageFleet && (
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Add Photo Button */}
                {canManageFleet && (existingImages.length + imageFiles.length) < 10 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <FaUpload className="text-gray-400 text-xl mb-2" />
                    <span className="text-sm text-gray-500">Add Photo</span>
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
              <p className="text-sm text-gray-500">
                Upload up to 10 photos total. Supported formats: JPG, PNG (Max 10MB each)
              </p>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCar className="text-blue-600" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name *</label>
                <input
                  type="text"
                  value={vehicleData.name}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., BMW 3 Series 2020"
                  required
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
                <input
                  type="text"
                  value={vehicleData.license_plate}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="AB12 CDE"
                  required
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                <input
                  type="text"
                  value={vehicleData.make}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., BMW"
                  required
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input
                  type="text"
                  value={vehicleData.model}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., 3 Series"
                  required
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  type="number"
                  value={vehicleData.year}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, year: parseInt(e.target.value) || 2020 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  required
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={vehicleData.category}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  disabled={!canManageFleet}
                >
                  {carCategories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCar className="text-blue-600" />
              Specifications
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type *</label>
                <select
                  value={vehicleData.fuel_type}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, fuel_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  disabled={!canManageFleet}
                >
                  {fuelTypes.map(fuel => (
                    <option key={fuel} value={fuel}>{fuel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transmission *</label>
                <select
                  value={vehicleData.transmission}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, transmission: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  required
                  disabled={!canManageFleet}
                >
                  {transmissionTypes.map(trans => (
                    <option key={trans} value={trans}>{trans}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seats *</label>
                <input
                  type="number"
                  value={vehicleData.seats}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, seats: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min="2"
                  max="9"
                  required
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doors *</label>
                <input
                  type="number"
                  value={vehicleData.doors}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, doors: parseInt(e.target.value) || 4 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min="2"
                  max="5"
                  required
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
                <input
                  type="text"
                  value={vehicleData.engine}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, engine: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., 2.0L Turbo"
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={vehicleData.color}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., Black"
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                <input
                  type="number"
                  value={vehicleData.mileage}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, mileage: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  min="0"
                  placeholder="Current mileage"
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={vehicleData.location}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., London, Central"
                  disabled={!canManageFleet}
                />
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
                  disabled={!canManageFleet}
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
                      disabled={!canManageFleet}
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
                  disabled={!canManageFleet}
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
                  disabled={!canManageFleet}
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
                    disabled={!canManageFleet}
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
                  disabled={!canManageFleet}
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaShieldAlt className="text-blue-600" />
              Insurance
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={vehicleData.insurance_included}
                    onChange={(e) => setVehicleData(prev => ({ 
                      ...prev, 
                      insurance_included: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={!canManageFleet}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    This vehicle comes with insurance included
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  If unchecked, drivers will need to provide their own insurance
                </p>
              </div>

              {vehicleData.insurance_included && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Type</label>
                    <input
                      type="text"
                      value={vehicleData.insurance_details.coverage}
                      onChange={(e) => setVehicleData(prev => ({ 
                        ...prev, 
                        insurance_details: { 
                          ...prev.insurance_details, 
                          coverage: e.target.value 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="e.g., Comprehensive, Third Party"
                      disabled={!canManageFleet}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Excess Amount (£)</label>
                    <input
                      type="number"
                      value={vehicleData.insurance_details.excess}
                      onChange={(e) => setVehicleData(prev => ({ 
                        ...prev, 
                        insurance_details: { 
                          ...prev.insurance_details, 
                          excess: parseInt(e.target.value) || 0 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      min="0"
                      placeholder="0"
                      disabled={!canManageFleet}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Terms</label>
                    <textarea
                      value={vehicleData.insurance_details.terms}
                      onChange={(e) => setVehicleData(prev => ({ 
                        ...prev, 
                        insurance_details: { 
                          ...prev.insurance_details, 
                          terms: e.target.value 
                        } 
                      }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Any specific terms or conditions for the insurance coverage..."
                      disabled={!canManageFleet}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCar className="text-purple-600" />
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
                    disabled={!canManageFleet}
                  />
                  <span className="ml-2 text-sm text-gray-700">{feature}</span>
                </label>
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
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MOT Expiry</label>
                <input
                  type="date"
                  value={vehicleData.mot_expiry}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, mot_expiry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Road Tax Expiry</label>
                <input
                  type="date"
                  value={vehicleData.road_tax_expiry}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, road_tax_expiry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  disabled={!canManageFleet}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Service</label>
                <input
                  type="date"
                  value={vehicleData.next_service}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, next_service: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  disabled={!canManageFleet}
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
              disabled={!canManageFleet}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            {canManageFleet ? (
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <FaSave />
                {saving ? 'Updating Vehicle...' : 'Update Vehicle'}
              </button>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-semibold text-center">
                View Only - No Edit Permission
              </div>
            )}
            <Link
              href="/partner/fleet"
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 text-center transition-colors"
            >
              Back to Fleet
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 