// Import required modules
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Add import for session store
const MemoryStore = require('memorystore')(session);

// Debug info - print environment when module loads
console.log('API initialization - Environment:', {
  NODE_ENV: process.env.NODE_ENV || 'not set',
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
  VERCEL: process.env.VERCEL || 'not set',
  VERCEL_ENV: process.env.VERCEL_ENV || 'not set'
});

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
    console.error('Database connection error:', error);
    return null;
  }
};

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
  // Replace default MemoryStore with memorystore package that has auto-pruning
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}));

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// Debug endpoint to show available routes
app.get('/api/debug/routes', (req, res) => {
  const availableRoutes = app._router.stack
    .filter(r => r.route)
    .map(r => ({ 
      path: r.route.path, 
      methods: Object.keys(r.route.methods).join(', ') 
    }));
  
  res.json({
    routes: availableRoutes,
    count: availableRoutes.length,
    originalUrl: req.originalUrl,
    url: req.url,
    headers: req.headers
  });
});

// Dashboard metrics routes - route handlers for each dashboard metric
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

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  console.log('API: Login attempt');
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      
      // For simplicity in demo, just check if the password is the same
      // In production, use bcrypt.compare
      if (password === user.password) {
        // Store user in session
        req.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user'
        };
        
        return res.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'user'
          }
        });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (login):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.get('/api/auth/check', (req, res) => {
  console.log('API: Auth check');
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    return res.json({
      authenticated: false
    });
  }
});

// Deals endpoints
app.get('/api/deals', async (req, res) => {
  console.log('API: Get all deals');
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT d.*, c.name as customer_name, u.name as user_name
        FROM deals d
        LEFT JOIN customers c ON d.customer_id = c.id
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
      `);
      
      return res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (get deals):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/deals', async (req, res) => {
  console.log('API: Create deal');
  const { name, amount, customer_id, user_id, stage } = req.body;
  
  if (!name || !amount || !customer_id || !user_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO deals (name, amount, customer_id, user_id, stage, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [name, amount, customer_id, user_id, stage || 'prospecting']);
      
      return res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('API Error (create deal):', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Fallback route for 404s
app.use('*', (req, res) => {
  console.log(`API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not found',
    endpoint: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Set up the server if not running as a serverless function
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for serverless
module.exports = (req, res) => {
  console.log('Serverless function called:', req.url);
  return app(req, res);
}; 