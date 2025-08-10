"use client";
import MainNav from './MainNav';
import BottomNav from './BottomNav';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isAdminRoute = pathname?.startsWith('/admin');
  const isPartnerRoute = pathname?.startsWith('/partner');
  const isDriverRoute = pathname?.startsWith('/driver');
  
  // Only show MainNav and BottomNav for public routes (not admin, partner, or driver routes)
  const isPublicRoute = !isAdminRoute && !isPartnerRoute && !isDriverRoute;

  return (
    <>
      {isPublicRoute && <MainNav />}
      {children}
      {isPublicRoute && <BottomNav />}
    </>
  );
} 