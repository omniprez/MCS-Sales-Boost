const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get top sales performer
    const leaderResult = await query(`
      SELECT 
        u.id,
        u.name,
        COUNT(d.id) as deals_count,
        SUM(d.amount) as amount
      FROM 
        users u
      LEFT JOIN 
        deals d ON u.id = d.owner_id AND d.stage = 'closed_won'
      GROUP BY 
        u.id, u.name
      ORDER BY 
        amount DESC
      LIMIT 1
    `, null, true);

    return res.json(leaderResult || { id: null, name: 'No data', deals_count: 0, amount: 0 });
  } catch (error) {
    console.error('Error in sales-leader endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('sales-leader');
    return res.json(mockData);
  }
};