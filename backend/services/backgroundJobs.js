/**
 * ===================================================================================
 *                    BACKGROUND JOBS SERVICE - Async Processing
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles background processing tasks that take a long time.
 * These tasks run asynchronously without blocking user requests.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User uploads resume → Triggers background job
 * 2. Background job calculates fit scores for ALL jobs (92+ jobs)
 * 3. Scores are cached in MongoDB for fast retrieval
 * 4. User can continue using app while scores calculate
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Resume uploaded → Background job starts → Calculates 92+ scores (2-3 min)
 * - Scores cached → Future requests use cached scores (instant)
 * - User views jobs → Cached scores retrieved (no AI processing needed)
 * 
 * ===================================================================================
 */

const Job = require('../models/Job');
const UserJobMatch = require('../models/UserJobMatch');
const aiService = require('./aiService');
const axios = require('axios');

// AI service URL (FastAPI server)
// Default: http://localhost:8005 (can be overridden with environment variable)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8005';

/**
 * =============================================================================
 *                     CALCULATE ALL JOB MATCHES (BACKGROUND JOB)
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Calculates fit scores for ALL jobs in the database for a specific user.
 * This runs in the background after resume upload (doesn't block user).
 * 
 * 🔗 FLOW:
 * --------
 * 1. Gets all jobs from database
 * 2. Tries fast batch endpoint (calculates all at once - faster)
 * 3. If batch fails → Falls back to individual calculation (5 at a time)
 * 4. Saves all scores to MongoDB (caching)
 * 5. Takes 2-3 minutes for 92 jobs
 * 
 * 📌 WHY BACKGROUND JOB:
 * ---------------------
 * - Calculating 92+ scores takes 2-3 minutes
 * - User shouldn't wait that long
 * - Runs in background, user can continue using app
 * 
 * 📌 WHAT HAPPENS:
 * ---------------
 * - Job starts → Logs progress every 10 jobs
 * - Scores saved to MongoDB as they're calculated
 * - User can view recommendations immediately (uses cached scores)
 * 
 * 📌 PARAMETERS:
 * --------------
 * @param {string} userId - User ID (for caching)
 * @param {Object} resumeData - Extracted resume data (skills, experience, etc.)
 * @param {string} resumeId - PDF ID in Qdrant
 * 
 * =============================================================================
 */
async function calculateAllJobMatches(userId, resumeData, resumeId) {
  try {
    console.log(`🚀 Starting background job match calculation for user ${userId}`);
    
    // Clear old cached scores for this user before recalculating
    // This ensures new resume data is used for all scores
    try {
      const deletedCount = await UserJobMatch.deleteMany({ userId });
      console.log(`🗑️ Cleared ${deletedCount.deletedCount} old cached scores for user ${userId}`);
    } catch (error) {
      console.warn(`⚠️ Failed to clear old scores: ${error.message}`);
      // Continue anyway - new scores will overwrite old ones via upsert
    }
    
    // Get all jobs
    const allJobs = await Job.find({}).lean();
    console.log(`📋 Found ${allJobs.length} jobs to process`);
    
    if (allJobs.length === 0) {
      console.log('⚠️ No jobs found in database');
      return;
    }
    
    // Try fast batch endpoint first (faster)
    try {
      const batchResult = await calculateBatchScores(resumeData, allJobs);
      if (batchResult && batchResult.scores && batchResult.scores.length > 0) {
        await saveBatchScores(userId, batchResult.scores);
        console.log(`✅ Batch processing complete: ${batchResult.scores.length} scores calculated`);
        return;
      }
    } catch (batchError) {
      console.log('⚠️ Batch processing failed, falling back to individual calculation:', batchError.message);
    }
    
    // Fallback: Calculate individually (slower but more reliable)
    console.log('🔄 Calculating scores individually...');
    let processed = 0;
    const batchSize = 5; // Process 5 at a time to avoid overwhelming the API
    
    for (let i = 0; i < allJobs.length; i += batchSize) {
      const batch = allJobs.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (job) => {
          try {
            const result = await aiService.calculateFitScore(
              resumeId,
              resumeData,
              job,
              userId,
              job._id.toString()
            );
            
            await saveJobMatch(userId, job._id.toString(), result);
            processed++;
            
            if (processed % 10 === 0) {
              console.log(`  📊 Processed ${processed}/${allJobs.length} jobs...`);
            }
          } catch (error) {
            console.error(`  ❌ Error calculating score for job ${job._id}:`, error.message);
            // Save default score
            await saveJobMatch(userId, job._id.toString(), {
              success: false,
              fitScore: 0,
              breakdown: {},
              strengths: [],
              gaps: [],
              recommendation: 'Error calculating fit'
            });
          }
        })
      );
    }
    
    console.log(`✅ Background job match calculation complete: ${processed} scores calculated`);
    
  } catch (error) {
    console.error('❌ Background job match calculation failed:', error);
  }
}

/**
 * Calculate scores using fast batch endpoint
 */
async function calculateBatchScores(resumeData, jobs) {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/fast/batch-fit-scores`,
      {
        resume_data: resumeData,
        jobs: jobs.map(job => ({
          _id: job._id.toString(),
          title: job.title,
          company: job.company,
          description: job.description,
          skills: job.skills || [],
          experience: job.experience || {},
          qualifications: job.qualifications || {}
        }))
      },
      {
        timeout: 300000 // 5 minutes (300 seconds) - increased for batch processing
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Batch score calculation error:', error.message);
    throw error;
  }
}

/**
 * Save batch scores to database
 */
async function saveBatchScores(userId, scores) {
  const operations = scores.map(score => ({
    updateOne: {
      filter: { userId, jobId: score.job_id },
      update: {
        $set: {
          userId,
          jobId: score.job_id,
          fitScore: score.fitScore || 0,
          breakdown: score.breakdown || {},
          strengths: score.strengths || [],
          gaps: score.gaps || [],
          recommendation: score.recommendation || 'Consider',
          calculatedAt: new Date()
        }
      },
      upsert: true
    }
  }));
  
  if (operations.length > 0) {
    await UserJobMatch.bulkWrite(operations);
  }
}

/**
 * Save individual job match score
 */
async function saveJobMatch(userId, jobId, result) {
  try {
    await UserJobMatch.findOneAndUpdate(
      { userId, jobId },
      {
        userId,
        jobId,
        fitScore: result.fitScore || 0,
        breakdown: result.breakdown || {},
        strengths: result.strengths || [],
        gaps: result.gaps || [],
        recommendation: result.recommendation || 'Consider',
        calculatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Error saving job match for job ${jobId}:`, error);
  }
}

/**
 * =============================================================================
 *                     GET CACHED SCORES
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Retrieves cached fit scores from MongoDB.
 * This is FAST - no AI processing needed.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Queries UserJobMatch collection
 * 2. Finds scores for specified jobs
 * 3. Creates map: { jobId: { fitScore, breakdown, ... }, ... }
 * 4. Returns map for fast lookup
 * 
 * 📌 WHY CACHING:
 * --------------
 * - Fit scores don't change unless resume or job changes
 * - Recalculating takes 2-3 minutes
 * - Cached scores retrieved instantly
 * 
 * 📌 WHAT HAPPENS:
 * ---------------
 * - Fast lookup (MongoDB query, no AI processing)
 * - Returns scores if cached, empty object if not
 * 
 * 📌 PARAMETERS:
 * --------------
 * @param {string} userId - User ID
 * @param {Array} jobIds - Array of job IDs to get scores for
 * 
 * 📌 RETURNS:
 * -----------
 * {
 *   "jobId1": { fitScore: 75, breakdown: {...}, ... },
 *   "jobId2": { fitScore: 80, breakdown: {...}, ... },
 *   ...
 * }
 * 
 * =============================================================================
 */
async function getCachedScores(userId, jobIds) {
  try {
    const matches = await UserJobMatch.find({
      userId,
      jobId: { $in: jobIds }
    }).lean();
    
    // Create a map for quick lookup
    const scoreMap = {};
    matches.forEach(match => {
      scoreMap[match.jobId.toString()] = {
        fitScore: match.fitScore,
        breakdown: match.breakdown,
        strengths: match.strengths,
        gaps: match.gaps,
        recommendation: match.recommendation
      };
    });
    
    return scoreMap;
  } catch (error) {
    console.error('Error getting cached scores:', error);
    return {};
  }
}

module.exports = {
  calculateAllJobMatches,
  getCachedScores,
  saveJobMatch
};

