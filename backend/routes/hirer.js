/**
 * ===================================================================================
 *                    HIRER ROUTES - Recruiter Dashboard & Management
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles recruiter/hirer endpoints:
 * - View candidates for posted jobs
 * - Analyze resumes (ATS-friendly, project relevance)
 * - Accept/reject candidates
 * - Update application status
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Recruiter logs in with role='hirer'
 * 2. Views candidates who applied to their jobs
 * 3. Analyzes resumes for ATS compatibility and project relevance
 * 4. Makes decisions based on comprehensive analysis (not just fit score)
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Recruiter views candidates → Gets list with fit scores
 * - Recruiter analyzes resume → Gets ATS + project analysis
 * - Recruiter accepts/rejects → Application status updated
 * 
 * ===================================================================================
 */

const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Middleware to check if user is a hirer
const checkHirer = (req, res, next) => {
  if (req.user.role !== 'hirer') {
    return res.status(403).json({ error: 'Access denied. Hirer role required.' });
  }
  next();
};

/**
 * =============================================================================
 *                     GET ALL JOBS POSTED BY RECRUITER
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Returns all jobs posted by the logged-in recruiter.
 * 
 * 📌 REQUEST:
 * -----------
 * GET /api/hirer/my-jobs
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "jobs": [
 *     {
 *       "id": "...",
 *       "title": "...",
 *       "company": "...",
 *       "applicationsCount": 5
 *     }
 *   ]
 * }
 * 
 * =============================================================================
 */
router.get('/my-jobs', auth, checkHirer, async (req, res) => {
  try {
    const jobs = await Job.find({ hirerId: req.user._id })
      .select('title company location applications status createdAt')
      .sort({ createdAt: -1 });

    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await Application.countDocuments({ jobId: job._id });
        return {
          id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          applicationsCount: count,
          status: job.status,
          createdAt: job.createdAt
        };
      })
    );

    res.json({ jobs: jobsWithCounts });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * =============================================================================
 *                     GET CANDIDATES FOR A JOB
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Returns all candidates who applied to a specific job with fit scores.
 * 
 * 📌 REQUEST:
 * -----------
 * GET /api/hirer/job/:jobId/candidates
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "job": { id, title, company },
 *   "candidates": [
 *     {
 *       "applicationId": "...",
 *       "candidateId": "...",
 *       "name": "...",
 *       "email": "...",
 *       "fitScore": 75,
 *       "fitDetails": {...},
 *       "status": "applied",
 *       "appliedAt": "..."
 *     }
 *   ],
 *   "total": 10
 * }
 * 
 * =============================================================================
 */
router.get('/job/:jobId/candidates', auth, checkHirer, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Get job and verify it belongs to this recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.hirerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. This job does not belong to you.' });
    }

    // Get all applications for this job
    const applications = await Application.find({ jobId })
      .populate('userId', 'name email resumeId resumeData')
      .sort({ fitScore: -1, appliedAt: -1 });

    // Calculate/update fit scores for candidates with resumes
    // Return candidates immediately with existing scores, calculate missing ones in background
    const candidatesWithFit = await Promise.all(
      applications.map(async (app) => {
        const candidate = app.userId;
        
        if (!candidate.resumeId) {
          // No resume uploaded
          return {
            applicationId: app._id,
            candidateId: candidate._id,
            name: candidate.name,
            email: candidate.email,
            fitScore: 0,
            fitDetails: null,
            status: app.status,
            appliedAt: app.appliedAt,
            hasResume: false,
            isCalculating: false
          };
        }

        // Use existing fit score if available and valid
        if (app.fitScore > 0 && app.fitDetails && 
            typeof app.fitDetails === 'object' && 
            Object.keys(app.fitDetails).length > 0) {
          console.log(`✅ Using existing fit score for candidate ${candidate._id}: ${app.fitScore}%`);
          return {
            applicationId: app._id,
            candidateId: candidate._id,
            name: candidate.name,
            email: candidate.email,
            fitScore: app.fitScore,
            fitDetails: app.fitDetails,
            status: app.status,
            appliedAt: app.appliedAt,
            hasResume: true,
            isCalculating: false
          };
        }

        // Calculate fit score (with timeout to prevent hanging)
        console.log(`📊 Calculating fit score for candidate ${candidate._id}...`);
        try {
          // Set a timeout for fit score calculation (30 seconds max)
          const fitScorePromise = calculateCandidateFit(candidate, job);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fit score calculation timeout')), 30000)
          );
          
          const fitScore = await Promise.race([fitScorePromise, timeoutPromise]);
          
          if (fitScore && fitScore.fitScore !== undefined) {
            app.fitScore = fitScore.fitScore;
            app.fitDetails = fitScore;
            await app.save();
            console.log(`✅ Fit score calculated and saved: ${fitScore.fitScore}%`);

            return {
              applicationId: app._id,
              candidateId: candidate._id,
              name: candidate.name,
              email: candidate.email,
              fitScore: fitScore.fitScore,
              fitDetails: fitScore,
              status: app.status,
              appliedAt: app.appliedAt,
              hasResume: true,
              isCalculating: false
            };
          } else {
            throw new Error('Invalid fit score result');
          }
        } catch (error) {
          console.error(`❌ Error calculating fit for candidate ${candidate._id}:`, error.message);
          // Return with isCalculating flag so frontend can show loading state
          return {
            applicationId: app._id,
            candidateId: candidate._id,
            name: candidate.name,
            email: candidate.email,
            fitScore: app.fitScore || 0, // Use existing if available
            fitDetails: app.fitDetails || null,
            status: app.status,
            appliedAt: app.appliedAt,
            hasResume: true,
            isCalculating: true, // Indicate calculation failed but can retry
            calculationError: error.message
          };
        }
      })
    );

    // Sort by fit score (highest first)
    candidatesWithFit.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));

    res.json({
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        description: job.description,
        skills: job.skills
      },
      candidates: candidatesWithFit,
      total: candidatesWithFit.length
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Calculate fit score for a candidate
async function calculateCandidateFit(candidate, job) {
  try {
    if (!candidate.resumeId || !candidate.resumeData) {
      console.log('⚠️ No resume data for candidate:', candidate._id);
      return { fitScore: 0, breakdown: {}, strengths: [], gaps: [], recommendation: 'No resume data' };
    }

    console.log(`📊 Calculating fit score for job: ${job.title} at ${job.company}`);
    const result = await aiService.calculateFitScore(
      candidate.resumeId,
      candidate.resumeData,
      job,
      candidate._id,
      job._id
    );

    // Handle both success and failure cases
    if (result && result.success === false) {
      console.log('⚠️ Fit score calculation returned success=false, using fallback values');
      return {
        fitScore: result.fitScore || 0,
        breakdown: result.breakdown || {},
        strengths: result.strengths || [],
        gaps: result.gaps || [],
        recommendation: result.recommendation || 'Error calculating fit'
      };
    }

    // If result has fitScore, use it (even if success is undefined)
    if (result && (result.fitScore !== undefined || result.success === true)) {
      console.log(`✅ Fit score calculated: ${result.fitScore || 0}%`);
      return {
        fitScore: result.fitScore || 0,
        breakdown: result.breakdown || {},
        strengths: result.strengths || [],
        gaps: result.gaps || [],
        recommendation: result.recommendation || 'Consider'
      };
    }

    // Fallback if result format is unexpected
    console.log('⚠️ Unexpected result format, using defaults');
    return {
      fitScore: 0,
      breakdown: {},
      strengths: [],
      gaps: [],
      recommendation: 'Error calculating fit'
    };
  } catch (error) {
    console.error('❌ Candidate fit calculation error:', error.message);
    console.error('   Stack:', error.stack?.substring(0, 200));
    return { 
      fitScore: 0, 
      breakdown: {}, 
      strengths: [], 
      gaps: [], 
      recommendation: 'Error calculating fit' 
    };
  }
}

// Update application status
router.patch('/application/:applicationId/status', auth, checkHirer, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!['applied', 'shortlisted', 'rejected', 'interview', 'offer'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = status;
    await application.save();

    // Update user performance
    const user = await User.findById(application.userId);
    if (user) {
      if (status === 'shortlisted') {
        user.performance.shortlisted += 1;
      } else if (status === 'rejected') {
        user.performance.rejected += 1;
      }
      await user.save();
    }

    res.json({ success: true, application });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * =============================================================================
 *                     ANALYZE RESUME (ATS + PROJECTS)
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Analyzes a candidate's resume for:
 * 1. ATS (Applicant Tracking System) friendliness
 * 2. Project relevance and usefulness for the company
 * 
 * 🔗 FLOW:
 * --------
 * 1. Gets candidate's resume data
 * 2. Calls AI service to analyze ATS compatibility
 * 3. Calls AI service to analyze project relevance
 * 4. Returns comprehensive analysis
 * 
 * 📌 REQUEST:
 * -----------
 * POST /api/hirer/analyze-resume/:applicationId
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "atsAnalysis": {
 *     "score": 85,
 *     "isATSFriendly": true,
 *     "strengths": [...],
 *     "improvements": [...]
 *   },
 *   "projectAnalysis": {
 *     "relevantProjects": [...],
 *     "usefulForCompany": true,
 *     "projectScores": [...]
 *   }
 * }
 * 
 * =============================================================================
 */
router.post('/analyze-resume/:applicationId', auth, checkHirer, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    // Get application
    const application = await Application.findById(applicationId)
      .populate('userId', 'resumeId resumeData name email')
      .populate('jobId', 'title company description skills qualifications experience');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const candidate = application.userId;
    const job = application.jobId;
    
    if (!candidate.resumeId || !candidate.resumeData) {
      return res.status(400).json({ error: 'Candidate has not uploaded a resume' });
    }
    
    // Analyze ATS friendliness
    const atsAnalysis = await analyzeATS(candidate.resumeData);
    
    // Analyze project relevance
    const projectAnalysis = await analyzeProjects(candidate.resumeData, job);
    
    res.json({
      success: true,
      candidate: {
        name: candidate.name,
        email: candidate.email
      },
      job: {
        title: job.title,
        company: job.company
      },
      atsAnalysis,
      projectAnalysis,
      fitScore: application.fitScore,
      fitDetails: application.fitDetails
    });
  } catch (error) {
    console.error('Analyze resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * =============================================================================
 *                     GET AI HIRING RECOMMENDATION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Generates AI-powered hiring recommendation using LangGraph workflow.
 * Considers: ATS score, Agentic score, Project score, Profile matching,
 * Experience, and College tier (TIER 1, TIER 2, TIER 3).
 * 
 * 🔗 FLOW:
 * --------
 * 1. Gets application and candidate data
 * 2. Gets existing analysis (ATS, Projects, Fit Score)
 * 3. Calls LangGraph workflow for comprehensive decision
 * 4. Returns AI recommendation with reasoning
 * 
 * 📌 REQUEST:
 * -----------
 * POST /api/hirer/ai-recommendation/:applicationId
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "success": true,
 *   "recommendation": "Strong Accept" | "Accept" | "Consider" | "Reject",
 *   "confidence_score": 85,
 *   "reasoning": "detailed explanation",
 *   "key_factors": [...],
 *   "strengths": [...],
 *   "concerns": [...],
 *   "suggestion": "specific hiring suggestion",
 *   "analysis": {
 *     "ats_score": 85,
 *     "profile_match_score": 75,
 *     "college_tier": "TIER 1",
 *     "experience_level": "Medium",
 *     "project_score": 80,
 *     "agentic_score": 75
 *   }
 * }
 * 
 * =============================================================================
 */
router.post('/ai-recommendation/:applicationId', auth, checkHirer, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    // Set timeout for long-running AI operation (5 minutes)
    req.setTimeout(300000);
    res.setTimeout(300000);
    
    // Get application
    const application = await Application.findById(applicationId)
      .populate('userId', 'resumeId resumeData name email')
      .populate('jobId', 'title company description skills qualifications experience');
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    const candidate = application.userId;
    const job = application.jobId;
    
    if (!candidate.resumeId || !candidate.resumeData) {
      return res.status(400).json({ error: 'Candidate has not uploaded a resume' });
    }
    
    // Get existing analysis (or calculate if needed)
    let atsAnalysis = null;
    let projectAnalysis = null;
    let agenticScore = application.fitScore || 0;
    let agenticDetails = application.fitDetails || {};
    
    // If fit score not calculated or invalid, calculate it
    // Check if agenticDetails is empty object or missing required fields
    const hasValidDetails = agenticDetails && 
                            typeof agenticDetails === 'object' && 
                            Object.keys(agenticDetails).length > 0 &&
                            (agenticDetails.breakdown || agenticDetails.fitScore !== undefined);
    
    if (agenticScore === 0 || !hasValidDetails) {
      console.log('📊 Calculating agentic score (fit score)...');
      try {
        const fitResult = await calculateCandidateFit(candidate, job);
        agenticScore = fitResult.fitScore || 0;
        agenticDetails = fitResult;
        console.log(`✅ Agentic score calculated: ${agenticScore}%`);
        
        // Save to application for future use
        application.fitScore = agenticScore;
        application.fitDetails = agenticDetails;
        await application.save();
      } catch (error) {
        console.error('❌ Error calculating agentic score:', error);
        // Use defaults if calculation fails
        agenticScore = agenticScore || 0;
        agenticDetails = agenticDetails || {
          breakdown: {},
          strengths: [],
          gaps: [],
          recommendation: 'Error calculating fit'
        };
      }
    } else {
      console.log(`✅ Using existing agentic score: ${agenticScore}%`);
    }
    
    // Check if ATS and Project analysis already exist (from previous "Analyze Resume" call)
    // This avoids duplicate work - if recruiter already analyzed, reuse the results
    const existingAnalysis = req.body.existing_analysis; // Frontend can pass this
    
    if (existingAnalysis && existingAnalysis.atsAnalysis) {
      console.log('✅ Using existing ATS analysis');
      atsAnalysis = existingAnalysis.atsAnalysis;
    } else {
      // Only calculate if not already done
      atsAnalysis = await analyzeATS(candidate.resumeData);
    }
    
    if (existingAnalysis && existingAnalysis.projectAnalysis) {
      console.log('✅ Using existing project analysis');
      projectAnalysis = existingAnalysis.projectAnalysis;
    } else {
      // Only calculate if not already done
      projectAnalysis = await analyzeProjects(candidate.resumeData, job);
    }
    
    // Call LangGraph workflow for AI recommendation
    // Pass pre-calculated ATS and project analysis to avoid duplicate work
    console.log(`🤖 Generating AI recommendation for ${candidate.name}...`);
    console.log(`   Using pre-calculated ATS: ${atsAnalysis ? 'Yes' : 'No'}`);
    console.log(`   Using pre-calculated Projects: ${projectAnalysis ? 'Yes' : 'No'}`);
    
    const aiRecommendation = await aiService.getRecruiterDecision(
      candidate.resumeData,
      {
        title: job.title,
        company: job.company,
        description: job.description,
        skills: job.skills || [],
        qualifications: job.qualifications || {},
        experience: job.experience || {}
      },
      agenticScore,
      agenticDetails,
      projectAnalysis,
      applicationId,
      candidate.name,
      atsAnalysis  // Pass pre-calculated ATS analysis
    );
    
    if (!aiRecommendation.success) {
      return res.status(500).json({ 
        error: aiRecommendation.error || 'Failed to generate AI recommendation' 
      });
    }
    
    res.json({
      success: true,
      candidate: {
        name: candidate.name,
        email: candidate.email
      },
      job: {
        title: job.title,
        company: job.company
      },
      recommendation: aiRecommendation.recommendation,
      confidence_score: aiRecommendation.confidence_score,
      reasoning: aiRecommendation.reasoning,
      key_factors: aiRecommendation.key_factors,
      strengths: aiRecommendation.strengths,
      concerns: aiRecommendation.concerns,
      suggestion: aiRecommendation.suggestion,
      analysis: aiRecommendation.analysis || {},
      // Include detailed analysis
      atsAnalysis: aiRecommendation.analysis?.ats_analysis || atsAnalysis,
      projectAnalysis: projectAnalysis,
      agenticScore: agenticScore,
      agenticDetails: agenticDetails
    });
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * =============================================================================
 *                     ANALYZE ATS FRIENDLINESS
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Analyzes if resume is ATS-friendly using AI.
 * 
 * ATS-friendly criteria:
 * - Proper formatting (no images, proper sections)
 * - Keywords matching job description
 * - Standard file format (PDF)
 * - Clear structure
 * - No complex tables/graphics
 * 
 * =============================================================================
 */
async function analyzeATS(resumeData) {
  try {
    // Call AI service endpoint for ATS analysis
    // This avoids needing openai package in backend
    const response = await aiService.callAI(`Analyze this resume for ATS (Applicant Tracking System) friendliness.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Evaluate:
1. Formatting (sections, structure, clarity)
2. Keyword optimization
3. File compatibility
4. Readability by ATS systems

Return ONLY valid JSON in this exact format:
{
  "score": 0-100,
  "isATSFriendly": true/false,
  "strengths": ["list of strengths"],
  "improvements": ["list of improvements"],
  "details": "detailed explanation"
}`);
    
    // Try to parse JSON (handle cases where AI returns markdown or extra text)
    let analysis;
    try {
      // Try direct parse first
      analysis = JSON.parse(response);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in response
        const jsonObjMatch = response.match(/\{[\s\S]*\}/);
        if (jsonObjMatch) {
          analysis = JSON.parse(jsonObjMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
    }
    
    return {
      score: analysis.score || 0,
      isATSFriendly: analysis.isATSFriendly || false,
      strengths: analysis.strengths || [],
      improvements: analysis.improvements || [],
      details: analysis.details || ''
    };
  } catch (error) {
    console.error('ATS analysis error:', error.message);
    // Return graceful fallback instead of failing completely
    return {
      score: 0,
      isATSFriendly: false,
      strengths: [],
      improvements: ['Unable to analyze ATS compatibility. AI service may be unavailable.'],
      details: 'Analysis failed. The AI recommendation will still work, but ATS analysis is unavailable.'
    };
  }
}

/**
 * =============================================================================
 *                     ANALYZE PROJECT RELEVANCE
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Analyzes candidate's projects to determine:
 * 1. Which projects are relevant to the job
 * 2. How useful projects are for the company
 * 3. Project quality and impact
 * 
 * =============================================================================
 */
async function analyzeProjects(resumeData, job) {
  try {
    const projects = resumeData.projects || [];
    
    if (!projects || projects.length === 0) {
      return {
        relevantProjects: [],
        usefulForCompany: false,
        projectScores: [],
        summary: 'No projects found in resume'
      };
    }
    
    const prompt = `Analyze these projects from a candidate's resume and determine their relevance to this job.

Job Requirements:
Title: ${job.title}
Company: ${job.company}
Description: ${job.description}
Required Skills: ${JSON.stringify(job.skills || [])}

Candidate Projects:
${JSON.stringify(projects, null, 2)}

For each project, evaluate:
1. Relevance to job requirements (0-100)
2. Technical complexity
3. Usefulness for the company
4. Quality and impact

Return ONLY valid JSON in this exact format:
{
  "relevantProjects": [
    {
      "name": "project name",
      "relevanceScore": 0-100,
      "usefulForCompany": true/false,
      "reasons": ["why relevant/not relevant"],
      "technologies": ["tech stack"],
      "complexity": "low/medium/high"
    }
  ],
  "usefulForCompany": true/false,
  "summary": "overall assessment"
}`;

    const response = await aiService.callAI(prompt);
    
    // Try to parse JSON (handle cases where AI returns markdown or extra text)
    let analysis;
    try {
      // Try direct parse first
      analysis = JSON.parse(response);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in response
        const jsonObjMatch = response.match(/\{[\s\S]*\}/);
        if (jsonObjMatch) {
          analysis = JSON.parse(jsonObjMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
    }
    
    return {
      relevantProjects: analysis.relevantProjects || [],
      usefulForCompany: analysis.usefulForCompany || false,
      projectScores: analysis.relevantProjects || [],
      summary: analysis.summary || 'Project analysis completed'
    };
  } catch (error) {
    console.error('Project analysis error:', error);
    return {
      relevantProjects: [],
      usefulForCompany: false,
      projectScores: [],
      summary: 'Project analysis failed'
    };
  }
}

/**
 * =============================================================================
 *                     RECALCULATE FIT SCORE
 * =============================================================================
 * 
 * Manually trigger fit score calculation for a candidate
 * 
 * =============================================================================
 */
router.post('/recalculate-fit-score/:applicationId', auth, checkHirer, async (req, res) => {
  try {
    const { applicationId } = req.params;

    // Get application
    const application = await Application.findById(applicationId)
      .populate('userId', 'resumeId resumeData name email')
      .populate('jobId', 'title company description skills qualifications experience');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const candidate = application.userId;
    const job = application.jobId;

    if (!candidate.resumeId || !candidate.resumeData) {
      return res.status(400).json({ error: 'Candidate has not uploaded a resume' });
    }

    // Calculate fit score
    console.log(`🔄 Manually recalculating fit score for application ${applicationId}...`);
    const fitResult = await calculateCandidateFit(candidate, job);

    // Save to application
    application.fitScore = fitResult.fitScore || 0;
    application.fitDetails = fitResult;
    await application.save();

    console.log(`✅ Fit score recalculated: ${fitResult.fitScore}%`);

    res.json({
      success: true,
      fitScore: fitResult.fitScore || 0,
      fitDetails: fitResult
    });
  } catch (error) {
    console.error('Recalculate fit score error:', error);
    res.status(500).json({ error: 'Failed to calculate fit score' });
  }
});

module.exports = router;

