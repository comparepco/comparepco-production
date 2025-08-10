-- Create partner_actions table for tracking partner-related actions
CREATE TABLE IF NOT EXISTS public.partner_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL CHECK (action_type IN ('award', 'target', 'performance_review', 'newsletter', 'call', 'message', 'issue_resolution')),
    partner_id UUID REFERENCES public.partners(id),
    partner_name TEXT,
    partner_company TEXT,
    action_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_actions_type ON public.partner_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_partner_actions_partner_id ON public.partner_actions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_actions_created_at ON public.partner_actions(created_at);

-- Enable RLS
ALTER TABLE public.partner_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_actions
CREATE POLICY "Users can view partner actions" ON public.partner_actions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert partner actions" ON public.partner_actions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update partner actions" ON public.partner_actions
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete partner actions" ON public.partner_actions
    FOR DELETE USING (true); 