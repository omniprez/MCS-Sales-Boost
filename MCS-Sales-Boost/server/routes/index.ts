import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './auth';
import apiRouter from './api';
import adminRouter from './admin';
import { testConnection } from '../db';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerRoutes(app: express.Express) {
  // Register all route handlers
  app.use('/api/auth', authRouter);
  app.use('/api', apiRouter);
  app.use('/api/admin', adminRouter);

  // Simple test endpoint to check database connection
  app.get('/api/db-test', async (req, res) => {
    try {
      const connectionResult = await testConnection();
      res.json({
        success: true,
        dbConnected: connectionResult,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown database error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Add a special route for the deal update tool
  app.get('/tools/update-deal', (req, res) => {
    res.sendFile(path.join(__dirname, '../../tools/update-deal.html'));
  });

  return app;
}
