const { verifyToken, extractToken } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Authentication middleware for protected routes
 * - Checks for valid JWT token in cookies or Authorization header
 * - Attaches user to request object if authenticated
 */
const authenticate = async (req, res, next) => {
  try {
    // Check for token in cookies (for web) or Authorization header (for API)
    const token = req.cookies?.token || extractToken(req);
    
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return next();
    }
    
    // Find user
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next();
    }
    
    // Attach user to request
    req.user = user;
    
    // Also store in session for website use
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require authentication
 * - Redirects to login page for web routes
 * - Returns 401 Unauthorized for API routes
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    // Check if this is an API request
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // For web routes, redirect to login
    return res.redirect(`/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  
  next();
};

/**
 * Middleware to require admin role
 * - Redirects to 403 page for web routes
 * - Returns 403 Forbidden for API routes
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    // Check if this is an API request
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    // For web routes, redirect to 403 page
    return res.status(403).render('errors/403');
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin
};