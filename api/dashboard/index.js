const { applyMiddleware } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

// Import individual endpoint handlers
const leaderboardHandler = require('./leaderboard');
const pipelineDistributionHandler = require('./pipeline-distribution');
const pipelineHandler = require('./pipeline');
const pipelineSummaryHandler = require('./pipeline-summary');
const revenueSummaryHandler = require('./revenue-summary');
const revenueTrendHandler = require('./revenue-trend');
const salesLeaderHandler = require('./sales-leader');
const winRateHandler = require('./win-rate');
const avgDealSizeHandler = require('./avg-deal-size');
const conversionRateHandler = require('./conversion-rate');
const quotaCompletionHandler = require('./quota-completion');
const gpSummaryHandler = require('./gp-summary');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling)
  if (!applyMiddleware(req, res, ['GET', 'OPTIONS'])) {
    return;
  }

  // Extract the endpoint name from the URL
  const url = req.url;
  const parts = url.split('/');
  const endpoint = parts[parts.length - 1].split('?')[0];

  console.log(`Dashboard API request received for endpoint: ${endpoint}`);

  try {
    // Route to the appropriate handler based on the endpoint
    switch (endpoint) {
      case 'leaderboard':
        return await leaderboardHandler(req, res);
      case 'pipeline-distribution':
        return await pipelineDistributionHandler(req, res);
      case 'pipeline':
        return await pipelineHandler(req, res);
      case 'pipeline-summary':
        return await pipelineSummaryHandler(req, res);
      case 'revenue-summary':
        return await revenueSummaryHandler(req, res);
      case 'revenue-trend':
        return await revenueTrendHandler(req, res);
      case 'sales-leader':
        return await salesLeaderHandler(req, res);
      case 'win-rate':
        return await winRateHandler(req, res);
      case 'avg-deal-size':
        return await avgDealSizeHandler(req, res);
      case 'conversion-rate':
        return await conversionRateHandler(req, res);
      case 'quota-completion':
        return await quotaCompletionHandler(req, res);
      case 'gp-summary':
        return await gpSummaryHandler(req, res);
      default:
        console.error(`Unknown endpoint requested: ${endpoint}`);
        return res.status(404).json({ error: `Endpoint not found: ${endpoint}` });
    }
  } catch (error) {
    console.error(`Error handling dashboard request for ${endpoint}:`, error);
    
    // Fallback to mock data if we have it
    try {
      const mockData = getMockData(endpoint);
      if (mockData) {
        console.log(`Returning mock data for ${endpoint}`);
        return res.json(mockData);
      }
    } catch (mockError) {
      console.error('Error retrieving mock data:', mockError);
    }
    
    // If all else fails, return an error
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 