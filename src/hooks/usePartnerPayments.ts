import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentInstruction {
  id: string;
  partner_id: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_name: string;
  license_plate: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  reference_number?: string;
  deposit_amount?: number;
  deposit_received_at?: string;
  deposit_received_by?: string;
  // Additional fields needed by the payments page
  booking_id?: string;
  vehicle_reg?: string;
  method?: 'bank_transfer' | 'direct_debit';
  frequency?: 'weekly' | 'one_off';
  type?: 'weekly_rent' | 'deposit' | 'refund' | 'topup' | 'adjustment';
  next_due_date?: any;
  last_sent_at?: any;
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

interface PaymentStats {
  total_instructions: number;
  pending_payments: number;
  completed_payments: number;
  overdue_payments: number;
  total_amount: number;
  total_deposits: number;
}

export const usePartnerPayments = () => {
  const { user } = useAuth();
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstructions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      const response = await fetch(`/api/partner/payments/list?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment instructions');
      }

      const data = await response.json();
      setInstructions(data.instructions || []);
    } catch (err) {
      console.error('Error fetching payment instructions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payment instructions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      if (!user?.id) {
        return;
      }

      const response = await fetch(`/api/partner/payments/stats?userId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment stats');
      }

      const data = await response.json();
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching payment stats:', err);
      // Don't set error for stats as it's not critical
    }
  };

  const reload = () => {
    fetchInstructions();
    fetchStats();
  };

  useEffect(() => {
    if (user?.id) {
      fetchInstructions();
      fetchStats();
    }

    // Set up real-time subscription for payment_instructions table
    const channel = supabase
      .channel('payment_instructions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_instructions'
        },
        () => {
          // Refetch data when any change occurs
          if (user?.id) {
            fetchInstructions();
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    instructions,
    stats,
    loading,
    error,
    reload
  };
}; 