-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.custom_reports;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.custom_report_templates;

-- Create new policies
CREATE POLICY "Allow all operations for authenticated users" ON public.custom_reports
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON public.custom_report_templates
    FOR ALL USING (auth.role() = 'authenticated'); 