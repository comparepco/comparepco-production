-- Enable RLS and grant authenticated users read access to partners table

-- Enable Row Level Security if not already enabled
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid duplicates
DROP POLICY IF EXISTS "Allow authenticated users to read partners" ON public.partners;

-- Create a simple SELECT policy for all authenticated users
CREATE POLICY "Allow authenticated users to read partners"
ON public.partners
FOR SELECT
TO authenticated
USING ( true ); 