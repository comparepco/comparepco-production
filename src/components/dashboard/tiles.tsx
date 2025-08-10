'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role, ROLE_LABELS } from '@/lib/auth/roles';
import {
  FaUsers,
  FaCar,
  FaCalendarCheck,
  FaFileAlt,
  FaChartLine,
  FaBullhorn,
  FaHeadset,
  FaEdit,
  FaShieldAlt,
  FaCogs,
  FaBell,
  FaPlug,
  FaUserCog,
  FaCog,
  FaChartBar,
  FaDollarSign,
  FaClipboardCheck,
  FaTachometerAlt,
  FaHandshake,
  FaUserTie,
  FaCheckCircle,
} from 'react-icons/fa';
import Link from 'next/link';

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

    const getRoleLabel = () => {
      if (user.isSuperAdmin || primaryRole === 'SUPER_ADMIN' || primaryRole === 'superadmin') return ROLE_LABELS['SUPER_ADMIN'];
      if (primaryRole === 'ADMIN' || userRoles.includes('ADMIN')) return ROLE_LABELS['ADMIN'];
      if (primaryRole === 'ADMIN_STAFF' || userRoles.includes('ADMIN_STAFF')) return ROLE_LABELS['ADMIN_STAFF'];
      return 'User';
    };

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
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to view your dashboard.</p>
      </div>
    );
  }

  const availableTiles = tilesFor(user);
  const userRoles: Role[] = (user as any).roles || [];

  if (availableTiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl text-gray-300 mb-4">🔒</div>
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Access Not Granted</h2>
          <p className="text-gray-500 mb-4">
            You don't have any assigned roles or permissions to access dashboard features.
          </p>
          <p className="text-sm text-gray-400">Contact your administrator to request access permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {availableTiles.map((tile) => (
        <Link
          key={tile.id}
          href={tile.href}
          className={`${tile.color} text-white rounded-lg p-6 transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-white">{tile.icon}</div>
            <div className="text-white/80 text-sm">{userRoles.includes(tile.id as Role) ? 'Access' : ''}</div>
          </div>
          <h3 className="text-lg font-semibold mb-2">{tile.title}</h3>
          <p className="text-white/80 text-sm">{tile.description}</p>
        </Link>
      ))}
    </div>
  );
} 