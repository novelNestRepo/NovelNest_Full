'use client';

import { useAuth } from "@/lib/hooks/useAuth";
import LandingView from "@/components/landing/LandingView";
import DashboardView from "@/components/dashboard/DashboardView";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render the dashboard if logged in, otherwise show the landing page
  if (isAuthenticated) {
    return <DashboardView />;
  }

  return <LandingView />;
}
