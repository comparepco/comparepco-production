import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface OnlineStatus {
  online_status: string;
  last_activity: string | null;
  session_id: string | null;
}

interface OnlineCount {
  total_online: number;
  admin_online: number;
  support_online: number;
}

export const useOnlineStatus = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [onlineCount, setOnlineCount] = useState<OnlineCount>({
    total_online: 0,
    admin_online: 0,
    support_online: 0
  });
  const [userStatus, setUserStatus] = useState<OnlineStatus>({
    online_status: 'offline',
    last_activity: null,
    session_id: null
  });
  const [loading, setLoading] = useState(true);
  // Refs to keep the latest values without re-rendering
  const lastActivityRef = useRef<number>(Date.now());
  const userStatusRef = useRef<OnlineStatus>(userStatus);

  // Keep ref in sync with state
  useEffect(() => {
    userStatusRef.current = userStatus;
  }, [userStatus]);



  const updateOnlineStatus = useCallback(async (status: 'online' | 'offline' | 'away' | 'busy' = 'online') => {
    if (!user || !user.id) {
      console.log('No user or user ID found, skipping online status update');
      return;
    }

    // Prevent rapid successive calls
    if (userStatusRef.current.online_status === status) {
      console.log('Status already set to:', status, 'skipping update');
      return;
    }

    try {
      console.log('Updating online status:', status, 'for user:', user.id);

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch('/api/admin/online-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          status,
          sessionId: userStatusRef.current.session_id,
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Online status updated successfully:', data);
        setIsOnline(status === 'online');
        setUserStatus(prev => ({
          ...prev,
          online_status: status,
          session_id: data.sessionId
        }));
      } else {
        console.error('Failed to update online status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  }, [user]);

  const markOffline = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      console.log('Marking user offline:', user.id);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const response = await fetch('/api/admin/online-status', {
        method: 'DELETE',
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
      });

      if (response.ok) {
        console.log('User marked offline successfully');
        setIsOnline(false);
        setUserStatus(prev => ({
          ...prev,
          online_status: 'offline'
        }));
      } else {
        console.error('Failed to mark user offline:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error marking offline:', error);
    }
  }, [user]);

  const fetchOnlineStatus = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      console.log('Fetching online status for user:', user.id);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const response = await fetch('/api/admin/online-status', {
        headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : undefined
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Online status fetched successfully:', data);
        setOnlineCount(data.onlineCount);
        setUserStatus(data.userStatus);
        setIsOnline(data.userStatus.online_status === 'online');
      } else {
        console.error('Failed to fetch online status:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching online status:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Set up activity tracking
  useEffect(() => {
    if (!user || !user.id) {
      console.log('No user or user ID found, skipping activity tracking setup');
      return;
    }

    console.log('Setting up activity tracking for user:', user.id);

    const handleActivity = () => {
      const now = Date.now();
      // Throttle updates – send at most once every 30 s in response to user actions
      if (now - lastActivityRef.current > 30000) {
        lastActivityRef.current = now;
        updateOnlineStatus('online');
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial online status
    updateOnlineStatus('online');

    // Fetch initial status
    fetchOnlineStatus();

    // Set up periodic status updates
    const interval = setInterval(() => {
      updateOnlineStatus('online');
    }, 30000);

    // Cleanup
    return () => {
      console.log('Cleaning up activity tracking for user:', user.id);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(interval);
      // Do not mark offline here; cleanup might run in React strict mode duplicate mount.
    };
  }, [user]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus('away');
      } else {
        updateOnlineStatus('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateOnlineStatus]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [markOffline]);

  return {
    isOnline,
    onlineCount,
    userStatus,
    loading,
    updateOnlineStatus,
    markOffline,
    fetchOnlineStatus
  };
}; 