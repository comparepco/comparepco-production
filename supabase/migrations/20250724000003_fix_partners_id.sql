-- Migration: Fix partners table ID column to auto-generate UUIDs
-- Ensure the id column is properly set up for auto-generation

-- Drop the existing partners table if it exists and recreate with proper structure
DROP TABLE IF EXISTS public.partners CASCADE;

-- Recreate partners table with proper structure
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  business_email TEXT,
  director_name TEXT,
  director_email TEXT,
  director_phone TEXT,
  address TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'UK',
  postal_code TEXT,
  website TEXT,
  description TEXT,
  logo TEXT,
  tax_id TEXT,
  company_registration_number TEXT,
  vat_number TEXT,
  business_type TEXT DEFAULT 'transport_company',
  verification_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  commission_rate NUMERIC DEFAULT 15,
  total_earnings NUMERIC DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  fleet_size INTEGER DEFAULT 0,
  current_vehicle_count INTEGER DEFAULT 0,
  max_vehicles INTEGER DEFAULT 0,
  operating_areas TEXT[],
  vehicle_types TEXT[],
  service_areas TEXT[],
  payment_method TEXT,
  bank_details JSONB,
  documents_uploaded TEXT[],
  documents_required TEXT[],
  terms_accepted BOOLEAN DEFAULT false,
  data_processing_consent BOOLEAN DEFAULT false,
  marketing_consent BOOLEAN DEFAULT false,
  can_accept_bookings BOOLEAN DEFAULT false,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approval_comments TEXT,
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by TEXT,
  suspended_at TIMESTAMP WITH TIME ZONE,
  suspended_by TEXT,
  consents JSONB DEFAULT '{}',
  address_json JSONB,
  years_in_business INTEGER DEFAULT 0,
  estimated_vehicle_count INTEGER DEFAULT 0,
  application_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partners_email ON public.partners(email);
CREATE INDEX idx_partners_company_name ON public.partners(company_name);
CREATE INDEX idx_partners_created_at ON public.partners(created_at);
CREATE INDEX idx_partners_user_id ON public.partners(user_id);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Partners are viewable by authenticated users" ON public.partners
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Partners can be inserted by authenticated users" ON public.partners
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Partners can be updated by the partner or admin" ON public.partners
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY "Partners can be deleted by admin" ON public.partners
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
    )
  ); 