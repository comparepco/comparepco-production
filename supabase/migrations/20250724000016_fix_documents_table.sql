-- Fix documents table to have the correct schema
-- This migration ensures the documents table has all required columns

-- Drop the existing documents table if it exists (it will be recreated with proper schema)
DROP TABLE IF EXISTS public.documents CASCADE;

-- Recreate documents table with proper schema
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('insurance', 'mot', 'registration', 'contract', 'license', 'other')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('business', 'vehicle', 'driver')),
  car_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  car_name VARCHAR(255),
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_name VARCHAR(255),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  expiry_date DATE,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'valid' CHECK (status IN ('valid', 'expiring', 'expired', 'pending_review', 'approved', 'rejected')),
  uploader_name VARCHAR(255),
  uploader_email VARCHAR(255),
  uploader_type VARCHAR(50) CHECK (uploader_type IN ('partner', 'staff')),
  partner_name VARCHAR(255),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_partner_id ON public.documents(partner_id);
CREATE INDEX idx_documents_type ON public.documents(type);
CREATE INDEX idx_documents_category ON public.documents(category);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_car_id ON public.documents(car_id);
CREATE INDEX idx_documents_expiry_date ON public.documents(expiry_date);
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view their own documents" ON public.documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role = 'PARTNER' AND id = partner_id
    )
  );

-- CREATE POLICY "Partner staff can view their partner's documents" ON public.documents
--   FOR SELECT USING (
--     auth.uid() IN (
--       SELECT ps.user_id FROM public.partner_staff ps 
--       WHERE ps.partner_id = documents.partner_id
--     )
--   );

CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Partners can insert their own documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role = 'PARTNER' AND id = partner_id
    )
  );

-- CREATE POLICY "Partner staff can insert documents for their partner" ON public.documents
--   FOR INSERT WITH CHECK (
--     auth.uid() IN (
--       SELECT ps.user_id FROM public.partner_staff ps 
--       WHERE ps.partner_id = documents.partner_id
--     )
--   );

CREATE POLICY "Admins can insert documents" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Partners can update their own documents" ON public.documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role = 'PARTNER' AND id = partner_id
    )
  );

-- CREATE POLICY "Partner staff can update their partner's documents" ON public.documents
--   FOR UPDATE USING (
--     auth.uid() IN (
--       SELECT ps.user_id FROM public.partner_staff ps 
--       WHERE ps.partner_id = documents.partner_id
--     )
--   );

CREATE POLICY "Admins can update all documents" ON public.documents
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Partners can delete their own documents" ON public.documents
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role = 'PARTNER' AND id = partner_id
    )
  );

-- CREATE POLICY "Partner staff can delete their partner's documents" ON public.documents
--   FOR DELETE USING (
--     auth.uid() IN (
--       SELECT ps.user_id FROM public.partner_staff ps 
--       WHERE ps.partner_id = documents.partner_id
--     )
--   );

CREATE POLICY "Admins can delete all documents" ON public.documents
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Create function to calculate document status based on expiry date
CREATE OR REPLACE FUNCTION calculate_document_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiry_date IS NOT NULL THEN
    IF NEW.expiry_date < CURRENT_DATE THEN
      NEW.status = 'expired';
    ELSIF NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
      NEW.status = 'expiring';
    ELSE
      NEW.status = 'valid';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status calculation
CREATE TRIGGER trigger_calculate_document_status
  BEFORE INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION calculate_document_status();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated; 