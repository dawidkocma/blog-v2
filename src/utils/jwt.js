const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object (should not include password)
 * @param {string} expiresIn - Token expiration time (default: '1d')
 * @returns {string} JWT token
 */
function generateToken(user, expiresIn = '1d') {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null if not found
 */
function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7);
  }
  return null;
}

module.exports = {
  generateToken,
  verifyToken,
  extractToken
};