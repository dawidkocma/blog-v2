const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blog');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set local variables middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/blog', blogRoutes);
app.use('/projects', projectRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', { error: err });
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Handle new comment
  socket.on('new-comment', async (data) => {
    // Save comment to database through controller
    // Broadcast to all clients
    io.emit('comment-added', data);
  });

  // Handle comment moderation
  socket.on('moderate-comment', async (data) => {
    // Update comment in database through controller
    // Broadcast update to all clients
    io.emit('comment-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Export server for use in bin/www
module.exports = { app, server };