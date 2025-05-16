// Import required modules
const express = require('express');
const cors = require('cors');
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
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connection successful');
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

// Dashboard metrics routes
app.get('/api/dashboard/revenue-summary', async (req, res) => {
  console.log('API: Revenue summary requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT SUM(amount) as total FROM deals WHERE stage = 'closed_won'
      `);
      return res.json({ total: result.rows[0]?.total || 0 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (revenue-summary):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/pipeline-summary', async (req, res) => {
  console.log('API: Pipeline summary requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT SUM(amount) as total FROM deals WHERE stage NOT IN ('closed_won', 'closed_lost')
      `);
      return res.json({ total: result.rows[0]?.total || 0 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (pipeline-summary):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/sales-leader', async (req, res) => {
  console.log('API: Sales leader requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT u.id, u.name, COUNT(d.id) as deals_count, SUM(d.amount) as amount
        FROM users u
        LEFT JOIN deals d ON u.id = d.user_id AND d.stage = 'closed_won'
        GROUP BY u.id, u.name
        ORDER BY COALESCE(SUM(d.amount), 0) DESC
        LIMIT 1
      `);
      return res.json(result.rows.length > 0 ? result.rows[0] : {});
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (sales-leader):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/leaderboard', async (req, res) => {
  console.log('API: Leaderboard requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT u.id, u.name, COUNT(d.id) as deals_count, SUM(d.amount) as amount
        FROM users u
        LEFT JOIN deals d ON u.id = d.user_id AND d.stage = 'closed_won'
        GROUP BY u.id, u.name
        ORDER BY COALESCE(SUM(d.amount), 0) DESC
        LIMIT 5
      `);
      return res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (leaderboard):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/win-rate', async (req, res) => {
  console.log('API: Win rate requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 END) as closed_deals,
          COUNT(CASE WHEN stage = 'closed_won' THEN 1 END) as won_deals
        FROM deals
      `);
      const data = result.rows[0];
      const winRate = data.closed_deals > 0 ? (data.won_deals / data.closed_deals) * 100 : 0;
      return res.json({
        rate: winRate,
        closedDeals: data.closed_deals,
        wonDeals: data.won_deals
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (win-rate):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/conversion-rate', async (req, res) => {
  console.log('API: Conversion rate requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 END) as closed_deals,
          COUNT(*) as total_deals
        FROM deals
      `);
      const data = result.rows[0];
      const conversionRate = data.total_deals > 0 ? (data.closed_deals / data.total_deals) * 100 : 0;
      return res.json({
        rate: conversionRate,
        totalDeals: data.total_deals,
        closedDeals: data.closed_deals
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (conversion-rate):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/revenue-trend', async (req, res) => {
  console.log('API: Revenue trend requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
          SUM(amount) as total
        FROM deals
        WHERE stage = 'closed_won'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
        LIMIT 12
      `);
      return res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (revenue-trend):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/pipeline-distribution', async (req, res) => {
  console.log('API: Pipeline distribution requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT stage, COUNT(*) as count, SUM(amount) as amount
        FROM deals
        WHERE stage NOT IN ('closed_won', 'closed_lost')
        GROUP BY stage
        ORDER BY amount DESC
      `);
      return res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (pipeline-distribution):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/gp-summary', async (req, res) => {
  console.log('API: GP summary requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT SUM(amount) as total FROM deals WHERE stage = 'closed_won'
      `);
      const revenue = result.rows[0]?.total || 0;
      const margin = 0.4;
      return res.json({
        revenue: revenue,
        grossProfit: revenue * margin,
        margin: margin
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (gp-summary):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/quota-completion', async (req, res) => {
  console.log('API: Quota completion requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT SUM(amount) as total
        FROM deals
        WHERE stage = 'closed_won' AND
        created_at >= DATE_TRUNC('month', CURRENT_DATE) AND
        created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      `);
      const quota = 1000000;
      const current = result.rows[0]?.total || 0;
      return res.json({
        quota: quota,
        current: current,
        completion: (current / quota) * 100
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (quota-completion):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/avg-deal-size', async (req, res) => {
  console.log('API: Average deal size requested');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT AVG(amount) as avg_amount FROM deals WHERE amount > 0
      `);
      return res.json({
        averageDealSize: result.rows[0]?.avg_amount || 0
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (avg-deal-size):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/dashboard/pipeline', async (req, res) => {
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

// Fallback handler for other dashboard endpoints
app.get('/api/dashboard/*', async (req, res) => {
  console.log(`Dashboard API fallback called: ${req.path}`);
  
  try {
    // Return a meaningful error
    return res.status(404).json({ 
      error: 'Endpoint not found',
      path: req.path,
      availableEndpoints: [
        '/api/dashboard/revenue-summary',
        '/api/dashboard/pipeline-summary',
        '/api/dashboard/sales-leader',
        '/api/dashboard/leaderboard',
        '/api/dashboard/win-rate',
        '/api/dashboard/conversion-rate',
        '/api/dashboard/revenue-trend',
        '/api/dashboard/pipeline-distribution',
        '/api/dashboard/gp-summary',
        '/api/dashboard/quota-completion',
        '/api/dashboard/avg-deal-size',
        '/api/dashboard/pipeline'
      ]
    });
  } catch (error) {
    console.error('Dashboard API fallback error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Export for serverless function
module.exports = app; 