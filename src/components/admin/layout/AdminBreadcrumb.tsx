'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function AdminBreadcrumb() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: { name: string; href: string; current: boolean }[] = [];

    // Always start with Dashboard
    breadcrumbs.push({
      name: 'Dashboard',
      href: '/admin/dashboard',
      current: pathname === '/admin/dashboard',
    });

    // Skip 'admin' in the path
    const adminIndex = paths.indexOf('admin');
    const relevantPaths = paths.slice(adminIndex + 1);

    let currentPath = '/admin';

    relevantPaths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === relevantPaths.length - 1;

      // Format path name
      const name = path
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        name,
        href: currentPath,
        current: isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on dashboard
  if (pathname === '/admin/dashboard') {
    return null;
  }

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link
            href="/admin/dashboard"
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <HomeIcon className="h-4 w-4 mr-1" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>

        {breadcrumbs.slice(1).map((breadcrumb) => (
          <li key={breadcrumb.href} className="flex items-center">
            <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            {breadcrumb.current ? (
              <span className="text-gray-900 dark:text-white font-medium">
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 