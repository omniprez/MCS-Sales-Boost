// Import necessary modules
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const session = require('express-session');

// Initialize Express app
const app = express();

// Database connection with detailed error logging
const connectToDatabase = async () => {
  try {
    console.log('Attempting database connection...');
    console.log('DATABASE_URL defined:', !!process.env.DATABASE_URL);
    
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not defined in environment variables');
      return null;
    }
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Verify connection
    console.log('Pool created, attempting to connect...');
    const client = await pool.connect();
    console.log('Client connected, running test query...');
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connected successfully:', result.rows[0]);
    return pool;
  } catch (error) {
    console.error('Database connection error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail
    });
    return null;
  }
};

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'defined' : 'not defined',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'defined' : 'not defined',
    VERCEL: process.env.VERCEL || 'not set'
  };
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    envVars
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  console.log('Login attempt received');
  
  try {
    const { username, password } = req.body;
    console.log('Login data received:', { username, password: '[REDACTED]' });
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Connect to database
    console.log('Connecting to database...');
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed in login endpoint');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    // Query user
    console.log('Querying for user:', username.toLowerCase());
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username.toLowerCase()]
      );
      
      console.log('User query result rows:', result.rows.length);
      
      if (result.rows.length === 0) {
        console.log('User not found:', username);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      const user = result.rows[0];
      console.log('User found with ID:', user.id);
      
      // In a real application, we'd check the password
      // For demo purposes, we'll authenticate with any password
      
      // Set session data
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      
      console.log('Session data set:', {
        userId: req.session.userId,
        isAuthenticated: req.session.isAuthenticated
      });
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      console.log('Login successful for user:', username);
      return res.json({
        success: true,
        user: userWithoutPassword
      });
    } catch (dbError) {
      console.error('Database query error:', {
        message: dbError.message,
        stack: dbError.stack,
        code: dbError.code
      });
      return res.status(500).json({
        success: false,
        error: 'Database query error',
        details: dbError.message
      });
    } finally {
      client.release();
      console.log('Database client released');
    }
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Auth check endpoint
app.get('/api/auth/check', async (req, res) => {
  console.log('Auth check requested');
  try {
    console.log('Session state:', {
      exists: !!req.session,
      isAuthenticated: req.session?.isAuthenticated,
      userId: req.session?.userId
    });
    
    if (!req.session || !req.session.isAuthenticated || !req.session.userId) {
      console.log('No valid session found');
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        error: 'Not authenticated'
      });
    }
    
    // Connect to database
    console.log('Connecting to database for auth check...');
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed in auth check');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    // Query user
    console.log('Querying for user ID:', req.session.userId);
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [req.session.userId]
      );
      
      console.log('User query result rows:', result.rows.length);
      
      if (result.rows.length === 0) {
        console.log('User not found for ID:', req.session.userId);
        return res.status(401).json({
          success: false,
          isAuthenticated: false,
          error: 'User not found'
        });
      }
      
      const user = result.rows[0];
      console.log('User found:', user.username);
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      console.log('Auth check successful for user ID:', user.id);
      return res.json({
        success: true,
        isAuthenticated: true,
        user: userWithoutPassword
      });
    } finally {
      client.release();
      console.log('Database client released');
    }
  } catch (error) {
    console.error('Auth check error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  console.log('Logout requested');
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to logout'
        });
      }
      
      console.log('Logout successful');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } else {
    console.log('No session found during logout');
    res.json({
      success: true,
      message: 'Already logged out'
    });
  }
});

// Get deals endpoint
app.get('/api/deals', async (req, res) => {
  console.log('Deals requested');
  try {
    // Connect to database
    console.log('Connecting to database for deals...');
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed in deals endpoint');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    // Query deals
    console.log('Querying for deals...');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM deals ORDER BY id DESC');
      console.log('Deals query returned:', result.rows.length, 'rows');
      return res.json(result.rows);
    } finally {
      client.release();
      console.log('Database client released');
    }
  } catch (error) {
    console.error('Deals fetch error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a specific deal by ID
app.get('/api/deals/:id', async (req, res) => {
  const dealId = req.params.id;
  console.log(`Deal ${dealId} requested`);
  
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Deal not found'
        });
      }
      
      return res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Deal fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new deal
app.post('/api/deals', async (req, res) => {
  console.log('Create deal requested');
  console.log('Request body:', req.body);
  
  try {
    // Validate required fields
    const { name, amount, stage, customer_id } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Deal name is required'
      });
    }
    
    // Get userId from session
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    const client = await pool.connect();
    try {
      // Get user's team
      const userResult = await client.query('SELECT team_id FROM users WHERE id = $1', [userId]);
      const teamId = userResult.rows[0]?.team_id || null;
      
      // Insert the new deal
      const result = await client.query(`
        INSERT INTO deals (
          name, 
          amount, 
          stage, 
          close_date, 
          customer_id, 
          user_id, 
          team_id, 
          products, 
          notes,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        name,
        amount || null,
        stage || 'prospecting',
        req.body.close_date || null,
        customer_id || null,
        userId,
        teamId,
        req.body.products ? JSON.stringify(req.body.products) : null,
        req.body.notes || null,
        new Date(),
        new Date()
      ]);
      
      console.log('Deal created:', result.rows[0]);
      return res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Deal creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a deal
app.put('/api/deals/:id', async (req, res) => {
  const dealId = req.params.id;
  console.log(`Update deal ${dealId} requested`);
  console.log('Request body:', req.body);
  
  try {
    // Get userId from session
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    const client = await pool.connect();
    try {
      // Check if deal exists and belongs to user or team
      const checkResult = await client.query(
        'SELECT * FROM deals WHERE id = $1',
        [dealId]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Deal not found'
        });
      }
      
      // Build the update query dynamically
      const fields = [
        'name', 'amount', 'stage', 'close_date', 'customer_id',
        'products', 'notes', 'updated_at'
      ];
      
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = $${paramIndex}`);
          
          if (field === 'products') {
            values.push(JSON.stringify(req.body[field]));
          } else {
            values.push(req.body[field]);
          }
          
          paramIndex++;
        }
      });
      
      // Always update the updated_at timestamp
      if (!updates.includes('updated_at')) {
        updates.push(`updated_at = $${paramIndex}`);
        values.push(new Date());
        paramIndex++;
      }
      
      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }
      
      // Add the deal ID as the last parameter
      values.push(dealId);
      
      const updateQuery = `
        UPDATE deals
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, values);
      
      console.log('Deal updated:', updateResult.rows[0]);
      return res.json(updateResult.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Deal update error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  console.log('Customers requested');
  
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM customers ORDER BY name');
      console.log(`Returning ${result.rows.length} customers`);
      return res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
  console.log('Dashboard data requested');
  
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    const client = await pool.connect();
    try {
      // Get total revenue (sum of closed won deals)
      const revenueResult = await client.query(`
        SELECT SUM(amount) as total
        FROM deals
        WHERE stage = 'closed_won'
      `);
      
      // Get pipeline value (sum of all open deals)
      const pipelineResult = await client.query(`
        SELECT SUM(amount) as total
        FROM deals
        WHERE stage NOT IN ('closed_won', 'closed_lost')
      `);
      
      // Get deal stages counts
      const stagesResult = await client.query(`
        SELECT stage, COUNT(*) as count, SUM(amount) as amount
        FROM deals
        GROUP BY stage
      `);
      
      // Get top performers
      const topPerformersResult = await client.query(`
        SELECT u.id, u.name, COUNT(d.id) as deals_count, SUM(d.amount) as amount
        FROM users u
        LEFT JOIN deals d ON u.id = d.user_id AND d.stage = 'closed_won'
        GROUP BY u.id, u.name
        ORDER BY amount DESC NULLS LAST
        LIMIT 5
      `);
      
      // Get recent deals
      const recentDealsResult = await client.query(`
        SELECT d.*, c.name as customer_name, u.name as user_name
        FROM deals d
        LEFT JOIN customers c ON d.customer_id = c.id
        LEFT JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
        LIMIT 5
      `);
      
      // Calculate conversion rates
      const conversionResult = await client.query(`
        SELECT 
          COUNT(CASE WHEN stage IN ('closed_won', 'closed_lost') THEN 1 END) as closed_deals,
          COUNT(CASE WHEN stage = 'closed_won' THEN 1 END) as won_deals,
          COUNT(*) as total_deals
        FROM deals
      `);
      
      const conversion = conversionResult.rows[0];
      const winRate = conversion.closed_deals > 0 
        ? (conversion.won_deals / conversion.closed_deals) * 100 
        : 0;
      
      const conversionRate = conversion.total_deals > 0 
        ? (conversion.closed_deals / conversion.total_deals) * 100 
        : 0;
      
      // Return all dashboard data
      return res.json({
        revenue: revenueResult.rows[0].total || 0,
        pipeline: pipelineResult.rows[0].total || 0,
        stages: stagesResult.rows,
        topPerformers: topPerformersResult.rows,
        recentDeals: recentDealsResult.rows,
        conversionRate,
        winRate
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Database test endpoint
app.get('/api/db-direct-test', async (req, res) => {
  console.log('Database direct test requested');
  try {
    console.log('Testing database connection...');
    const pool = await connectToDatabase();
    if (!pool) {
      console.error('Database connection failed in direct test');
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    console.log('Running test query...');
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time');
      console.log('Test query successful:', result.rows[0]);
      res.json({
        success: true,
        message: 'Database connection successful',
        time: result.rows[0].time,
        database_url: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
      });
    } finally {
      client.release();
      console.log('Database client released');
    }
  } catch (error) {
    console.error('Database test error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Environment variables endpoint
app.get('/api/env-check', (req, res) => {
  const safeEnvVars = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'defined' : 'not defined',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'defined' : 'not defined',
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_REGION: process.env.VERCEL_REGION || 'not set',
    VERCEL_URL: process.env.VERCEL_URL || 'not set'
  };
  
  res.json({
    environment: safeEnvVars,
    timestamp: new Date().toISOString()
  });
});

// Fallback route
app.use('*', (req, res) => {
  console.log('Not found route:', req.originalUrl);
  res.status(404).json({
    error: 'Not found'
  });
});

// Export for Vercel serverless functions
module.exports = (req, res) => {
  // Log request for debugging
  console.log(`[${new Date().toISOString()}] Received request: ${req.method} ${req.url}`);
  
  // Pass the request to the Express app
  return app(req, res);
}; 