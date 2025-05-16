// Base API URL
const API_BASE_URL = '/api';

// Helper function to build API URLs
const buildUrl = (endpoint: string) => `${API_BASE_URL}/${endpoint}`;

// Generic fetch function with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    return fetchApi<{ user: any; success: boolean }>('auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  },
  
  logout: async () => {
    return fetchApi<{ success: boolean }>('auth/logout', {
      method: 'POST',
    });
  },
  
  check: async () => {
    return fetchApi<{ user: any; isAuthenticated: boolean }>('auth/check');
  },
};

// Deals API
export const dealsApi = {
  getAll: async () => {
    return fetchApi<any[]>('deals');
  },
  
  getById: async (id: number) => {
    return fetchApi<any>(`deals/${id}`);
  },
  
  create: async (data: any) => {
    return fetchApi<any>('deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: number, data: any) => {
    return fetchApi<any>(`deals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  
  delete: async (id: number) => {
    return fetchApi<{ success: boolean }>(`deals/${id}`, {
      method: 'DELETE',
    });
  },
};

// Dashboard API
export const dashboardApi = {
  getSummary: async () => {
    return fetchApi<any>('dashboard/summary');
  },
  
  getRecentDeals: async () => {
    return fetchApi<any[]>('dashboard/recent-deals');
  },
};

export default {
  auth: authApi,
  deals: dealsApi,
  dashboard: dashboardApi,
};
