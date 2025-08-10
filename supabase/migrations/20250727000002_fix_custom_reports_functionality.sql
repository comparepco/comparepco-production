-- Drop existing policies to fix infinite recursion
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.custom_reports;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.custom_report_templates;

-- Create simpler, more efficient policies
CREATE POLICY "Enable read access for authenticated users" ON public.custom_reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.custom_reports
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.custom_reports
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.custom_reports
    FOR DELETE USING (auth.role() = 'authenticated');

-- Similar policies for templates
CREATE POLICY "Enable read access for authenticated users" ON public.custom_report_templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON public.custom_report_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.custom_report_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.custom_report_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add storage bucket for reports if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for reports
CREATE POLICY "Allow authenticated users to upload reports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'reports' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to view reports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'reports' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to update reports" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'reports' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Allow authenticated users to delete reports" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'reports' AND 
        auth.role() = 'authenticated'
    ); 