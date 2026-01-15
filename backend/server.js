/**
 * ===================================================================================
 *                    SERVER.JS - Express Server Entry Point
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This is the MAIN SERVER FILE for the Job Portal backend.
 * It sets up Express server, connects to MongoDB, and configures all routes.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Creates Express app
 * 2. Configures middleware (CORS, body parsing, timeouts)
 * 3. Connects to MongoDB (with retry logic)
 * 4. Registers all API routes
 * 5. Starts server on port 8080
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Server starts → Connects to MongoDB, listens on port 8080
 * - Request arrives → Middleware processes → Route handler executes
 * - Long-running request → Timeout middleware prevents hanging
 * - Server shutdown → Gracefully closes MongoDB connection
 * 
 * ===================================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
// This makes process.env.JWT_SECRET, process.env.MONGODB_URI, etc. available
dotenv.config();

// Create Express application instance
// This is the main app object that handles all HTTP requests
const app = express();

// ============================================================================
//                    STABILITY & RELIABILITY CONFIGURATION
// ============================================================================
// 
// 📖 WHAT THIS SECTION DOES:
// -------------------------
// Configures server stability features:
// - Health tracking (MongoDB connection status)
// - Shutdown flag (prevents new requests during shutdown)
// - Request timeouts (prevents hanging requests)
// 
// 🔗 WHY IT'S NEEDED:
// -------------------
// - Prevents server from hanging on slow requests
// - Allows graceful shutdown (finish current requests before closing)
// - Tracks MongoDB connection status for health checks
// 
// ============================================================================

// Track server health
// isShuttingDown: true = Server is shutting down, reject new requests
let isShuttingDown = false;

// mongoConnected: true = MongoDB is connected, false = disconnected
// Used in health check endpoint
let mongoConnected = false;

// Request timeout (30 seconds for most requests)
// Requests taking longer than this are automatically cancelled
// Prevents server from hanging on slow/frozen requests
const REQUEST_TIMEOUT = 30000;  // 30 seconds

// ============================================================================
//                              MIDDLEWARE
// ============================================================================
// 
// 📖 WHAT IS MIDDLEWARE?
// ----------------------
// Middleware functions execute between receiving request and sending response.
// They can modify request/response, add data, handle errors, etc.
// 
// 🔗 EXECUTION ORDER:
// -------------------
// Request → CORS → Body Parser → Timeout → Logging → Routes → Response
// 
// ============================================================================

/**
 * =============================================================================
 *                     CORS (Cross-Origin Resource Sharing)
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Allows frontend (running on different port) to make requests to backend.
 * 
 * 🔗 WHY IT'S NEEDED:
 * -------------------
 * Browser security blocks requests between different origins (ports).
 * CORS tells browser "it's OK to allow requests from frontend".
 * 
 * 📌 WHAT HAPPENS:
 * ---------------
 * - Frontend (port 5173) makes request → CORS middleware adds headers
 * - Browser sees CORS headers → Allows request to proceed
 * - Without CORS → Browser blocks request with CORS error
 * 
 * =============================================================================
 */
// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],  // Allowed frontend URLs
  credentials: true  // Allow cookies/credentials in requests
}));

/**
 * =============================================================================
 *                     BODY PARSERS
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Parses request body (JSON or form data) and makes it available in req.body.
 * 
 * 🔗 WHAT HAPPENS:
 * ---------------
 * - JSON request → express.json() parses it → req.body contains object
 * - Form data → express.urlencoded() parses it → req.body contains form fields
 * 
 * 📌 SIZE LIMIT:
 * --------------
 * limit: '10mb' - Maximum request body size
 * Prevents server from crashing on huge requests
 * 
 * =============================================================================
 */
// Body parsers with size limits
// express.json() - Parses JSON request bodies
// Example: POST with { "email": "..." } → req.body.email available
app.use(express.json({ limit: '10mb' }));

// express.urlencoded() - Parses form data (application/x-www-form-urlencoded)
// Example: POST form with email field → req.body.email available
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * =============================================================================
 *                     REQUEST TIMEOUT MIDDLEWARE
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Prevents requests from hanging indefinitely.
 * Automatically cancels requests that take too long.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Check if request is to a long-running endpoint (AI processing)
 * 2. Set timeout (5 min for AI, 30s for others)
 * 3. If timeout expires → Cancel request, return 503 error
 * 4. If request completes → Clear timeout
 * 
 * 📌 WHAT HAPPENS:
 * ---------------
 * - Normal request (< 30s) → Completes normally
 * - Slow request (> 30s) → Cancelled, 503 error returned
 * - AI request (< 5 min) → Completes normally
 * - AI request (> 5 min) → Cancelled, 503 error returned
 * 
 * =============================================================================
 */
// Request timeout middleware - prevents hanging requests
app.use((req, res, next) => {
  // Check if this is a long-running endpoint (AI processing takes time)
  // These endpoints need longer timeout (5 minutes)
  const longRunningPaths = ['/api/interview', '/api/resume/upload', '/api/ai'];
  const isLongRunning = longRunningPaths.some(path => req.path.startsWith(path));
  
  // Set timeout based on endpoint type
  // 5 minutes (300000ms) for AI endpoints, 30 seconds for others
  const timeout = isLongRunning ? 300000 : REQUEST_TIMEOUT;
  
  // Set timeout on request and response objects
  // If request takes longer than timeout, it's automatically cancelled
  req.setTimeout(timeout);
  res.setTimeout(timeout);
  
  // Create timeout timer
  // If this fires, request took too long
  const timeoutId = setTimeout(() => {
    // Only send error if response hasn't been sent yet
    if (!res.headersSent) {
      console.error(`⏱️ Request timeout: ${req.method} ${req.path}`);
      // Return 503 Service Unavailable error
      res.status(503).json({ 
        error: 'Request timeout. Please try again.',
        path: req.path
      });
    }
  }, timeout);
  
  // Clear timeout if request completes successfully
  // res.on('finish') = Response sent successfully
  res.on('finish', () => clearTimeout(timeoutId));
  
  // Clear timeout if connection closes
  // res.on('close') = Connection closed (client disconnected)
  res.on('close', () => clearTimeout(timeoutId));
  
  // Continue to next middleware
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 5000) { // Log slow requests (>5s)
      console.log(`🐢 Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  next();
});

// Health check middleware - reject requests during shutdown
app.use((req, res, next) => {
  if (isShuttingDown) {
    return res.status(503).json({ error: 'Server is shutting down' });
  }
  next();
});

// ============================================================================
//                              ROUTES
// ============================================================================
// 
// 📖 WHAT THIS SECTION DOES:
// -------------------------
// Registers all API route handlers.
// Each route file handles a specific feature area.
// 
// 🔗 ROUTE STRUCTURE:
// -------------------
// /api/auth/* → Authentication (login, register, get current user)
// /api/jobs/* → Job listings (get all jobs, create job, get job by ID)
// /api/resume/* → Resume upload and processing
// /api/recommendations/* → Job recommendations with fit scores
// /api/applications/* → Job applications (apply, get my applications)
// /api/hirer/* → Hirer dashboard (post jobs, view applicants)
// /api/interview/* → Interview preparation generation
// /api/ai/* → AI service proxy endpoints
// /api/company/* → Company management
// /api/seed/* → Database seeding (development only)
// 
// 📌 WHAT HAPPENS:
// ---------------
// Request to /api/jobs → Express routes to ./routes/jobs.js
// Request to /api/auth/login → Express routes to ./routes/auth.js (login handler)
// 
// ============================================================================

// Register route handlers
// app.use() mounts the router at the specified path
// All routes in the file are prefixed with the path
app.use('/api/auth', require('./routes/auth'));              // Authentication routes
app.use('/api/jobs', require('./routes/jobs'));               // Job listing routes
app.use('/api/resume', require('./routes/resume'));           // Resume upload routes
app.use('/api/recommendations', require('./routes/recommendations'));  // Recommendation routes
app.use('/api/applications', require('./routes/applications'));        // Application routes
app.use('/api/hirer', require('./routes/hirer'));             // Hirer dashboard routes
app.use('/api/interview', require('./routes/interview'));     // Interview prep routes
app.use('/api/ai', require('./routes/ai'));                   // AI service proxy routes
app.use('/api/company', require('./routes/company'));         // Company management routes
app.use('/api/seed', require('./routes/seed'));               // Database seeding routes

// ============================================================================
//                          HEALTH CHECK ENDPOINTS
// ============================================================================

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Job Portal Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API health check (more detailed)
app.get('/api/health', (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({ 
    status: mongoConnected ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    }
  });
});

// ============================================================================
//                          ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Global error handler - catches all unhandled errors
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message);
  console.error('   Path:', req.path);
  console.error('   Stack:', err.stack?.substring(0, 500));
  
  // Don't send error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    path: req.path,
    ...(isDev && { stack: err.stack?.substring(0, 200) })
  });
});

// ============================================================================
//                          MONGODB CONNECTION
// ============================================================================

/**
 * =============================================================================
 *                     MONGODB CONNECTION FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Connects to MongoDB database with retry logic.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Try to connect to MongoDB
 * 2. If success → Set mongoConnected = true, return
 * 3. If failure → Wait 3 seconds, retry (up to 5 times)
 * 4. If all retries fail → Log error, continue (server still runs)
 * 
 * 📌 WHY RETRY LOGIC:
 * -------------------
 * MongoDB might not be ready when server starts.
 * Retries give MongoDB time to start up.
 * 
 * 📌 WHAT HAPPENS:
 * ---------------
 * - Success → Database operations work normally
 * - Failure → Some endpoints fail, but server doesn't crash
 * 
 * =============================================================================
 */
const connectMongoDB = async (retries = 5) => {
  // Try to connect up to 5 times
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt to connect to MongoDB
      // process.env.MONGODB_URI = Connection string from .env file
      // Default: mongodb://localhost:27017/jobportal (local MongoDB)
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal', {
        useNewUrlParser: true,        // Use new URL parser (MongoDB driver option)
        useUnifiedTopology: true,      // Use unified topology (MongoDB driver option)
        serverSelectionTimeoutMS: 10000,  // Wait 10 seconds for server selection
        socketTimeoutMS: 45000,       // Wait 45 seconds for socket operations
        maxPoolSize: 10,               // Maximum 10 connections in pool
      });
      
      // Connection successful
      mongoConnected = true;
      console.log('✅ Connected to MongoDB');
      return;  // Exit function (connection successful)
    } catch (err) {
      // Connection failed
      console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message);
      
      // If not the last retry, wait 3 seconds before trying again
      if (i < retries - 1) {
        console.log(`   Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));  // Wait 3 seconds
      }
    }
  }
  
  // All retries failed
  console.error('❌ Failed to connect to MongoDB after all retries');
  // Continue running - some endpoints might still work (cached data, etc.)
  // Server doesn't crash, but database operations will fail
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  mongoConnected = true;
  console.log('✅ MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  mongoConnected = false;
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  mongoConnected = false;
  console.error('❌ MongoDB error:', err.message);
});

// ============================================================================
//                          GRACEFUL SHUTDOWN
// ============================================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  isShuttingDown = true;
  
  // Give ongoing requests 10 seconds to complete
  setTimeout(async () => {
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    } catch (err) {
      console.error('❌ Error closing MongoDB:', err.message);
    }
    console.log('👋 Server shutdown complete');
    process.exit(0);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error('   Stack:', err.stack?.substring(0, 500));
  console.error('   Attempting to continue serving requests...');
  // Don't exit - try to keep serving requests
  // Log to file for debugging
  const fs = require('fs');
  const logDir = require('path').join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(
    require('path').join(logDir, 'backend-errors.log'),
    `[${new Date().toISOString()}] Uncaught Exception: ${err.message}\n${err.stack}\n\n`
  );
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('   Reason:', reason);
  // Don't exit - try to keep serving requests
  // Log to file for debugging
  const fs = require('fs');
  const logDir = require('path').join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(
    require('path').join(logDir, 'backend-errors.log'),
    `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n${promise}\n\n`
  );
});

// ============================================================================
//                          START SERVER
// ============================================================================

const PORT = process.env.PORT || 8080;

// Connect to MongoDB first, then start server
connectMongoDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
  
  // Configure server timeouts
  server.timeout = 300000; // 5 minutes max for interview prep
  server.keepAliveTimeout = 65000; // Slightly higher than typical load balancer timeout
  server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout
});
