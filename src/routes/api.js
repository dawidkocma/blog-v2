const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate, requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all API routes
router.use(authenticate);

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Authentication routes
router.post('/auth/login', loginValidation, authController.apiLogin);
router.post('/auth/register', registerValidation, authController.apiRegister);

// Blog post routes
// Will be implemented in blogController and commentController

// Project routes
// Will be implemented in projectController

// User routes
// Will be implemented in userController

// Admin routes (requires admin role)
router.use('/admin', requireAuth, requireAdmin);
// Will be implemented in adminController

module.exports = router;