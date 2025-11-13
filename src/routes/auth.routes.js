const express = require('express');
const router = express.Router();
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const authValidator = require('../validators/auth.validator');
const { validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/v1/auth/register - Register new user
router.post('/register', authLimiter, authController.register);

// POST /api/v1/auth/login - Login user
router.post('/login', authLimiter, authController.login);

// POST /api/v1/auth/google - Google Sign-In
router.post('/google', authLimiter, authController.googleSignIn);

// POST /api/v1/auth/logout - Logout user
router.post('/logout', protect, authController.logout);

// POST /api/v1/auth/refresh-token - Refresh access token
router.post('/refresh-token', authLimiter, authController.refreshToken);

// GET /api/v1/auth/me - Get current user (protected route)
router.get('/me', protect, authController.getMe);

// POST /api/v1/auth/send-verification - Send email verification (protected route)
router.post('/send-verification', protect, authController.sendEmailVerification);

// GET /api/v1/auth/check-verification - Check email verification status (protected route)
router.get('/check-verification', protect, authController.checkEmailVerification);

module.exports = router;
