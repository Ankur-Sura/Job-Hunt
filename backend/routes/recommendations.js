/**
 * ===================================================================================
 *                    RECOMMENDATIONS ROUTES - Job Recommendations
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles job recommendation endpoints.
 * Returns top 5 job recommendations with AI match scores.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Gets all jobs (excluding already applied)
 * 2. Gets cached fit scores from MongoDB
 * 3. Calculates missing scores on-demand
 * 4. Sorts by fit score (highest first)
 * 5. Returns top 5 recommendations
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User views dashboard → Fetches recommendations
 * - Jobs sorted by fit score → Best matches shown first
 * - Internships prioritized → If user has no internship experience
 * 
 * ===================================================================================
 */

const express = require('express');
const Job = require('../models/Job');
const User = require('../models/User');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');
const { getCachedScores } = require('../services/backgroundJobs');

const router = express.Router();

/**
 * =============================================================================
 *                     GET JOB RECOMMENDATIONS
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Returns top 6 job recommendations with AI match scores.
 * FAST: Only uses cached scores - no on-demand calculation!
 * 
 * 🔗 FLOW:
 * --------
 * 1. Check if user has resume (required for recommendations)
 * 2. Get jobs user has already applied to (exclude from recommendations)
 * 3. Get first 50 jobs (limit for performance)
 * 4. Get ONLY cached fit scores (fast!)
 * 5. Sort by fit score (highest first)
 * 6. Return top 6 recommendations
 * 
 * 📌 REQUEST:
 * -----------
 * GET /api/recommendations
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "recommendations": [...],  // Top 6 jobs with cached scores
 *   "totalCached": 10,         // How many jobs have cached scores
 *   "isCalculating": true      // If background job is still running
 * }
 * 
 * ⚠️ ERROR RESPONSES:
 * ------------------
 * - 400: Resume not uploaded
 * - 500: Server error
 * 
 * =============================================================================
 */
// Get AI-powered job recommendations endpoint - GET /api/recommendations (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.resumeId) {
      return res.status(400).json({ error: 'Please upload your resume first' });
    }

    // ========================================================================
    //                     STEP 1: GET APPLIED JOB IDs
    // ========================================================================
    const userApplications = await Application.find({ userId: user._id }).select('jobId').lean();
    const appliedJobIds = userApplications.map(app => app.jobId?.toString()).filter(Boolean);

    // ========================================================================
    //                     STEP 2: GET TOTAL CACHED SCORES COUNT
    // ========================================================================
    const UserJobMatch = require('../models/UserJobMatch');
    const totalCachedInDb = await UserJobMatch.countDocuments({ userId: user._id });

    // ========================================================================
    //                     STEP 3: GET FIRST 50 JOBS (FOR RECOMMENDATIONS)
    // ========================================================================
    // Limit to 50 jobs for fast response - we only need top 6 anyway
    const allJobs = await Job.find({
      _id: { $nin: appliedJobIds }
    })
    .sort({ createdAt: -1 })
    .limit(50)  // Only check first 50 jobs (performance optimization)
    .lean();
    
    const jobIds = allJobs.map(job => job._id.toString());
    
    // ========================================================================
    //                     STEP 3: GET CACHED FIT SCORES (FAST!)
    // ========================================================================
    // ONLY use cached scores - NO on-demand calculation!
    // This makes the response instant
    const cachedScores = await getCachedScores(user._id, jobIds);
    const totalCached = Object.keys(cachedScores).length;
    
    // ========================================================================
    //                     STEP 4: ATTACH FIT SCORES TO JOBS
    // ========================================================================
    const jobsWithScores = allJobs.map((job) => {
      const jobId = job._id.toString();
      const cachedScore = cachedScores[jobId];
      
      if (cachedScore) {
        return {
          ...job,
          fitScore: {
            fitScore: cachedScore.fitScore,
            breakdown: cachedScore.breakdown,
            strengths: cachedScore.strengths,
            gaps: cachedScore.gaps,
            recommendation: cachedScore.recommendation
          }
        };
      } else {
        return {
          ...job,
          fitScore: null
        };
      }
    });

    // ========================================================================
    //                     STEP 5: SORT BY FIT SCORE (CACHED ONLY)
    // ========================================================================
    // Jobs with cached scores first, sorted by score
    // Jobs without cached scores at the end
    jobsWithScores.sort((a, b) => {
      const scoreA = a.fitScore?.fitScore || 0;
      const scoreB = b.fitScore?.fitScore || 0;
      return scoreB - scoreA;
    });

    // Get top 6 jobs (prefer jobs with scores, but include others if needed)
    const jobsWithValidScores = jobsWithScores.filter(job => job.fitScore?.fitScore > 0);
    const jobsWithoutScores = jobsWithScores.filter(job => !job.fitScore?.fitScore);
    
    // Take top 6: first from scored jobs, then fill with unscored
    let finalRecommendations = jobsWithValidScores.slice(0, 6);
    if (finalRecommendations.length < 6) {
      const remaining = 6 - finalRecommendations.length;
      finalRecommendations = [...finalRecommendations, ...jobsWithoutScores.slice(0, remaining)];
    }

    // Check if background job is still calculating (if we have less cached than total)
    const totalJobs = await Job.countDocuments({ _id: { $nin: appliedJobIds } });
    const isCalculating = totalCachedInDb < totalJobs;

    res.json({ 
      recommendations: finalRecommendations,
      totalCached: totalCachedInDb,  // Actual count from database
      totalJobs,                      // Total jobs available
      isCalculating                   // True if background job still running
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

async function calculateDetailedFitScore(user, job) {
  try {
    if (!user.resumeId || !user.resumeData) {
      return { fitScore: 0, breakdown: {}, strengths: [], gaps: [] };
    }

    const result = await aiService.calculateFitScore(
      user.resumeId,
      user.resumeData,
      job,
      user._id,
      job._id
    );

    if (!result.success) {
      return {
        fitScore: result.fitScore || 0,
        breakdown: result.breakdown || {},
        strengths: result.strengths || [],
        gaps: result.gaps || []
      };
    }

    return {
      fitScore: result.fitScore,
      breakdown: result.breakdown,
      strengths: result.strengths,
      gaps: result.gaps,
      recommendation: result.recommendation
    };
  } catch (error) {
    console.error('Detailed fit score error:', error);
    return { fitScore: 0, breakdown: {}, strengths: [], gaps: [] };
  }
}

module.exports = router;

