import React from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Simple Auth Guard
 * This component only checks if the user is authenticated.
 * It allows any authenticated user to access the admin page.
 */
export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  useLocation(); // Keep the hook for navigation context
  const [redirected, setRedirected] = useState(false);
  const { user, isLoading } = useAuth();

  // Effect to redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user && !redirected) {
      console.log('AdminRouteGuard: User not authenticated, redirecting to login');
      setLocation('/login');
      setRedirected(true);
    }
  }, [user, isLoading, redirected, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render children if not authenticated or redirected
  if (!user || redirected) {
    return null;
  }

  // Render children if user is authenticated
  return <>{children}</>;
}