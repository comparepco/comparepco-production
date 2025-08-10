-- Migration: Enhance partner_staff table with additional fields
-- This migration adds more comprehensive fields for staff management

-- Add additional columns to partner_staff table
ALTER TABLE public.partner_staff 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Operations',
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_partner_staff_department ON public.partner_staff(department);
CREATE INDEX IF NOT EXISTS idx_partner_staff_start_date ON public.partner_staff(start_date);
CREATE INDEX IF NOT EXISTS idx_partner_staff_last_login ON public.partner_staff(last_login);

-- Add comments for new columns
COMMENT ON COLUMN public.partner_staff.department IS 'Department the staff member belongs to';
COMMENT ON COLUMN public.partner_staff.position IS 'Job position/title';
COMMENT ON COLUMN public.partner_staff.start_date IS 'Employment start date';
COMMENT ON COLUMN public.partner_staff.salary IS 'Annual salary in GBP';
COMMENT ON COLUMN public.partner_staff.address IS 'Staff member address';
COMMENT ON COLUMN public.partner_staff.emergency_contact_name IS 'Emergency contact name';
COMMENT ON COLUMN public.partner_staff.emergency_contact_phone IS 'Emergency contact phone';
COMMENT ON COLUMN public.partner_staff.emergency_contact_relationship IS 'Relationship to emergency contact';
COMMENT ON COLUMN public.partner_staff.notes IS 'Additional notes about the staff member';
COMMENT ON COLUMN public.partner_staff.last_login IS 'Last login timestamp';
COMMENT ON COLUMN public.partner_staff.login_count IS 'Total number of logins';

-- Create function to update last login
CREATE OR REPLACE FUNCTION update_staff_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login = timezone('utc', now());
  NEW.login_count = COALESCE(NEW.login_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for login tracking (this will be called from application logic)
-- CREATE TRIGGER update_staff_last_login_trigger
--   BEFORE UPDATE ON public.partner_staff
--   FOR EACH ROW
--   WHEN (OLD.last_login IS DISTINCT FROM NEW.last_login)
--   EXECUTE FUNCTION update_staff_last_login();

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Partner staff are viewable by partner and staff" ON public.partner_staff;
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

-- Update insert policy
DROP POLICY IF EXISTS "Partner can insert their own staff" ON public.partner_staff;
CREATE POLICY "Partner can insert their own staff" ON public.partner_staff
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_staff.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Update update policy
DROP POLICY IF EXISTS "Partner can update their own staff" ON public.partner_staff;
CREATE POLICY "Partner can update their own staff" ON public.partner_staff
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_staff.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Update delete policy
DROP POLICY IF EXISTS "Partner can delete their own staff" ON public.partner_staff;
CREATE POLICY "Partner can delete their own staff" ON public.partner_staff
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_staff.partner_id 
      AND partners.user_id = auth.uid()
    )
  ); 