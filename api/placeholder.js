// Simple placeholder API to confirm server is working
module.exports = (req, res) => {
  res.json({
    status: 'online',
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    path: req.url
  });
}; 