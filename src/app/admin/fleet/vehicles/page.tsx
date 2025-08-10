'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaTruck,
  FaPencilAlt,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaWrench,
  FaDollarSign,
  FaCalendar,
  FaMapMarkerAlt,
  FaUser,
  FaImage,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaTimes,
  FaCar,
  FaEyeSlash,
  FaFileAlt,
  FaExclamationTriangle,
  FaShieldAlt
} from 'react-icons/fa';
import Image from 'next/image';

interface Vehicle {
  id: string;
  name?: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  partner_id: string;
  partnerName?: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  daily_rate: number;
  weekly_rate?: number;
  location: string;
  mileage: number;
  last_service_date?: string;
  next_service_date?: string;
  images?: string[];
  image_urls?: string[];
  image_url?: string;
  features: string[];
  category: string;
  fuel_type: string;
  transmission: string;
  seats: number;
  doors: number;
  description?: string;
  created_at: any;
  updated_at: any;
  currentDriver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  currentBooking?: {
    id: string;
    startDate: Date;
    endDate: Date;
    total_amount: number;
    weekly_rate: number;
  };
  document_verification_status: 'pending' | 'approved' | 'rejected';
  visible_on_platform: boolean;
  documents: {
    [key: string]: {
      status: 'pending_review' | 'approved' | 'rejected';
      url: string;
      expiry_date: string | null;
      uploaded_at?: any;
      rejection_reason?: string;
    };
  };
  rental_durations?: string[];
  prices?: Record<string, number>;
  minimum_commitment?: {
    value: number;
    unit: string;
  };
  insurance_included: boolean;
  insurance_details?: {
    coverage?: string;
    excess?: number;
  };
}

interface Partner {
  id: string;
  business_name?: string;
  company_name?: string;
  name?: string;
  contact_person?: string;
  email: string;
  phone?: string;
}

interface Driver {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  phone?: string;
}

interface Booking {
  id: string;
  vehicle_id: string;
  car_id?: string; // Keep for backward compatibility
  driver_id: string;
  status: string;
  start_date: any;
  end_date: any;
  total_amount: number;
  weekly_rate?: number;
}

const DOCUMENT_TYPES = [
  { key: 'mot', label: 'MOT Certificate', required: true },
  { key: 'private_hire_license', label: 'Private Hire License', required: true },
  { key: 'insurance', label: 'Insurance Certificate', required: false },
  { key: 'logbook', label: 'V5C Logbook', required: true }
];

const durationLabels: Record<'hourly' | 'daily' | 'weekly' | 'monthly', string> = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function AllVehicles() {
  const { user } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Vehicle>>({});
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadVehiclesData();
  }, [user]);

  useEffect(() => {
    filterVehicles();
  }, [vehicles, searchTerm, statusFilter, categoryFilter, partnerFilter]);

  const loadVehiclesData = async () => {
    try {
      setLoading(true);
      
      // Load all data concurrently
      const [vehiclesSnapshot, partnersSnapshot, driversSnapshot, usersSnapshot, bookingsSnapshot] = await Promise.all([
        supabase.from('vehicles').select('*'),
        supabase.from('partners').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('users').select('*'),
        supabase.from('bookings').select('*')
      ]);

      // Process partners
      const partnersData: Partner[] = [];
      partnersSnapshot.data?.forEach((row: any) => {
        partnersData.push({ id: row.id, ...row });
      });

      // Add partners from users collection
      usersSnapshot.data?.forEach((row: any) => {
        const userData = row;
        if (userData.role === 'partner') {
          partnersData.push({
            id: userData.id,
            business_name: userData.company_name || userData.business_name,
            company_name: userData.company_name,
            name: userData.name || userData.full_name,
            contact_person: userData.contact_person,
            email: userData.email,
            phone: userData.phone
          });
        }
      });

      // Process drivers
      const driversData: Driver[] = [];
      driversSnapshot.data?.forEach((row: any) => {
        driversData.push({ id: row.id, ...row });
      });

      // Add drivers from users collection
      usersSnapshot.data?.forEach((row: any) => {
        const userData = row;
        if (userData.role === 'driver') {
          driversData.push({
            id: userData.id,
            name: userData.name || userData.full_name,
            full_name: userData.full_name,
            email: userData.email,
            phone: userData.phone
          });
        }
      });

      // Process bookings
      const bookingsData: Booking[] = bookingsSnapshot.data?.map((row: any) => ({
        id: row.id,
        ...row
      })) as Booking[];

      // Process vehicles and enrich with current rental info
      const vehiclesData = vehiclesSnapshot.data?.map(async (row: any) => {
        const data = row;
        
        // Get partner name
        let partnerName = 'Unknown Partner';
                 if (data.partner_id) {
           try {
             const { data: partnerData, error } = await supabase
               .from('partners')
               .select('business_name, company_name, name, email')
               .eq('id', data.partner_id)
               .single();
             if (error) throw error;
             if (partnerData) {
               partnerName = partnerData.business_name || partnerData.company_name || partnerData.name || partnerData.email || 'Unknown Partner';
             }
           } catch (error) {
             console.error('Error fetching partner data:', error);
           }
         }

        // Find current active booking
        const now = new Date();
        const activeBooking = bookingsData.find(booking => {
          if (booking.vehicle_id !== data.id) return false;
          if (booking.status !== 'active' && booking.status !== 'confirmed') return false;
          
          if (booking.start_date && booking.end_date) {
            const startDate = booking.start_date.toDate ? booking.start_date.toDate() : new Date(booking.start_date);
            const endDate = booking.end_date.toDate ? booking.end_date.toDate() : new Date(booking.end_date);
            return now >= startDate && now <= endDate;
          }
          return false;
        });

        // Find driver if vehicle is currently rented
        let currentDriver = null;
        if (activeBooking) {
          currentDriver = driversData.find(d => d.id === activeBooking.driver_id);
        }

        // Calculate weekly rate
        const weeklyRate = data.weekly_rate || data.price_per_week || (data.daily_rate * 7);

        // Combine all possible image sources
        const allImages = [
          ...(data.image_urls || []),
          ...(data.images || []),
          data.image_url
        ].filter(Boolean);

        return {
          id: data.id,
          ...data,
          partnerName,
          weekly_rate: weeklyRate,
          images: allImages,
          currentDriver: currentDriver ? {
            id: currentDriver.id,
            name: currentDriver.name || currentDriver.full_name || 'Unknown Driver',
            email: currentDriver.email,
            phone: currentDriver.phone
          } : null,
          currentBooking: activeBooking ? {
            id: activeBooking.id,
            startDate: activeBooking.start_date.toDate ? activeBooking.start_date.toDate() : new Date(activeBooking.start_date),
            endDate: activeBooking.end_date.toDate ? activeBooking.end_date.toDate() : new Date(activeBooking.end_date),
            total_amount: activeBooking.total_amount,
            weekly_rate: activeBooking.weekly_rate || weeklyRate
          } : null,
          status: activeBooking ? 'rented' : (data.status || 'available'),
          document_verification_status: 'pending',
          visible_on_platform: false,
          documents: {},
          rental_durations: data.rental_durations,
          prices: data.prices,
          minimum_commitment: data.minimum_commitment,
          insurance_included: data.insurance_included || false,
          insurance_details: data.insurance_details
        } as Vehicle;
      });

      const vehicleData = vehiclesData ? await Promise.all(vehiclesData) : [];
      setVehicles(vehicleData);
      setPartners(partnersData);
      setDrivers(driversData);
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading vehicles data:', error);
      toast.error('Failed to load vehicles data');
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    let filtered = vehicles;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.currentDriver?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.category === categoryFilter);
    }

    // Partner filter
    if (partnerFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.partner_id === partnerFilter);
    }

    setFilteredVehicles(filtered);
  };

  const handleImageUpload = async (vehicleId: string, files: FileList) => {
    if (!files.length) return;

    // Validate file types and sizes before upload
    const validFiles = Array.from(files).filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP images are allowed.`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload-car-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }
        
        const result = await response.json();
        return result.url;
      });

      const newImageUrls = await Promise.all(uploadPromises);
      
      // Update vehicle with new images
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        const existingImages = vehicle.images || vehicle.image_urls || [];
        const updatedImages = [...existingImages, ...newImageUrls];
        
        const { error } = await supabase
          .from('vehicles')
          .update({
            images: updatedImages,
            image_urls: updatedImages,
            image_url: updatedImages[0], // Set first image as primary for driver page compatibility
            updated_at: new Date()
          })
          .eq('id', vehicleId);

        if (error) throw error;

        // Update local state
        setVehicles(vehicles.map(v => 
          v.id === vehicleId 
            ? { ...v, images: updatedImages, image_urls: updatedImages, image_url: updatedImages[0] }
            : v
        ));

        toast.success(`${newImageUrls.length} image(s) uploaded successfully! Images are automatically resized to 1200x800 pixels for optimal display.`);
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast.error(`Error uploading images: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (vehicleId: string, imageIndex: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const currentImages = vehicle.images || vehicle.image_urls || [];
    const updatedImages = currentImages.filter((_: any, index: number) => index !== imageIndex);
    
    try {
      const updateData: any = {
        images: updatedImages,
        image_urls: updatedImages,
        updated_at: new Date()
      };

      // Update primary image (imageUrl) for driver page compatibility
      if (updatedImages.length > 0) {
        updateData.image_url = updatedImages[0];
      } else {
        updateData.image_url = undefined;
      }

      const { error } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles(vehicles.map(v => 
        v.id === vehicleId 
          ? { ...v, images: updatedImages, image_urls: updatedImages, image_url: updatedImages[0] || undefined }
          : v
      ));

      toast.success('Image deleted successfully!');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Error deleting image');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB');
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setEditFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      registration_number: vehicle.registration_number,
      location: vehicle.location,
      category: vehicle.category,
      fuel_type: vehicle.fuel_type,
      transmission: vehicle.transmission,
      seats: vehicle.seats,
      doors: vehicle.doors,
      mileage: vehicle.mileage,
      weekly_rate: vehicle.weekly_rate,
      daily_rate: vehicle.daily_rate,
      status: vehicle.status,
      description: vehicle.description,
      features: vehicle.features || []
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingVehicle || !editFormData) return;

    try {
      setLoading(true);
      const vehicleRef = supabase.from('vehicles').select('*').eq('id', editingVehicle.id).single();
      const { data: existingVehicle, error: fetchError } = await vehicleRef;

      if (fetchError || !existingVehicle) {
        throw new Error('Vehicle not found');
      }

      const { error: updateError } = await supabase
        .from('vehicles')
        .update({
          name: editingVehicle.name,
          make: editingVehicle.make,
          model: editingVehicle.model,
          year: editingVehicle.year,
          registration_number: editingVehicle.registration_number,
          daily_rate: editingVehicle.daily_rate,
          weekly_rate: editingVehicle.weekly_rate,
          location: editingVehicle.location,
          mileage: editingVehicle.mileage,
          last_service_date: editingVehicle.last_service_date,
          next_service_date: editingVehicle.next_service_date,
          features: editingVehicle.features,
          category: editingVehicle.category,
          fuel_type: editingVehicle.fuel_type,
          transmission: editingVehicle.transmission,
          seats: editingVehicle.seats,
          doors: editingVehicle.doors,
          description: editingVehicle.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingVehicle.id);

      if (updateError) throw updateError;

      // Update local state
      setVehicles(vehicles.map(v => 
        v.id === editingVehicle.id 
          ? { ...v, ...editFormData, updated_at: new Date() }
          : v
      ));

      setShowEditModal(false);
      setEditingVehicle(null);
      setEditFormData({});
      toast.success('Vehicle updated successfully!');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error('Error updating vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingVehicle(null);
    setEditFormData({});
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case 'rented':
        return <FaClock className="h-5 w-5 text-blue-500" />;
      case 'maintenance':
        return <FaWrench className="h-5 w-5 text-yellow-500" />;
      case 'inactive':
        return <FaTimesCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FaCheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rented':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleApproveVehicle = async (vehicleId: string) => {
    if (!user) {
      toast.error('You must be logged in to approve vehicles');
      return;
    }

    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      // Check if all required documents are uploaded
      const requiredDocs = DOCUMENT_TYPES.filter(doc => doc.required);
      const missingDocs = requiredDocs.filter(docType => 
        !vehicle.documents[docType.key] || !vehicle.documents[docType.key].url
      );

      if (missingDocs.length > 0) {
        toast.error(`Cannot approve: Missing required documents - ${missingDocs.map(d => d.label).join(', ')}`);
        return;
      }

      // Approve all documents and make vehicle visible
      const updatedDocuments = { ...vehicle.documents };
      Object.keys(updatedDocuments).forEach(docType => {
        if (updatedDocuments[docType].status === 'pending_review') {
          updatedDocuments[docType].status = 'approved';
        }
      });

      const { error } = await supabase
        .from('vehicles')
        .update({
          document_verification_status: 'approved',
          visible_on_platform: true,
          documents: updatedDocuments,
          approved_at: new Date(),
          approved_by: 'admin', // You can get actual admin info from context
          updated_at: new Date()
        })
        .eq('id', vehicleId);

      if (error) throw error;

      toast.success('Vehicle approved and made visible on platform!');
    } catch (error) {
      console.error('Error approving vehicle:', error);
      toast.error('Failed to approve vehicle');
    }
  };

  const handleRejectVehicle = async (vehicleId: string, reason: string) => {
    if (!user) {
      toast.error('You must be logged in to reject vehicles');
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          document_verification_status: 'rejected',
          visible_on_platform: false,
          rejection_reason: reason,
          rejected_at: new Date(),
          rejected_by: 'admin',
          updated_at: new Date()
        })
        .eq('id', vehicleId);

      if (error) throw error;

      toast.success('Vehicle rejected');
    } catch (error) {
      console.error('Error rejecting vehicle:', error);
      toast.error('Failed to reject vehicle');
    }
  };

  const togglePlatformVisibility = async (vehicleId: string) => {
    if (!user) {
      toast.error('You must be logged in to modify vehicle visibility');
      return;
    }

    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;

      const { error } = await supabase
        .from('vehicles')
        .update({
          visible_on_platform: !vehicle.visible_on_platform,
          updated_at: new Date()
        })
        .eq('id', vehicleId);

      if (error) throw error;

      toast.success(`Vehicle ${!vehicle.visible_on_platform ? 'shown on' : 'hidden from'} platform`);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You must be logged in to access Fleet Management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FaTruck className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Vehicles</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage all partner vehicles in your fleet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaTruck className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{vehicles.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaCheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {vehicles.filter(v => v.status === 'available').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaClock className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Currently Rented</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {vehicles.filter(v => v.status === 'rented').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaDollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(
                  vehicles
                    .filter(v => v.status === 'rented')
                    .reduce((sum, v) => sum + (v.currentBooking?.weekly_rate || v.weekly_rate || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            <option value="economy">Economy</option>
            <option value="comfort">Comfort</option>
            <option value="luxury">Luxury</option>
            <option value="suv">SUV</option>
          </select>

          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Partners</option>
            {partners
              .filter((partner, index, self) => 
                index === self.findIndex(p => p.id === partner.id)
              )
              .map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.business_name || partner.company_name || partner.name || 
                   (partner.email?.includes('@') ? 'Unknown Partner' : partner.email)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Vehicle Image Carousel */}
              <div className="relative h-48">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <>
                    <Image
                      src={vehicle.images[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      fill
                      className="object-cover"
                    />
                    {vehicle.images.length > 1 && (
                      <button
                        onClick={() => {
                          setSelectedVehicle(vehicle);
                          setCurrentImageIndex(0);
                          setShowImageModal(true);
                        }}
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <FaImage className="h-4 w-4" />
                        <span className="ml-1 text-xs">{vehicle.images.length}</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
                    <FaTruck className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                    <span className="ml-1 capitalize">{vehicle.status}</span>
                  </span>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{vehicle.make} {vehicle.model}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                    <span className="ml-1 capitalize">{vehicle.status}</span>
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{vehicle.registration_number} • {vehicle.year}</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mb-2">{vehicle.partnerName || 'Unknown Partner'}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">£{vehicle.daily_rate}/day</span>
                  <div className="flex items-center gap-1">
                    {vehicle.insurance_included ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        <FaShieldAlt className="w-3 h-3" />
                        Insurance Included
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        <FaExclamationTriangle className="w-3 h-3" />
                        Insurance Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Current Driver (if rented) */}
                {vehicle.currentDriver && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                      Currently Rented by:
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        {vehicle.currentDriver.name}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {vehicle.currentDriver.email}
                      </p>
                      {vehicle.currentBooking && (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {formatDate(vehicle.currentBooking.startDate)} - {formatDate(vehicle.currentBooking.endDate)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehicle Specs */}
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>{vehicle.fuel_type}</span>
                  <span>{vehicle.transmission}</span>
                  <span>{vehicle.seats} seats</span>
                  <span>{vehicle.category}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowDetails(true);
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FaEye className="h-4 w-4 inline mr-1" />
                    View Details
                  </button>
                  
                  <label className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer">
                    <FaImage className="h-4 w-4 inline mr-1" />
                    Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(vehicle.id, e.target.files)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl max-h-full p-4">
            <div className="relative">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 z-10"
              >
                <FaTimes className="h-6 w-6" />
              </button>
              
              {selectedVehicle.images && selectedVehicle.images.length > 0 && (
                <>
                  <Image
                    src={selectedVehicle.images[currentImageIndex]}
                    alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                    width={800}
                    height={600}
                    className="rounded-lg object-contain max-h-[80vh]"
                  />
                  
                  {selectedVehicle.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(
                          currentImageIndex === 0 ? selectedVehicle.images!.length - 1 : currentImageIndex - 1
                        )}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                      >
                        <FaChevronLeft className="h-6 w-6" />
                      </button>
                      
                      <button
                        onClick={() => setCurrentImageIndex(
                          currentImageIndex === selectedVehicle.images!.length - 1 ? 0 : currentImageIndex + 1
                        )}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                      >
                        <FaChevronRight className="h-6 w-6" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {selectedVehicle.images.length}
                      </div>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleDeleteImage(selectedVehicle.id, currentImageIndex)}
                    className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                  >
                    Delete Image
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {showDetails && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleEditVehicle(selectedVehicle);
                      setShowDetails(false);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FaPencilAlt className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <label className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer">
                    <FaImage className="h-4 w-4 inline mr-1" />
                    Add Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleImageUpload(selectedVehicle.id, e.target.files);
                          e.target.value = ''; // Reset input
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <FaTimes className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vehicle Image */}
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {selectedVehicle.images && selectedVehicle.images.length > 0 ? (
                      <Image
                        src={selectedVehicle.images[0]}
                        alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <FaTruck className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {selectedVehicle.images && selectedVehicle.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedVehicle.images.slice(1, 5).map((image, index) => (
                        <div key={index} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <Image
                            src={image}
                            alt={`${selectedVehicle.make} ${selectedVehicle.model} ${index + 2}`}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vehicle Information */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Vehicle Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Registration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.registration_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Category:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVehicle.status)}`}>
                          {getStatusIcon(selectedVehicle.status)}
                          <span className="ml-1 capitalize">{selectedVehicle.status}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Location:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.location || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Insurance:</span>
                        <div className="flex items-center gap-2">
                          {selectedVehicle.insurance_included ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              <FaShieldAlt className="w-3 h-3" />
                              Included
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              <FaExclamationTriangle className="w-3 h-3" />
                              Driver Required
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedVehicle.insurance_included && selectedVehicle.insurance_details && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Coverage:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.insurance_details.coverage || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Excess:</span>
                            <span className="font-medium text-gray-900 dark:text-white">£{selectedVehicle.insurance_details.excess || 0}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Specifications</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Fuel Type:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.fuel_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Transmission:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.transmission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Seats:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.seats}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Doors:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.doors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Mileage:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.mileage?.toLocaleString() || 'Not specified'} miles</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pricing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Weekly Rate:</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedVehicle.weekly_rate || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Daily Rate:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedVehicle.daily_rate || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Partner Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Partner Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Partner:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedVehicle.partnerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Current Rental */}
                  {selectedVehicle.currentDriver && selectedVehicle.currentBooking && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Current Rental</h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-blue-600 dark:text-blue-400">Driver:</span>
                            <span className="font-medium text-blue-900 dark:text-blue-200">{selectedVehicle.currentDriver.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600 dark:text-blue-400">Email:</span>
                            <span className="font-medium text-blue-900 dark:text-blue-200">{selectedVehicle.currentDriver.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600 dark:text-blue-400">Period:</span>
                            <span className="font-medium text-blue-900 dark:text-blue-200">
                              {formatDate(selectedVehicle.currentBooking.startDate)} - {formatDate(selectedVehicle.currentBooking.endDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600 dark:text-blue-400">Amount:</span>
                            <span className="font-bold text-blue-900 dark:text-blue-200">{formatCurrency(selectedVehicle.currentBooking.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {selectedVehicle.features && selectedVehicle.features.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedVehicle.features.map((feature, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedVehicle.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                      <p className="text-gray-600 dark:text-gray-400">{selectedVehicle.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Edit Modal */}
      {showEditModal && editingVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Vehicle: {editingVehicle.make} {editingVehicle.model}
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Make
                      </label>
                      <input
                        type="text"
                        value={editFormData.make || ''}
                        onChange={(e) => setEditFormData({...editFormData, make: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={editFormData.model || ''}
                        onChange={(e) => setEditFormData({...editFormData, model: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year
                      </label>
                      <input
                        type="number"
                        value={editFormData.year || ''}
                        onChange={(e) => setEditFormData({...editFormData, year: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={editFormData.registration_number || ''}
                        onChange={(e) => setEditFormData({...editFormData, registration_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location/Address
                      </label>
                      <input
                        type="text"
                        value={editFormData.location || ''}
                        onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                        placeholder="Enter full address where vehicle is located"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        value={editFormData.status || ''}
                        onChange={(e) => setEditFormData({...editFormData, status: e.target.value as Vehicle['status']})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="available">Available</option>
                        <option value="rented">Rented</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Specifications</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={editFormData.category || ''}
                        onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="economy">Economy</option>
                        <option value="compact">Compact</option>
                        <option value="standard">Standard</option>
                        <option value="luxury">Luxury</option>
                        <option value="suv">SUV</option>
                        <option value="van">Van</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fuel Type
                      </label>
                      <select
                        value={editFormData.fuel_type || ''}
                        onChange={(e) => setEditFormData({...editFormData, fuel_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select Fuel Type</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Transmission
                      </label>
                      <select
                        value={editFormData.transmission || ''}
                        onChange={(e) => setEditFormData({...editFormData, transmission: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select Transmission</option>
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Seats
                        </label>
                        <input
                          type="number"
                          value={editFormData.seats || ''}
                          onChange={(e) => setEditFormData({...editFormData, seats: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="2"
                          max="9"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Doors
                        </label>
                        <input
                          type="number"
                          value={editFormData.doors || ''}
                          onChange={(e) => setEditFormData({...editFormData, doors: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          min="2"
                          max="5"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mileage
                      </label>
                      <input
                        type="number"
                        value={editFormData.mileage || ''}
                        onChange={(e) => setEditFormData({...editFormData, mileage: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Weekly Rate (£)
                      </label>
                      <input
                        type="number"
                        value={editFormData.weekly_rate || ''}
                        onChange={(e) => {
                          const weeklyRate = parseFloat(e.target.value);
                          setEditFormData({
                            ...editFormData, 
                            weekly_rate: weeklyRate,
                            daily_rate: weeklyRate / 7
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Daily Rate (£) - Auto-calculated
                      </label>
                      <input
                        type="number"
                        value={editFormData.daily_rate ? editFormData.daily_rate.toFixed(2) : ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter vehicle description..."
                  />
                </div>

                {/* Image Management */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Images
                  </label>
                  <div className="space-y-4">
                    {/* Current Images */}
                    {editingVehicle?.images && editingVehicle.images.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Images:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {editingVehicle.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <Image
                                src={image}
                                alt={`${editingVehicle.make} ${editingVehicle.model} ${index + 1}`}
                                width={100}
                                height={75}
                                className="w-full h-20 object-cover rounded border"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(editingVehicle.id, index)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FaTimes className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Upload New Images */}
                    <div>
                      <label className="block w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors">
                        <FaImage className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Click to upload new images
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Images will be resized to 1200x800 pixels. Max 10MB per file.
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleImageUpload(editingVehicle!.id, e.target.files);
                              e.target.value = ''; // Reset input
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-900 dark:text-white">Uploading images...</p>
          </div>
        </div>
      )}
    </div>
  );
} 