'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase/client';
import { 
  FaCar, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaChevronDown, 
  FaChevronUp, 
  FaMoneyBillWave,
  FaSearch,
  FaFilter,
  FaDownload,
  FaUpload,
  FaFileAlt,
  FaShieldAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTools,
  FaBan,
  FaPlay,
  FaStop,
  FaEllipsisH,
  FaThumbsUp,
  FaThumbsDown,
  FaComment,
  FaPaperclip,
  FaSave,
  FaTimes,
  FaEye,
  FaCog,
  FaPhone,
  FaEnvelope,
  FaCamera,
  FaFileUpload,
  FaCheck,
  FaTimes as FaX,
  FaInfoCircle,
  FaExclamationTriangle as FaWarning,
  FaCheckDouble,
  FaHistory,
  FaReceipt,
  FaCreditCard,
  FaUniversity,
  FaExchangeAlt
} from 'react-icons/fa';

interface PaymentInstruction {
  id: string;
  booking_id: string;
  vehicle_reg: string;
  amount: number;
  frequency: 'weekly' | 'one_off';
  type: 'weekly_rent' | 'deposit' | 'refund' | 'topup' | 'adjustment';
  method: 'bank_transfer' | 'direct_debit';
  next_due_date: string | null;
  status: 'pending' | 'sent' | 'auto' | 'void' | 'deposit_pending' | 'deposit_refund_pending' | 'deposit_refunded' | 'deposit_received';
  last_sent_at: string | null;
  refunded_amount: number | null;
  reason: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  driver_id: string;
  partner_id: string;
  driver_name: string | null;
}

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
  
  car?: {
    id: string;
    make: string;
    model: string;
    year: string;
    registration_number: string;
    color: string;
    fuel_type: string;
    transmission: string;
    seats: string;
    mileage: string;
    image_url: string;
    price_per_week: number;
  };
  
  car_name?: string;
  car_image?: string;
  car_plate?: string;
  partner_name?: string;
}

interface Transaction {
  id: string;
  booking_id: string;
  driver_id: string;
  partner_id: string;
  amount: number;
  type: string;
  status: string;
  method: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Helper to map raw status codes to nicer labels
function getStatusLabel(status: PaymentInstruction['status']): string {
  const map: Record<PaymentInstruction['status'], string> = {
    pending: 'Pending',
    sent: 'Sent',
    auto: 'Auto Paid',
    void: 'Void',
    deposit_pending: 'Deposit Pending',
    deposit_refund_pending: 'Refund Due',
    deposit_refunded: 'Deposit Refunded',
    deposit_received: 'Deposit Received',
  } as const;
  return map[status] ?? status;
}

export default function DriverPaymentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState<string[]>([]);
  const [expandedBookings, setExpandedBookings] = useState<{[bookingId: string]: boolean}>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [vehicleTotals, setVehicleTotals] = useState<{[vehicle: string]: number}>({});
  const [totalSpent, setTotalSpent] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch driver's payment instructions
      const { data: instructionsData, error: instructionsError } = await supabase
        .from('payment_instructions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (instructionsError) {
        console.error('Error fetching payment instructions:', instructionsError);
        setError('Failed to load payment instructions');
        return;
      }

      setInstructions(instructionsData || []);

      // Fetch driver's bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          car:cars(*),
          partner:partners(company_name)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (!bookingsError && bookingsData) {
        const processedBookings = bookingsData.map((booking: any) => ({
          ...booking,
          car_name: booking.car?.make && booking.car?.model 
            ? `${booking.car.make} ${booking.car.model}` 
            : 'Unknown Car',
          car_image: booking.car?.image_url || '',
          car_plate: booking.car?.registration_number || '',
          partner_name: booking.partner?.company_name || 'Verified Partner',
        })) as Booking[];

        setBookings(processedBookings);
      }

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (!transactionsError && transactionsData) {
        setTransactions(transactionsData);
        
        // Calculate vehicle totals
        const totals: {[vehicle: string]: number} = {};
        let total = 0;
        for (const tx of transactionsData) {
          const reg = tx.vehicle_reg || tx.car_plate || tx.car_id || 'Unknown';
          totals[reg] = (totals[reg] || 0) + (tx.amount || 0);
          total += tx.amount || 0;
        }
        setVehicleTotals(totals);
        setTotalSpent(total);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const markSent = async (instructionId: string) => {
    try {
      setSendingIds(prev => [...prev, instructionId]);
      
      const response = await fetch('/api/payments/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId, driverId: user!.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark payment sent');
      }

      // Refresh data
      fetchData();
    } catch (e) {
      console.error('Error marking payment sent:', e);
      setError('Failed to mark payment sent');
    } finally {
      setSendingIds(prev => prev.filter(id => id !== instructionId));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toLocaleString()}`;
  };

  // Group by booking
  const bookingMap = useMemo(() => {
    const map: {[bookingId: string]: {vehicle: string, instructions: PaymentInstruction[]}} = {};
    for (const inst of instructions) {
      if (!map[inst.booking_id]) {
        map[inst.booking_id] = { 
          vehicle: inst.vehicle_reg || inst.booking_id, 
          instructions: [] 
        };
      }
      map[inst.booking_id].instructions.push(inst);
    }
    return map;
  }, [instructions]);

  // Find the active booking (or most recent if none active)
  const activeBooking = bookings.find(b => b.status === 'active');
  const displayBookingIds = activeBooking ? [activeBooking.id] : (bookings.length ? [bookings[0].id] : []);

  // Filter bookings
  let filteredBookingsForDisplay = displayBookingIds;
  if (vehicleFilter) {
    filteredBookingsForDisplay = filteredBookingsForDisplay.filter(bid => 
      bookingMap[bid]?.vehicle.toLowerCase().includes(vehicleFilter.toLowerCase())
    );
  }

  // Status filter
  if (statusFilter) {
    for (const bid of filteredBookingsForDisplay) {
      if (bookingMap[bid]) {
        bookingMap[bid].instructions = bookingMap[bid].instructions.filter(inst => inst.status === statusFilter);
      }
    }
  }

  // Type filter
  if (typeFilter) {
    for (const bid of filteredBookingsForDisplay) {
      if (bookingMap[bid]) {
        bookingMap[bid].instructions = bookingMap[bid].instructions.filter(inst => inst.type === typeFilter);
      }
    }
  }

  // Separate weekly vs deposit
  const weeklyInstructions = filteredBookingsForDisplay.flatMap(bid => 
    bookingMap[bid]?.instructions.filter(i => i.frequency === 'weekly' || i.type === 'weekly_rent') || []
  );
  const depositInstructions = filteredBookingsForDisplay.flatMap(bid => 
    bookingMap[bid]?.instructions.filter(i => i.type === 'deposit' || i.frequency === 'one_off') || []
  );

  const totalDue = weeklyInstructions.reduce((sum, i) => sum + (i.status === 'pending' ? i.amount : 0), 0);
  const totalPaid = weeklyInstructions.reduce((sum, i) => sum + (i.status === 'auto' ? i.amount : 0), 0);
  const totalSent = weeklyInstructions.reduce((sum, i) => sum + (i.status === 'sent' ? i.amount : 0), 0);
  const overdue = weeklyInstructions.filter(i => 
    i.status === 'pending' && i.next_due_date && new Date(i.next_due_date) < new Date()
  ).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-xl font-semibold text-gray-600">Loading payments...</div>
        </div>
      </div>
    );
  }

  if (instructions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaMoneyBillWave className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Instructions</h3>
          <p className="text-gray-600">You don't have any payment instructions yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Weekly Payments</h1>
          <p className="text-gray-600 mt-2">Manage your rental payments and track payment history</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Due */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Due</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalDue)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaMoneyBillWave className="text-blue-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Pending Confirmation */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Confirmation</p>
                <p className="text-3xl font-bold text-yellow-600">{formatCurrency(totalSent)}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FaClock className="text-yellow-600 text-2xl" />
              </div>
            </div>
          </div>

          {/* Auto Paid */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Auto Paid</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-700 text-2xl" />
              </div>
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-700">{overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FaExclamationTriangle className="text-red-700 text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Spent Section */}
        <div className="mb-8">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-col items-center mb-4">
            <div className="text-lg font-bold text-indigo-700">{formatCurrency(totalSpent)}</div>
            <div className="text-xs text-gray-800 mt-1">Total Spent (All Vehicles)</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(vehicleTotals).map(([vehicle, amount]) => (
              <div key={vehicle} className="bg-gray-50 p-3 rounded shadow text-sm flex justify-between">
                <span className="font-semibold">{vehicle}</span>
                <span>{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
              <input
                type="text"
                placeholder="Filter by vehicle..."
                value={vehicleFilter}
                onChange={e => setVehicleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="auto">Auto Paid</option>
                <option value="deposit_pending">Deposit Pending</option>
                <option value="deposit_received">Deposit Received</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="weekly_rent">Weekly Rent</option>
                <option value="deposit">Deposit</option>
                <option value="refund">Refund</option>
                <option value="topup">Top-up</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setVehicleFilter('');
                  setStatusFilter('');
                  setTypeFilter('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <FaExclamationTriangle className="flex-shrink-0 h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Grouped by Booking */}
        <div className="space-y-6">
          {filteredBookingsForDisplay.map(bookingId => {
            const booking = bookingMap[bookingId];
            if (!booking?.instructions.length) return null;
            
            const hasActiveWeekly = booking.instructions.some(i => 
              (i.frequency === 'weekly' || i.type === 'weekly_rent') && 
              (i.status === 'pending' || i.status === 'sent')
            );
            const expanded = expandedBookings[bookingId] ?? hasActiveWeekly;
            
            return (
              <div key={bookingId} className="bg-white rounded-xl shadow border border-gray-200">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors" 
                  onClick={() => setExpandedBookings(prev => ({ ...prev, [bookingId]: !expanded }))}
                >
                  <div className="flex items-center gap-3">
                    <FaCar className="text-blue-500" />
                    <span className="font-semibold text-lg text-gray-900">{booking.vehicle}</span>
                    <span className="ml-2 text-xs text-gray-500">{booking.instructions.length} payment(s)</span>
                  </div>
                  <button className="text-gray-400 hover:text-blue-600">
                    {expanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
                
                {expanded && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-fixed bg-white">
                      <thead>
                        <tr className="bg-gray-100 text-xs font-semibold text-gray-900 uppercase tracking-wide">
                          <th className="px-4 py-3 w-24">Amount</th>
                          <th className="px-4 py-3 w-28">Next Due</th>
                          <th className="px-4 py-3 w-32">Method</th>
                          <th className="px-4 py-3 w-28">Status</th>
                          <th className="px-4 py-3 w-36">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-200 text-gray-900">
                        {booking.instructions.map((inst, index) => {
                          const isOverdue = inst.status === 'pending' && 
                            inst.next_due_date && 
                            new Date(inst.next_due_date) < new Date();
                          
                          return (
                            <tr key={inst.id} className={
                              `${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ` +
                              (isOverdue ? 'bg-red-50' : 
                               inst.status === 'pending' ? 'bg-yellow-50' :
                               inst.status === 'sent' ? 'bg-blue-50' : '')
                            }>
                              <td className="px-4 py-2">{formatCurrency(inst.amount)}</td>
                              <td className="px-4 py-2">
                                {(() => {
                                  const booking = bookings.find(b => b.id === inst.booking_id);
                                  if (!booking) return formatDate(inst.next_due_date);
                                  if (booking.status === 'completed') return <span className="text-green-700 font-bold">Completed</span>;
                                  if (booking.status === 'cancelled') return <span className="text-red-700 font-bold">Cancelled</span>;
                                  if (booking.status === 'early_return') return <span className="text-yellow-700 font-bold">Early Return</span>;
                                  return formatDate(inst.next_due_date);
                                })()}
                              </td>
                              <td className="px-4 py-2">
                                {inst.method === 'bank_transfer' ? 'Bank Transfer' : 'Direct Debit'}
                              </td>
                              <td className="px-4 py-2 capitalize">
                                {(() => {
                                  switch (inst.status) {
                                    case 'pending':
                                      return (
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${isOverdue ? 'text-red-700' : 'text-yellow-700'}`}>
                                          {isOverdue ? <FaExclamationTriangle /> : <FaClock />} 
                                          {isOverdue ? 'Overdue' : 'Pending'}
                                        </span>
                                      );
                                    case 'sent':
                                      return <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-bold"><FaClock /> Sent</span>;
                                    case 'auto':
                                      return <span className="inline-flex items-center gap-1 text-xs text-green-700 font-bold"><FaCheckCircle /> Auto Paid</span>;
                                    case 'deposit_pending':
                                      return <span className="inline-flex items-center gap-1 text-xs text-yellow-700 font-bold"><FaClock /> Deposit Pending</span>;
                                    case 'deposit_refund_pending':
                                      return <span className="inline-flex items-center gap-1 text-xs text-yellow-700 font-bold"><FaClock /> Refund Due</span>;
                                    case 'deposit_refunded':
                                      return <span className="inline-flex items-center gap-1 text-xs text-green-700 font-bold"><FaCheckCircle /> Refunded</span>;
                                    case 'deposit_received':
                                      return <span className="inline-flex items-center gap-1 text-xs text-green-700 font-bold"><FaCheckCircle /> Deposit Received</span>;
                                    case 'void':
                                      return <span className="inline-flex items-center gap-1 text-xs text-gray-500">Void</span>;
                                    default:
                                      return <span className="text-xs text-gray-600">{getStatusLabel(inst.status)}</span>;
                                  }
                                })()}
                              </td>
                              <td className="px-4 py-2">
                                {inst.method === 'bank_transfer' && inst.status === 'pending' && (
                                  isOverdue ? (
                                    <button
                                      onClick={() => markSent(inst.id)}
                                      disabled={sendingIds.includes(inst.id)}
                                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                      {sendingIds.includes(inst.id) ? 'Sending…' : 'Mark Payment Sent'}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-500">Not due yet</span>
                                  )
                                )}
                                {inst.method === 'bank_transfer' && inst.status === 'sent' && (
                                  <span className="text-xs text-blue-600">Awaiting partner confirmation…</span>
                                )}
                                {inst.method === 'direct_debit' && (
                                  <span className="text-xs text-gray-500">Auto</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    
                    {/* Payment History */}
                    <PaymentHistory bookingId={bookingId} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PaymentHistory({ bookingId }: { bookingId: string }) {
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: historyData, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('booking_id', bookingId)
          .eq('category', 'Booking Revenue')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching payment history:', error);
          return;
        }

        setHistory(historyData || []);
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="mt-4 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="mt-4 p-4 text-center">
        <FaHistory className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-xs text-gray-500">No previous payments</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border-t border-gray-200">
      <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
        <FaHistory className="w-4 h-4" />
        Previous Payments
      </h4>
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-100 text-xs uppercase tracking-wide text-gray-700">
              <th className="px-4 py-2 w-28 text-left">Date</th>
              <th className="px-4 py-2 w-24 text-right">Amount</th>
              <th className="px-4 py-2 w-32 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-200 text-gray-900">
            {history.map((h, i) => (
              <tr key={h.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-2">{new Date(h.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">£{h.amount?.toLocaleString()}</td>
                <td className="px-4 py-2 capitalize">{h.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 