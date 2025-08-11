'use client';

import React, { useMemo } from 'react';
import {
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaCog,
  FaEdit,
  FaBell,
  FaUserTie,
  FaTachometerAlt,
  FaHandshake,
  FaCalendarCheck,
  FaFileAlt,
  FaChartBar,
  FaBullhorn,
  FaHeadset,
  FaShieldAlt,
  FaCogs,
  FaPlug,
  FaChevronRight
} from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ADMIN_STAFF' | 'PARTNER' | 'PARTNER_STAFF' | 'DRIVER' | 'USER';

const ROLE_LABELS = {
  'SUPER_ADMIN': 'Super Admin',
  'ADMIN': 'Admin',
  'ADMIN_STAFF': 'Admin Staff',
  'PARTNER': 'Partner',
  'PARTNER_STAFF': 'Partner Staff',
  'DRIVER': 'Driver',
  'USER': 'User'
};

interface Tile {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  roles: Role[];
  color: string;
  stats?: {
    value: string;
    change: string;
    changeType: 'increase' | 'decrease';
  };
}

export const adminTiles: Tile[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Overview of platform metrics and key performance indicators',
    icon: <FaTachometerAlt className="w-6 h-6" />,
    href: '/admin/dashboard',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'],
    color: 'bg-blue-500'
  },
  {
    id: 'partners',
    title: 'Partners',
    description: 'Manage partner accounts, approvals, and business relationships',
    icon: <FaHandshake className="w-6 h-6" />,
    href: '/admin/partners',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-green-500'
  },
  {
    id: 'drivers',
    title: 'Drivers',
    description: 'Manage driver accounts, verifications, and performance tracking',
    icon: <FaUserTie className="w-6 h-6" />,
    href: '/admin/drivers',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-purple-500'
  },
  {
    id: 'bookings',
    title: 'Bookings',
    description: 'Monitor and manage all booking transactions and reservations',
    icon: <FaCalendarCheck className="w-6 h-6" />,
    href: '/admin/bookings',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-orange-500'
  },
  {
    id: 'docs_manager',
    title: 'Documents',
    description: 'Manage document uploads, verifications, and compliance',
    icon: <FaFileAlt className="w-6 h-6" />,
    href: '/admin/documents',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-red-500'
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'Track sales performance, commissions, and revenue analytics',
    icon: <FaChartLine className="w-6 h-6" />,
    href: '/admin/sales',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-yellow-500'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Comprehensive analytics and reporting dashboard',
    icon: <FaChartBar className="w-6 h-6" />,
    href: '/admin/analytics',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-indigo-500'
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Manage marketing campaigns, promotions, and customer acquisition',
    icon: <FaBullhorn className="w-6 h-6" />,
    href: '/admin/marketing',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-pink-500'
  },
  {
    id: 'support',
    title: 'Support',
    description: 'Customer support tickets, chat management, and help desk',
    icon: <FaHeadset className="w-6 h-6" />,
    href: '/admin/support',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'],
    color: 'bg-teal-500'
  },
  {
    id: 'content',
    title: 'Content',
    description: 'Manage website content, blog posts, and media assets',
    icon: <FaEdit className="w-6 h-6" />,
    href: '/admin/content',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-gray-500'
  },
  {
    id: 'quality',
    title: 'Quality',
    description: 'Quality assurance, testing, and performance monitoring',
    icon: <FaCheckCircle className="w-6 h-6" />,
    href: '/admin/quality',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-emerald-500'
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Security monitoring, access control, and compliance management',
    icon: <FaShieldAlt className="w-6 h-6" />,
    href: '/admin/security',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-red-600'
  },
  {
    id: 'workflow',
    title: 'Workflow',
    description: 'Process automation, workflow management, and business rules',
    icon: <FaCogs className="w-6 h-6" />,
    href: '/admin/workflow',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-blue-600'
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Manage system notifications, alerts, and communication settings',
    icon: <FaBell className="w-6 h-6" />,
    href: '/admin/notifications',
    roles: ['SUPER_ADMIN', 'ADMIN', 'ADMIN_STAFF'],
    color: 'bg-yellow-600'
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Third-party integrations, APIs, and external service connections',
    icon: <FaPlug className="w-6 h-6" />,
    href: '/admin/integrations',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-purple-600'
  },
  {
    id: 'staff',
    title: 'Staff',
    description: 'Manage admin staff, roles, permissions, and team management',
    icon: <FaUsers className="w-6 h-6" />,
    href: '/admin/staff',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-green-600'
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'System configuration, preferences, and platform settings',
    icon: <FaCog className="w-6 h-6" />,
    href: '/admin/settings',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-gray-600'
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Generate custom reports, exports, and data analytics',
    icon: <FaFileAlt className="w-6 h-6" />,
    href: '/admin/reports',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    color: 'bg-indigo-600'
  }
];

export const tilesFor = (user: any) => {
  if (!user) return [];
  const userRoles: Role[] = (user.roles || []).map((r: string) => r.toUpperCase());
  const primaryRole = (user.role || '').toUpperCase();
  const isSuperAdmin = user.isSuperAdmin || primaryRole === 'SUPER_ADMIN' || primaryRole === 'SUPERADMIN' || userRoles.includes('SUPER_ADMIN');
  const isAdmin = user.isAdmin || primaryRole === 'ADMIN' || userRoles.includes('ADMIN');
  const isAdminStaff = primaryRole === 'ADMIN_STAFF' || userRoles.includes('ADMIN_STAFF');
  const sidebarAccess: Record<string, boolean> = user.sidebar_access || {};

  return adminTiles.filter((tile) => {
    // Check if user has access to this tile
    const hasAccess = tile.roles.some(role => {
      if (role === 'SUPER_ADMIN') return isSuperAdmin;
      if (role === 'ADMIN') return isAdmin || isSuperAdmin;
      if (role === 'ADMIN_STAFF') {
  
        // For staff, also ensure sidebar_access permits this tile
        if (!(isAdminStaff || isAdmin || isSuperAdmin)) return false;
        // Map tile id to sidebar key (same id for dashboard, support etc.)
        if (isAdminStaff) {
          const key = tile.id === 'notifications' ? 'notifications' : tile.id; // direct mapping
          if (sidebarAccess && sidebarAccess[key] === false) return false;
        }
        return true;
      }
      return userRoles.includes(role);
    });

    if (!hasAccess) return null;

    return true;
  });
};

export const getDisplayRoles = (user: any) => {
  if (!user) return '';
  const userRoles: Role[] = (user.roles || []).map((r: string) => r.toUpperCase());
  const primaryRole = (user.role || '').toUpperCase();
  if (user.isSuperAdmin || primaryRole === 'SUPER_ADMIN' || primaryRole === 'SUPERADMIN') return ROLE_LABELS['SUPER_ADMIN'];
  if (primaryRole === 'ADMIN' || userRoles.includes('ADMIN')) return ROLE_LABELS['ADMIN'];
  return userRoles.map((r) => ROLE_LABELS[r] || r).join(', ');
};

export default function DashboardTiles() {
  const { user } = useAuth();
  
  // Memoize the tiles to prevent unnecessary re-computations
  const userTiles = useMemo(() => {
    if (!user) return [];
    return tilesFor(user);
  }, [user]);

  // Memoized tile component for better performance
  const MemoizedTile = React.memo(({ tile }: { tile: Tile }) => (
    <Link
      href={tile.href}
      className={`block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300`}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${tile.color} text-white`}>
          {tile.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{tile.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{tile.description}</p>
          {tile.stats && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900">{tile.stats.value}</span>
              <span className={`text-sm ${
                tile.stats.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {tile.stats.change}
              </span>
            </div>
          )}
        </div>
        <FaChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Link>
  ));

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Welcome back, {user.email}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTiles.map((tile) => (
            <MemoizedTile key={tile.id} tile={tile} />
          ))}
        </div>
      </div>
    </div>
  );
} 
