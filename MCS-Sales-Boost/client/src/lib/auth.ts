import { API_BASE_URL, API_ENDPOINTS } from './config';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log("Making login request for user:", username);

    const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
    console.log("Using API URL:", apiUrl);

    // Add timestamp to prevent caching issues
    const timestampedUrl = `${apiUrl}?_t=${Date.now()}`;
    
    // Try with simplified request
    const response = await fetch(timestampedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });

    console.log("Login response status:", response.status);

    // Handle empty responses
    let responseText;
    try {
      responseText = await response.text();
    } catch (error) {
      console.error("Error reading response text:", error);
      return {
        success: false,
        message: 'Error reading server response'
      };
    }

    if (!responseText || responseText.trim() === '') {
      console.error("Empty response from server");
      return {
        success: false,
        message: 'Empty response from server'
      };
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Response data parsed successfully");
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError, "Response text:", responseText);
      return {
        success: false,
        message: `Invalid JSON response: ${responseText.substring(0, 100)}...`
      };
    }

    // Handle error responses
    if (!response.ok) {
      console.error("Login failed with status:", response.status, "Data:", data);
      return {
        success: false,
        message: data.error || `Server error: ${response.status}`
      };
    }

    // Cache the user in localStorage for faster access
    if (data.success && data.user) {
      localStorage.setItem('salesSpark_user', JSON.stringify(data.user));
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during login'
    };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    // Clear cached user
    localStorage.removeItem('salesSpark_user');
    
    // Call the logout endpoint
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error("Logout failed with status:", response.status);
      return { success: false };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}

export async function checkAuth(): Promise<User | null> {
  try {
    // First check if we have a cached user in localStorage
    const cachedUser = localStorage.getItem('salesSpark_user');
    let parsedCachedUser: User | null = null;

    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        console.log("Found cached user:", user);

        // Validate the cached user has required fields
        if (user && user.id && user.username && user.name) {
          parsedCachedUser = user;
          console.log("Using cached user while verifying with server");
        }
      } catch (e) {
        console.error("Error parsing cached user:", e);
        localStorage.removeItem('salesSpark_user');
      }
    }

    console.log("Making auth check request");

    const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.AUTH.CHECK}`;
    console.log("Using API URL:", apiUrl);

    // Add timestamp to prevent caching issues
    const timestampedUrl = `${apiUrl}?_t=${Date.now()}`;

    // Make auth check request
    const response = await fetch(timestampedUrl, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

    console.log("Auth check response status:", response.status);

    if (!response.ok) {
      console.log("Auth check failed, clearing cached user");
      localStorage.removeItem('salesSpark_user');
      return null;
    }

    // Parse response
    let data;
    try {
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.error("Empty response from auth check");
        return null;
      }
      data = JSON.parse(responseText);
    } catch (error) {
      console.error("Error parsing auth check response:", error);
      return null;
    }

    if (!data.isAuthenticated || !data.user) {
      console.log("User not authenticated according to server");
      localStorage.removeItem('salesSpark_user');
      return null;
    }

    console.log("User authenticated:", data.user);
    
    // Update cached user
    localStorage.setItem('salesSpark_user', JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error("Auth check error:", error);
    return null;
  }
}
