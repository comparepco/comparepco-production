'use client';
// Force dynamic rendering so useSearchParams can be used safely during build
export const dynamic = 'force-dynamic';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaCalendarAlt, FaSearch, FaFilter, FaEye, FaClock, 
  FaMoneyBillWave, FaCar, FaMapMarkerAlt, FaFileAlt,
  FaCheckCircle, FaTimes, FaExclamationTriangle, FaStar,
  FaDownload, FaPhone, FaEnvelope, FaComments, FaLifeRing,
  FaPlus, FaUpload, FaSignature, FaUndo, FaHistory, FaBolt,
  FaTools, FaShieldAlt, FaUserCircle, FaChevronRight, FaBuilding,
  FaUser, FaEdit, FaTrash, FaBell, FaExchangeAlt, FaPaperPlane,
  FaCheck, FaInfoCircle, FaTh, FaList
} from 'react-icons/fa';
// import LiveChatWidget from '../../../components/LiveChatWidget'; // TODO: Re-enable LiveChatWidget when available
// import { Tooltip } from 'react-tooltip'; // TODO: Re-enable react-tooltip when available
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type Definitions - Updated to use consistent snake_case field names
interface Booking {
  id: string;
  status: string;
  vehicle_id: string;      // Changed from carId
  driver_id: string;       // Changed from driverId
  partner_id: string;      // Changed from partnerId
  weeks: number;
  total_amount: number;    // Changed from totalAmount
  start_date: string | any;      // Changed from startDate
  end_date: string | any;        // Changed from endDate
  created_at: string | any;      // Changed from createdAt
  updated_at: string | any;      // Changed from updatedAt
  
  // Enhanced data structure
  driver: {
    id: string;
    full_name: string;     // Changed from fullName
    email: string;
    phone: string;
    verified: boolean;
  };
  partner: {
    id: string;
    full_name: string;     // Changed from fullName
    email: string;
    phone?: string;
    business_address: string;  // Changed from businessAddress
    company_name: string;      // Changed from companyName
  };
  car: {
    id: string;
    make: string;
    model: string;
    year: string;
    license_plate: string;     // Changed from registrationNumber
    registration_number?: string;  // Added for compatibility
    registration_plate?: string;   // Added for compatibility
    color: string;
    fuel_type: string;         // Changed from fuelType
    transmission: string;
    seats: string;
    mileage: string;
    image: string;
    price_per_week: number;    // Changed from pricePerWeek
    sale_price_per_week?: number;  // Changed from salePricePerWeek
  };
  
  // Documents and agreements
  documents_uploaded: any[];   // Changed from documentsUploaded
  agreement_url: string | null;    // Changed from agreementUrl
  agreement_signed: boolean;       // Changed from agreementSigned
  agreement_signed_at: string;     // Changed from agreementSignedAt
  driver_lifetime_approved?: boolean;  // Changed from driverLifetimeApproved
  vehicle_documents?: { [key: string]: any };  // Changed from vehicleDocuments
  
  // Vehicle and issue management
  current_vehicle_id: string;      // Changed from currentVehicleId
  vehicle_history: any[];          // Changed from vehicleHistory
  issues: any[];
  
  // Return and completion tracking
  return_requested: boolean;       // Changed from returnRequested
  return_requested_at: string;     // Changed from returnRequestedAt
  return_approved: boolean;        // Changed from returnApproved
  return_approved_at: string;      // Changed from returnApprovedAt
  completed_at: string;            // Changed from completedAt
  activated_at?: string;           // Changed from activatedAt
  
  // Return request details - enhanced structure
  return_request?: {
    requested_at: string;          // Changed from requestedAt
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    response_at?: string;          // Changed from responseAt
    response_reason?: string;      // Changed from responseReason
  };
  
  // Return request fields from API
  return_reason?: string;          // Changed from returnReason
  return_requested_by?: string;    // Changed from returnRequestedBy
  return_requested_by_type?: string;  // Changed from returnRequestedByType
  
  // History for audit trail
  history: any[];

  // Legacy fields for compatibility (keeping these for backward compatibility)
  car_name?: string;
  car_image?: string;
  car_plate?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_email?: string;
  weekly_rate?: number;            // Changed from weeklyRate
  total_weeks?: number;            // Changed from totalWeeks
  payment_status?: 'pending' | 'paid' | 'overdue' | 'refunded';  // Changed from paymentStatus
  pickup_location?: string;        // Changed from pickupLocation
  dropoff_location?: string;       // Changed from dropoffLocation
  requirements?: string[];
  partner_notes?: string;          // Changed from partnerNotes
  partner_response_deadline?: string | any;  // Changed from partnerResponseDeadline

  // Partner-specific legacy fields for backward compatibility
  driver_info?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    verified?: boolean;
  };
  car_info?: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;         // Changed from registrationPlate
    registration_plate?: string;   // Added for compatibility
    color: string;
    fuel_type: string;             // Changed from fuelType
    transmission: string;
    seats: number;
    mileage: number;
    weekly_rate: number;           // Changed from weeklyRate
  };
  booking_details?: {
    start_date: string;            // Changed from startDate
    end_date: string;              // Changed from endDate
    total_weeks: number;           // Changed from totalWeeks
    total_amount: number;          // Changed from totalAmount
    pickup_location: string;       // Changed from pickupLocation
    dropoff_location: string;      // Changed from dropoffLocation
    requirements: string[];
  };
  payment_instruction?: {
    method: 'bank_transfer' | 'credit_card' | 'cash' | 'other';
    status: 'pending' | 'sent' | 'received' | 'failed';
    details?: string;
  };
  deposit?: {
    required: boolean;
    status: 'pending' | 'received' | 'failed';
    instruction_id?: string;       // Changed from instructionId
    amount?: number;
    due_date?: string;             // Changed from dueDate
    payment_method?: string;       // Changed from paymentMethod
    payment_status?: 'pending' | 'received' | 'failed';  // Changed from paymentStatus
    payment_details?: string;      // Changed from paymentDetails
  };
}

interface Issue {
  id: string;
  type: string;
  description: string;
  severity: string;
  status: string;
  reported_by: string;
  reported_by_type: string;
  reported_by_name: string;
  reported_at: any;
  images: string[];
  resolved_at: any;
  resolved_by: string;
  resolution_notes: string;
}

interface BookingStats {
  total: number;
  pending: number;
  accepted: number;
  active: number;
  completed: number;
  rejected: number;
  total_revenue: number;
}

// Constants
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  pending_partner_approval: 'bg-orange-100 text-orange-800',
  pending_admin_approval: 'bg-purple-100 text-purple-800',
  pending_insurance_upload: 'bg-gray-100 text-gray-600',
  insurance_uploaded: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  partner_accepted: 'bg-green-100 text-green-800',
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

// Icon mapping for status (similar to Fleet UI)
const bookingStatusIcons: Record<string, any> = {
  pending_partner_approval: FaClock,
  pending_documents: FaFileAlt,
  pending_insurance_upload: FaFileAlt,
  partner_accepted: FaCheckCircle,
  confirmed: FaCalendarAlt,
  active: FaCheckCircle,
  completed: FaCalendarAlt,
  cancelled: FaTimes,
  rejected: FaTimes,
};

const getStatusIcon = (status: string) => bookingStatusIcons[status] || FaCalendarAlt;

export default function PartnerBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Main State
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [paginatedBookings, setPaginatedBookings] = useState<Booking[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  // View Mode (list or grid)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Form State
  const [approvalData, setApprovalData] = useState({ action: '', reason: '', overrideInsurance: false });
  const [returnData, setReturnData] = useState({ action: '', reason: '' });
  const [vehicleData, setVehicleData] = useState({ vehicleId: '', reason: '', adjustmentType: 'prorated' as 'prorated' | 'immediate' | 'next_cycle' });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelRefundType, setCancelRefundType] = useState<'full' | 'prorated' | 'none'>('prorated');
  
  // Loading States
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Enhanced filtering state for notification-driven filters
  const [activeNotificationFilter, setActiveNotificationFilter] = useState('');

  // Utility Functions
  const formatStatus = (status: string) => 
    status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getStatusColor = (status: string) => 
    STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  const getSeverityColor = (severity: string) => 
    SEVERITY_COLORS[severity] || 'bg-gray-100 text-gray-800';

  const isUrgent = (booking: Booking) => {
    if (booking.status === 'pending_partner_approval' && booking.partner_response_deadline) {
      const deadline = booking.partner_response_deadline.toDate ? booking.partner_response_deadline.toDate() : new Date(booking.partner_response_deadline);
      const now = new Date();
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursLeft <= 24;
    }
    return booking.issues?.some(issue => issue.severity === 'critical') || false;
  };

  const calculateStats = (): BookingStats => {
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status.includes('pending')).length,
      accepted: bookings.filter(b => b.status === 'partner_accepted').length,
      active: bookings.filter(b => b.status === 'active').length, // Only truly active bookings
      completed: bookings.filter(b => b.status === 'completed').length,
      rejected: bookings.filter(b => b.status === 'rejected' || b.status === 'partner_rejected').length,
      total_revenue: bookings
        .filter(b => {
          const paid = b.payment_status === 'paid';
          const notRefund = b.payment_status !== 'refunded';
          const notCancelled = b.status !== 'cancelled' && b.status !== 'rejected';
          return paid && notRefund && notCancelled;
        })
        .reduce((sum, b) => sum + (b.total_amount || b.booking_details?.total_amount || 0), 0)
    };
    return stats;
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    if (typeof date?.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date: any) => {
    if (!date) return 'N/A';
    if (typeof date?.toDate === 'function') {
      return date.toDate().toLocaleString();
    }
    return new Date(date).toLocaleString();
  };

  // Pagination Functions
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page + ellipsis
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300">
            ...
          </span>
        );
      }
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        >
          ‹
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        >
          ›
        </button>
      );
    }

    // Last page + ellipsis
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  // Modal Management
  const closeAllModals = () => {
    setShowDetails(false);
    setShowApprovalModal(false);
    setShowReturnModal(false);
    setShowVehicleModal(false);
    setShowCancelModal(false);
    setSelectedBooking(null);
    setApprovalData({ action: '', reason: '', overrideInsurance: false });
    setReturnData({ action: '', reason: '' });
    setVehicleData({ vehicleId: '', reason: '', adjustmentType: 'prorated' as 'prorated' | 'immediate' | 'next_cycle' });
    setCancelReason('');
    // Remove bookingId from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('bookingId');
    const newUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
    router.replace(newUrl);
  };

  // Authentication and Authorization
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (!user.role || !['partner', 'partner_staff'].includes(user.role.toLowerCase())) {
        router.replace('/');
      } else {
        setLoading(false);
        loadBookings();
        loadAvailableVehicles();
      }
    }
  }, [user, authLoading, router]);

  // Data Loading
  const loadBookings = async () => {
    if (!user) return;

    try {
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      
      if (!partnerId) {
        console.error('No partner ID found for bookings data');
        return;
      }
      
      console.log('🔍 Loading bookings for partner:', partnerId, 'User role:', user.role);

      // Fetch bookings from Supabase
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      // Fetch complete car, driver, and partner details for each booking
      const enrichedBookings = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          let carDetails = null;
          let driverDetails = null;
          let partnerDetails = null;

          // Fetch car details (fallback to currentVehicleId or vehicleId)
          const carDocId = booking.car_id || booking.current_vehicle_id || booking.vehicle_id;
          if (carDocId) {
            try {
              const { data: carData, error: carError } = await supabase
                .from('vehicles')
                .select('*')
                .eq('id', carDocId)
                .single();

              if (!carError && carData) {
                carDetails = carData;
              }
            } catch (error) {
              console.error('Error fetching car details for booking:', booking.id, error);
            }
          }

          // Fetch driver details
          if (booking.driver_id) {
            try {
              const { data: driverData, error: driverError } = await supabase
                .from('users')
                .select('*')
                .eq('id', booking.driver_id)
                .single();

              if (!driverError && driverData) {
                driverDetails = {
                  id: driverData.id,
                  full_name: driverData.full_name || driverData.name,
                  email: driverData.email,
                  phone: driverData.phone,
                  verified: driverData.verified || false
                };
              }
            } catch (error) {
              console.error('Error fetching driver details for booking:', booking.id, error);
            }
          }

          // Fetch partner details
          if (booking.partner_id) {
            try {
              const { data: partnerData, error: partnerError } = await supabase
                .from('users')
                .select('*')
                .eq('id', booking.partner_id)
                .single();

              if (!partnerError && partnerData) {
                partnerDetails = {
                  id: partnerData.id,
                  full_name: partnerData.full_name || partnerData.name,
                  email: partnerData.email,
                  phone: partnerData.phone,
                  business_address: partnerData.business_address,
                  company_name: partnerData.company_name
                };
              }
            } catch (error) {
              console.error('Error fetching partner details for booking:', booking.id, error);
            }
          }

          return {
            ...booking,
            // Enhanced car information
            car: carDetails,
            car_name: carDetails ? `${carDetails.make} ${carDetails.model}` : (booking.car_info ? `${booking.car_info.make} ${booking.car_info.model}` : (booking.car_name || 'Unknown Vehicle')),
            car_plate: carDetails?.registration_number || carDetails?.registration_plate || carDetails?.license_plate || booking.car_plate || 'N/A',
            
            // Enhanced driver information  
            driver: driverDetails,
            driver_name: driverDetails?.full_name || booking.driver_name || 'Unknown Driver',
            driver_email: driverDetails?.email || booking.driver_email || 'N/A',
            driver_phone: driverDetails?.phone || booking.driver_phone || 'N/A',
            
            // Enhanced partner information
            partner: partnerDetails,
            
            // Enhanced return request handling
            return_requested: booking.return_requested || !!booking.return_requested_at || !!booking.return_request?.status,
            return_approved: booking.return_approved || booking.return_request?.status === 'approved',
            return_request: booking.return_request || (booking.return_requested ? {
              requested_at: booking.return_requested_at,
              reason: booking.return_reason || 'No reason provided',
              status: booking.return_approved ? 'approved' : 'pending' as const,
              response_at: booking.return_approved_at,
              response_reason: undefined
            } : undefined),
          } as Booking;
        })
      );
      
      console.log('Loaded and enriched partner bookings:', enrichedBookings.length);
      setBookings(enrichedBookings);
      setFilteredBookings(enrichedBookings);
    } catch (error) {
      console.error('Error loading partner bookings:', error);
      alert('Failed to load bookings. Please refresh the page.');
    }
  };

  const loadAvailableVehicles = async () => {
    if (!user) return;

    try {
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      
      if (!partnerId) {
        console.error('No partner ID found for vehicles data');
        return;
      }
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', partnerId);

      if (error) {
        console.error('Error loading vehicles:', error);
        return;
      }
      
      setAvailableVehicles(vehicles || []);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  // Filtering Logic
  useEffect(() => {
    let filtered = [...bookings];

    // Apply notification-driven filters first
    if (activeNotificationFilter) {
      switch (activeNotificationFilter) {
        case 'return_requests':
          filtered = filtered.filter(booking => 
            (booking.return_requested || booking.return_requested_at) && !booking.return_approved
          );
          break;
        case 'expiring':
          const now = new Date();
          const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(booking => {
            if (!booking.end_date || booking.status !== 'active') return false;
            const end_date = booking.end_date.toDate ? booking.end_date.toDate() : new Date(booking.end_date);
            return end_date <= sevenDaysFromNow && end_date > now;
          });
          break;
        case 'payment_issues':
          filtered = filtered.filter(booking => 
            booking.payment_status === 'overdue' || 
            (booking.payment_status === 'pending' && booking.status === 'active')
          );
          break;
        case 'pending_documents':
          filtered = filtered.filter(booking => 
            booking.status === 'partner_accepted' && 
            (!booking.documents_uploaded || booking.documents_uploaded.length === 0)
          );
          break;
      }
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const searchLower = searchTerm.toLowerCase();
        const driver_name = booking.driver_name || booking.driver_info?.name || booking.driver?.full_name || '';
        const car_name = booking.car_name || `${booking.car_info?.make} ${booking.car_info?.model}` || `${booking.car?.make} ${booking.car?.model}` || '';
        return (
          driver_name.toLowerCase().includes(searchLower) ||
          car_name.toLowerCase().includes(searchLower) ||
          booking.id.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter) {
      filtered = filtered.filter(booking => booking.payment_status === paymentFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(booking => {
        const booking_date = booking.start_date?.toDate ? booking.start_date.toDate() : new Date(booking.start_date || '');
        return booking_date >= new Date(dateRange.start);
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(booking => {
        const booking_date = booking.start_date?.toDate ? booking.start_date.toDate() : new Date(booking.start_date || '');
        return booking_date <= new Date(dateRange.end);
      });
    }



    // Priority sorting: Return requests first, then urgent bookings, then by creation date
    filtered.sort((a, b) => {
      const aHasReturn = (a.return_requested || a.return_requested_at) && !a.return_approved;
      const bHasReturn = (b.return_requested || b.return_requested_at) && !b.return_approved;
      
      if (aHasReturn && !bHasReturn) return -1;
      if (!aHasReturn && bHasReturn) return 1;
      
      const aIsUrgent = isUrgent(a);
      const bIsUrgent = isUrgent(b);
      
      if (aIsUrgent && !bIsUrgent) return -1;
      if (!aIsUrgent && bIsUrgent) return 1;
      
      // Sort by creation date (newest first)
      return (b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at)).getTime() - (a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at)).getTime();
    });

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, paymentFilter, dateRange, activeNotificationFilter]);

  // Pagination useEffect - updates paginated bookings when filtered bookings or current page changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredBookings.slice(startIndex, endIndex);
    setPaginatedBookings(paginated);
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, dateRange, activeNotificationFilter]);

  // Check for URL filter parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const filter = urlParams.get('filter');
      if (filter) {
        setActiveNotificationFilter(filter);
        // Clear URL parameter to clean up address bar
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  // Auto-open booking details if bookingId is in URL
  useEffect(() => {
    const urlBookingId = window.location.search.split('bookingId=')[1];
    if (urlBookingId && (!selectedBooking || selectedBooking.id !== urlBookingId)) {
      const found = bookings.find(b => b.id === urlBookingId);
      if (found) {
        setSelectedBooking(found);
        setShowDetails(true);
      }
    }
  }, [bookings, selectedBooking]);

  // Action Handlers
  const handleApproval = async () => {
    console.log('🔄 handleApproval called');
    console.log('📋 Selected booking:', selectedBooking?.id);
    console.log('⚡ Approval data:', approvalData);
    console.log('👤 User:', user?.email);

    if (!selectedBooking || !approvalData.action) {
      console.log('❌ Missing required data:', { selectedBooking: !!selectedBooking, action: approvalData.action });
      alert('Please select an action before submitting.');
      return;
    }

    if (!user) {
      console.log('❌ No user found');
      alert('You must be logged in to perform this action.');
      return;
    }

    // For rejection, require a reason
    if (approvalData.action === 'reject' && !approvalData.reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setSubmittingApproval(true);
    try {
      console.log('📤 Sending partner response to API...');
      
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      
      if (!partnerId) {
        throw new Error('No partner ID found. Please contact support.');
      }
      
      const response = await fetch('/api/bookings/partner-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          partnerId: partnerId,
          action: approvalData.action,
          rejectionReason: approvalData.action === 'reject' ? approvalData.reason : undefined,
          overrideInsurance: approvalData.overrideInsurance
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Partner response successful:', result);

      alert(`Booking ${approvalData.action === 'accept' ? 'approved' : 'rejected'} successfully!`);
      closeAllModals();
      
      // Reload bookings to show updated data
      await loadBookings();
    } catch (error: any) {
      console.error('❌ Error processing partner response:', error);
      
      // More specific error messages
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('Unauthorized')) {
        alert('You do not have permission to respond to this booking. Please contact support.');
      } else if (errorMessage.includes('not found')) {
        alert('Booking not found. It may have been deleted or moved.');
      } else if (errorMessage.includes('no longer pending')) {
        alert('This booking is no longer pending approval. Please refresh the page to see the current status.');
        await loadBookings(); // Refresh data
      } else {
        alert(`Failed to process response: ${errorMessage}. Please try again.`);
      }
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleReturnRequest = async () => {
    console.log('🔄 handleReturnRequest called');
    console.log('📋 Selected booking:', selectedBooking?.id);
    console.log('⚡ Return data:', returnData);
    console.log('👤 User:', user?.email);

    if (!selectedBooking || !returnData.action) {
      console.log('❌ Missing required data:', { selectedBooking: !!selectedBooking, action: returnData.action });
      alert('Please select an action before submitting.');
      return;
    }

    if (!user) {
      console.log('❌ No user found');
      alert('You must be logged in to perform this action.');
      return;
    }

    // For rejection, require a reason
    if (returnData.action === 'reject' && !returnData.reason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    setSubmittingReturn(true);
    try {
      console.log('📤 Sending return response to API...');
      
      const partnerId = user.role?.toLowerCase() === 'partner_staff' ? (user as any).partnerId : user.id;
      
      if (!partnerId) {
        throw new Error('No partner ID found. Please contact support.');
      }

      const response = await fetch('/api/bookings/request-return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          reason: returnData.reason || undefined,
          requestedBy: partnerId,
          requestedByType: 'partner',
          action: returnData.action === 'approve' ? 'approve' : 'reject'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Return response successful:', result);

      alert(`Return request ${returnData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      closeAllModals();
      
      // Reload bookings to show updated data
      await loadBookings();
    } catch (error: any) {
      console.error('❌ Error processing return response:', error);
      
      // More specific error messages
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('Unauthorized')) {
        alert('You do not have permission to respond to this return request. Please contact support.');
      } else if (errorMessage.includes('not found')) {
        alert('Booking not found. It may have been deleted or moved.');
      } else if (errorMessage.includes('No return request')) {
        alert('No return request found for this booking. Please refresh the page.');
        await loadBookings(); // Refresh data
      } else {
        alert(`Failed to process return response: ${errorMessage}. Please try again.`);
      }
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleVehicleAssignment = async () => {
    if (!selectedBooking || !vehicleData.vehicleId) return;

    setSubmittingVehicle(true);
    try {
      const partnerId = user?.role?.toLowerCase() === 'partner_staff' ? (user as any)?.partnerId : user?.id;

      const reasonText = vehicleData.reason?.trim() || 'Vehicle change (no specific reason provided)';

      // Call the enhanced vehicle change API
      const response = await fetch('/api/bookings/change-vehicle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          partnerId: partnerId || '',
          newVehicleId: vehicleData.vehicleId,
          reason: reasonText,
          adjustmentType: vehicleData.adjustmentType || 'prorated'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change vehicle');
      }

      // Show detailed success message with cost adjustment info
      const adjustmentMessage = result.adjustmentAmount !== 0
        ? `\n\nCost Adjustment:\n• ${result.adjustmentAmount >= 0 ? 'Additional charge' : 'Refund'}: £${Math.abs(result.adjustmentAmount)}\n• New weekly rate: £${result.newWeeklyRate}\n• Rate difference: ${result.rateDifference >= 0 ? '+' : ''}£${result.rateDifference}/week\n• Payment ${result.paymentProcessed ? 'processed successfully' : 'will be processed shortly'}.`
        : '\n\nNo cost change for this vehicle swap.';

      alert(`Vehicle changed successfully!${adjustmentMessage}`);
      closeAllModals();
      // Reload bookings to reflect the updated vehicle and registration details
      await loadBookings();
    } catch (error) {
      console.error('Error changing vehicle:', error);
      alert(`Failed to change vehicle: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setSubmittingVehicle(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) return;

    setSubmittingCancel(true);
    try {
      // Call the enhanced cancellation API
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
                 body: JSON.stringify({
           bookingId: selectedBooking.id,
                       partnerId: user?.id || '',
           reason: cancelReason,
           refundType: cancelRefundType || 'prorated'
         }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel booking');
      }

      // Show detailed success message with refund info
      const refundMessage = result.refundAmount > 0 
        ? `\n\nRefund Details:\n• Amount: £${result.refundAmount}\n• Days used: ${result.daysUsed}\n• Total days: ${result.totalDays}\n• Refund will be processed within 5-10 business days.`
        : '\n\nNo refund applicable for this cancellation.';

      alert(`Booking cancelled successfully!${refundMessage}`);
      closeAllModals();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(`Failed to cancel booking: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setSubmittingCancel(false);
    }
  };

  const [markingReceived, setMarkingReceived] = useState(false);
  const [receivedMessage, setReceivedMessage] = useState('');

  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [bookingInstructions, setBookingInstructions] = useState<any[]>([]);

  useEffect(() => {
    if (!showDetails || !selectedBooking) return;
    // Fetch payment instructions and payments for this booking
    const fetchPayments = async () => {
      if (!selectedBooking) return;
      
      // Fetch payment instructions
      const { data: instructionsData, error: instructionsError } = await supabase
        .from('payment_instructions')
        .select('*')
        .eq('booking_id', selectedBooking.id)
        .order('created_at', { ascending: true });

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', selectedBooking.id)
        .order('created_at', { ascending: true });

      if (instructionsError) {
        console.error('Error fetching payment instructions:', instructionsError);
      }
      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      setBookingInstructions(instructionsData || []);
      setBookingPayments(paymentsData || []);
    };
    fetchPayments();
  }, [showDetails, selectedBooking]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading partner bookings...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
        <p className="mt-2 text-gray-600">Manage your vehicle bookings and driver requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
        {/* Total */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-green-600 mt-1">All bookings</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <FaCalendarAlt className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-yellow-600 mt-1">Awaiting action</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl">
              <FaClock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Accepted */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Accepted</p>
              <p className="text-3xl font-bold text-gray-900">{stats.accepted}</p>
              <p className="text-xs text-blue-600 mt-1">Partner accepted</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <FaCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-green-600 mt-1">Ongoing bookings</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
              <FaCheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
              <p className="text-xs text-red-600 mt-1">Declined bookings</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
              <FaTimes className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filter Bookings</h2>
            {activeNotificationFilter && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {activeNotificationFilter === 'return_requests' && '🔄 Return Requests'}
                  {activeNotificationFilter === 'expiring' && '⏰ Expiring Rentals'}
                  {activeNotificationFilter === 'payment_issues' && '💳 Payment Issues'}
                  {activeNotificationFilter === 'pending_documents' && '📄 Pending Documents'}
                </span>
                <button
                  onClick={() => setActiveNotificationFilter('')}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-black mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by driver, car, or booking ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending_partner_approval">Pending Approval</option>
                <option value="pending_documents">Pending Documents</option>
                <option value="partner_accepted">Accepted</option>
                <option value="pending_insurance_upload">Pending Insurance Upload</option>
                <option value="insurance_uploaded">Insurance Uploaded</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Payment Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>


          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Bookings ({filteredBookings.length})
            </h2>
            {filteredBookings.length > 0 && (
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length}
              </div>
            )}
          </div>
        </div>
        
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">
              {bookings.length === 0 ? 'You don\'t have any bookings yet.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {paginatedBookings.map((booking) => (
              <div key={booking.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                {/* Mobile-first responsive layout */}
                <div className="space-y-4">
                  {/* Header with driver name and main status */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 leading-tight">
                        {booking.driver_name || booking.driver_info?.name || booking.driver?.full_name || 'Unknown Driver'}
                        <span className="ml-4 text-xs font-semibold text-gray-600 align-middle">BOOKING ID: <span className="font-mono text-gray-900">{booking.id}</span></span>
                        <span className="ml-4 inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold align-middle border border-blue-200">WEEKLY</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {React.createElement(getStatusIcon(booking.status), {className:'h-3 w-3'})}
                          {formatStatus(booking.status)}
                        </span>
                        {isUrgent(booking) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FaBolt className="mr-1 h-3 w-3" />
                            Urgent
                          </span>
                        )}
                        {(booking.return_requested || booking.return_requested_at) && !booking.return_approved && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <FaUndo className="mr-1 h-3 w-3" />
                            Return Requested
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons - responsive */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:ml-4">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetails(true);
                        }}
                        className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaEye className="mr-2 h-4 w-4" />
                        View Details
                      </button>
                      
                      {booking.status === 'pending_partner_approval' && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowApprovalModal(true);
                          }}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FaCheckCircle className="mr-2 h-4 w-4" />
                          Respond
                        </button>
                      )}
                      
                      {/* Return Request Handling */}
                      {(booking.return_requested || booking.return_requested_at) && !booking.return_approved && (
                        <button
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowReturnModal(true);
                          }}
                          className="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <FaUndo className="mr-2 h-4 w-4" />
                          Handle Return
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Booking details - responsive grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {/* Vehicle info */}
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FaCar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {booking.car_name || `${booking.car_info?.make} ${booking.car_info?.model}` || `${booking.car?.make} ${booking.car?.model}` || 'Vehicle TBD'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {booking.car_plate || booking.car_info?.registration_plate || booking.car?.registration_number || booking.car?.license_plate || 'No Registration'}
                        </div>
                        <div className="text-xs text-blue-700 font-semibold mt-1">
                          £{(booking.car?.price_per_week || booking.car_info?.weekly_rate || booking.weekly_rate || 0).toLocaleString()}/week
                        </div>
                      </div>
                    </div>
                    
                    {/* Date info */}
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <FaCalendarAlt className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900">
                          {formatDate(booking.start_date)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          to {formatDate(booking.end_date)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Payment info */}
                    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg sm:col-span-2 lg:col-span-1">
                      <FaMoneyBillWave className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900">
                          £{(booking.total_amount || booking.booking_details?.total_amount || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total amount
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  <span>
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} results
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Previous button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center space-x-0">
                    {renderPagination()}
                  </div>
                  
                  {/* Next button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
        )}
      </div>

      {/* View Details Modal - Mirrors Driver Side Exactly */}
      {showDetails && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <button
                  onClick={closeAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Driver Information */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaUserCircle className="mr-3 h-6 w-6 text-blue-600" />
                  Driver Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Full Name:</span>
                      <p className="text-gray-900 font-medium">
                        {selectedBooking.driver_name || selectedBooking.driver_info?.name || selectedBooking.driver?.full_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">
                        {selectedBooking.driver_email || selectedBooking.driver_info?.email || selectedBooking.driver?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <p className="text-gray-900">
                        {selectedBooking.driver_phone || selectedBooking.driver_info?.phone || selectedBooking.driver?.phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Verification Status:</span>
                      <div className="flex items-center mt-1">
                        {selectedBooking.driver_info?.verified || selectedBooking.driver?.verified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheckCircle className="mr-1 h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FaClock className="mr-1 h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partner Information */}
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaBuilding className="mr-3 h-6 w-6 text-green-600" />
                  Partner Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Company Name:</span>
                      <p className="text-gray-900 font-medium">
                        {selectedBooking.partner?.company_name || (user as any)?.company_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Contact Person:</span>
                      <p className="text-gray-900">
                        {selectedBooking.partner?.full_name || (user as any)?.full_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Email:</span>
                      <p className="text-gray-900">
                        {selectedBooking.partner?.email || user?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Business Address:</span>
                      <p className="text-gray-900">
                        {selectedBooking.partner?.business_address || (user as any)?.business_address || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaCar className="mr-3 h-6 w-6 text-gray-600" />
                  Vehicle Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Make & Model:</span>
                      <p className="text-gray-900 font-medium">
                        {selectedBooking.car_name || 
                         `${selectedBooking.car_info?.make} ${selectedBooking.car_info?.model}` || 
                         `${selectedBooking.car?.make} ${selectedBooking.car?.model}` || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Year:</span>
                      <p className="text-gray-900">
                        {selectedBooking.car_info?.year || selectedBooking.car?.year || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Registration:</span>
                      <p className="text-gray-900 font-mono">
                        {selectedBooking.car_plate || selectedBooking.car_info?.registration_plate || selectedBooking.car?.registration_number || selectedBooking.car?.license_plate || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Color:</span>
                      <p className="text-gray-900">
                        {selectedBooking.car_info?.color || selectedBooking.car?.color || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Fuel Type:</span>
                      <p className="text-gray-900">
                        {selectedBooking.car_info?.fuel_type || selectedBooking.car?.fuel_type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Transmission:</span>
                      <p className="text-gray-900">
                        {selectedBooking.car_info?.transmission || selectedBooking.car?.transmission || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Seats:</span>
                      <p className="text-gray-900">
                        {selectedBooking.car_info?.seats || selectedBooking.car?.seats || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Mileage:</span>
                      <p className="text-gray-900">
                        {selectedBooking.car_info?.mileage || selectedBooking.car?.mileage || 'N/A'} miles
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaCalendarAlt className="mr-3 h-6 w-6 text-purple-600" />
                  Booking Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Start Date:</span>
                      <p className="text-gray-900 font-medium">{formatDate(selectedBooking.start_date)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">End Date:</span>
                      <p className="text-gray-900 font-medium">{formatDate(selectedBooking.end_date)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Duration:</span>
                      <p className="text-gray-900">
                        {selectedBooking.weeks || selectedBooking.total_weeks || selectedBooking.booking_details?.total_weeks || 'N/A'} weeks
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Weekly Rate:</span>
                      <p className="text-gray-900 font-medium">
                        £{(selectedBooking.weekly_rate || selectedBooking.car_info?.weekly_rate || selectedBooking.car?.price_per_week || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                      <p className="text-gray-900 font-bold text-lg">
                        £{(selectedBooking.total_amount || selectedBooking.booking_details?.total_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        PAYMENT_STATUS_COLORS[selectedBooking.payment_status || 'pending']
                      }`}>
                        {formatStatus(selectedBooking.payment_status || 'pending')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Pickup Location:</span>
                      <p className="text-gray-900">
                        {selectedBooking.pickup_location || selectedBooking.booking_details?.pickup_location || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Drop-off Location:</span>
                      <p className="text-gray-900">
                        {selectedBooking.dropoff_location || selectedBooking.booking_details?.dropoff_location || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle History */}
              {selectedBooking.vehicle_history && selectedBooking.vehicle_history.length > 0 && (
                <div className="bg-orange-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaHistory className="mr-3 h-6 w-6 text-orange-600" />
                    Vehicle Assignment History
                  </h3>
                  <div className="space-y-3">
                    {selectedBooking.vehicle_history.map((vh, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="font-medium text-gray-900">{vh.vehicle_name}</p>
                          {vh.reason && <p className="text-sm text-gray-600">{vh.reason}</p>}
                          <p className="text-xs text-gray-500">Assigned by: {vh.assigned_by}</p>
                        </div>
                        <p className="text-sm text-gray-500">{formatDateTime(vh.assigned_at)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {selectedBooking.issues && selectedBooking.issues.length > 0 && (
                <div className="bg-red-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaExclamationTriangle className="mr-3 h-6 w-6 text-red-600" />
                    Reported Issues
                  </h3>
                  <div className="space-y-4">
                    {selectedBooking.issues.map((issue, index) => (
                      <div key={issue.id || index} className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                              {formatStatus(issue.severity)}
                            </span>
                            <span className="font-medium text-gray-900">{issue.type}</span>
                          </div>
                          <span className="text-sm text-gray-500">{formatDateTime(issue.reported_at)}</span>
                        </div>
                        <p className="text-gray-700 mb-2">{issue.description}</p>
                        <p className="text-xs text-gray-500">
                          Reported by: {issue.reported_by_name || issue.reported_by} ({issue.reported_by_type || 'Unknown'})
                        </p>
                        {issue.status === 'resolved' && issue.resolution_notes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-800">Resolution:</p>
                            <p className="text-sm text-green-700">{issue.resolution_notes}</p>
                            {issue.resolved_at && (
                              <p className="text-xs text-green-600 mt-1">
                                Resolved on {formatDateTime(issue.resolved_at)} by {issue.resolved_by}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Return Request */}
              {(selectedBooking.return_requested || selectedBooking.return_request) && (
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaUndo className="mr-3 h-6 w-6 text-yellow-600" />
                    Return Request
                  </h3>
                  <div className="bg-white rounded-lg border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <p className="text-gray-900 font-medium">
                          {selectedBooking.return_request?.status || (selectedBooking.return_approved ? 'approved' : 'pending')}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Requested Date:</span>
                        <p className="text-gray-900">
                          {formatDateTime(selectedBooking.return_requested_at || selectedBooking.return_request?.requested_at)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-sm font-medium text-gray-600">Reason:</span>
                        <p className="text-gray-900">{selectedBooking.return_request?.reason || 'No reason provided'}</p>
                      </div>
                      {selectedBooking.return_request?.response_at && (
                        <>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Response Date:</span>
                            <p className="text-gray-900">{formatDateTime(selectedBooking.return_request.response_at)}</p>
                          </div>
                          {selectedBooking.return_request.response_reason && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Response Reason:</span>
                              <p className="text-gray-900">{selectedBooking.return_request.response_reason}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Documents and Agreements */}
              <div className="bg-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaFileAlt className="mr-3 h-6 w-6 text-indigo-600" />
                  Documents & Agreements
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Rental Agreement</p>
                        <p className="text-sm text-gray-600">
                          Status: {selectedBooking.agreement_signed ? (
                            <span className="text-green-600 font-medium">Signed</span>
                          ) : (
                            <span className="text-yellow-600 font-medium">Pending Signature</span>
                          )}
                        </p>
                        {selectedBooking.agreement_signed_at && (
                          <p className="text-xs text-gray-500">
                            Signed on: {formatDateTime(selectedBooking.agreement_signed_at)}
                          </p>
                        )}
                      </div>
                      {selectedBooking.agreement_url && (
                        <a
                          href={selectedBooking.agreement_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <FaDownload className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Driver Documents and Verification Status */}
                  <div className="space-y-4">
                    {/* Driver Verification Status */}
                    <div className={`p-4 rounded-lg border ${selectedBooking.driver_lifetime_approved ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        {selectedBooking.driver_lifetime_approved ? (
                          <FaShieldAlt className="text-green-600 text-lg" />
                        ) : (
                          <FaExclamationTriangle className="text-yellow-600 text-lg" />
                        )}
                        <h4 className={`font-semibold ${selectedBooking.driver_lifetime_approved ? 'text-green-800' : 'text-yellow-800'}`}>
                          {selectedBooking.driver_lifetime_approved ? 'Verified Driver - Lifetime Approved' : 'New Driver - Admin Reviewed'}
                        </h4>
                      </div>
                      <p className={`text-sm ${selectedBooking.driver_lifetime_approved ? 'text-green-700' : 'text-yellow-700'}`}>
                        {selectedBooking.driver_lifetime_approved 
                          ? 'This driver has been permanently verified. Their documents have been pre-approved by our admin team.'
                          : 'This driver\'s documents have been reviewed and approved by our admin team for this booking.'
                        }
                      </p>
                    </div>

                    {/* Driver Documents */}
                    {selectedBooking.documents_uploaded && selectedBooking.documents_uploaded.length > 0 && (
                      <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FaFileAlt className="text-blue-600" />
                          <p className="font-medium text-gray-900">Driver Documents</p>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Shared for this booking only
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedBooking.documents_uploaded.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <span className="text-sm font-medium text-gray-700">{doc.name || `Document ${index + 1}`}</span>
                                <p className="text-xs text-gray-500 mt-1">Status: Approved</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaCheck className="text-green-500 text-sm" />
                                {doc.url && (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="View Document"
                                  >
                                    <FaEye className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vehicle Documents Shared with Partner */}
                    {selectedBooking.vehicle_documents && Object.keys(selectedBooking.vehicle_documents).length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FaCar className="text-purple-600" />
                          <p className="font-medium text-purple-900">Vehicle Documents</p>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Shared with you
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(selectedBooking.vehicle_documents).map(([docType, doc]: [string, any]) => (
                            <div key={docType} className="flex items-center justify-between p-3 bg-white rounded-lg">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  {docType === 'mot' ? 'MOT Certificate' :
                                   docType === 'private_hire_license' ? 'Private Hire License' :
                                   docType === 'insurance' ? 'Insurance Certificate' :
                                   docType === 'logbook' ? 'V5C Logbook' :
                                   docType === 'roadTax' ? 'Road Tax Certificate' :
                                   docType}
                                </span>
                                {doc.expiry_date && (
                                  <p className="text-xs text-gray-500 mt-1">Expires: {new Date(doc.expiry_date).toLocaleDateString()}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Approved</span>
                                {doc.url && (
                                  <a
                                    href={`/api/documents/access?bookingId=${selectedBooking.id}&docType=${docType}&url=${encodeURIComponent(doc.url)}&role=partner&actorId=${user?.id}&partnerId=${user?.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 p-1"
                                    title="View Document (logged)"
                                  >
                                    <FaEye className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-purple-100 rounded-lg">
                          <p className="text-xs text-purple-800">
                            🔒 These vehicle documents are shared with you for this booking only. Access is automatically restricted after booking completion.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit History */}
              {selectedBooking.history && selectedBooking.history.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FaHistory className="mr-3 h-6 w-6 text-gray-600" />
                    Audit History
                  </h3>
                  <div className="space-y-3">
                    {selectedBooking.history.map((entry, index) => (
                      <div key={index} className="flex items-start justify-between p-3 bg-white rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{entry.action}</p>
                          <p className="text-sm text-gray-600">{entry.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            by {entry.performed_by} • {formatDateTime(entry.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                {selectedBooking.status === 'pending_partner_approval' && (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowApprovalModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FaCheckCircle className="mr-2 h-4 w-4" />
                    Approve/Reject
                  </button>
                )}

                {(selectedBooking.status === 'active' || selectedBooking.status === 'partner_accepted' || selectedBooking.status === 'pending_insurance_upload' || selectedBooking.status === 'confirmed') && (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowVehicleModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <FaExchangeAlt className="mr-2 h-4 w-4" />
                    Change Vehicle
                  </button>
                )}

                {/* Handle Return - More Robust Logic */}
                {(selectedBooking.return_requested || selectedBooking.return_requested_at) && !selectedBooking.return_approved && (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowReturnModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 animate-pulse"
                  >
                    <FaUndo className="mr-2 h-4 w-4" />
                    🚨 Handle Return Request
                  </button>
                )}

                {(selectedBooking.status === 'active' || selectedBooking.status === 'partner_accepted' || selectedBooking.status === 'pending_insurance_upload' || selectedBooking.status === 'confirmed') && (
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowCancelModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <FaTimes className="mr-2 h-4 w-4" />
                    Cancel Booking
                  </button>
                )}

                <Link 
                  href="/partner/support"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FaLifeRing className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>

                {/* Start Active Booking Button */}
                {selectedBooking && ['partner_accepted','confirmed','pending_insurance_upload'].includes(selectedBooking.status) && !selectedBooking.activated_at && (
                  <button
                    onClick={async () => {
                      const force = !confirm('Attempt normal activation first? Click Cancel to force activation (bypass requirements).');
                      try {
                        const response = await fetch('/api/bookings/start-active', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            bookingId: selectedBooking.id, 
                            partnerId: user?.role?.toLowerCase()==='partner_staff'?(user as any)?.partnerId:user?.id,
                            triggeredBy: 'partner',
                            bypassRequirements: force
                          }),
                        });
                        const result = await response.json();
                        if (!response.ok) {
                          if (result.requirements && result.requirements.length>0) {
                            alert(`Cannot start booking. Requirements not met:\n\n${result.requirements.join('\n')}`);
                          } else {
                            throw new Error(result.error||'Failed to start booking');
                          }
                          return;
                        }
                        alert(force? 'Booking force-activated successfully!' : 'Booking activated successfully! Vehicle is now ready for collection.');
                        await loadBookings();
                      } catch (e:any) {
                        alert(e.message||'Failed to start booking');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mt-2"
                  >
                    <FaCar className="mr-2 h-4 w-4" />
                    Start Active Booking
                  </button>
                )}

                {/* Finish Booking Button - Only for active status */}
                {selectedBooking.status === 'active' && !selectedBooking.completed_at && (
                  <button
                    onClick={async () => {
                      if (!confirm('Are you sure you want to finish this booking? This will mark the booking as completed and release the vehicle.')) return;
                      try {
                        const response = await fetch('/api/bookings/finish', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bookingId: selectedBooking.id, partnerId: user?.role === 'partner_staff' ? (user as any)?.partnerId : user?.id }),
                        });
                        if (!response.ok) throw new Error('Failed to finish booking');
                        alert('Booking marked as finished.');
                        await loadBookings();
                      } catch (e) {
                        alert('Failed to finish booking.');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mt-2"
                  >
                    <FaCheckCircle className="mr-2 h-4 w-4" />
                    Finish Booking
                  </button>
                )}

                {selectedBooking && selectedBooking.payment_status === 'pending' && selectedBooking.payment_instruction?.method === 'bank_transfer' && selectedBooking.payment_instruction?.status === 'sent' && (
                  <button
                    onClick={async () => {
                      setMarkingReceived(true);
                      setReceivedMessage('');
                      try {
                        const res = await fetch('/api/payments/confirm-received', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ bookingId: selectedBooking.id }),
                        });
                        if (!res.ok) throw new Error('Failed to mark payment as received');
                        setReceivedMessage('Payment marked as received. You can now accept or reject the booking.');
                        await loadBookings();
                      } catch (e: any) {
                        setReceivedMessage(e.message);
                      } finally {
                        setMarkingReceived(false);
                      }
                    }}
                    disabled={markingReceived}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 mt-2 disabled:opacity-50"
                  >
                    {markingReceived ? 'Marking as Received...' : 'Mark Payment Received'}
                  </button>
                )}
                {receivedMessage && <div className="mt-2 text-green-700">{receivedMessage}</div>}

                {selectedBooking && selectedBooking.deposit?.required && selectedBooking.deposit.status==='pending' && (
                  <button
                    onClick={async ()=>{
                      if(!selectedBooking.deposit?.instruction_id) return;
                      setMarkingReceived(true);
                      setReceivedMessage('');
                      try {
                        const res=await fetch('/api/payments/confirm-received',{
                          method:'POST',
                          headers:{'Content-Type':'application/json'},
                          body: JSON.stringify({ instruction_id: selectedBooking.deposit.instruction_id, partnerId: user?.id })
                        });
                        if(!res.ok){const e=await res.json();throw new Error(e.error);} 
                        setReceivedMessage('Deposit marked as received.');
                        await loadBookings();
                      }catch(e:any){ setReceivedMessage(e.message);}finally{ setMarkingReceived(false);} 
                    }}
                    disabled={markingReceived}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 mt-2 disabled:opacity-50"
                  >
                    {markingReceived?'Marking…':'Mark Deposit Received'}
                  </button>
                )}
              </div>
              {/* Payments Breakdown Section - Redesigned */}
              <div className="bg-yellow-50 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaMoneyBillWave className="mr-3 h-6 w-6 text-yellow-600" />
                  Payment Breakdown
                </h3>
                {/* Weekly Payments Section */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <b className="text-black mr-2">Weeks Paid</b>
                    <span data-tooltip-id="weeks-paid-tip" className="ml-1 cursor-pointer text-blue-600"><FaInfoCircle /></span>
                    <span className="ml-2 text-black font-bold">
                      {bookingPayments.filter(p => (p.type === 'weekly_rent' || p.type === 'weekly') && (p.status === 'completed' || p.status === 'paid' || p.status === 'succeeded')).length}
                      /
                      {selectedBooking.weeks || selectedBooking.total_weeks || selectedBooking.booking_details?.total_weeks || 'N/A'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border mb-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-black">Week #</th>
                          <th className="px-4 py-2 text-left text-black">Amount</th>
                          <th className="px-4 py-2 text-left text-black">Status</th>
                          <th className="px-4 py-2 text-left text-black">Date</th>
                          <th className="px-4 py-2 text-left text-black">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingPayments.filter(p => p.type === 'weekly_rent' || p.type === 'weekly').map((pay, idx) => (
                          <tr key={pay.id}>
                            <td className="px-4 py-2 text-black">{idx + 1}</td>
                            <td className="px-4 py-2 text-black">£{pay.amount}</td>
                            <td className="px-4 py-2 text-black">{pay.status}</td>
                            <td className="px-4 py-2 text-black">{pay.created_at?.toDate ? pay.created_at.toDate().toLocaleDateString() : ''}</td>
                            <td className="px-4 py-2 text-black">{pay.method || pay.payment_method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-xs text-gray-700 mb-2">Total Weekly Paid: <span className="font-bold text-black">£{bookingPayments.filter(p => (p.type === 'weekly_rent' || p.type === 'weekly') && (p.status === 'completed' || p.status === 'paid' || p.status === 'succeeded')).reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</span></div>
                  </div>
                </div>
                {/* Adjustments/Refunds Section */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <b className="text-black mr-2">Adjustments / Refunds</b>
                    <span data-tooltip-id="adjustments-tip" className="ml-1 cursor-pointer text-blue-600"><FaInfoCircle /></span>
                    <span className="ml-2 text-black font-bold">
                      {bookingInstructions.filter(inst => ['topup', 'refund'].includes(inst.type)).length}
                      /
                      {selectedBooking.weeks || selectedBooking.total_weeks || selectedBooking.booking_details?.total_weeks || 'N/A'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border mb-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-black">Type</th>
                          <th className="px-4 py-2 text-left text-black">Amount</th>
                          <th className="px-4 py-2 text-left text-black">Status</th>
                          <th className="px-4 py-2 text-left text-black">Date</th>
                          <th className="px-4 py-2 text-left text-black">Method</th>
                          <th className="px-4 py-2 text-left text-black">Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingInstructions.filter(inst => ['topup', 'refund'].includes(inst.type)).map(inst => (
                          <tr key={inst.id}>
                            <td className="px-4 py-2 text-black">{inst.type}</td>
                            <td className="px-4 py-2 text-black">£{inst.amount}</td>
                            <td className="px-4 py-2 text-black">{inst.status}</td>
                            <td className="px-4 py-2 text-black">{inst.created_at?.toDate ? inst.created_at.toDate().toLocaleDateString() : ''}</td>
                            <td className="px-4 py-2 text-black">{inst.method}</td>
                            <td className="px-4 py-2 text-black">
                              {inst.reason || 'No additional info'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Deposit Section */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <b className="text-black mr-2">Deposit</b>
                    <span data-tooltip-id="deposit-tip" className="ml-1 cursor-pointer text-blue-600"><FaInfoCircle /></span>
                    <span className="ml-2 text-black font-bold">
                      {bookingPayments.filter(p => p.type === 'deposit').length}
                      /
                      {selectedBooking.weeks || selectedBooking.total_weeks || selectedBooking.booking_details?.total_weeks || 'N/A'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border mb-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-black">Type</th>
                          <th className="px-4 py-2 text-left text-black">Amount</th>
                          <th className="px-4 py-2 text-left text-black">Status</th>
                          <th className="px-4 py-2 text-left text-black">Date</th>
                          <th className="px-4 py-2 text-left text-black">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingPayments.filter(p => p.type === 'deposit').map((pay, idx) => (
                          <tr key={pay.id}>
                            <td className="px-4 py-2 text-black">Deposit</td>
                            <td className="px-4 py-2 text-black">£{pay.amount}</td>
                            <td className="px-4 py-2 text-black">{pay.status}</td>
                            <td className="px-4 py-2 text-black">{pay.created_at?.toDate ? pay.created_at.toDate().toLocaleDateString() : ''}</td>
                            <td className="px-4 py-2 text-black">{pay.method || pay.payment_method}</td>
                          </tr>
                        ))}
                        {bookingInstructions.filter(inst => inst.type === 'deposit').map(inst => (
                          <tr key={inst.id}>
                            <td className="px-4 py-2 text-black">Deposit Instruction</td>
                            <td className="px-4 py-2 text-black">£{inst.amount}</td>
                            <td className="px-4 py-2 text-black">{inst.status}</td>
                            <td className="px-4 py-2 text-black">{inst.created_at?.toDate ? inst.created_at.toDate().toLocaleDateString() : ''}</td>
                            <td className="px-4 py-2 text-black">{inst.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Scheduled/Future Instructions Section */}
                <div className="mb-2">
                  <div className="flex items-center mb-2">
                    <b className="text-black mr-2">Scheduled / Future Payment Instructions</b>
                    <span data-tooltip-id="future-tip" className="ml-1 cursor-pointer text-blue-600"><FaInfoCircle /></span>
                    <span className="ml-2 text-black font-bold">
                      {bookingInstructions.filter(inst => !['topup', 'refund', 'deposit'].includes(inst.type)).length}
                      /
                      {selectedBooking.weeks || selectedBooking.total_weeks || selectedBooking.booking_details?.total_weeks || 'N/A'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border mb-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left text-black">Type</th>
                          <th className="px-4 py-2 text-left text-black">Amount</th>
                          <th className="px-4 py-2 text-left text-black">Status</th>
                          <th className="px-4 py-2 text-left text-black">Date</th>
                          <th className="px-4 py-2 text-left text-black">Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingInstructions.filter(inst => !['topup', 'refund', 'deposit'].includes(inst.type)).map(inst => (
                          <tr key={inst.id}>
                            <td className="px-4 py-2 text-black">{inst.type || inst.frequency}</td>
                            <td className="px-4 py-2 text-black">£{inst.amount}</td>
                            <td className="px-4 py-2 text-black">{inst.status}</td>
                            <td className="px-4 py-2 text-black">{inst.created_at?.toDate ? inst.created_at.toDate().toLocaleDateString() : ''}</td>
                            <td className="px-4 py-2 text-black">{inst.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Booking Response</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    value={approvalData.action}
                    onChange={(e) => setApprovalData({ ...approvalData, action: e.target.value })}
                  >
                    <option value="">Select action</option>
                    <option value="accept">Approve Booking</option>
                    <option value="reject">Reject Booking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {approvalData.action === 'reject' ? 'Reason for rejection *' : 'Additional notes (optional)'}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    rows={3}
                    value={approvalData.reason}
                    onChange={(e) => setApprovalData({ ...approvalData, reason: e.target.value })}
                    placeholder={
                      approvalData.action === 'reject' 
                        ? 'Please provide a reason for rejection' 
                        : 'Any additional notes...'
                    }
                  />
                </div>
                {approvalData.action==='accept' && (
                  <label className="flex items-center gap-2 mt-3 text-sm text-gray-900">
                    <input type="checkbox" checked={approvalData.overrideInsurance} onChange={e=>setApprovalData({...approvalData,overrideInsurance:e.target.checked})} className="rounded" />
                    Insurance certificate verified in person / not required
                  </label>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeAllModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproval}
                  disabled={!approvalData.action || submittingApproval || (approvalData.action === 'reject' && !approvalData.reason.trim())}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingApproval ? 'Processing...' : 'Submit Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Handle Return Request</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Return Request Details */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="h-5 w-5 text-orange-400 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-orange-800">Return Request Details</h3>
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Driver:</p>
                          <p className="text-gray-900">{selectedBooking.driver_name || selectedBooking.driver?.full_name || 'Unknown Driver'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Vehicle:</p>
                          <p className="text-gray-900">{selectedBooking.car_name || `${selectedBooking.car?.make} ${selectedBooking.car?.model}` || 'Unknown Vehicle'}</p>
                          <p className="text-xs text-gray-500 font-mono">{selectedBooking.car_plate || selectedBooking.car?.registration_number || selectedBooking.car?.license_plate || 'No Registration'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Reason for Return:</p>
                          <p className="text-gray-900 bg-white p-2 rounded border mt-1">
                            {selectedBooking.return_request?.reason || selectedBooking.return_reason || 'No reason provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            Requested: {formatDateTime(selectedBooking.return_requested_at || selectedBooking.return_request?.requested_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    value={returnData.action}
                    onChange={(e) => setReturnData({ ...returnData, action: e.target.value })}
                  >
                    <option value="">Select action</option>
                    <option value="approve">Approve Return</option>
                    <option value="reject">Reject Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {returnData.action === 'reject' ? 'Reason for rejection *' : 'Additional notes (optional)'}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    rows={3}
                    value={returnData.reason}
                    onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
                    placeholder={
                      returnData.action === 'reject' 
                        ? 'Please provide a reason for rejection' 
                        : 'Any additional notes...'
                    }
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeAllModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnRequest}
                  disabled={!returnData.action || submittingReturn || (returnData.action === 'reject' && !returnData.reason.trim())}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingReturn ? 'Processing...' : 'Submit Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Assignment Modal */}
      {showVehicleModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assign Vehicle</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Select Vehicle</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    value={vehicleData.vehicleId}
                    onChange={(e) => setVehicleData({ ...vehicleData, vehicleId: e.target.value })}
                  >
                    <option value="">Choose a vehicle</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.registration_number || vehicle.registration_plate || vehicle.license_plate || 'No Reg'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Cost Adjustment Type</label>
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="adjustmentType"
                        value="prorated"
                        checked={vehicleData.adjustmentType === 'prorated'}
                        onChange={(e) => setVehicleData({ ...vehicleData, adjustmentType: e.target.value as any })}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm text-black">
                        <strong>Prorated</strong> - Adjust cost for remaining rental period
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="adjustmentType"
                        value="immediate"
                        checked={vehicleData.adjustmentType === 'immediate'}
                        onChange={(e) => setVehicleData({ ...vehicleData, adjustmentType: e.target.value as any })}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm text-black">
                        <strong>Immediate</strong> - Apply full weekly rate difference now
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="adjustmentType"
                        value="next_cycle"
                        checked={vehicleData.adjustmentType === 'next_cycle'}
                        onChange={(e) => setVehicleData({ ...vehicleData, adjustmentType: e.target.value as any })}
                        className="mr-2 text-blue-600"
                      />
                      <span className="text-sm text-black">
                        <strong>Next Cycle</strong> - Apply new rate from next billing cycle
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Reason for change</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    rows={3}
                    value={vehicleData.reason}
                    onChange={(e) => setVehicleData({ ...vehicleData, reason: e.target.value })}
                    placeholder="Reason for vehicle change (optional)..."
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeAllModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVehicleAssignment}
                  disabled={!vehicleData.vehicleId || !vehicleData.reason.trim() || submittingVehicle}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingVehicle ? 'Assigning...' : 'Assign Vehicle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && selectedBooking && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAllModals();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <FaExclamationTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Booking Cancellation</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Cancelling this booking will process appropriate refunds based on usage. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Refund Type Selection */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Refund Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="refundType"
                      value="prorated"
                      checked={cancelRefundType === 'prorated'}
                      onChange={(e) => setCancelRefundType(e.target.value as 'full' | 'prorated' | 'none')}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-black">
                      <strong>Prorated Refund</strong> - Refund based on usage
                      {selectedBooking.status === 'active' && (
                        <span className="text-black block text-xs">
                          Driver will be refunded for unused days only
                        </span>
                      )}
                      {selectedBooking.status !== 'active' && (
                        <span className="text-black block text-xs">
                          Full refund minus 5% processing fee (max £50)
                        </span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="refundType"
                      value="full"
                      checked={cancelRefundType === 'full'}
                      onChange={(e) => setCancelRefundType(e.target.value as 'full' | 'prorated' | 'none')}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-black">
                      <strong>Full Refund</strong> - Complete refund regardless of usage
                      <span className="text-black block text-xs">
                        Driver receives full payment back
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="refundType"
                      value="none"
                      checked={cancelRefundType === 'none'}
                      onChange={(e) => setCancelRefundType(e.target.value as 'full' | 'prorated' | 'none')}
                      className="mr-2 text-blue-600"
                    />
                    <span className="text-sm text-black">
                      <strong>No Refund</strong> - Driver keeps the vehicle but pays full amount
                      <span className="text-black block text-xs">
                        Use for policy violations or damage
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Reason for cancellation *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a detailed reason for cancellation..."
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeAllModals}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={!cancelReason.trim() || submittingCancel}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LiveChatWidget */}
      {/* <LiveChatWidget /> */}
    </div>
  );
} 