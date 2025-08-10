-- Migration: Create admin_staff table for admin staff management
-- This table stores admin staff members with roles and permissions

-- Create admin_staff table
CREATE TABLE IF NOT EXISTS public.admin_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ADMIN_STAFF')),
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  sidebar_access JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_staff_user_id ON public.admin_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_staff_role ON public.admin_staff(role);
CREATE INDEX IF NOT EXISTS idx_admin_staff_department ON public.admin_staff(department);
CREATE INDEX IF NOT EXISTS idx_admin_staff_is_active ON public.admin_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_staff_is_online ON public.admin_staff(is_online);
CREATE INDEX IF NOT EXISTS idx_admin_staff_created_at ON public.admin_staff(created_at);

-- Enable RLS
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin staff are viewable by admins and super admins" ON public.admin_staff
  FOR SELECT USING (
    auth.role() = 'authenticated' AND (
      -- Super admin can view all
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'SUPER_ADMIN'
      )
      OR
      -- Admin can view all
      EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
      )
      OR
      -- Admin staff can view other admin staff
      EXISTS (
        SELECT 1 FROM public.admin_staff 
        WHERE admin_staff.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Super admin can insert admin staff" ON public.admin_staff
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admin can update admin staff" ON public.admin_staff
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'SUPER_ADMIN'
    )
  );

CREATE POLICY "Super admin can delete admin staff" ON public.admin_staff
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'SUPER_ADMIN'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_staff_updated_at
  BEFORE UPDATE ON public.admin_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_staff_updated_at(); 