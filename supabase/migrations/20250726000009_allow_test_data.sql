-- Migration: Allow test data insertion for partners analytics
-- This is temporary for testing purposes

-- Drop existing policies
DROP POLICY IF EXISTS "Partners are viewable by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be inserted by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be updated by the partner or admin" ON public.partners;
DROP POLICY IF EXISTS "Partners can be deleted by admin" ON public.partners;

-- Create more permissive policies for testing
CREATE POLICY "Allow all operations for testing" ON public.partners
  FOR ALL USING (true) WITH CHECK (true);

-- Also allow all operations on bookings and payments for testing
DROP POLICY IF EXISTS "Bookings are viewable by authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Bookings can be inserted by authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Bookings can be updated by the partner or admin" ON public.bookings;
DROP POLICY IF EXISTS "Bookings can be deleted by admin" ON public.bookings;

CREATE POLICY "Allow all operations for testing" ON public.bookings
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Payments are viewable by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments can be inserted by authenticated users" ON public.payments;
DROP POLICY IF EXISTS "Payments can be updated by the partner or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments can be deleted by admin" ON public.payments;

CREATE POLICY "Allow all operations for testing" ON public.payments
  FOR ALL USING (true) WITH CHECK (true); 