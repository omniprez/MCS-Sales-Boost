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
    const result = await client.query('SELECT NOW()');
    console.log("Database connected:", result.rows[0]);
    client.release();
    
    console.log('Database connection successful');
    return pool;
  } catch (error) {
    console.error('Database connection error:', error);
    return null;
  }
};

// Direct serverless function handler for Vercel
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
  
  // Log detailed information for debugging
  console.log(`API request:`, {
    method: req.method,
    url: fullPath,
    query: req.query
  });
  
  // Extract the endpoint from the path
  let endpoint = '';
  const pathParts = fullPath.split('/').filter(Boolean);
  
  // Get the second path component if it exists (after /api/)
  if (pathParts.length > 1) {
    endpoint = pathParts[1]; // This would be 'health-check', 'version', etc.
  }
  
  // Handle the request based on the endpoint
  switch (endpoint) {
    case 'health-check':
      return res.json({ 
        status: 'ok', 
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
      
    case 'version':
      return res.json({
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
      
    case 'pipeline':
      // Handle the pipeline API request
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
        return res.status(500).json({ error: 'Server error', details: error.message });
      }
      
    case '':
    case undefined:
      // Root API endpoint
      return res.json({
        name: 'MCS Sales Boost API',
        version: '1.1.0',
        environment: process.env.NODE_ENV || 'development',
        apis: [
          {
            name: 'Dashboard API',
            endpoint: '/api/dashboard/*',
            description: 'Sales dashboard metrics and charts'
          },
          {
            name: 'Deals API',
            endpoint: '/api/deals/*',
            description: 'CRUD operations for sales deals'
          },
          {
            name: 'Auth API',
            endpoint: '/api/auth/*',
            description: 'Authentication endpoints'
          },
          {
            name: 'General API',
            endpoints: ['/api/health-check', '/api/version', '/api/pipeline'],
            description: 'General utility endpoints'
          }
        ],
        request: {
          method: req.method,
          url: fullPath
        }
      });
      
    default:
      // Handle 404 for unknown endpoints
      return res.status(404).json({ 
        error: 'Not found',
        endpoint: endpoint || '/',
        url: fullPath,
        method: req.method,
        timestamp: new Date().toISOString()
      });
  }
};