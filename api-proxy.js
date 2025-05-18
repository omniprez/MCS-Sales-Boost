// Import required modules
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

// Create express app
const app = express();

// Proxy API requests
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
}));

// Serve static files from client dist
app.use(express.static(path.join(__dirname, 'MCS-Sales-Boost/client/dist')));

// All other requests go to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'MCS-Sales-Boost/client/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`API forwarded to localhost:5000`);
  console.log(`Client served from MCS-Sales-Boost/client/dist`);
}); 