-- Migration: Allow authenticated users full access to claims table
-- Timestamp: 20250726010000

-- Ensure RLS is enabled (it may already be)
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- Remove previous restrictive policies if they exist
DROP POLICY IF EXISTS "Partners can view their own claims" ON public.claims;
DROP POLICY IF EXISTS "Partners can insert their own claims" ON public.claims;
DROP POLICY IF EXISTS "Partners can update their own claims" ON public.claims;
DROP POLICY IF EXISTS "authenticated_all_claims" ON public.claims;

-- Create a permissive policy for all authenticated users
CREATE POLICY "authenticated_all_claims" ON public.claims
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure permissions are granted
GRANT SELECT, INSERT, UPDATE, DELETE ON public.claims TO authenticated; 