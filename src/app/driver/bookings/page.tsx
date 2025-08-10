'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FaCalendarAlt, FaSearch, FaFilter, FaEye, FaClock, 
  FaMoneyBillWave, FaCar, FaMapMarkerAlt, FaFileAlt,
  FaCheckCircle, FaTimes, FaExclamationTriangle, FaStar,
  FaDownload, FaPhone, FaEnvelope, FaComments, FaLifeRing,
  FaPlus, FaUpload, FaSignature, FaUndo, FaHistory, FaBolt,
  FaTools, FaShieldAlt, FaUserCircle, FaChevronRight, FaBuilding,
  FaCreditCard
} from 'react-icons/fa';
import { supabase } from '../../../lib/supabase/client';

interface Booking {
  id: string;
  status: string;
  car_id: string;
  driver_id: string;
  partner_id: string;
  weeks: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  payment_status?: string;
  car_name?: string;
  car_image?: string;
  car_plate?: string;
  partner_name?: string;
  return_requested?: boolean;
  return_approved?: boolean;
  agreement_signed?: boolean;
  agreement_url?: string;
  insurance_required?: boolean;
  driver_insurance_valid?: boolean;
  issues?: any[];
  payment_instructions?: any[];
  documents?: any;
  documents_uploaded?: any[];
  partner?: any;
  car?: any;
  car_info?: any;
  partner_phone?: string;
  partner_email?: string;
  return_request?: any;
  weekly_rate?: number;
  total_weeks?: number;
}



interface Issue {
  id: string;
  type: string;
  description: string;
  severity: string;
  status: string;
  reportedBy: string;
  reportedByType: string;
  reportedByName: string;
  reportedAt: any;
  images: string[];
  resolvedAt: any;
  resolvedBy: string;
  resolutionNotes: string;
}

interface BookingStats {
  total: number;
  active: number;
  completed: number;
  pending: number;
  totalSpent: number;
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

const RETURN_COLORS: Record<string,string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

// Utility to build a clean vehicle label without "undefined" artifacts
const getCarLabel = (b: Booking | undefined | null): string => {
  if (!b) return 'Unknown Vehicle';
  if (b.car_name) return b.car_name;
  const make = (b.car_info?.make ?? b.car?.make ?? '').trim();
  const model = (b.car_info?.model ?? b.car?.model ?? '').trim();
  const label = `${make} ${model}`.trim();
  return label || 'Unknown Vehicle';
};

// ---------- Added utility helpers ----------
// Safely convert the various possible Supabase / Firestore / JS date formats we may
// receive into a proper JavaScript Date instance.
const parseDate = (date: any): Date => {
  if (!date) return new Date(NaN);
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  if (typeof date === 'object') {
    if (typeof (date as any).toDate === 'function') return (date as any).toDate(); // Firestore Timestamp
    if ('seconds' in date) return new Date((date as any).seconds * 1000);           // Supabase "timestamp with time zone"
  }
  return new Date(date);
};

// Format a date to local string or return "N/A" if invalid/empty
const formatDate = (date: any): string => {
  const d = parseDate(date);
  return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
};

// Map payment status -> color classes with graceful fallback
const getPaymentStatusColor = (status: string): string =>
  PAYMENT_STATUS_COLORS[status as keyof typeof PAYMENT_STATUS_COLORS] ??
  'bg-gray-100 text-gray-800';
// ---------- End utility helpers ----------

export default function DriverBookingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Main State
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  
  // Lock background scroll when booking details modal is open
  useEffect(() => {
    if (showDetails) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showDetails]);

  // Issue Form State
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSeverity, setIssueSeverity] = useState('medium');
  const [submittingIssue, setSubmittingIssue] = useState(false);
  
  // Return Form State
  const [returnReason, setReturnReason] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Utility Functions
  const formatStatus = (status: string) => 
    status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getStatusColor = (status: string) => 
    STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  const getSeverityColor = (severity: string) => 
    SEVERITY_COLORS[severity] || 'bg-gray-100 text-gray-800';

  const getReturnStatus = (b: Booking): {label:string;color:string} => {
    const status = b.return_request?.status || (b.return_requested ? (b.return_approved ? 'approved' : 'pending') : (b.return_approved ? 'approved' : 'none'));
    if(status==='none') return {label:'No return', color:'bg-gray-100 text-gray-800'};
    return {label: status.charAt(0).toUpperCase()+status.slice(1), color: RETURN_COLORS[status] || 'bg-gray-100 text-gray-800'};
  };

  // Get payment info for a booking
  const getBookingPaymentInfo = (bookingId: string) => {
    const bookingPayments = payments.filter(p => p.bookingId === bookingId);
    const bookingSubscription = subscriptions.find(s => s.bookingId === bookingId);
    
    const totalPaid = bookingPayments
      .filter(p => p.status === 'succeeded' || p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const lastPayment = bookingPayments.length > 0 
      ? bookingPayments.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)[0]
      : null;

    // Calculate the next payment date (if any)
    const nextPaymentDate = bookingSubscription?.current_period_end
      ? new Date(bookingSubscription.current_period_end * 1000)
      : null;

    let daysUntilNextPayment: number | null = null;
    let nextPaymentMessage: string | null = null;
    if (nextPaymentDate) {
      const MS_IN_DAY = 1000 * 60 * 60 * 24;
      daysUntilNextPayment = Math.ceil((nextPaymentDate.getTime() - Date.now()) / MS_IN_DAY);

      if (daysUntilNextPayment < 0) {
        nextPaymentMessage = 'overdue';
      } else if (daysUntilNextPayment === 0) {
        nextPaymentMessage = 'today';
      } else if (daysUntilNextPayment === 1) {
        nextPaymentMessage = 'tomorrow';
      } else if (daysUntilNextPayment < 7) {
        nextPaymentMessage = `in ${daysUntilNextPayment} days`;
      } else if (daysUntilNextPayment < 14) {
        nextPaymentMessage = 'next week';
      } else {
        nextPaymentMessage = nextPaymentDate.toLocaleDateString();
      }
    }
    
    return {
      payments: bookingPayments,
      subscription: bookingSubscription,
      totalPaid,
      lastPayment,
      weeklyAmount: bookingSubscription?.amount || 0,
      isRecurring: !!bookingSubscription && bookingSubscription.status === 'active',
      nextPaymentDate,
      daysUntilNextPayment,
      nextPaymentMessage,
    };
  };

  const calculateStats = (): BookingStats => {
    // Compute total spent from payments, accounting for refunds
    const positive = payments.filter(p => ['succeeded', 'paid', 'completed'].includes(p.status)).reduce((s,p)=> s + (p.amount || 0),0);
    const refunds = payments.filter(p => p.status === 'refunded').reduce((s,p)=> s + (p.amount || 0),0);
    const totalSpent = positive - refunds;

    const stats = {
      total: bookings.length,
      active: bookings.filter(b => ['active', 'partner_accepted', 'confirmed'].includes(b.status)).length,
      completed: bookings.filter(b => b.status === 'completed').length,
      pending: bookings.filter(b => String(b.status).includes('pending')).length,
      totalSpent
    } as BookingStats;
    return stats;
  };

  // Authentication and Authorization
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'DRIVER') {
        router.replace('/');
      } else {
        setLoading(false);
        loadBookings();
      }
    }
  }, [user, authLoading, router]);

  // Data Loading
  const loadBookings = async () => {
    if (!user) return;

    try {
      // Load bookings with partner and car details
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          partner:partners(*),
          car:vehicles(*)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return;
      }

      const bookingList = bookingsData.map(booking => {
        // Handle return request status mapping
        const newFormatRequested = !!booking.return_request?.status && 
          booking.return_request.status !== 'approved' && 
          booking.return_request.status !== 'rejected';
        const newFormatApproved = booking.return_request?.status === 'approved';
        
        return {
          ...booking,
          return_requested: booking.return_requested || newFormatRequested,
          return_approved: booking.return_approved || newFormatApproved,
          car_name: booking.car?.make && booking.car?.model ? `${booking.car.make} ${booking.car.model}` : 'Unknown Car',
          car_image: booking.car?.image_url || '',
          car_plate: booking.car?.registration_number || '',
          partner_name: booking.partner?.company_name || booking.partner?.full_name || 'Verified Partner',
          partner_phone: booking.partner?.phone || '',
          partner_email: booking.partner?.email || '',
          start_date: booking.start_date,
          end_date: booking.end_date,
          payment_status: booking.payment_status,
          weekly_rate: booking.car?.price_per_week || 0,
          total_weeks: booking.weeks || 0,
          car_id: booking.car_id,
          car_info: booking.car
        } as Booking;
      });

      console.log('Loaded bookings:', bookingList.length);
      setBookings(bookingList);
      setFilteredBookings(bookingList);

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (!paymentsError && paymentsData) {
        console.log('Loaded payments:', paymentsData.length);
        setPayments(paymentsData);
      }

      // Load payment instructions
      const { data: instructionsData, error: instructionsError } = await supabase
        .from('payment_instructions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (!instructionsError && instructionsData) {
        console.log('Loaded payment instructions:', instructionsData.length);
        // Convert instructions to payments format for compatibility
        const instructionsAsPayments = instructionsData.map(instruction => ({
          id: instruction.id,
          bookingId: instruction.booking_id,
          driverId: instruction.driver_id,
          amount: instruction.amount,
          status: instruction.status,
          type: instruction.type,
          createdAt: instruction.created_at,
          updatedAt: instruction.updated_at,
        }));
        setPayments(prev => [...prev, ...instructionsAsPayments]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data. Please refresh the page.');
    }
  };

  // Filtering Logic
  useEffect(() => {
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.car_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.car?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.partner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.partner?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter) {
      filtered = filtered.filter(booking => 
        (booking.payment_status || 'pending') === paymentFilter
      );
    }

    // Date range filter
    if (dateRange.start && dateRange.end) {
      const startDate = parseDate(dateRange.start);
      const endDate = parseDate(dateRange.end);
      filtered = filtered.filter(booking => {
        const bookingDate = parseDate(booking.start_date);
        return bookingDate >= startDate && bookingDate <= endDate;
      });
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, paymentFilter, dateRange]);

  // Auto-open booking details if bookingId query param present
  useEffect(() => {
    const urlBookingId = searchParams?.get('bookingId');
    if (!urlBookingId) return;
    const found = bookings.find(b => b.id === urlBookingId);
    if (found) {
      setSelectedBooking(found);
      setShowDetails(true);
    }
  }, [searchParams, bookings]);

  // Action Handlers
  const handleViewDetails = (booking: Booking) => {
    console.log('Opening booking details:', booking.id);
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const closeAllModals = () => {
    console.log('Closing all modals');
    setShowDetails(false);
    setShowIssueForm(false);
    setShowReturnForm(false);
    setSelectedBooking(null);
    
    // Reset form states
    setIssueType('');
    setIssueDescription('');
    setIssueSeverity('medium');
    setReturnReason('');
    
    // remove bookingId param
    const params = new URLSearchParams(window.location.search);
    params.delete('bookingId');
    const newUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
    router.replace(newUrl);
  };

  const handleReportIssue = async () => {
    console.log('handleReportIssue called', { 
      selectedBooking: selectedBooking?.id, 
      issueType, 
      issueDescription 
    });

    if (!selectedBooking || !issueType || !issueDescription.trim() || !user) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmittingIssue(true);
    try {
      const response = await fetch('/api/bookings/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          issueType,
          description: issueDescription,
          severity: issueSeverity,
          reportedBy: user.id,
          reportedByType: 'driver'
        })
      });

      if (response.ok) {
        const result = await response.json();
        closeAllModals();
        alert(`Issue reported successfully! Issue ID: ${result.issueId}. Both the partner and admin have been notified.`);
      } else {
        const error = await response.json();
        alert(`Failed to report issue: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to report issue. Please try again.');
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleRequestReturn = async () => {
    console.log('🔄 handleRequestReturn called', { 
      selectedBooking: selectedBooking?.id, 
      returnReason,
      user: user?.id,
      bookingStatus: selectedBooking?.status
    });

    if (!selectedBooking || !returnReason.trim() || !user) {
      alert('Please provide a reason for the return request');
      console.log('❌ Missing required data:', {
        selectedBooking: !!selectedBooking,
        returnReason: returnReason.trim(),
        user: !!user
      });
      return;
    }

    // Check if booking is in valid state for return request
    const validStatuses = ['partner_accepted', 'active', 'in_progress'];
    if (!validStatuses.includes(selectedBooking.status)) {
      alert(`Cannot request return for booking with status: ${selectedBooking.status}. Only active bookings can be returned.`);
      console.log('❌ Invalid booking status for return:', selectedBooking.status);
      return;
    }

    // Check if return already requested
    if (selectedBooking.return_requested) {
      alert('Return has already been requested for this booking.');
      console.log('❌ Return already requested');
      return;
    }

    setSubmittingReturn(true);
    try {
      console.log('📤 Sending return request to API...');
      
      const requestData = {
        bookingId: selectedBooking.id,
        reason: returnReason.trim(),
        requestedBy: user.id,
        requestedByType: 'driver',
        action: 'request'
      };

      console.log('📋 Request data:', requestData);

      const response = await fetch('/api/bookings/request-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Return request successful:', result);
        
        closeAllModals();
        alert('Return request submitted successfully! The partner has been notified and will review your request within 24 hours.');
        
        // Reload bookings to show updated status
        await loadBookings();
      } else {
        const error = await response.json();
        console.error('❌ API Error:', error);
        
        if (error.error?.includes('not found')) {
          alert('Booking not found. Please refresh the page and try again.');
        } else if (error.error?.includes('Cannot request return')) {
          alert(error.error);
        } else if (error.error?.includes('already requested')) {
          alert('Return has already been requested for this booking.');
        } else {
          alert(`Failed to submit return request: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Network error requesting return:', error);
      alert('Failed to submit return request due to network error. Please check your connection and try again.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleOpenSupport = (booking: Booking) => {
    const event = new CustomEvent('openSupportChat', {
      detail: { bookingId: booking.id, vehicleId: booking.car_id }
    });
    window.dispatchEvent(event);
  };

  // Loading State
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all your car rental bookings
          </p>
        </div>
        <Link
          href="/compare"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <FaPlus />
          Book New Car
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaCalendarAlt className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FaCar className="text-green-600 text-2xl" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FaCheckCircle className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <FaClock className="text-orange-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-black" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-black text-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="pending_partner_approval">Pending Partner Approval</option>
              <option value="partner_accepted">Partner Accepted</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="">All Payment Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>
        </div>

        {/* Filter Summary */}
        {(searchTerm || statusFilter || paymentFilter || dateRange.start || dateRange.end) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredBookings.length} of {bookings.length} bookings
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setPaymentFilter('');
                  setDateRange({ start: '', end: '' });
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FaCar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {bookings.length === 0 
                ? "You haven't made any bookings yet." 
                : "No bookings match your current filters."
              }
            </p>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              <FaPlus />
              Book Your First Car
            </Link>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Car Image & Info */}
                  <div className="lg:col-span-1">
                    <img 
                      src={booking.car_image || booking.car?.image || '/car-placeholder.jpg'} 
                      alt={getCarLabel(booking)}
                      className="w-full h-48 lg:h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Booking Details */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-black">{getCarLabel(booking)}</h3>
                        <p className="text-gray-600">
                          {booking.car_info?.registration_plate || booking.car_plate || booking.car?.registration_number || 'No registration'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {formatStatus(booking.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getPaymentStatusColor(booking.payment_status || 'pending')
                        }`}>
                          {(booking.payment_status || 'pending').charAt(0).toUpperCase() + (booking.payment_status || 'pending').slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Add Set Up Payment button if payment is not set up */}
                    {(!booking.payment_status || booking.payment_status === 'pending') && (
                      <div className="mb-4">
                        <button
                          onClick={() => router.push(`/driver/bookings/${booking.id}/payment-summary`)}
                          className="w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                        >
                          {booking.payment_status === 'pending' ? 'Set Up Payment' : 'Pay Now'}
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-black">Partner</p>
                        <p className="font-medium text-black">{
                          booking.partner?.company_name ||
                          booking.partner_name ||
                          booking.partner?.full_name ||
                          booking.partner?.email ||
                          'Unknown'
                        }</p>
                      </div>
                      <div>
                        <p className="text-black">Duration</p>
                        <p className="font-medium text-black">{booking.weeks || booking.total_weeks || 0} weeks</p>
                      </div>
                      <div>
                        <p className="text-black">Start Date</p>
                        <p className="font-medium text-black">
                          {formatDate(booking.start_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-black">End Date</p>
                        <p className="font-medium text-black">
                          {formatDate(booking.end_date)}
                        </p>
                      </div>
                    </div>

                    {/* Issues & Return Status */}
                    <div className="mt-4 flex gap-4">
                      {booking.issues && booking.issues.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-red-600">
                          <FaExclamationTriangle />
                          <span>{booking.issues.length} issue(s)</span>
                        </div>
                      )}
                      {booking.return_requested && (
                        <div className="flex items-center gap-1 text-sm text-orange-600">
                          <FaUndo />
                          <span>Return requested</span>
                        </div>
                      )}
                      {booking.agreement_signed && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <FaCheckCircle />
                          <span>Agreement signed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment & Actions */}
                  <div className="lg:col-span-1 flex flex-col justify-between">
                    {(() => {
                      const paymentInfo = getBookingPaymentInfo(booking.id);
                      return (
                        <div className="text-right mb-4">
                          <p className="text-gray-600 text-sm">Payment Status</p>
                          {paymentInfo.isRecurring ? (
                            <div>
                              <p className="text-lg font-bold text-green-600">
                                £{paymentInfo.weeklyAmount} / week
                              </p>
                              <p className="text-sm text-green-600">Auto-billing active</p>
                              {paymentInfo.nextPaymentMessage && (
                                <p className="text-xs text-black font-medium mt-1">Payment due {paymentInfo.nextPaymentMessage}</p>
                              )}
                              <p className="text-xs text-gray-500">Paid: £{paymentInfo.totalPaid}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-2xl font-bold text-gray-600">
                                £{paymentInfo.totalPaid || 0}
                              </p>
                              <p className="text-xs text-gray-500">
                                {paymentInfo.payments.length > 0 ? 'One-time payment' : 'No payments'}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-500">ID: {booking.id.slice(-8)}</p>
                        </div>
                      );
                    })()}

                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <FaEye />
                        View Details
                      </button>
                      
                      <button
                        onClick={() => handleOpenSupport(booking)}
                        className="w-full bg-orange-100 text-orange-700 py-2 px-4 rounded-lg font-medium hover:bg-orange-200 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <FaLifeRing />
                        Get Help
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-white/90 to-purple-50/80 backdrop-blur-xl p-4">
          {/* Overlay */}
          <div className="fixed inset-0" onClick={closeAllModals} aria-hidden="true"></div>
          {/* Modal Card */}
          <div className="relative w-full max-w-6xl mx-auto rounded-3xl shadow-2xl border border-gray-200 bg-white/80 backdrop-blur-lg overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={selectedBooking.car_image || selectedBooking.car?.image || '/car-placeholder.jpg'}
                  alt={getCarLabel(selectedBooking)}
                  className="w-16 h-16 object-cover rounded-2xl border border-gray-200 shadow-sm"
                />
                <div>
                  <h2 className="text-2xl font-extrabold text-black leading-tight">{getCarLabel(selectedBooking)}</h2>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusColor(selectedBooking.status)}`}>{formatStatus(selectedBooking.status)}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getPaymentStatusColor(selectedBooking.payment_status || 'pending')}`}>{(selectedBooking.payment_status || 'pending').charAt(0).toUpperCase() + (selectedBooking.payment_status || 'pending').slice(1)}</span>
                  </div>
                </div>
              </div>
              <button onClick={closeAllModals} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition"><FaTimes className="text-2xl" /></button>
            </div>
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col lg:flex-row gap-8 p-8 lg:p-10">
                {/* Left: Hero Image & Timeline */}
                <div className="lg:w-1/2 flex flex-col gap-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-gradient-to-br from-blue-100/60 to-purple-100/60">
                    <img
                      src={selectedBooking.car_image || selectedBooking.car?.image || '/car-placeholder.jpg'}
                      alt={getCarLabel(selectedBooking)}
                      className="w-full h-64 lg:h-80 object-cover"
                    />
                  </div>
                  {/* Timeline */}
                  <div className="mt-4">
                    <h4 className="font-bold text-lg text-black mb-3 flex items-center gap-2"><FaHistory className="text-blue-500" /> Timeline</h4>
                    <ol className="relative border-l-2 border-blue-200 ml-2">
                      <li className="mb-6 ml-6">
                        <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full ring-4 ring-white"><FaCalendarAlt className="text-white text-base" /></span>
                        <div className="text-sm text-black"><span className="font-semibold">Start:</span> {formatDate(selectedBooking.start_date)}</div>
                      </li>
                      <li className="mb-6 ml-6">
                        <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full ring-4 ring-white"><FaCalendarAlt className="text-white text-base" /></span>
                        <div className="text-sm text-black"><span className="font-semibold">End:</span> {formatDate(selectedBooking.end_date)}</div>
                      </li>
                      <li className="ml-6">
                        <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-green-500 rounded-full ring-4 ring-white"><FaCheckCircle className="text-white text-base" /></span>
                        <div className="text-sm text-black"><span className="font-semibold">Status:</span> {formatStatus(selectedBooking.status)}</div>
                      </li>
                    </ol>
                  </div>
                </div>
                {/* Right: Details */}
                <div className="lg:w-1/2 flex flex-col gap-6">
                  {/* Vehicle & Partner Info */}
                  <div className="bg-white/80 rounded-2xl shadow border border-gray-100 p-6 flex flex-col gap-4">
                    <div>
                      <h4 className="font-bold text-lg text-black mb-2 flex items-center gap-2"><FaCar className="text-blue-600" /> Vehicle</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="text-black"><span className="font-medium">Reg:</span> {selectedBooking.car_info?.registration_plate || selectedBooking.car_plate || selectedBooking.car?.registration_number || 'N/A'}</div>
                        <div className="text-black"><span className="font-medium">Color:</span> {selectedBooking.car_info?.color || selectedBooking.car?.color || 'N/A'}</div>
                        <div className="text-black"><span className="font-medium">Fuel:</span> {selectedBooking.car_info?.fuel_type || selectedBooking.car?.fuel_type || 'N/A'}</div>
                        <div className="text-black"><span className="font-medium">Transmission:</span> {selectedBooking.car_info?.transmission || selectedBooking.car?.transmission || 'N/A'}</div>
                        <div className="text-black"><span className="font-medium">Seats:</span> {selectedBooking.car_info?.seats || selectedBooking.car?.seats || 'N/A'}</div>
                        <div className="text-black"><span className="font-medium">Weekly Rate:</span> {(() => {
                          const sale = selectedBooking.car?.sale_price_per_week || selectedBooking.car_info?.sale_price_per_week;
                          const regular = selectedBooking.car?.price_per_week || selectedBooking.car_info?.weekly_rate || selectedBooking.weekly_rate || 0;
                          if (sale && sale < regular) {
                            return <span><span className="line-through text-black/50 mr-2">£{regular}</span><span className="font-bold text-red-600">£{sale}</span></span>;
                          }
                          return <>£{regular}</>;
                        })()}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-black mb-2 flex items-center gap-2"><FaBuilding className="text-purple-600" /> Partner</h4>
                      <div className="text-sm">
                        <div className="text-black"><span className="font-medium">Company:</span> {selectedBooking.partner?.company_name || selectedBooking.partner_name || selectedBooking.partner?.full_name || selectedBooking.partner?.email || 'Unknown Partner'}</div>
                        <div className="text-black"><span className="font-medium">Address:</span> {selectedBooking.partner?.business_address || 'N/A'}</div>
                        <div className="text-black"><span className="font-medium">Phone:</span> {selectedBooking.partner_phone || selectedBooking.partner?.phone || 'N/A'}</div>
                        {(selectedBooking.partner_email || selectedBooking.partner?.email) && (
                          <div className="flex items-center gap-2 text-black"><FaEnvelope className="text-blue-600" /><a href={`mailto:${selectedBooking.partner_email || selectedBooking.partner?.email}`} className="text-blue-600 hover:underline">{selectedBooking.partner_email || selectedBooking.partner?.email}</a></div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Payment Info */}
                  <div className="bg-white/80 rounded-2xl shadow border border-gray-100 p-6 flex flex-col gap-4">
                    <h4 className="font-bold text-lg text-black mb-2 flex items-center gap-2"><FaMoneyBillWave className="text-green-600" /> Payment</h4>
                    {(() => {
                      // Only use manual payment instructions
                      const instructions = Array.isArray(selectedBooking.payment_instructions) ? selectedBooking.payment_instructions : [];
                      // Sort by createdAt descending
                      const allEvents = instructions.slice().sort((a, b) => {
                        const aTime = a.created_at?.seconds ? a.created_at.seconds : (a.created_at ? new Date(a.created_at).getTime()/1000 : 0);
                        const bTime = b.created_at?.seconds ? b.created_at.seconds : (b.created_at ? new Date(b.created_at).getTime()/1000 : 0);
                        return bTime - aTime;
                      });
                      // Calculate total paid (sum of all with status 'paid' or 'confirmed')
                      const totalPaid = allEvents.filter(e => e.status === 'paid' || e.status === 'confirmed').reduce((sum, e) => sum + (e.amount || 0), 0);
                      return (
                        <>
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-2xl font-extrabold text-green-700">£{totalPaid}</span>
                            <span className="text-sm text-black/80">paid</span>
                          </div>
                          {allEvents.length > 0 && (
                            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                              {allEvents.map((event, idx) => (
                                <div key={event.id + idx} className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1">
                                  <span className="text-black">
                                    £{event.amount} - {event.label || event.type}
                                    {event.status === 'sent' && ' (Marked Sent)'}
                                    {event.status === 'pending' && ' (Pending)'}
                                    {event.status === 'confirmed' && ' (Confirmed)'}
                                    {event.status === 'refunded' && ' (Refunded)'}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded font-semibold ${event.status === 'paid' || event.status === 'confirmed' ? 'bg-green-100 text-green-800' : event.status === 'sent' ? 'bg-blue-100 text-blue-800' : event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : event.status === 'refunded' ? 'bg-gray-100 text-black' : 'bg-red-100 text-red-800'}`}>{event.status?.toUpperCase()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {/* Documents & Insurance */}
                  <div className="bg-white/80 rounded-2xl shadow border border-gray-100 p-6 flex flex-col gap-4">
                    <h4 className="font-bold text-lg text-black mb-2 flex items-center gap-2"><FaFileAlt className="text-orange-600" /> Documents</h4>
                    {selectedBooking.agreement_url && (
                      <div className="flex items-center gap-4">
                        <a href={selectedBooking.agreement_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"><FaDownload />Download Agreement</a>
                        {selectedBooking.agreement_signed ? (
                          <span className="text-green-600 text-sm flex items-center gap-1"><FaCheckCircle />Signed</span>
                        ) : (
                          <span className="text-orange-600 text-sm">Pending Signature</span>
                        )}
                      </div>
                    )}
                    {/* Show uploaded insurance and other docs */}
                    <div className="flex flex-col gap-2 mt-2">
                      {selectedBooking.documents?.insurance && (
                        <div className="flex items-center gap-2 text-black">
                          <FaFileAlt className="text-blue-500" />
                          <a href={selectedBooking.documents.insurance} target="_blank" rel="noopener noreferrer" className="underline">Insurance Certificate</a>
                        </div>
                      )}
                      {selectedBooking.documents?.driving_license && (
                        <div className="flex items-center gap-2 text-black">
                          <FaFileAlt className="text-blue-500" />
                          <a href={selectedBooking.documents.driving_license} target="_blank" rel="noopener noreferrer" className="underline">Driving License</a>
                        </div>
                      )}
                      {selectedBooking.documents?.contract && (
                        <div className="flex items-center gap-2 text-black">
                          <FaFileAlt className="text-blue-500" />
                          <a href={selectedBooking.documents.contract} target="_blank" rel="noopener noreferrer" className="underline">Rental Contract</a>
                        </div>
                      )}
                      {/* If using documents_uploaded array */}
                      {Array.isArray(selectedBooking.documents_uploaded) && selectedBooking.documents_uploaded.length > 0 && selectedBooking.documents_uploaded.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2 text-black">
                          <FaFileAlt className="text-blue-500" />
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="underline">{doc.name || 'Document'}</a>
                        </div>
                      ))}
                    </div>
                    {selectedBooking?.insurance_required && !selectedBooking?.driver_insurance_valid && selectedBooking.status === 'pending_insurance_upload' && (
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-2 rounded-lg">
                        <p className="text-sm text-orange-700 mb-2 flex items-center gap-2"><FaExclamationTriangle className="w-4 h-4" />This vehicle does not include insurance. You must upload a valid insurance certificate before pickup.</p>
                        <button onClick={() => setShowInsuranceModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><FaUpload />Upload Insurance</button>
                      </div>
                    )}
                  </div>
                  {/* Issues */}
                  {selectedBooking.issues && selectedBooking.issues.length > 0 && (
                    <div className="bg-white/80 rounded-2xl shadow border border-gray-100 p-6 flex flex-col gap-4">
                      <h4 className="font-bold text-lg text-black mb-2 flex items-center gap-2"><FaExclamationTriangle className="text-red-600" /> Issues</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {selectedBooking.issues.map((issue: Issue, idx: number) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>{issue.severity.toUpperCase()}</span>
                                <span className="font-medium text-black">{issue.type}</span>
                              </div>
                              <span className="text-xs text-gray-500">{formatDate((issue as any).reportedAt ?? (issue as any).reported_at)}</span>
                            </div>
                            <p className="text-sm text-black mb-2">{issue.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Status: {issue.status}</span>
                              {(issue.resolvedAt ?? (issue as any).resolved_at) && (
                                <span>Resolved: {formatDate(issue.resolvedAt ?? (issue as any).resolved_at)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Actions Bar */}
            <div className="bg-gradient-to-r from-blue-100/60 to-purple-100/60 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 md:flex md:flex-wrap md:gap-4 md:justify-end">
                <button onClick={closeAllModals} className="w-full md:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-white/80 hover:bg-gray-100 border border-gray-300 text-black shadow transition">Close</button>
                <button onClick={() => handleOpenSupport(selectedBooking)} className="w-full md:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-orange-100 hover:bg-orange-200 border border-orange-300 text-orange-700 shadow flex items-center gap-2 transition"><FaLifeRing />Get Help</button>
                {['active', 'partner_accepted'].includes(selectedBooking.status) && (
                  <>
                    <button onClick={() => { setShowDetails(false); setShowIssueForm(true); }} className="w-full md:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 shadow flex items-center gap-2 transition"><FaExclamationTriangle />Report Issue</button>
                    {!selectedBooking.return_requested && (
                      <button onClick={() => { setShowDetails(false); setShowReturnForm(true); }} className="w-full md:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-700 shadow flex items-center gap-2 transition"><FaUndo />Request Return</button>
                    )}
                  </>
                )}
                {selectedBooking.agreement_url && !selectedBooking.agreement_signed && (
                  <a href={selectedBooking.agreement_url} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-green-100 hover:bg-green-200 border border-green-300 text-green-700 shadow flex items-center gap-2 transition"><FaSignature />Sign Agreement</a>
                )}
                {['active', 'partner_accepted'].includes(selectedBooking.status) && (
                  <a href={`/upload-docs?booking=${selectedBooking.id}`} className="w-full md:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-xl text-sm sm:text-base font-semibold bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-700 shadow flex items-center gap-2 transition"><FaUpload />Upload Documents</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Reporting Modal */}
      {showIssueForm && selectedBooking && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-white/30 backdrop-blur-md" 
              aria-hidden="true"
              onClick={() => {
                setShowIssueForm(false);
                setShowDetails(true);
              }}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Report Issue - {getCarLabel(selectedBooking)}
                  </h3>
                  <button
                    onClick={() => {
                      setShowIssueForm(false);
                      setShowDetails(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Vehicle Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="font-medium text-blue-900 mb-1">Vehicle Information</h5>
                    <p className="text-sm text-blue-800">
                      {getCarLabel(selectedBooking)} • {selectedBooking.car_info?.registration_plate || selectedBooking.car_plate || selectedBooking.car?.registration_number || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-black disabled:bg-gray-200"
                    >
                      <option value="">Select issue type</option>
                      <option value="mechanical">🔧 Mechanical Problem</option>
                      <option value="electrical">⚡ Electrical Issue</option>
                      <option value="cosmetic">🎨 Cosmetic Damage</option>
                      <option value="cleanliness">🧽 Cleanliness Issue</option>
                      <option value="documentation">📄 Documentation Problem</option>
                      <option value="other">❓ Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Severity Level</label>
                    <select
                      value={issueSeverity}
                      onChange={(e) => setIssueSeverity(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-black disabled:bg-gray-200"
                    >
                      <option value="low">🟢 Low - Minor issue (cosmetic, non-urgent)</option>
                      <option value="medium">🟡 Medium - Moderate concern (affects comfort)</option>
                      <option value="high">🟠 High - Significant problem (affects driving)</option>
                      <option value="critical">🔴 Critical - Urgent attention needed (safety risk)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-black placeholder-black disabled:bg-gray-200"
                      placeholder="Please describe the issue in detail. Include when it started, any symptoms, and any relevant circumstances..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Provide as much detail as possible to help us resolve the issue quickly.
                    </p>
                  </div>

                  {/* Notification Info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <FaCheckCircle className="text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900">Automatic Notifications</p>
                        <p className="text-green-800">
                          Your issue will be automatically sent to both the partner and admin team for immediate attention.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleReportIssue}
                  disabled={!issueType || !issueDescription.trim() || submittingIssue}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingIssue ? 'Reporting...' : 'Report Issue'}
                </button>
                <button
                  onClick={() => {
                    setShowIssueForm(false);
                    setShowDetails(true);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnForm && selectedBooking && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-white/30 backdrop-blur-md" 
              aria-hidden="true"
              onClick={() => {
                setShowReturnForm(false);
                setShowDetails(true);
              }}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Request Return - {getCarLabel(selectedBooking)}
                  </h3>
                  <button
                    onClick={() => {
                      setShowReturnForm(false);
                      setShowDetails(true);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Booking Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="font-medium text-blue-900 mb-1">Booking Information</h5>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>{getCarLabel(selectedBooking)} • {selectedBooking.car_info?.registration_plate || selectedBooking.car_plate || selectedBooking.car?.registration_number || 'N/A'}</p>
                      <p>Duration: {formatDate(selectedBooking.start_date)} - {formatDate(selectedBooking.end_date)}</p>
                      <p>Partner: {
                        selectedBooking.partner?.company_name ||
                        selectedBooking.partner_name ||
                        selectedBooking.partner?.full_name ||
                        selectedBooking.partner?.email ||
                        'Unknown'
                      }</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Early Return <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-black text-black"
                      placeholder="Please provide a detailed reason for returning the vehicle early. Include any relevant circumstances..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Be specific about why you need to return the vehicle before the scheduled end date.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Return Request Process
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700 space-y-1">
                          <p>• Your request will be sent to the partner for review and approval</p>
                          <p>• The partner will contact you to arrange the return details</p>
                          <p>• Early returns may affect your refund amount based on the rental agreement</p>
                          <p>• Please ensure you have a valid reason as this may impact future bookings</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <FaPhone className="text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-green-900">Need to discuss first?</p>
                        <p className="text-green-800">
                          Contact the partner directly at {selectedBooking.partner_phone || selectedBooking.partner?.phone || 'contact information not available'}{' '}
                          or use the "Get Help" button to chat with support.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleRequestReturn}
                  disabled={!returnReason.trim() || submittingReturn}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReturn ? 'Submitting...' : 'Request Return'}
                </button>
                <button
                  onClick={() => {
                    setShowReturnForm(false);
                    setShowDetails(true);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:mr-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insurance Modal - Placeholder */}
      {selectedBooking && showInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insurance Upload</h3>
            <p className="text-gray-600 mb-4">
              Insurance upload functionality will be implemented here.
            </p>
            <button
              onClick={() => setShowInsuranceModal(false)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 