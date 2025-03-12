const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const adminController = require('../controllers/adminController');
const { authenticate, requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Apply authentication middleware to all admin routes
router.use(authenticate, requireAuth, requireAdmin);

// Dashboard
router.get('/', adminController.showDashboard);

// Posts management
router.get('/posts', adminController.showPosts);
router.get('/posts/create', adminController.showCreatePost);
router.post('/posts/create', upload.single('coverImage'), adminController.createPost);
router.get('/posts/edit/:id', adminController.showEditPost);
router.post('/posts/edit/:id', upload.single('coverImage'), adminController.updatePost);
router.delete('/posts/:id', adminController.deletePost);

// Projects management
router.get('/projects', adminController.showProjects);
// Additional project routes would be added here

// Users management
router.get('/users', adminController.showUsers);
// Additional user routes would be added here

// Comments management
router.get('/comments', adminController.showComments);
router.post('/comments/:id/moderate', adminController.moderateComment);

module.exports = router;