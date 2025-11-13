require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Connect to database
const initializeApp = async () => {
  try {
    await connectDB();

    // Initialize User table after database connection
    const User = require('./models/User.model');
    await User.createTable();
    console.log('Users table initialized successfully');
    logger.info('Users table initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error.message);
    logger.error(`Failed to initialize application: ${error.message}`);
    process.exit(1);
  }
};

initializeApp();

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
  });
});
