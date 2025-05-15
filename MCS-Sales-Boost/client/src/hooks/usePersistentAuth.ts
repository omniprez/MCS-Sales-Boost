import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

const LOCAL_STORAGE_KEY = 'salesSpark_auth';

export function usePersistentAuth() {
  // Initialize state from localStorage
  const [persistedAuth, setPersistedAuth] = useState<{
    user: User | null;
    timestamp: number;
  }>(() => {
    try {
      const storedAuth = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedAuth ? JSON.parse(storedAuth) : { user: null, timestamp: 0 };
    } catch (error) {
      console.error('Error reading auth from localStorage:', error);
      return { user: null, timestamp: 0 };
    }
  });

  // Save to localStorage whenever auth changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistedAuth));
    } catch (error) {
      console.error('Error saving auth to localStorage:', error);
    }
  }, [persistedAuth]);

  // Function to set the authenticated user
  const setAuthUser = (user: User | null) => {
    setPersistedAuth({
      user,
      timestamp: Date.now()
    });
  };

  // Function to clear the authentication
  const clearAuth = () => {
    setPersistedAuth({
      user: null,
      timestamp: 0
    });
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Error removing auth from localStorage:', error);
    }
  };

  // Check if the stored auth is still valid (not expired)
  const isAuthValid = () => {
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    return (
      persistedAuth.user !== null &&
      Date.now() - persistedAuth.timestamp < MAX_AGE
    );
  };

  return {
    user: isAuthValid() ? persistedAuth.user : null,
    setAuthUser,
    clearAuth,
    isAuthValid
  };
}
