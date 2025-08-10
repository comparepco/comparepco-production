"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaLock, FaEnvelope } from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const router = useRouter();

  // Clean up any existing session data on page load
  useEffect(() => {
    console.log('🧹 Cleaning up session data on login page load...');
    
    // Clear any existing cookies
    document.cookie = '__session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear localStorage
    localStorage.removeItem('authUser');
    localStorage.removeItem('userData');
    localStorage.removeItem('adminUser');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('✅ Session cleanup completed');
  }, []);

  // Check for lockout status
  useEffect(() => {
    const storedLockout = localStorage.getItem('loginLockout');
    if (storedLockout) {
      const lockoutData = JSON.parse(storedLockout);
      const lockoutTime = new Date(lockoutData.time);
      const now = new Date();
      const timeDiff = now.getTime() - lockoutTime.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff < 15) { // 15 minute lockout
        setIsLocked(true);
        setLockoutTime(lockoutTime);
        setLoginAttempts(lockoutData.attempts);
      } else {
        // Clear lockout after 15 minutes
        localStorage.removeItem('loginLockout');
        setIsLocked(false);
        setLoginAttempts(0);
      }
    }
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account is locked
    if (isLocked) {
      setError('Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.');
      return;
    }

    // Validate inputs
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setIsLoggingIn(true);
    
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Clear any existing session data before login
      document.cookie = '__session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Sign in with Supabase
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Reset login attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('loginLockout');

      // 🚀 Immediate redirect for SUPER_ADMIN or ADMIN_STAFF via metadata
      const metaRole = (user?.user_metadata?.role || '').toUpperCase();
      if (metaRole === 'SUPER_ADMIN' || metaRole === 'ADMIN' || metaRole === 'ADMIN_STAFF') {
        router.replace('/admin/dashboard');
        return;
      }

      console.log('✅ Supabase auth successful for:', user?.id);
      
      if (!user) {
        throw new Error('No user returned from authentication');
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('role, account_type, partner_id')
        .eq('id', user.id)
        .single();

      let userRole = 'USER';
      let staffPartnerId: string | null = null;

      if (profile) {
        const p: any = profile;
        userRole = (p.role || 'DRIVER').toUpperCase();
        staffPartnerId = p.partner_id || null;
        if (p.account_type === 'staff') {
          router.replace('/admin/dashboard');
          return;
        }
        console.log('✅ Profile role:', userRole);
      } else {
        // fallback partner_staff
        const { data: staffData } = await supabase
          .from('partner_staff')
          .select('partner_id')
          .eq('user_id', user.id)
          .single();
        if (staffData) {
          userRole = 'PARTNER_STAFF';
          staffPartnerId = staffData.partner_id;
        }
        // partner check
        if (!userRole || userRole === 'DRIVER') {
          const { data: partnerData } = await supabase
            .from('partners')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          if (partnerData) userRole = 'PARTNER';
        }
        // driver check (default)
        if (!userRole || userRole === 'DRIVER') {
          const { data: driverData } = await supabase
            .from('drivers')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (driverData) userRole = 'DRIVER';
        }
      }
      
      // Final routing
      switch (userRole) {
        case 'SUPER_ADMIN':
        case 'ADMIN':
        case 'ADMIN_STAFF':
        case 'STAFF':
          router.replace('/admin/dashboard');
          break;
        case 'PARTNER':
          router.replace('/partner');
          break;
        case 'PARTNER_STAFF':
          router.replace('/partner-staff');
          break;
        case 'DRIVER':
          router.replace('/driver');
          break;
        default:
          // Fallback to driver area to avoid blocking users
          console.warn('Unknown role, defaulting to DRIVER');
          router.replace('/driver');
          break;
      }
      
    } catch (err: any) {
      console.error('💥 Login error:', err);
      
      // Handle failed login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        // Lock account for 15 minutes
        const lockoutTime = new Date();
        localStorage.setItem('loginLockout', JSON.stringify({
          time: lockoutTime.toISOString(),
          attempts: newAttempts
        }));
        setIsLocked(true);
        setLockoutTime(lockoutTime);
        setError('Too many failed login attempts. Account locked for 15 minutes.');
      } else {
        // Show appropriate error message
        if (err.message?.includes('Invalid login credentials')) {
          setError(`Invalid email or password. ${5 - newAttempts} attempts remaining.`);
        } else if (err.message?.includes('Email not confirmed')) {
          setError('Please verify your email address before logging in.');
        } else if (err.message?.includes('Too many requests')) {
          setError('Too many failed login attempts. Please try again later.');
        } else {
          setError(err.message || 'Login failed. Please try again.');
        }
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getLockoutTimeRemaining = (): string => {
    if (!lockoutTime) return '';
    
    const now = new Date();
    const timeDiff = lockoutTime.getTime() + (15 * 60 * 1000) - now.getTime();
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 py-8 relative">
      {isLoggingIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-blue-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                id="email" 
                type="email" 
                placeholder="Enter your email" 
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={isLoggingIn || isLocked}
                autoComplete="email"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                id="password" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter your password" 
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                disabled={isLoggingIn || isLocked}
                autoComplete="current-password"
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition" 
                tabIndex={-1} 
                onClick={() => setShowPassword(v => !v)}
                disabled={isLoggingIn || isLocked}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoggingIn || isLocked}
              />
              <label htmlFor="rememberMe" className="ml-2 text-gray-700 text-sm select-none">
                Remember me
              </label>
            </div>
            <Link 
              href="/auth/forgot-password" 
              className="text-blue-600 font-semibold text-sm hover:underline transition"
            >
              Forgot password?
            </Link>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          
          {isLocked && lockoutTime && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm font-medium">
              Account locked. Time remaining: {getLockoutTimeRemaining()}
            </div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-xl font-bold text-lg shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={isLoggingIn || isLocked}
          >
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600 mb-4">Don't have an account?</p>
          <div className="flex justify-center gap-6 text-center">
            <Link 
              href="/auth/register/driver" 
              className="text-blue-600 font-semibold hover:underline transition"
            >
              Driver Signup
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/auth/register/partner" 
              className="text-blue-600 font-semibold hover:underline transition"
            >
              Partner Signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 