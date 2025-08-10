'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentSummaryPage({ params }: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  // Unwrap params if it's a Promise (Next.js 15+)
  const resolvedParams = typeof (params as any)?.then === 'function' ? use(params as any) : params;
  const bookingId = (resolvedParams as any).id;

  const [booking, setBooking] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDirectDebitSetup, setShowDirectDebitSetup] = useState(false);
  const [showBankTransfer, setShowBankTransfer] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);
  const [sendingPayment, setSendingPayment] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [instructionId, setInstructionId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Pricing helpers – support sale prices coming from multiple possible fields
  // -------------------------------------------------------------------------
  const salePrice = booking?.sale_price_per_week ?? booking?.salePricePerWeek ?? booking?.car?.sale_price_per_week ?? booking?.car?.salePricePerWeek ?? booking?.carInfo?.salePricePerWeek;
  const regularPrice = booking?.price_per_week ?? booking?.pricePerWeek ?? booking?.weekly_rate ?? booking?.weeklyRate ?? booking?.car?.price_per_week ?? booking?.car?.pricePerWeek ?? booking?.carInfo?.weekly_rate ?? booking?.carInfo?.weeklyRate ?? 0;
  const showSale = salePrice !== undefined && salePrice !== null && salePrice < regularPrice;
  const weeklyAmount = showSale ? salePrice : regularPrice;
  const totalWeeks = booking?.weeks || booking?.totalWeeks || booking?.bookingDetails?.totalWeeks || 1;
  const totalAmount = weeklyAmount * totalWeeks;
  const vehicleLabel = booking?.vehicle?.licensePlate || booking?.carInfo?.licensePlate || booking?.car?.registrationNumber || booking?.carPlate || 'vehicle';

  // Payment method logic
  const partnerAllowsBoth = partner?.allowDirectDebit && partner?.bankDetails;
  const partnerDirectDebitOnly = partner?.allowDirectDebit && !partner?.bankDetails;
  const partnerBankTransferOnly = !partner?.allowDirectDebit && partner?.bankDetails;
  const partnerFirstTransferThenDirectDebit = partner?.firstTransferThenDirectDebit;

  // Step-by-step instructions
  let instructions = '';
  if (partnerFirstTransferThenDirectDebit) {
    instructions = `You must pay the first week's amount (£${weeklyAmount}) by bank transfer. After the first payment, you will be prompted to set up direct debit for future payments.`;
  } else if (partnerAllowsBoth) {
    instructions = 'You can choose to pay by bank transfer or set up direct debit for weekly payments.';
  } else if (partnerDirectDebitOnly) {
    instructions = 'This partner only accepts direct debit. You must set up a direct debit mandate for weekly payments.';
  } else if (partnerBankTransferOnly) {
    instructions = 'This partner only accepts bank transfer. You must transfer the weekly amount to the partner account and click Mark Sent.';
  }

  useEffect(() => {
    const load = async () => {
      if (!bookingId) return;
      try {
        // Fetch booking with related car & partner in one go
        const { data: bookingData, error: bookingErr } = await supabase
          .from('bookings')
          .select(`*, car:vehicles(*), partner:partners(*)`)
          .eq('id', bookingId)
          .single();

        if (bookingErr || !bookingData) {
          setError('Booking not found');
          setLoading(false);
          return;
        }

        setBooking(bookingData);
        if (bookingData.partner) setPartner(bookingData.partner);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [bookingId]);

  const handleSelectMethod = async (method: 'bank_transfer' | 'direct_debit') => {
    if (!booking) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/create-weekly-instruction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, method }),
      });
      if (!res.ok) throw new Error('Failed to create payment instruction');
      router.push(`/driver/bookings/${booking.id}`); // back to booking details
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaymentSent = async () => {
    if (!booking || !user) return;
    setSendingPayment(true);
    setSentMessage('');
    try {
      let instrId = instructionId;
      if (!instrId) {
        // create instruction first
        const resCreate = await fetch('/api/payments/create-weekly-instruction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id, method: 'bank_transfer' }),
        });
        if (!resCreate.ok) throw new Error('Failed to create payment instruction');
        const dataCreate = await resCreate.json();
        instrId = dataCreate.instructionId;
        setInstructionId(instrId);
      }

      // mark weekly payment sent
      const markWeekly = fetch('/api/payments/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId: instrId, driverId: user.id }),
      });

      // if deposit required and not yet sent, mark deposit sent as well
      const markDeposit = (booking?.deposit?.required && booking?.deposit?.instructionId && booking?.deposit?.status!=='sent') ? fetch('/api/payments/mark-sent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId: booking.deposit.instructionId, driverId: user.id }),
      }) : null;

      const results = await Promise.all([markWeekly, markDeposit].filter(Boolean) as Promise<Response>[]);
      const failed = results.find(r=>!r.ok);
      if (failed) {
        const errRes = await failed.json();
        throw new Error(errRes.error || 'Failed to mark payment');
      }

      setPaymentSent(true);
      setSentMessage('Payment marked as sent. Awaiting partner confirmation.');
    } catch (e: any) {
      setSentMessage(`Failed: ${e.message}`);
    } finally {
      setSendingPayment(false);
    }
  };

  // after booking and partner fetched:
  const depositRequired = booking?.deposit?.required;
  const depositStatus = booking?.deposit?.status;
  const depositAmount = booking?.deposit?.amount || 0;
  const depositInstructionId = booking?.deposit?.instructionId || null;

  // Fetch deposit instruction status if needed
  const [depositInst, setDepositInst] = useState<any>(null);
  useEffect(()=>{
    const fetchDep = async () => {
      if (!depositInstructionId) return;
      const { data, error } = await supabase
        .from('payment_instructions')
        .select('*')
        .eq('id', depositInstructionId)
        .single();
      if (!error && data) setDepositInst(data);
    };
    fetchDep();
  },[depositInstructionId]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-16 w-16 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white shadow rounded p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Weekly Payment Setup</h1>
        <p className="mb-2 text-gray-900">You have booked vehicle <span className="font-medium">{vehicleLabel}</span>.</p>
        <p className="mb-2 text-gray-900">Weekly amount due: <span className="font-semibold text-blue-600">
          {showSale ? (
            <>
              <span className="text-gray-400 line-through mr-2">£{Math.round(regularPrice)}</span>
              <span className="text-red-600 font-bold">£{Math.round(salePrice as number)}</span>
            </>
          ) : (
            <>£{weeklyAmount}</>
          )}
        </span></p>
        <p className="mb-2 text-gray-900">Total for {totalWeeks} weeks: <span className="font-semibold text-blue-600">£{totalAmount}</span></p>
        {depositRequired && (
          <div className="mb-6 border rounded p-3 bg-yellow-50 text-gray-900">
            <p className="font-medium">This vehicle requires a refundable deposit of <span className="font-semibold">£{depositAmount}</span>.</p>
            {depositInst?.status==='sent' && (
              <p className="text-blue-700 mt-1">Deposit marked sent. Awaiting partner confirmation…</p>
            )}
          </div>
        )}
        {partner?.bankDetails && (
          <div className="mb-6 border rounded p-4 bg-gray-50 text-gray-900">
            <h2 className="font-semibold mb-2">Partner Bank Details (for bank transfer)</h2>
            <p><span className="font-medium">Account Name:</span> {partner.bankDetails.accountName}</p>
            <p><span className="font-medium">Account Number:</span> {partner.bankDetails.accountNumber}</p>
            <p><span className="font-medium">Sort Code:</span> {partner.bankDetails.sortCode}</p>
            {partner.bankDetails.bankName && <p><span className="font-medium">Bank:</span> {partner.bankDetails.bankName}</p>}
          </div>
        )}
        <div className="space-y-4">
          {partnerFirstTransferThenDirectDebit ? (
            <>
              {!showDirectDebitSetup && (
                <button
                  onClick={async () => {
                    await handleSelectMethod('bank_transfer');
                    setShowDirectDebitSetup(true);
                  }}
                  disabled={submitting}
                  className="w-full py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  I will pay the first week by Bank Transfer
                </button>
              )}
              {showDirectDebitSetup && (
                <button
                  onClick={async () => {
                    await handleSelectMethod('direct_debit');
                  }}
                  disabled={submitting}
                  className="w-full py-3 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  Set up Direct Debit for future payments
                </button>
              )}
            </>
          ) : partnerAllowsBoth ? (
            <>
              <button
                onClick={() => handleSelectMethod('bank_transfer')}
                disabled={submitting}
                className="w-full py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                I will pay via Bank Transfer weekly
              </button>
              <button
                onClick={() => handleSelectMethod('direct_debit')}
                disabled={submitting}
                className="w-full py-3 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                Partner will collect via Direct Debit weekly
              </button>
            </>
          ) : partnerDirectDebitOnly ? (
            <button
              onClick={() => handleSelectMethod('direct_debit')}
              disabled={submitting}
              className="w-full py-3 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              Set up Direct Debit for weekly payments
            </button>
          ) : partnerBankTransferOnly && !paymentSent && (
            <button
              onClick={handleMarkPaymentSent}
              disabled={sendingPayment}
              className="w-full py-3 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 mt-4"
            >
              {sendingPayment ? 'Marking as Sent...' : 'Mark Payment Sent'}
            </button>
          )}
          {sentMessage && <div className="mt-2 text-green-700">{sentMessage}</div>}
        </div>
        {paymentSent && (
          <div className="mt-6 bg-green-50 border border-green-200 p-4 rounded text-sm text-green-900">
            <p className="font-medium mb-2">Next Steps</p>
            <p className="mb-1">• Remember: You need to transfer <strong>£{weeklyAmount}</strong> <strong>every week</strong> and then click <em>Mark Payment Sent</em>.</p>
            <p className="mb-1">• You can do this from the <a href="/driver/payments" className="text-blue-700 underline">Payments</a> tab or by opening this booking again.</p>
            <p>• If a payment becomes overdue, your booking may be paused. Please pay promptly to avoid interruptions.</p>
          </div>
        )}
      </div>
    </div>
  );
} 