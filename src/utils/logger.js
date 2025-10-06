const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(winston.format.colorize(), format),
  }),
  // Error logs
  new winston.transports.File({
    filename: path.join('logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(winston.format.uncolorize(), format),
  }),
  // All logs
  new winston.transports.File({
    filename: path.join('logs', 'all.log'),
    format: winston.format.combine(winston.format.uncolorize(), format),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});

module.exports = logger;
