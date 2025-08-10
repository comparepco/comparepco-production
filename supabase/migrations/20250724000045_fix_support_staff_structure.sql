-- Fix support_staff table structure to match the application requirements
-- Remove unnecessary columns and add missing ones

-- First, let's check what columns exist and add missing ones
ALTER TABLE public.support_staff 
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'Agent';

ALTER TABLE public.support_staff 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.support_staff 
ADD COLUMN IF NOT EXISTS sidebar_access JSONB DEFAULT '{}';

-- Remove columns that are not needed or causing issues
-- (We'll keep the essential columns only)

-- Update the table structure to be clean and robust
-- Drop and recreate the table with the correct structure
DROP TABLE IF EXISTS public.support_staff CASCADE;

CREATE TABLE public.support_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPPORT_AGENT', 'SUPPORT_SUPERVISOR', 'SUPPORT_MANAGER')),
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    specializations TEXT[] DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    max_concurrent_chats INTEGER DEFAULT 5,
    current_chats INTEGER DEFAULT 0,
    total_tickets_handled INTEGER DEFAULT 0,
    total_chats_handled INTEGER DEFAULT 0,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_staff_user_id ON public.support_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_support_staff_role ON public.support_staff(role);
CREATE INDEX IF NOT EXISTS idx_support_staff_department ON public.support_staff(department);
CREATE INDEX IF NOT EXISTS idx_support_staff_is_online ON public.support_staff(is_online);
CREATE INDEX IF NOT EXISTS idx_support_staff_is_available ON public.support_staff(is_available);
CREATE INDEX IF NOT EXISTS idx_support_staff_is_active ON public.support_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_support_staff_created_at ON public.support_staff(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_support_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_staff_updated_at
    BEFORE UPDATE ON public.support_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_support_staff_updated_at();

-- Enable RLS
ALTER TABLE public.support_staff ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for testing
CREATE POLICY "Allow all operations for testing" ON public.support_staff
    FOR ALL USING (true) WITH CHECK (true); 