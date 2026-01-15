# 📅 Day 3: Backend Foundation

**Duration:** 6-8 hours  
**Goal:** Build the Node.js backend with Express, MongoDB, and authentication

---

## 🎯 What You'll Accomplish Today

By the end of Day 3, you will have:
- ✅ Express server with middleware
- ✅ MongoDB connection with Mongoose
- ✅ User, Job, Application, and Company models
- ✅ Authentication system with JWT
- ✅ Working login and register endpoints
- ✅ Protected route middleware

---

## 📚 Table of Contents

1. [Understanding Backend Concepts](#1-understanding-backend-concepts)
2. [Project Structure Setup](#2-project-structure-setup)
3. [Creating MongoDB Models](#3-creating-mongodb-models)
4. [Setting Up Express Server](#4-setting-up-express-server)
5. [Building Authentication Routes](#5-building-authentication-routes)
6. [Creating Auth Middleware](#6-creating-auth-middleware)
7. [Building Jobs Routes](#7-building-jobs-routes)
8. [Building Applications Routes](#8-building-applications-routes)
9. [Testing Your API](#9-testing-your-api)
10. [Connecting Frontend to Backend](#10-connecting-frontend-to-backend)

---

## 1. Understanding Backend Concepts

### 🏗️ Backend Architecture

```
Client Request → Express Server → Route Handler → Controller → Database
                      ↓
                 Middleware
                 (CORS, Auth, JSON parsing)
```

### 🔑 Key Concepts

| Concept | What It Is | Example |
|---------|------------|---------|
| **Express** | Web framework for Node.js | Handles HTTP requests |
| **Mongoose** | MongoDB ODM (Object Document Mapper) | Defines data schemas |
| **JWT** | JSON Web Token | Secures API endpoints |
| **Middleware** | Functions that run before route handlers | Auth check, logging |
| **Routes** | URL endpoints | `/api/auth/login` |
| **Models** | Database schemas | User, Job, Application |

### 🔐 Authentication Flow

```
1. User registers → Password hashed → Saved to DB → JWT returned
2. User logs in → Password verified → JWT returned
3. User accesses protected route → JWT verified → Access granted
```

---

## 2. Project Structure Setup

### 2.1 Create Folder Structure

```bash
cd backend

# Create folders
mkdir -p models routes middleware services

# Your structure:
# backend/
# ├── models/          # Database schemas
# ├── routes/          # API endpoints
# ├── middleware/      # Auth, validation
# ├── services/        # Business logic
# ├── server.js        # Entry point
# └── .env             # Environment variables
```

### 2.2 Verify Dependencies

Make sure you have all dependencies:

```bash
npm install express mongoose dotenv cors jsonwebtoken bcryptjs multer axios
npm install -D nodemon
```

---

## 3. Creating MongoDB Models

### 3.1 User Model

Create `models/User.js`:

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the user schema
const userSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Role: 'user' for job seekers, 'hirer' for recruiters
  role: {
    type: String,
    enum: ['user', 'hirer'],
    default: 'user'
  },
  
  // Profile information
  phone: {
    type: String,
    trim: true
  },
  
  location: {
    type: String,
    trim: true
  },
  
  bio: {
    type: String,
    maxLength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Resume data (parsed from PDF)
  resumeId: {
    type: String,
    default: null
  },
  
  resumeData: {
    type: mongoose.Schema.Types.Mixed, // Flexible JSON structure
    default: null
  },
  
  resumeText: {
    type: String,
    default: null
  },
  
  // For recruiters - associated company
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  
  // Profile picture URL
  profilePicture: {
    type: String,
    default: null
  },
  
  // Skills array
  skills: [{
    type: String,
    trim: true
  }],

}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Pre-save middleware: Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password was modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method: Compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method: Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Create and export the model
module.exports = mongoose.model('User', userSchema);
```

### 3.2 Job Model

Create `models/Job.js`:

```javascript
// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Basic job information
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  
  // Requirements
  requirements: [{
    type: String,
    trim: true
  }],
  
  // Skills required
  skills: [{
    type: String,
    trim: true
  }],
  
  // Job type and mode
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance'],
    default: 'Full-time'
  },
  
  jobMode: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    default: 'On-site'
  },
  
  isInternship: {
    type: Boolean,
    default: false
  },
  
  // Location
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  
  // Salary range
  salaryMin: {
    type: Number,
    default: null
  },
  
  salaryMax: {
    type: Number,
    default: null
  },
  
  salaryCurrency: {
    type: String,
    default: 'INR'
  },
  
  // Experience required
  experienceMin: {
    type: Number,
    default: 0
  },
  
  experienceMax: {
    type: Number,
    default: null
  },
  
  // Application deadline
  deadline: {
    type: Date,
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  
  // Company logo URL
  companyLogo: {
    type: String,
    default: null
  },
  
  // Posted by (recruiter)
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Associated company
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  
  // Application count
  applicationsCount: {
    type: Number,
    default: 0
  },
  
  // External apply URL (if applicable)
  applyUrl: {
    type: String,
    default: null
  },

}, {
  timestamps: true
});

// Index for text search
jobSchema.index({ 
  title: 'text', 
  company: 'text', 
  description: 'text',
  skills: 'text'
});

// Index for filtering
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ company: 1 });
jobSchema.index({ location: 1 });

module.exports = mongoose.model('Job', jobSchema);
```

### 3.3 Application Model

Create `models/Application.js`:

```javascript
// models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  
  // Application status
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  
  // Cover letter
  coverLetter: {
    type: String,
    default: null
  },
  
  // Resume snapshot at time of application
  resumeSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // AI-generated fit score
  fitScore: {
    type: Number,
    default: null
  },
  
  // AI fit score breakdown
  fitScoreBreakdown: {
    skillsMatch: { type: Number, default: null },
    experienceMatch: { type: Number, default: null },
    educationMatch: { type: Number, default: null },
    overallFit: { type: Number, default: null }
  },
  
  // AI recommendation for recruiter
  aiRecommendation: {
    type: String,
    default: null
  },
  
  // Notes from recruiter
  recruiterNotes: {
    type: String,
    default: null
  },
  
  // Interview scheduled
  interviewDate: {
    type: Date,
    default: null
  },
  
  // When status was last updated
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },

}, {
  timestamps: true
});

// Compound index to ensure user can only apply once per job
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Index for queries
applicationSchema.index({ jobId: 1, status: 1 });
applicationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
```

### 3.4 Company Model

Create `models/Company.js`:

```javascript
// models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  // Basic information
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true
  },
  
  description: {
    type: String,
    default: null
  },
  
  // Company details
  website: {
    type: String,
    default: null
  },
  
  logo: {
    type: String,
    default: null
  },
  
  industry: {
    type: String,
    default: null
  },
  
  size: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001+'],
    default: null
  },
  
  founded: {
    type: Number,
    default: null
  },
  
  headquarters: {
    type: String,
    default: null
  },
  
  // Social links
  linkedin: {
    type: String,
    default: null
  },
  
  twitter: {
    type: String,
    default: null
  },
  
  // Created by (first recruiter)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Verified status
  isVerified: {
    type: Boolean,
    default: false
  },

}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
```

### 3.5 UserJobMatch Model (for caching AI scores)

Create `models/UserJobMatch.js`:

```javascript
// models/UserJobMatch.js
const mongoose = require('mongoose');

// This model caches AI fit scores to avoid recalculating
const userJobMatchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  
  // Overall fit score (0-100)
  fitScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Score breakdown
  breakdown: {
    skillsMatch: { type: Number, default: 0 },
    experienceMatch: { type: Number, default: 0 },
    educationMatch: { type: Number, default: 0 },
    overallFit: { type: Number, default: 0 }
  },
  
  // AI recommendation
  recommendation: {
    type: String,
    default: null
  },
  
  // Resume hash to detect if resume changed
  resumeHash: {
    type: String,
    default: null
  },
  
  // Calculated at
  calculatedAt: {
    type: Date,
    default: Date.now
  },

}, {
  timestamps: true
});

// Compound index - one score per user-job pair
userJobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Index for quick lookups
userJobMatchSchema.index({ userId: 1, fitScore: -1 });

module.exports = mongoose.model('UserJobMatch', userJobMatchSchema);
```

---

## 4. Setting Up Express Server

### 4.1 Create Main Server File

Edit `server.js`:

```javascript
// server.js
// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Create Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS for frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is running!',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================
// ROUTES (will add more in sections below)
// ============================================

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    
    // Start server after DB connection
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
```

---

## 5. Building Authentication Routes

### 5.1 Create Auth Routes

Create `routes/auth.js`:

```javascript
// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

// ============================================
// REGISTER - POST /api/auth/register
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'user'
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return user data (without password) and token
    res.status(201).json({
      message: 'Registration successful',
      user: user.getPublicProfile(),
      token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// LOGIN - POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return user data and token
    res.json({
      message: 'Login successful',
      user: user.getPublicProfile(),
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// GET CURRENT USER - GET /api/auth/me
// ============================================
router.get('/me', auth, async (req, res) => {
  try {
    // User is attached to request by auth middleware
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: user.getPublicProfile() });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// UPDATE PROFILE - PUT /api/auth/profile
// ============================================
router.put('/profile', auth, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'phone', 'location', 'bio', 'skills'];
    const updates = {};
    
    // Only include allowed fields
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      message: 'Profile updated',
      user: user.getPublicProfile()
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ============================================
// CHANGE PASSWORD - PUT /api/auth/password
// ============================================
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
```

---

## 6. Creating Auth Middleware

### 6.1 Create Auth Middleware

Create `middleware/auth.js`:

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user) {
      req.user = user;
      req.token = token;
    }
    
    next();
    
  } catch (error) {
    // Token invalid but continue anyway
    next();
  }
};

/**
 * Role-based authorization
 * Usage: requireRole('hirer') or requireRole('user', 'hirer')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
  };
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.requireRole = requireRole;
```

---

## 7. Building Jobs Routes

Create `routes/jobs.js`:

```javascript
// routes/jobs.js
const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const { optionalAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET ALL JOBS - GET /api/jobs
// ============================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      jobMode,
      experience,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { status: 'active' };
    
    // Text search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    // Job type filter
    if (jobType) {
      query.jobType = jobType;
    }
    
    // Job mode filter
    if (jobMode) {
      query.jobMode = jobMode;
    }
    
    // Experience filter
    if (experience) {
      const expYears = parseInt(experience);
      query.experienceMin = { $lte: expYears };
      query.$or = [
        { experienceMax: { $gte: expYears } },
        { experienceMax: null }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute query
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('postedBy', 'name email')
        .lean(),
      Job.countDocuments(query)
    ]);
    
    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ============================================
// GET SINGLE JOB - GET /api/jobs/:id
// ============================================
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('companyId');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
    
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// ============================================
// CREATE JOB - POST /api/jobs
// (Recruiters only)
// ============================================
router.post('/', auth, requireRole('hirer'), async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user._id,
      companyId: req.user.companyId
    };
    
    const job = new Job(jobData);
    await job.save();
    
    res.status(201).json({
      message: 'Job posted successfully',
      job
    });
    
  } catch (error) {
    console.error('Create job error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// ============================================
// UPDATE JOB - PUT /api/jobs/:id
// (Job owner only)
// ============================================
router.put('/:id', auth, requireRole('hirer'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check ownership
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }
    
    // Update job
    Object.assign(job, req.body);
    await job.save();
    
    res.json({
      message: 'Job updated',
      job
    });
    
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// ============================================
// DELETE JOB - DELETE /api/jobs/:id
// (Job owner only)
// ============================================
router.delete('/:id', auth, requireRole('hirer'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check ownership
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }
    
    await job.deleteOne();
    
    res.json({ message: 'Job deleted' });
    
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// ============================================
// GET RECRUITER'S JOBS - GET /api/jobs/my/list
// ============================================
router.get('/my/list', auth, requireRole('hirer'), async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(jobs);
    
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

module.exports = router;
```

---

## 8. Building Applications Routes

Create `routes/applications.js`:

```javascript
// routes/applications.js
const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// ============================================
// APPLY TO JOB - POST /api/applications
// ============================================
router.post('/', auth, async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if already applied
    const existingApplication = await Application.findOne({
      userId: req.user._id,
      jobId
    });
    
    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }
    
    // Create application
    const application = new Application({
      userId: req.user._id,
      jobId,
      coverLetter,
      resumeSnapshot: req.user.resumeData // Save current resume state
    });
    
    await application.save();
    
    // Increment application count on job
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });
    
    res.status(201).json({
      message: 'Application submitted',
      application
    });
    
  } catch (error) {
    console.error('Apply error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }
    
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ============================================
// GET MY APPLICATIONS - GET /api/applications/my
// ============================================
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(applications);
    
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ============================================
// GET APPLICATIONS FOR JOB - GET /api/applications/job/:jobId
// (Recruiters only)
// ============================================
router.get('/job/:jobId', auth, requireRole('hirer'), async (req, res) => {
  try {
    // Verify job ownership
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get applications
    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('userId', 'name email phone resumeData')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(applications);
    
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ============================================
// UPDATE APPLICATION STATUS - PUT /api/applications/:id/status
// (Recruiters only)
// ============================================
router.put('/:id/status', auth, requireRole('hirer'), async (req, res) => {
  try {
    const { status, recruiterNotes } = req.body;
    
    const application = await Application.findById(req.params.id)
      .populate('jobId');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Verify ownership of the job
    if (application.jobId.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Update status
    application.status = status;
    application.statusUpdatedAt = new Date();
    
    if (recruiterNotes) {
      application.recruiterNotes = recruiterNotes;
    }
    
    await application.save();
    
    res.json({
      message: 'Application status updated',
      application
    });
    
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ============================================
// WITHDRAW APPLICATION - DELETE /api/applications/:id
// ============================================
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Verify ownership
    if (application.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Decrement application count
    await Job.findByIdAndUpdate(application.jobId, { $inc: { applicationsCount: -1 } });
    
    await application.deleteOne();
    
    res.json({ message: 'Application withdrawn' });
    
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ error: 'Failed to withdraw application' });
  }
});

module.exports = router;
```

---

## 9. Testing Your API

### 9.1 Start the Server

```bash
cd backend
npm run dev
```

### 9.2 Test with cURL

**Test Health Check:**
```bash
curl http://localhost:8080/api/health
```

**Test Registration:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Test Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Test Protected Route (use token from login):**
```bash
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 9.3 Verification Checklist

| Endpoint | Test | Status |
|----------|------|--------|
| GET /api/health | Returns ok | ⬜ |
| POST /api/auth/register | Creates user, returns token | ⬜ |
| POST /api/auth/login | Returns token for valid credentials | ⬜ |
| GET /api/auth/me | Returns user when authenticated | ⬜ |
| GET /api/jobs | Returns empty array | ⬜ |

---

## 10. Connecting Frontend to Backend

### 10.1 Update Frontend .env

Make sure `frontend/.env` has:

```env
VITE_API_URL=http://localhost:8080/api
```

### 10.2 Test Full Flow

1. Start Backend: `cd backend && npm run dev`
2. Start Frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173
4. Click "Register"
5. Fill form and submit
6. Should redirect to dashboard (or show success)

### 10.3 Check Browser Console

- Open DevTools (F12)
- Check Network tab for API calls
- Check Console for errors

---

## 🎉 Day 3 Complete!

You have successfully built:
- ✅ MongoDB models (User, Job, Application, Company, UserJobMatch)
- ✅ Express server with middleware
- ✅ Authentication system with JWT
- ✅ Auth middleware for protected routes
- ✅ Jobs and Applications CRUD APIs
- ✅ Connected frontend to backend

---

## 📖 What's Next?

Tomorrow in **Day 4**, you'll build the AI Foundation:
- Python FastAPI server
- OpenAI integration
- Resume PDF parsing
- Vector database (Qdrant)

👉 **Continue to [Day 4: AI Foundation](./day4-ai-foundation.md)**

