const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get current revenue (sum of closed won deals)
    const currentResult = await query(`
      SELECT SUM(amount) as total
      FROM deals
      WHERE stage = 'closed_won'
    `, null, true);

    // In a real application, quota would be pulled from a configuration or quota table
    // For this example, we'll use a fixed quota
    const quota = 1000000;
    const current = parseInt(currentResult?.total || 0);
    
    // Calculate completion percentage
    const completion = quota > 0 ? Math.round((current / quota) * 100) : 0;

    return res.json({
      quota,
      current,
      completion
    });
  } catch (error) {
    console.error('Error in quota-completion endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('quota-completion');
    return res.json(mockData);
  }
}; 