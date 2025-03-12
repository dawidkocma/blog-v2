const express = require('express');
const homeController = require('../controllers/homeController');
const { body } = require('express-validator');

const router = express.Router();

// Contact form validation
const contactValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('message').notEmpty().withMessage('Message is required')
];

// Home routes
router.get('/', homeController.showHomePage);
router.get('/about', homeController.showAboutPage);
router.get('/contact', homeController.showContactPage);
router.post('/contact', contactValidation, homeController.submitContactForm);

module.exports = router;