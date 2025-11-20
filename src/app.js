const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const sqlSanitize = require('./middleware/mongoSanitize');
const xssSanitize = require('./middleware/xssSanitize');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { connectDB, getPool } = require('./config/database');
// Initialize express app
const app = express();

// Trust proxy - important for rate limiting and getting correct IP addresses
app.set('trust proxy', 1);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
    xssFilter: true,
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Data sanitization against SQL injection
app.use(sqlSanitize);

// Data sanitization against XSS
app.use(xssSanitize);

// Prevent HTTP parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.http(message.trim()),
      },
    })
  );
}

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend Pix2Land API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to check environment variables
app.get('/debug', (req, res) => {
  res.status(200).json({
    success: true,
    environment: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    databaseHost: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'N/A',
    isVercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString(),
  });
});
// ENDPOINT GEOSPATIAL
app.get('/buildings', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'Feature',
        'id', b.id,
        'geometry', ST_AsGeoJSON(b.geom)::jsonb,
        'properties', to_jsonb(b) - 'geom'
      ) AS geojson
      FROM "Buildings" b;
    `);

    res.json({
      type: 'FeatureCollection',
      features: result.rows.map((r) => r.geojson),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/bidangtanah', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'Feature',
        'id', b.id,
        'geometry', ST_AsGeoJSON(b.geom)::jsonb,
        'properties', to_jsonb(b) - 'geom'
      ) AS geojson
      FROM "bidangtanah" b;
    `);

    res.json({
      type: 'FeatureCollection',
      features: result.rows.map((r) => r.geojson),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/buildings/stats', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
    MIN(flood_haza) AS min_flood_hazard,
    MAX(flood_haza) AS max_flood_hazard,
    MIN(fire_hazar) AS min_fire_hazard,
    MAX(fire_hazar) AS max_fire_hazard,
    MIN(hazard_sum) AS min_hazard_sum,
    MAX(hazard_sum) AS max_hazard_sum,
    MIN("NJOP_TOTAL") AS min_njop_total,
    MAX("NJOP_TOTAL") AS max_njop_total
FROM "Buildings";
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/tiles', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'Feature',
        'id', t.id,
        'geometry', ST_AsGeoJSON(t.geom)::jsonb,
        'properties', to_jsonb(t) - 'geom'
      ) AS geojson
      FROM "Tiles" t;
    `);

    res.json({
      type: 'FeatureCollection',
      features: result.rows.map((r) => r.geojson),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.get('/tiles/:id/buildings', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getPool();
    const result = await pool.query(
      `
      SELECT jsonb_build_object(
        'type', 'Feature',
        'id', b.id,
        'geometry', ST_AsGeoJSON(b.geom)::jsonb,
        'properties', to_jsonb(b) - 'geom'
      ) AS geojson
      FROM "Buildings" b
      JOIN "Tiles" t ON ST_Intersects(b.geom, t.geom)
      WHERE t.id = $1;
    `,
      [id]
    );

    res.json({
      type: 'FeatureCollection',
      features: result.rows.map((r) => r.geojson),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// API routes
const routes = require('./routes');
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
