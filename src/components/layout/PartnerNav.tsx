'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaBars, FaHome, FaCar, FaCalendar, FaDollarSign, FaUser, FaCog, FaSignOutAlt, FaBell, FaHeadset, FaFileAlt, FaChartBar, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavLink {
  href: string;
  label: string;
  permission?: keyof Permissions;
  partnerOnly?: boolean; // visible only to owner partner (not staff)
}

type Permissions = {
  canViewFleet?: boolean;
  canManageFleet?: boolean;
  canViewStaff?: boolean;
  canManageStaff?: boolean;
  canViewBookings?: boolean;
  canManageBookings?: boolean;
  canViewClaims?: boolean;
  canManageClaims?: boolean;
  canViewFinancials?: boolean;
  canViewAnalytics?: boolean;
  canManageDocuments?: boolean;
  [key: string]: any;
};

const navLinks: NavLink[] = [
  { href: '/partner/dashboard', label: 'Dashboard' },
  { href: '/partner/fleet', label: 'Fleet Management', permission: 'canManageFleet' },
  { href: '/partner/staff', label: 'Staff Management', permission: 'canManageStaff' },
  { href: '/partner/bookings', label: 'Bookings', permission: 'canManageBookings' },
  { href: '/partner/claims', label: 'Claims', permission: 'canManageClaims' },
  { href: '/partner/analytics', label: 'Analytics', permission: 'canViewAnalytics' },
  { href: '/partner/documents', label: 'Documents', permission: 'canManageDocuments' },
  { href: '/partner/notifications', label: 'Notifications' },
  { href: '/partner/profile', label: 'My Profile' },
  { href: '/partner/settings', label: 'Settings' },
];

export default function PartnerNav() {
  const { user, unreadNotificationsCount, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
    }
  };

  const isPartnerOwner = user?.role === 'PARTNER';
  const permissions: Permissions = user?.permissions || {};

  const filteredLinks = navLinks.filter(link => {
    // Hide partnerOnly links from staff
    if (link.partnerOnly && !isPartnerOwner) return false;
    // Check permission-based links for staff
    if (link.permission) {
      if (isPartnerOwner) return true; // owner sees all
      return permissions[link.permission] === true;
    }
    return true;
  });

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 h-screen bg-blue-700 text-white fixed top-0 left-0 z-40 shadow-lg">
        <div className="text-2xl font-bold px-6 py-6">Partner</div>
        <nav className="flex-1 flex flex-col gap-2 px-4">
          {filteredLinks.map(link => (
            <Link key={link.href} href={link.href} className="px-4 py-2 rounded hover:bg-blue-600 transition font-medium flex items-center gap-2">
              {link.label}
              {link.label === 'Notifications' && unreadNotificationsCount > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </Link>
          ))}
          <button onClick={handleLogout} className="mt-4 px-4 py-2 rounded bg-red-500 hover:bg-red-600 transition font-semibold">Logout</button>
        </nav>
      </aside>
      {/* Mobile topbar */}
      <div className="md:hidden bg-blue-700 text-white flex items-center justify-between px-4 h-16 sticky top-0 z-40">
        <div className="text-xl font-bold">Partner</div>
        <button className="text-2xl" onClick={() => setOpen(!open)}><FaBars /></button>
      </div>
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={() => setOpen(false)}>
          <div className="absolute left-0 top-0 w-64 h-full bg-blue-700 text-white shadow-lg flex flex-col p-6 gap-3" onClick={e => e.stopPropagation()}>
            {filteredLinks.map(link => (
              <Link key={link.href} href={link.href} className="px-4 py-2 rounded hover:bg-blue-600 transition font-medium flex items-center gap-2" onClick={() => setOpen(false)}>
                {link.label}
                {link.label === 'Notifications' && unreadNotificationsCount > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </Link>
            ))}
            <button onClick={handleLogout} className="mt-4 px-4 py-2 rounded bg-red-500 hover:bg-red-600 transition font-semibold">Sign Out</button>
          </div>
        </div>
      )}
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center py-2">
          <Link href="/partner" className="flex flex-col items-center py-2 px-4 transition-colors text-gray-500 hover:text-blue-600">
            <FaHome className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/partner/fleet" className="flex flex-col items-center py-2 px-4 transition-colors text-gray-500 hover:text-blue-600">
            <FaCar className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Fleet</span>
          </Link>
          <Link href="/partner/bookings" className="flex flex-col items-center py-2 px-4 transition-colors text-gray-500 hover:text-blue-600">
            <FaCalendar className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Bookings</span>
          </Link>
          <Link href="/partner/analytics" className="flex flex-col items-center py-2 px-4 transition-colors text-gray-500 hover:text-blue-600">
            <FaChartBar className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Analytics</span>
          </Link>
        </div>
      </div>
    </>
  );
} 