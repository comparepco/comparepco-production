"use client";
import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { useTheme } from 'next-themes';
import { supabase } from "@/lib/supabase/client";
import { User, Session } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  accountType?: string;
  permissions?: Record<string, any>;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  unreadNotificationsCount: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  unreadNotificationsCount: 0,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const { setTheme } = useTheme();

  // Log user action to audit logs
  const logUserAction = async (actionType: string, details?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Don't await this to prevent blocking
        supabase.from('user_action_logs').insert({
          user_id: user.id,
          action_type: actionType,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        }).then(() => {
          // Success - no action needed
        }, (error: any) => {
          console.error('Failed to log user action:', error);
        });
      }
    } catch (error) {
      console.error('Failed to get user for logging:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
            role: (session.user.user_metadata?.role || '').toUpperCase(),
            accountType: session.user.user_metadata?.accountType,
          };
          
          // Check account status for partners
          if (appUser.role === 'PARTNER' || appUser.role === 'PARTNER_STAFF') {
            const { data: partnerData, error: partnerError } = await supabase
              .from('partners')
              .select('status, approval_status')
              .eq('id', appUser.id)
              .single();

            if (!partnerError && partnerData) {
              if (partnerData.status === 'suspended') {
                console.log('Partner account suspended, signing out user');
                await supabase.auth.signOut();
                return;
              }
            }

            // Check user account status
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('is_active')
              .eq('id', appUser.id)
              .single();

            if (!userError && userData && !userData.is_active) {
              console.log('User account deactivated, signing out user');
              await supabase.auth.signOut();
              return;
            }
          }
          
          setUser(appUser);
          
          // Do NOT log here; session may be restored on page refresh. Login is logged on SIGNED_IN event.
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            const appUser = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.user_metadata?.full_name,
              role: (session.user.user_metadata?.role || '').toUpperCase(),
              accountType: session.user.user_metadata?.accountType,
            };
            
            // Check account status for partners
            if (appUser.role === 'PARTNER' || appUser.role === 'PARTNER_STAFF') {
              const { data: partnerData, error: partnerError } = await supabase
                .from('partners')
                .select('status, approval_status')
                .eq('id', appUser.id)
                .single();

              if (!partnerError && partnerData) {
                if (partnerData.status === 'suspended') {
                  console.log('Partner account suspended, signing out user');
                  await supabase.auth.signOut();
                  return;
                }
              }

              // Check user account status
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_active')
                .eq('id', appUser.id)
                .single();

              if (!userError && userData && !userData.is_active) {
                console.log('User account deactivated, signing out user');
                await supabase.auth.signOut();
                return;
              }
            }
            
            setUser(appUser);
            
            // Log successful login only on explicit SIGNED_IN
            if (event === 'SIGNED_IN') {
              logUserAction('login', {
                email: session.user.email,
                role: session.user.user_metadata?.role,
                accountType: session.user.user_metadata?.accountType
              });
            }
          } else {
            setUser(null);
            
            // Log logout (non-blocking)
            if (event === 'SIGNED_OUT') {
              logUserAction('logout');
            }
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Log logout before signing out (non-blocking)
      logUserAction('logout');
      await supabase.auth.signOut();
      setUser(null);
      // Ensure UI resets to light mode on logout (particularly for admin)
      setTheme('light');
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', 'light');
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    unreadNotificationsCount,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
} 