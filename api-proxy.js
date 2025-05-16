// Simple API proxy to forward requests to our main API
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// CORS middleware
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  console.log(`API-PROXY: ${req.method} ${req.url}`);
  next();
});

// Create the API proxy with specific paths
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying ${req.method} ${req.url} -> ${proxyReq.path}`);
  }
});

// Apply proxy to all /api routes
app.use('/api', apiProxy);

// Fallback route
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'API proxy endpoint not found',
    path: req.originalUrl
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API proxy server running on port ${PORT}`);
}); 