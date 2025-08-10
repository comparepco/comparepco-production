-- Migration: Fix RLS policies to use correct user metadata field
-- The role is stored in user_metadata, not raw_user_meta_data

-- Drop existing policies
DROP POLICY IF EXISTS "Partners are viewable by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be inserted by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be updated by admins" ON public.partners;
DROP POLICY IF EXISTS "Partners can be deleted by admins" ON public.partners;
DROP POLICY IF EXISTS "Service role has full access" ON public.partners;

-- Create new policies that use the correct user metadata field
CREATE POLICY "Partners are viewable by authenticated users" ON public.partners
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Partners can be inserted by authenticated users" ON public.partners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Partners can be updated by admins" ON public.partners
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'user_metadata' IS NOT NULL AND
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('SUPER_ADMIN', 'ADMIN')
    ))
  );

CREATE POLICY "Partners can be deleted by admins" ON public.partners
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'user_metadata' IS NOT NULL AND
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('SUPER_ADMIN', 'ADMIN')
    ))
  );

-- Create a more permissive policy for service role operations
CREATE POLICY "Service role has full access" ON public.partners
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role; 