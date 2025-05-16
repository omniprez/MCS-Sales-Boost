const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get total revenue (sum of closed won deals)
    const revenueResult = await query(`
      SELECT SUM(amount) as total
      FROM deals
      WHERE stage = 'closed_won'
    `, null, true);

    const revenue = parseInt(revenueResult?.total || 0);
    
    // In a real application, costs would be pulled from a costs or expenses table
    // For this example, we'll estimate gross profit as 40% of revenue
    const grossProfit = Math.round(revenue * 0.4);
    const margin = revenue > 0 ? grossProfit / revenue : 0;

    return res.json({
      revenue,
      grossProfit,
      margin
    });
  } catch (error) {
    console.error('Error in gp-summary endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('gp-summary');
    return res.json(mockData);
  }
}; 