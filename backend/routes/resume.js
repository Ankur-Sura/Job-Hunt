/**
 * ===================================================================================
 *                    RESUME ROUTES - Resume Upload and Processing
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file handles resume upload and processing:
 * - Upload PDF resume
 * - OCR text extraction
 * - AI data extraction (skills, experience, education)
 * - Trigger background job for fit score calculation
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User uploads PDF file
 * 2. Multer saves file to memory
 * 3. Backend sends file to AI service
 * 4. AI service: OCR → Extract text → Create embeddings → Store in Qdrant
 * 5. AI service: Extract structured data (skills, experience, etc.)
 * 6. Backend saves resumeId and resumeData to user
 * 7. Triggers background job to calculate fit scores for all jobs
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User uploads resume → File processed, data extracted, fit scores calculated
 * - Background job runs → Calculates scores for all 92+ jobs (takes 2-3 minutes)
 * - User sees recommendations → Top 5 jobs with fit scores displayed
 * 
 * ===================================================================================
 */

const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');
const { calculateAllJobMatches } = require('../services/backgroundJobs');

const router = express.Router();

/**
 * =============================================================================
 *                     MULTER CONFIGURATION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Configures multer middleware for handling file uploads.
 * 
 * 🔗 WHAT HAPPENS:
 * ---------------
 * - User selects PDF file → Multer receives it
 * - storage: memoryStorage() → File stored in RAM (not disk)
 * - limits: fileSize → Maximum 10MB file size
 * - File available in req.file.buffer
 * 
 * 📌 WHY MEMORY STORAGE:
 * ---------------------
 * - Faster (no disk I/O)
 * - File is sent directly to AI service
 * - No need to save to disk
 * 
 * =============================================================================
 */
// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),  // Store file in memory (RAM)
  limits: { fileSize: 10 * 1024 * 1024 }  // Maximum 10MB file size
});

/**
 * =============================================================================
 *                     UPLOAD RESUME ENDPOINT
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Handles resume PDF upload, processes it with AI, and triggers fit score calculation.
 * 
 * 🔗 FLOW:
 * --------
 * 1. Validate file was uploaded
 * 2. Check AI service health
 * 3. Upload PDF to AI service (OCR + RAG processing)
 * 4. Extract structured resume data (skills, experience, education)
 * 5. Detect if user has internship experience
 * 6. Update user document with resumeId and resumeData
 * 7. Trigger background job to calculate fit scores for all jobs
 * 8. Return success response
 * 
 * 📌 REQUEST:
 * -----------
 * POST /api/resume/upload
 * Headers: 
 *   - Authorization: Bearer <JWT_TOKEN>
 *   - Content-Type: multipart/form-data
 * Body: FormData with 'resume' field containing PDF file
 * 
 * 📌 RESPONSE:
 * ------------
 * {
 *   "success": true,
 *   "pdf_id": "resume_123",
 *   "resumeData": { skills: [...], experience: [...], ... },
 *   "hasInternship": false,
 *   "profile": { ... },
 *   "message": "Resume uploaded successfully! Calculating job matches..."
 * }
 * 
 * ⚠️ ERROR RESPONSES:
 * ------------------
 * - 400: No file uploaded
 * - 503: AI service unavailable
 * - 500: Upload/processing failed
 * 
 * =============================================================================
 */
// Upload resume endpoint - POST /api/resume/upload (Protected)
// upload.single('resume') = Multer middleware - expects file in 'resume' field
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // ========================================================================
    //                     STEP 1: VALIDATE FILE UPLOADED
    // ========================================================================
    // Check if file was actually uploaded
    // req.file is set by multer middleware
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // ========================================================================
    //                     STEP 2: CHECK AI SERVICE HEALTH
    // ========================================================================
    // Verify AI service is running before sending file
    // If AI service is down, return error immediately (don't waste time)
    // Use force=true to bypass cache and get fresh health status
    const isHealthy = await aiService.healthCheck(true);
    if (!isHealthy) {
      // Try one more time after a short delay (service might be starting up)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryHealthy = await aiService.healthCheck(true);
      if (!retryHealthy) {
        return res.status(503).json({ 
          error: 'AI service is unavailable. Please try again in a moment.' 
        });
      }
    }

    // ========================================================================
    //                     STEP 2.5: DELETE OLD RESUME FROM QDRANT
    // ========================================================================
    // If user already has a resume uploaded, delete old Qdrant documents
    // This prevents accumulation of old resume data in Qdrant
    // Old pdf_id is stored in req.user.resumeId
    if (req.user.resumeId) {
      console.log(`🗑️ Deleting old resume from Qdrant: ${req.user.resumeId}`);
      try {
        await aiService.deletePDF(req.user.resumeId);
        console.log(`✅ Old resume deleted from Qdrant`);
      } catch (error) {
        // Don't fail upload if deletion fails - just log warning
        // Old documents will remain but won't affect new resume
        console.warn(`⚠️ Failed to delete old resume from Qdrant: ${error.message}`);
      }
    }

    // ========================================================================
    //                     STEP 3: UPLOAD PDF TO AI SERVICE
    // ========================================================================
    // Send PDF file to AI service for processing
    // AI service will:
    //   1. Extract text using OCR (if scanned PDF)
    //   2. Chunk text into smaller pieces
    //   3. Create embeddings for each chunk
    //   4. Store embeddings in Qdrant vector database
    // Returns: { pdf_id, full_text, pages }
    const uploadResult = await aiService.uploadPDF(
      req.file.buffer,        // PDF file as buffer (binary data)
      req.file.originalname,   // Original filename
      req.file.mimetype        // MIME type (application/pdf)
    );

    // Check if upload was successful
    if (!uploadResult.success) {
      return res.status(500).json({ 
        error: uploadResult.error || 'Failed to upload resume' 
      });
    }

    // Extract data from upload result
    const { pdf_id, full_text, pages } = uploadResult.data;
    // pdf_id = ID in Qdrant (used for RAG queries)
    // full_text = Extracted text from PDF
    // pages = Number of pages

    // ========================================================================
    //                     STEP 4: EXTRACT STRUCTURED RESUME DATA
    // ========================================================================
    // Use AI (GPT-4) to extract structured data from resume text
    // Extracts: skills, experience, education, projects, etc.
    // This uses RAG (Retrieval Augmented Generation) for accurate extraction
    const extractResult = await aiService.extractResumeData(pdf_id, req.user._id);
    
    // Get extracted data (or fallback to raw text)
    let resumeData = extractResult.data;
    if (!resumeData) {
      // Fallback: If extraction failed, store raw text
      // User can still use resume, but no structured data
      resumeData = {
        rawText: full_text,
        extracted: false  // Flag indicating extraction failed
      };
    }

    // ========================================================================
    //                     STEP 5: DETECT INTERNSHIP EXPERIENCE
    // ========================================================================
    // Check if user has internship experience
    // Used to prioritize internship jobs for freshers
    // Searches for keywords in resume text and extracted data
    const hasInternship = 
      full_text.toLowerCase().includes('internship') ||      // Check full text
      full_text.toLowerCase().includes('intern') ||
      (resumeData.internships && resumeData.internships.length > 0) ||  // Check extracted data
      (resumeData.experience && JSON.stringify(resumeData.experience).toLowerCase().includes('intern'));

    // ========================================================================
    //                     STEP 6: UPDATE USER DOCUMENT
    // ========================================================================
    // Save resume information to user document
    // This makes resume data available for job matching
    req.user.resumeId = pdf_id;           // PDF ID in Qdrant
    req.user.resumeData = resumeData;     // Extracted structured data
    req.user.hasInternship = hasInternship; // Internship flag
    req.user.profile.resume = 20;         // Resume uploaded (profile completion)
    req.user.profile.completion = calculateProfileCompletion(req.user.profile);  // Recalculate overall completion
    await req.user.save();  // Save to MongoDB

    // ========================================================================
    //                     STEP 7: TRIGGER BACKGROUND JOB
    // ========================================================================
    // Calculate fit scores for ALL jobs in background
    // This runs asynchronously (doesn't block response)
    // Takes 2-3 minutes for 92+ jobs
    // User gets immediate response, scores calculated in background
    console.log('🚀 Triggering background job for match score calculation...');
    calculateAllJobMatches(req.user._id, resumeData, pdf_id)
      .then(() => {
        // Background job completed successfully
        // Fit scores are now cached in MongoDB
        console.log('✅ Background job completed successfully');
      })
      .catch(error => {
        // Background job failed (log error but don't fail the upload)
        // User can still use resume, scores will be calculated on-demand
        console.error('❌ Background job match calculation error:', error);
        console.error('Stack:', error.stack);
      });

    res.json({
      success: true,
      pdf_id,
      resumeData,
      hasInternship,
      profile: req.user.profile,
      message: 'Resume uploaded successfully! Calculating job matches in the background...'
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload resume' });
  }
});

// Get resume data
router.get('/data', auth, async (req, res) => {
  try {
    if (!req.user.resumeId) {
      return res.status(404).json({ error: 'No resume uploaded' });
    }

    res.json({
      resumeId: req.user.resumeId,
      resumeData: req.user.resumeData,
      hasInternship: req.user.hasInternship
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Recalculate all job match scores (manual trigger)
router.post('/recalculate-scores', auth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user.resumeId || !user.resumeData) {
      return res.status(400).json({ error: 'Please upload your resume first' });
    }

    // Trigger background job
    calculateAllJobMatches(user._id, user.resumeData, user.resumeId)
      .then(() => {
        console.log('✅ Manual recalculation completed for user:', user._id);
      })
      .catch(error => {
        console.error('❌ Manual recalculation error:', error);
      });

    res.json({
      success: true,
      message: 'Recalculating match scores for all jobs. This should take 45-90 seconds with optimized batch processing.'
    });
  } catch (error) {
    console.error('Recalculate scores error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Query resume
router.post('/query', auth, async (req, res) => {
  try {
    if (!req.user.resumeId) {
      return res.status(404).json({ error: 'No resume uploaded' });
    }

    const { question } = req.body;
    
    const result = await aiService.queryPDF(
      req.user.resumeId,
      question,
      `resume-${req.user._id}`
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error) {
    console.error('Resume query error:', error);
    res.status(500).json({ error: error.message || 'Failed to query resume' });
  }
});

function calculateProfileCompletion(profile) {
  const weights = {
    achievements: 10,
    education: 15,
    experience: 20,
    certificates: 10,
    skills: 15,
    resume: 20,
    socialMedia: 10
  };

  let total = 0;
  let maxTotal = 0;

  Object.keys(weights).forEach(key => {
    maxTotal += weights[key];
    if (profile[key] > 0) {
      total += weights[key];
    }
  });

  return Math.round((total / maxTotal) * 100);
}

module.exports = router;

