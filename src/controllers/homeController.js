const { Post, Project } = require('../models');

/**
 * Render the home page
 */
exports.showHomePage = async (req, res) => {
  try {
    // Fetch featured posts
    const featuredPosts = await Post.findFeatured(3);
    
    // Fetch featured projects
    const featuredProjects = await Project.findFeatured(3);
    
    // Render home page
    res.render('home/index', {
      title: 'Dawid Kocma - Personal Website',
      featuredPosts,
      featuredProjects
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('errors/500', { error });
  }
};

/**
 * Render the about page
 */
exports.showAboutPage = (req, res) => {
  res.render('home/about', {
    title: 'About Me - Dawid Kocma'
  });
};

/**
 * Render the contact page
 */
exports.showContactPage = (req, res) => {
  res.render('home/contact', {
    title: 'Contact Me - Dawid Kocma'
  });
};

/**
 * Handle contact form submission
 */
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Here you would typically send an email or save to database
    // For now, just redirect back with success message
    
    req.flash('success', 'Your message has been sent! I will get back to you soon.');
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.flash('error', 'Failed to send message. Please try again later.');
    res.redirect('/contact');
  }
};