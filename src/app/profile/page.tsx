"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaSignOutAlt } from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Login state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Signup state
  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (user) {
        // Redirect based on user role
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role || 'user';
        
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
          router.push('/admin/dashboard');
        } else if (role === 'PARTNER') {
          router.push('/partner');
        } else if (role === 'DRIVER') {
          router.push('/driver');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      });

      if (error) {
        throw error;
      }

      if (user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            name: signupData.name,
            email: signupData.email,
            phone: signupData.phone,
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          throw profileError;
        }

        // Redirect to home page
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    // User is logged in - show profile
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-24">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUser className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <FaEnvelope className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <FaPhone className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">Not provided</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              <FaSignOutAlt />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is not logged in - show login/signup form
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-gray-600">
              {isLoginMode 
                ? 'Welcome back! Please sign in to your account.' 
                : 'Join ComparePCO to start booking cars.'
              }
            </p>
          </div>

          {/* Toggle between login and signup */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                isLoginMode 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                !isLoginMode 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {isLoginMode ? (
            // Login Form
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="login-email">Email</label>
                <input 
                  id="login-email"
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-6 relative">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="login-password">Password</label>
                <input 
                  id="login-password"
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Enter your password" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400 pr-10" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-9 text-gray-400 hover:text-blue-600" 
                  tabIndex={-1} 
                  onClick={() => setShowPassword(v => !v)}
                  disabled={isSubmitting}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {error && <div className="bg-red-100 text-red-700 rounded p-3 mb-4 text-center text-sm font-semibold border border-red-200">{error}</div>}
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            // Signup Form
            <form onSubmit={handleSignup}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="signup-name">Full Name</label>
                <input 
                  id="signup-name"
                  name="name"
                  type="text" 
                  placeholder="Enter your full name" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                  value={signupData.name} 
                  onChange={handleChange}
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="signup-email">Email</label>
                <input 
                  id="signup-email"
                  name="email"
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                  value={signupData.email} 
                  onChange={handleChange}
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="signup-phone">Phone Number</label>
                <input 
                  id="signup-phone"
                  name="phone"
                  type="tel" 
                  placeholder="Enter your phone number" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                  value={signupData.phone} 
                  onChange={handleChange}
                  required 
                  disabled={isSubmitting}
                />
              </div>

              <div className="mb-4 relative">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="signup-password">Password</label>
                <input 
                  id="signup-password"
                  name="password"
                  type={showSignupPassword ? 'text' : 'password'} 
                  placeholder="Create a password" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400 pr-10" 
                  value={signupData.password} 
                  onChange={handleChange}
                  required 
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-9 text-gray-400 hover:text-blue-600" 
                  tabIndex={-1} 
                  onClick={() => setShowSignupPassword(v => !v)}
                  disabled={isSubmitting}
                >
                  {showSignupPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="mb-6 relative">
                <label className="block text-gray-700 font-semibold mb-1" htmlFor="signup-confirm-password">Confirm Password</label>
                <input 
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Confirm your password" 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400 pr-10" 
                  value={signupData.confirmPassword} 
                  onChange={handleChange}
                  required 
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-9 text-gray-400 hover:text-blue-600" 
                  tabIndex={-1} 
                  onClick={() => setShowConfirmPassword(v => !v)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {error && <div className="bg-red-100 text-red-700 rounded p-3 mb-4 text-center text-sm font-semibold border border-red-200">{error}</div>}
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold text-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 