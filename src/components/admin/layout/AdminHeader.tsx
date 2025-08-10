'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ChevronDownIcon,
  XMarkIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import UnifiedNotificationBell from '@/components/UnifiedNotificationBell';
import { globalAdminSearch } from '@/lib/admin/services/globalSearch';
import { hasPermission } from '@/lib/auth/auth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface AdminHeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export default function AdminHeader({ onMenuClick, sidebarCollapsed }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const { notifications } = useAdmin();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isOnline, onlineCount } = useOnlineStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<{ type: string; results: any[] }[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Helper to determine module access (fallback to true if role/permissions system not ready)
  const canAccess = (module: string) => {
    if (!user?.role) return true;
    return hasPermission(user.role as any, module);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
        setSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await globalAdminSearch(searchQuery, user || {}, canAccess);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const results = await globalAdminSearch(searchQuery, user || {}, canAccess);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    setSearchFocused(false);
  };

  const handleResultClick = (item: any, groupType: string) => {
    let targetUrl = '';
    if (groupType === 'partners') targetUrl = '/admin/partners';
    else if (groupType === 'drivers') targetUrl = '/admin/drivers';
    else if (groupType === 'bookings') targetUrl = `/admin/bookings/${item.id}`;
    else if (groupType === 'vehicles') targetUrl = canAccess('fleet') ? `/admin/fleet/vehicles?vehicleId=${item.id}` : '/admin/partners';
    else if (groupType === 'support') targetUrl = '/admin/support';
    else if (groupType === 'pages' && item.href) targetUrl = item.href;
    if (targetUrl) {
      router.push(targetUrl);
      clearSearch();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/auth/login');
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden transition-colors">
            <Bars3Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Search */}
          <div className="relative" ref={searchRef}>
            <div className="hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search anything in admin area..."
                  className="block w-80 pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all duration-200"
                />
                {searchQuery && (
                  <button type="button" onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  </button>
                )}
              </form>
              {/* Results Dropdown */}
              {(searchFocused || searchQuery) && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
                  {/* Header */}
                  {searchQuery && (
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {searchLoading ? 'Searching...' : searchResults && searchResults.some((g) => g.results.length) ? `Found ${searchResults.reduce((t, g) => t + g.results.length, 0)} results for "${searchQuery}"` : `No results for "${searchQuery}"`}
                      </span>
                    </div>
                  )}

                  {/* Loading */}
                  {searchLoading && (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto" />
                      <div className="text-sm text-gray-500 mt-2">Searching across all modules...</div>
                    </div>
                  )}

                  {/* Results */}
                  {!searchLoading && searchResults && searchResults.some((g) => g.results.length) && (
                    <div className="overflow-y-auto max-h-80">
                      {searchResults.map((group) => (
                        group.results.length > 0 && (
                          <div key={group.type} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                            <div className="px-4 py-2 font-semibold text-blue-600 dark:text-blue-400 capitalize bg-gray-50 dark:bg-gray-750 text-sm">
                              {group.type === 'pages' ? 'Navigation' : group.type} ({group.results.length})
                            </div>
                            {group.results.map((item: any, idx: number) => (
                              <div
                                key={item.id || item.href || idx}
                                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-b-0 transition-colors"
                                onClick={() => handleResultClick(item, group.type)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {item.name || item.email || item.reference || item.id}
                                    </div>
                                    {item.subtitle && <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{item.subtitle}</div>}
                                  </div>
                                  <div className="ml-3 flex-shrink-0">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                      {group.type === 'pages' ? 'Page' : group.type.slice(0, -1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {!searchLoading && searchQuery && (!searchResults || !searchResults.some((g) => g.results.length)) && (
                    <div className="p-4 text-center text-gray-500">
                      <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <div className="text-sm">No results found</div>
                      <div className="text-xs text-gray-400 mt-1">Try searching for partners, drivers, bookings, or navigation pages</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile search button */}
            <button onClick={() => setShowSearch(!showSearch)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Mobile search dropdown */}
            {showSearch && (
              <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg md:hidden">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search anything..."
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  />
                  {searchQuery && (
                    <button type="button" onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <XMarkIcon className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">

          <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <HomeIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme((resolvedTheme || theme) === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {(resolvedTheme || theme) === 'dark' ? (
              <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Notification bell */}
          <UnifiedNotificationBell />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <UserCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.name || user?.email || 'Admin'}
              </span>
              <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
            
            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || user?.email || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role?.replace('_', ' ').toLowerCase() || 'Admin'}
                  </div>
                  {user?.email && user?.name && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {user.email}
                    </div>
                  )}
                </div>
                
                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push('/admin/profile');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <UserIcon className="h-4 w-4 mr-3" />
                    Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push('/admin/settings');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Cog6ToothIcon className="h-4 w-4 mr-3" />
                    Settings
                  </button>
                  
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 