import React from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * SIMPLIFIED AUTH GUARD
 * This is a simplified version of the AuthGuard component that only checks if the user is authenticated.
 * It does not perform any role-based authorization checks.
 */
interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const [location, setLocation] = useLocation();
  const [redirected, setRedirected] = useState(false);
  const { user, isLoading } = useAuth();

  // Effect to handle authentication and role checks
  useEffect(() => {
    // Only redirect if not on login page and not already redirected
    if (location !== '/login' && !isLoading) {
      if (!user && !redirected) {
        console.log('AuthGuard: User not authenticated, redirecting to login');
        setLocation('/login');
        setRedirected(true);
      } else if (user && allowedRoles && allowedRoles.length > 0) {
        // Check if user has required role
        const userRole = user.role?.toLowerCase();
        const hasRequiredRole = allowedRoles.some(role => role.toLowerCase() === userRole);
        
        if (!hasRequiredRole && !redirected) {
          console.log(`AuthGuard: User role ${userRole} not in allowed roles ${allowedRoles.join(', ')}, redirecting to dashboard`);
          setLocation('/dashboard');
          setRedirected(true);
        }
      }
    }
  }, [user, isLoading, location, redirected, setLocation, allowedRoles]);

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

  // Render children if authenticated and has required role
  return <>{children}</>;
}
