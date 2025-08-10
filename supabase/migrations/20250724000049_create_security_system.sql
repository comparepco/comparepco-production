-- Security System Database Schema
-- ComparePCO Security & Monitoring System

-- 1. System Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
    message TEXT NOT NULL,
    module TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT,
    context JSONB,
    stack_trace TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Action Logs Table
CREATE TABLE IF NOT EXISTS public.user_action_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Security Alerts Table
CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. File Security Table
CREATE TABLE IF NOT EXISTS public.file_security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    upload_ip INET,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. File Access Logs Table
CREATE TABLE IF NOT EXISTS public.file_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES public.file_security(id),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'delete', 'upload')),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Session Management Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    session_token TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier TEXT NOT NULL, -- IP or user_id
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Security Settings Table
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enhanced Admin Staff Table with Security Roles
ALTER TABLE public.admin_staff ADD COLUMN IF NOT EXISTS security_role TEXT DEFAULT 'basic' CHECK (security_role IN ('basic', 'monitor', 'analyst', 'investigator', 'admin'));
ALTER TABLE public.admin_staff ADD COLUMN IF NOT EXISTS last_security_training TIMESTAMPTZ;
ALTER TABLE public.admin_staff ADD COLUMN IF NOT EXISTS security_permissions JSONB DEFAULT '{}';

-- Insert default security settings
INSERT INTO public.security_settings (setting_key, setting_value, description) VALUES
('rate_limits', '{"login_attempts": 5, "window_minutes": 15, "api_requests": 100, "api_window_minutes": 1}', 'Rate limiting configuration'),
('session_settings', '{"max_concurrent_sessions": 3, "session_timeout_hours": 24, "inactive_timeout_minutes": 30}', 'Session management settings'),
('alert_thresholds', '{"failed_logins": 3, "suspicious_activity_score": 75, "file_upload_size_mb": 10}', 'Security alert thresholds'),
('file_security', '{"allowed_mime_types": ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"], "blocked_extensions": [".exe", ".js", ".bat", ".sh"], "max_file_size_mb": 5}', 'File upload security settings'),
('monitoring', '{"log_retention_days": 90, "alert_webhook_url": "", "weekly_report_email": ""}', 'Monitoring configuration')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_id ON public.user_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_timestamp ON public.user_action_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_file_security_hash ON public.file_security(file_hash);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);

-- Enable RLS on all security tables
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security tables
-- System logs: Only admins can view
CREATE POLICY "Admins can view system logs" ON public.system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- User action logs: Users can view their own, admins can view all
CREATE POLICY "Users can view own action logs" ON public.user_action_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Admin activity logs: Only admins can view
CREATE POLICY "Admins can view admin activity logs" ON public.admin_activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Security alerts: Only admins can view
CREATE POLICY "Admins can view security alerts" ON public.security_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- File security: Users can view their own uploads, admins can view all
CREATE POLICY "Users can view own file security" ON public.file_security
    FOR SELECT USING (
        uploaded_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- File access logs: Users can view their own access, admins can view all
CREATE POLICY "Users can view own file access logs" ON public.file_access_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- User sessions: Users can view their own sessions, admins can view all
CREATE POLICY "Users can view own sessions" ON public.user_sessions
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Rate limits: Only admins can view
CREATE POLICY "Admins can view rate limits" ON public.rate_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Security settings: Only admins can view and modify
CREATE POLICY "Admins can manage security settings" ON public.security_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_staff 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_ADMIN', 'ADMIN')
        )
    );

-- Allow system to insert logs (for error handling)
CREATE POLICY "System can insert logs" ON public.system_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert user action logs" ON public.user_action_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert admin activity logs" ON public.admin_activity_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert security alerts" ON public.security_alerts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert file security" ON public.file_security
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert file access logs" ON public.file_access_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert user sessions" ON public.user_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert rate limits" ON public.rate_limits
    FOR INSERT WITH CHECK (true); 