-- Fix RLS policies for admin access to vehicles and users tables
-- This ensures admin users can access all data needed for fleet management

-- Enable RLS on vehicles table if not already enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on vehicles table
DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can delete their own vehicles" ON vehicles;

-- Create comprehensive RLS policies for vehicles table
CREATE POLICY "Admins can view all vehicles" ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Admins can insert vehicles" ON vehicles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Admins can update all vehicles" ON vehicles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Admins can delete all vehicles" ON vehicles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Partners can view their own vehicles
CREATE POLICY "Partners can view their own vehicles" ON vehicles
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can insert their own vehicles
CREATE POLICY "Partners can insert their own vehicles" ON vehicles
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can update their own vehicles
CREATE POLICY "Partners can update their own vehicles" ON vehicles
  FOR UPDATE USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partners can delete their own vehicles
CREATE POLICY "Partners can delete their own vehicles" ON vehicles
  FOR DELETE USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Fix RLS policies for users table (for admin access)
-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Create RLS policies for users table
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (
    id = auth.uid()
  );

-- Fix RLS policies for partners table
-- Enable RLS on partners table if not already enabled
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on partners table
DROP POLICY IF EXISTS "Admins can view all partners" ON partners;
DROP POLICY IF EXISTS "Partners can view their own data" ON partners;

-- Create RLS policies for partners table
CREATE POLICY "Admins can view all partners" ON partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Partners can view their own data" ON partners
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Fix RLS policies for bookings table
-- Enable RLS on bookings table if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on bookings table
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

-- Create RLS policies for bookings table
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON vehicles TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON partners TO authenticated;
GRANT SELECT ON bookings TO authenticated; 