require('dotenv').config();
const app = require('../src/app');
const { connectDB } = require('../src/config/database');

// Initialize database connection
let dbInitialized = false;

const initDB = async () => {
  if (!dbInitialized) {
    try {
      await connectDB();
      dbInitialized = true;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
};

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Initialize database on cold start
    await initDB();

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
