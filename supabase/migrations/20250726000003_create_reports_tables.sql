-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('financial', 'operational', 'performance', 'compliance')) DEFAULT 'financial',
    status TEXT CHECK (status IN ('generated', 'pending', 'failed')) DEFAULT 'pending',
    file_size TEXT DEFAULT '0 KB',
    format TEXT CHECK (format IN ('pdf', 'csv', 'excel')) DEFAULT 'pdf',
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by UUID REFERENCES auth.users(id),
    data JSONB DEFAULT '{}'::jsonb
);

-- Create report_templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('financial', 'operational', 'performance', 'compliance')) DEFAULT 'financial',
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')) DEFAULT 'monthly',
    last_generated TIMESTAMP WITH TIME ZONE,
    next_generation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    template_data JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON public.report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_frequency ON public.report_templates(frequency);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (auth.uid() = generated_by);

CREATE POLICY "Users can insert their own reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = generated_by);

CREATE POLICY "Users can update their own reports" ON public.reports
    FOR UPDATE USING (auth.uid() = generated_by);

CREATE POLICY "Users can delete their own reports" ON public.reports
    FOR DELETE USING (auth.uid() = generated_by);

-- RLS Policies for report_templates
CREATE POLICY "Users can view templates" ON public.report_templates
    FOR SELECT USING (true);

CREATE POLICY "Users can insert templates" ON public.report_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update templates" ON public.report_templates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete templates" ON public.report_templates
    FOR DELETE USING (auth.uid() = created_by);

-- Insert sample templates
INSERT INTO public.report_templates (name, description, category, frequency, last_generated, next_generation, created_by) VALUES
('Monthly Financial Report', 'Comprehensive financial analysis and revenue tracking', 'financial', 'monthly', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', NULL),
('Weekly Performance Report', 'Driver and vehicle performance metrics', 'performance', 'weekly', NOW() - INTERVAL '1 week', NOW() + INTERVAL '1 week', NULL),
('Quarterly Operational Report', 'Fleet operations and maintenance overview', 'operational', 'quarterly', NOW() - INTERVAL '3 months', NOW() + INTERVAL '3 months', NULL),
('Compliance Report', 'Regulatory compliance and safety metrics', 'compliance', 'monthly', NOW() - INTERVAL '1 month', NOW() + INTERVAL '1 month', NULL);

-- Insert sample reports
INSERT INTO public.reports (title, type, status, file_size, format, generated_by) VALUES
('January 2024 Financial Report', 'financial', 'generated', '2.3 MB', 'pdf', NULL),
('Weekly Performance Summary', 'performance', 'generated', '1.1 MB', 'excel', NULL),
('Q4 Operational Report', 'operational', 'pending', '0 KB', 'pdf', NULL),
('Compliance Audit Report', 'compliance', 'generated', '3.7 MB', 'pdf', NULL); 