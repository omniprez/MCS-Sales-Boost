import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any
): Promise<any> {
  console.log(`Making ${method} request to ${endpoint}`, data);

  try {
    // Make sure the endpoint starts with /api
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    console.log(`Using API endpoint: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    // Try to parse the response as JSON
    let responseData;
    try {
      responseData = await response.json();
      console.log(`Response from ${apiEndpoint}:`, responseData);
    } catch (error) {
      const parseError = error as Error;
      console.error(`Error parsing JSON response from ${apiEndpoint}:`, parseError);
      throw new Error(`Failed to parse server response: ${parseError.message}`);
    }

    // Handle authentication errors
    if (response.status === 401) {
      console.error('Authentication error - redirecting to login page');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userId');
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }

    // Handle other errors
    if (!response.ok) {
      throw new Error(responseData.message || `Request failed with status ${response.status}`);
    }

    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
