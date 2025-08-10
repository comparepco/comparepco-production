-- Add missing columns to partners table that the application expects
-- These columns are referenced in the partner forms and views

ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS registration_number TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS documents_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_approved BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN public.partners.registration_number IS 'Company registration number';
COMMENT ON COLUMN public.partners.vat_number IS 'VAT registration number';
COMMENT ON COLUMN public.partners.documents_approved IS 'Whether partner documents have been approved';
COMMENT ON COLUMN public.partners.business_approved IS 'Whether partner business has been approved'; 