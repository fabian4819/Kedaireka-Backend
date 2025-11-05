// Custom SQL sanitization middleware compatible with Express 5
// Removes any keys that start with '$' or contain '.' to prevent injection attacks
// Note: PostgreSQL parameterized queries ($1, $2, etc.) provide primary SQL injection protection

const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitize(obj[key]);
      }
    }
  }
  return obj;
};

const sqlSanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  next();
};

module.exports = sqlSanitize;
