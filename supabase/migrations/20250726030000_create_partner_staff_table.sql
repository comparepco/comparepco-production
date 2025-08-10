-- Migration: Create partner_staff table
-- This table stores staff members associated with partners

-- Create partner_staff table
CREATE TABLE IF NOT EXISTS public.partner_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'assistant',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_partner_staff_partner_id ON public.partner_staff(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_staff_user_id ON public.partner_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_staff_role ON public.partner_staff(role);
CREATE INDEX IF NOT EXISTS idx_partner_staff_is_active ON public.partner_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_staff_created_at ON public.partner_staff(created_at);

-- Enable RLS
ALTER TABLE public.partner_staff ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Partner staff are viewable by partner and staff" ON public.partner_staff
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Partner can view their own staff
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = partner_staff.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Staff can view other staff in same partner
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = partner_staff.partner_id 
        AND ps.user_id = auth.uid()
      )
      OR
      -- Admin can view all
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

CREATE POLICY "Partner can insert their own staff" ON public.partner_staff
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_staff.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Partner can update their own staff" ON public.partner_staff
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_staff.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Partner can delete their own staff" ON public.partner_staff
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_staff.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partner_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_partner_staff_updated_at
  BEFORE UPDATE ON public.partner_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_staff_updated_at();

-- Add comment to document the table
COMMENT ON TABLE public.partner_staff IS 'Stores staff members associated with partners, including their roles and permissions';
COMMENT ON COLUMN public.partner_staff.permissions IS 'JSON object storing staff permissions with structure: {permission_name: boolean}'; 