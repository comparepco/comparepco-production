-- Fix infinite recursion issue with partner_staff table
-- The issue is caused by circular references in RLS policies

-- First, disable RLS temporarily to stop the recursion
ALTER TABLE public.partner_staff DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean up
DROP POLICY IF EXISTS "Partner staff are viewable by partner and staff" ON public.partner_staff;
DROP POLICY IF EXISTS "Partner can insert their own staff" ON public.partner_staff;
DROP POLICY IF EXISTS "Partner can update their own staff" ON public.partner_staff;
DROP POLICY IF EXISTS "Partner can delete their own staff" ON public.partner_staff;

-- Re-enable RLS
ALTER TABLE public.partner_staff ENABLE ROW LEVEL SECURITY;

-- Create simplified, non-recursive policies
CREATE POLICY "Partner staff view policy" ON public.partner_staff
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own staff (using direct user_id check)
      partner_staff.partner_id = auth.uid()
      OR
      -- Staff can view their own record
      partner_staff.user_id = auth.uid()
      OR
      -- Admin can view all (using service role check)
      auth.role() = 'service_role'
      OR
      -- Admin users can view all
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Partner staff insert policy" ON public.partner_staff
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert staff for their company
      partner_staff.partner_id = auth.uid()
      OR
      -- Admin can insert staff for any partner
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Partner staff update policy" ON public.partner_staff
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update staff for their company
      partner_staff.partner_id = auth.uid()
      OR
      -- Staff can update their own record
      partner_staff.user_id = auth.uid()
      OR
      -- Admin can update any staff
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Partner staff delete policy" ON public.partner_staff
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete staff for their company
      partner_staff.partner_id = auth.uid()
      OR
      -- Admin can delete any staff
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

-- Also fix the documents table RLS if it's causing issues
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Documents are viewable by partner" ON public.documents;
DROP POLICY IF EXISTS "Documents can be inserted by partner" ON public.documents;
DROP POLICY IF EXISTS "Documents can be updated by partner" ON public.documents;
DROP POLICY IF EXISTS "Documents can be deleted by partner" ON public.documents;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents view policy" ON public.documents
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own documents
      documents.partner_id = auth.uid()
      OR
      -- Admin can view all documents
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Documents insert policy" ON public.documents
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert their own documents
      documents.partner_id = auth.uid()
      OR
      -- Admin can insert documents for any partner
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Documents update policy" ON public.documents
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update their own documents
      documents.partner_id = auth.uid()
      OR
      -- Admin can update any documents
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

CREATE POLICY "Documents delete policy" ON public.documents
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete their own documents
      documents.partner_id = auth.uid()
      OR
      -- Admin can delete any documents
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')
      )
    )
  );

-- Add comments to document the fix
COMMENT ON TABLE public.partner_staff IS 'Partner staff table with fixed RLS policies to prevent infinite recursion';
COMMENT ON TABLE public.documents IS 'Documents table with fixed RLS policies to prevent access issues'; 