-- Fix documents table schema to ensure car_id column exists
-- This migration ensures the documents table has all required columns

-- Add car_id column if it doesn't exist
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Add car_name column if it doesn't exist  
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS car_name VARCHAR(255);

-- Add other missing columns if they don't exist
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('business', 'vehicle', 'driver'));

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'valid' CHECK (status IN ('valid', 'expiring', 'expired', 'pending_review', 'approved', 'rejected'));

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS expiry_date DATE;

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS uploader_name VARCHAR(255);

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS uploader_email VARCHAR(255);

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS uploader_type VARCHAR(50) CHECK (uploader_type IN ('partner', 'staff'));

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS partner_name VARCHAR(255);

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_documents_car_id ON public.documents(car_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON public.documents(expiry_date);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 