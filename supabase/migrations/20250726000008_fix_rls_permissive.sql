-- Drop all existing policies and create permissive ones
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.reports;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.report_templates;

-- Create permissive policies for reports table
CREATE POLICY "Allow all operations" ON public.reports
    FOR ALL USING (true);

-- Create permissive policies for report_templates table  
CREATE POLICY "Allow all operations" ON public.report_templates
    FOR ALL USING (true);

-- Test insert to verify policies work
INSERT INTO public.reports (title, type, status, file_size, format) VALUES
('Test Report - RLS Fix', 'financial', 'generated', '1.0 MB', 'pdf')
ON CONFLICT DO NOTHING; 