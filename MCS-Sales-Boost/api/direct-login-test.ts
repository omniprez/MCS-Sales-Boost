import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required'
      });
    }
    
    // Create a new pool directly
    const directPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Try to connect
    const client = await directPool.connect();
    try {
      // Query for user
      const userResult = await client.query(
        'SELECT * FROM users WHERE username = $1 LIMIT 1',
        [username.toLowerCase()]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const user = userResult.rows[0];
      
      // Skip password validation for test purposes
      return res.json({
        success: true,
        message: 'Direct login test successful',
        user: {
          id: user.id,
          username: user.username,
          name: user.name || user.username,
          role: user.role || 'sales_rep'
        }
      });
    } finally {
      client.release();
      await directPool.end();
    }
  } catch (error) {
    console.error('Direct login test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 