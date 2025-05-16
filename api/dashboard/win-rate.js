const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get closed deals count
    const closedDealsResult = await query(`
      SELECT COUNT(*) as count
      FROM deals
      WHERE stage IN ('closed_won', 'closed_lost')
    `, null, true);

    // Get won deals count
    const wonDealsResult = await query(`
      SELECT COUNT(*) as count
      FROM deals
      WHERE stage = 'closed_won'
    `, null, true);

    const closedDeals = parseInt(closedDealsResult?.count || 0);
    const wonDeals = parseInt(wonDealsResult?.count || 0);
    
    // Calculate win rate
    const rate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

    return res.json({
      rate,
      closedDeals,
      wonDeals
    });
  } catch (error) {
    console.error('Error in win-rate endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('win-rate');
    return res.json(mockData);
  }
}; 