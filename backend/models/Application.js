/**
 * ===================================================================================
 *                    APPLICATION MODEL - Database Schema for Job Applications
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file defines the Application database schema using Mongoose.
 * It represents a user's application to a specific job.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Links a User to a Job (many-to-many relationship)
 * 2. Stores application status and fit score
 * 3. Prevents duplicate applications (unique index)
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User applies to job → New Application document created
 * - Fit score calculated → Stored in application.fitScore
 * - Status updated → application.status changes (applied → shortlisted → etc.)
 * - User views applications → All applications fetched for that user
 * 
 * ===================================================================================
 */

const mongoose = require('mongoose');

/**
 * =============================================================================
 *                     APPLICATION SCHEMA DEFINITION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Defines the structure of an Application document in MongoDB.
 * Each application links a user to a job with status and fit score.
 * 
 * 🔗 WHAT HAPPENS:
 * ---------------
 * When a user applies to a job, MongoDB stores a document with these fields.
 * The unique index prevents applying to the same job twice.
 * 
 * =============================================================================
 */
const applicationSchema = new mongoose.Schema({
  // Reference to the User who applied
  // ref: 'User' - Creates relationship with User model
  // required: Yes - every application must have a user
  // Used in: Fetching all applications for a user, populating user data
  userId: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId
    ref: 'User',                             // References User model
    required: true                           // Cannot create application without user
  },
  
  // Reference to the Job being applied to
  // ref: 'Job' - Creates relationship with Job model
  // required: Yes - every application must have a job
  // Used in: Fetching job details, populating job data
  jobId: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId
    ref: 'Job',                             // References Job model
    required: true                          // Cannot create application without job
  },
  
  // Application status (tracking the hiring process)
  // enum: Only allows these specific values
  // default: 'applied' - Initial status when user applies
  // Used in: Dashboard, application tracking, filtering
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'rejected', 'interview', 'offer'],  // Only these values
    default: 'applied'  // Default status when application is created
  },
  
  // AI-calculated fit score (0-100%)
  // Calculated when user applies (or when resume is uploaded)
  // 0 = No match, 100 = Perfect match
  // Used in: Job recommendations, sorting applications
  fitScore: {
    type: Number,
    default: 0  // No score initially (calculated after application)
  },
  
  // Detailed fit score breakdown
  // Stores: { breakdown: {...}, strengths: [...], gaps: [...] }
  // Mixed type allows any JSON structure
  // Used in: Showing why score is high/low, displaying strengths and gaps
  fitDetails: {
    type: mongoose.Schema.Types.Mixed,  // Can store any JSON structure
    default: null                        // No details initially
  },
  
  // Date when user applied to this job
  // default: Date.now - Current date/time when application is created
  // Used in: Sorting applications by date, showing "Applied X days ago"
  appliedAt: {
    type: Date,
    default: Date.now  // Current date/time automatically
  },
  
  // Optional notes about the application
  // Can be used by hirer or user to add notes
  // Used in: Application details, hirer dashboard
  notes: {
    type: String,
    default: ''  // Empty string if no notes
  }
}, {
  // timestamps: true automatically adds createdAt and updatedAt fields
  timestamps: true
});

/**
 * =============================================================================
 *                     UNIQUE INDEX (PREVENTS DUPLICATE APPLICATIONS)
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Creates a unique compound index on userId + jobId.
 * This prevents a user from applying to the same job twice.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * MongoDB enforces uniqueness at the database level.
 * If you try to create a second application with the same userId + jobId,
 * MongoDB will reject it with a duplicate key error.
 * 
 * 📌 WHAT HAPPENS:
 * ---------------
 * - User applies to Job A → Application created (userId: 123, jobId: 456)
 * - User tries to apply again → MongoDB error: duplicate key
 * - Backend catches error → Returns "Already applied" message
 * 
 * =============================================================================
 */
// Prevent duplicate applications
// This creates a unique index on the combination of userId and jobId
// Result: A user can only apply to a job once
// If duplicate is attempted, MongoDB throws error
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

// Export the Application model so it can be used in other files
// mongoose.model() creates a model from the schema
// 'Application' = collection name in MongoDB (will be 'applications' - Mongoose pluralizes)
module.exports = mongoose.model('Application', applicationSchema);

