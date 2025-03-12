const express = require('express');
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(authenticate);

// Project routes
router.get('/', projectController.showProjectsIndex);
router.get('/:slug', projectController.showProject);

module.exports = router;