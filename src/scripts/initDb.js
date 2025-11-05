require('dotenv').config();
const { connectDB } = require('../config/database');
const User = require('../models/User.model');
const logger = require('../utils/logger');

const initDatabase = async () => {
  try {
    logger.info('Initializing database...');

    // Connect to database
    await connectDB();

    // Create tables
    await User.createTable();
    logger.info('Users table created successfully');

    logger.info('Database initialization completed');
    process.exit(0);
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

initDatabase();
