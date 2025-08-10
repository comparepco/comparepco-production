-- Create dashboard_layouts table for saving user widget layouts
-- This table stores the layout configuration for each user's dashboard

CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add unique constraint to ensure one layout per user
ALTER TABLE public.dashboard_layouts 
ADD CONSTRAINT dashboard_layouts_user_id_unique UNIQUE (user_id);

-- Add RLS policies
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Users can only view and modify their own layouts
CREATE POLICY "Users can view their own dashboard layouts" ON public.dashboard_layouts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard layouts" ON public.dashboard_layouts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layouts" ON public.dashboard_layouts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard layouts" ON public.dashboard_layouts
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all layouts
CREATE POLICY "Admins can manage all dashboard layouts" ON public.dashboard_layouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('ADMIN', 'SUPER_ADMIN', 'ADMIN_STAFF')
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.dashboard_layouts IS 'Stores user dashboard widget layouts and positions';
COMMENT ON COLUMN public.dashboard_layouts.user_id IS 'Reference to the user who owns this layout';
COMMENT ON COLUMN public.dashboard_layouts.layout IS 'JSON array of widget positions and configurations';
COMMENT ON COLUMN public.dashboard_layouts.created_at IS 'When the layout was first created';
COMMENT ON COLUMN public.dashboard_layouts.updated_at IS 'When the layout was last modified';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON public.dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_updated_at ON public.dashboard_layouts(updated_at); 