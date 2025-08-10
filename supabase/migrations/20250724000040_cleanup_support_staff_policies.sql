-- Clean up support_staff policies that reference auth.users and cause permission issues

-- Enable RLS
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Support staff can view their own records" ON support_staff;
DROP POLICY IF EXISTS "Support staff can update their own records" ON support_staff;
DROP POLICY IF EXISTS "Admins can view all support staff" ON support_staff;
DROP POLICY IF EXISTS "Admins can manage support staff" ON support_staff;

-- Ensure simple authenticated view policy exists (idempotent)
DROP POLICY IF EXISTS "Authenticated users can view staff" ON support_staff;
CREATE POLICY "Authenticated users can view staff" ON support_staff
  FOR SELECT USING ( auth.role() = 'authenticated' );

-- Optional: allow service_role full access (already exists but recreate to be safe)
DROP POLICY IF EXISTS "Service role can access all staff data" ON support_staff;
CREATE POLICY "Service role can access all staff data" ON support_staff
  FOR ALL USING ( auth.role() = 'service_role' ); 