// Import required modules
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const url = require('url');

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

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Special route for all dashboard requests
app.use('/api/dashboard/:endpoint', async (req, res) => {
  const endpoint = req.params.endpoint;
  console.log(`Dashboard API endpoint requested: ${endpoint}`);
  
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    
    try {
      // Handle different dashboard endpoints
      switch (endpoint) {
        case 'revenue-summary':
          const revResult = await client.query(`
            SELECT SUM(amount) as total FROM deals WHERE stage = 'closed_won'
          `);
          return res.json({ total: revResult.rows[0]?.total || 0 });
          
        case 'pipeline-summary':
          const pipelineResult = await client.query(`
            SELECT SUM(amount) as total FROM deals WHERE stage NOT IN ('closed_won', 'closed_lost')
          `);
          return res.json({ total: pipelineResult.rows[0]?.total || 0 });
          
        case 'sales-leader':
          const leaderResult = await client.query(`
            SELECT u.id, u.name, COUNT(d.id) as deals_count, SUM(d.amount) as amount
            FROM users u
            LEFT JOIN deals d ON u.id = d.user_id AND d.stage = 'closed_won'
            GROUP BY u.id, u.name
            ORDER BY COALESCE(SUM(d.amount), 0) DESC
            LIMIT 1
          `);
          return res.json(leaderResult.rows.length > 0 ? leaderResult.rows[0] : {});
          
        case 'leaderboard':
          const boardResult = await client.query(`
            SELECT u.id, u.name, COUNT(d.id) as deals_count, SUM(d.amount) as amount
            FROM users u
            LEFT JOIN deals d ON u.id = d.user_id AND d.stage = 'closed_won'
            GROUP BY u.id, u.name
            ORDER BY COALESCE(SUM(d.amount), 0) DESC
            LIMIT 5
          `);
          return res.json(boardResult.rows);
          
        case 'win-rate':
          const winResult = await client.query(`
            SELECT 
              COUNT(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 END) as closed_deals,
              COUNT(CASE WHEN stage = 'closed_won' THEN 1 END) as won_deals
            FROM deals
          `);
          const winData = winResult.rows[0];
          const winRate = winData.closed_deals > 0 ? (winData.won_deals / winData.closed_deals) * 100 : 0;
          return res.json({
            rate: winRate,
            closedDeals: winData.closed_deals,
            wonDeals: winData.won_deals
          });
          
        case 'conversion-rate':
          const convResult = await client.query(`
            SELECT 
              COUNT(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 END) as closed_deals,
              COUNT(*) as total_deals
            FROM deals
          `);
          const convData = convResult.rows[0];
          const convRate = convData.total_deals > 0 ? (convData.closed_deals / convData.total_deals) * 100 : 0;
          return res.json({
            rate: convRate,
            totalDeals: convData.total_deals,
            closedDeals: convData.closed_deals
          });
          
        case 'gp-summary':
          const gpResult = await client.query(`
            SELECT SUM(amount) as total FROM deals WHERE stage = 'closed_won'
          `);
          const revenue = gpResult.rows[0]?.total || 0;
          const margin = 0.4;
          return res.json({
            revenue: revenue,
            grossProfit: revenue * margin,
            margin: margin
          });
          
        case 'quota-completion':
          const quotaResult = await client.query(`
            SELECT SUM(amount) as total
            FROM deals
            WHERE stage = 'closed_won' AND
            created_at >= DATE_TRUNC('month', CURRENT_DATE) AND
            created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
          `);
          const quota = 1000000;
          const current = quotaResult.rows[0]?.total || 0;
          return res.json({
            quota: quota,
            current: current,
            completion: (current / quota) * 100
          });
          
        case 'avg-deal-size':
          const avgResult = await client.query(`
            SELECT AVG(amount) as avg_amount FROM deals WHERE amount > 0
          `);
          return res.json({
            averageDealSize: avgResult.rows[0]?.avg_amount || 0
          });
          
        case 'pipeline-distribution':
          const distResult = await client.query(`
            SELECT stage, COUNT(*) as count, SUM(amount) as amount
            FROM deals
            WHERE stage NOT IN ('closed_won', 'closed_lost')
            GROUP BY stage
            ORDER BY amount DESC
          `);
          return res.json(distResult.rows);
          
        case 'revenue-trend':
          const trendResult = await client.query(`
            SELECT 
              TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
              SUM(amount) as total
            FROM deals
            WHERE stage = 'closed_won'
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at) ASC
            LIMIT 12
          `);
          return res.json(trendResult.rows);
          
        case 'pipeline':
          const stagesResult = await client.query(`
            SELECT 
              stage, 
              COUNT(*) as deal_count, 
              SUM(amount) as total_amount
            FROM deals
            WHERE stage NOT IN ('closed_won', 'closed_lost')
            GROUP BY stage
            ORDER BY CASE 
              WHEN stage = 'prospecting' THEN 1
              WHEN stage = 'qualification' THEN 2
              WHEN stage = 'proposal' THEN 3
              WHEN stage = 'negotiation' THEN 4
              ELSE 5
            END
          `);
          
          const totalPipelineResult = await client.query(`
            SELECT SUM(amount) as total
            FROM deals
            WHERE stage NOT IN ('closed_won', 'closed_lost')
          `);
          
          return res.json({
            stages: stagesResult.rows,
            total: totalPipelineResult.rows[0]?.total || 0
          });
          
        default:
          return res.status(404).json({ 
            error: 'Endpoint not found', 
            endpoint,
            availableEndpoints: [
              'revenue-summary',
              'pipeline-summary',
              'sales-leader',
              'leaderboard',
              'win-rate',
              'conversion-rate',
              'revenue-trend',
              'pipeline-distribution',
              'gp-summary',
              'quota-completion',
              'avg-deal-size',
              'pipeline'
            ]
          });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Special pipeline API endpoint 
app.get('/api/pipeline', async (req, res) => {
  console.log('API: Pipeline data requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          stage, 
          COUNT(*) as deal_count, 
          SUM(amount) as total_amount
        FROM deals
        WHERE stage NOT IN ('closed_won', 'closed_lost')
        GROUP BY stage
        ORDER BY CASE 
          WHEN stage = 'prospecting' THEN 1
          WHEN stage = 'qualification' THEN 2
          WHEN stage = 'proposal' THEN 3
          WHEN stage = 'negotiation' THEN 4
          ELSE 5
        END
      `);
      
      const totalResult = await client.query(`
        SELECT SUM(amount) as total
        FROM deals
        WHERE stage NOT IN ('closed_won', 'closed_lost')
      `);
      
      return res.json({
        stages: result.rows,
        total: totalResult.rows[0]?.total || 0
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (pipeline):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Dashboard index page with documentation
app.get('/api/dashboard', (req, res) => {
  res.json({
    name: 'MCS Sales Boost Dashboard API',
    description: 'API for sales performance dashboard metrics',
    version: '1.1.0',
    endpoints: [
      { path: '/api/dashboard/revenue-summary', description: 'Total revenue from closed-won deals' },
      { path: '/api/dashboard/pipeline-summary', description: 'Total value of the current pipeline' },
      { path: '/api/dashboard/sales-leader', description: 'Top performing sales rep' },
      { path: '/api/dashboard/leaderboard', description: 'Top 5 sales reps by performance' },
      { path: '/api/dashboard/win-rate', description: 'Percentage of closed deals that were won' },
      { path: '/api/dashboard/conversion-rate', description: 'Percentage of total deals that have closed' },
      { path: '/api/dashboard/gp-summary', description: 'Gross profit summary' },
      { path: '/api/dashboard/quota-completion', description: 'Progress toward monthly sales quota' },
      { path: '/api/dashboard/avg-deal-size', description: 'Average deal size' },
      { path: '/api/dashboard/pipeline-distribution', description: 'Distribution of deals by pipeline stage' },
      { path: '/api/dashboard/revenue-trend', description: 'Monthly revenue trend' },
      { path: '/api/pipeline', description: 'Complete pipeline data' }
    ]
  });
});

// Export for serverless function
module.exports = (req, res) => {
  // Debug: print incoming request details
  console.log('Dashboard API handler called:', { 
    url: req.url, 
    method: req.method
  });
  
  // Simplify URL handling - everything will be routed through the Express app
  // Parse the endpoint from URL for logging
  const parts = req.url.split('/');
  const endpointIndex = parts.indexOf('dashboard') + 1;
  const endpoint = endpointIndex < parts.length ? parts[endpointIndex] : null;
  
  if (endpoint) {
    console.log(`Processing dashboard endpoint: ${endpoint}`);
  }
  
  // Process the request with the Express app
  return app(req, res);
}; 