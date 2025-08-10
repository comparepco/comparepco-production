'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaUserCircle, FaHeart, FaHome } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/compare', label: 'Compare' },
  { href: '/services', label: 'Services' },
  { href: '/about', label: 'About' },
];

const partnerNavLinks: { href: string; label: string }[] = [];

export default function MainNav() {
  const [open, setOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  
  // We no longer short-circuit render while `loading` is true. Instead, we
  // render the header immediately and simply hide any user-specific elements
  // until the auth state has finished loading. This prevents the header from
  // disappearing or flashing while Supabase finishes initialising.

  const isPartner = user && (user.role === 'PARTNER' || user.role === 'PARTNER_STAFF');
  const isDriver = user && (user.role === 'DRIVER' || user.role === 'driver');

  // Debug logging
  console.log('MainNav - User:', user);
  console.log('MainNav - User role:', user?.role);
  console.log('MainNav - Is driver:', isDriver);

  const getDashboardUrl = () => {
    const role = user?.role?.toUpperCase();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN' || (user?.accountType === 'staff' && user?.role)) {
      return '/admin/dashboard';
    } else if (role === 'PARTNER' || role === 'PARTNER_STAFF') {
      return '/partner';
    } else if (role === 'DRIVER') {
      return '/driver';
    } else {
      return '/dashboard';
    }
  };

  const dashboardUrl = getDashboardUrl();
  console.log('MainNav - Dashboard URL:', dashboardUrl);

  const handleSignOut = async () => {
    try {
      await signOut();
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    }
  };

  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href={isPartner ? "/partner/dashboard" : "/"} className="text-xl font-bold text-blue-700 dark:text-blue-400">COMPAREPCO</Link>
        <div className="hidden md:flex gap-10 items-center">
          {/* Home icon */}
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center">
            <FaHome className="text-2xl" />
          </Link>
          {/* Saved icon */}
          <Link href="/saved" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center">
            <FaHeart className="text-2xl" />
          </Link>
          {/* Profile icon with dropdown */}
          <div className="relative">
            <button
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center focus:outline-none"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Profile menu"
            >
              <FaUserCircle className="text-2xl" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {user ? (
                  <>
                    <Link
                      href={dashboardUrl}
                      className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                      onClick={() => setProfileOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setProfileOpen(false); }}
                      className="block px-4 py-3 text-left w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/login"
                    className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={() => setProfileOpen(false)}
                  >
                    Login / Signup
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="md:hidden flex gap-8 items-center relative">
          <Link href="/" className="text-gray-700 hover:text-blue-600 flex items-center justify-center">
            <FaHome className="text-2xl" />
          </Link>
          <Link href="/saved" className="text-gray-700 hover:text-blue-600 flex items-center justify-center">
            <FaHeart className="text-2xl" />
          </Link>
          {/* Profile icon with dropdown for mobile */}
          <button
            className="text-gray-700 hover:text-blue-600 flex items-center justify-center focus:outline-none"
            onClick={() => setProfileOpen((v) => !v)}
            aria-label="Profile menu"
          >
            <FaUserCircle className="text-2xl" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-10 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
              {user ? (
                <>
                  <Link
                    href={dashboardUrl}
                    className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    onClick={() => setProfileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setProfileOpen(false); }}
                    className="block px-4 py-3 text-left w-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                  onClick={() => setProfileOpen(false)}
                >
                  Login / Signup
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Mobile menu is now just the icons above; no dropdown needed */}
    </nav>
  );
} 