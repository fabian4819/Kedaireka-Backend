const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const connectDB = async () => {
  try {
    const databaseURL = process.env.DATABASE_URL;

    if (!databaseURL) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    pool = new Pool({
      connectionString: databaseURL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: databaseURL.includes('supabase.co') ? { rejectUnauthorized: false } : false,
    });

    // Test the connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    logger.info(`PostgreSQL Connected: ${result.rows[0].now}`);

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error(`PostgreSQL pool error: ${err}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await pool.end();
      logger.info('PostgreSQL connection closed through app termination');
      process.exit(0);
    });

    return pool;
  } catch (error) {
    logger.error(`Error connecting to PostgreSQL: ${error.message}`);
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
