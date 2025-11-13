# Firebase Backend Authentication Setup Guide

## Overview
This guide explains how to set up Firebase Admin SDK for backend authentication that syncs user data between Firebase Authentication and your PostgreSQL database.

## Prerequisites
- Node.js backend project already set up
- Firebase project with Authentication enabled
- PostgreSQL database already configured

## Setup Steps

### 1. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`kedaireka-ugm`)
3. Go to Project Settings → Service accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Place the downloaded JSON file at:
   ```
   src/config/firebase-service-account.json
   ```
7. Update the placeholder values in the file with your actual credentials

### 2. Environment Variables

Add these environment variables to your `.env` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=kedaireka-ugm
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### 3. Database Migration

Run the database migration to update your users table:

```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback a specific migration (if needed)
npm run migrate:rollback 001_add_firebase_fields
```

The migration will automatically:
- Add Firebase-related columns to users table (`firebase_uid`, `auth_provider`, `firebase_metadata`, `photo_url`)
- Make the password field nullable (required for Firebase users)
- Add database indexes for performance
- Create a `migrations` table to track executed migrations

### 4. Enable Authentication Methods

#### Email/Password Authentication
1. In Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" provider

#### Google Sign-In
1. Enable "Google" provider
2. Add your app's SHA-1 fingerprint for Android
3. Configure authorized domains for web

### 5. Backend Server

Start your backend server:

```bash
npm start
```

The authentication endpoints will be available at:
- `POST /api/v1/auth/register` - Register with email/password
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/google` - Google Sign-In
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh-token` - Refresh JWT token
- `GET /api/v1/auth/me` - Get current user profile

### 6. Flutter App Configuration

Update the backend API URL in your Flutter app:

```bash
# Development
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api/v1

# Production
flutter run --dart-define=API_BASE_URL=https://your-backend-url.com/api/v1
```

## Data Flow

### Email/Password Registration
1. User registers via Flutter app
2. Flutter app calls backend `/api/v1/auth/register`
3. Backend creates user in Firebase Auth
4. Backend creates user in PostgreSQL
5. Backend creates user document in Firestore
6. Backend returns JWT tokens to Flutter app

### Google Sign-In
1. User signs in with Google via Flutter app
2. Flutter app gets Google ID token
3. Flutter app sends ID token to backend `/api/v1/auth/google`
4. Backend verifies ID token with Firebase Admin SDK
5. Backend creates/updates user in PostgreSQL
6. Backend creates/updates user document in Firestore
7. Backend returns JWT tokens to Flutter app

### Login
1. User logs in via Flutter app
2. Flutter app calls backend `/api/v1/auth/login`
3. Backend verifies credentials in PostgreSQL
4. Backend validates user exists in Firebase
5. Backend returns JWT tokens to Flutter app

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Token Refresh**: Automatic token refresh for extended sessions
- **Password Security**: bcrypt hashing with 12 salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive input sanitization
- **Email Verification**: Email verification for email/password users
- **Cross-Origin Protection**: CORS configured for your frontend

## Testing

Test the authentication flow:

1. **Register a new user**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john@example.com","password":"password123"}'
   ```

3. **Get User Profile**:
   ```bash
   curl -X GET http://localhost:3000/api/v1/auth/me \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

## Troubleshooting

### Common Issues

1. **"Firebase project ID not found"**
   - Check your Firebase service account JSON file
   - Verify FIREBASE_PROJECT_ID environment variable

2. **"Invalid Firebase ID token"**
   - Ensure Google Sign-In is properly configured
   - Check that client ID matches Firebase configuration

3. **"Database connection failed"**
   - Verify PostgreSQL connection string
   - Ensure database migrations have been run

4. **"CORS errors"**
   - Check backend CORS configuration
   - Ensure API_BASE_URL is correct in Flutter app

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=auth:*
```

This will provide detailed logs for authentication operations.

## Production Considerations

1. **Security**:
   - Use environment variables for all secrets
   - Enable HTTPS in production
   - Set appropriate CORS policies

2. **Scaling**:
   - Consider Redis for session storage
   - Implement database connection pooling
   - Add monitoring and logging

3. **Performance**:
   - Cache frequently accessed user data
   - Optimize database queries
   - Implement pagination for user lists

## Support

If you encounter issues:
1. Check Firebase Console for project configuration
2. Review backend server logs
3. Verify database schema and migrations
4. Test endpoints with Postman or curl