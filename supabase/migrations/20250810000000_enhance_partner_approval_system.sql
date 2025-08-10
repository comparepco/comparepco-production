-- Enhance partner approval system
-- Add approval tracking fields to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'documents_requested', 'under_review')),
ADD COLUMN IF NOT EXISTS documents_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_approved BOOLEAN DEFAULT FALSE;

-- Add document approval tracking to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_review' CHECK (approval_status IN ('pending_review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create partner approval policies
DROP POLICY IF EXISTS "Partners can view their own records" ON public.partners;
CREATE POLICY "Partners can view their own records" ON public.partners
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all partners" ON public.partners;
CREATE POLICY "Admins can manage all partners" ON public.partners
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('ADMIN', 'ADMIN_STAFF', 'SUPER_ADMIN')
  )
);

-- Create document approval policies
DROP POLICY IF EXISTS "Partners can view their own documents" ON public.documents;
CREATE POLICY "Partners can view their own documents" ON public.documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE partners.id = documents.partner_id 
    AND partners.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
CREATE POLICY "Admins can manage all documents" ON public.documents
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('ADMIN', 'ADMIN_STAFF', 'SUPER_ADMIN')
  )
);

-- Update existing partners to have proper status
UPDATE public.partners 
SET approval_status = 'pending', 
    status = 'pending' 
WHERE status IS NULL OR status = 'active';

-- Create function to check if partner is fully approved
CREATE OR REPLACE FUNCTION public.is_partner_approved(partner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.partners 
    WHERE id = partner_id 
    AND approval_status = 'approved' 
    AND documents_approved = TRUE 
    AND business_approved = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 