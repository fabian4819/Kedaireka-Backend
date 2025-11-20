const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      // Check if email configuration is available
      if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT || 587,
          secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        this.isConfigured = true;
        console.log('Email service configured successfully');
      } else {
        console.log('Email service not configured - using development mode');
        this.isConfigured = false;
      }
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendVerificationEmail(email, name, verificationLink) {
    try {
      if (!this.isConfigured) {
        // Development mode: log the link
        console.log('='.repeat(60));
        console.log('📧 EMAIL VERIFICATION (Development Mode)');
        console.log('='.repeat(60));
        console.log(`To: ${email} (${name})`);
        console.log(`Subject: Verify your Pix2Land account`);
        console.log(`Verification Link: ${verificationLink}`);
        console.log('='.repeat(60));
        console.log('👆 Copy the link above and paste it in your browser');
        console.log('='.repeat(60));

        return {
          success: true,
          mode: 'development',
          message: 'Verification link logged to console (development mode)',
          verificationLink
        };
      }

      const htmlContent = await this.generateVerificationEmailTemplate(name, verificationLink);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Pix2Land'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your Pix2Land account',
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);

      return {
        success: true,
        mode: 'production',
        messageId: info.messageId,
        message: 'Verification email sent successfully'
      };

    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async generateVerificationEmailTemplate(name, verificationLink) {
    const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your Pix2Land account</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4CAF50;
            margin-bottom: 10px;
        }
        .button {
            display: inline-block;
            background-color: #4CAF50;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #45a049;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .security-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌍 Pix2Land</div>
            <h1>Verify your account</h1>
        </div>

        <p>Hi ${name},</p>

        <p>Thank you for registering with Pix2Land! To complete your registration and activate your account, please click the button below to verify your email address.</p>

        <div style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
        </div>

        <div class="security-note">
            <strong>Security Notice:</strong> This verification link will expire in 24 hours for your security. If you didn't create an account with Pix2Land, you can safely ignore this email.
        </div>

        <p>If the button above doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4CAF50; font-size: 12px;">${verificationLink}</p>

        <div class="footer">
            <p>This is an automated message from Pix2Land. Please do not reply to this email.</p>
            <p>© 2024 Pix2Land. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    return template;
  }

  async sendPasswordResetEmail(email, name, resetLink) {
    try {
      if (!this.isConfigured) {
        // Development mode: log the link
        console.log('='.repeat(60));
        console.log('🔐 PASSWORD RESET (Development Mode)');
        console.log('='.repeat(60));
        console.log(`To: ${email} (${name})`);
        console.log(`Subject: Reset your Pix2Land password`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('='.repeat(60));
        console.log('👆 Copy the link above and paste it in your browser');
        console.log('='.repeat(60));

        return {
          success: true,
          mode: 'development',
          message: 'Password reset link logged to console (development mode)',
          resetLink
        };
      }

      const htmlContent = await this.generatePasswordResetEmailTemplate(name, resetLink);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Pix2Land'}" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset your Pix2Land password',
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);

      return {
        success: true,
        mode: 'production',
        messageId: info.messageId,
        message: 'Password reset email sent successfully'
      };

    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async generatePasswordResetEmailTemplate(name, resetLink) {
    const template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your Pix2Land password</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #ff6b6b;
            margin-bottom: 10px;
        }
        .button {
            display: inline-block;
            background-color: #ff6b6b;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #ff5252;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .security-note {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🔐 Pix2Land</div>
            <h1>Reset your password</h1>
        </div>

        <p>Hi ${name},</p>

        <p>We received a request to reset your password for your Pix2Land account. Click the button below to set a new password.</p>

        <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
        </div>

        <div class="security-note">
            <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </div>

        <p>If the button above doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #ff6b6b; font-size: 12px;">${resetLink}</p>

        <div class="footer">
            <p>This is an automated message from Pix2Land. Please do not reply to this email.</p>
            <p>© 2024 Pix2Land. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    return template;
  }

  // Test email configuration
  async testConfiguration() {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Email service not configured'
      };
    }

    try {
      await this.transporter.verify();
      return {
        success: true,
        message: 'Email service is working correctly'
      };
    } catch (error) {
      return {
        success: false,
        message: `Email service test failed: ${error.message}`
      };
    }
  }
}

module.exports = new EmailService();