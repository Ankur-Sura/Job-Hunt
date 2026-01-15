/**
 * ===================================================================================
 *                    JOB MODEL - Database Schema for Job Listings
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file defines the Job database schema using Mongoose.
 * It defines what data a job listing can have and how it's stored in MongoDB.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Defines the structure of job documents in MongoDB
 * 2. Creates text indexes for fast search
 * 3. Validates data before saving
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Hirer posts job → New Job document created
 * - User searches jobs → MongoDB uses text index for fast search
 * - User applies → Application document created (separate model)
 * - AI calculates fit score → Uses job.skills, job.experience, etc.
 * 
 * ===================================================================================
 */

const mongoose = require('mongoose');

/**
 * =============================================================================
 *                     JOB SCHEMA DEFINITION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Defines the structure of a Job document in MongoDB.
 * Each field represents a piece of information about the job.
 * 
 * 🔗 WHAT HAPPENS:
 * ---------------
 * When a hirer posts a job, MongoDB stores a document with these fields.
 * The AI service uses this data to calculate fit scores.
 * 
 * =============================================================================
 */
const jobSchema = new mongoose.Schema({
  // Company name (e.g., "Google", "Microsoft")
  // Required: Yes - every job must have a company
  // trim: Removes whitespace
  // Used in: Job listings, fit score calculation, interview prep
  company: {
    type: String,
    required: true,  // Cannot create job without company name
    trim: true      // Removes leading/trailing spaces
  },
  
  // URL to company logo image
  // Optional: Defaults to empty string if not provided
  // Used in: Frontend to display company logo
  companyLogo: {
    type: String,
    default: ''  // No logo by default
  },
  
  // Job title (e.g., "Software Engineer", "Data Scientist")
  // Required: Yes - every job must have a title
  // trim: Removes whitespace
  // Used in: Job listings, search, fit score calculation, interview prep
  title: {
    type: String,
    required: true,  // Cannot create job without title
    trim: true      // Removes whitespace
  },
  
  // Job location (e.g., "Bangalore, India", "Remote")
  // Required: Yes - users need to know where the job is
  // Used in: Job listings, filtering
  location: {
    type: String,
    required: true  // Cannot create job without location
  },
  // Work mode (On-Site, Remote, Hybrid, Work From Home)
  // enum: Only allows these specific values
  // default: 'On-Site' - Most jobs are on-site
  // Used in: Job listings, filtering
  jobMode: {
    type: String,
    enum: ['On-Site', 'Remote', 'Hybrid', 'Work From Home'],  // Only these values allowed
    default: 'On-Site'  // Default work mode
  },
  
  // Salary information
  // min/max: Numeric salary range (for calculations)
  // currency: Currency code (INR, USD, etc.)
  // display: Human-readable salary string (e.g., "₹10-15 LPA")
  // Used in: Job listings, filtering
  salary: {
    min: { type: Number, default: null },      // Minimum salary (null if not specified)
    max: { type: Number, default: null },      // Maximum salary (null if not specified)
    currency: { type: String, default: 'INR' }, // Currency code
    display: { type: String, default: 'Not Disclosed' }  // Display string for UI
  },
  
  // Experience requirements
  // min/max: Numeric experience range (for fit score calculation)
  // display: Human-readable string (e.g., "2-4 years")
  // Required: Yes - needed for fit score calculation
  // Used in: Fit score calculation (30% weight), job listings
  experience: {
    min: { type: Number, default: 0 },        // Minimum years (0 for freshers)
    max: { type: Number, default: null },      // Maximum years (null = no max)
    display: { type: String, required: true } // Display string (e.g., "2-4 years")
  },
  // Job type (Full Time, Part Time, Contract, Internship)
  // enum: Only allows these specific values
  // default: 'Full Time' - Most jobs are full-time
  // Used in: Job listings, filtering, prioritizing internships for freshers
  jobType: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Contract', 'Internship'],  // Only these values
    default: 'Full Time'  // Default job type
  },
  
  // Full job description
  // Required: Yes - users need to know what the job entails
  // Can be long text (multiple paragraphs)
  // Used in: Job details page, AI fit score calculation, interview prep
  description: {
    type: String,
    required: true  // Cannot create job without description
  },
  
  // Array of job requirements
  // Example: ["Bachelor's degree in CS", "Strong problem-solving skills"]
  // Used in: Job details page, fit score calculation
  requirements: {
    type: [String],  // Array of strings
    default: []      // Empty array if no requirements specified
  },
  
  // Array of required skills
  // Example: ["Python", "JavaScript", "React", "Node.js"]
  // Required for: Fit score calculation (40% weight - most important)
  // Used in: Job matching, fit score calculation, job listings
  skills: {
    type: [String],  // Array of skill names
    default: []      // Empty array if no skills specified
  },
  // Educational qualifications
  // basic: Required qualifications (e.g., "Bachelor's in CS")
  // preferred: Nice-to-have qualifications (e.g., "Master's degree")
  // Used in: Fit score calculation (20% weight for education match)
  qualifications: {
    basic: { type: [String], default: [] },     // Required qualifications
    preferred: { type: [String], default: [] }  // Preferred qualifications
  },
  
  // Date when applications start being accepted
  // default: Date.now - Applications start immediately
  // Used in: Job listings, filtering active jobs
  applicationStartDate: {
    type: Date,
    default: Date.now  // Current date/time when job is created
  },
  
  // Date when applications close
  // Required: Yes - need to know when to stop accepting applications
  // Used in: Job listings, filtering active jobs
  applicationEndDate: {
    type: Date,
    required: true  // Must specify when applications close
  },
  
  // Job posting status
  // enum: Only allows these specific values
  // default: 'Hiring Now' - Job is actively hiring
  // Used in: Job listings, filtering
  status: {
    type: String,
    enum: ['Hiring Now', 'Easy Apply', 'Closed'],  // Only these values
    default: 'Hiring Now'  // Default status
  },
  // Number of times this job has been viewed
  // Incremented when user views job details
  // Used in: Analytics, popular jobs
  views: {
    type: Number,
    default: 0  // No views initially
  },
  
  // Number of applications received for this job
  // Incremented when user applies
  // Used in: Analytics, job popularity
  applications: {
    type: Number,
    default: 0  // No applications initially
  },
  
  // Array of tags for categorization
  // Example: ["AI/ML", "Backend", "Startup"]
  // Used in: Job listings, filtering, search
  tags: {
    type: [String],  // Array of tag names
    default: []     // Empty array if no tags
  },
  
  // Flag indicating if this is an internship position
  // Used to prioritize internships for freshers (no work experience)
  // Set automatically based on jobType or manually
  isInternship: {
    type: Boolean,
    default: false  // Not an internship by default
  },
  
  // Reference to the User who posted this job (hirer)
  // ref: 'User' - Creates relationship with User model
  // null = Job was seeded (not posted by a user)
  // Used in: Hirer dashboard, job management
  hirerId: {
    type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId
    ref: 'User',                            // References User model
    default: null                           // No hirer initially (seeded jobs)
  }
}, {
  // timestamps: true automatically adds createdAt and updatedAt fields
  timestamps: true
});

/**
 * =============================================================================
 *                     TEXT SEARCH INDEX
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Creates a text index on title, company, description, and skills fields.
 * This allows fast full-text search across these fields.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * When you search for "Python developer", MongoDB can quickly find jobs
 * where "Python" appears in title, company, description, or skills.
 * 
 * 📌 USAGE:
 * ---------
 * Job.find({ $text: { $search: "Python developer" } })
 * 
 * This is much faster than searching each field individually.
 * 
 * =============================================================================
 */
// Create text index for fast full-text search
// This allows searching across title, company, description, and skills
// Example: Search "Python" will find jobs with Python in any of these fields
jobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });

// Export the Job model so it can be used in other files
// mongoose.model() creates a model from the schema
// 'Job' = collection name in MongoDB (will be 'jobs' - Mongoose pluralizes)
module.exports = mongoose.model('Job', jobSchema);

