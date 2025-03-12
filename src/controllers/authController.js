const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

/**
 * Render login page
 */
exports.showLoginPage = (req, res) => {
  const redirect = req.query.redirect || '/';
  res.render('auth/login', { redirect, error: null });
};

/**
 * Render registration page
 */
exports.showRegisterPage = (req, res) => {
  res.render('auth/register', { error: null });
};

/**
 * Handle user login
 */
exports.login = async (req, res) => {
  try {
    const { email, password, redirect } = req.body;
    const redirectUrl = redirect || '/';
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/login', { 
        redirect: redirectUrl,
        error: errors.array()[0].msg 
      });
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.render('auth/login', { 
        redirect: redirectUrl,
        error: 'Invalid email or password' 
      });
    }
    
    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.render('auth/login', { 
        redirect: redirectUrl,
        error: 'Invalid email or password' 
      });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    // Redirect to previous page or dashboard
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { 
      redirect: req.body.redirect || '/',
      error: 'An error occurred during login' 
    });
  }
};

/**
 * Handle user registration
 */
exports.register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/register', { 
        error: errors.array()[0].msg 
      });
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return res.render('auth/register', { 
        error: 'Passwords do not match' 
      });
    }
    
    // Check if username is already taken
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.render('auth/register', { 
        error: 'Username already taken' 
      });
    }
    
    // Check if email is already registered
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.render('auth/register', { 
        error: 'Email already registered' 
      });
    }
    
    // Create new user (default role is 'user')
    const user = await User.create({
      username,
      email,
      password,
      lastLogin: new Date()
    });
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Store user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    // Redirect to dashboard
    res.redirect('/');
    
  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', { 
      error: 'An error occurred during registration' 
    });
  }
};

/**
 * Handle user logout
 */
exports.logout = (req, res) => {
  // Clear token cookie
  res.clearCookie('token');
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/');
  });
};

/**
 * API login endpoint
 */
exports.apiLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user data and token
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    });
    
  } catch (error) {
    console.error('API login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

/**
 * API registration endpoint
 */
exports.apiRegister = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    // Check if username is already taken
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken'
      });
    }
    
    // Check if email is already registered
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }
    
    // Create new user (default role is 'user')
    const user = await User.create({
      username,
      email,
      password,
      lastLogin: new Date()
    });
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return user data and token
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
    
  } catch (error) {
    console.error('API registration error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration'
    });
  }
};