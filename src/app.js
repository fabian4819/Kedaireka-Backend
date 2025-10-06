const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('./middleware/mongoSanitize');
const xssSanitize = require('./middleware/xssSanitize');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

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

// Data sanitization against NoSQL injection
app.use(mongoSanitize);

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
    message: 'Backend KedaiReka API',
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
