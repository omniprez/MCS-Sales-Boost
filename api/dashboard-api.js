const { applyMiddleware } = require('./_utils/middleware');
const { getMockData } = require('./_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling)
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) {
    return;
  }

  // Extract the endpoint name from the URL
  const url = req.url;
  const parts = url.split('/');
  let endpoint = '';
  
  // Look for dashboard-related endpoint names
  for (const part of parts) {
    if (part.includes('leaderboard') || 
        part.includes('pipeline') || 
        part.includes('revenue') || 
        part.includes('sales-leader') || 
        part.includes('win-rate') || 
        part.includes('avg-deal') || 
        part.includes('conversion') || 
        part.includes('quota') || 
        part.includes('gp-summary')) {
      endpoint = part;
      break;
    }
  }

  console.log(`Direct dashboard API request received: ${url}, extracted endpoint: ${endpoint}`);

  try {
    // Return mock data for the endpoint
    if (endpoint) {
      const mockData = getMockData(endpoint);
      console.log(`Returning mock data for ${endpoint}`);
      return res.json(mockData);
    } else {
      // If no recognized endpoint, return a list of available endpoints
      return res.json({
        availableEndpoints: [
          'leaderboard',
          'pipeline-distribution',
          'pipeline',
          'pipeline-summary',
          'revenue-summary',
          'revenue-trend',
          'sales-leader',
          'win-rate',
          'avg-deal-size',
          'conversion-rate',
          'quota-completion',
          'gp-summary'
        ]
      });
    }
  } catch (error) {
    console.error(`Error handling direct dashboard API request:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 