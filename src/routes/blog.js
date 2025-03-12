const express = require('express');
const { body } = require('express-validator');
const blogController = require('../controllers/blogController');
const { authenticate, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Blog routes
router.get('/', blogController.showBlogIndex);
router.get('/post/:slug', blogController.showPost);

// Comment routes (requires authentication)
router.post('/comment', requireAuth, [
  body('content').notEmpty().withMessage('Comment content is required'),
  body('postId').notEmpty().withMessage('Post ID is required')
], blogController.addComment);

module.exports = router;