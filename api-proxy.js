// Import required modules
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

// Create express app
const app = express();

// Check if client dist directory exists
const clientDistPath = path.join(__dirname, 'MCS-Sales-Boost/client/dist');
const publicPath = path.join(__dirname, 'public');

// Determine which path to serve static files from
let staticPath = fs.existsSync(clientDistPath) ? clientDistPath : publicPath;

console.log(`Serving static files from: ${staticPath}`);

// Proxy API requests
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({
      error: 'Proxy error',
      message: 'Failed to connect to API server',
      details: err.message
    });
  }
}));

// Serve static files
app.use(express.static(staticPath));

// All other requests go to index.html
app.get('*', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <html>
        <head>
          <title>MCS Sales Boost - Setup Required</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
            h1 { color: #0052CC; }
            .card { background: #f5f5f5; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .error { color: #e53e3e; }
            .code { background: #f0f0f0; padding: 10px; border-radius: 3px; font-family: monospace; overflow-x: auto; }
          </style>
        </head>
        <body>
          <h1>MCS Sales Boost - Setup Required</h1>
          <div class="card">
            <h2>Client application not built</h2>
            <p>The client application needs to be built before it can be served.</p>
            <p>Run the following command to build the client:</p>
            <div class="code">npm run build</div>
          </div>
        </body>
      </html>
    `);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`API forwarded to localhost:5000`);
  console.log(`Client served from ${staticPath}`);
});