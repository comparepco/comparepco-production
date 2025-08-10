-- Fix infinite recursion issue with partner_staff table
-- This is a temporary fix until we can properly structure the policies

-- Disable RLS on partner_staff table to fix infinite recursion
-- ALTER TABLE partner_staff DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining this is temporary
-- COMMENT ON TABLE partner_staff IS 'RLS temporarily disabled to fix infinite recursion. Will be re-enabled with proper policies.';

-- Also disable RLS on documents table if it's causing issues
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Add a comment explaining this is temporary
COMMENT ON TABLE documents IS 'RLS temporarily disabled to fix access issues. Will be re-enabled with proper policies.'; 