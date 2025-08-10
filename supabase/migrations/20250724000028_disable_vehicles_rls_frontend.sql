-- Temporarily disable RLS on vehicles table for frontend access
-- This will allow the home page and compare page to show cars

-- Disable RLS on vehicles table
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining this is temporary
COMMENT ON TABLE vehicles IS 'RLS temporarily disabled for frontend access. Will be re-enabled with proper policies.'; 