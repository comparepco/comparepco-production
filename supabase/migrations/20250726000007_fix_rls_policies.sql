-- Fix RLS policies for reports table to allow admin operations
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can insert their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.reports;

-- Create new policies that allow admin operations
CREATE POLICY "Allow all operations for authenticated users" ON public.reports
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: Allow all operations (for testing)
-- CREATE POLICY "Allow all operations" ON public.reports
--     FOR ALL USING (true);

-- Fix RLS policies for report_templates table
DROP POLICY IF EXISTS "Users can view templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can insert templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can update templates" ON public.report_templates;
DROP POLICY IF EXISTS "Users can delete templates" ON public.report_templates;

-- Create new policies for report_templates
CREATE POLICY "Allow all operations for authenticated users" ON public.report_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: Allow all operations (for testing)
-- CREATE POLICY "Allow all operations" ON public.report_templates
--     FOR ALL USING (true); 