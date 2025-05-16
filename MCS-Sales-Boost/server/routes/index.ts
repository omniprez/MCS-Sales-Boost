import express, { Request, Response } from 'express';
import path from 'path';
// @ts-ignore - Remove fileURLToPath import and replace with Node's __dirname
// import { fileURLToPath } from 'url';
import authRouter from './auth.js';
import apiRouter from './api.js';
import adminRouter from './admin.js';
import { testConnection } from '../db.js';
import { Pool } from 'pg';

// Get __dirname equivalent for ES modules
// @ts-ignore - Fix import.meta issue using Node's __dirname directly
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// Use Node.js __dirname directly
const __dirname = path.resolve();

export function registerRoutes(app: express.Express) {
  // Register all route handlers
  app.use('/api/auth', authRouter);
  app.use('/api', apiRouter);
  app.use('/api/admin', adminRouter);

  // Simple test endpoint to check database connection
  // @ts-ignore
  app.get('/api/db-test', async (req: Request, res: Response) => {
    try {
      const connectionResult = await testConnection();
      res.json({
        success: true,
        dbConnected: connectionResult,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown database error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Direct PostgreSQL connection test endpoint
  // @ts-ignore
  app.get('/api/db-direct-test', async (req: Request, res: Response) => {
    try {
      // Create a new pool directly
      const directPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      // Try to connect
      const client = await directPool.connect();
      try {
        // Simple query
        const result = await client.query('SELECT NOW() as time');
        
        res.json({
          success: true,
          message: 'Direct database connection successful',
          time: result.rows[0].time,
          database_url_prefix: process.env.DATABASE_URL?.substring(0, 15) + '...'
        });
      } finally {
        client.release();
        await directPool.end();
      }
    } catch (error: any) {
      console.error('Direct database connection test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Direct login test endpoint that doesn't use sessions
  // @ts-ignore
  app.post('/api/direct-login-test', async (req: Request, res: Response) => {
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
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
            role: user.role || 'sales_rep'
          }
        });
      } finally {
        client.release();
        await directPool.end();
      }
    } catch (error: any) {
      console.error('Direct login test failed:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Add a special route for the deal update tool
  // @ts-ignore
  app.get('/tools/update-deal', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../../tools/update-deal.html'));
  });

  return app;
}
