"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaHeart, FaUser } from 'react-icons/fa';

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {/* Home */}
        <Link 
          href="/" 
          className={`flex flex-col items-center py-2 px-4 transition-colors ${
            isActive('/') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <FaHome className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Saved */}
        <Link 
          href="/saved" 
          className={`flex flex-col items-center py-2 px-4 transition-colors ${
            isActive('/saved') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <FaHeart className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Saved</span>
        </Link>

        {/* Profile */}
        <Link 
          href="/profile" 
          className={`flex flex-col items-center py-2 px-4 transition-colors ${
            isActive('/profile') 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          <FaUser className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
} 