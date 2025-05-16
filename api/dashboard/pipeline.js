const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get stage distribution
    const stagesResult = await query(`
      SELECT 
        stage, 
        COUNT(*) as deal_count, 
        SUM(amount) as total_amount
      FROM 
        deals
      WHERE 
        stage NOT IN ('closed_won', 'closed_lost')
      GROUP BY 
        stage
      ORDER BY 
        CASE 
          WHEN stage = 'prospecting' THEN 1
          WHEN stage = 'qualification' THEN 2
          WHEN stage = 'proposal' THEN 3
          WHEN stage = 'negotiation' THEN 4
          ELSE 5
        END
    `);

    // Get pipeline total
    const totalResult = await query(`
      SELECT SUM(amount) as total
      FROM deals
      WHERE stage NOT IN ('closed_won', 'closed_lost')
    `, null, true);

    return res.json({
      stages: stagesResult || [],
      total: totalResult?.total || 0
    });
  } catch (error) {
    console.error('Error in pipeline endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('pipeline');
    return res.json(mockData);
  }
};