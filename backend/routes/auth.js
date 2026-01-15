/**
 * ===================================================================================
 *                    AUTHENTICATION ROUTES - Login & Register
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles user authentication: registration and login.
 * It uses JWT (JSON Web Tokens) for stateless authentication.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Register: Creates new user, hashes password, generates JWT token
 * 2. Login: Verifies credentials, generates JWT token
 * 3. Get Current User: Returns user info from JWT token (protected route)
 * 
 * 📌 SECURITY:
 * ------------
 * - Passwords are hashed using bcrypt (in User model)
 * - JWT tokens expire in 7 days
 * - Tokens are signed with JWT_SECRET from environment variables
 * 
 * ===================================================================================
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * =============================================================================
 *                     REGISTER ENDPOINT
 * =============================================================================
 * 
 * 📖 WHAT IT DOES:
 * ----------------
 * Creates a new user account in the database.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Validates input (name, email, password)
 * 2. Checks if user already exists
 * 3. Creates new User document with hashed password
 * 4. Generates JWT token (expires in 7 days)
 * 5. Returns token and user info
 * 
 * 📌 REQUEST BODY:
 * ---------------
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "password123",
 *   "role": "user" (optional, defaults to "user")
 * }
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "user_id",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user",
 *     "profile": { ... }
 *   }
 * }
 * 
 * =============================================================================
 */
// Register endpoint - POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'hirer']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Validate all required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create user with all required data
    const user = new User({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password, 
      role: role || 'user',
      profile: {
        completion: 0,
        achievements: 0,
        education: 0,
        experience: 0,
        certificates: 0,
        skills: 0,
        resume: 0,
        socialMedia: 0
      },
      performance: {
        jobProfileScore: 0,
        opportunitiesApplied: 0,
        shortlisted: 0,
        rejected: 0
      },
      hasInternship: false,
      resumeId: null,
      resumeData: null
    });
    
    // Save user to database
    await user.save();
    
    // Verify user was saved
    const savedUser = await User.findById(user._id);
    if (!savedUser) {
      return res.status(500).json({ error: 'Failed to save user data. Please try again.' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * =============================================================================
 *                     LOGIN ENDPOINT
 * =============================================================================
 * 
 * 📖 WHAT IT DOES:
 * ----------------
 * Authenticates an existing user and returns a JWT token.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Validates input (email, password)
 * 2. Finds user in database by email
 * 3. Compares password using bcrypt (in User model)
 * 4. If match → Generate JWT token
 * 5. Returns token and user info
 * 
 * 📌 REQUEST BODY:
 * ---------------
 * {
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "user_id",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user",
 *     "profile": { ... },
 *     "performance": { ... },
 *     "hasInternship": false,
 *     "resumeId": null,
 *     "resumeData": null
 *   }
 * }
 * 
 * ⚠️ ERROR RESPONSES:
 * ------------------
 * - 400: Validation errors (invalid email format, etc.)
 * - 401: Invalid credentials (user not found or wrong password)
 * - 500: Server error
 * 
 * =============================================================================
 */
// Login endpoint - POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Validate email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user - strict validation: user must exist in database
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    // Validate user has required data
    if (!user.name || !user.email) {
      return res.status(401).json({ error: 'Invalid user data. Please register again.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        performance: user.performance,
        hasInternship: user.hasInternship,
        resumeId: user.resumeId,
        resumeData: user.resumeData
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * =============================================================================
 *                     GET CURRENT USER ENDPOINT
 * =============================================================================
 * 
 * 📖 WHAT IT DOES:
 * ----------------
 * Returns the current authenticated user's information.
 * This is a PROTECTED route - requires valid JWT token.
 * 
 * 🔗 FLOW:
 * --------
 * 1. auth middleware verifies JWT token
 * 2. If valid → attaches user to req.user
 * 3. Returns user information
 * 
 * 📌 REQUEST HEADERS:
 * -------------------
 * Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "user": {
 *     "id": "user_id",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "role": "user",
 *     "profile": { ... },
 *     "performance": { ... },
 *     "hasInternship": false,
 *     "resumeId": null
 *   }
 * }
 * 
 * ⚠️ ERROR RESPONSES:
 * ------------------
 * - 401: No token provided or invalid token
 * - 500: Server error
 * 
 * =============================================================================
 */
// Get current user endpoint - GET /api/auth/me (Protected route)
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profile: req.user.profile,
        performance: req.user.performance,
        hasInternship: req.user.hasInternship,
        resumeId: req.user.resumeId
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

