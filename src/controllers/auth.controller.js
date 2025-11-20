const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { auth, firestore, admin } = require('../config/firebase');
const { validationResult } = require('express-validator');
const emailService = require('../services/email.service');

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

// Register user with email/password
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists in PostgreSQL
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user in Firebase Auth
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false
    });

    // Create user document in Firestore
    const firestoreUserData = {
      uid: firebaseUser.uid,
      email,
      displayName: name,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      authProvider: 'email',
      role: 'user'
    };

    await firestore.collection('users').doc(firebaseUser.uid).set(firestoreUserData);

    // Create user in PostgreSQL
    const pgUser = await User.create({
      name,
      email,
      password,
      firebase_uid: firebaseUser.uid,
      auth_provider: 'email',
      firebase_metadata: JSON.stringify(firestoreUserData)
    });

    // Generate and send email verification
    try {
      const verificationLink = await auth.generateEmailVerificationLink(email);
      await emailService.sendVerificationEmail(email, name, verificationLink);
      console.log('Email verification sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send email verification:', emailError);
      // Continue with registration even if email verification fails
      // User can request verification later
    }

    const { accessToken, refreshToken } = generateTokens(pgUser.id);

    // Update refresh token in PostgreSQL
    await User.update(pgUser.id, {
      refresh_token: refreshToken,
      last_login: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user: {
          id: pgUser.id,
          name: pgUser.name,
          email: pgUser.email,
          role: pgUser.role,
          isEmailVerified: pgUser.is_email_verified,
          authProvider: 'email'
        },
        tokens: { accessToken, refreshToken }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login with email/password
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check user in PostgreSQL
    const pgUser = await User.findByEmailWithPassword(email);
    if (!pgUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // For email users, verify password
    if (pgUser.auth_provider === 'email' && pgUser.password) {
      const isPasswordValid = await User.matchPassword(password, pgUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // Get Firebase user info to ensure it exists
    let firebaseUser;
    if (pgUser.firebase_uid) {
      try {
        firebaseUser = await auth.getUser(pgUser.firebase_uid);
      } catch (error) {
        console.error('Firebase user not found:', error);
        return res.status(401).json({
          success: false,
          message: 'Authentication failed'
        });
      }
    }

    const { accessToken, refreshToken } = generateTokens(pgUser.id);

    // Update last login and refresh token
    await User.update(pgUser.id, {
      refresh_token: refreshToken,
      last_login: new Date()
    });

    // Update last login in Firestore
    if (firebaseUser) {
      await firestore.collection('users').doc(firebaseUser.uid).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: pgUser.id,
          name: pgUser.name,
          email: pgUser.email,
          role: pgUser.role,
          isEmailVerified: pgUser.is_email_verified,
          photoUrl: pgUser.photo_url,
          authProvider: pgUser.auth_provider
        },
        tokens: { accessToken, refreshToken }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Google Sign-In (using Firebase ID token from client)
const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const firebaseUser = await auth.getUser(decodedToken.uid);

    // Create or update user in PostgreSQL
    const pgUser = await User.findOrCreateFirebaseUser(firebaseUser, 'google');

    // Create or update user in Firestore
    const firestoreUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      authProvider: 'google',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await firestore.collection('users').doc(firebaseUser.uid).set(firestoreUserData, { merge: true });

    const { accessToken, refreshToken } = generateTokens(pgUser.id);

    // Update refresh token in PostgreSQL
    await User.update(pgUser.id, {
      refresh_token: refreshToken,
      last_login: new Date()
    });

    res.json({
      success: true,
      message: 'Google sign-in successful',
      data: {
        user: {
          id: pgUser.id,
          name: pgUser.name,
          email: pgUser.email,
          role: pgUser.role,
          isEmailVerified: pgUser.is_email_verified,
          photoUrl: pgUser.photo_url,
          authProvider: 'google'
        },
        tokens: { accessToken, refreshToken }
      }
    });

  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Google sign-in failed',
      error: error.message
    });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const pgUser = await User.findById(req.user.id);
    if (!pgUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional data from Firestore if user has Firebase UID
    let firestoreData = {};
    if (pgUser.firebase_uid) {
      const firestoreDoc = await firestore.collection('users').doc(pgUser.firebase_uid).get();
      if (firestoreDoc.exists) {
        firestoreData = firestoreDoc.data();
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: pgUser.id,
          name: pgUser.name,
          email: pgUser.email,
          role: pgUser.role,
          isEmailVerified: pgUser.is_email_verified,
          photoUrl: pgUser.photo_url,
          authProvider: pgUser.auth_provider,
          createdAt: pgUser.created_at,
          lastLogin: pgUser.last_login,
          // Include additional Firestore data
          firestoreData
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user in PostgreSQL
    const pgUser = await User.findById(decoded.userId);
    if (!pgUser || pgUser.refresh_token !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(pgUser.id);

    // Update refresh token in PostgreSQL
    await User.update(pgUser.id, { refresh_token: newRefreshToken });

    res.json({
      success: true,
      data: {
        tokens: { accessToken, refreshToken: newRefreshToken }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Clear refresh token in PostgreSQL
    await User.update(req.user.id, { refresh_token: null });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Send email verification
const sendEmailVerification = async (req, res) => {
  try {
    const user = req.user;

    // Generate verification link using Firebase
    const verificationLink = await auth.generateEmailVerificationLink(user.email);

    // Send email using the email service
    const result = await emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationLink
    );

    res.json({
      success: true,
      message: 'Verification email sent successfully',
      data: {
        mode: result.mode,
        note: result.mode === 'development'
          ? 'Please check server logs for verification link'
          : 'Please check your email inbox'
      }
    });

  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};

// Check email verification status
const checkEmailVerification = async (req, res) => {
  try {
    const user = req.user;

    // Check Firebase user to get actual verification status
    const firebaseUser = await auth.getUser(user.firebase_uid);
    const isVerified = firebaseUser.emailVerified;

    // Update PostgreSQL to match Firebase status
    if (user.is_email_verified !== isVerified) {
      await User.update(user.id, { is_email_verified: isVerified });
    }

    res.json({
      success: true,
      data: {
        isEmailVerified: isVerified
      }
    });

  } catch (error) {
    console.error('Check email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email verification status',
      error: error.message
    });
  }
};

// Test email configuration (for development)
const testEmailConfiguration = async (req, res) => {
  try {
    const result = await emailService.testConfiguration();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          configured: true,
          mode: 'production'
        }
      });
    } else {
      res.json({
        success: false,
        message: result.message,
        data: {
          configured: false,
          mode: 'development',
          note: 'Email will be logged to console in development mode'
        }
      });
    }
  } catch (error) {
    console.error('Email configuration test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  googleSignIn,
  getMe,
  refreshToken,
  logout,
  sendEmailVerification,
  checkEmailVerification,
  testEmailConfiguration
};