const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get average deal size for won deals
    const result = await query(`
      SELECT 
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND(AVG(amount))
          ELSE 0
        END as average_deal_size
      FROM deals
      WHERE stage = 'closed_won'
    `, null, true);

    return res.json({
      averageDealSize: parseInt(result?.average_deal_size || 0)
    });
  } catch (error) {
    console.error('Error in avg-deal-size endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('avg-deal-size');
    return res.json(mockData);
  }
}; 