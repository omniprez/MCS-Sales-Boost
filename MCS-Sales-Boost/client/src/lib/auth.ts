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

    // Add timestamp to prevent caching issues in Vercel
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
      console.log("Raw response text:", responseText.length > 100 ? 
                    responseText.substring(0, 100) + '...' : 
                    responseText);

      // Check if we received HTML instead of JSON (Vercel serverless issue)
      if (responseText.trim().startsWith('<!DOCTYPE html>') || 
          responseText.trim().startsWith('<html')) {
        console.error("Received HTML instead of JSON. API route not found.");
        
        // Try alternate approach - direct endpoint
        try {
          console.log("Trying direct login endpoint...");
          const directResponse = await fetch('/api/direct-login-test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
          });
          
          const directResult = await directResponse.json();
          console.log("Direct login result:", directResult);
          
          if (directResult.success) {
            // Use the direct login response
            localStorage.setItem('salesSpark_user', JSON.stringify(directResult.user));
            return {
              success: true,
              user: directResult.user
            };
          }
        } catch (directError) {
          console.error("Direct login failed:", directError);
        }
        
        return {
          success: false,
          message: "API routes not found. Please contact support."
        };
      }

      // If the response is empty, return an error
      if (!responseText || !responseText.trim()) {
        console.error("Empty response from server");
        return {
          success: false,
          message: "Server returned an empty response"
        };
      }
    } catch (textError) {
      console.error("Error reading response text:", textError);
      return {
        success: false,
        message: "Failed to read server response"
      };
    }

    // Parse the JSON response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Login response data:", data);
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      console.error("Response that failed to parse:", responseText);
      
      // Try a direct API call to our debug endpoint
      try {
        console.log("Trying direct DB test endpoint...");
        const dbTestResponse = await fetch(`${API_BASE_URL}/api/db-direct-test`, {
          method: 'GET'
        });
        const dbTestText = await dbTestResponse.text();
        console.log("DB Test response:", dbTestText);
      } catch (dbTestError) {
        console.error("DB Test error:", dbTestError);
      }
      
      return {
        success: false,
        message: `Failed to parse server response: ${jsonError instanceof Error ? jsonError.message : 'Invalid JSON'}`
      };
    }

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || data?.message || `Login failed with status: ${response.status}`
      };
    }

    if (data.success && data.user) {
      // Create the user object
      const user = {
        id: data.user.id,
        username: data.user.username,
        name: data.user.name,
        role: data.user.role || 'sales_rep'
      };

      // Cache the user in localStorage
      try {
        localStorage.setItem('salesSpark_user', JSON.stringify(user));
        console.log("User cached in localStorage after login");
      } catch (e) {
        console.error("Error caching user after login:", e);
      }

      return {
        success: true,
        user
      };
    }

    return {
      success: false,
      message: 'Invalid server response'
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error instanceof Error
        ? `Login error: ${error.message}`
        : 'An error occurred during login'
    };
  }
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
  try {
    console.log("Attempting logout");

    // Clear the cached user from localStorage first
    try {
      localStorage.removeItem('salesSpark_user');
      console.log("Cleared cached user from localStorage");
    } catch (e) {
      console.error("Error clearing cached user:", e);
    }

    const apiUrl = `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`;
    console.log("Using API URL:", apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log("Logout response status:", response.status);

    // Even if the server request fails, we've already cleared the local cache
    // so the user will be logged out on the client side

    let data;
    try {
      data = await response.json();
      console.log("Logout response data:", data);
    } catch (e) {
      console.error("Error parsing logout response:", e);
      // Return success anyway since we've cleared the local cache
      return { success: true };
    }

    if (!response.ok) {
      // Even though the server request failed, we've cleared the local cache
      // so we can still consider this a successful logout from the client perspective
      console.log("Server logout failed, but local logout succeeded");
      return {
        success: true,
        message: "Logged out locally, but server logout failed: " + (data?.error || 'Unknown error')
      };
    }

    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred during logout'
    };
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

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      console.log("Auth check response status:", response.status);

      // If not authenticated, return null immediately
      if (response.status === 401) {
        console.log("Auth check failed: Not authenticated");
        localStorage.removeItem('salesSpark_user');
        return null;
      }

      // For other error statuses, try to use cached user if available
      if (!response.ok) {
        console.log("Auth check failed:", response.status);

        // If we have a cached user, use it as a fallback
        if (parsedCachedUser) {
          console.log("Using cached user due to API error");
          return parsedCachedUser;
        }

        return null;
      }

      let data;
      try {
        const text = await response.text();
        console.log("Raw response text:", text);

        // If empty response, return cached user or null
        if (!text.trim()) {
          console.log("Empty response from server");
          return parsedCachedUser;
        }

        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse auth check response:", parseError);
        // Return cached user if available
        return parsedCachedUser;
      }

      // Validate the response data structure
      if (!data || typeof data !== 'object') {
        console.log("Invalid response data structure");
        return parsedCachedUser;
      }

      // Check if the user is authenticated and has user data
      if (data.isAuthenticated && data.user && typeof data.user === 'object') {
        const { id, username, name, role } = data.user;

        // Validate required user fields
        if (!id || !username || !name) {
          console.log("Missing required user fields");
          return parsedCachedUser;
        }

        console.log("User authenticated:", data.user);

        // Create the user object
        const user = {
          id,
          username,
          name,
          role: role || 'sales_rep'
        };

        // Cache the user in localStorage
        try {
          localStorage.setItem('salesSpark_user', JSON.stringify(user));
          console.log("User cached in localStorage");
        } catch (e) {
          console.error("Error caching user:", e);
        }

        return user;
      }

      console.log("User not authenticated or invalid user data");
      return parsedCachedUser;
    } catch (fetchError) {
      console.error("Fetch error during auth check:", fetchError);
      // Return cached user if available
      return parsedCachedUser;
    }
  } catch (error) {
    console.error('Auth check error:', error);

    // Try to get cached user as a last resort
    try {
      const cachedUser = localStorage.getItem('salesSpark_user');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        if (user && user.id && user.username && user.name) {
          console.log("Using cached user as last resort");
          return user;
        }
      }
    } catch (e) {
      console.error("Error parsing cached user as last resort:", e);
    }

    return null;
  }
}
