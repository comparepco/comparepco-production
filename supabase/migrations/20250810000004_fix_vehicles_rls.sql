-- Fix RLS policies on vehicles table to prevent infinite recursion
-- The issue is caused by circular references in RLS policies

-- First, disable RLS temporarily to stop the recursion
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Partners can view their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can insert their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can update their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can delete their own vehicles" ON public.vehicles;

-- Re-enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create simplified, non-recursive policies
CREATE POLICY "Vehicles view policy" ON public.vehicles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own vehicles (using direct user_id check)
      vehicles.partner_id = auth.uid()
      OR
      -- Admin can view all vehicles
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
      OR
      -- Public vehicles are viewable by all authenticated users
      vehicles.visible_on_platform = true
    )
  );

CREATE POLICY "Vehicles insert policy" ON public.vehicles
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert vehicles for their company
      vehicles.partner_id = auth.uid()
      OR
      -- Admin can insert vehicles for any partner
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Vehicles update policy" ON public.vehicles
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update vehicles for their company
      vehicles.partner_id = auth.uid()
      OR
      -- Admin can update any vehicles
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Vehicles delete policy" ON public.vehicles
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete vehicles for their company
      vehicles.partner_id = auth.uid()
      OR
      -- Admin can delete any vehicles
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

-- Also fix the partners table RLS to prevent circular references
ALTER TABLE public.partners DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Partners are viewable by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be inserted by authenticated users" ON public.partners;
DROP POLICY IF EXISTS "Partners can be updated by admins" ON public.partners;
DROP POLICY IF EXISTS "Partners can be deleted by admins" ON public.partners;
DROP POLICY IF EXISTS "Service role has full access" ON public.partners;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners view policy" ON public.partners
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own record
      partners.id = auth.uid()
      OR
      -- Admin can view all partners
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Partners insert policy" ON public.partners
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert their own record
      partners.id = auth.uid()
      OR
      -- Admin can insert partners
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Partners update policy" ON public.partners
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update their own record
      partners.id = auth.uid()
      OR
      -- Admin can update any partner
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Partners delete policy" ON public.partners
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete their own record
      partners.id = auth.uid()
      OR
      -- Admin can delete any partner
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

-- Add comments to document the fix
COMMENT ON TABLE public.vehicles IS 'Vehicles table with fixed RLS policies to prevent infinite recursion';
COMMENT ON TABLE public.partners IS 'Partners table with fixed RLS policies to prevent infinite recursion'; 