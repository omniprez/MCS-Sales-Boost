// API endpoint for dashboard/revenue-summary
const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get total revenue
    const totalResult = await query(
      'SELECT SUM(amount) as total FROM deals WHERE stage = $1',
      ['closed_won'],
      true
    );

    // Get monthly trend for the last 6 months
    const trendResult = await query(
      `SELECT TO_CHAR(DATE_TRUNC('month', close_date), 'YYYY-MM') as month, 
       SUM(amount) as total 
       FROM deals 
       WHERE stage = $1 AND close_date IS NOT NULL 
       GROUP BY DATE_TRUNC('month', close_date) 
       ORDER BY DATE_TRUNC('month', close_date) DESC 
       LIMIT 6`,
      ['closed_won']
    );

    const data = {
      total: totalResult?.total || 0,
      trend: trendResult || []
    };

    return res.json(data);
  } catch (error) {
    console.error('Error in revenue-summary endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('revenue-summary');
    return res.json(mockData);
  }
}; 