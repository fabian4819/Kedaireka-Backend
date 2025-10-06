const express = require('express');
const router = express.Router();
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Example auth routes structure (to be implemented with controllers)

// POST /api/v1/auth/register - Register new user
// router.post('/register', authLimiter, registerController);

// POST /api/v1/auth/login - Login user
// router.post('/login', authLimiter, loginController);

// POST /api/v1/auth/logout - Logout user
// router.post('/logout', logoutController);

// POST /api/v1/auth/refresh-token - Refresh access token
// router.post('/refresh-token', refreshTokenController);

// POST /api/v1/auth/forgot-password - Request password reset
// router.post('/forgot-password', passwordResetLimiter, forgotPasswordController);

// PUT /api/v1/auth/reset-password/:token - Reset password
// router.put('/reset-password/:token', resetPasswordController);

// GET /api/v1/auth/me - Get current user (protected route)
// router.get('/me', protect, getCurrentUserController);

module.exports = router;
