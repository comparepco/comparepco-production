"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaBuilding, FaEye, FaEyeSlash, FaUpload, FaCheck, FaTimes, FaSave, FaUser, FaEnvelope, FaPhone, FaMapPin, FaCar, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';

interface PartnerFormData {
  // Company Information
  companyName: string;
  businessType: string;
  registrationNumber: string;
  vatNumber: string;
  
  // Contact Information
  contactName: string;
  email: string;
  phone: string;
  website: string;
  
  // Business Email and Director Information
  businessEmail?: string;
  directorName?: string;
  directorEmail?: string;
  directorPhone?: string;
  
  // Address Information
  address: {
    street: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
  };
  
  // Business Information
  operatingAreas: string[];
  vehicleTypes: string[];
  fleetSize: number;
  estimatedMonthlyRides: number;
  commissionRate: number;
  
  // Account Information
  password: string;
  confirmPassword: string;
  
  // Documents
  documents: {
    businessLicense: File | null;
    insuranceCertificate: File | null;
    operatorLicense: File | null;
    taxCertificate: File | null;
  };
  
  // Terms and Conditions
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export default function AddPartnerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PartnerFormData>({
    companyName: '',
    businessType: 'transport_company',
    registrationNumber: '',
    vatNumber: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    address: {
      street: '',
      city: '',
      county: '',
      postcode: '',
      country: 'United Kingdom'
    },
    operatingAreas: [],
    vehicleTypes: [],
    fleetSize: 1,
    estimatedMonthlyRides: 100,
    commissionRate: 15,
    password: '',
    confirmPassword: '',
    documents: {
      businessLicense: null,
      insuranceCertificate: null,
      operatorLicense: null,
      taxCertificate: null
    },
    acceptTerms: false,
    acceptPrivacy: false
  });

  // Options for dropdowns
  const businessTypes = [
    { value: 'transport_company', label: 'Transport Company' },
    { value: 'pco_operator', label: 'PCO Operator' },
    { value: 'taxi_fleet', label: 'Taxi Fleet' },
    { value: 'minicab_operator', label: 'Minicab Operator' },
    { value: 'private_hire_operator', label: 'Private Hire Operator' },
    { value: 'car_rental', label: 'Car Rental Company' },
    { value: 'executive_transport', label: 'Executive Transport' },
    { value: 'airport_transfer', label: 'Airport Transfer Service' }
  ];

  const vehicleTypes = [
    'Standard Cars',
    'Premium Cars', 
    'Electric Vehicles',
    'Hybrid Vehicles',
    'Wheelchair Accessible',
    'Minibuses (8-16 seats)',
    'Executive Vehicles',
    'Estate Cars',
    'Luxury Vehicles',
    'Vans'
  ];

  const operatingAreas = [
    'Central London',
    'North London', 
    'South London',
    'East London',
    'West London',
    'Greater London',
    'Birmingham',
    'Manchester',
    'Liverpool',
    'Leeds',
    'Glasgow',
    'Edinburgh',
    'Cardiff',
    'Belfast',
    'Bristol',
    'Sheffield',
    'Newcastle',
    'Nationwide'
  ];

  // Form validation
  const validateForm = () => {
    const errors: string[] = [];

    // Company Information
    if (!formData.companyName.trim()) errors.push('Company name is required');
    if (!formData.contactName.trim()) errors.push('Contact name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.phone.trim()) errors.push('Phone is required');
    if (!formData.address.street.trim()) errors.push('Street address is required');
    if (!formData.address.city.trim()) errors.push('City is required');
    if (!formData.address.postcode.trim()) errors.push('Postcode is required');
    
    // Password validation
    if (formData.password.length < 8) errors.push('Password must be at least 8 characters');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    
    // Document validation
    if (!formData.documents.businessLicense) errors.push('Business license is required');
    if (!formData.documents.insuranceCertificate) errors.push('Insurance certificate is required');
    
    // Terms validation
    if (!formData.acceptTerms) errors.push('You must accept the terms and conditions');
    if (!formData.acceptPrivacy) errors.push('You must accept the privacy policy');

    return errors;
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [field]: value }
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle multi-select changes
  const handleMultiSelect = (field: 'operatingAreas' | 'vehicleTypes', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // Handle file uploads
  const handleFileChange = (field: keyof PartnerFormData['documents'], file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: { ...prev.documents, [field]: file }
    }));
  };

  // File input component
  const FileInput = ({ 
    id, 
    label, 
    required = false, 
    selectedFile, 
    onFileSelect 
  }: {
    id: string;
    label: string;
    required?: boolean;
    selectedFile: File | null;
    onFileSelect: (field: keyof PartnerFormData['documents'], file: File | null) => void;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        {label} {required && '*'}
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-slate-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {selectedFile ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <FaCheck />
              <span>{selectedFile.name}</span>
              <button
                type="button"
                onClick={() => onFileSelect(id as keyof PartnerFormData['documents'], null)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <FaUpload className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-400" />
          )}
          <div className="flex text-sm text-gray-500 dark:text-slate-500">
            <label htmlFor={id} className="relative cursor-pointer bg-gray-200 dark:bg-slate-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 px-2 py-1">
              <span>Upload a file</span>
              <input 
                id={id} 
                name={id} 
                type="file" 
                className="sr-only" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => onFileSelect(id as keyof PartnerFormData['documents'], e.target.files ? e.target.files[0] : null)} 
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500">PDF, JPG, PNG up to 10MB</p>
        </div>
      </div>
    </div>
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating partner account...');

    try {
      // Convert files to base64 for server-side processing
      const documentsWithBase64: any = {};
      
      for (const [key, file] of Object.entries(formData.documents)) {
        if (file) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          documentsWithBase64[key] = {
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64
          };
        }
      }

      // Call server-side API for partner creation
      const response = await fetch('/api/admin/partners/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.contactName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          companyName: formData.companyName,
          businessEmail: (formData as any).businessEmail || null,
          directorName: (formData as any).directorName || null,
          directorEmail: (formData as any).directorEmail || null,
          directorPhone: (formData as any).directorPhone || null,
          address: formData.address,
          website: formData.website,
          businessType: formData.businessType,
          registrationNumber: formData.registrationNumber,
          vatNumber: formData.vatNumber,
          operatingAreas: formData.operatingAreas,
          vehicleTypes: formData.vehicleTypes,
          fleetSize: formData.fleetSize,
          estimatedMonthlyRides: formData.estimatedMonthlyRides,
          commissionRate: formData.commissionRate,
          documents: documentsWithBase64
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create partner account');
      }

      toast.success('Partner account created successfully!', { id: toastId });
      router.push('/admin/partners');

    } catch (error) {
      console.error('Error creating partner:', error);
      
      // Extract error message from API response
      let errorMessage = 'Failed to create partner account';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation between steps
  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaBuilding /> Partner Registration
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Create a new partner account with complete business information and required documents.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: 'Company Info', icon: FaBuilding },
              { step: 2, title: 'Business Details', icon: FaCar },
              { step: 3, title: 'Documents', icon: FaShieldAlt },
              { step: 4, title: 'Review & Submit', icon: FaSave }
            ].map(({ step, title, icon: Icon }) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'
                }`}>
                  {title}
                </span>
                {step < 4 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-100 dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
          
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Company Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {businessTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    id="vatNumber"
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Business Email</label>
              <input type="email" id="businessEmail" name="businessEmail" value={(formData as any).businessEmail || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="directorName" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Director Name</label>
              <input type="text" id="directorName" name="directorName" value={(formData as any).directorName || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="directorEmail" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Director Email</label>
              <input type="email" id="directorEmail" name="directorEmail" value={(formData as any).directorEmail || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="directorPhone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Director Phone</label>
              <input type="tel" id="directorPhone" name="directorPhone" value={(formData as any).directorPhone || ''} onChange={handleInputChange} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
         </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Business Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="address.street"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address.county" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      County
                    </label>
                    <input
                      type="text"
                      id="address.county"
                      name="address.county"
                      value={formData.address.county}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address.postcode" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Postcode *
                    </label>
                    <input
                      type="text"
                      id="address.postcode"
                      name="address.postcode"
                      value={formData.address.postcode}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="address.country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Business Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Business Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fleetSize" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Fleet Size *
                  </label>
                  <input
                    type="number"
                    id="fleetSize"
                    name="fleetSize"
                    value={formData.fleetSize}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="estimatedMonthlyRides" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Estimated Monthly Rides *
                  </label>
                  <input
                    type="number"
                    id="estimatedMonthlyRides"
                    name="estimatedMonthlyRides"
                    value={formData.estimatedMonthlyRides}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Commission Rate (%) *
                  </label>
                  <input
                    type="number"
                    id="commissionRate"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    min="5"
                    max="30"
                    step="0.5"
                    className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
                  Operating Areas *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {operatingAreas.map(area => (
                    <button
                      type="button"
                      key={area}
                      onClick={() => handleMultiSelect('operatingAreas', area)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        formData.operatingAreas.includes(area)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
                  Vehicle Types *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {vehicleTypes.map(type => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => handleMultiSelect('vehicleTypes', type)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        formData.vehicleTypes.includes(type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Required Documents</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileInput
                  id="businessLicense"
                  label="Business License"
                  required
                  selectedFile={formData.documents.businessLicense}
                  onFileSelect={handleFileChange}
                />
                
                <FileInput
                  id="insuranceCertificate"
                  label="Insurance Certificate"
                  required
                  selectedFile={formData.documents.insuranceCertificate}
                  onFileSelect={handleFileChange}
                />
                
                <FileInput
                  id="operatorLicense"
                  label="Operator License"
                  selectedFile={formData.documents.operatorLicense}
                  onFileSelect={handleFileChange}
                />
                
                <FileInput
                  id="taxCertificate"
                  label="Tax Certificate"
                  selectedFile={formData.documents.taxCertificate}
                  onFileSelect={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Review & Submit</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                    I accept the <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Terms and Conditions</a> *
                  </label>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="acceptPrivacy"
                    name="acceptPrivacy"
                    checked={formData.acceptPrivacy}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-blue-600 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 rounded focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="acceptPrivacy" className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                    I accept the <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</a> *
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 bg-gray-200 dark:bg-slate-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-3">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSave className="w-4 h-4" />
                  {isSubmitting ? 'Creating Account...' : 'Create Partner Account'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 