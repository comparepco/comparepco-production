'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaBell, FaTimes, FaCheck, FaExclamationTriangle, FaInfoCircle, FaUser, FaCog, FaEnvelope, FaCalendar, FaShieldAlt, FaHandshake, FaUserTie, FaTruck, FaFileAlt, FaMoneyBillWave, FaCalendarCheck } from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'partners' | 'drivers' | 'fleet' | 'documents' | 'payments' | 'bookings' | 'claims' | 'support' | 'system' | 'security';
  is_read: boolean;
  created_at: string;
  user_id: string;
  action_url?: string;
  metadata?: any;
  data?: any;
}

export default function UnifiedNotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    setupRealtimeSubscription().catch(console.error);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.is_read).length);
  }, [notifications]);

  // Role-based access control
  const getUserPermissions = () => {
    if (!user) return { canViewAll: false, allowedCategories: [] };
    
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { canViewAll: true, allowedCategories: ['partners', 'drivers', 'fleet', 'documents', 'payments', 'bookings', 'claims', 'support', 'system', 'security'] };
      case 'ADMIN':
        return { canViewAll: true, allowedCategories: ['partners', 'drivers', 'fleet', 'documents', 'payments', 'bookings', 'claims', 'support', 'system', 'security'] };
      case 'ADMIN_STAFF':
        return { canViewAll: false, allowedCategories: ['notifications', 'support', 'partners', 'drivers', 'fleet', 'documents', 'payments', 'bookings', 'claims', 'system', 'security'] };
      default:
        return { canViewAll: false, allowedCategories: [] };
    }
  };

  const loadNotifications = async () => {
    try {
      if (!user) return;

      // Role-based notification loading
      const permissions = getUserPermissions();
      
      const [supportNotifications, systemNotifications, securityNotifications, userNotifications, partnerNotifications, driverNotifications, fleetNotifications, documentNotifications, paymentNotifications, bookingNotifications, claimNotifications] = await Promise.allSettled([
        // Support notifications
        supabase
          .from('support_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        
        // System notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .in('level', ['error', 'warning', 'info'])
          .order('created_at', { ascending: false })
          .limit(20),
        
        // Security notifications (from security_alerts)
        supabase
          .from('security_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
        
        // User activity notifications (from user_action_logs)
        supabase
          .from('user_action_logs')
          .select('*')
          .in('action_type', ['login', 'logout', 'password_change', 'role_change'])
          .order('created_at', { ascending: false })
          .limit(20),

        // Partner notifications (from partner_actions)
        supabase
          .from('partner_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),

        // Driver notifications (from user_action_logs for drivers)
        supabase
          .from('user_action_logs')
          .select('*')
          .in('action_type', ['driver_registration', 'driver_verification', 'driver_status_change'])
          .order('created_at', { ascending: false })
          .limit(20),

        // Fleet notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%fleet%')
          .or('message.ilike.%vehicle%')
          .order('created_at', { ascending: false })
          .limit(20),

        // Document notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%document%')
          .or('message.ilike.%file%')
          .order('created_at', { ascending: false })
          .limit(20),

        // Payment notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%payment%')
          .or('message.ilike.%transaction%')
          .order('created_at', { ascending: false })
          .limit(20),

        // Booking notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%booking%')
          .or('message.ilike.%reservation%')
          .order('created_at', { ascending: false })
          .limit(20),

        // Claim notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%claim%')
          .or('message.ilike.%insurance%')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      const allNotifications: Notification[] = [];
      const STORAGE_KEY = 'admin_read_notifications';
      const getHidden = () => {
        if (typeof window === 'undefined') return [] as string[];
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); } catch { return []; }
      };
      const addHidden = (ids: string[]) => {
        if (typeof window === 'undefined') return;
        const merged = Array.from(new Set([...getHidden(), ...ids]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      };

      const processedIds = new Set<string>(); // Track processed IDs to prevent duplicates

      // Process support notifications
      if (supportNotifications.status === 'fulfilled' && supportNotifications.value.data) {
        supportNotifications.value.data.forEach((notif: any) => {
          if (!processedIds.has(notif.id)) {
            processedIds.add(notif.id);
            allNotifications.push({
              id: notif.id,
              title: notif.title || 'Support Notification',
              message: notif.message || 'New support activity',
              type: notif.notification_type === 'urgent' ? 'error' : 'info',
              category: 'support',
              is_read: notif.is_read || false,
              created_at: notif.created_at,
              user_id: notif.user_id || user.id,
              data: notif
            });
          }
        });
      }

      // Process system notifications
      if (systemNotifications.status === 'fulfilled' && systemNotifications.value.data) {
        systemNotifications.value.data.forEach((log: any) => {
          if (!processedIds.has(log.id)) {
            processedIds.add(log.id);
            allNotifications.push({
              id: log.id,
              title: `System ${log.level.toUpperCase()}`,
              message: log.message || 'System activity',
              type: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info',
              category: 'system',
              is_read: false,
              created_at: log.created_at,
              user_id: user.id,
              data: log
            });
          }
        });
      }

      // Process security notifications
      if (securityNotifications.status === 'fulfilled' && securityNotifications.value.data) {
        securityNotifications.value.data.forEach((alert: any) => {
          if (!processedIds.has(alert.id)) {
            processedIds.add(alert.id);
            allNotifications.push({
              id: alert.id,
              title: `Security Alert: ${alert.alert_type || 'Unknown'}`,
              message: alert.description || 'Security event detected',
              type: alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info',
              category: 'security',
              is_read: false,
              created_at: alert.created_at,
              user_id: user.id,
              data: alert
            });
          }
        });
      }

      /* Disabled user activity notifications as per requirement
      /* Skipping user activity login/logout notifications as requested */

      // Process partner notifications
      if (partnerNotifications.status === 'fulfilled' && partnerNotifications.value.data) {
        partnerNotifications.value.data.forEach((action: any) => {
          if (!processedIds.has(action.id)) {
            processedIds.add(action.id);
            allNotifications.push({
              id: action.id,
              title: `Partner Action: ${action.action_type}`,
              message: `${action.partner_name || 'Unknown partner'} - ${action.action_type}`,
              type: 'info',
              category: 'partners',
              is_read: false,
              created_at: action.created_at,
              user_id: user.id,
              data: action
            });
          }
        });
      }

      // Process driver notifications
      if (driverNotifications.status === 'fulfilled' && driverNotifications.value.data) {
        driverNotifications.value.data.forEach((action: any) => {
          if (!processedIds.has(action.id)) {
            processedIds.add(action.id);
            allNotifications.push({
              id: action.id,
              title: `Driver Activity: ${action.action_type}`,
              message: `${action.user_email || 'Unknown driver'} - ${action.action_type}`,
              type: 'info',
              category: 'drivers',
              is_read: false,
              created_at: action.created_at,
              user_id: user.id,
              data: action
            });
          }
        });
      }

      // Process fleet notifications
      if (fleetNotifications.status === 'fulfilled' && fleetNotifications.value.data) {
        fleetNotifications.value.data.forEach((log: any) => {
          if (!processedIds.has(log.id)) {
            processedIds.add(log.id);
            allNotifications.push({
              id: log.id,
              title: `Fleet Update: ${log.level.toUpperCase()}`,
              message: log.message || 'Fleet activity',
              type: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info',
              category: 'fleet',
              is_read: false,
              created_at: log.created_at,
              user_id: user.id,
              data: log
            });
          }
        });
      }

      // Process document notifications
      if (documentNotifications.status === 'fulfilled' && documentNotifications.value.data) {
        documentNotifications.value.data.forEach((log: any) => {
          if (!processedIds.has(log.id)) {
            processedIds.add(log.id);
            allNotifications.push({
              id: log.id,
              title: `Document Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Document activity',
              type: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info',
              category: 'documents',
              is_read: false,
              created_at: log.created_at,
              user_id: user.id,
              data: log
            });
          }
        });
      }

      // Process payment notifications
      if (paymentNotifications.status === 'fulfilled' && paymentNotifications.value.data) {
        paymentNotifications.value.data.forEach((log: any) => {
          if (!processedIds.has(log.id)) {
            processedIds.add(log.id);
            allNotifications.push({
              id: log.id,
              title: `Payment Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Payment activity',
              type: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info',
              category: 'payments',
              is_read: false,
              created_at: log.created_at,
              user_id: user.id,
              data: log
            });
          }
        });
      }

      // Process booking notifications
      if (bookingNotifications.status === 'fulfilled' && bookingNotifications.value.data) {
        bookingNotifications.value.data.forEach((log: any) => {
          if (!processedIds.has(log.id)) {
            processedIds.add(log.id);
            allNotifications.push({
              id: log.id,
              title: `Booking Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Booking activity',
              type: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info',
              category: 'bookings',
              is_read: false,
              created_at: log.created_at,
              user_id: user.id,
              data: log
            });
          }
        });
      }

      // Process claim notifications
      if (claimNotifications.status === 'fulfilled' && claimNotifications.value.data) {
        claimNotifications.value.data.forEach((log: any) => {
          if (!processedIds.has(log.id)) {
            processedIds.add(log.id);
            allNotifications.push({
              id: log.id,
              title: `Claim Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Claim activity',
              type: log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info',
              category: 'claims',
              is_read: false,
              created_at: log.created_at,
              user_id: user.id,
              data: log
            });
          }
        });
      }

      // Deduplicate notifications by composite fingerprint
      const dedupSeen = new Set<string>();
      const uniqueNotifications = allNotifications.filter(n => {
        const key = `${n.category}-${n.title}-${n.message}-${new Date(n.created_at).toISOString().slice(0,19)}`;
        if (dedupSeen.has(key)) return false;
        dedupSeen.add(key);
        return true;
      });

      // Remove locally hidden ids
      const visible = uniqueNotifications.filter(n=> !getHidden().includes(n.id));

      // Filter notifications based on role permissions
      const filteredNotifications = permissions.canViewAll 
        ? visible 
        : visible.filter(notif => 
            permissions.allowedCategories.includes(notif.category)
          );

      // Sort by creation date
      filteredNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'support_notifications' }, () => {
          loadNotifications();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_logs' }, () => {
          loadNotifications();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'security_alerts' }, () => {
          loadNotifications();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_actions' }, () => {
          loadNotifications();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_action_logs' }, () => {
          loadNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      if (notification.category === 'support') {
        await supabase
          .from('support_notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      }

      // Update the notification state and remove from unread count
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      
      // Show success feedback
      // update badge immediately
      setUnreadCount(prev => Math.max(prev - 1, 0));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read && n.category === 'support');
      
      if (unreadNotifications.length === 0) {
        toast('No unread notifications to mark');
        return;
      }
      
      for (const notification of unreadNotifications) {
        await supabase
          .from('support_notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
      }

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success(`Marked ${unreadNotifications.length} notifications as read`);
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      if (notification.category === 'support') {
        await supabase
          .from('support_notifications')
          .delete()
          .eq('id', notificationId);
      }

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(prev - 1, 0));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    switch (category) {
      case 'partners':
        return <FaHandshake className="w-4 h-4 text-orange-500" />;
      case 'drivers':
        return <FaUserTie className="w-4 h-4 text-indigo-500" />;
      case 'fleet':
        return <FaTruck className="w-4 h-4 text-blue-500" />;
      case 'documents':
        return <FaFileAlt className="w-4 h-4 text-green-500" />;
      case 'payments':
        return <FaMoneyBillWave className="w-4 h-4 text-emerald-500" />;
      case 'bookings':
        return <FaCalendarCheck className="w-4 h-4 text-purple-500" />;
      case 'claims':
        return <FaExclamationTriangle className="w-4 h-4 text-red-500" />;
      case 'support':
        return <FaEnvelope className="w-4 h-4 text-cyan-500" />;
      case 'system':
        return <FaCog className="w-4 h-4 text-gray-500" />;
      case 'security':
        return <FaShieldAlt className="w-4 h-4 text-red-500" />;
      default:
        return <FaBell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    // Navigate based on notification category
    switch (notification.category) {
      case 'partners':
        router.push('/admin/partners');
        break;
      case 'drivers':
        router.push('/admin/drivers');
        break;
      case 'fleet':
        router.push('/admin/fleet');
        break;
      case 'documents':
        router.push('/admin/documents');
        break;
      case 'payments':
        router.push('/admin/payments');
        break;
      case 'bookings':
        router.push('/admin/bookings');
        break;
      case 'claims':
        router.push('/admin/claims');
        break;
      case 'support':
        router.push('/admin/support');
        break;
      case 'security':
        router.push('/admin/security');
        break;
      default:
        router.push('/admin/notifications');
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.filter(n => !n.is_read).length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FaBell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No unread notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {notifications
                  .filter(n => !n.is_read)
                  .slice(0, 10)
                  .map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type, notification.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              New
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          <div className="flex items-center space-x-1">
                            {!notification.is_read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title="Mark as read"
                              >
                                <FaCheck className="w-3 h-3" />
                              </button>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete notification"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => {
                  router.push('/admin/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                View all notifications ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 