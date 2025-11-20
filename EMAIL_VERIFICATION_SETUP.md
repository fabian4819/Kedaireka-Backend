# Email Verification Setup Guide

## Overview
The email verification system is now fully functional with both development and production modes. This guide explains how it works and how to configure it.

## How It Works

### 1. Registration Flow
- When a user registers, the system generates a Firebase email verification link
- The link is sent using the configured email service
- User clicks the link to verify their email with Firebase
- The system syncs verification status with PostgreSQL

### 2. Manual Verification Request
- Authenticated users can request verification emails via `/api/v1/auth/send-verification`
- The system generates a new verification link and sends it
- Users can check verification status via `/api/v1/auth/check-verification`

## Configuration Options

### Development Mode (Default)
If email credentials are not configured, the system will:
- Log verification links to the console
- Show formatted output for easy copying
- Return development mode responses to the frontend

### Production Mode
Configure email credentials in your `.env` file:

```bash
# Email Configuration (Required for email verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Pix2Land
```

## Email Service Setup

### Gmail Setup (Recommended for Development)
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password as `EMAIL_PASS` in your `.env` file

### Alternative Email Services

#### Outlook/Hotmail
```bash
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### Yahoo Mail
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

#### SendGrid
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

## Testing

### Test Email Configuration
```bash
GET /api/v1/auth/test-email
```

This endpoint returns:
- Whether email is configured
- Current mode (development/production)
- Configuration status

### Development Mode Testing
1. Register a new user
2. Check the server console for the verification link
3. Copy the link and paste it in your browser
4. Complete verification with Firebase

### Production Mode Testing
1. Configure email credentials
2. Register a new user
3. Check your email inbox
4. Click the verification link

## Frontend Integration

The Flutter frontend will:
1. Show appropriate messages based on email mode
2. Allow users to resend verification emails
3. Check verification status periodically
4. Navigate appropriately after verification

## Security Features

### Firebase Integration
- Uses Firebase Auth for secure email verification
- Verification links expire automatically (Firebase handles this)
- Secure token-based verification process

### Rate Limiting
- Separate rate limits for email sending
- Prevents email spam and abuse
- Configurable limits per endpoint

### Error Handling
- Graceful fallback to development mode
- Detailed error logging
- User-friendly error messages

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check email configuration in `.env`
   - Verify email credentials and permissions
   - Test with `/api/v1/auth/test-email`

2. **Verification not working**
   - Ensure Firebase is properly configured
   - Check that the user exists in Firebase Auth
   - Verify email verification is enabled in Firebase

3. **Development mode not working**
   - Check server console for verification links
   - Ensure logs are not being filtered out
   - Verify the link format is correct

### Debug Mode
The system provides detailed logging for:
- Email generation attempts
- Email sending status
- Firebase verification status
- Database synchronization

## Production Deployment

For production deployment:

1. **Configure Email Service**
   - Set up production email service (SendGrid, AWS SES, etc.)
   - Configure proper SPF/DKIM records
   - Test deliverability

2. **Environment Variables**
   ```bash
   NODE_ENV=production
   EMAIL_HOST=your-production-smtp
   EMAIL_USER=your-production-email
   EMAIL_PASS=your-production-password
   ```

3. **Firebase Settings**
   - Configure email templates in Firebase Console
   - Set up custom domains for verification links
   - Configure email localization if needed

## API Endpoints

### Authentication Routes
- `POST /api/v1/auth/register` - Register with email verification
- `POST /api/v1/auth/send-verification` - Request verification email
- `GET /api/v1/auth/check-verification` - Check verification status
- `GET /api/v1/auth/test-email` - Test email configuration

### Response Formats

#### Development Mode Response
```json
{
  "success": true,
  "data": {
    "mode": "development",
    "note": "Please check server logs for verification link"
  }
}
```

#### Production Mode Response
```json
{
  "success": true,
  "data": {
    "mode": "production",
    "note": "Please check your email inbox"
  }
}
```

## Support

For issues with email verification:
1. Check server logs for detailed error messages
2. Verify email configuration with the test endpoint
3. Ensure Firebase Auth is properly configured
4. Review rate limiting settings if emails are blocked