# Vercel Deployment Guide

## Prerequisites
- Vercel account
- Supabase PostgreSQL database

## Environment Variables Setup

In your Vercel project settings, add the following environment variables:

### Required Variables
```
DATABASE_URL=postgresql://postgres:Cagegeodesiugm@db.bcanqwxmexoodhzxehhb.supabase.co:5432/postgres
NODE_ENV=production
PORT=5000
API_VERSION=v1
```

### JWT Configuration
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this
JWT_REFRESH_EXPIRE=30d
```

### Cookie Configuration
```
COOKIE_EXPIRE=7
```

### CORS Configuration
```
CORS_ORIGIN=https://your-frontend-domain.com
```

### Rate Limiting
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Bcrypt
```
BCRYPT_SALT_ROUNDS=12
```

### Logging
```
LOG_LEVEL=info
```

## Deployment Steps

### 1. Initialize Database Tables (First Time Only)

Before deploying, you need to initialize your Supabase database tables. Run locally:

```bash
npm run init:db
```

Alternatively, you can run the SQL directly in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expire TIMESTAMP,
  reset_password_token VARCHAR(255),
  reset_password_expire TIMESTAMP,
  refresh_token VARCHAR(255),
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

#### Option B: Using Git Integration
1. Push your code to GitHub
2. Import the repository in Vercel dashboard
3. Add environment variables in Vercel project settings
4. Deploy

### 3. Verify Deployment

After deployment, test your endpoints:

```bash
# Health check
curl https://your-app.vercel.app/health

# API root
curl https://your-app.vercel.app/

# API v1
curl https://your-app.vercel.app/api/v1
```

## Important Notes

### Database Connection Pooling
- The app uses connection pooling optimized for serverless
- Maximum 1 connection per serverless function instance
- Connections are reused across invocations (warm starts)

### Cold Starts
- First request may be slower due to database initialization
- Subsequent requests will be faster (warm starts)

### Environment Variables
- Never commit `.env` file to version control
- Always use Vercel environment variables dashboard
- Update `DATABASE_URL` with your actual Supabase credentials

### CORS
- Update `CORS_ORIGIN` to match your frontend domain
- For multiple origins, update the CORS configuration in `src/app.js`

### Rate Limiting
- Adjust rate limits based on your needs
- Current: 100 requests per 15 minutes per IP

## Troubleshooting

### Error: Database connection failed
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check Supabase database is accessible
- Verify SSL settings in database config

### Error: 500 Internal Server Error
- Check Vercel function logs
- Verify all environment variables are set
- Ensure database tables are created

### Error: CORS issues
- Update `CORS_ORIGIN` environment variable
- Check CORS configuration in `src/app.js`

## Project Structure for Vercel

```
├── api/
│   └── index.js          # Vercel serverless function entry point
├── src/
│   ├── app.js            # Express app configuration
│   ├── server.js         # Local development server
│   ├── config/
│   │   └── database.js   # Database connection (serverless-optimized)
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── utils/
├── vercel.json           # Vercel configuration
└── package.json
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL with Vercel](https://vercel.com/guides/using-databases-with-vercel)
