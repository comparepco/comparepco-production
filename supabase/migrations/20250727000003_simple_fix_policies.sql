-- Drop all existing policies for custom_reports and custom_report_templates
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.custom_reports;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.custom_report_templates;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_reports;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.custom_reports;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.custom_reports;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.custom_reports;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.custom_report_templates;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.custom_report_templates;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.custom_report_templates;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.custom_report_templates;

-- Create new simple policies
CREATE POLICY "custom_reports_select" ON public.custom_reports FOR SELECT USING (true);
CREATE POLICY "custom_reports_insert" ON public.custom_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "custom_reports_update" ON public.custom_reports FOR UPDATE USING (true);
CREATE POLICY "custom_reports_delete" ON public.custom_reports FOR DELETE USING (true);

CREATE POLICY "custom_report_templates_select" ON public.custom_report_templates FOR SELECT USING (true);
CREATE POLICY "custom_report_templates_insert" ON public.custom_report_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "custom_report_templates_update" ON public.custom_report_templates FOR UPDATE USING (true);
CREATE POLICY "custom_report_templates_delete" ON public.custom_report_templates FOR DELETE USING (true); 