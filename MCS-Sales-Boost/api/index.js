// Import necessary modules
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const session = require('express-session');

// Initialize Express app
const app = express();

// Database connection
const connectToDatabase = async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Verify connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    
    console.log('Database connected:', result.rows[0]);
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
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

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // Connect to database
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    // Query user
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1',
        [username.toLowerCase()]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      const user = result.rows[0];
      
      // In a real application, we'd check the password
      // For demo purposes, we'll authenticate with any password
      
      // Set session data
      req.session.userId = user.id;
      req.session.isAuthenticated = true;
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({
        success: true,
        user: userWithoutPassword
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Auth check endpoint
app.get('/api/auth/check', async (req, res) => {
  try {
    if (!req.session || !req.session.isAuthenticated || !req.session.userId) {
      return res.status(401).json({
        success: false,
        isAuthenticated: false,
        error: 'Not authenticated'
      });
    }
    
    // Connect to database
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    // Query user
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [req.session.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          isAuthenticated: false,
          error: 'User not found'
        });
      }
      
      const user = result.rows[0];
      
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      
      return res.json({
        success: true,
        isAuthenticated: true,
        user: userWithoutPassword
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to logout'
        });
      }
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  } else {
    res.json({
      success: true,
      message: 'Already logged out'
    });
  }
});

// Deals endpoint
app.get('/api/deals', async (req, res) => {
  try {
    // Connect to database
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    // Query deals
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM deals ORDER BY id DESC');
      return res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Deals fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Database test endpoint
app.get('/api/db-direct-test', async (req, res) => {
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as time');
      res.json({
        success: true,
        message: 'Database connection successful',
        time: result.rows[0].time,
        database_url: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
});

// Fallback route
app.use('*', (req, res) => {
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