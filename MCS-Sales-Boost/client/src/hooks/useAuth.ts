import { useState, useEffect } from 'react';
import { queryClient } from '../lib/queryClient';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email: string;
  teamId?: number;
  avatar?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/me', {
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated
            setUser(null);
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUser(userData);
        
        // Store user data in query client cache
        queryClient.setQueryData(['currentUser'], userData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, isLoading, error };
}

export function useCurrentUser() {
  return queryClient.getQueryData<User>(['currentUser']);
}
