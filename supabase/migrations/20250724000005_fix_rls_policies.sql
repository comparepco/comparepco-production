-- Migration: Fix RLS policies for partners table
-- Ensure admins can perform all operations on partners

-- Drop existing policies
DROP POLICY IF EXISTS "Partners are viewable by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be inserted by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be updated by the partner or admin" ON public.partners;
DROP POLICY IF EXISTS "Partners can be deleted by admin" ON public.partners;

-- Create new policies that properly handle admin permissions
CREATE POLICY "Partners are viewable by authenticated users" ON public.partners
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Partners can be inserted by authenticated users" ON public.partners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Partners can be updated by admins" ON public.partners
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN') OR
        auth.users.email IN (
          SELECT email FROM auth.users 
          WHERE raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
        )
      )
    )
  );

CREATE POLICY "Partners can be deleted by admins" ON public.partners
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN') OR
        auth.users.email IN (
          SELECT email FROM auth.users 
          WHERE raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
        )
      )
    )
  );

-- Also create a more permissive policy for service role operations
CREATE POLICY "Service role has full access" ON public.partners
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions to authenticated users
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role; 