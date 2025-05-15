// This file provides mock API responses for the frontend when deployed without a backend

// Mock user data
const mockUser = {
  id: 1,
  username: 'demo',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'admin',
  avatar: null
};

// Mock deals data
const mockDeals = [
  {
    id: 1,
    title: 'Enterprise Network Upgrade',
    value: 150000,
    status: 'proposal',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: 'SMB Cloud Migration',
    value: 75000,
    status: 'negotiation',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Healthcare Provider Security Solution',
    value: 225000,
    status: 'closed_won',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Mock API functions
export const mockApi = {
  // Auth endpoints
  auth: {
    login: async () => ({ user: mockUser, success: true }),
    logout: async () => ({ success: true }),
    check: async () => ({ user: mockUser, isAuthenticated: true })
  },
  
  // Deals endpoints
  deals: {
    getAll: async () => mockDeals,
    getById: async (id: number) => mockDeals.find(deal => deal.id === id),
    create: async (deal: any) => ({ ...deal, id: Math.floor(Math.random() * 1000), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
    update: async (id: number, deal: any) => ({ ...mockDeals.find(d => d.id === id), ...deal, updatedAt: new Date().toISOString() }),
    delete: async (id: number) => ({ success: true })
  },
  
  // Dashboard endpoints
  dashboard: {
    getSummary: async () => ({
      totalDeals: mockDeals.length,
      totalValue: mockDeals.reduce((sum, deal) => sum + deal.value, 0),
      closedDeals: mockDeals.filter(deal => deal.status === 'closed_won').length,
      activeDeals: mockDeals.filter(deal => deal.status !== 'closed_won' && deal.status !== 'closed_lost').length
    }),
    getRecentDeals: async () => mockDeals.slice(0, 5)
  }
};

// Helper function to determine if we should use mock API
export const shouldUseMockApi = () => {
  // Use mock API in production when deployed to Vercel without backend
  // or when explicitly enabled with a query parameter
  return process.env.NODE_ENV === 'production' || 
         window.location.search.includes('useMockApi=true');
};

// Function to intercept API calls and return mock data if needed
export const apiInterceptor = async (url: string, options: RequestInit = {}) => {
  if (!shouldUseMockApi()) {
    // Use real API
    return fetch(url, options);
  }
  
  console.log('Using mock API for:', url);
  
  // Parse the endpoint from the URL
  const endpoint = url.replace(/^\/api\//, '');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock responses based on the endpoint
  if (endpoint === 'auth/login') {
    return new Response(JSON.stringify(await mockApi.auth.login()), { status: 200 });
  }
  
  if (endpoint === 'auth/logout') {
    return new Response(JSON.stringify(await mockApi.auth.logout()), { status: 200 });
  }
  
  if (endpoint === 'auth/check') {
    return new Response(JSON.stringify(await mockApi.auth.check()), { status: 200 });
  }
  
  if (endpoint === 'deals') {
    return new Response(JSON.stringify(await mockApi.deals.getAll()), { status: 200 });
  }
  
  if (endpoint.startsWith('deals/') && options.method === 'GET') {
    const id = parseInt(endpoint.split('/')[1]);
    return new Response(JSON.stringify(await mockApi.deals.getById(id)), { status: 200 });
  }
  
  if (endpoint === 'dashboard/summary') {
    return new Response(JSON.stringify(await mockApi.dashboard.getSummary()), { status: 200 });
  }
  
  if (endpoint === 'dashboard/recent-deals') {
    return new Response(JSON.stringify(await mockApi.dashboard.getRecentDeals()), { status: 200 });
  }
  
  // Default response for unhandled endpoints
  return new Response(JSON.stringify({ error: 'Not implemented in mock API' }), { status: 501 });
};
