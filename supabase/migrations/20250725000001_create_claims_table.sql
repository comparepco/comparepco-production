-- Migration: Create claims table for vehicle claims management
-- Run using Supabase CLI or apply via dashboard

-- Claims table
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  car_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'need_info', 'closed')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add RLS policies for claims table
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Policy for partners to view their own claims
CREATE POLICY "Partners can view their own claims" ON public.claims
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE id = auth.uid()
      UNION
      SELECT partner_id FROM public.partners WHERE id = auth.uid()
    )
  );

-- Policy for partners to insert their own claims
CREATE POLICY "Partners can insert their own claims" ON public.claims
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partners WHERE id = auth.uid()
      UNION
      SELECT partner_id FROM public.partners WHERE id = auth.uid()
    )
  );

-- Policy for partners to update their own claims
CREATE POLICY "Partners can update their own claims" ON public.claims
  FOR UPDATE USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE id = auth.uid()
      UNION
      SELECT partner_id FROM public.partners WHERE id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.claims TO authenticated; 