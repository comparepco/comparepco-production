'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaBell, FaEnvelope, FaExclamationTriangle, FaCheckCircle, FaTimes,
  FaEye, FaTrash, FaSearch, FaFilter, FaRedo, FaClock, FaUser,
  FaHeadset, FaShieldAlt, FaCog, FaChartLine, FaUserPlus, FaUserMinus,
  FaFileAlt, FaCreditCard, FaCar, FaBuilding, FaGlobe, FaLock, FaUnlock,
  FaArrowUp, FaArrowDown, FaStar, FaThumbsUp, FaThumbsDown, FaInfoCircle,
  FaHandshake, FaUserTie, FaCalendarCheck, FaMoneyBillWave, FaTruck,
  FaExclamationCircle, FaCheckDouble, FaTimesCircle, FaInfo
} from 'react-icons/fa';

interface Notification {
  id: string;
  type: 'support' | 'system' | 'security' | 'user' | 'admin' | 'general';
  category: 'partners' | 'drivers' | 'fleet' | 'documents' | 'payments' | 'bookings' | 'claims' | 'support' | 'system' | 'security';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  related_id?: string;
  data?: any;
}

interface NotificationStats {
  total: number;
  unread: number;
  partners: number;
  drivers: number;
  fleet: number;
  documents: number;
  payments: number;
  bookings: number;
  claims: number;
  support: number;
  system: number;
  security: number;
}

interface CategoryInfo {
  key: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    partners: 0,
    drivers: 0,
    fleet: 0,
    documents: 0,
    payments: 0,
    bookings: 0,
    claims: 0,
    support: 0,
    system: 0,
    security: 0
  });
  const [filterType, setFilterType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRead, setShowRead] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // LocalStorage key for hidden/read notifications
  const STORAGE_KEY = 'admin_read_notifications';
  const getHiddenIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  };
  const addHiddenIds = (ids: string[]) => {
    if (typeof window === 'undefined') return;
    const current = getHiddenIds();
    const merged = Array.from(new Set([...current, ...ids]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  // Category definitions with icons and colors
  const categories: CategoryInfo[] = [
    {
      key: 'partners',
      label: 'Partners',
      icon: <FaHandshake className="w-5 h-5" />,
      color: 'text-orange-600',
      description: 'Partner-related notifications'
    },
    {
      key: 'drivers',
      label: 'Drivers',
      icon: <FaUserTie className="w-5 h-5" />,
      color: 'text-indigo-600',
      description: 'Driver-related notifications'
    },
    {
      key: 'fleet',
      label: 'Fleet',
      icon: <FaTruck className="w-5 h-5" />,
      color: 'text-blue-600',
      description: 'Fleet and vehicle notifications'
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: <FaFileAlt className="w-5 h-5" />,
      color: 'text-green-600',
      description: 'Document-related notifications'
    },
    {
      key: 'payments',
      label: 'Payments',
      icon: <FaMoneyBillWave className="w-5 h-5" />,
      color: 'text-emerald-600',
      description: 'Payment and financial notifications'
    },
    {
      key: 'bookings',
      label: 'Bookings',
      icon: <FaCalendarCheck className="w-5 h-5" />,
      color: 'text-purple-600',
      description: 'Booking-related notifications'
    },
    {
      key: 'claims',
      label: 'Claims',
      icon: <FaExclamationTriangle className="w-5 h-5" />,
      color: 'text-red-600',
      description: 'Insurance and claims notifications'
    },
    {
      key: 'support',
      label: 'Support',
      icon: <FaHeadset className="w-5 h-5" />,
      color: 'text-cyan-600',
      description: 'Support and help desk notifications'
    },
    {
      key: 'system',
      label: 'System',
      icon: <FaCog className="w-5 h-5" />,
      color: 'text-gray-600',
      description: 'System and technical notifications'
    },
    {
      key: 'security',
      label: 'Security',
      icon: <FaShieldAlt className="w-5 h-5" />,
      color: 'text-red-600',
      description: 'Security and access notifications'
    }
  ];

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Role-based access control
  const getUserPermissions = () => {
    if (!user) return { canViewAll: false, allowedCategories: [] };
    
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { canViewAll: true, allowedCategories: categories.map(c => c.key) };
      case 'ADMIN':
        return { canViewAll: true, allowedCategories: categories.map(c => c.key) };
      case 'ADMIN_STAFF':
        // Get staff permissions from database - but always include notifications
        return { canViewAll: false, allowedCategories: ['notifications', 'support', 'partners', 'drivers', 'fleet', 'documents', 'payments', 'bookings', 'claims', 'system', 'security'] };
      default:
        return { canViewAll: false, allowedCategories: [] };
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const permissions = getUserPermissions();

      // Load notifications from multiple sources based on role
      const [supportNotifications, systemNotifications, securityNotifications, userNotifications, partnerNotifications, driverNotifications, fleetNotifications, documentNotifications, paymentNotifications, bookingNotifications, claimNotifications] = await Promise.allSettled([
        // Support notifications
        supabase
          .from('support_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        
        // System notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .in('level', ['error', 'warning', 'info'])
          .order('created_at', { ascending: false })
          .limit(50),
        
        // Security notifications (from security_alerts)
        supabase
          .from('security_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        
        // User activity notifications (from user_action_logs)
        supabase
          .from('user_action_logs')
          .select('*')
          .in('action_type', ['login', 'logout', 'password_change', 'role_change'])
          .order('created_at', { ascending: false })
          .limit(50),

        // Partner notifications (from partner_actions)
        supabase
          .from('partner_actions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),

        // Driver notifications (from user_action_logs for drivers)
        supabase
          .from('user_action_logs')
          .select('*')
          .in('action_type', ['driver_registration', 'driver_verification', 'driver_status_change'])
          .order('created_at', { ascending: false })
          .limit(50),

        // Fleet notifications (from fleet_events or system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%fleet%')
          .or('message.ilike.%vehicle%')
          .order('created_at', { ascending: false })
          .limit(50),

        // Document notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%document%')
          .or('message.ilike.%file%')
          .order('created_at', { ascending: false })
          .limit(50),

        // Payment notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%payment%')
          .or('message.ilike.%transaction%')
          .order('created_at', { ascending: false })
          .limit(50),

        // Booking notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%booking%')
          .or('message.ilike.%reservation%')
          .order('created_at', { ascending: false })
          .limit(50),

        // Claim notifications (from system_logs)
        supabase
          .from('system_logs')
          .select('*')
          .ilike('message', '%claim%')
          .or('message.ilike.%insurance%')
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      const allNotifications: Notification[] = [];
      const processedIds = new Set<string>(); // Track processed IDs to prevent duplicates

      // Process support notifications
      if (supportNotifications.status === 'fulfilled' && supportNotifications.value.data) {
        supportNotifications.value.data.forEach((notif: any) => {
          if (!processedIds.has(notif.id)) {
            processedIds.add(notif.id);
            allNotifications.push({
              id: notif.id,
              type: 'support',
              category: 'support',
              title: notif.title || 'Support Notification',
              message: notif.message || 'New support activity',
              priority: notif.notification_type === 'urgent' ? 'high' : 'medium',
              is_read: notif.is_read || false,
              created_at: notif.created_at,
              updated_at: notif.updated_at,
              user_id: notif.user_id,
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
              type: 'system',
              category: 'system',
              title: `System ${log.level.toUpperCase()}`,
              message: log.message || 'System activity',
              priority: log.level === 'error' ? 'critical' : log.level === 'warning' ? 'high' : 'medium',
              is_read: false,
              created_at: log.created_at,
              updated_at: log.updated_at,
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
              type: 'security',
              category: 'security',
              title: `Security Alert: ${alert.alert_type || 'Unknown'}`,
              message: alert.description || 'Security event detected',
              priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'medium',
              is_read: false,
              created_at: alert.created_at,
              updated_at: alert.updated_at,
              data: alert
            });
          }
        });
      }

      // Process user notifications
      if (userNotifications.status === 'fulfilled' && userNotifications.value.data) {
        userNotifications.value.data.forEach((action: any) => {
          if (!processedIds.has(action.id)) {
            processedIds.add(action.id);
            allNotifications.push({
              id: action.id,
              type: 'user',
              category: 'system',
              title: `User Activity: ${action.action_type}`,
              message: `${action.user_email || 'Unknown user'} performed ${action.action_type}`,
              priority: 'low',
              is_read: false,
              created_at: action.created_at,
              updated_at: action.updated_at,
              data: action
            });
          }
        });
      }

      // Process partner notifications
      if (partnerNotifications.status === 'fulfilled' && partnerNotifications.value.data) {
        partnerNotifications.value.data.forEach((action: any) => {
          if (!processedIds.has(action.id)) {
            processedIds.add(action.id);
            allNotifications.push({
              id: action.id,
              type: 'admin',
              category: 'partners',
              title: `Partner Action: ${action.action_type}`,
              message: `${action.partner_name || 'Unknown partner'} - ${action.action_type}`,
              priority: 'medium',
              is_read: false,
              created_at: action.created_at,
              updated_at: action.created_at,
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
              type: 'admin',
              category: 'drivers',
              title: `Driver Activity: ${action.action_type}`,
              message: `${action.user_email || 'Unknown driver'} - ${action.action_type}`,
              priority: 'medium',
              is_read: false,
              created_at: action.created_at,
              updated_at: action.created_at,
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
              type: 'system',
              category: 'fleet',
              title: `Fleet Update: ${log.level.toUpperCase()}`,
              message: log.message || 'Fleet activity',
              priority: log.level === 'error' ? 'high' : 'medium',
              is_read: false,
              created_at: log.created_at,
              updated_at: log.updated_at,
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
              type: 'system',
              category: 'documents',
              title: `Document Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Document activity',
              priority: log.level === 'error' ? 'high' : 'medium',
              is_read: false,
              created_at: log.created_at,
              updated_at: log.updated_at,
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
              type: 'system',
              category: 'payments',
              title: `Payment Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Payment activity',
              priority: log.level === 'error' ? 'high' : 'medium',
              is_read: false,
              created_at: log.created_at,
              updated_at: log.updated_at,
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
              type: 'system',
              category: 'bookings',
              title: `Booking Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Booking activity',
              priority: log.level === 'error' ? 'high' : 'medium',
              is_read: false,
              created_at: log.created_at,
              updated_at: log.updated_at,
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
              type: 'system',
              category: 'claims',
              title: `Claim Activity: ${log.level.toUpperCase()}`,
              message: log.message || 'Claim activity',
              priority: log.level === 'error' ? 'high' : 'medium',
              is_read: false,
              created_at: log.created_at,
              updated_at: log.updated_at,
              data: log
            });
          }
        });
      }

      // Deduplicate by composite fingerprint (category+title+message+timestamp)
      const seenKeys = new Set<string>();
      const uniqueNotifications = allNotifications.filter(n => {
        const key = `${n.category}-${n.title}-${n.message}-${new Date(n.created_at).toISOString().slice(0,19)}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      // Remove hidden/read ids stored locally
      const visibleNotifications = uniqueNotifications.filter(n => !getHiddenIds().includes(n.id));

      // Filter notifications based on role permissions
      const filteredNotifications = permissions.canViewAll 
        ? visibleNotifications 
        : visibleNotifications.filter(notif => 
            permissions.allowedCategories.includes(notif.category)
          );

      // Sort by creation date
      filteredNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(filteredNotifications);
      updateStats(filteredNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (notifs: Notification[]) => {
    const stats: NotificationStats = {
      total: notifs.length,
      unread: notifs.filter(n => !n.is_read).length,
      partners: notifs.filter(n => n.category === 'partners').length,
      drivers: notifs.filter(n => n.category === 'drivers').length,
      fleet: notifs.filter(n => n.category === 'fleet').length,
      documents: notifs.filter(n => n.category === 'documents').length,
      payments: notifs.filter(n => n.category === 'payments').length,
      bookings: notifs.filter(n => n.category === 'bookings').length,
      claims: notifs.filter(n => n.category === 'claims').length,
      support: notifs.filter(n => n.category === 'support').length,
      system: notifs.filter(n => n.category === 'system').length,
      security: notifs.filter(n => n.category === 'security').length
    };
    setStats(stats);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Update database first
      if (notification.type === 'support') {
        const { error } = await supabase
          .from('support_notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
        
        if (error) {
          console.error('Error updating database:', error);
          return;
        }
      }

      // Persist hidden id locally and update UI
      addHiddenIds([notificationId]);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      updateStats(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read && n.type === 'support');
      
      if (unreadNotifications.length === 0) {
        toast('No unread notifications to mark');
        return;
      }

      // Update all in database first
      for (const notification of unreadNotifications) {
        const { error } = await supabase
          .from('support_notifications')
          .update({ is_read: true })
          .eq('id', notification.id);
        
        if (error) {
          console.error('Error updating notification:', notification.id, error);
        }
      }

      addHiddenIds(unreadNotifications.map(n=>n.id));
      setNotifications(prev => prev.filter(n => n.type !== 'support' || n.is_read));
      updateStats(notifications.filter(n => n.type !== 'support' || n.is_read));
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification) return;

      // Delete from database first
      if (notification.type === 'support') {
        const { error } = await supabase
          .from('support_notifications')
          .delete()
          .eq('id', notificationId);
        
        if (error) {
          console.error('Error deleting from database:', error);
          return;
        }
      }

      addHiddenIds([notificationId]);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      updateStats(notifications.filter(n => n.id !== notificationId));
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    switch (category) {
      case 'partners':
        return <FaHandshake className="w-5 h-5 text-orange-500" />;
      case 'drivers':
        return <FaUserTie className="w-5 h-5 text-indigo-500" />;
      case 'fleet':
        return <FaTruck className="w-5 h-5 text-blue-500" />;
      case 'documents':
        return <FaFileAlt className="w-5 h-5 text-green-500" />;
      case 'payments':
        return <FaMoneyBillWave className="w-5 h-5 text-emerald-500" />;
      case 'bookings':
        return <FaCalendarCheck className="w-5 h-5 text-purple-500" />;
      case 'claims':
        return <FaExclamationTriangle className="w-5 h-5 text-red-500" />;
      case 'support':
        return <FaHeadset className="w-5 h-5 text-cyan-500" />;
      case 'system':
        return <FaCog className="w-5 h-5 text-gray-500" />;
      case 'security':
        return <FaShieldAlt className="w-5 h-5 text-red-500" />;
      default:
        return <FaBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryInfo = categories.find(c => c.key === category);
    return categoryInfo ? categoryInfo.color.replace('text-', 'bg-').replace('-600', '-100') + ' text-' + categoryInfo.color.replace('text-', '').replace('-600', '-800') : 'bg-gray-100 text-gray-800';
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = !filterType || notification.type === filterType;
    const matchesCategory = !filterCategory || notification.category === filterCategory;
    const matchesPriority = !filterPriority || notification.priority === filterPriority;
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReadStatus = showRead || !notification.is_read;
    const matchesSelectedCategory = selectedCategory === 'all' || notification.category === selectedCategory;

    return matchesType && matchesCategory && matchesPriority && matchesSearch && matchesReadStatus && matchesSelectedCategory;
  });

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const category = notification.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FaBell className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Notifications
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage and monitor all system notifications and alerts
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadNotifications}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <FaRedo className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={markAllAsRead}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
              >
                <FaCheckCircle className="w-4 h-4 mr-2" />
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <FaBell className="w-6 h-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <FaEnvelope className="w-6 h-6 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unread}</p>
              </div>
            </div>
          </div>

          {categories.map(category => (
            <div key={category.key} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className={`w-6 h-6 ${category.color}`}>
                  {category.icon}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{category.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats[category.key as keyof NotificationStats] || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Categories
              </button>
              {categories.map(category => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    selectedCategory === category.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.key} value={category.key}>{category.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={showRead ? 'all' : 'unread'}
                  onChange={(e) => setShowRead(e.target.value === 'all')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterPriority('');
                    setShowRead(true);
                    setSelectedCategory('all');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications ({filteredNotifications.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <FaBell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No notifications found</p>
              </div>
            ) : (
              Object.entries(groupedNotifications).map(([category, categoryNotifications]) => (
                <div key={category}>
                  {/* Category Header */}
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getNotificationIcon('', category)}
                        <h3 className="ml-2 text-sm font-medium text-gray-900 dark:text-white capitalize">
                          {category} ({categoryNotifications.length})
                        </h3>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {categoryNotifications.filter(n => !n.is_read).length} unread
                      </span>
                    </div>
                  </div>

                  {/* Category Notifications */}
                  {categoryNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type, notification.category)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className={`text-sm font-medium ${
                                !notification.is_read 
                                  ? 'text-gray-900 dark:text-white' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </h3>
                              
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                                {notification.category}
                              </span>
                              
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                            </div>
                            
                            <p className={`text-sm ${
                              !notification.is_read 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <FaClock className="w-3 h-3 mr-1" />
                                {new Date(notification.created_at).toLocaleString()}
                              </span>
                              
                              {!notification.is_read && (
                                <span className="flex items-center text-blue-600 dark:text-blue-400">
                                  <FaEnvelope className="w-3 h-3 mr-1" />
                                  Unread
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              title="Mark as read"
                            >
                              <FaCheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete notification"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 