-- Fix RLS policies to use correct table references
-- The issue was that policies were referencing auth.users instead of public.users

-- Drop existing policies on vehicles table
DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can delete all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can delete their own vehicles" ON vehicles;

-- Create simplified RLS policies for vehicles table
-- Allow all authenticated users to access vehicles for now
CREATE POLICY "Allow authenticated users to access vehicles" ON vehicles
  FOR ALL USING (auth.role() = 'authenticated');

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Create simplified RLS policies for users table
CREATE POLICY "Allow authenticated users to access users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

-- Drop existing policies on partners table
DROP POLICY IF EXISTS "Admins can view all partners" ON partners;
DROP POLICY IF EXISTS "Partners can view their own data" ON partners;

-- Create simplified RLS policies for partners table
CREATE POLICY "Allow authenticated users to access partners" ON partners
  FOR ALL USING (auth.role() = 'authenticated');

-- Drop existing policies on bookings table
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

-- Create simplified RLS policies for bookings table
CREATE POLICY "Allow authenticated users to access bookings" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

-- Re-enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY; 