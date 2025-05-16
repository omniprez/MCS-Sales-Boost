// Import required modules
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection
const connectToDatabase = async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log("Database connected:", result.rows[0]);
    client.release();
    
    console.log('Dashboard API - Database connection successful');
    return pool;
  } catch (error) {
    console.error('Dashboard API - Database connection error:', error);
    return null;
  }
};

// Create serverless function handler for dashboard API
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Full path information from Vercel
  const fullPath = req.url;
  
  // Extract the dashboard endpoint from the path
  let endpoint = '';
  
  // Use regex to extract the endpoint
  const pathRegex = /\/api\/dashboard\/([^\/\?]+)/;
  const match = fullPath.match(pathRegex);
  
  if (match && match[1]) {
    endpoint = match[1];
  }
  
  // Log detailed information for debugging
  console.log(`Dashboard API request:`, {
    method: req.method,
    url: fullPath,
    endpoint,
    query: req.query
  });
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Connect to the database
  const pool = await connectToDatabase();
  if (!pool) {
    return res.status(500).json({ error: 'Database connection failed' });
  }
  
  // Handle different dashboard endpoints
  try {
    const client = await pool.connect();
    
    try {
      // Revenue summary endpoint
      if (endpoint === 'revenue-summary') {
        const result = await client.query(`
          SELECT 
            SUM(deal_value) as total_revenue,
            COUNT(*) as total_deals,
            AVG(deal_value) as average_deal_size
          FROM deals 
          WHERE status = 'won'
        `);
        
        return res.json({
          total_revenue: parseFloat(result.rows[0].total_revenue || 0),
          total_deals: parseInt(result.rows[0].total_deals || 0),
          average_deal_size: parseFloat(result.rows[0].average_deal_size || 0)
        });
      }
      
      // Pipeline summary endpoint
      if (endpoint === 'pipeline-summary') {
        const result = await client.query(`
          SELECT 
            status,
            COUNT(*) as deal_count,
            SUM(deal_value) as total_value
          FROM deals
          GROUP BY status
          ORDER BY 
            CASE 
              WHEN status = 'prospecting' THEN 1
              WHEN status = 'qualified' THEN 2
              WHEN status = 'proposal' THEN 3
              WHEN status = 'negotiation' THEN 4
              WHEN status = 'won' THEN 5
              WHEN status = 'lost' THEN 6
              ELSE 7
            END
        `);
        
        return res.json(result.rows);
      }
      
      // Recent deals endpoint
      if (endpoint === 'recent-deals') {
        const result = await client.query(`
          SELECT *
          FROM deals
          ORDER BY created_at DESC
          LIMIT 5
        `);
        
        return res.json(result.rows);
      }
      
      // Top products endpoint
      if (endpoint === 'top-products') {
        const result = await client.query(`
          SELECT 
            product,
            COUNT(*) as deal_count,
            SUM(deal_value) as total_value
          FROM deals
          WHERE status = 'won'
          GROUP BY product
          ORDER BY total_value DESC
          LIMIT 5
        `);
        
        return res.json(result.rows);
      }
      
      // Sales trend endpoint
      if (endpoint === 'sales-trend') {
        const { period = 'month' } = req.query;
        let timeFormat;
        
        if (period === 'day') {
          timeFormat = 'YYYY-MM-DD';
        } else if (period === 'week') {
          timeFormat = 'YYYY-WW';
        } else if (period === 'month') {
          timeFormat = 'YYYY-MM';
        } else if (period === 'quarter') {
          timeFormat = 'YYYY-Q';
        } else {
          timeFormat = 'YYYY';
        }
        
        const result = await client.query(`
          SELECT 
            TO_CHAR(created_at, '${timeFormat}') as time_period,
            COUNT(*) as deal_count,
            SUM(deal_value) as total_value
          FROM deals
          WHERE status = 'won'
          GROUP BY time_period
          ORDER BY time_period ASC
          LIMIT 12
        `);
        
        return res.json(result.rows);
      }
      
      // Win-loss ratio endpoint
      if (endpoint === 'win-loss-ratio') {
        const result = await client.query(`
          SELECT 
            status,
            COUNT(*) as count
          FROM deals
          WHERE status IN ('won', 'lost')
          GROUP BY status
        `);
        
        const won = result.rows.find(row => row.status === 'won')?.count || 0;
        const lost = result.rows.find(row => row.status === 'lost')?.count || 0;
        const total = won + lost;
        
        return res.json({
          won: parseInt(won),
          lost: parseInt(lost),
          total: parseInt(total),
          win_rate: total > 0 ? parseFloat(won) / total : 0,
          loss_rate: total > 0 ? parseFloat(lost) / total : 0
        });
      }
      
      // Deal stage distribution endpoint
      if (endpoint === 'deal-stage-distribution') {
        const result = await client.query(`
          SELECT 
            status,
            COUNT(*) as count
          FROM deals
          GROUP BY status
        `);
        
        return res.json(result.rows);
      }
      
      // Return 404 for unknown dashboard endpoints
      return res.status(404).json({ 
        error: 'Dashboard endpoint not found',
        endpoint: endpoint || 'root',
        method: req.method,
        availableEndpoints: [
          { path: '/api/dashboard/revenue-summary', method: 'GET', description: 'Get revenue summary metrics' },
          { path: '/api/dashboard/pipeline-summary', method: 'GET', description: 'Get pipeline summary by stage' },
          { path: '/api/dashboard/recent-deals', method: 'GET', description: 'Get recent deals' },
          { path: '/api/dashboard/top-products', method: 'GET', description: 'Get top-performing products' },
          { path: '/api/dashboard/sales-trend', method: 'GET', description: 'Get sales trend over time' },
          { path: '/api/dashboard/win-loss-ratio', method: 'GET', description: 'Get win-loss ratio metrics' },
          { path: '/api/dashboard/deal-stage-distribution', method: 'GET', description: 'Get deal distribution by stage' }
        ]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}; 