-- Final migration to create robust staff management tables
-- This will fix all column mismatches and create a clean, working system

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.support_staff CASCADE;
DROP TABLE IF EXISTS public.admin_staff CASCADE;

-- Create admin_staff table with correct structure
CREATE TABLE public.admin_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ADMIN_STAFF')),
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    permissions JSONB DEFAULT '{}',
    sidebar_access JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create support_staff table with correct structure
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

-- Create indexes for admin_staff
CREATE INDEX IF NOT EXISTS idx_admin_staff_user_id ON public.admin_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_staff_role ON public.admin_staff(role);
CREATE INDEX IF NOT EXISTS idx_admin_staff_department ON public.admin_staff(department);
CREATE INDEX IF NOT EXISTS idx_admin_staff_is_active ON public.admin_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_staff_is_online ON public.admin_staff(is_online);
CREATE INDEX IF NOT EXISTS idx_admin_staff_created_at ON public.admin_staff(created_at);

-- Create indexes for support_staff
CREATE INDEX IF NOT EXISTS idx_support_staff_user_id ON public.support_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_support_staff_role ON public.support_staff(role);
CREATE INDEX IF NOT EXISTS idx_support_staff_department ON public.support_staff(department);
CREATE INDEX IF NOT EXISTS idx_support_staff_is_online ON public.support_staff(is_online);
CREATE INDEX IF NOT EXISTS idx_support_staff_is_available ON public.support_staff(is_available);
CREATE INDEX IF NOT EXISTS idx_support_staff_is_active ON public.support_staff(is_active);
CREATE INDEX IF NOT EXISTS idx_support_staff_created_at ON public.support_staff(created_at);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_admin_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_support_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_staff_updated_at
    BEFORE UPDATE ON public.admin_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_staff_updated_at();

CREATE TRIGGER trigger_update_support_staff_updated_at
    BEFORE UPDATE ON public.support_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_support_staff_updated_at();

-- Enable RLS on both tables
ALTER TABLE public.admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_staff ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for testing (can be made more restrictive later)
CREATE POLICY "Allow all operations for testing - admin_staff" ON public.admin_staff
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for testing - support_staff" ON public.support_staff
    FOR ALL USING (true) WITH CHECK (true); 