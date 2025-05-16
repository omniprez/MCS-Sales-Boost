// Import required modules
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
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

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Provide a list of supported APIs for the root endpoint
app.get('/api', (req, res) => {
  res.json({
    apis: [
      {
        name: 'Dashboard API',
        endpoints: ['/api/dashboard/*'],
        description: 'Sales dashboard metrics and charts'
      },
      {
        name: 'Deals API',
        endpoints: ['/api/deals/*'],
        description: 'CRUD operations for sales deals'
      },
      {
        name: 'Auth API',
        endpoints: ['/api/auth/*'],
        description: 'Authentication endpoints'
      },
      {
        name: 'General API',
        endpoints: ['/api/health-check', '/api/version', '/api/debug/routes'],
        description: 'General utility endpoints'
      }
    ],
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'development'
  });
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
module.exports = app;