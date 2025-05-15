/**
 * MCS Sales Boost Server
 * Last updated: 2025-05-11 07:21:57 UTC
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

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app and HTTP server
const app = express();
const server = createServer(app);

// Environment variables
const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT) || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const useInMemoryDB = process.env.USE_IN_MEMORY_DB === 'true';

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://mcs-sales-boost.vercel.app',
  'https://mcs-sales-boost-1.vercel.app',
  'https://mcs-sales-boost-xkyy.vercel.app'
];

// Basic middleware setup
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

// Enhanced CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
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

// Session store configuration
const sessionStore = new session.MemoryStore();

// Session configuration
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET!,
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
  if (req.path !== '/health') {
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

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

// Register API routes
registerRoutes(app);

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Start the server
startServer().catch(console.error);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
});

export { app, server };