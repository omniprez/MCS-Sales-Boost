import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { checkAuth } from '../lib/auth';
import { usePersistentAuth } from '../hooks/usePersistentAuth';

// Define the shape of the user object
interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  hasRole: (role: string) => boolean;
}

// Create the auth context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => null,
  hasRole: () => false
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: React.ReactNode;
}

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Use our persistent auth hook
  const { user: persistedUser, setAuthUser, clearAuth, isAuthValid } = usePersistentAuth();

  // Helper function to normalize role
  const normalizeRole = (role: string | undefined): string => {
    if (!role) return 'sales_rep';
    return role.toLowerCase();
  };

  // Use React Query for auth state management with better caching
  const { data: user, isLoading, refetch: refreshUser }: UseQueryResult<User | null> = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        console.log('Checking authentication status...');

        // If we have a valid persisted user, use it immediately
        if (isAuthValid() && persistedUser) {
          console.log('Using persisted user:', persistedUser);
          // Still make the API call to verify in the background
          checkAuth().then(apiUser => {
            if (apiUser) {
              // Update persisted user if API call succeeds
              setAuthUser(apiUser);
            }
          }).catch(err => {
            console.error('Background auth check failed:', err);
          });

          return persistedUser;
        }

        // Otherwise, check with the server
        const data = await checkAuth();
        if (!data) {
          console.log('No auth data returned, user is not authenticated');
          clearAuth(); // Clear any stale auth data
          queryClient.setQueryData(['auth'], null);
          return null;
        }

        console.log('User authenticated from API:', data);
        // Update persisted user
        setAuthUser(data);
        return data as User;
      } catch (err) {
        console.error('Auth query error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');

        // If API call fails but we have a valid persisted user, use it
        if (isAuthValid() && persistedUser) {
          console.log('API call failed, using persisted user');
          return persistedUser;
        }

        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
    retry: 1, // Retry once on failure
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when reconnecting
    refetchInterval: false,
    initialData: persistedUser // Use persisted user as initial data
  });

  // Helper function to check if user has a specific role
  const hasRole = (role: string): boolean => {
    if (!user) {
      console.log('AuthContext: hasRole check failed - no user');
      return false;
    }

    // Special case for admin roles
    if (role.toLowerCase() === 'admin') {
      const userRole = normalizeRole(user.role);
      const isAdmin = ['admin', 'administrator', 'superuser'].includes(userRole);
      console.log('AuthContext: Checking admin role - User role:', userRole, 'Is admin:', isAdmin);
      return isAdmin;
    }

    const hasSpecificRole = normalizeRole(user.role) === normalizeRole(role);
    console.log('AuthContext: Checking specific role:', role, 'User role:', user.role, 'Has role:', hasSpecificRole);
    return hasSpecificRole;
  };

  // Memoize the login function
  const login = useCallback(async (username: string, password: string) => {
    try {
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Set the user data in the cache and in our persistent storage
      queryClient.setQueryData(['auth'], data.user);
      setAuthUser(data.user);

      // Explicitly verify the session is established by making an auth check request
      try {
        console.log('Verifying session after login...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure session is saved
        const verifiedUser = await checkAuth();

        if (verifiedUser) {
          console.log('Session verified successfully');
        } else {
          console.warn('Session verification failed, but login appeared successful');
        }
      } catch (verifyErr) {
        console.warn('Error verifying session after login:', verifyErr);
        // Continue anyway since the login was successful
      }

      console.log('Login successful, user data stored');
      return data.user;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  }, [queryClient, setAuthUser]);

  // Memoize the logout function
  const logout = useCallback(async () => {
    try {
      // Clear the persisted auth first
      clearAuth();

      // Clear the auth cache
      queryClient.setQueryData(['auth'], null);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        console.warn('Server logout failed, but local logout succeeded:', data.error || 'Unknown error');
      }

      // Redirect to login page
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');

      // Even if server logout fails, we've cleared local auth
      // so redirect to login page anyway
      window.location.href = '/login';
    }
  }, [queryClient, clearAuth]);

  // Value object that will be passed to any consumer components
  const value: AuthContextType = {
    user: user || null,
    isLoading,
    error,
    login,
    logout,
    refreshUser: async () => {
      const result = await refreshUser();
      const userData = result.data;
      if (userData) {
        setAuthUser(userData);
        return userData;
      }
      return null;
    },
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
