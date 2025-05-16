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
    
    console.log('Deals API - Database connection successful');
    return pool;
  } catch (error) {
    console.error('Deals API - Database connection error:', error);
    return null;
  }
};

// Create serverless function handler for deals API
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Full path information from Vercel
  const fullPath = req.url;
  
  // Extract the deals endpoint from the path
  let endpoint = '';
  let dealId = null;
  
  // Use regex to extract the endpoint and potential deal ID
  const pathRegex = /\/api\/deals\/([^\/\?]+)(?:\/([^\/\?]+))?/;
  const match = fullPath.match(pathRegex);
  
  if (match) {
    endpoint = match[1];
    dealId = match[2]; // This could be undefined if no ID is present
  }
  
  // Log detailed information for debugging
  console.log(`Deals API request:`, {
    method: req.method,
    url: fullPath,
    endpoint,
    dealId,
    body: req.body ? 'present' : 'not present',
    query: req.query
  });
  
  // Parse JSON body manually if needed
  let body = req.body;
  
  if (!body && req.method !== 'GET' && req.headers['content-type'] === 'application/json') {
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
  
  // Connect to the database
  const pool = await connectToDatabase();
  if (!pool) {
    return res.status(500).json({ error: 'Database connection failed' });
  }

  // Handle different endpoints
  try {
    // Get all deals or filter by query parameters
    if (endpoint === 'list' && req.method === 'GET') {
      const client = await pool.connect();
      try {
        let query = 'SELECT * FROM deals';
        const conditions = [];
        const params = [];
        let paramIndex = 1;
        
        // Process query parameters
        const { status, value_min, value_max, customer } = req.query || {};
        
        if (status) {
          conditions.push(`status = $${paramIndex++}`);
          params.push(status);
        }
        
        if (value_min) {
          conditions.push(`deal_value >= $${paramIndex++}`);
          params.push(parseFloat(value_min));
        }
        
        if (value_max) {
          conditions.push(`deal_value <= $${paramIndex++}`);
          params.push(parseFloat(value_max));
        }
        
        if (customer) {
          conditions.push(`customer_name ILIKE $${paramIndex++}`);
          params.push(`%${customer}%`);
        }
        
        // Add WHERE clause if there are conditions
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Add default sorting
        query += ' ORDER BY created_at DESC';
        
        const result = await client.query(query, params);
        return res.json({ deals: result.rows });
      } finally {
        client.release();
      }
    }
    
    // Get a single deal by ID
    if (endpoint === 'detail' && dealId && req.method === 'GET') {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Deal not found' });
        }
        return res.json({ deal: result.rows[0] });
      } finally {
        client.release();
      }
    }
    
    // Create a new deal
    if (endpoint === 'create' && req.method === 'POST') {
      const client = await pool.connect();
      try {
        const { customer_name, deal_value, product, status, expected_close_date } = body;
        
        // Validate required fields
        if (!customer_name || !deal_value || !product || !status) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const query = `
          INSERT INTO deals (customer_name, deal_value, product, status, expected_close_date)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const result = await client.query(query, [
          customer_name, 
          deal_value, 
          product, 
          status, 
          expected_close_date || null
        ]);
        
        return res.status(201).json({ 
          success: true,
          deal: result.rows[0]
        });
      } finally {
        client.release();
      }
    }
    
    // Update an existing deal
    if (endpoint === 'update' && dealId && req.method === 'PUT') {
      const client = await pool.connect();
      try {
        // Get current deal data
        const checkResult = await client.query('SELECT * FROM deals WHERE id = $1', [dealId]);
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ error: 'Deal not found' });
        }
        
        const currentDeal = checkResult.rows[0];
        const { customer_name, deal_value, product, status, expected_close_date } = body;
        
        // Build update query
        const updates = [];
        const params = [];
        let paramIndex = 1;
        
        if (customer_name !== undefined) {
          updates.push(`customer_name = $${paramIndex++}`);
          params.push(customer_name);
        }
        
        if (deal_value !== undefined) {
          updates.push(`deal_value = $${paramIndex++}`);
          params.push(deal_value);
        }
        
        if (product !== undefined) {
          updates.push(`product = $${paramIndex++}`);
          params.push(product);
        }
        
        if (status !== undefined) {
          updates.push(`status = $${paramIndex++}`);
          params.push(status);
        }
        
        if (expected_close_date !== undefined) {
          updates.push(`expected_close_date = $${paramIndex++}`);
          params.push(expected_close_date);
        }
        
        // Add updated_at timestamp
        updates.push(`updated_at = NOW()`);
        
        // If no updates, return the current deal
        if (updates.length === 0) {
          return res.json({ 
            success: true,
            deal: currentDeal,
            message: 'No changes to update'
          });
        }
        
        // Add the dealId parameter
        params.push(dealId);
        
        const query = `
          UPDATE deals
          SET ${updates.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const result = await client.query(query, params);
        
        return res.json({ 
          success: true,
          deal: result.rows[0],
          message: 'Deal updated successfully'
        });
      } finally {
        client.release();
      }
    }
    
    // Delete a deal
    if (endpoint === 'delete' && dealId && req.method === 'DELETE') {
      const client = await pool.connect();
      try {
        // Check if deal exists
        const checkResult = await client.query('SELECT id FROM deals WHERE id = $1', [dealId]);
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ error: 'Deal not found' });
        }
        
        // Delete the deal
        await client.query('DELETE FROM deals WHERE id = $1', [dealId]);
        
        return res.json({ 
          success: true,
          message: 'Deal deleted successfully'
        });
      } finally {
        client.release();
      }
    }
    
    // Return 404 for unknown endpoints
    return res.status(404).json({ 
      error: 'Deals endpoint not found',
      endpoint: endpoint || 'root',
      method: req.method,
      availableEndpoints: [
        { path: '/api/deals/list', method: 'GET', description: 'Get all deals or filter by query params' },
        { path: '/api/deals/detail/:id', method: 'GET', description: 'Get a single deal by ID' },
        { path: '/api/deals/create', method: 'POST', description: 'Create a new deal' },
        { path: '/api/deals/update/:id', method: 'PUT', description: 'Update an existing deal' },
        { path: '/api/deals/delete/:id', method: 'DELETE', description: 'Delete a deal' }
      ]
    });
  } catch (error) {
    console.error('Deals API Error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}; 