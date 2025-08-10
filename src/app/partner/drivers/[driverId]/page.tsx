'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface Booking {
  id: string;
  userId: string;
  partnerId: string;
  driverId?: string;
  vehicleId: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  totalAmount: number;
  deposit?: number;
  status: string;
  pickupLocation: string;
  dropoffLocation?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    licensePlate?: string;
    color?: string;
  };
}

interface PaymentInstruction {
  id: string;
  partnerId: string;
  amount: number;
  frequency: string;
  type: string;
  status: string;
  nextDueDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: string;
  userId: string;
  partnerId?: string;
  driverId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  method: string;
  transactionId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function DriverOverviewPage() {
  const params = useParams<{ driverId: string }>();
  const driverId = params.driverId;
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<any | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openBookings, setOpenBookings] = useState<{[bookingId: string]: boolean}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [resolvedPartnerId, setResolvedPartnerId] = useState<string | null>(null);
  
  const bookingsPerPage = 5;
  const totalPages = Math.ceil(bookings.length / bookingsPerPage);
  const paginatedBookings = bookings.slice((currentPage-1)*bookingsPerPage, currentPage*bookingsPerPage);

  // Resolve partner ID
  useEffect(() => {
    const resolvePartner = async () => {
      if (!user) return;
      const role = user.role?.toLowerCase();
      if (role === 'partner_staff') {
        const pid = (user as any).partnerId || (user as any).partner_id;
        if (pid) setResolvedPartnerId(pid);
      } else if (role === 'partner') {
        try {
          const { data: partnerRow, error } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', user.id)
            .single();
          if (!error && partnerRow?.id) setResolvedPartnerId(partnerRow.id);
          else console.error('Unable to resolve partner_id for partner user', error);
        } catch (err) {
          console.error('Partner resolve exception', err);
        }
      }
    };
    resolvePartner();
  }, [user]);

  useEffect(() => {
    if (authLoading || !driverId || !resolvedPartnerId) return;

    (async () => {
      try {
        // Fetch driver document
        const { data: driverData, error: driverError } = await supabase
          .from('users')
          .select('*')
          .eq('id', driverId)
          .single();

        if (!driverError && driverData) {
          setDriver(driverData);
        }

        // Fetch bookings for this driver under this partner
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            vehicle:vehicles(id, make, model, licensePlate, color)
          `)
          .eq('driverId', driverId)
          .eq('partnerId', resolvedPartnerId)
          .order('createdAt', { ascending: false });

        if (!bookingsError && bookingsData) {
          setBookings(bookingsData as Booking[]);
        }

        // Fetch payment instructions for this driver
        const { data: instructionsData, error: instructionsError } = await supabase
          .from('payment_instructions')
          .select('*')
          .eq('partnerId', resolvedPartnerId)
          .order('createdAt', { ascending: false });

        if (!instructionsError && instructionsData) {
          setInstructions(instructionsData as PaymentInstruction[]);
        }

        // Fetch transactions for this driver
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('payments')
          .select('*')
          .eq('driverId', driverId)
          .eq('partnerId', resolvedPartnerId)
          .order('createdAt', { ascending: false });

        if (!transactionsError && transactionsData) {
          setTransactions(transactionsData as Transaction[]);
        }

      } catch (err) {
        console.error('Failed loading driver overview', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, driverId, resolvedPartnerId]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!driver) return <div className="p-6">Driver not found.</div>;

  const formatDate = (d: any) => {
    if (!d) return '—';
    const date = d.toDate ? d.toDate() : new Date(d);
    return date.toLocaleDateString();
  };

  const money = (n: number) => `£${n.toLocaleString()}`;

  const getDriverName = () => {
    return driver.name || driver.fullName || driver.displayName || 'Driver';
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link href="/partner/drivers" className="text-blue-600 hover:underline">&larr; Back to Drivers</Link>

      <div>
        <h1 className="text-3xl font-bold text-black">{getDriverName()}</h1>
        <div className="text-black mt-1">Driver ID: {driverId}</div>
        <div className="text-black mt-1">Email: {driver.email}</div>
        {driver.phone && <div className="text-black mt-1">Phone: {driver.phone}</div>}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-10">
        <h2 className="text-2xl font-semibold text-black mb-4">Booking History</h2>
        {bookings.length === 0 && <div className="text-black">No bookings found for this driver.</div>}
        <div className="space-y-8">
          {paginatedBookings.map(b => {
            const bookingInst = instructions.filter(i => i.partnerId === resolvedPartnerId);
            const bookingTx = transactions.filter(t => t.bookingId === b.id);
            const reg = b.vehicle?.licensePlate || b.vehicle?.make + ' ' + b.vehicle?.model || 'Unknown Vehicle';
            const period = `${formatDate(b.startDate)} – ${formatDate(b.endDate)}`;
            const isOpen = openBookings[b.id] || false;
            
            return (
              <div key={b.id} className="border border-gray-200 rounded-lg">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setOpenBookings(prev => ({ ...prev, [b.id]: !prev[b.id] }))}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-semibold text-blue-700">{reg}</span>
                    <span className="text-black text-sm">Booking {b.id}</span>
                    <span className="text-black text-sm">{period}</span>
                    <span className="text-black text-sm">{b.totalDays} days</span>
                    <span className="text-black text-sm font-medium">{money(b.totalAmount)}</span>
                  </div>
                  <span className="text-black text-xl">{isOpen ? '−' : '+'}</span>
                </div>
                {isOpen && (
                  <div className="p-4 space-y-4">
                    {/* Payment Instructions */}
                    <div>
                      <h3 className="font-semibold text-black mb-2">Payment Instructions</h3>
                      {bookingInst.length === 0 ? (
                        <div className="text-sm text-black">No instructions</div>
                      ) : (
                        <table className="w-full text-sm border">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 text-left text-black">Amount</th>
                              <th className="p-2 text-left text-black">Type</th>
                              <th className="p-2 text-left text-black">Status</th>
                              <th className="p-2 text-left text-black">Due</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookingInst.map(i => (
                              <tr key={i.id} className="border-t">
                                <td className="p-2 text-black">{money(i.amount)}</td>
                                <td className="p-2 text-black capitalize">{i.type || i.frequency}</td>
                                <td className="p-2 text-black capitalize">{i.status.replace(/_/g, ' ')}</td>
                                <td className="p-2 text-black">{formatDate(i.nextDueDate)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                    
                    {/* Transactions */}
                    <div>
                      <h3 className="font-semibold text-black mb-2">Transactions</h3>
                      {bookingTx.length === 0 ? (
                        <div className="text-sm text-black">No transactions</div>
                      ) : (
                        <table className="w-full text-sm border">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 text-left text-black">Date</th>
                              <th className="p-2 text-left text-black">Amount</th>
                              <th className="p-2 text-left text-black">Type</th>
                              <th className="p-2 text-left text-black">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookingTx.map(t => (
                              <tr key={t.id} className="border-t">
                                <td className="p-2 text-black">{formatDate(t.createdAt)}</td>
                                <td className="p-2 text-black">{money(t.amount)}</td>
                                <td className="p-2 text-black capitalize">{t.type}</td>
                                <td className="p-2 text-black capitalize">{t.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({length: totalPages}, (_, i) => (
              <button
                key={i+1}
                onClick={() => setCurrentPage(i+1)}
                className={`px-3 py-1 rounded font-semibold ${currentPage === i+1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
              >
                {i+1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 