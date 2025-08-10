import { supabase } from './client';

// Basic row types (extend as needed). They match the fields referenced in the UI component
export interface PartnerRow {
  id: string;
  status: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: any;
  documents?: any;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface CarRow {
  id: string;
  partnerId?: string;
  ownerId?: string;
  [key: string]: any;
}

export interface BookingRow {
  id: string;
  partnerId?: string;
  status?: string;
  totalAmount?: number;
  paymentStatus?: string;
  partnerRating?: number;
  rating?: number;
  [key: string]: any;
}

export interface PaymentRow {
  id: string;
  partnerId?: string;
  amount?: number;
  [key: string]: any;
}

export interface DocumentRow {
  id: string;
  uploaderId?: string;
  partnerId?: string;
  userId?: string;
  type?: string;
  status?: string;
  fileUrl?: string;
  uploadDate?: string;
  [key: string]: any;
}

/*
 * Wrapper object that exposes high-level read helpers. Any UI component should call these
 * instead of embedding Supabase queries directly – makes future schema changes trivial.
 */
export const PartnerService = {
  /**
   * Get full list of partners (optionally filtered by status).
   */
  async listPartners(statusFilter?: string): Promise<PartnerRow[]> {
    let query = supabase.from('partners').select('*');
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('listPartners error', error);
      return [];
    }
    return data as PartnerRow[];
  },

  /**
   * Return a Map keyed by partnerId containing all cars for that partner.
   */
  async listCarsMap(): Promise<Map<string, CarRow[]>> {
    const { data, error } = await supabase.from('cars').select('*');
    if (error) {
      console.error('listCarsMap error', error);
      return new Map();
    }
    const map = new Map<string, CarRow[]>();
    (data as CarRow[]).forEach((car) => {
      const partnerId = (car.partnerId || car.ownerId) as string | undefined;
      if (!partnerId) return;
      if (!map.has(partnerId)) map.set(partnerId, []);
      map.get(partnerId)!.push(car);
    });
    return map;
  },

  /** Fetch all bookings (could be large – paginate in production) */
  async listBookings(): Promise<BookingRow[]> {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) {
      console.error('listBookings error', error);
      return [];
    }
    return data as BookingRow[];
  },

  /** Fetch all payments */
  async listPayments(): Promise<PaymentRow[]> {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) {
      console.error('listPayments error', error);
      return [];
    }
    return data as PaymentRow[];
  },

  /** Fetch documents associated with a partner (by partnerId or uploaderId/userId) */
  async listDocumentsForPartner(partnerId: string): Promise<DocumentRow[]> {
    // Try various fields equivalent to the original Firestore queries
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(
        `partnerId.eq.${partnerId},uploaderId.eq.${partnerId},userId.eq.${partnerId}`
      );
    if (error) {
      console.error('listDocumentsForPartner error', error);
      return [];
    }
    return data as DocumentRow[];
  },
}; 