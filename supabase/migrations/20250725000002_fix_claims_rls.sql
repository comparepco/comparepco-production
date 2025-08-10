-- Migration: Fix RLS policies for claims table
-- This migration updates the RLS policies to ensure partners and partner staff can access their claims.

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Partners can view their own claims" ON public.claims;
DROP POLICY IF EXISTS "Partners can insert their own claims" ON public.claims;
DROP POLICY IF EXISTS "Partners can update their own claims" ON public.claims;

-- Policy for partners to view their own claims
CREATE POLICY "Partners can view their own claims" ON public.claims
  FOR SELECT USING (
    (auth.role() = 'authenticated' AND partner_id = auth.uid())
    -- OR (auth.role() = 'authenticated' AND EXISTS (
    --   SELECT 1 FROM public.partners WHERE id = partner_id AND auth.uid() = ANY(staff_ids)
    -- ))
  );

-- Policy for partners to insert their own claims
CREATE POLICY "Partners can insert their own claims" ON public.claims
  FOR INSERT WITH CHECK (
    (auth.role() = 'authenticated' AND partner_id = auth.uid())
    -- OR (auth.role() = 'authenticated' AND EXISTS (
    --   SELECT 1 FROM public.partners WHERE id = partner_id AND auth.uid() = ANY(staff_ids)
    -- ))
  );

-- Policy for partners to update their own claims
CREATE POLICY "Partners can update their own claims" ON public.claims
  FOR UPDATE USING (
    (auth.role() = 'authenticated' AND partner_id = auth.uid())
    -- OR (auth.role() = 'authenticated' AND EXISTS (
    --   SELECT 1 FROM public.partners WHERE id = partner_id AND auth.uid() = ANY(staff_ids)
    -- ))
  ); 