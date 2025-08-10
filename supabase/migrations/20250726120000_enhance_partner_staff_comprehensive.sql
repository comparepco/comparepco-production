-- Migration: Comprehensive Partner Staff Enhancement
-- This migration creates a robust partner staff management system

-- Add comprehensive fields to partner_staff table
ALTER TABLE public.partner_staff 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS national_insurance_number TEXT,
ADD COLUMN IF NOT EXISTS driving_license_number TEXT,
ADD COLUMN IF NOT EXISTS driving_license_expiry DATE,
ADD COLUMN IF NOT EXISTS passport_number TEXT,
ADD COLUMN IF NOT EXISTS passport_expiry DATE,
ADD COLUMN IF NOT EXISTS work_permit_number TEXT,
ADD COLUMN IF NOT EXISTS work_permit_expiry DATE,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'permanent' CHECK (contract_type IN ('permanent', 'temporary', 'contractor', 'intern')),
ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active' CHECK (employment_status IN ('active', 'inactive', 'suspended', 'terminated', 'on_leave')),
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS termination_reason TEXT,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.partner_staff(id),
ADD COLUMN IF NOT EXISTS reporting_to UUID REFERENCES public.partner_staff(id),
ADD COLUMN IF NOT EXISTS work_schedule JSONB DEFAULT '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}',
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS overtime_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS holiday_entitlement INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS holiday_taken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sick_days_taken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS last_performance_review DATE,
ADD COLUMN IF NOT EXISTS next_performance_review DATE,
ADD COLUMN IF NOT EXISTS training_completed JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["English"]',
ADD COLUMN IF NOT EXISTS vehicle_assigned UUID REFERENCES public.vehicles(id),
ADD COLUMN IF NOT EXISTS can_drive_vehicles BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS driver_license_categories TEXT[],
ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'pending' CHECK (background_check_status IN ('pending', 'passed', 'failed', 'expired')),
ADD COLUMN IF NOT EXISTS background_check_date DATE,
ADD COLUMN IF NOT EXISTS background_check_expiry DATE,
ADD COLUMN IF NOT EXISTS drug_test_status TEXT DEFAULT 'pending' CHECK (drug_test_status IN ('pending', 'passed', 'failed', 'expired')),
ADD COLUMN IF NOT EXISTS drug_test_date DATE,
ADD COLUMN IF NOT EXISTS drug_test_expiry DATE,
ADD COLUMN IF NOT EXISTS medical_certificate_status TEXT DEFAULT 'pending' CHECK (medical_certificate_status IN ('pending', 'passed', 'failed', 'expired')),
ADD COLUMN IF NOT EXISTS medical_certificate_date DATE,
ADD COLUMN IF NOT EXISTS medical_certificate_expiry DATE,
ADD COLUMN IF NOT EXISTS uniform_size TEXT,
ADD COLUMN IF NOT EXISTS equipment_assigned JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'intermediate', 'advanced', 'admin')),
ADD COLUMN IF NOT EXISTS system_permissions JSONB DEFAULT '{"view_bookings": true, "create_bookings": false, "edit_bookings": false, "delete_bookings": false, "view_vehicles": true, "edit_vehicles": false, "view_reports": true, "create_reports": false, "view_documents": true, "upload_documents": false}',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true, "booking_updates": true, "system_alerts": true, "performance_reviews": true}',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/London',
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS probation_end_date DATE,
ADD COLUMN IF NOT EXISTS probation_passed BOOLEAN,
ADD COLUMN IF NOT EXISTS probation_review_date DATE;

-- Create comprehensive indexes
CREATE INDEX IF NOT EXISTS idx_partner_staff_email ON public.partner_staff(email);
CREATE INDEX IF NOT EXISTS idx_partner_staff_employment_status ON public.partner_staff(employment_status);
CREATE INDEX IF NOT EXISTS idx_partner_staff_contract_type ON public.partner_staff(contract_type);
CREATE INDEX IF NOT EXISTS idx_partner_staff_manager_id ON public.partner_staff(manager_id);
CREATE INDEX IF NOT EXISTS idx_partner_staff_vehicle_assigned ON public.partner_staff(vehicle_assigned);
CREATE INDEX IF NOT EXISTS idx_partner_staff_can_drive_vehicles ON public.partner_staff(can_drive_vehicles);
CREATE INDEX IF NOT EXISTS idx_partner_staff_background_check_status ON public.partner_staff(background_check_status);
CREATE INDEX IF NOT EXISTS idx_partner_staff_drug_test_status ON public.partner_staff(drug_test_status);
CREATE INDEX IF NOT EXISTS idx_partner_staff_medical_certificate_status ON public.partner_staff(medical_certificate_status);
CREATE INDEX IF NOT EXISTS idx_partner_staff_access_level ON public.partner_staff(access_level);
CREATE INDEX IF NOT EXISTS idx_partner_staff_onboarding_completed ON public.partner_staff(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_partner_staff_probation_end_date ON public.partner_staff(probation_end_date);
CREATE INDEX IF NOT EXISTS idx_partner_staff_created_at ON public.partner_staff(created_at DESC);

-- Create function to automatically set updated_by
CREATE OR REPLACE FUNCTION update_partner_staff_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_by
CREATE TRIGGER update_partner_staff_updated_by_trigger
  BEFORE UPDATE ON public.partner_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_staff_updated_by();

-- Create function to set created_by on insert
CREATE OR REPLACE FUNCTION set_partner_staff_created_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for created_by
CREATE TRIGGER set_partner_staff_created_by_trigger
  BEFORE INSERT ON public.partner_staff
  FOR EACH ROW
  EXECUTE FUNCTION set_partner_staff_created_by();

-- Create function to check if staff can be assigned to vehicles
CREATE OR REPLACE FUNCTION check_staff_vehicle_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow vehicle assignment if staff can drive vehicles
  IF NEW.vehicle_assigned IS NOT NULL AND NOT NEW.can_drive_vehicles THEN
    RAISE EXCEPTION 'Staff member must have driving permission to be assigned a vehicle';
  END IF;
  
  -- Check if vehicle is available (not assigned to another active staff)
  IF NEW.vehicle_assigned IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.partner_staff 
      WHERE vehicle_assigned = NEW.vehicle_assigned 
      AND id != NEW.id 
      AND employment_status = 'active'
    ) THEN
      RAISE EXCEPTION 'Vehicle is already assigned to another active staff member';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicle assignment validation
CREATE TRIGGER check_staff_vehicle_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.partner_staff
  FOR EACH ROW
  EXECUTE FUNCTION check_staff_vehicle_assignment();

-- Create function to update holiday entitlement
CREATE OR REPLACE FUNCTION update_holiday_entitlement()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate holiday entitlement based on start date and contract type
  IF NEW.start_date IS NOT NULL AND NEW.contract_type = 'permanent' THEN
    -- Full time permanent staff get 25 days
    NEW.holiday_entitlement = 25;
  ELSIF NEW.contract_type = 'temporary' THEN
    -- Temporary staff get pro-rated holiday
    NEW.holiday_entitlement = 20;
  ELSIF NEW.contract_type = 'contractor' THEN
    -- Contractors typically don't get holiday entitlement
    NEW.holiday_entitlement = 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for holiday entitlement
CREATE TRIGGER update_holiday_entitlement_trigger
  BEFORE INSERT OR UPDATE ON public.partner_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_holiday_entitlement();

-- Create function to check document expiry dates
CREATE OR REPLACE FUNCTION check_document_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Check driving license expiry
  IF NEW.driving_license_expiry IS NOT NULL AND NEW.driving_license_expiry < CURRENT_DATE THEN
    NEW.can_drive_vehicles = false;
  END IF;
  
  -- Check background check expiry
  IF NEW.background_check_expiry IS NOT NULL AND NEW.background_check_expiry < CURRENT_DATE THEN
    NEW.background_check_status = 'expired';
  END IF;
  
  -- Check drug test expiry
  IF NEW.drug_test_expiry IS NOT NULL AND NEW.drug_test_expiry < CURRENT_DATE THEN
    NEW.drug_test_status = 'expired';
  END IF;
  
  -- Check medical certificate expiry
  IF NEW.medical_certificate_expiry IS NOT NULL AND NEW.medical_certificate_expiry < CURRENT_DATE THEN
    NEW.medical_certificate_status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document expiry checks
CREATE TRIGGER check_document_expiry_trigger
  BEFORE INSERT OR UPDATE ON public.partner_staff
  FOR EACH ROW
  EXECUTE FUNCTION check_document_expiry();

-- Add comprehensive comments
COMMENT ON TABLE public.partner_staff IS 'Comprehensive partner staff management system';
COMMENT ON COLUMN public.partner_staff.first_name IS 'Staff member first name';
COMMENT ON COLUMN public.partner_staff.last_name IS 'Staff member last name';
COMMENT ON COLUMN public.partner_staff.email IS 'Staff member email address';
COMMENT ON COLUMN public.partner_staff.phone IS 'Staff member phone number';
COMMENT ON COLUMN public.partner_staff.date_of_birth IS 'Staff member date of birth';
COMMENT ON COLUMN public.partner_staff.national_insurance_number IS 'UK National Insurance number';
COMMENT ON COLUMN public.partner_staff.driving_license_number IS 'UK driving license number';
COMMENT ON COLUMN public.partner_staff.driving_license_expiry IS 'Driving license expiry date';
COMMENT ON COLUMN public.partner_staff.passport_number IS 'Passport number for international work';
COMMENT ON COLUMN public.partner_staff.passport_expiry IS 'Passport expiry date';
COMMENT ON COLUMN public.partner_staff.work_permit_number IS 'Work permit number for non-UK staff';
COMMENT ON COLUMN public.partner_staff.work_permit_expiry IS 'Work permit expiry date';
COMMENT ON COLUMN public.partner_staff.contract_type IS 'Type of employment contract';
COMMENT ON COLUMN public.partner_staff.employment_status IS 'Current employment status';
COMMENT ON COLUMN public.partner_staff.end_date IS 'Employment end date';
COMMENT ON COLUMN public.partner_staff.termination_reason IS 'Reason for termination if applicable';
COMMENT ON COLUMN public.partner_staff.manager_id IS 'Direct manager ID';
COMMENT ON COLUMN public.partner_staff.reporting_to IS 'Person this staff reports to';
COMMENT ON COLUMN public.partner_staff.work_schedule IS 'JSON object with weekly work schedule';
COMMENT ON COLUMN public.partner_staff.hourly_rate IS 'Hourly pay rate in GBP';
COMMENT ON COLUMN public.partner_staff.overtime_rate IS 'Overtime pay rate in GBP';
COMMENT ON COLUMN public.partner_staff.holiday_entitlement IS 'Annual holiday entitlement in days';
COMMENT ON COLUMN public.partner_staff.holiday_taken IS 'Holiday days taken this year';
COMMENT ON COLUMN public.partner_staff.sick_days_taken IS 'Sick days taken this year';
COMMENT ON COLUMN public.partner_staff.performance_rating IS 'Performance rating (0.00-5.00)';
COMMENT ON COLUMN public.partner_staff.last_performance_review IS 'Date of last performance review';
COMMENT ON COLUMN public.partner_staff.next_performance_review IS 'Date of next performance review';
COMMENT ON COLUMN public.partner_staff.training_completed IS 'JSON array of completed training courses';
COMMENT ON COLUMN public.partner_staff.certifications IS 'JSON array of professional certifications';
COMMENT ON COLUMN public.partner_staff.skills IS 'JSON array of skills and competencies';
COMMENT ON COLUMN public.partner_staff.languages IS 'JSON array of spoken languages';
COMMENT ON COLUMN public.partner_staff.vehicle_assigned IS 'Vehicle assigned to this staff member';
COMMENT ON COLUMN public.partner_staff.can_drive_vehicles IS 'Whether staff can drive company vehicles';
COMMENT ON COLUMN public.partner_staff.driver_license_categories IS 'Array of driving license categories';
COMMENT ON COLUMN public.partner_staff.background_check_status IS 'Status of background check';
COMMENT ON COLUMN public.partner_staff.background_check_date IS 'Date background check was completed';
COMMENT ON COLUMN public.partner_staff.background_check_expiry IS 'Background check expiry date';
COMMENT ON COLUMN public.partner_staff.drug_test_status IS 'Status of drug test';
COMMENT ON COLUMN public.partner_staff.drug_test_date IS 'Date drug test was completed';
COMMENT ON COLUMN public.partner_staff.drug_test_expiry IS 'Drug test expiry date';
COMMENT ON COLUMN public.partner_staff.medical_certificate_status IS 'Status of medical certificate';
COMMENT ON COLUMN public.partner_staff.medical_certificate_date IS 'Date medical certificate was completed';
COMMENT ON COLUMN public.partner_staff.medical_certificate_expiry IS 'Medical certificate expiry date';
COMMENT ON COLUMN public.partner_staff.uniform_size IS 'Uniform size for company uniform';
COMMENT ON COLUMN public.partner_staff.equipment_assigned IS 'JSON array of equipment assigned to staff';
COMMENT ON COLUMN public.partner_staff.access_level IS 'System access level for partner portal';
COMMENT ON COLUMN public.partner_staff.system_permissions IS 'JSON object with specific system permissions';
COMMENT ON COLUMN public.partner_staff.notification_preferences IS 'JSON object with notification preferences';
COMMENT ON COLUMN public.partner_staff.timezone IS 'Staff member timezone';
COMMENT ON COLUMN public.partner_staff.preferred_language IS 'Preferred language for system interface';
COMMENT ON COLUMN public.partner_staff.profile_picture_url IS 'URL to staff profile picture';
COMMENT ON COLUMN public.partner_staff.signature_url IS 'URL to staff digital signature';
COMMENT ON COLUMN public.partner_staff.created_by IS 'User who created this staff record';
COMMENT ON COLUMN public.partner_staff.updated_by IS 'User who last updated this staff record';
COMMENT ON COLUMN public.partner_staff.approved_by IS 'User who approved this staff member';
COMMENT ON COLUMN public.partner_staff.approved_at IS 'Date and time when staff was approved';
COMMENT ON COLUMN public.partner_staff.onboarding_completed IS 'Whether onboarding process is completed';
COMMENT ON COLUMN public.partner_staff.onboarding_completion_date IS 'Date onboarding was completed';
COMMENT ON COLUMN public.partner_staff.probation_end_date IS 'End date of probation period';
COMMENT ON COLUMN public.partner_staff.probation_passed IS 'Whether probation period was passed';
COMMENT ON COLUMN public.partner_staff.probation_review_date IS 'Date of probation review';

-- Update RLS policies to be more comprehensive
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
      -- Staff can view other staff in same partner (with restrictions)
      EXISTS (
        SELECT 1 FROM public.partner_staff ps
        WHERE ps.partner_id = partner_staff.partner_id 
        AND ps.user_id = auth.uid()
        AND ps.access_level IN ('intermediate', 'advanced', 'admin')
      )
      OR
      -- Staff can view their own record
      partner_staff.user_id = auth.uid()
      OR
      -- Admin can view all
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

-- Create comprehensive insert policy
DROP POLICY IF EXISTS "Partner can insert their own staff" ON public.partner_staff;
CREATE POLICY "Partner can insert their own staff" ON public.partner_staff
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      -- Partner can insert staff for their company
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = partner_staff.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Admin can insert staff for any partner
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

-- Create comprehensive update policy
DROP POLICY IF EXISTS "Partner can update their own staff" ON public.partner_staff;
CREATE POLICY "Partner can update their own staff" ON public.partner_staff
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can update staff for their company
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = partner_staff.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Staff can update their own basic information
      partner_staff.user_id = auth.uid()
      OR
      -- Admin can update any staff
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

-- Create comprehensive delete policy
DROP POLICY IF EXISTS "Partner can delete their own staff" ON public.partner_staff;
CREATE POLICY "Partner can delete their own staff" ON public.partner_staff
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      -- Partner can delete staff for their company
      EXISTS (
        SELECT 1 FROM public.partners 
        WHERE partners.id = partner_staff.partner_id 
        AND partners.user_id = auth.uid()
      )
      OR
      -- Admin can delete any staff
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
      )
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_staff TO authenticated; 