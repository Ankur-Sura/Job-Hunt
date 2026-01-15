/**
 * ===================================================================================
 *                    USER JOB MATCH MODEL - Cached Fit Scores
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Mongoose schema for caching AI-calculated fit scores between users and jobs.
 * This prevents recalculating scores repeatedly, improving performance.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. When user uploads resume → Background job calculates fit scores for all jobs
 * 2. Scores are stored in this collection (cached)
 * 3. When user views jobs → Scores fetched from cache (fast)
 * 4. When user updates resume → Old scores deleted, new ones calculated
 * 
 * 📌 WHY IT'S NEEDED:
 * -------------------
 * - Fit score calculation is expensive (AI processing)
 * - Caching avoids recalculating for every page load
 * - Improves response time from minutes to milliseconds
 * 
 * ===================================================================================
 */

// Line 1: Import mongoose library
// mongoose = MongoDB object modeling library for Node.js
// Provides schema definition, validation, and database operations
const mongoose = require('mongoose');

// Line 3: Define Mongoose schema for UserJobMatch collection
// Schema = Blueprint for documents in MongoDB collection
// Each document represents one user-job match score
const userJobMatchSchema = new mongoose.Schema({
  // Line 4: userId field - Reference to User document
  // type = MongoDB ObjectId type (unique identifier)
  // ref = Reference to 'User' model (allows population)
  // required = Field must be present when creating document
  // index = Creates database index for faster queries
  userId: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId type
    ref: 'User',                             // Reference to User model
    required: true,                          // Must be provided
    index: true                              // Create index for fast lookups
  },
  // Line 10: jobId field - Reference to Job document
  // Links this match score to a specific job
  jobId: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId type
    ref: 'Job',                             // Reference to Job model
    required: true,                          // Must be provided
    index: true                              // Create index for fast lookups
  },
  // Line 16: fitScore field - Overall match percentage (0-100)
  // Calculated by AI based on skills, experience, education, alignment
  fitScore: {
    type: Number,      // Numeric type
    required: true,    // Must be provided
    min: 0,            // Minimum value is 0
    max: 100           // Maximum value is 100
  },
  // Line 22: breakdown field - Detailed score breakdown
  // Shows individual component scores (skills, experience, education, alignment)
  breakdown: {
    skillsMatch: { type: Number, default: 0 },        // Skills matching score (0-100)
    experienceMatch: { type: Number, default: 0 },    // Experience matching score (0-100)
    educationMatch: { type: Number, default: 0 },       // Education matching score (0-100)
    overallAlignment: { type: Number, default: 0 }   // Overall alignment score (0-100)
  },
  // Line 28: strengths array - List of candidate's strengths for this job
  // Example: ["Strong Python skills", "Relevant project experience"]
  strengths: [{
    type: String  // Array of strings
  }],
  // Line 31: gaps array - List of areas where candidate lacks requirements
  // Example: ["Missing AWS experience", "No system design experience"]
  gaps: [{
    type: String  // Array of strings
  }],
  // Line 34: recommendation field - AI recommendation text
  // Enum = Only allows specific values (prevents invalid data)
  recommendation: {
    type: String,  // String type
    enum: ['Highly recommended', 'Recommended', 'Consider', 'Not recommended', 'Error calculating fit'],  // Allowed values only
    default: 'Consider'  // Default value if not provided
  },
  // Line 39: calculatedAt field - Timestamp when score was calculated
  // Used to determine if score is stale and needs recalculation
  calculatedAt: {
    type: Date,              // Date type
    default: Date.now,        // Default to current date/time
    index: true              // Create index for fast date-based queries
  }
}, {
  // Line 44: Schema options
  // timestamps = Automatically adds createdAt and updatedAt fields
  timestamps: true
});

// Line 48: Create compound index on userId + jobId
// Compound index = Index on multiple fields together
// unique = Ensures one score per user-job pair (prevents duplicates)
// This makes lookups like "get score for user X and job Y" very fast
userJobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Line 51: Export Mongoose model
// Model = Constructor function for creating/querying documents
// 'UserJobMatch' = Model name (collection name will be 'userjobmatches')
// userJobMatchSchema = Schema definition to use
module.exports = mongoose.model('UserJobMatch', userJobMatchSchema);

