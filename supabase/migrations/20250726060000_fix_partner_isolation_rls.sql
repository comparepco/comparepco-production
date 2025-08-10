-- Migration: Fix RLS policies for proper partner isolation
-- This migration ensures that partner staff can only see data from their own partner company

-- Enable RLS on all tables that need partner isolation
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Fix vehicles table RLS policies
DROP POLICY IF EXISTS "Partners can view their own vehicle documents" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can update their own vehicle documents" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can insert their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Partners can delete their own vehicles" ON public.vehicles;

CREATE POLICY "Partners can view their own vehicles" ON public.vehicles
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own vehicles
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicles.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can view vehicles from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicles.partner_id 
        AND ps.user_id = auth.uid()
      )
      OR
      -- Admin can view all vehicles
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

CREATE POLICY "Partners can insert their own vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert their own vehicles
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicles.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can insert vehicles for their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicles.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can update their own vehicles" ON public.vehicles
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update their own vehicles
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicles.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can update vehicles from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicles.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can delete their own vehicles" ON public.vehicles
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete their own vehicles
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicles.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can delete vehicles from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicles.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

-- Fix vehicle_documents table RLS policies
DROP POLICY IF EXISTS "Partners can view their own vehicle documents" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Partners can update their own vehicle documents" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Partners can insert their own vehicle documents" ON public.vehicle_documents;
DROP POLICY IF EXISTS "Partners can delete their own vehicle documents" ON public.vehicle_documents;

CREATE POLICY "Partners can view their own vehicle documents" ON public.vehicle_documents
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own vehicle documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicle_documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can view vehicle documents from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicle_documents.partner_id 
        AND ps.user_id = auth.uid()
      )
      OR
      -- Admin can view all vehicle documents
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

CREATE POLICY "Partners can insert their own vehicle documents" ON public.vehicle_documents
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert their own vehicle documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicle_documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can insert vehicle documents for their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicle_documents.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can update their own vehicle documents" ON public.vehicle_documents
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update their own vehicle documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicle_documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can update vehicle documents from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicle_documents.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can delete their own vehicle documents" ON public.vehicle_documents
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete their own vehicle documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = vehicle_documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can delete vehicle documents from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = vehicle_documents.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

-- Fix claims table RLS policies (the previous ones were incorrect)
DROP POLICY IF EXISTS "Partners can view their own claims" ON public.claims;
DROP POLICY IF EXISTS "Partners can insert their own claims" ON public.claims;
DROP POLICY IF EXISTS "Partners can update their own claims" ON public.claims;

CREATE POLICY "Partners can view their own claims" ON public.claims
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own claims
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = claims.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can view claims from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = claims.partner_id 
        AND ps.user_id = auth.uid()
      )
      OR
      -- Admin can view all claims
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

CREATE POLICY "Partners can insert their own claims" ON public.claims
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert their own claims
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = claims.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can insert claims for their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = claims.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can update their own claims" ON public.claims
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update their own claims
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = claims.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can update claims from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = claims.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

-- Add RLS policies for bookings table
DROP POLICY IF EXISTS "Partners can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Partners can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Partners can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Partners can delete their own bookings" ON public.bookings;

CREATE POLICY "Partners can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own bookings
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = bookings.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can view bookings from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = bookings.partner_id 
        AND ps.user_id = auth.uid()
      )
      OR
      -- Admin can view all bookings
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

CREATE POLICY "Partners can insert their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert their own bookings
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = bookings.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can insert bookings for their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = bookings.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can update their own bookings" ON public.bookings
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update their own bookings
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = bookings.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can update bookings from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = bookings.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can delete their own bookings" ON public.bookings
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete their own bookings
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = bookings.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can delete bookings from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = bookings.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

-- Add RLS policies for documents table
DROP POLICY IF EXISTS "Partners can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Partners can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Partners can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Partners can delete their own documents" ON public.documents;

CREATE POLICY "Partners can view their own documents" ON public.documents
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can view documents from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = documents.partner_id 
        AND ps.user_id = auth.uid()
      )
      OR
      -- Admin can view all documents
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

CREATE POLICY "Partners can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert their own documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can insert documents for their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = documents.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can update their own documents" ON public.documents
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update their own documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can update documents from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = documents.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Partners can delete their own documents" ON public.documents
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete their own documents
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = documents.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Partner staff can delete documents from their partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = documents.partner_id 
        AND ps.user_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Partners can view their own vehicles" ON public.vehicles IS 'Allows partners and their staff to view vehicles from their own company only';
COMMENT ON POLICY "Partners can insert their own vehicles" ON public.vehicles IS 'Allows partners and their staff to insert vehicles for their own company only';
COMMENT ON POLICY "Partners can update their own vehicles" ON public.vehicles IS 'Allows partners and their staff to update vehicles from their own company only';
COMMENT ON POLICY "Partners can delete their own vehicles" ON public.vehicles IS 'Allows partners and their staff to delete vehicles from their own company only';

COMMENT ON POLICY "Partners can view their own vehicle documents" ON public.vehicle_documents IS 'Allows partners and their staff to view vehicle documents from their own company only';
COMMENT ON POLICY "Partners can insert their own vehicle documents" ON public.vehicle_documents IS 'Allows partners and their staff to insert vehicle documents for their own company only';
COMMENT ON POLICY "Partners can update their own vehicle documents" ON public.vehicle_documents IS 'Allows partners and their staff to update vehicle documents from their own company only';
COMMENT ON POLICY "Partners can delete their own vehicle documents" ON public.vehicle_documents IS 'Allows partners and their staff to delete vehicle documents from their own company only';

COMMENT ON POLICY "Partners can view their own claims" ON public.claims IS 'Allows partners and their staff to view claims from their own company only';
COMMENT ON POLICY "Partners can insert their own claims" ON public.claims IS 'Allows partners and their staff to insert claims for their own company only';
COMMENT ON POLICY "Partners can update their own claims" ON public.claims IS 'Allows partners and their staff to update claims from their own company only';

COMMENT ON POLICY "Partners can view their own bookings" ON public.bookings IS 'Allows partners and their staff to view bookings from their own company only';
COMMENT ON POLICY "Partners can insert their own bookings" ON public.bookings IS 'Allows partners and their staff to insert bookings for their own company only';
COMMENT ON POLICY "Partners can update their own bookings" ON public.bookings IS 'Allows partners and their staff to update bookings from their own company only';
COMMENT ON POLICY "Partners can delete their own bookings" ON public.bookings IS 'Allows partners and their staff to delete bookings from their own company only';

COMMENT ON POLICY "Partners can view their own documents" ON public.documents IS 'Allows partners and their staff to view documents from their own company only';
COMMENT ON POLICY "Partners can insert their own documents" ON public.documents IS 'Allows partners and their staff to insert documents for their own company only';
COMMENT ON POLICY "Partners can update their own documents" ON public.documents IS 'Allows partners and their staff to update documents from their own company only';
COMMENT ON POLICY "Partners can delete their own documents" ON public.documents IS 'Allows partners and their staff to delete documents from their own company only'; 