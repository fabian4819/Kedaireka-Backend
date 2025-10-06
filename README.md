# Backend KedaiReka

A highly secure Express.js backend API built with enterprise-grade security features.

## Features

### Security Features
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents brute force and DDoS attacks
  - General API: 100 requests per 15 minutes
  - Auth endpoints: 5 requests per 15 minutes
  - Password reset: 3 requests per hour
- **Input Sanitization**: Protection against XSS and NoSQL injection
- **HPP**: HTTP parameter pollution prevention
- **bcrypt**: Password hashing with configurable salt rounds
- **JWT**: Token-based authentication with refresh tokens
- **Request Validation**: Schema-based validation with express-validator and Joi
- **Error Handling**: Secure error responses without data leakage
- **Logging**: Winston-based logging for security audits

### Additional Features
- MongoDB integration with Mongoose
- Compression middleware
- Cookie-based authentication support
- Environment-based configuration
- Development and production modes
- Code quality with ESLint and Prettier

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` and update the following critical values:
- `JWT_SECRET` - Strong secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Strong secret key for refresh tokens
- `MONGODB_URI` - MongoDB connection string
- `CORS_ORIGIN` - Allowed origin for CORS

4. Start the development server
```bash
npm run dev
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.js  # Database connection
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js      # Authentication middleware
│   │   ├── errorHandler.js  # Error handling
│   │   ├── rateLimiter.js   # Rate limiting configs
│   │   └── validateRequest.js # Request validation
│   ├── models/          # Database models
│   │   └── User.model.js
│   ├── routes/          # API routes
│   │   ├── index.js
│   │   └── auth.routes.js
│   ├── utils/           # Utility functions
│   │   └── logger.js    # Winston logger
│   ├── validators/      # Request validators
│   │   └── auth.validator.js
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── logs/                # Application logs
├── tests/               # Test files
├── .env.example         # Environment template
├── .gitignore
├── eslint.config.js
├── .prettierrc
└── package.json
```

## Environment Variables

See `.env.example` for all available configuration options.

### Critical Security Variables
- `JWT_SECRET` - Must be changed in production
- `JWT_REFRESH_SECRET` - Must be changed in production
- `BCRYPT_SALT_ROUNDS` - Default: 12 (higher = more secure but slower)
- `NODE_ENV` - Set to 'production' in production

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API v1
- `GET /api/v1` - API information

### Authentication (Example structure in auth.routes.js)
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `PUT /api/v1/auth/reset-password/:token` - Reset password
- `GET /api/v1/auth/me` - Get current user (protected)

## Security Best Practices

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Change default JWT secrets** - Use strong, random strings
3. **Use HTTPS in production** - Always encrypt traffic
4. **Keep dependencies updated** - Regularly run `npm audit`
5. **Review logs regularly** - Check for suspicious activity
6. **Implement proper CORS** - Only allow trusted origins
7. **Use strong password policies** - Enforced by validators
8. **Implement proper logging** - All sensitive operations logged

## License

ISC
