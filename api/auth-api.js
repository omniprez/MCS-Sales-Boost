// Import required modules
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const dotenv = require('dotenv');

// Add import for session store
const MemoryStore = require('memorystore')(session);

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
    
    console.log('Auth API - Database connection successful');
    return pool;
  } catch (error) {
    console.error('Auth API - Database connection error:', error);
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

app.post('/api/auth/logout', (req, res) => {
  console.log('API: Logout request');
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      return res.json({ success: true });
    });
  } else {
    return res.json({ success: true });
  }
});

// Fallback handler for other auth endpoints
app.all('/api/auth/*', (req, res) => {
  console.log(`Auth API fallback called: ${req.path}`);
  return res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      '/api/auth/login',
      '/api/auth/check',
      '/api/auth/logout'
    ]
  });
});

// Export for serverless function
module.exports = app; 