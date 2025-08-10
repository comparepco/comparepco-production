'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

interface Stats {
  totalPartners: number;
  totalDrivers: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  pendingApprovals: number;
  growthMetrics: {
    partnersGrowth: number;
    driversGrowth: number;
    bookingsGrowth: number;
    revenueGrowth: number;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  read: boolean;
}

interface AdminContextType {
  stats: Stats;
  refreshStats: () => Promise<void>;
  isLoading: boolean;
  notifications: Notification[];
  lastUpdated: Date | null;
  enableRealTimeUpdates: boolean;
  toggleRealTimeUpdates: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  user: any;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPartners: 0,
    totalDrivers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    growthMetrics: {
      partnersGrowth: 0,
      driversGrowth: 0,
      bookingsGrowth: 0,
      revenueGrowth: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [enableRealTimeUpdates, setEnableRealTimeUpdates] = useState(true);

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      // Fetch partners count with error handling
      let partnersCount = 0;
      try {
        const { count } = await supabase
          .from('partners')
          .select('id', { count: 'exact', head: true });
        partnersCount = count || 0;
      } catch (error) {
        console.warn('Could not fetch partners count:', error);
      }

      // Fetch drivers count with error handling
      let driversCount = 0;
      try {
        const { count } = await supabase
          .from('drivers')
          .select('id', { count: 'exact', head: true });
        driversCount = count || 0;
      } catch (error) {
        console.warn('Could not fetch drivers count:', error);
      }

      // Fetch users count with error handling
      let activeUsersCount = 0;
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .gte('updated_at', yesterday.toISOString());
        activeUsersCount = count || 0;
      } catch (error) {
        console.warn('Could not fetch users count:', error);
      }

      // Mock data for bookings and revenue (replace with actual tables)
      const mockBookings = 156;
      const mockRevenue = 45230;
      const mockPendingApprovals = 8;

      // Calculate growth metrics (mock data)
      const growthMetrics = {
        partnersGrowth: 12.5,
        driversGrowth: 8.3,
        bookingsGrowth: 15.7,
        revenueGrowth: 22.1,
      };

      setStats({
        totalPartners: partnersCount,
        totalDrivers: driversCount,
        totalBookings: mockBookings,
        totalRevenue: mockRevenue,
        activeUsers: activeUsersCount,
        pendingApprovals: mockPendingApprovals,
        growthMetrics,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats even if there's an error
      setStats({
        totalPartners: 0,
        totalDrivers: 0,
        totalBookings: 156,
        totalRevenue: 45230,
        activeUsers: 0,
        pendingApprovals: 8,
        growthMetrics: {
          partnersGrowth: 12.5,
          driversGrowth: 8.3,
          bookingsGrowth: 15.7,
          revenueGrowth: 22.1,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRealTimeUpdates = () => {
    setEnableRealTimeUpdates(!enableRealTimeUpdates);
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  useEffect(() => {
    if (user) {
      refreshStats();
    }
  }, [user]);

  const value: AdminContextType = {
    stats,
    refreshStats,
    isLoading,
    notifications,
    lastUpdated,
    enableRealTimeUpdates,
    toggleRealTimeUpdates,
    addNotification,
    user,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}; 