-- Clean start: Disable RLS on all tables and re-enable with proper policies
-- This ensures we start with a clean slate

-- Disable RLS on all tables
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE partner_staff DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start clean
DROP POLICY IF EXISTS "Super Admin and Admin can access all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Staff can view all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Partners can manage their own vehicles" ON vehicles;

DROP POLICY IF EXISTS "Super Admin can access all users" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

DROP POLICY IF EXISTS "Super Admin and Admin can access all partners" ON partners;
DROP POLICY IF EXISTS "Staff can view all partners" ON partners;
DROP POLICY IF EXISTS "Partners can view their own data" ON partners;

DROP POLICY IF EXISTS "Super Admin and Admin can access all bookings" ON bookings;
DROP POLICY IF EXISTS "Staff can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Partners can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Drivers can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

DROP POLICY IF EXISTS "Super Admin and Admin can access all documents" ON documents;
DROP POLICY IF EXISTS "Staff can view all documents" ON documents;
DROP POLICY IF EXISTS "Partners can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;

DROP POLICY IF EXISTS "Super Admin and Admin can access all vehicle documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Staff can view all vehicle documents" ON vehicle_documents;
DROP POLICY IF EXISTS "Partners can view their own vehicle documents" ON vehicle_documents;

-- DROP POLICY IF EXISTS "Super Admin and Admin can access all partner staff" ON partner_staff;
-- DROP POLICY IF EXISTS "Partner staff can view their own records" ON partner_staff;
-- DROP POLICY IF EXISTS "Partners can view their staff" ON partner_staff;

-- DROP POLICY IF EXISTS "Super Admin and Admin can access all notifications" ON notifications;
-- DROP POLICY IF EXISTS "Staff can view all notifications" ON notifications;
-- DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

-- Now re-enable RLS with simple policies for now
-- We'll add the complex role-based policies in the next migration

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE partner_staff ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all authenticated users for now
CREATE POLICY "Allow authenticated users to access vehicles" ON vehicles
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access partners" ON partners
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access bookings" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access documents" ON documents
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access vehicle documents" ON vehicle_documents
  FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated users to access partner staff" ON partner_staff
--   FOR ALL USING (auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated users to access notifications" ON notifications
--   FOR ALL USING (auth.role() = 'authenticated'); 