/**
 * ===================================================================================
 *                    INTERVIEW PREPARATION ROUTES
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles interview preparation generation.
 * It connects the frontend to the AI service that generates comprehensive
 * interview guides using LangGraph workflows.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User clicks "Interview Prep" button on an application
 * 2. Frontend calls GET /api/interview/:applicationId
 * 3. Backend validates application and user ownership
 * 4. Backend calls AI service to generate interview prep (3-5 minutes)
 * 5. AI service uses 4-node LangGraph workflow:
 *    - Company research (web search)
 *    - Interview rounds analysis
 *    - Round-by-round preparation (DSA, System Design, Behavioral)
 *    - Common questions generation
 * 6. Returns structured data to frontend
 * 
 * 📌 TIMEOUT:
 * -----------
 * This route has extended timeout (5 minutes) because AI processing takes time.
 * 
 * ===================================================================================
 */

const express = require('express');
const Application = require('../models/Application');
const User = require('../models/User');
const Job = require('../models/Job');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Health check for interview service
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'interview' });
});

/**
 * =============================================================================
 *                     GET INTERVIEW PREPARATION
 * =============================================================================
 * 
 * 📖 WHAT IT DOES:
 * ----------------
 * Generates a comprehensive interview preparation guide for a specific job application.
 * This is a PROTECTED route - requires authentication.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Validates applicationId parameter
 * 2. Fetches application from database (with job and user populated)
 * 3. Checks if user owns this application (security)
 * 4. Validates that user has uploaded a resume
 * 5. Calls AI service to generate interview prep (LangGraph workflow)
 * 6. Returns structured data:
 *    - Company information
 *    - Interview links (Reddit, Glassdoor, LeetCode)
 *    - Interview rounds breakdown
 *    - DSA preparation (if applicable)
 *    - System Design preparation (if applicable)
 *    - Behavioral preparation (if applicable)
 *    - Common questions with answers
 * 
 * 📌 REQUEST:
 * -----------
 * GET /api/interview/:applicationId
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "success": true,
 *   "applicationId": "...",
 *   "job": { ... },
 *   "company_info": "...",
 *   "interview_links": [...],
 *   "role_level": "SDE-1",
 *   "interview_rounds": { ... },
 *   "dsa_prep": { ... },
 *   "system_design_prep": { ... },
 *   "behavioral_prep": { ... },
 *   "common_questions": [...]
 * }
 * 
 * ⚠️ ERROR RESPONSES:
 * ------------------
 * - 400: Invalid application ID or resume not found
 * - 403: User doesn't own this application
 * - 404: Application or job not found
 * - 500: AI service error or server error
 * 
 * ⏱️ PROCESSING TIME:
 * -------------------
 * This endpoint takes 3-5 minutes to complete because:
 * - Web search for company info (Tavily API)
 * - Multiple GPT-4 calls for each round
 * - LangGraph workflow execution
 * 
 * =============================================================================
 */
// Get interview preparation endpoint - GET /api/interview/:applicationId (Protected)
router.get('/prepare/:applicationId', auth, async (req, res) => {
  // Extend timeout for this route (5 minutes for full LangGraph processing)
  // This is necessary because AI processing can take 3-5 minutes
  req.setTimeout(300000);  // 5 minutes
  res.setTimeout(300000);  // 5 minutes
  
  try {
    const { applicationId } = req.params;

    // Validate applicationId format
    if (!applicationId || applicationId === 'undefined') {
      return res.status(400).json({ error: 'Invalid application ID' });
    }

    // Get application
    const application = await Application.findById(applicationId)
      .populate('jobId')
      .populate('userId');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check if user owns this application
    if (application.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const job = application.jobId;
    const user = application.userId;

    if (!job) {
      return res.status(404).json({ error: 'Job not found for this application' });
    }

    // Fetch full user document to ensure resumeData is available
    // populate() might not include all fields, so fetch directly
    const fullUser = await User.findById(user._id || user);
    
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!fullUser.resumeId || !fullUser.resumeData) {
      console.error('❌ Resume check failed:', {
        userId: fullUser._id,
        hasResumeId: !!fullUser.resumeId,
        hasResumeData: !!fullUser.resumeData,
        resumeId: fullUser.resumeId
      });
      return res.status(400).json({ error: 'Resume not found. Please upload your resume first.' });
    }

    // Generate interview preparation using AI (5-node round-based LangGraph with Tavily web search)
    console.log(`🚀 Starting interview preparation for ${job.title} at ${job.company}...`);
    
    const result = await aiService.generateInterviewPrep(
      fullUser.resumeId,
      fullUser.resumeData,
      job,
      applicationId
    );

    if (!result.success) {
      console.error('❌ Interview prep generation failed:', result.error);
      return res.status(500).json({ 
        error: result.error || 'Failed to generate interview preparation. Please try again.' 
      });
    }

    console.log('✅ Interview preparation generated successfully!');

    // Return all structured data from the round-based interview prep graph
    res.json({
      success: true,
      applicationId,
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        skills: job.skills || [],
        experience: job.experience || {}
      },
      // Company research
      company_info: result.company_info || null,
      interview_links: result.interview_links || [],
      role_level: result.role_level || 'SDE-1',
      
      // Interview rounds structure
      interview_rounds: result.interview_rounds || null,
      
      // Round-by-round preparation
      dsa_prep: result.dsa_prep || null,
      system_design_prep: result.system_design_prep || null,
      behavioral_prep: result.behavioral_prep || null,
      
      // Common questions
      common_questions: result.common_questions || [],
      prepared_answers: result.prepared_answers || [],
      
      // Removed: preparation/final_guide (redundant - content is in individual sections)
      
      // Legacy fields for backward compatibility
      role_analysis: result.role_analysis || null,
      fitScore: application.fitScore || 0,
      fitDetails: application.fitDetails || {
        breakdown: { skillsMatch: 0, experienceMatch: 0, educationMatch: 0 },
        strengths: [],
        gaps: []
      }
    });
  } catch (error) {
    console.error('Interview preparation error:', error.message);
    console.error('Stack:', error.stack?.substring(0, 500));
    
    // Return appropriate error message
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid application ID format' });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate interview preparation. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

module.exports = router;
