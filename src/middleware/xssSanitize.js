// Custom XSS sanitization middleware compatible with Express 5
// Escapes HTML entities to prevent XSS attacks

const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
};

const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = escapeHtml(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
  return obj;
};

const xssSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

module.exports = xssSanitize;
