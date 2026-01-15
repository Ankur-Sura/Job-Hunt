/**
 * ===================================================================================
 *                    AI ROUTES - AI Service Proxy Endpoints
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Express router for AI service-related endpoints.
 * Acts as a proxy between frontend/backend and the AI service.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Frontend/Backend calls these endpoints
 * 2. Router forwards requests to AI service
 * 3. AI service processes request (health check, chat, OCR)
 * 4. Response returned to caller
 * 
 * 📌 ROUTES:
 * ----------
 * GET /health - Check if AI service is running
 * POST /chat - Agent chat endpoint (for future use)
 * POST /ocr - OCR image endpoint (placeholder)
 * 
 * ===================================================================================
 */

// Line 1: Import Express framework
// express = Web framework for Node.js
const express = require('express');
// Line 2: Import authentication middleware
// auth = Middleware function that verifies JWT token
const auth = require('../middleware/auth');
// Line 3: Import AI service module
// aiService = Service that communicates with AI service (FastAPI)
// Contains methods like healthCheck(), agentChat(), etc.
const aiService = require('../services/aiService');

// Line 5: Create Express router
// router = Mini-app for handling routes
const router = express.Router();

// Line 7: GET /api/ai/health - Health check endpoint
// Checks if AI service (FastAPI) is running and responding
// No auth required = Public endpoint for monitoring
router.get('/health', async (req, res) => {
  // Line 9: try block for error handling
  try {
    // Line 10: Call healthCheck() method from aiService
    // This sends GET request to AI service's /health endpoint
    // Returns true if AI service is healthy, false otherwise
    const isHealthy = await aiService.healthCheck();
    
    // Line 11: Return JSON response with health status
    // status = 'healthy' or 'unhealthy'
    // service = Name of service being checked
    // url = AI service URL (from environment variable or default)
    res.json({ 
      status: isHealthy ? 'healthy' : 'unhealthy',  // Ternary operator: if isHealthy is true, return 'healthy', else 'unhealthy'
      service: 'AI Service',                         // Service name
      url: process.env.AI_SERVICE_URL || 'http://localhost:8005'  // AI service URL (from env or default)
    });
  } catch (error) {
    // Line 17: If error occurs (network error, AI service down, etc.)
    // Return 503 Service Unavailable status
    res.status(503).json({ 
      status: 'unhealthy',        // Mark as unhealthy
      error: error.message       // Include error message
    });
  }
});

// Line 24: POST /api/ai/chat - Agent chat endpoint (for future use)
// Allows users to chat with AI agent
// auth = Requires user to be logged in
router.post('/chat', auth, async (req, res) => {
  // Line 26: try block for error handling
  try {
    // Line 27: Extract message and threadId from request body
    // Destructuring = Extracts properties from object
    // message = User's chat message
    // threadId = Conversation thread ID (for maintaining context)
    const { message, threadId } = req.body;
    
    // Line 29: Validate that message exists
    // If no message provided, return 400 Bad Request error
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Line 33: Call agentChat() method from aiService
    // Passes message and threadId to AI service
    // If no threadId provided, generates one using user ID and timestamp
    // threadId = Unique identifier for conversation thread
    const result = await aiService.agentChat(
      message,                                                                    // User's message
      threadId || `chat-${req.user._id}-${Date.now()}`  // Thread ID or generate new one
    );

    // Line 39: Check if AI service call was successful
    // If result.success is false, return 500 error
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Line 42: Return successful response with chat data
    // result.data = Contains AI's response, conversation history, etc.
    res.json(result.data);
  } catch (error) {
    // Line 44: If error occurs, log it and return 500 error
    console.error('Agent chat error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Line 49: POST /api/ai/ocr - OCR image endpoint (placeholder)
// Currently not implemented - returns info message
// auth = Requires user to be logged in
router.post('/ocr', auth, async (req, res) => {
  // Line 51: try block for error handling
  try {
    // Line 52: Return info message about OCR endpoint
    // This endpoint is a placeholder - actual OCR is done in /api/resume/upload
    // Image OCR could be added here in the future if needed
    res.json({ 
      message: 'OCR endpoint - use /api/resume/upload for PDF OCR',  // Info message
      info: 'Image OCR can be added here if needed'                  // Future enhancement note
    });
  } catch (error) {
    // Line 59: If error occurs, return 500 error
    res.status(500).json({ error: 'Server error' });
  }
});

// Line 63: Export router
// Makes this router available for use in server.js
// server.js imports this and mounts it at /api/ai
module.exports = router;

