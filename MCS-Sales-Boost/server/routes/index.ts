import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './auth';
import apiRouter from './api';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerRoutes(app: express.Express) {
  // Register all route handlers
  app.use('/api/auth', authRouter);
  app.use('/api', apiRouter);

  // Add a special route for the deal update tool
  app.get('/tools/update-deal', (req, res) => {
    res.sendFile(path.join(__dirname, '../../tools/update-deal.html'));
  });

  return app;
}
