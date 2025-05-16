const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get total deals count
    const totalDealsResult = await query(`
      SELECT COUNT(*) as count
      FROM deals
    `, null, true);

    // Get closed deals count (won or lost)
    const closedDealsResult = await query(`
      SELECT COUNT(*) as count
      FROM deals
      WHERE stage IN ('closed_won', 'closed_lost')
    `, null, true);

    const totalDeals = parseInt(totalDealsResult?.count || 0);
    const closedDeals = parseInt(closedDealsResult?.count || 0);
    
    // Calculate conversion rate
    const rate = totalDeals > 0 ? Math.round((closedDeals / totalDeals) * 100) : 0;

    return res.json({
      rate,
      totalDeals,
      closedDeals
    });
  } catch (error) {
    console.error('Error in conversion-rate endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('conversion-rate');
    return res.json(mockData);
  }
};