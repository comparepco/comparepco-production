-- Temporarily disable RLS on vehicles table again for testing
-- This will allow admin access to view vehicles

-- Disable RLS on vehicles table
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining this is temporary
COMMENT ON TABLE vehicles IS 'RLS temporarily disabled for admin access testing. Will be re-enabled with proper policies.'; 