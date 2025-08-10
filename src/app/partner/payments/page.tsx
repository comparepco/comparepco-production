'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePartnerPayments } from '@/hooks/usePartnerPayments';
import { 
  FaMoneyBillWave, FaUsers, FaCar, FaCalendarAlt, FaClock, 
  FaCheckCircle, FaExclamationTriangle, FaEye, FaEdit, FaPlus, 
  FaTrash, FaFilter, FaSearch, FaDownload, FaUpload, FaBell,
  FaTachometerAlt, FaUserTie, FaBuilding, FaChartLine, FaChartBar,
  FaChartPie, FaArrowUp, FaArrowDown, FaFileAlt, FaShieldAlt,
  FaCog, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCreditCard,
  FaUniversity, FaHandshake, FaReceipt, FaCalculator, FaSort,
  FaSortUp, FaSortDown, FaEllipsisH, FaTimes, FaCheck,
  FaTimesCircle, FaInfoCircle, FaQuestionCircle, FaHistory
} from 'react-icons/fa';

interface AppUser {
  uid?: string;
  partnerId?: string;
  role?: string;
  is_active?: boolean;
  status?: string;
}

interface PaymentInstruction {
  id: string;
  booking_id?: string;
  vehicle_reg?: string;
  amount: number;
  driver_id?: string;
  method?: 'bank_transfer' | 'direct_debit';
  frequency?: 'weekly' | 'one_off';
  type?: 'weekly_rent' | 'deposit' | 'refund' | 'topup' | 'adjustment';
  next_due_date?: any;
  status: string; // Make status more flexible to handle any string value
  last_sent_at?: any;
  driver_name?: string;
  booking_start?: any;
  booking_end?: any;
  booking_status?: 'active' | 'completed' | 'cancelled';
  refunded_amount?: number;
  driver_bank_details?: {
    account_name?: string;
    account_number?: string;
    sort_code?: string;
  };
  reason?: string;
  metadata?: any;
  refund_rejection_reason?: string;
  // Additional fields from the hook
  partner_id?: string;
  vehicle_id?: string;
  vehicle_name?: string;
  license_plate?: string;
  currency?: string;
  payment_method?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  reference_number?: string;
  deposit_amount?: number;
  deposit_received_at?: string;
  deposit_received_by?: string;
  // Legacy field mappings for backward compatibility
  bookingId?: string;
  vehicleReg?: string;
  driverId?: string;
  driverName?: string;
  nextDueDate?: any;
  bookingStart?: any;
  bookingEnd?: any;
  bookingStatus?: string;
  refundedAmount?: number;
  driverBankDetails?: any;
  refundRejectionReason?: string;
}

interface DriverInfo {
  name: string;
  phone?: string;
  vehicles: { [vehicleReg: string]: PaymentInstruction[] };
}

function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending': return 'Pending';
    case 'sent': return 'Sent';
    case 'received': return 'Received';
    case 'confirmed': return 'Confirmed';
    case 'overdue': return 'Overdue';
    case 'cancelled': return 'Cancelled';
    case 'deposit_pending': return 'Deposit Pending';
    case 'deposit_received': return 'Deposit Received';
    case 'refund_pending': return 'Refund Pending';
    case 'refund_approved': return 'Refund Approved';
    case 'refund_rejected': return 'Refund Rejected';
    default: return status || 'Unknown';
  }
}

// Simple £ formatter for consistency
const money = (n: number | undefined) => `£${(n||0).toLocaleString()}`;

// Helper functions (moved to top to avoid hoisting issues)
const getBookingIdSafe = (inst: PaymentInstruction): string => {
  return inst.booking_id ?? inst.bookingId ?? '';
};

const getVehicleRegSafe = (inst?: PaymentInstruction): string => {
  if (!inst) return 'Unknown';
  return inst.vehicle_reg ?? inst.vehicleReg ?? inst.license_plate ?? 'Unknown';
};

export default function PartnerPaymentsPage() {
  const { user } = useAuth();
  const { instructions, stats, loading, error, reload } = usePartnerPayments();
  
  // State management
  const [activeTab, setActiveTab] = useState<'all' | 'byDriver' | 'received' | 'due' | 'upcoming' | 'deposits' | 'adjustments'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<'week' | 'month' | 'year' | 'range'>('week');
  const [customPeriod, setCustomPeriod] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState<'amount' | 'due_date' | 'created_at' | 'driver_name'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [openBookings, setOpenBookings] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [markingReceivedId, setMarkingReceivedId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [bookingIdFilter, setBookingIdFilter] = useState('');
  const [driverIdFilter, setDriverIdFilter] = useState('');
  const [vehicleRegFilter, setVehicleRegFilter] = useState('');
  const [adjustSearch, setAdjustSearch] = useState('');

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Calculate filtered and sorted instructions
  const filteredInstructions = instructions.filter(inst => {
    const matchesSearch = !searchTerm || 
      getDriverNameDisplay(inst).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleRegDisplay(inst).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBookingIdDisplay(inst).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || inst.status === statusFilter;
    const matchesType = !typeFilter || inst.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort instructions
  const sortedInstructions = [...filteredInstructions].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'amount':
        aValue = a.amount;
        bValue = b.amount;
        break;
      case 'due_date':
        aValue = new Date(a.next_due_date || a.due_date || 0);
        bValue = new Date(b.next_due_date || b.due_date || 0);
        break;
      case 'created_at':
        aValue = new Date(a.created_at || 0);
        bValue = new Date(b.created_at || 0);
        break;
      case 'driver_name':
        aValue = getDriverNameDisplay(a);
        bValue = getDriverNameDisplay(b);
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedInstructions.length / itemsPerPage);
  const paginatedInstructions = sortedInstructions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate stats
  const totalDue = filteredInstructions
    .filter(inst => inst.status === 'pending' || inst.status === 'sent')
    .reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const totalSent = filteredInstructions
    .filter(inst => inst.status === 'sent')
    .reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const totalPaid = filteredInstructions
    .filter(inst => inst.status === 'received' || inst.status === 'confirmed')
    .reduce((sum, inst) => sum + (inst.amount || 0), 0);

  const overdue = filteredInstructions
    .filter(inst => {
      const dueDate = new Date(inst.next_due_date || inst.due_date || 0);
      return dueDate < new Date() && (inst.status === 'pending' || inst.status === 'sent');
    }).length;

  const depositInst = filteredInstructions.filter(inst => inst.type === 'deposit');
  const adjustmentInst = filteredInstructions.filter(inst => inst.type === 'adjustment');
  
  // Filter instructions by status for tabs
  const receivedInst = filteredInstructions.filter(inst => 
    inst.status === 'received' || inst.status === 'confirmed' || inst.status === 'deposit_received'
  );
  
  const dueInst = filteredInstructions.filter(inst => {
    const dueDate = new Date(inst.next_due_date || inst.due_date || 0);
    return dueDate < new Date() && (inst.status === 'pending' || inst.status === 'sent');
  });
  
  const upcomingInst = filteredInstructions.filter(inst => {
    const dueDate = new Date(inst.next_due_date || inst.due_date || 0);
    return dueDate > new Date() && (inst.status === 'pending' || inst.status === 'sent');
  });
  
  // Helper functions (moved to top to avoid hoisting issues)
  const getDriverNameDisplay = (inst: PaymentInstruction): string => {
    return inst.driver_name || inst.driverName || inst.driver_id || inst.driverId || 'Unknown';
  };

  const getVehicleRegDisplay = (inst: PaymentInstruction): string => {
    return inst.vehicle_reg || inst.vehicleReg || inst.license_plate || 'Unknown';
  };

  const getBookingIdDisplay = (inst: PaymentInstruction): string => {
    return inst.booking_id || inst.bookingId || 'Unknown';
  };

  // Group instructions by driver for "By Driver" tab
  const driverGroups: { [driverId: string]: DriverInfo } = {};
  filteredInstructions.forEach(inst => {
    const driverId = inst.driver_id || inst.driverId || 'unknown';
    const driverName = getDriverNameDisplay(inst);
    const vehicleReg = getVehicleRegDisplay(inst);
    
    if (!driverGroups[driverId]) {
      driverGroups[driverId] = {
        name: driverName,
        vehicles: {}
      };
    }
    
    if (!driverGroups[driverId].vehicles[vehicleReg]) {
      driverGroups[driverId].vehicles[vehicleReg] = [];
    }
    
    driverGroups[driverId].vehicles[vehicleReg].push(inst);
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'received':
      case 'confirmed':
      case 'deposit_received':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
      case 'refund_rejected':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'deposit_pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'refund_pending':
      case 'refund_approved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weekly_rent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deposit':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'adjustment':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'refund':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <FaUniversity className="w-4 h-4" />;
      case 'direct_debit':
        return <FaCreditCard className="w-4 h-4" />;
      default:
        return <FaMoneyBillWave className="w-4 h-4" />;
    }
  };

  const formatDate = (d: any) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString();
  };

  const formatPeriod = (start: any, end: any) => {
    if (!start || !end) return 'N/A';
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const toggleBooking = (bookingId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenBookings(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  const handleDepositReceived = async (inst: PaymentInstruction) => {
    setMarkingReceivedId(inst.id);
    try {
      const res = await fetch('/api/partner/payments/confirm-received', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId: inst.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to confirm');
      } else {
        setSuccessMessage('Deposit marked received!');
        reload();
      }
    } catch {
      setErrorMessage('Failed to confirm');
    } finally {
      setMarkingReceivedId(null);
    }
  };

  const handleRefundDeposit = async (inst: PaymentInstruction) => {
    const amtStr = window.prompt('Refund amount (£):', String(inst.amount));
    if (!amtStr) return;
    const amt = Number(amtStr);
    if (isNaN(amt) || amt <= 0) return alert('Invalid amount');
    const reason = window.prompt('Reason for partial refund:');
    if (!reason) return;
    setMarkingReceivedId(inst.id);
    try {
      const res = await fetch('/api/payments/refund-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId: inst.id, refundAmount: amt, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Refund failed');
      } else {
        setSuccessMessage('Deposit refunded!');
        reload();
      }
    } catch (err) {
      setErrorMessage('Refund failed');
    } finally {
      setMarkingReceivedId(null);
    }
  };

  const handleRejectRefund = async (inst: PaymentInstruction) => {
    const reason = window.prompt('Enter reason for refund rejection:');
    if (!reason) return;
    setMarkingReceivedId(inst.id);
    try {
      const res = await fetch('/api/payments/reject-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId: inst.id, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || 'Rejection failed');
      } else {
        setSuccessMessage('Refund rejected!');
        reload();
      }
    } catch (err) {
      setErrorMessage('Rejection failed');
    } finally {
      setMarkingReceivedId(null);
    }
  };

  const handleUserAction = async (action: string, data: any) => {
    try {
      const res = await fetch(`/api/payments/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(errorData.error || `Failed to ${action}`);
      } else {
        setSuccessMessage(`${action} successful!`);
        reload();
      }
    } catch (err) {
      setErrorMessage(`Failed to ${action}`);
    }
  };

  const exportToCSV = () => {
    const headers = ['Driver', 'Vehicle', 'Booking ID', 'Amount', 'Type', 'Status', 'Due Date', 'Method'];
    const csvContent = [
      headers.join(','),
      ...filteredInstructions.map(inst => [
        getDriverNameDisplay(inst),
        getVehicleRegDisplay(inst),
        getBookingIdDisplay(inst),
        inst.amount,
        inst.type,
        inst.status,
        formatDate(inst.next_due_date || inst.due_date),
        inst.method
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_instructions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-2 mx-1 rounded-lg text-sm font-medium ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex items-center justify-center mt-6">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 mx-1 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 mx-1 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment instructions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error loading payment instructions</p>
          <button
            onClick={reload}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center">
                <FaMoneyBillWave className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
                <p className="text-gray-600">Manage driver payments and track financial transactions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaUserTie className="text-gray-400" />
                <span className="capitalize">{user?.role?.replace('_', ' ') || 'User'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaCheckCircle className="text-green-500 mr-2" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 mr-2" />
              <span className="text-red-800">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-gray-900">{money(totalDue)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <FaClock className="text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-yellow-600 font-medium">
                {overdue} overdue
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Confirmation</p>
                <p className="text-2xl font-bold text-gray-900">{money(totalSent)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                <FaExclamationTriangle className="text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600">
                {filteredInstructions.filter(inst => inst.status === 'sent').length} instructions
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Received</p>
                <p className="text-2xl font-bold text-gray-900">{money(totalPaid)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                {filteredInstructions.filter(inst => inst.status === 'received' || inst.status === 'confirmed').length} payments
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Instructions</p>
                <p className="text-2xl font-bold text-gray-900">{filteredInstructions.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <FaReceipt className="text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600">
                {depositInst.length} deposits, {adjustmentInst.length} adjustments
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('all')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaReceipt className="inline mr-2" />
              All Payments
            </button>
            <button 
              onClick={() => setActiveTab('byDriver')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'byDriver' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaUsers className="inline mr-2" />
              By Driver
            </button>
            <button 
              onClick={() => setActiveTab('received')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'received' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCheckCircle className="inline mr-2" />
              Received
            </button>
            <button 
              onClick={() => setActiveTab('due')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'due' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaClock className="inline mr-2" />
              Due
            </button>
            <button 
              onClick={() => setActiveTab('upcoming')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'upcoming' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              Upcoming
            </button>
            <button 
              onClick={() => setActiveTab('deposits')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'deposits' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaHandshake className="inline mr-2" />
              Deposits
            </button>
            <button 
              onClick={() => setActiveTab('adjustments')} 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'adjustments' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FaCalculator className="inline mr-2" />
              Adjustments
            </button>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search drivers, vehicles, or booking IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="weekly_rent">Weekly Rent</option>
                  <option value="deposit">Deposit</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="refund">Refund</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <FaFilter />
                  Filters
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaDownload />
                Export CSV
              </button>
              <button
                onClick={reload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaHistory />
                Refresh
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Filter by Booking ID..."
                value={bookingIdFilter}
                onChange={(e) => setBookingIdFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Filter by Driver ID..."
                value={driverIdFilter}
                onChange={(e) => setDriverIdFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Filter by Vehicle Registration..."
                value={vehicleRegFilter}
                onChange={(e) => setVehicleRegFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Payment Instructions ({filteredInstructions.length})
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="due_date">Due Date</option>
                    <option value="amount">Amount</option>
                    <option value="created_at">Created Date</option>
                    <option value="driver_name">Driver Name</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                  </button>
                </div>
              </div>
            </div>

            {paginatedInstructions.length === 0 ? (
              <div className="p-8 text-center">
                <FaMoneyBillWave className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No payment instructions found</p>
                <p className="text-gray-400">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {paginatedInstructions.map((inst) => (
                <div key={inst.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                            <FaUserTie className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {getDriverNameDisplay(inst)}
                            </h4>
                            <p className="text-sm text-gray-600">Driver</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                            <FaCar className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {getVehicleRegDisplay(inst)}
                            </h4>
                            <p className="text-sm text-gray-600">Vehicle</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                            <FaFileAlt className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {getBookingIdDisplay(inst)}
                            </h4>
                            <p className="text-sm text-gray-600">Booking ID</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Amount</p>
                          <p className="text-lg font-bold text-gray-900">{money(inst.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Due Date</p>
                          <p className="text-sm text-gray-900">{formatDate(inst.next_due_date || inst.due_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Payment Method</p>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(inst.method || '')}
                            <span className="text-sm text-gray-900 capitalize">
                              {inst.method?.replace('_', ' ') || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(inst.status)}`}>
                          {getStatusLabel(inst.status)}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(inst.type || '')}`}>
                          {inst.type?.replace('_', ' ') || 'Unknown'}
                        </span>
                        {inst.frequency && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            {inst.frequency.replace('_', ' ')}
                          </span>
                        )}
                      </div>

                      {inst.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          <FaInfoCircle className="inline mr-1" />
                          {inst.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {inst.status === 'deposit_pending' && (
                        <button
                          onClick={() => handleDepositReceived(inst)}
                          disabled={markingReceivedId === inst.id}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
                        >
                          <FaCheck />
                          Mark Received
                        </button>
                      )}
                      
                      {inst.type === 'deposit' && inst.status === 'deposit_received' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRefundDeposit(inst)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                          >
                            <FaMoneyBillWave />
                            Refund
                          </button>
                          <button
                            onClick={() => handleRejectRefund(inst)}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
                          >
                            <FaTimes />
                            Reject
                          </button>
                        </div>
                      )}

                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <FaEllipsisH />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {renderPagination()}
        </div>
        )}

        {/* By Driver Tab */}
        {activeTab === 'byDriver' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Payments by Driver ({Object.keys(driverGroups).length} drivers)
              </h3>
            </div>
            {Object.keys(driverGroups).length === 0 ? (
              <div className="p-8 text-center">
                <FaUsers className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No drivers found</p>
                <p className="text-gray-400">No payment instructions available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {Object.entries(driverGroups).map(([driverId, driverInfo]) => (
                  <div key={driverId} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                          <FaUserTie className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{driverInfo.name}</h4>
                          <p className="text-sm text-gray-600">Driver ID: {driverId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                                                 <p className="text-lg font-bold text-gray-900">
                           {money(Object.values(driverInfo.vehicles).reduce((sum, insts) => sum + insts.reduce((s, inst) => s + inst.amount, 0), 0))}
                         </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(driverInfo.vehicles).map(([vehicleReg, instructions]) => (
                        <div key={vehicleReg} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <FaCar className="text-green-600" />
                              <span className="font-medium text-gray-900">{vehicleReg}</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {instructions.length} payment{instructions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {instructions.map((inst) => (
                              <div key={inst.id} className="flex items-center justify-between bg-white rounded p-3">
                                <div className="flex items-center gap-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(inst.status)}`}>
                                    {getStatusLabel(inst.status)}
                                  </span>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(inst.type || '')}`}>
                                    {inst.type?.replace('_', ' ') || 'Unknown'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    Due: {formatDate(inst.next_due_date || inst.due_date)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">{money(inst.amount)}</p>
                                  <p className="text-xs text-gray-500">{getBookingIdDisplay(inst)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Received Tab */}
        {activeTab === 'received' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Received Payments ({receivedInst.length})
              </h3>
            </div>
            {receivedInst.length === 0 ? (
              <div className="p-8 text-center">
                <FaCheckCircle className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No received payments</p>
                <p className="text-gray-400">No payments have been received yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {receivedInst.map((inst) => (
                  <div key={inst.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                              <FaCheckCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getDriverNameDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Driver</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                              <FaCar className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getVehicleRegDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Vehicle</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Amount Received</p>
                            <p className="text-lg font-bold text-green-600">{money(inst.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Received Date</p>
                            <p className="text-sm text-gray-900">{formatDate(inst.deposit_received_at || inst.updated_at)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Payment Method</p>
                            <div className="flex items-center gap-2">
                              {getMethodIcon(inst.method || '')}
                              <span className="text-sm text-gray-900 capitalize">
                                {inst.method?.replace('_', ' ') || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-green-100 text-green-800 border-green-200">
                            <FaCheckCircle className="mr-1" />
                            Received
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(inst.type || '')}`}>
                            {inst.type?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Due Tab */}
        {activeTab === 'due' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Due Payments ({dueInst.length})
              </h3>
            </div>
            {dueInst.length === 0 ? (
              <div className="p-8 text-center">
                <FaClock className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No due payments</p>
                <p className="text-gray-400">All payments are up to date</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {dueInst.map((inst) => (
                  <div key={inst.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                              <FaClock className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getDriverNameDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Driver</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                              <FaCar className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getVehicleRegDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Vehicle</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Amount Due</p>
                            <p className="text-lg font-bold text-orange-600">{money(inst.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Due Date</p>
                            <p className="text-sm text-orange-600 font-medium">{formatDate(inst.next_due_date || inst.due_date)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Days Overdue</p>
                            <p className="text-sm text-red-600 font-medium">
                              {Math.max(0, Math.floor((new Date().getTime() - new Date(inst.next_due_date || inst.due_date).getTime()) / (1000 * 60 * 60 * 24)))} days
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-orange-100 text-orange-800 border-orange-200">
                            <FaClock className="mr-1" />
                            Due
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(inst.type || '')}`}>
                            {inst.type?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1">
                          <FaEnvelope />
                          Send Reminder
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Tab */}
        {activeTab === 'upcoming' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Upcoming Payments ({upcomingInst.length})
              </h3>
            </div>
            {upcomingInst.length === 0 ? (
              <div className="p-8 text-center">
                <FaCalendarAlt className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No upcoming payments</p>
                <p className="text-gray-400">No payments scheduled for the future</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {upcomingInst.map((inst) => (
                  <div key={inst.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                              <FaCalendarAlt className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getDriverNameDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Driver</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                              <FaCar className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getVehicleRegDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Vehicle</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Amount</p>
                            <p className="text-lg font-bold text-gray-900">{money(inst.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Due Date</p>
                            <p className="text-sm text-gray-900">{formatDate(inst.next_due_date || inst.due_date)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Days Until Due</p>
                            <p className="text-sm text-blue-600 font-medium">
                              {Math.max(0, Math.floor((new Date(inst.next_due_date || inst.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-blue-100 text-blue-800 border-blue-200">
                            <FaCalendarAlt className="mr-1" />
                            Upcoming
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(inst.type || '')}`}>
                            {inst.type?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Deposit Payments ({depositInst.length})
              </h3>
            </div>
            {depositInst.length === 0 ? (
              <div className="p-8 text-center">
                <FaHandshake className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No deposit payments</p>
                <p className="text-gray-400">No deposit payments found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {depositInst.map((inst) => (
                  <div key={inst.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                              <FaHandshake className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getDriverNameDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Driver</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                              <FaCar className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getVehicleRegDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Vehicle</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Deposit Amount</p>
                            <p className="text-lg font-bold text-purple-600">{money(inst.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Status</p>
                            <p className="text-sm text-gray-900">{getStatusLabel(inst.status)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Due Date</p>
                            <p className="text-sm text-gray-900">{formatDate(inst.next_due_date || inst.due_date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(inst.status)}`}>
                            {getStatusLabel(inst.status)}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-purple-100 text-purple-800 border-purple-200">
                            <FaHandshake className="mr-1" />
                            Deposit
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {inst.status === 'deposit_pending' && (
                          <button
                            onClick={() => handleDepositReceived(inst)}
                            disabled={markingReceivedId === inst.id}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
                          >
                            <FaCheck />
                            Mark Received
                          </button>
                        )}
                        
                        {inst.type === 'deposit' && inst.status === 'deposit_received' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleRefundDeposit(inst)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                              <FaMoneyBillWave />
                              Refund
                            </button>
                            <button
                              onClick={() => handleRejectRefund(inst)}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
                            >
                              <FaTimes />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Adjustments Tab */}
        {activeTab === 'adjustments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Adjustment Payments ({adjustmentInst.length})
              </h3>
            </div>
            {adjustmentInst.length === 0 ? (
              <div className="p-8 text-center">
                <FaCalculator className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No adjustment payments</p>
                <p className="text-gray-400">No adjustment payments found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {adjustmentInst.map((inst) => (
                  <div key={inst.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                              <FaCalculator className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getDriverNameDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Driver</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                              <FaCar className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {getVehicleRegDisplay(inst)}
                              </h4>
                              <p className="text-sm text-gray-600">Vehicle</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Adjustment Amount</p>
                            <p className="text-lg font-bold text-orange-600">{money(inst.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Status</p>
                            <p className="text-sm text-gray-900">{getStatusLabel(inst.status)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Due Date</p>
                            <p className="text-sm text-gray-900">{formatDate(inst.next_due_date || inst.due_date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(inst.status)}`}>
                            {getStatusLabel(inst.status)}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-orange-100 text-orange-800 border-orange-200">
                            <FaCalculator className="mr-1" />
                            Adjustment
                          </span>
                        </div>
                        {inst.reason && (
                          <p className="text-sm text-gray-600 mt-2">
                            <FaInfoCircle className="inline mr-1" />
                            Reason: {inst.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 