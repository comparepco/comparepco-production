const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSecurityData() {
  try {
    console.log('Creating security sample data...');

    // Get a user for testing
    const { data: users } = await supabase.auth.admin.listUsers();
    let testUser = users.users[0];

    if (!testUser) {
      console.log('No users found, creating a test user...');
      const { data: newUser } = await supabase.auth.admin.createUser({
        email: 'test@comparepco.com',
        password: 'testpassword123',
        email_confirm: true
      });
      testUser = newUser.user;
    }

    // Create system logs
    const systemLogs = [
      {
        level: 'info',
        message: 'System startup completed successfully',
        module: 'system',
        user_id: testUser.id,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        level: 'warn',
        message: 'High memory usage detected',
        module: 'system',
        user_id: testUser.id,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        level: 'error',
        message: 'Database connection timeout',
        module: 'database',
        user_id: testUser.id,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        level: 'critical',
        message: 'Security alert: Multiple failed login attempts',
        module: 'security',
        user_id: testUser.id,
        ip_address: '203.0.113.50',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        level: 'info',
        message: 'User authentication successful',
        module: 'auth',
        user_id: testUser.id,
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];

    // Create user action logs
    const userActionLogs = [
      {
        user_id: testUser.id,
        action_type: 'login',
        resource_type: 'auth',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { method: 'email', success: true }
      },
      {
        user_id: testUser.id,
        action_type: 'file_upload',
        resource_type: 'document',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { filename: 'driver_license.pdf', size: 2048576 }
      },
      {
        user_id: testUser.id,
        action_type: 'profile_update',
        resource_type: 'user',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { fields_updated: ['email', 'phone'] }
      },
      {
        user_id: testUser.id,
        action_type: 'booking_create',
        resource_type: 'booking',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { booking_id: 'booking_123', amount: 150.00 }
      },
      {
        user_id: testUser.id,
        action_type: 'payment_attempt',
        resource_type: 'payment',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { method: 'card', amount: 150.00, success: true }
      }
    ];

    // Create admin activity logs
    const adminActivityLogs = [
      {
        admin_id: testUser.id,
        action_type: 'user_management',
        target_type: 'user',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { action: 'user_suspended', target_user: 'user_456' }
      },
      {
        admin_id: testUser.id,
        action_type: 'security_settings_update',
        target_type: 'settings',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { setting: 'rate_limits', value: 'increased' }
      },
      {
        admin_id: testUser.id,
        action_type: 'alert_resolution',
        target_type: 'alert',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { alert_id: 'alert_789', resolution: 'false_positive' }
      },
      {
        admin_id: testUser.id,
        action_type: 'file_approval',
        target_type: 'file',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { file_id: 'file_123', approved: true }
      },
      {
        admin_id: testUser.id,
        action_type: 'system_configuration',
        target_type: 'system',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { config: 'security_level', value: 'high' }
      }
    ];

    // Create security alerts
    const securityAlerts = [
      {
        alert_type: 'failed_login_attempts',
        severity: 'high',
        message: 'Multiple failed login attempts detected from IP 203.0.113.50',
        user_id: testUser.id,
        ip_address: '203.0.113.50',
        resolved: false,
        details: { attempts: 5, time_window: '15 minutes' }
      },
      {
        alert_type: 'suspicious_file_upload',
        severity: 'medium',
        message: 'Suspicious file upload detected: executable file type',
        user_id: testUser.id,
        ip_address: '192.168.1.1',
        resolved: false,
        details: { filename: 'suspicious.exe', file_type: 'executable' }
      },
      {
        alert_type: 'unusual_activity',
        severity: 'low',
        message: 'Unusual user activity pattern detected',
        user_id: testUser.id,
        ip_address: '192.168.1.1',
        resolved: true,
        details: { activity: 'rapid_booking_creation', count: 10 }
      },
      {
        alert_type: 'api_rate_limit_exceeded',
        severity: 'medium',
        message: 'API rate limit exceeded for endpoint /api/bookings',
        user_id: testUser.id,
        ip_address: '198.51.100.25',
        resolved: false,
        details: { endpoint: '/api/bookings', requests: 150, limit: 100 }
      },
      {
        alert_type: 'session_anomaly',
        severity: 'high',
        message: 'Session accessed from multiple locations simultaneously',
        user_id: testUser.id,
        ip_address: '203.0.113.50',
        resolved: false,
        details: { locations: ['London', 'Moscow'], time_diff: '2 minutes' }
      }
    ];

    // Create file security records
    const fileSecurity = [
      {
        file_path: '/uploads/driver_license_john_doe.pdf',
        file_hash: 'sha256:abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
        mime_type: 'application/pdf',
        file_size: 2048576,
        uploaded_by: testUser.id,
        upload_ip: '192.168.1.1',
        is_approved: true,
        approved_by: testUser.id,
        approved_at: new Date().toISOString()
      },
      {
        file_path: '/uploads/vehicle_registration_toyota_camry.pdf',
        file_hash: 'sha256:def456ghi789jkl012mno345pqr678stu901vwx234yz567abc123',
        mime_type: 'application/pdf',
        file_size: 1536000,
        uploaded_by: testUser.id,
        upload_ip: '192.168.1.1',
        is_approved: false
      },
      {
        file_path: '/uploads/insurance_certificate.pdf',
        file_hash: 'sha256:ghi789jkl012mno345pqr678stu901vwx234yz567abc123def456',
        mime_type: 'application/pdf',
        file_size: 3072000,
        uploaded_by: testUser.id,
        upload_ip: '192.168.1.1',
        is_approved: true,
        approved_by: testUser.id,
        approved_at: new Date().toISOString()
      },
      {
        file_path: '/uploads/suspicious_file.exe',
        file_hash: 'sha256:jkl012mno345pqr678stu901vwx234yz567abc123def456ghi789',
        mime_type: 'application/x-msdownload',
        file_size: 512000,
        uploaded_by: testUser.id,
        upload_ip: '203.0.113.50',
        is_approved: false
      },
      {
        file_path: '/uploads/profile_photo.jpg',
        file_hash: 'sha256:mno345pqr678stu901vwx234yz567abc123def456ghi789jkl012',
        mime_type: 'image/jpeg',
        file_size: 1024000,
        uploaded_by: testUser.id,
        upload_ip: '192.168.1.1',
        is_approved: true,
        approved_by: testUser.id,
        approved_at: new Date().toISOString()
      }
    ];

    // Create user sessions
    const userSessions = [
      {
        user_id: testUser.id,
        session_token: 'session_token_123',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: testUser.id,
        session_token: 'session_token_456',
        ip_address: '203.0.113.50',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        is_active: true,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        user_id: testUser.id,
        session_token: 'session_token_789',
        ip_address: '198.51.100.25',
        user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        is_active: false,
        expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
      }
    ];

    // Create rate limits
    const rateLimits = [
      {
        identifier: '192.168.1.1',
        endpoint: '/api/login',
        request_count: 5,
        window_start: new Date().toISOString()
      },
      {
        identifier: '203.0.113.50',
        endpoint: '/api/bookings',
        request_count: 150,
        window_start: new Date().toISOString()
      },
      {
        identifier: '198.51.100.25',
        endpoint: '/api/payments',
        request_count: 25,
        window_start: new Date().toISOString()
      },
      {
        identifier: testUser.id,
        endpoint: '/api/file-upload',
        request_count: 10,
        window_start: new Date().toISOString()
      }
    ];

    // Insert all data
    console.log('Inserting system logs...');
    await supabase.from('system_logs').insert(systemLogs);

    console.log('Inserting user action logs...');
    await supabase.from('user_action_logs').insert(userActionLogs);

    console.log('Inserting admin activity logs...');
    await supabase.from('admin_activity_logs').insert(adminActivityLogs);

    console.log('Inserting security alerts...');
    await supabase.from('security_alerts').insert(securityAlerts);

    console.log('Inserting file security records...');
    await supabase.from('file_security').insert(fileSecurity);

    console.log('Inserting user sessions...');
    await supabase.from('user_sessions').insert(userSessions);

    console.log('Inserting rate limits...');
    await supabase.from('rate_limits').insert(rateLimits);

    console.log('Security sample data created successfully!');
  } catch (error) {
    console.error('Error creating security data:', error);
  }
}

createSecurityData(); 