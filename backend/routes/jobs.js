/**
 * ===================================================================================
 *                    JOBS ROUTES - Job Listing and Management
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles all job-related API endpoints:
 * - Getting all jobs (with pagination and filters)
 * - Creating new jobs (for hirers)
 * - Getting job details
 * - Calculating fit scores for jobs
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. GET /api/jobs - Lists all jobs with pagination (6 per page)
 * 2. POST /api/jobs - Creates new job (hirer only)
 * 3. GET /api/jobs/:id - Gets single job details
 * 4. Fit scores calculated on-demand for current page
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User views jobs page → GET /api/jobs?page=1&limit=6
 * - Backend calculates fit scores for 6 jobs on current page
 * - Jobs sorted by fit score (highest first)
 * - Returns jobs with fit scores attached
 * 
 * ===================================================================================
 */

const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');
const { getCachedScores } = require('../services/backgroundJobs');

const router = express.Router();

// Create a new job (for hirers/admins)
router.post('/', auth, async (req, res) => {
  try {
    const Company = require('../models/Company');
    const {
      title,
      description,
      requirements,
      skills,  // Added skills field
      salary,
      location,
      jobType,
      jobMode,  // Added jobMode field
      experience,
      position,
      companyId
    } = req.body;

    // Validate required fields
    if (!title || !description || !location || !jobType || !companyId || !skills) {
      return res.status(400).json({ error: 'Missing required fields: title, description, location, jobType, companyId, and skills are required' });
    }

    // Get company name if companyId is provided
    let companyName = '';
    if (companyId) {
      const company = await Company.findById(companyId);
      if (company) {
        companyName = company.name;
      } else {
        return res.status(404).json({ error: 'Company not found' });
      }
    }

    // Parse requirements if it's a string
    const requirementsArray = typeof requirements === 'string' 
      ? requirements.split(',').map(r => r.trim()).filter(r => r)
      : requirements || [];
    
    // Parse skills if it's a string or array
    const skillsArray = typeof skills === 'string'
      ? skills.split(',').map(s => s.trim()).filter(s => s)
      : Array.isArray(skills) ? skills.filter(s => s) : [];
    
    if (skillsArray.length === 0) {
      return res.status(400).json({ error: 'At least one skill is required' });
    }

    // Calculate salary display
    const salaryNum = typeof salary === 'number' ? salary : parseInt(salary) || 0;
    const salaryDisplay = salaryNum > 0 
      ? `${(salaryNum / 100000).toFixed(0)}-${(salaryNum * 1.5 / 100000).toFixed(0)} LPA`
      : 'Not Disclosed';

    const job = await Job.create({
      title,
      description,
      requirements: requirementsArray,
      skills: skillsArray,  // Add skills array
      salary: {
        min: salaryNum,
        max: salaryNum * 1.5,
        currency: 'INR',
        display: salaryDisplay
      },
      location,
      jobType,
      jobMode: jobMode || 'On-Site',  // Use provided jobMode or default
      experience: {
        min: typeof experience === 'number' ? experience : parseInt(experience) || 0,
        max: (typeof experience === 'number' ? experience : parseInt(experience) || 0) + 2,
        display: `${experience || 0}-${(experience || 0) + 2} Years`
      },
      company: companyName,
      hirerId: req.user._id,
      applicationEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'Hiring Now',
      views: 0,
      applications: 0,
      isInternship: jobType === 'Internship'
    });

    res.status(201).json({ 
      message: 'Job created successfully',
      job,
      success: true 
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

/**
 * =============================================================================
 *                     GET ALL JOBS (WITH PAGINATION AND FILTERS)
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Returns a paginated list of all jobs with optional filters.
 * This endpoint does NOT include fit scores (for performance).
 * Use /api/jobs/recommended/list for jobs with fit scores.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Extract query parameters (search, filters, pagination)
 * 2. Build MongoDB query based on filters
 * 3. Fetch jobs with pagination (skip/limit)
 * 4. Return jobs with pagination metadata
 * 
 * 📌 QUERY PARAMETERS:
 * --------------------
 * - search: Text search (searches title, company, description, skills)
 * - location: Filter by location (regex match)
 * - jobType: Filter by job type (Full Time, Part Time, etc.)
 * - jobMode: Filter by work mode (On-Site, Remote, Hybrid)
 * - experience: Filter by experience range (e.g., "2-4")
 * - salary: Filter by salary range (e.g., "500000-1000000")
 * - page: Page number (default: 1)
 * - limit: Jobs per page (default: 200)
 * - sortBy: Field to sort by (default: 'createdAt')
 * - sortOrder: 'asc' or 'desc' (default: 'desc')
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "jobs": [...],  // Array of job objects
 *   "pagination": {
 *     "page": 1,
 *     "limit": 200,
 *     "total": 92,
 *     "pages": 1
 *   }
 * }
 * 
 * =============================================================================
 */
// Get all jobs endpoint - GET /api/jobs
// Public endpoint (no authentication required)
// Note: Fit scores only available via /api/jobs/recommended/list (authenticated)
router.get('/', async (req, res) => {
  try {
    // Extract query parameters from URL
    // Example: /api/jobs?page=1&limit=6&location=Bangalore&jobType=Full Time
    const {
      search,        // Text search query
      location,      // Location filter
      jobType,       // Job type filter
      jobMode,       // Work mode filter
      experience,    // Experience range filter (e.g., "2-4")
      salary,        // Salary range filter
      page = 1,      // Page number (default: 1)
      limit = 200,   // Jobs per page (default: 200)
      sortBy = 'createdAt',  // Field to sort by
      sortOrder = 'desc'     // Sort direction
    } = req.query;
    
    // Note: Match scores are only available for authenticated users via /recommended/list endpoint
    // This endpoint is faster because it doesn't calculate fit scores

    // Build MongoDB query object
    // Start with empty query (matches all jobs)
    const query = {};

    // ========================================================================
    //                     BUILD QUERY FILTERS
    // ========================================================================
    // Each filter adds conditions to the MongoDB query
    // Result: Only jobs matching ALL filters are returned
    
    // Text search filter (searches title, company, description, location)
    // Uses regex for flexible case-insensitive matching
    // Example: search="Amazon" finds jobs with "Amazon" in title, company, etc.
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive regex
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ];
    }

    // Location filter (case-insensitive regex match)
    // Example: location="Bangalore" matches "Bangalore, India", "bangalore", etc.
    // $regex: Pattern matching, $options: 'i' = case-insensitive
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Job type filter (exact match)
    // Example: jobType="Full Time" only returns full-time jobs
    if (jobType) {
      query.jobType = jobType;
    }

    // Job mode filter (exact match)
    // Example: jobMode="Remote" only returns remote jobs
    if (jobMode) {
      query.jobMode = jobMode;
    }

    // Experience filter (range matching)
    // Example: experience="2-4" finds jobs requiring 2-4 years
    // Logic: Job's min <= user's min AND job's max >= user's max
    if (experience) {
      const [min, max] = experience.split('-').map(Number);  // Parse "2-4" to [2, 4]
      // Find jobs where min experience <= user's min (job accepts less experience)
      if (min !== undefined) query['experience.min'] = { $lte: min };
      // Find jobs where max experience >= user's max (job accepts more experience)
      if (max !== undefined) query['experience.max'] = { $gte: max };
    }

    // Salary filter (range matching)
    // Example: salary="500000-1000000" finds jobs in that salary range
    // Similar logic to experience filter
    if (salary) {
      const [min, max] = salary.split('-').map(Number);  // Parse salary range
      if (min !== undefined) query['salary.min'] = { $lte: min };
      if (max !== undefined) query['salary.max'] = { $gte: max };
    }

    // ========================================================================
    //                     PAGINATION CALCULATION
    // ========================================================================
    // Calculate how many documents to skip based on page number
    // Example: page=2, limit=6 → skip=6 (skip first 6, show next 6)
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort options object
    // Example: { createdAt: -1 } = sort by createdAt descending (newest first)
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;  // -1 = desc, 1 = asc

    // ========================================================================
    //                     FETCH JOBS FROM DATABASE
    // ========================================================================
    // .find(query) - Find all jobs matching query
    // .sort(sortOptions) - Sort results
    // .skip(skip) - Skip first N documents (pagination)
    // .limit(parseInt(limit)) - Return only N documents
    // .lean() - Return plain JavaScript objects (faster, no Mongoose overhead)
    const jobs = await Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Count total jobs matching query (for pagination metadata)
    // This tells us how many pages exist
    const total = await Job.countDocuments(query);

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
    res.status(500).json({ error: 'Server error' });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    // Validate MongoDB ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Get jobs with fit scores (for authenticated users) - with pagination
// Calculates scores on-demand for the current page's jobs
router.get('/recommended/list', auth, async (req, res) => {
  try {
    const user = req.user;
    const {
      page = 1,
      limit = 6,
      jobType = 'Job', // 'Job' or 'Internship'
      search = ''      // Search query for company/title
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Build query based on job type
    const query = {};
    if (jobType === 'Internship') {
      query.isInternship = true;
    } else {
      query.isInternship = { $ne: true };
    }
    
    // Add search filter if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ];
    }
    
    // Get total count for pagination
    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    if (!user.resumeId || !user.resumeData) {
      // Return paginated jobs without fit scores if no resume
      const jobs = await Job.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
      
      return res.json({ 
        jobs: jobs.map(job => ({ ...job, fitScore: null })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: totalPages
        }
      });
    }

    // ========================================================================
    // SMART SCORING: Show jobs with cached scores FIRST
    // This ensures page 1 always shows jobs with actual match scores
    // ========================================================================
    
    // Get ALL jobs matching query (we'll sort by cached scores)
    const allJobs = await Job.find(query).lean();
    const allJobIds = allJobs.map(job => job._id.toString());
    
    // Get ALL cached scores for this user
    const allCachedScores = await getCachedScores(user._id, allJobIds);
    
    // Separate jobs with and without cached scores
    const jobsWithCachedScores = [];
    const jobsWithoutCachedScores = [];
    
    allJobs.forEach(job => {
      const jobId = job._id.toString();
      if (allCachedScores[jobId]) {
        jobsWithCachedScores.push({
          ...job,
          fitScore: {
            fitScore: allCachedScores[jobId].fitScore,
            breakdown: allCachedScores[jobId].breakdown,
            strengths: allCachedScores[jobId].strengths,
            gaps: allCachedScores[jobId].gaps,
            recommendation: allCachedScores[jobId].recommendation
          }
        });
      } else {
        jobsWithoutCachedScores.push({
          ...job,
          fitScore: null
        });
      }
    });
    
    // Sort jobs with scores by fitScore (highest first)
    jobsWithCachedScores.sort((a, b) => {
      const scoreA = a.fitScore?.fitScore || 0;
      const scoreB = b.fitScore?.fitScore || 0;
      return scoreB - scoreA;
    });
    
    // Sort jobs without scores by createdAt (newest first)
    jobsWithoutCachedScores.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Combine: scored jobs first, then unscored jobs
    const sortedJobs = [...jobsWithCachedScores, ...jobsWithoutCachedScores];
    
    // Paginate the sorted list
    const startIndex = (pageNum - 1) * limitNum;
    const jobsWithFit = sortedJobs.slice(startIndex, startIndex + limitNum);
    
    console.log(`📊 Page ${pageNum}: Showing ${jobsWithFit.filter(j => j.fitScore).length}/${jobsWithFit.length} jobs with scores (${jobsWithCachedScores.length} total scored)`);

    // Jobs are already sorted: scored jobs by fitScore, then unscored by date
    res.json({ 
      jobs: jobsWithFit,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allJobs.length, // Use actual count from query
        pages: Math.ceil(allJobs.length / limitNum),
        scoredJobs: jobsWithCachedScores.length // How many jobs have scores
      }
    });
  } catch (error) {
    console.error('Get recommended jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Calculate fit score between user resume and job
async function calculateFitScore(user, job) {
  try {
    if (!user.resumeId || !user.resumeData) {
      return 0;
    }

    const result = await aiService.calculateFitScore(
      user.resumeId,
      user.resumeData,
      job,
      user._id,
      job._id
    );

    return result.fitScore || 0;
  } catch (error) {
    console.error('Fit score calculation error:', error);
    return 0;
  }
}

module.exports = router;

