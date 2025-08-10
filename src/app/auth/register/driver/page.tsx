"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaMapMarkerAlt, FaCheck, FaExternalLinkAlt } from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';

export default function DriverRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: { street: '', city: '', postcode: '', country: 'United Kingdom' }
  });

  // Consent state (used by JSX further down)
  const [consents, setConsents] = useState({
    termsAndConditions: false,
    privacyPolicy: false,
    marketingEmails: false,
    marketingSMS: false,
    marketingPromotions: false
  });

  const handleConsentChange = (consentType: keyof typeof consents) => {
    setConsents(prev => ({ ...prev, [consentType]: !prev[consentType] }));
  };

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name.startsWith('address.')) {
      const addressField = e.target.name.split('.')[1];
      setForm({
        ...form,
        address: { ...form.address, [addressField]: e.target.value }
      });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const validateForm = async () => {
    if (!form.name.trim()) { setError('Full name is required'); return false; }
    if (!form.email.trim()) { setError('Email address is required'); return false; }
    if (!form.password || form.password.length < 8) { setError('Password must be at least 8 characters long'); return false; }
    if (!form.confirmPassword) { setError('Please confirm your password'); return false; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return false; }
    if (!form.phone.trim()) { setError('Phone number is required'); return false; }

    const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
    if (!phoneRegex.test(form.phone.replace(/\s/g, ''))) { setError('Please enter a valid UK phone number'); return false; }

    const { data: phoneData } = await supabase
      .from('users')
      .select('id')
      .eq('phone', form.phone.replace(/\s/g, ''))
      .maybeSingle();
    if (phoneData) { setError('Phone number already registered'); return false; }

    const { data: emailData } = await supabase
      .from('users')
      .select('id')
      .eq('email', form.email)
      .maybeSingle();
    if (emailData) { setError('Email already registered'); return false; }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!(await validateForm())) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register/driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to create account');
      }

      // Sign the user in client-side after successful server creation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (signInError) {
        throw signInError;
      }

      // Refresh the session to ensure user metadata is loaded
      const { data: { session }, error: refreshError } = await supabase.auth.getSession();
      if (refreshError) {
        console.warn('Session refresh warning:', refreshError);
      }

      // Force a page reload to ensure the auth context is updated
      window.location.href = '/driver';
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-2 py-8">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-blue-100">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-700 text-center tracking-tight">Driver Signup</h1>
        
        {/* Personal Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FaMapMarkerAlt className="text-blue-600" />
            Personal Information
          </h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1" htmlFor="name">Full Name *</label>
            <input 
              id="name" 
              name="name" 
              placeholder="Your Full Name" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
              value={form.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1" htmlFor="email">Email Address *</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="your.email@example.com" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
              value={form.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="mb-4 relative">
            <label className="block text-gray-700 font-semibold mb-1" htmlFor="password">Password *</label>
            <input 
              id="password" 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Create a strong password (min. 8 characters)" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400 pr-10" 
              value={form.password} 
              onChange={handleChange} 
              required 
              minLength={8}
            />
            <button 
              type="button" 
              className="absolute right-3 top-9 text-gray-400 hover:text-blue-600" 
              tabIndex={-1} 
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1" htmlFor="confirmPassword">Confirm Password *</label>
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              type="password" 
              placeholder="Re-enter your password" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
              value={form.confirmPassword} 
              onChange={handleChange} 
              required 
              minLength={8}
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && form.password.length >= 8 && (
              <p className="text-green-500 text-xs mt-1 flex items-center">
                <FaCheck className="mr-1 h-3 w-3" />
                Passwords match
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1" htmlFor="phone">Phone *</label>
            <input 
              id="phone" 
              name="phone" 
              placeholder="+44 7700 900000" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
              value={form.phone} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Address Information</h2>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1" htmlFor="address.street">Street Address *</label>
            <input 
              id="address.street" 
              name="address.street" 
              placeholder="123 Main Street" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
              value={form.address.street} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-1" htmlFor="address.city">City *</label>
              <input 
                id="address.city" 
                name="address.city" 
                placeholder="London" 
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                value={form.address.city} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-1" htmlFor="address.postcode">Postcode *</label>
              <input 
                id="address.postcode" 
                name="address.postcode" 
                placeholder="SW1A 1AA" 
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                value={form.address.postcode} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1" htmlFor="address.country">Country</label>
            <select 
              id="address.country" 
              name="address.country" 
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-black" 
              value={form.address.country} 
              onChange={handleChange}
            >
              <option value="United Kingdom">United Kingdom</option>
              <option value="Ireland">Ireland</option>
            </select>
          </div>
        </div>

        {/* Terms & Conditions and Consents */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Terms & Conditions</h2>
          
          {/* Required Consents */}
          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  id="termsAndConditions"
                  checked={consents.termsAndConditions}
                  onChange={() => handleConsentChange('termsAndConditions')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
              </div>
              <label htmlFor="termsAndConditions" className="text-sm text-gray-700">
                <span className="font-semibold">I accept the </span>
                <Link 
                  href="/legal/terms-and-conditions" 
                  target="_blank" 
                  className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center"
                >
                  Terms and Conditions
                  <FaExternalLinkAlt className="ml-1 h-3 w-3" />
                </Link>
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  id="privacyPolicy"
                  checked={consents.privacyPolicy}
                  onChange={() => handleConsentChange('privacyPolicy')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  required
                />
              </div>
              <label htmlFor="privacyPolicy" className="text-sm text-gray-700">
                <span className="font-semibold">I accept the </span>
                <Link 
                  href="/legal/privacy-policy" 
                  target="_blank" 
                  className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center"
                >
                  Privacy Policy
                  <FaExternalLinkAlt className="ml-1 h-3 w-3" />
                </Link>
                <span className="text-red-500 ml-1">*</span>
              </label>
            </div>
          </div>

          {/* Marketing Preferences */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Marketing Preferences (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Stay updated with the latest offers, promotions, and platform updates. You can change these preferences anytime in your account settings.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="marketingEmails"
                    checked={consents.marketingEmails}
                    onChange={() => handleConsentChange('marketingEmails')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <label htmlFor="marketingEmails" className="text-sm text-gray-700">
                  <span className="font-medium">Email Marketing</span>
                  <br />
                  <span className="text-gray-600">Receive newsletters, special offers, and platform updates via email</span>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="marketingSMS"
                    checked={consents.marketingSMS}
                    onChange={() => handleConsentChange('marketingSMS')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <label htmlFor="marketingSMS" className="text-sm text-gray-700">
                  <span className="font-medium">SMS Marketing</span>
                  <br />
                  <span className="text-gray-600">Receive urgent offers and time-sensitive promotions via SMS</span>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    id="marketingPromotions"
                    checked={consents.marketingPromotions}
                    onChange={() => handleConsentChange('marketingPromotions')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <label htmlFor="marketingPromotions" className="text-sm text-gray-700">
                  <span className="font-medium">Exclusive Promotions</span>
                  <br />
                  <span className="text-gray-600">Get access to exclusive deals, early bird offers, and loyalty rewards</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 rounded p-3 mb-4 text-center text-sm font-semibold border border-red-200">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={isSubmitting || !consents.termsAndConditions || !consents.privacyPolicy}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold text-lg shadow transition mb-2"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating Account...
            </div>
          ) : (
            'Create Driver Account'
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-2">
          By creating an account, you confirm that you are at least 21 years old and agree to provide accurate information for verification purposes.
        </p>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
} 