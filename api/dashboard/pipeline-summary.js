// API endpoint for dashboard/pipeline-summary
const { query } = require('../_utils/db');
const { applyMiddleware, errorResponse } = require('../_utils/middleware');
const { getMockData } = require('../_utils/mockData');

module.exports = async (req, res) => {
  // Apply middleware (CORS, preflight handling, method validation)
  if (!applyMiddleware(req, res, ['GET'])) {
    return;
  }

  try {
    // Get pipeline total (sum of deals not closed)
    const result = await query(
      'SELECT SUM(amount) as total FROM deals WHERE stage NOT IN ($1, $2)',
      ['closed_won', 'closed_lost'],
      true
    );

    return res.json({
      total: result?.total || 0
    });
  } catch (error) {
    console.error('Error in pipeline-summary endpoint:', error);
    
    // Fallback to mock data in case of error
    const mockData = getMockData('pipeline-summary');
    return res.json(mockData);
  }
}; 