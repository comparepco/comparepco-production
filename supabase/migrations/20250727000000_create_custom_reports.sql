-- Create custom_reports table
CREATE TABLE IF NOT EXISTS public.custom_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('financial', 'operational', 'performance', 'compliance', 'marketing')) DEFAULT 'financial',
    status TEXT CHECK (status IN ('active', 'inactive', 'draft')) DEFAULT 'draft',
    schedule TEXT CHECK (schedule IN ('daily', 'weekly', 'monthly', 'quarterly', 'manual')) DEFAULT 'manual',
    last_generated TIMESTAMP WITH TIME ZONE,
    next_generation TIMESTAMP WITH TIME ZONE,
    recipients TEXT[] DEFAULT '{}',
    format TEXT CHECK (format IN ('pdf', 'csv', 'excel', 'json')) DEFAULT 'pdf',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    report_config JSONB DEFAULT '{}'::jsonb,
    file_url TEXT,
    file_size TEXT DEFAULT '0 KB'
);

-- Create custom_report_templates table
CREATE TABLE IF NOT EXISTS public.custom_report_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('financial', 'operational', 'performance', 'compliance', 'marketing')) DEFAULT 'financial',
    parameters JSONB DEFAULT '[]'::jsonb,
    default_schedule TEXT CHECK (default_schedule IN ('daily', 'weekly', 'monthly', 'quarterly', 'manual')) DEFAULT 'manual',
    estimated_time TEXT DEFAULT '5 minutes',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    template_data JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_category ON public.custom_reports(category);
CREATE INDEX IF NOT EXISTS idx_custom_reports_status ON public.custom_reports(status);
CREATE INDEX IF NOT EXISTS idx_custom_reports_schedule ON public.custom_reports(schedule);
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_at ON public.custom_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_custom_report_templates_category ON public.custom_report_templates(category);

-- Enable RLS
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_reports
CREATE POLICY "Allow all operations for authenticated users" ON public.custom_reports
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for custom_report_templates
CREATE POLICY "Allow all operations for authenticated users" ON public.custom_report_templates
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample custom reports
INSERT INTO public.custom_reports (name, description, category, status, schedule, last_generated, next_generation, recipients, format, created_by) VALUES
('Monthly Revenue Analysis', 'Comprehensive monthly revenue breakdown with trends and projections', 'financial', 'active', 'monthly', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 month', ARRAY['finance@company.com', 'ceo@company.com'], 'pdf', NULL),
('Driver Performance Dashboard', 'Weekly driver performance metrics and rankings', 'performance', 'active', 'weekly', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 week', ARRAY['operations@company.com'], 'excel', NULL),
('Customer Satisfaction Report', 'Monthly customer satisfaction scores and feedback analysis', 'performance', 'active', 'monthly', NOW() - INTERVAL '5 days', NOW() + INTERVAL '1 month', ARRAY['support@company.com', 'product@company.com'], 'pdf', NULL),
('Fleet Utilization Report', 'Daily fleet utilization and maintenance scheduling', 'operational', 'active', 'daily', NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', ARRAY['fleet@company.com'], 'csv', NULL),
('Marketing Campaign Performance', 'Weekly marketing campaign effectiveness and ROI analysis', 'marketing', 'active', 'weekly', NOW() - INTERVAL '2 days', NOW() + INTERVAL '1 week', ARRAY['marketing@company.com'], 'excel', NULL);

-- Insert sample custom report templates
INSERT INTO public.custom_report_templates (name, description, category, parameters, default_schedule, estimated_time, created_by) VALUES
('Revenue Analysis Template', 'Standard template for revenue analysis reports', 'financial', '["Date Range", "Revenue Type", "Region", "Partner Filter"]', 'monthly', '5 minutes', NULL),
('Performance Dashboard Template', 'Template for performance metrics and KPIs', 'performance', '["Metrics", "Time Period", "Comparison", "Targets"]', 'weekly', '3 minutes', NULL),
('Operational Report Template', 'Template for operational efficiency reports', 'operational', '["Operations Type", "Efficiency Metrics", "Resource Usage"]', 'daily', '2 minutes', NULL),
('Compliance Report Template', 'Template for regulatory compliance reports', 'compliance', '["Compliance Type", "Audit Period", "Regulations"]', 'quarterly', '10 minutes', NULL),
('Marketing Analytics Template', 'Template for marketing campaign analysis', 'marketing', '["Campaign Type", "ROI Metrics", "Channel Analysis"]', 'weekly', '4 minutes', NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON public.custom_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_report_templates_updated_at BEFORE UPDATE ON public.custom_report_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 