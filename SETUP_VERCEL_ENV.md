# Setting Up Environment Variables in Vercel

## The Problem
You're getting this error:
```
{"success":false,"error":"Internal Server Error","message":"getaddrinfo ENOTFOUND db.bcanqwxmexoodhzxehhb.supabase.co"}
```

This means **Vercel doesn't have access to your environment variables**, specifically `DATABASE_URL`.

## Solution: Add Environment Variables to Vercel

### Method 1: Using Vercel Dashboard (Recommended)

1. **Go to your Vercel project**
   - Visit https://vercel.com/dashboard
   - Click on your project: `kedaireka-backend`

2. **Navigate to Settings**
   - Click on the "Settings" tab at the top

3. **Go to Environment Variables**
   - Click on "Environment Variables" in the left sidebar

4. **Add Each Variable**
   For each variable below, click "Add New" and enter:
   - **Name**: The variable name (e.g., `DATABASE_URL`)
   - **Value**: The variable value (copy from your `.env` file)
   - **Environment**: Select `Production`, `Preview`, and `Development` (check all three)

### Required Environment Variables

Copy these values from your `.env` file:

```bash
# Database (REQUIRED - Most Important!)
DATABASE_URL=postgresql://postgres:Cagegeodesiugm@db.bcanqwxmexoodhzxehhb.supabase.co:5432/postgres

# Server
NODE_ENV=production
PORT=5000
API_VERSION=v1

# JWT (IMPORTANT - Change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this
JWT_REFRESH_EXPIRE=30d

# Cookie
COOKIE_EXPIRE=7

# CORS (Update with your frontend URL)
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=info
```

5. **Save and Redeploy**
   - After adding all variables, Vercel will automatically redeploy
   - OR manually trigger a redeploy by going to "Deployments" → Click ⋯ on latest deployment → "Redeploy"

---

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Login
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add DATABASE_URL production
# When prompted, paste: postgresql://postgres:Cagegeodesiugm@db.bcanqwxmexoodhzxehhb.supabase.co:5432/postgres

vercel env add JWT_SECRET production
# When prompted, paste: your-super-secret-jwt-key-change-this-in-production

# ... repeat for all variables above

# Redeploy
vercel --prod
```

---

## Quick Checklist

- [ ] DATABASE_URL is set in Vercel
- [ ] JWT_SECRET is set in Vercel
- [ ] JWT_REFRESH_SECRET is set in Vercel
- [ ] CORS_ORIGIN is updated to your frontend domain
- [ ] All environment variables are set for Production, Preview, and Development
- [ ] Redeployed after adding variables

---

## Verification Steps

After setting environment variables and redeploying:

1. **Check deployment logs**
   - Go to your project in Vercel
   - Click "Deployments"
   - Click on the latest deployment
   - Look for any errors

2. **Test the endpoints**
   ```bash
   # Health check
   curl https://kedaireka-backend.vercel.app/health

   # Should return:
   # {"success":true,"message":"Server is healthy","timestamp":"..."}
   ```

3. **If still getting errors**
   - Check Vercel function logs (Deployments → Click deployment → Functions tab)
   - Verify DATABASE_URL is correct
   - Make sure Supabase database is accessible

---

## Important Notes

### Security
⚠️ **CHANGE THESE BEFORE PRODUCTION:**
- `JWT_SECRET` - Use a strong random string (at least 32 characters)
- `JWT_REFRESH_SECRET` - Use a different strong random string

Generate secure secrets:
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### CORS
Update `CORS_ORIGIN` with your actual frontend URL:
- Development: `http://localhost:3000`
- Production: `https://your-frontend.vercel.app`

### Database
Make sure your Supabase database:
- Is accessible from the internet
- Has the `users` table created (run `npm run init:db` locally)
- Connection pooling is enabled (we already configured this)

---

## Troubleshooting

### Error: "getaddrinfo ENOTFOUND"
- DATABASE_URL is not set in Vercel
- Solution: Add DATABASE_URL in Vercel environment variables

### Error: "Database pool not initialized"
- Database connection failed
- Check DATABASE_URL is correct
- Verify Supabase database is running

### Error: "CORS error"
- CORS_ORIGIN doesn't match your frontend
- Update CORS_ORIGIN environment variable

### Still not working?
1. Check Vercel function logs
2. Verify all environment variables are set
3. Make sure you redeployed after adding variables
4. Test database connection from local machine with same URL

---

## After Setup

Once environment variables are configured and working:

1. Test all endpoints:
   ```bash
   curl https://kedaireka-backend.vercel.app/
   curl https://kedaireka-backend.vercel.app/health
   curl https://kedaireka-backend.vercel.app/api/v1
   ```

2. Monitor logs in Vercel dashboard for any issues

3. Update this README with any project-specific notes
