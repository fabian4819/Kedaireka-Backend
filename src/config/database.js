const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const connectDB = async () => {
  try {
    const databaseURL = process.env.DATABASE_URL;

    // Log for debugging in Vercel
    console.log('Attempting database connection...');
    console.log('DATABASE_URL exists:', !!databaseURL);

    if (!databaseURL) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Reuse existing pool if available (important for serverless)
    if (pool) {
      console.log('Reusing existing database pool');
      return pool;
    }

    // Determine if running in serverless environment
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    console.log('Is serverless:', isServerless);

    // Parse the database URL to log (without password)
    const urlObj = new URL(databaseURL);
    console.log('Database host:', urlObj.hostname);
    console.log('Database port:', urlObj.port);

    pool = new Pool({
      connectionString: databaseURL,
      max: isServerless ? 1 : 10, // Limit connections in serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: databaseURL.includes('supabase.co') ? { rejectUnauthorized: false } : false,
    });

    console.log('Pool created, testing connection...');

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    console.log('Database connection successful!');
    logger.info(`PostgreSQL Connected: ${result.rows[0].now}`);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
      logger.error(`PostgreSQL pool error: ${err}`);
    });

    // Graceful shutdown (only for non-serverless environments)
    if (!isServerless) {
      process.on('SIGINT', async () => {
        await pool.end();
        logger.info('PostgreSQL connection closed through app termination');
        process.exit(0);
      });
    }

    return pool;
  } catch (error) {
    console.error('Database connection error:', error.message);
    console.error('Error stack:', error.stack);
    logger.error(`Error connecting to PostgreSQL: ${error.message}`);

    // Don't exit in serverless environment, throw error instead
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      throw error;
    }

    process.exit(1);
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDB first.');
  }
  return pool;
};

module.exports = { connectDB, getPool };
