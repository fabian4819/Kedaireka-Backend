const { validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Middleware to validate request based on express-validator rules
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }

  next();
};

// Joi validation middleware (alternative validator)
const validateJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(errorMessages, 400));
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

module.exports = {
  validateRequest,
  validateJoi,
};
