-- Temporarily disable RLS on users table for testing
-- This will allow admin access to view users

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining this is temporary
COMMENT ON TABLE users IS 'RLS temporarily disabled for admin access testing. Will be re-enabled with proper policies.'; 