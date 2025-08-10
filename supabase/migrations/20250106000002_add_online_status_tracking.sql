-- Migration: Add comprehensive online status tracking for admin users
-- Description: Enhance online/offline status tracking for Super Admin, Admin, and Admin Staff
-- Date: 2025-01-06

-- Add online status tracking fields to admin_staff table
ALTER TABLE public.admin_staff 
ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'away', 'busy')),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';

-- Add online status tracking fields to support_staff table
ALTER TABLE public.support_staff 
ADD COLUMN IF NOT EXISTS online_status TEXT DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'away', 'busy')),
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
ADD COLUMN IF NOT EXISTS session_id TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}';

-- Create admin_sessions table for admin session tracking
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    user_role TEXT NOT NULL CHECK (user_role IN ('SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF')),
    online_status TEXT DEFAULT 'online' CHECK (online_status IN ('online', 'offline', 'away', 'busy')),
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    login_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    logout_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_staff_online_status ON public.admin_staff(online_status);
CREATE INDEX IF NOT EXISTS idx_admin_staff_last_activity ON public.admin_staff(last_activity);
CREATE INDEX IF NOT EXISTS idx_support_staff_online_status ON public.support_staff(online_status);
CREATE INDEX IF NOT EXISTS idx_support_staff_last_activity ON public.support_staff(last_activity);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON public.admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_id ON public.admin_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_online_status ON public.admin_sessions(online_status);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_is_active ON public.admin_sessions(is_active);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_sessions
CREATE POLICY "Admin users can view their own sessions" ON public.admin_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all admin sessions" ON public.admin_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "Admin users can insert their own sessions" ON public.admin_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin users can update their own sessions" ON public.admin_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update admin online status
CREATE OR REPLACE FUNCTION update_admin_online_status(
    p_user_id UUID,
    p_user_role TEXT,
    p_online_status TEXT DEFAULT 'online',
    p_session_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Update admin_staff if user exists in that table
    UPDATE public.admin_staff 
    SET 
        is_online = (p_online_status = 'online'),
        online_status = p_online_status,
        last_activity = timezone('utc', now()),
        session_id = COALESCE(p_session_id, session_id),
        ip_address = COALESCE(p_ip_address, ip_address),
        user_agent = COALESCE(p_user_agent, user_agent),
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Update support_staff if user exists in that table
    UPDATE public.support_staff 
    SET 
        is_online = (p_online_status = 'online'),
        online_status = p_online_status,
        last_activity = timezone('utc', now()),
        session_id = COALESCE(p_session_id, session_id),
        ip_address = COALESCE(p_ip_address, ip_address),
        user_agent = COALESCE(p_user_agent, user_agent),
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Insert or update admin_sessions
    INSERT INTO public.admin_sessions (
        user_id, session_id, user_role, online_status, ip_address, user_agent, last_activity
    ) VALUES (
        p_user_id, p_session_id, p_user_role, p_online_status, p_ip_address, p_user_agent, timezone('utc', now())
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET 
        online_status = EXCLUDED.online_status,
        last_activity = EXCLUDED.last_activity,
        updated_at = timezone('utc', now());
END;
$$ LANGUAGE plpgsql;

-- Create function to mark admin as offline
CREATE OR REPLACE FUNCTION mark_admin_offline(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Update admin_staff
    UPDATE public.admin_staff 
    SET 
        is_online = false,
        online_status = 'offline',
        last_activity = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Update support_staff
    UPDATE public.support_staff 
    SET 
        is_online = false,
        online_status = 'offline',
        last_activity = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id;

    -- Update admin_sessions
    UPDATE public.admin_sessions 
    SET 
        online_status = 'offline',
        logout_time = timezone('utc', now()),
        is_active = false,
        updated_at = timezone('utc', now())
    WHERE user_id = p_user_id AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get online admin users count
CREATE OR REPLACE FUNCTION get_online_admin_count()
RETURNS TABLE(
    total_online INTEGER,
    admin_online INTEGER,
    support_online INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.admin_sessions WHERE online_status = 'online' AND is_active = true)::INTEGER as total_online,
        (SELECT COUNT(*) FROM public.admin_staff WHERE is_online = true)::INTEGER as admin_online,
        (SELECT COUNT(*) FROM public.support_staff WHERE is_online = true)::INTEGER as support_online;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_sessions_updated_at
    BEFORE UPDATE ON public.admin_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_sessions_updated_at();

-- Insert initial session for existing users (optional)
-- This can be run manually if needed 