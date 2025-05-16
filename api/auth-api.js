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
    
    console.log('Auth API - Database connection successful');
    return pool;
  } catch (error) {
    console.error('Auth API - Database connection error:', error);
    return null;
  }
};

// Create serverless function handler for authentication API
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Full path information from Vercel
  const fullPath = req.url;
  
  // Extract the auth endpoint from the path
  let endpoint = '';
  
  // Use regex to extract the endpoint
  const pathRegex = /\/api\/auth\/([^\/\?]+)/;
  const match = fullPath.match(pathRegex);
  
  if (match && match[1]) {
    endpoint = match[1];
  }
  
  // Log detailed information for debugging
  console.log(`Auth API request:`, {
    method: req.method,
    url: fullPath,
    endpoint,
    body: req.body ? 'present' : 'not present'
  });
  
  // Handle login request
  if (endpoint === 'login' && req.method === 'POST') {
    // Parse JSON body manually if needed
    let body = req.body;
    
    if (!body && req.headers['content-type'] === 'application/json') {
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const data = Buffer.concat(chunks).toString();
        body = JSON.parse(data);
      } catch (error) {
        console.error('Error parsing request body:', error);
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
    }
    
    const { email, password } = body || {};
    
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
          // For Vercel serverless, we can't use sessions, so return an auth token
          return res.json({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role || 'user'
            },
            token: 'demo-auth-token-' + user.id // In production, use a proper JWT token
          });
        } else {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('API Error (login):', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
  
  // Handle check request
  if (endpoint === 'check' && req.method === 'GET') {
    // In a real app, verify the auth token
    // For this demo, we'll just return a successful auth response
    return res.json({
      authenticated: true,
      user: {
        id: 1,
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'admin'
      }
    });
  }
  
  // Handle logout request
  if (endpoint === 'logout' && req.method === 'POST') {
    // In a real app, invalidate the auth token
    // For this demo, just return success
    return res.json({ success: true });
  }
  
  // Handle unknown auth endpoints
  return res.status(404).json({ 
    error: 'Auth endpoint not found',
    endpoint: endpoint || 'root',
    method: req.method,
    availableEndpoints: [
      { path: '/api/auth/login', method: 'POST', description: 'Login with email and password' },
      { path: '/api/auth/check', method: 'GET', description: 'Check authentication status' },
      { path: '/api/auth/logout', method: 'POST', description: 'Logout current user' }
    ]
  });
}; 