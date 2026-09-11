'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Sidebar from '@/components/custom/Sidebar';
import Header from '@/components/custom/Header';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Show nothing while loading auth state initially to prevent flashes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Define routes that are explicitly unauthenticated (login/register/check-email)
  const isAuthRoute = ['/login', '/register', '/check-email', '/confirm-email'].includes(pathname);

  // If authenticated and not on an auth route, show Sidebar & Header
  if (isAuthenticated && !isAuthRoute) {
    return (
      <>
        <Sidebar />
        <main className="ml-24 flex flex-col py-4 px-8 *:w-full h-screen overflow-x-hidden">
          <Header />
          {children}
        </main>
      </>
    );
  }

  // Unauthenticated layout (Full screen, no sidebar)
  return (
    <main className="w-full min-h-screen">
      {children}
    </main>
  );
}
