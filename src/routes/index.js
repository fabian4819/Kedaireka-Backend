const express = require('express');
const router = express.Router();

// Import route modules here
// Example: const authRoutes = require('./auth.routes');
// Example: const userRoutes = require('./user.routes');

// Mount routes here
// Example: router.use('/auth', authRoutes);
// Example: router.use('/users', userRoutes);

// Default API route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend KedaiReka API v1',
    version: '1.0.0',
  });
});

module.exports = router;
