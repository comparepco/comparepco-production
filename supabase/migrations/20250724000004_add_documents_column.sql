-- Migration: Add documents column to partners table
-- This column will store document information as JSON for the pending approval system

-- Add documents column to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}';

-- Create index for documents column for better query performance
CREATE INDEX IF NOT EXISTS idx_partners_documents ON public.partners USING GIN (documents);

-- Add comment to document the structure
COMMENT ON COLUMN public.partners.documents IS 'JSON object storing document information with structure: {document_type: {status, reviewed_at, reviewed_by, rejection_reason}}'; 