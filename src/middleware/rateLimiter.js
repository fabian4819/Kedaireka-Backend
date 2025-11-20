const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
});

// Custom rate limiter with enhanced headers
const createAuthLimiter = (options = {}) => {
  const {
    max = 5,
    windowMs = 15 * 60 * 1000,
    message,
    skipSuccessfulRequests = true
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || `Too many requests, please try again after ${Math.ceil(windowMs / 60000)} minutes.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    // Custom handler to add enhanced headers
    handler: (req, res, next) => {
      const retryAfter = Math.ceil(windowMs / 1000); // Convert to seconds

      res.status(429).set({
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Window': Math.ceil(windowMs / 60000).toString() + ' minutes',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      }).json({
        success: false,
        error: message || `Too many requests, please try again after ${Math.ceil(windowMs / 60000)} minutes.`,
        retryAfter: retryAfter,
        rateLimitInfo: {
          limit: max,
          windowMs: windowMs,
          windowMinutes: Math.ceil(windowMs / 60000),
          retryAfterSeconds: retryAfter
        }
      });
    }
  });
};

// Stricter rate limiter for login attempts (more sensitive)
const loginLimiter = createAuthLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many login attempts, please try again after 15 minutes.',
});

// More lenient rate limiter for registration (new users)
const registrationLimiter = createAuthLimiter({
  max: 10,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many registration attempts, please try again after 15 minutes.',
});

// Even more lenient for Google sign-in (less prone to abuse)
const googleAuthLimiter = createAuthLimiter({
  max: 20,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many Google sign-in attempts, please try again after 15 minutes.',
});

// General auth limiter for other auth endpoints (email verification, etc.)
const authLimiter = createAuthLimiter({
  max: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});

// Rate limiter for password reset
const passwordResetLimiter = createAuthLimiter({
  max: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many password reset attempts, please try again after an hour.',
  skipSuccessfulRequests: false, // Don't skip successful requests for password reset
});

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  registrationLimiter,
  googleAuthLimiter,
  passwordResetLimiter,
};
