/**
 * MCS Sales Boost Server
 * Last updated: 2025-05-16 14:21:57 UTC
 * Author: omniprez
 */

import express from "express";
import session from 'express-session';
import { registerRoutes } from "./routes/index";
import { testConnection } from './db';
import { initializeDemoUsers } from './init-demo-users';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { setupVite, serveStatic } from './vite';

// Load environment variables early
dotenv.config();

// Determine if we're running in a serverless environment
const isServerless = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app and HTTP server
const app = express();
const server = isServerless ? null : createServer(app);

// Environment variables
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const useInMemoryDB = process.env.USE_IN_MEMORY_DB === 'true';

// Allowed origins for CORS - add all Vercel domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mcs-sales-boost.vercel.app',
  'https://mcs-sales-boost-1.vercel.app',
  'https://mcs-sales-boost-xkyy.vercel.app',
  'https://mcs-sales-boost-xkyy-2ediv9jt5-manishs-projects-4ece3626.vercel.app'
];

// Basic middleware setup - increased limit for serverless
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add a required headers middleware for Vercel
app.use((req, res, next) => {
  // Set headers for CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Log request in serverless environment
  if (isServerless) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  
  next();
});

// Simple health check endpoint with no middleware
app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    isServerless: isServerless
  });
});

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all origins in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Credentials'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
}));

// Session configuration - use memory store for now
const MemoryStore = session.MemoryStore;
const sessionStore = new MemoryStore();

// Session configuration
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'default-secret-for-development-only',
  name: 'mcs_sales_boost_sid',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  }
}));

// Request logging middleware
app.use((req, res, next) => {
  // Don't log health check requests
  if (req.path !== '/health' && req.path !== '/api/health-check') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Auth debug middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    const sanitizedHeaders = { ...req.headers };
    delete sanitizedHeaders.cookie;
    delete sanitizedHeaders.authorization;

    console.log('Auth Request:', {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      headers: sanitizedHeaders,
      session: req.session ? {
        id: req.sessionID,
        isAuthenticated: req.session.isAuthenticated
      } : null
    });
  }
  next();
});

// Direct Database Test Endpoint
app.get('/api/db-direct-test', async (req, res) => {
  try {
    const { Pool } = require('pg');
    
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
  } catch (error) {
    console.error('Direct database connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Only use development setup in non-serverless environment
if (!isServerless) {
  // Development specific setup
  if (isDevelopment) {
    console.log('[Development Mode] Setting up Vite middleware...');
    setupVite(app, server).catch(err => {
      console.error('Vite setup failed:', err);
      process.exit(1);
    });
  } else {
    console.log('[Production Mode] Serving static files...');
    serveStatic(app);
  }
}

// Register API routes
registerRoutes(app);

// Global error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error('Error occurred:', {
    timestamp,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: isDevelopment ? err.stack : undefined
  });

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal Server Error',
    timestamp,
    path: req.path,
    details: isDevelopment ? err.stack : undefined
  });
});

// Database connection and server startup - only in non-serverless
if (!isServerless) {
  startServer().catch(console.error);
} else {
  // In serverless, just test the connection
  testConnection()
    .then(result => {
      console.log('Database connection test in serverless:', result ? 'successful' : 'failed');
    })
    .catch(err => {
      console.error('Database connection test in serverless failed:', err);
    });
}

// Database connection and server startup
async function startServer() {
  try {
    // Test database connection
    if (!useInMemoryDB) {
      await testConnection();
      console.log('Database connection successful');
    }

    // Initialize demo users if needed
    if (process.env.INITIALIZE_DEMO_USERS === 'true') {
      await initializeDemoUsers();
      console.log('Demo users initialized');
    }

    // Start the server
    server.listen(port, host, () => {
      console.log(`
Server Information:
------------------
Status: Running
URL: http://${host}:${port}
Environment: ${process.env.NODE_ENV}
Database: ${useInMemoryDB ? 'In-Memory' : 'PostgreSQL'}
Time: ${new Date().toISOString()}
------------------
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown - only in non-serverless
if (!isServerless) {
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    if (server) {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (server) {
      server.close(() => {
        console.log('Server closed due to uncaught exception');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}

export { app, server };