import { createClient } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Security Service - ComparePCO Security & Monitoring System
export class SecurityService {
  private static instance: SecurityService;
  private alertCallbacks: Array<(alert: any) => void> = [];

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // 1. Global Error Handler
  async logError(error: Error, module: string, context?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('system_logs').insert({
        level: 'error',
        message: error.message,
        module,
        user_id: user?.id,
        context: {
          stack: error.stack,
          ...context
        },
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });

      // Trigger real-time alert for critical errors
      if (error.message.includes('critical') || error.message.includes('security')) {
        await this.createSecurityAlert('error', 'high', `Critical error in ${module}: ${error.message}`);
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // 2. User Action Logging
  async logUserAction(actionType: string, resourceType?: string, resourceId?: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('user_action_logs').insert({
        user_id: user?.id,
        action_type: actionType,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }

  // 3. Admin Activity Logging
  async logAdminAction(actionType: string, targetType?: string, targetId?: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('admin_activity_logs').insert({
        admin_id: user?.id,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        details,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // 4. Security Alert Creation
  async createSecurityAlert(alertType: string, severity: 'low' | 'medium' | 'high' | 'critical', message: string, details?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const alert = await supabase.from('security_alerts').insert({
        alert_type: alertType,
        severity,
        message,
        details,
        user_id: user?.id,
        ip_address: await this.getClientIP()
      }).select().single();

      // Trigger real-time alerts
      this.alertCallbacks.forEach(callback => callback(alert.data));

      // Show toast for critical alerts
      if (severity === 'critical') {
        toast({
          title: "🚨 Security Alert",
          description: message,
          variant: "destructive"
        });
      }

      return alert.data;
    } catch (error) {
      console.error('Failed to create security alert:', error);
    }
  }

  // 5. File Security Management
  async validateFileUpload(file: File): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Get security settings
      const { data: settings } = await supabase
        .from('security_settings')
        .select('setting_value')
        .eq('setting_key', 'file_security')
        .single();

      const fileSettings = settings?.setting_value || {
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'],
        blocked_extensions: ['.exe', '.js', '.bat', '.sh'],
        max_file_size_mb: 5
      };

      // Check file size
      if (file.size > fileSettings.max_file_size_mb * 1024 * 1024) {
        return { valid: false, reason: `File size exceeds ${fileSettings.max_file_size_mb}MB limit` };
      }

      // Check MIME type
      if (!fileSettings.allowed_mime_types.includes(file.type)) {
        return { valid: false, reason: `File type ${file.type} not allowed` };
      }

      // Check file extension
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (fileSettings.blocked_extensions.includes(extension)) {
        return { valid: false, reason: `File extension ${extension} is blocked` };
      }

      return { valid: true };
    } catch (error) {
      console.error('File validation error:', error);
      return { valid: false, reason: 'File validation failed' };
    }
  }

  async logFileAccess(fileId: string, accessType: 'view' | 'download' | 'delete' | 'upload') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('file_access_logs').insert({
        file_id: fileId,
        user_id: user?.id,
        access_type: accessType,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log file access:', error);
    }
  }

  // 6. Session Management
  async createUserSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await supabase.from('user_sessions').insert({
        user_id: user.id,
        session_token: sessionToken,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        expires_at: expiresAt
      });

      return sessionToken;
    } catch (error) {
      console.error('Failed to create user session:', error);
    }
  }

  async invalidateUserSessions(userId: string) {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Failed to invalidate user sessions:', error);
    }
  }

  // 7. Rate Limiting
  async checkRateLimit(identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
    try {
      const { data: settings } = await supabase
        .from('security_settings')
        .select('setting_value')
        .eq('setting_key', 'rate_limits')
        .single();

      const rateLimits = settings?.setting_value || {
        login_attempts: 5,
        window_minutes: 15,
        api_requests: 100,
        api_window_minutes: 1
      };

      const windowStart = new Date(Date.now() - (rateLimits.api_window_minutes * 60 * 1000));

      // Get current request count
      const { data: currentRequests } = await supabase
        .from('rate_limits')
        .select('request_count')
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .single();

      const requestCount = currentRequests?.request_count || 0;
      const maxRequests = endpoint === 'login' ? rateLimits.login_attempts : rateLimits.api_requests;

      if (requestCount >= maxRequests) {
        await this.createSecurityAlert('rate_limit_exceeded', 'medium', `Rate limit exceeded for ${identifier} on ${endpoint}`);
        return { allowed: false, remaining: 0 };
      }

      // Update or create rate limit record
      if (currentRequests) {
        await supabase
          .from('rate_limits')
          .update({ request_count: requestCount + 1 })
          .eq('identifier', identifier)
          .eq('endpoint', endpoint);
      } else {
        await supabase.from('rate_limits').insert({
          identifier,
          endpoint,
          request_count: 1
        });
      }

      return { allowed: true, remaining: maxRequests - requestCount - 1 };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true, remaining: 999 }; // Fail open
    }
  }

  // 8. Brute Force Detection
  async detectBruteForce(userId: string): Promise<boolean> {
    try {
      const { data: settings } = await supabase
        .from('security_settings')
        .select('setting_value')
        .eq('setting_key', 'alert_thresholds')
        .single();

      const thresholds = settings?.setting_value || {
        failed_logins: 3
      };

      const windowStart = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes

      const { data: failedLogins } = await supabase
        .from('user_action_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('action_type', 'login_failed')
        .gte('timestamp', windowStart.toISOString());

      if (failedLogins && failedLogins.length >= thresholds.failed_logins) {
        await this.createSecurityAlert('brute_force_detected', 'high', `Brute force attack detected for user ${userId}`);
        await this.invalidateUserSessions(userId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Brute force detection failed:', error);
      return false;
    }
  }

  // 9. Security Monitoring
  async getSecurityMetrics() {
    try {
      const [
        { data: systemLogs },
        { data: securityAlerts },
        { data: userActions },
        { data: adminActions }
      ] = await Promise.all([
        supabase.from('system_logs').select('level, created_at').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('security_alerts').select('severity, resolved').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('user_action_logs').select('action_type').gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('admin_activity_logs').select('action_type').gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        errors: systemLogs?.filter(log => log.level === 'error').length || 0,
        warnings: systemLogs?.filter(log => log.level === 'warn').length || 0,
        criticalAlerts: securityAlerts?.filter(alert => alert.severity === 'critical' && !alert.resolved).length || 0,
        userActions: userActions?.length || 0,
        adminActions: adminActions?.length || 0,
        activeAlerts: securityAlerts?.filter(alert => !alert.resolved).length || 0
      };
    } catch (error) {
      console.error('Failed to get security metrics:', error);
      return {
        errors: 0,
        warnings: 0,
        criticalAlerts: 0,
        userActions: 0,
        adminActions: 0,
        activeAlerts: 0
      };
    }
  }

  // 10. Weekly Security Report
  async generateWeeklySecurityReport() {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        { data: systemLogs },
        { data: securityAlerts },
        { data: userActions },
        { data: adminActions },
        { data: fileAccess }
      ] = await Promise.all([
        supabase.from('system_logs').select('*').gte('created_at', weekAgo.toISOString()),
        supabase.from('security_alerts').select('*').gte('created_at', weekAgo.toISOString()),
        supabase.from('user_action_logs').select('*').gte('timestamp', weekAgo.toISOString()),
        supabase.from('admin_activity_logs').select('*').gte('timestamp', weekAgo.toISOString()),
        supabase.from('file_access_logs').select('*').gte('timestamp', weekAgo.toISOString())
      ]);

      const report = {
        period: `${weekAgo.toDateString()} - ${new Date().toDateString()}`,
        summary: {
          totalErrors: systemLogs?.filter(log => log.level === 'error').length || 0,
          totalWarnings: systemLogs?.filter(log => log.level === 'warn').length || 0,
          criticalAlerts: securityAlerts?.filter(alert => alert.severity === 'critical').length || 0,
          resolvedAlerts: securityAlerts?.filter(alert => alert.resolved).length || 0,
          activeAlerts: securityAlerts?.filter(alert => !alert.resolved).length || 0,
          userActions: userActions?.length || 0,
          adminActions: adminActions?.length || 0,
          fileAccesses: fileAccess?.length || 0
        },
        topErrors: this.getTopErrors(systemLogs || []),
        topAlerts: this.getTopAlerts(securityAlerts || []),
        suspiciousActivity: this.getSuspiciousActivity(userActions || [], adminActions || []),
        recommendations: this.generateRecommendations(systemLogs || [], securityAlerts || [])
      };

      // Save report to database
      await supabase.from('system_logs').insert({
        level: 'info',
        message: 'Weekly Security Report Generated',
        module: 'security_report',
        context: report
      });

      return report;
    } catch (error) {
      console.error('Failed to generate weekly security report:', error);
      throw error;
    }
  }

  // Helper methods
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private getTopErrors(logs: any[]): any[] {
    const errorCounts: { [key: string]: number } = {};
    logs.filter(log => log.level === 'error').forEach(log => {
      errorCounts[log.message] = (errorCounts[log.message] || 0) + 1;
    });
    return Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getTopAlerts(alerts: any[]): any[] {
    return alerts
      .filter(alert => alert.severity === 'high' || alert.severity === 'critical')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }

  private getSuspiciousActivity(userActions: any[], adminActions: any[]): any[] {
    const suspicious = [];
    
    // Check for unusual login patterns
    const loginAttempts = userActions.filter(action => action.action_type === 'login');
    if (loginAttempts.length > 10) {
      suspicious.push({ type: 'excessive_logins', count: loginAttempts.length });
    }

    // Check for unusual admin actions
    const adminActionCounts: { [key: string]: number } = {};
    adminActions.forEach(action => {
      adminActionCounts[action.action_type] = (adminActionCounts[action.action_type] || 0) + 1;
    });

    Object.entries(adminActionCounts).forEach(([action, count]) => {
      if (count > 50) {
        suspicious.push({ type: 'excessive_admin_actions', action, count });
      }
    });

    return suspicious;
  }

  private generateRecommendations(logs: any[], alerts: any[]): string[] {
    const recommendations = [];

    const errorCount = logs.filter(log => log.level === 'error').length;
    if (errorCount > 10) {
      recommendations.push('High error rate detected. Review system logs and fix critical issues.');
    }

    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.resolved).length;
    if (criticalAlerts > 0) {
      recommendations.push(`${criticalAlerts} critical alerts unresolved. Immediate attention required.`);
    }

    const failedLogins = logs.filter(log => log.message.includes('login failed')).length;
    if (failedLogins > 5) {
      recommendations.push('Multiple failed login attempts detected. Consider implementing additional security measures.');
    }

    return recommendations;
  }

  // Real-time alert subscription
  onAlert(callback: (alert: any) => void) {
    this.alertCallbacks.push(callback);
  }

  offAlert(callback: (alert: any) => void) {
    this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
  }
}

export const securityService = SecurityService.getInstance(); 