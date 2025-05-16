// Shared API middleware utilities

/**
 * Set CORS headers on response
 */
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};

/**
 * Handle OPTIONS preflight requests
 */
const handlePreflight = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
};

/**
 * Validate request method
 */
const validateMethod = (req, res, allowedMethods = ['GET']) => {
  const method = req.method.toUpperCase();
  if (!allowedMethods.includes(method)) {
    res.status(405).json({
      error: 'Method not allowed',
      message: `This endpoint only supports ${allowedMethods.join(', ')} requests`
    });
    return false;
  }
  return true;
};

/**
 * Apply all middleware to a request
 */
const applyMiddleware = (req, res, allowedMethods = ['GET']) => {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (handlePreflight(req, res)) {
    return false;
  }
  
  // Validate request method
  if (!validateMethod(req, res, allowedMethods)) {
    return false;
  }
  
  return true;
};

/**
 * Return error response
 */
const errorResponse = (res, error, statusCode = 500) => {
  console.error('API Error:', error);
  
  return res.status(statusCode).json({
    error: 'An error occurred',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

module.exports = {
  setCorsHeaders,
  handlePreflight,
  validateMethod,
  applyMiddleware,
  errorResponse
}; 