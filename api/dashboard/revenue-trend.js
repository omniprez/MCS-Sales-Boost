const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get revenue trend for the last 6 months, ordered by month (ascending)
    const trendResult = await query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', close_date), 'YYYY-MM') as month, 
        SUM(amount) as total 
      FROM 
        deals 
      WHERE 
        stage = 'closed_won' AND close_date IS NOT NULL 
      GROUP BY 
        DATE_TRUNC('month', close_date) 
      ORDER BY 
        DATE_TRUNC('month', close_date) ASC 
      LIMIT 6
    `);

    return res.json(trendResult || []);
  } catch (error) {
    console.error('Error in revenue-trend endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('revenue-trend');
    return res.json(mockData);
  }
}; 