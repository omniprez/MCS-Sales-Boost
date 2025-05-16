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
    
    console.log('Deals API - Database connection successful');
    return pool;
  } catch (error) {
    console.error('Deals API - Database connection error:', error);
    return null;
  }
};

// Help extract deal ID from the URL
const getDealId = (reqUrl) => {
  if (!reqUrl) return null;
  
  const parts = reqUrl.split('/');
  const dealsIndex = parts.findIndex(part => part === 'deals');
  
  if (dealsIndex >= 0 && dealsIndex < parts.length - 1) {
    return parts[dealsIndex + 1];
  }
  
  return null;
};

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

app.get('/api/deals/:id', async (req, res) => {
  console.log(`API: Get deal ${req.params.id}`);
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
        WHERE d.id = $1
      `, [req.params.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      
      return res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`API Error (get deal ${req.params.id}):`, error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.put('/api/deals/:id', async (req, res) => {
  console.log(`API: Update deal ${req.params.id}`);
  const { name, amount, customer_id, user_id, stage } = req.body;
  
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      // First check if deal exists
      const checkResult = await client.query('SELECT id FROM deals WHERE id = $1', [req.params.id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      
      // Build the update query dynamically based on provided fields
      const updates = [];
      const values = [];
      let paramIndex = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
      }
      
      if (amount !== undefined) {
        updates.push(`amount = $${paramIndex}`);
        values.push(amount);
        paramIndex++;
      }
      
      if (customer_id !== undefined) {
        updates.push(`customer_id = $${paramIndex}`);
        values.push(customer_id);
        paramIndex++;
      }
      
      if (user_id !== undefined) {
        updates.push(`user_id = $${paramIndex}`);
        values.push(user_id);
        paramIndex++;
      }
      
      if (stage !== undefined) {
        updates.push(`stage = $${paramIndex}`);
        values.push(stage);
        paramIndex++;
      }
      
      updates.push(`updated_at = NOW()`);
      
      if (updates.length === 1) {
        // Only updated_at was added, no real changes
        return res.status(400).json({ error: 'No fields to update provided' });
      }
      
      // Add deal ID as the last parameter
      values.push(req.params.id);
      
      const updateQuery = `
        UPDATE deals
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, values);
      return res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`API Error (update deal ${req.params.id}):`, error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.delete('/api/deals/:id', async (req, res) => {
  console.log(`API: Delete deal ${req.params.id}`);
  try {
    const pool = await connectToDatabase();
    if (!pool) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const client = await pool.connect();
    try {
      // First check if deal exists
      const checkResult = await client.query('SELECT id FROM deals WHERE id = $1', [req.params.id]);
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Deal not found' });
      }
      
      await client.query('DELETE FROM deals WHERE id = $1', [req.params.id]);
      return res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`API Error (delete deal ${req.params.id}):`, error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Fallback handler for other deals endpoints
app.all('/api/deals/*', (req, res) => {
  console.log(`Deals API fallback called: ${req.path}`);
  return res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      '/api/deals',
      '/api/deals/:id'
    ]
  });
});

// Export for serverless function
module.exports = (req, res) => {
  // Debug: print incoming request details
  console.log('Deals API handler called:', { 
    url: req.url, 
    method: req.method,
    headers: req.headers
  });
  
  // Parse the URL and extract the deal ID if present
  const dealId = getDealId(req.url);
  
  // Handle specific routes by rewriting the URL for Express routing
  if (req.url.includes('/api/deals') && dealId) {
    // This is a request for a specific deal
    const originalUrl = req.url;
    req.url = `/api/deals/${dealId}`;
    console.log(`Rewriting URL from ${originalUrl} to ${req.url}`);
  } else if (req.url.includes('/api/deals')) {
    // This is a request for all deals
    const originalUrl = req.url;
    req.url = '/api/deals';
    console.log(`Rewriting URL from ${originalUrl} to ${req.url}`);
  }
  
  // Process the request with the Express app
  return app(req, res);
}; 