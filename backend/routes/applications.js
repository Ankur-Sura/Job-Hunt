/**
 * ===================================================================================
 *                    APPLICATIONS ROUTES - Job Application Management
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles job application endpoints:
 * - Apply to a job (creates application, calculates fit score)
 * - Get user's applications
 * - Check if user applied to a job
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. POST /api/applications/apply/:jobId - Creates new application
 * 2. GET /api/applications/my-applications - Gets all user's applications
 * 3. GET /api/applications/check/:jobId - Checks if user applied
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User applies → Application created, fit score calculated, counters updated
 * - User views applications → All applications fetched with job details
 * 
 * ===================================================================================
 */

const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * =============================================================================
 *                     APPLY TO JOB ENDPOINT
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Creates a new job application for the authenticated user.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Validate job exists
 * 2. Check if user already applied (prevent duplicates)
 * 3. Calculate fit score (if user has resume)
 * 4. Create application document
 * 5. Update user performance counter
 * 6. Update job applications counter
 * 7. Return application data
 * 
 * 📌 REQUEST:
 * -----------
 * POST /api/applications/apply/:jobId
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "success": true,
 *   "application": {
 *     "id": "...",
 *     "jobId": "...",
 *     "jobTitle": "...",
 *     "company": "...",
 *     "fitScore": 75,
 *     "status": "applied",
 *     "appliedAt": "...",
 *     "interviewPrepUrl": "/interview/..."
 *   }
 * }
 * 
 * ⚠️ ERROR RESPONSES:
 * ------------------
 * - 400: Already applied for this job
 * - 404: Job not found
 * - 500: Server error
 * 
 * =============================================================================
 */
// Apply for a job endpoint - POST /api/applications/apply/:jobId (Protected)
router.post('/apply/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const user = req.user;

    // ========================================================================
    //                     STEP 1: VALIDATE JOB EXISTS
    // ========================================================================
    // Check if the job the user is trying to apply to actually exists
    // If job doesn't exist, return 404 error
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // ========================================================================
    //                     STEP 2: CHECK FOR DUPLICATE APPLICATION
    // ========================================================================
    // Prevent user from applying to the same job twice
    // MongoDB unique index also prevents this, but we check first for better error message
    const existingApplication = await Application.findOne({
      userId: user._id,    // Current user
      jobId: jobId         // Job being applied to
    });

    // If application already exists, return error
    // User can't apply twice to the same job
    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }

    // ========================================================================
    //                     STEP 3: CALCULATE FIT SCORE
    // ========================================================================
    // Calculate AI match score between user's resume and job requirements
    // This is optional - only if user has uploaded a resume
    let fitScore = 0;        // Default score (0 = no match)
    let fitDetails = null;   // Detailed breakdown (null if not calculated)

    // Only calculate fit score if user has uploaded a resume
    if (user.resumeId && user.resumeData) {
      try {
        // Call AI service to calculate fit score
        // This sends resume data and job data to AI service
        // AI service uses GPT-4 to analyze and calculate score (0-100%)
        const result = await aiService.calculateFitScore(
          user.resumeId,      // PDF ID in Qdrant
          user.resumeData,    // Extracted resume data (skills, experience, etc.)
          job,                // Job document
          user._id,           // User ID (for caching)
          jobId               // Job ID (for caching)
        );

        // If calculation was successful, extract fit score and details
        if (result.success) {
          // Store detailed breakdown for display
          fitDetails = {
            fitScore: result.fitScore,           // Overall score (0-100)
            breakdown: result.breakdown,         // { skillsMatch, experienceMatch, ... }
            strengths: result.strengths,         // Array of strengths
            gaps: result.gaps,                   // Array of gaps
            recommendation: result.recommendation // "Highly recommended", "Recommended", etc.
          };
          // Extract numeric score for sorting/filtering
          fitScore = result.fitScore || 0;
        }
      } catch (error) {
        // If fit score calculation fails, log error but continue
        // Application is still created, just without fit score
        console.error('Fit score calculation error:', error);
      }
    }

    // ========================================================================
    //                     STEP 4: CREATE APPLICATION DOCUMENT
    // ========================================================================
    // Create new Application document in MongoDB
    // This links the user to the job and stores the fit score
    const application = new Application({
      userId: user._id,      // Reference to User
      jobId: jobId,          // Reference to Job
      fitScore,              // Calculated fit score (0 if not calculated)
      fitDetails             // Detailed breakdown (null if not calculated)
    });

    // Save application to database
    // MongoDB unique index prevents duplicate applications
    await application.save();

    // ========================================================================
    //                     STEP 5: UPDATE USER PERFORMANCE METRICS
    // ========================================================================
    // Increment user's "opportunitiesApplied" counter
    // This is used to show statistics on dashboard
    user.performance.opportunitiesApplied += 1;
    await user.save();

    // ========================================================================
    //                     STEP 6: UPDATE JOB APPLICATIONS COUNT
    // ========================================================================
    // Increment job's "applications" counter
    // This shows how many people applied to this job
    job.applications += 1;
    await job.save();

    res.json({
      success: true,
      application: {
        id: application._id,
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        fitScore,
        status: application.status,
        appliedAt: application.appliedAt,
        interviewPrepUrl: `/interview/${application._id}`
      }
    });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if user has applied for a job
router.get('/check/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const application = await Application.findOne({
      userId: req.user._id,
      jobId: jobId
    }).populate('jobId', 'title company');

    if (application) {
      res.json({
        applied: true,
        application: {
          id: application._id,
          status: application.status,
          appliedAt: application.appliedAt,
          fitScore: application.fitScore
        }
      });
    } else {
      res.json({ applied: false });
    }
  } catch (error) {
    console.error('Check application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's applications
router.get('/my-applications', auth, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate('jobId', 'title company location salary experience status jobType')
      .sort({ appliedAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all applications (for hirers to see applicants)
router.get('/', auth, async (req, res) => {
  try {
    const { jobId } = req.query;
    const user = req.user;

    // Only hirers can see all applications
    if (user.role !== 'hirer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = {};
    if (jobId) {
      // Get job and verify it belongs to the hirer
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      if (job.hirerId.toString() !== user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      query.jobId = jobId;
    } else {
      // Get all jobs by this hirer
      const jobs = await Job.find({ hirerId: user._id }).select('_id');
      const jobIds = jobs.map(j => j._id);
      query.jobId = { $in: jobIds };
    }

    const applications = await Application.find(query)
      .populate('userId', 'name email phone profile')
      .populate('jobId', 'title company location')
      .sort({ appliedAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update application status (for hirers)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    // Only hirers can update status
    if (user.role !== 'hirer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const application = await Application.findById(id).populate('jobId');
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify job belongs to hirer
    if (application.jobId.hirerId.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status (map to model enum values)
    if (status === 'Accepted' || status === 'Rejected') {
      application.status = status === 'Accepted' ? 'shortlisted' : 'rejected';
      await application.save();

      // Update user performance
      const applicant = await User.findById(application.userId);
      if (applicant) {
        if (status === 'Accepted') {
          applicant.performance.shortlisted += 1;
        } else {
          applicant.performance.rejected += 1;
        }
        await applicant.save();
      }

      res.json({ 
        success: true, 
        message: `Application ${status.toLowerCase()} successfully`,
        application 
      });
    } else {
      res.status(400).json({ error: 'Invalid status' });
    }
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

