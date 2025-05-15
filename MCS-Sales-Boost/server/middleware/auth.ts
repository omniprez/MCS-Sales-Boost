import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage-provider';

// Add this configuration object right after the imports
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Extend Express Request type to include session and user
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    user_id?: number;
    isAuthenticated?: boolean;
    role?: string;
    _logged?: string;
  }
}

declare module 'express' {
  interface Request {
    user?: any;
  }
}

export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip authentication for login and register routes
    if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
      return next();
    }

    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      // DEVELOPMENT MODE: Set a default admin user for all requests
      req.user = {
        id: 20, // Use the admin user ID from your logs
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        teamId: null,
        isChannelPartner: false
      };

      // Log the bypass
      console.log(`DEV MODE: Authentication bypassed for ${req.path}, using default admin user`);

      // Continue to the next middleware
      return next();
    }

    // PRODUCTION MODE: Use proper authentication
    // Check if user is authenticated via session
    if (!req.session) {
      console.error('Auth middleware - No session found');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No session found'
      });
    }

    // Check both userId and user_id
    const userId = req.session.userId || req.session.user_id;
    if (!userId || !req.session.isAuthenticated) {
      console.error('Auth middleware - Session not authenticated', {
        hasSession: true,
        hasUserId: !!userId,
        isAuthenticated: !!req.session.isAuthenticated,
        path: req.path
      });

      // Only return 401 for API routes
      if (req.path.startsWith('/api/')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated'
        });
      }

      // For non-API routes, just continue
      return next();
    }

    // Get user from storage
    try {
      const user = await storage.getUser(userId);

      if (!user) {
        console.error('Auth middleware - User not found in storage');
        // Clear invalid session
        req.session.destroy((err) => {
          if (err) console.error('Error destroying session:', err);
        });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found'
        });
      }

      // Remove sensitive data
      const { password, ...safeUser } = user;

      // Ensure role is properly set
      safeUser.role = safeUser.role || 'sales_rep';

      // Set user in request object
      req.user = safeUser;

      // Update session with latest user data
      req.session.role = safeUser.role;
      req.session.userId = userId;
      req.session.user_id = userId;

      // Save session changes
      req.session.save((err) => {
        if (err) {
          console.error('Error saving session:', err);
        }
      });

      return next();
    } catch (error) {
      console.error('Auth middleware - Error fetching user:', error);
      return res.status(500).json({
        error: 'Server Error',
        message: 'Error fetching user data'
      });
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred during authentication'
    });
  }
}

// Middleware to check for specific roles
export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      });
    }

    // Check if user has required role
    if (roles.includes(req.user.role)) {
      return next();
    }

    // If not, return 403 Forbidden
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to access this resource'
    });
  };
}

// Middleware to check for admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }

  // Normalize role for comparison
  const userRole = (req.user.role || '').toLowerCase();

  console.log('requireAdmin middleware - User role:', userRole);

  // Check if user is an admin (strict check)
  if (userRole === 'admin') {
    return next();
  }

  // If not, return 403 Forbidden
  return res.status(403).json({
    error: 'Forbidden',
    message: 'Admin access required'
  });
}

// Middleware to check for manager or admin role
export function requireManagerOrAdmin(req: Request, res: Response, next: NextFunction) {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }

  // Normalize role for comparison
  const userRole = (req.user.role || '').toLowerCase();

  console.log('requireManagerOrAdmin middleware - User role:', userRole);

  // Check if user is a manager or admin (strict check)
  if (userRole === 'admin' || userRole === 'manager') {
    return next();
  }

  // If not, return 403 Forbidden
  return res.status(403).json({
    error: 'Forbidden',
    message: 'Manager or admin access required'
  });
}

// Middleware to check if user owns a deal or is an admin
export async function requireDealOwnershipOrAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'You must be logged in to access this resource'
      });
    }

    // Get the deal ID from the request parameters
    const dealId = parseInt(req.params.id);
    if (isNaN(dealId)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid deal ID'
      });
    }

    // Normalize role for comparison
    const userRole = (req.user.role || '').toLowerCase();
    const isAdmin = userRole === 'admin';

    // If user is an admin, allow access
    if (isAdmin) {
      console.log(`requireDealOwnershipOrAdmin: User ${req.user.id} is an admin, allowing access to deal ${dealId}`);
      return next();
    }

    // Get the deal to check ownership
    const deal = await storage.getDealById(dealId);
    if (!deal) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Deal not found'
      });
    }

    // Check if the user owns the deal
    if (deal.userId === req.user.id) {
      console.log(`requireDealOwnershipOrAdmin: User ${req.user.id} owns deal ${dealId}, allowing access`);
      return next();
    }

    // If not the owner, return 403 Forbidden
    console.log(`requireDealOwnershipOrAdmin: User ${req.user.id} does not own deal ${dealId} and is not an admin, denying access`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to modify this deal'
    });
  } catch (error) {
    console.error('Deal ownership check error:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: 'An error occurred while checking deal ownership'
    });
  }
}