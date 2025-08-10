-- Final fix for vehicles RLS to ensure admin access
-- This will allow all authenticated users to access vehicles

-- Drop all existing policies on vehicles table
DROP POLICY IF EXISTS "Allow authenticated users to access vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can view their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can insert their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can update their own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can delete their own vehicles" ON vehicles;

-- Create a simple policy that allows all authenticated users to access vehicles
CREATE POLICY "Allow all authenticated users to access vehicles" ON vehicles
  FOR ALL USING (auth.role() = 'authenticated');

-- Also ensure the same for other tables
DROP POLICY IF EXISTS "Allow authenticated users to access users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to access partners" ON partners;
DROP POLICY IF EXISTS "Allow authenticated users to access bookings" ON bookings;

CREATE POLICY "Allow all authenticated users to access users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to access partners" ON partners
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all authenticated users to access bookings" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

-- Re-enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY; 