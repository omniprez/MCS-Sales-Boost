const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get sales leaderboard
    const leaderboardResult = await query(`
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
      LIMIT 5
    `);

    return res.json(leaderboardResult || []);
  } catch (error) {
    console.error('Error in leaderboard endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('leaderboard');
    return res.json(mockData);
  }
}; 