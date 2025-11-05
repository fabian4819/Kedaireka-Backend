require('dotenv').config();
const app = require('../src/app');
const { connectDB } = require('../src/config/database');

// Initialize database connection
let dbInitialized = false;
let dbInitializing = false;

const initDB = async () => {
  // If already initialized or currently initializing, skip
  if (dbInitialized || dbInitializing) {
    return;
  }

  dbInitializing = true;
  try {
    await connectDB();
    dbInitialized = true;
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't throw - let the app start anyway
    // Routes that need DB will handle the error
  } finally {
    dbInitializing = false;
  }
};

// Start database connection immediately (non-blocking)
initDB();

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Try to initialize DB if not done yet (non-blocking)
    if (!dbInitialized && !dbInitializing) {
      initDB(); // Don't await - let it initialize in background
    }

    // Let Express handle the request
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};
