require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createNotificationData() {
  try {
    console.log('🚀 Creating notification data...');

    // Get the existing partner
    const { data: partners, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (partnerError || !partners || partners.length === 0) {
      console.error('❌ No partners found');
      return;
    }

    const partnerId = '939006e2-b68d-4404-bee8-926d440bcfa3'; // Use the correct partner ID
    console.log(`✅ Found partner: ${partnerId}`);

    // Create test notifications
    const notifications = [
      {
        partner_id: partnerId,
        type: 'BOOKING_UPDATE',
        title: 'New Booking Received',
        message: 'You have received a new booking for Toyota Prius from John Doe. Booking ID: BK-2024-001',
        is_read: false,
        data: {
          priority: 'high',
          category: 'Bookings',
          tags: ['booking', 'new', 'urgent']
        }
      },
      {
        partner_id: partnerId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: 'Payment of £150.00 has been received for booking BK-2024-001. Transaction ID: TX-2024-001',
        is_read: false,
        data: {
          priority: 'medium',
          category: 'Payments',
          tags: ['payment', 'received']
        }
      },
      {
        partner_id: partnerId,
        type: 'DOCUMENT_EXPIRY',
        title: 'Insurance Document Expiring Soon',
        message: 'Your vehicle insurance for Toyota Prius (AB12 CDE) expires in 15 days. Please renew to avoid service interruption.',
        is_read: false,
        data: {
          priority: 'urgent',
          category: 'Documents',
          tags: ['insurance', 'expiry', 'urgent']
        }
      },
      {
        partner_id: partnerId,
        type: 'MAINTENANCE_DUE',
        title: 'Vehicle Maintenance Due',
        message: 'Scheduled maintenance is due for Honda CR-V (TEST-002) in 7 days. Please schedule a service appointment.',
        is_read: true,
        data: {
          priority: 'high',
          category: 'Maintenance',
          tags: ['maintenance', 'scheduled']
        }
      },
      {
        partner_id: partnerId,
        type: 'CLAIM_UPDATE',
        title: 'Claim Status Updated',
        message: 'Your claim CL-2024-001 has been approved. Payment will be processed within 3-5 business days.',
        is_read: true,
        data: {
          priority: 'medium',
          category: 'Claims',
          tags: ['claim', 'approved']
        }
      },
      {
        partner_id: partnerId,
        type: 'SYSTEM_ALERT',
        title: 'System Maintenance Scheduled',
        message: 'Scheduled system maintenance will occur on Sunday, 2:00 AM - 4:00 AM. Service may be temporarily unavailable.',
        is_read: false,
        data: {
          priority: 'low',
          category: 'System',
          tags: ['maintenance', 'scheduled']
        }
      },
      {
        partner_id: partnerId,
        type: 'PROMOTION',
        title: 'New Marketing Campaign Available',
        message: 'Boost your bookings with our new "Summer Special" campaign. Get 20% more visibility for your vehicles.',
        is_read: false,
        data: {
          priority: 'medium',
          category: 'Marketing',
          tags: ['promotion', 'campaign']
        }
      },
      {
        partner_id: partnerId,
        type: 'PRICING_UPDATE',
        title: 'Pricing Template Updated',
        message: 'Your "Economy Sedan" pricing template has been updated with new rates. Review and approve changes.',
        is_read: true,
        data: {
          priority: 'medium',
          category: 'Pricing',
          tags: ['pricing', 'template']
        }
      },
      {
        partner_id: partnerId,
        type: 'VEHICLE_UPDATE',
        title: 'Vehicle Status Changed',
        message: 'Toyota Prius (AB12 CDE) status has been updated to "Available". Vehicle is ready for bookings.',
        is_read: false,
        data: {
          priority: 'low',
          category: 'Vehicles',
          tags: ['vehicle', 'status']
        }
      },
      {
        partner_id: partnerId,
        type: 'DRIVER_UPDATE',
        title: 'Driver Verification Complete',
        message: 'Driver verification for John Smith has been completed and approved. Driver is now active.',
        is_read: true,
        data: {
          priority: 'medium',
          category: 'Drivers',
          tags: ['driver', 'verification']
        }
      },
      {
        partner_id: partnerId,
        type: 'BOOKING_UPDATE',
        title: 'Booking Cancelled',
        message: 'Booking BK-2024-002 has been cancelled by the customer. Reason: Schedule conflict.',
        is_read: false,
        data: {
          priority: 'medium',
          category: 'Bookings',
          tags: ['booking', 'cancelled']
        }
      },
      {
        partner_id: partnerId,
        type: 'PAYMENT_RECEIVED',
        title: 'Weekly Payout Processed',
        message: 'Weekly payout of £2,450.00 has been processed to your account. Transaction ID: TX-2024-002',
        is_read: false,
        data: {
          priority: 'high',
          category: 'Payments',
          tags: ['payout', 'weekly']
        }
      }
    ];

    console.log('📝 Creating notifications...');
    const { data: createdNotifications, error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (notificationError) {
      console.error('❌ Error creating notifications:', notificationError);
      return;
    }

    console.log(`✅ Created ${createdNotifications.length} notifications`);
    console.log('📊 Summary:');
    console.log(`   - ${createdNotifications.length} notifications created`);
    console.log(`   - ${notifications.filter(n => !n.is_read).length} unread notifications`);
    console.log(`   - ${notifications.filter(n => n.is_read).length} read notifications`);

    // Log notification types distribution
    const typeCounts = {};
    notifications.forEach(n => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });
    
    console.log('📈 Notification types:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error creating notification data:', error);
  }
}

createNotificationData(); 