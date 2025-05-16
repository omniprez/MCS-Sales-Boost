// Mock data for dashboard endpoints

const mockData = {
  'revenue-summary': {
    total: 1250000,
    trend: [
      { month: '2023-06', total: 320000 },
      { month: '2023-05', total: 290000 },
      { month: '2023-04', total: 310000 },
      { month: '2023-03', total: 280000 },
      { month: '2023-02', total: 245000 },
      { month: '2023-01', total: 210000 }
    ]
  },
  
  'pipeline-summary': {
    total: 3500000
  },
  
  'sales-leader': {
    id: 1,
    name: 'Top Sales Rep',
    deals_count: 12,
    amount: 850000
  },
  
  'leaderboard': [
    { id: 1, name: 'Rep 1', deals_count: 12, amount: 850000 },
    { id: 2, name: 'Rep 2', deals_count: 10, amount: 750000 },
    { id: 3, name: 'Rep 3', deals_count: 8, amount: 610000 },
    { id: 4, name: 'Rep 4', deals_count: 6, amount: 540000 },
    { id: 5, name: 'Rep 5', deals_count: 5, amount: 420000 }
  ],
  
  'win-rate': {
    rate: 65,
    closedDeals: 20,
    wonDeals: 13
  },
  
  'conversion-rate': {
    rate: 42,
    totalDeals: 50,
    closedDeals: 21
  },
  
  'gp-summary': {
    revenue: 1250000,
    grossProfit: 500000,
    margin: 0.4
  },
  
  'quota-completion': {
    quota: 1000000,
    current: 750000,
    completion: 75
  },
  
  'avg-deal-size': {
    averageDealSize: 125000
  },
  
  'pipeline-distribution': [
    { stage: 'prospecting', count: 8, amount: 950000 },
    { stage: 'qualification', count: 12, amount: 1450000 },
    { stage: 'proposal', count: 6, amount: 780000 },
    { stage: 'negotiation', count: 4, amount: 520000 }
  ],
  
  'revenue-trend': [
    { month: '2023-01', total: 210000 },
    { month: '2023-02', total: 245000 },
    { month: '2023-03', total: 280000 },
    { month: '2023-04', total: 310000 },
    { month: '2023-05', total: 290000 },
    { month: '2023-06', total: 320000 }
  ],
  
  'pipeline': {
    stages: [
      { stage: 'prospecting', deal_count: 8, total_amount: 950000 },
      { stage: 'qualification', deal_count: 12, total_amount: 1450000 },
      { stage: 'proposal', deal_count: 6, total_amount: 780000 },
      { stage: 'negotiation', deal_count: 4, total_amount: 520000 }
    ],
    total: 3700000
  }
};

/**
 * Get mock data for a specific endpoint
 * @param {string} endpoint Endpoint name
 * @returns {Object} Mock data for the endpoint
 */
const getMockData = (endpoint) => {
  const key = endpoint.replace(/^\/api\/dashboard\//, '').replace(/^\/api\//, '');
  return mockData[key] || { mock: true, endpoint };
};

module.exports = {
  mockData,
  getMockData
}; 