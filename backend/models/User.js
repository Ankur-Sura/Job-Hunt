/**
 * ===================================================================================
 *                    USER MODEL - Database Schema for Users
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file defines the User database schema using Mongoose (MongoDB ODM).
 * It defines what data a user can have and how it's stored in MongoDB.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Defines the structure of user documents in MongoDB
 * 2. Automatically hashes passwords before saving (security)
 * 3. Provides method to compare passwords (for login)
 * 4. Creates indexes for fast queries
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User registers → New User document created with hashed password
 * - User logs in → Password compared using comparePassword method
 * - User uploads resume → resumeId and resumeData fields updated
 * - User applies to job → Application document created (separate model)
 * 
 * ===================================================================================
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * =============================================================================
 *                     USER SCHEMA DEFINITION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Defines the structure of a User document in MongoDB.
 * Each field has a type, validation rules, and default values.
 * 
 * 🔗 WHAT HAPPENS:
 * ---------------
 * When you create a new user, MongoDB stores a document with these fields.
 * Mongoose validates the data before saving.
 * 
 * =============================================================================
 */
const userSchema = new mongoose.Schema({
  // User's full name
  // Required: Yes - user must provide a name
  // trim: true - Removes whitespace from beginning and end
  // Example: "  John Doe  " becomes "John Doe"
  name: {
    type: String,
    required: true,  // Cannot create user without name
    trim: true      // Auto-removes leading/trailing spaces
  },
  
  // User's email address (used for login)
  // Required: Yes - needed for authentication
  // unique: true - No two users can have same email (MongoDB index)
  // lowercase: true - Converts "John@Example.com" to "john@example.com"
  // trim: true - Removes whitespace
  // Example: "  JOHN@EXAMPLE.COM  " becomes "john@example.com"
  email: {
    type: String,
    required: true,   // Cannot create user without email
    unique: true,     // MongoDB creates index - prevents duplicates
    lowercase: true,  // Converts to lowercase automatically
    trim: true       // Removes whitespace
  },
  
  // User's password (will be hashed before saving)
  // Required: Yes - needed for authentication
  // minlength: 6 - Password must be at least 6 characters
  // NOTE: Password is NOT stored as plain text - see pre('save') hook below
  password: {
    type: String,
    required: true,   // Cannot create user without password
    minlength: 6     // Validation: password must be 6+ characters
  },
  // User's role in the system
  // enum: Only allows 'user' or 'hirer' values
  // default: 'user' - New users are regular users by default
  // 'user' = Job seeker, 'hirer' = Company posting jobs
  role: {
    type: String,
    enum: ['user', 'hirer'],  // Only these two values allowed
    default: 'user'            // Default role for new users
  },
  
  // PDF ID from Qdrant vector database
  // This is the ID of the uploaded resume stored in Qdrant
  // Used to retrieve resume embeddings for RAG (Retrieval Augmented Generation)
  // null = User hasn't uploaded a resume yet
  resumeId: {
    type: String,    // Stores the PDF ID from Qdrant
    default: null    // No resume uploaded initially
  },
  // Profile completion tracking
  // Each field represents completion percentage (0-100)
  // Used to show progress bar on dashboard
  // Example: { completion: 75, education: 100, skills: 50, ... }
  profile: {
    completion: {
      type: Number,
      default: 0  // Overall profile completion percentage
    },
    achievements: { type: Number, default: 0 },  // Achievements section completion
    education: { type: Number, default: 0 },     // Education section completion
    experience: { type: Number, default: 0 },    // Experience section completion
    certificates: { type: Number, default: 0 },  // Certificates section completion
    skills: { type: Number, default: 0 },         // Skills section completion
    resume: { type: Number, default: 0 },         // Resume upload completion (0 or 100)
    socialMedia: { type: Number, default: 0 }     // Social media links completion
  },
  
  // User's job application performance metrics
  // Tracked automatically when user applies to jobs
  // Used to show statistics on dashboard
  performance: {
    jobProfileScore: { type: Number, default: 0 },      // Average fit score across all applications
    opportunitiesApplied: { type: Number, default: 0 }, // Total number of applications
    shortlisted: { type: Number, default: 0 },           // Number of shortlisted applications
    rejected: { type: Number, default: 0 }                // Number of rejected applications
  },
  
  // Flag indicating if user has internship experience
  // Used to prioritize internship jobs for freshers
  // Set to true when resume is processed and internship is detected
  hasInternship: {
    type: Boolean,
    default: false  // No internship experience initially
  },
  
  // Extracted resume data (skills, experience, education, etc.)
  // Stored as JSON object (Mixed type allows any structure)
  // Populated when resume is processed by AI service
  // Used for job matching and fit score calculation
  resumeData: {
    type: mongoose.Schema.Types.Mixed,  // Can store any JSON structure
    default: null                        // No resume data initially
  }
}, {
  // timestamps: true automatically adds createdAt and updatedAt fields
  // These fields are automatically managed by Mongoose
  // createdAt: Date when document was created
  // updatedAt: Date when document was last modified
  timestamps: true
});

/**
 * =============================================================================
 *                     PASSWORD HASHING MIDDLEWARE (PRE-SAVE HOOK)
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Automatically hashes the password BEFORE saving user to database.
 * This is a Mongoose "pre-save" hook that runs before every save operation.
 * 
 * 🔗 WHY IT'S NEEDED:
 * -------------------
 * Passwords should NEVER be stored in plain text (security risk).
 * If database is compromised, hashed passwords can't be easily reversed.
 * 
 * 🔗 WHAT HAPPENS:
 * ---------------
 * 1. User creates account with password "mypassword123"
 * 2. Before saving to database, this hook runs
 * 3. Password is hashed using bcrypt: "$2a$10$hashed_string..."
 * 4. Hashed password is saved to database (original password is never stored)
 * 
 * 📌 IMPORTANT:
 * -------------
 * - Only hashes if password was modified (not on every save)
 * - Uses bcrypt with 10 salt rounds (secure but not too slow)
 * - Original password is never stored in database
 * 
 * =============================================================================
 */
// Hash password before saving to database
userSchema.pre('save', async function(next) {
  // Check if password field was modified
  // If password wasn't changed, skip hashing (saves processing time)
  // This prevents re-hashing on every save (e.g., when updating profile)
  if (!this.isModified('password')) return next();
  
  // Hash the password using bcrypt
  // 10 = salt rounds (higher = more secure but slower)
  // This converts "mypassword123" to "$2a$10$hashed_string..."
  this.password = await bcrypt.hash(this.password, 10);
  
  // Call next() to continue with the save operation
  next();
});

/**
 * =============================================================================
 *                     PASSWORD COMPARISON METHOD
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Compares a plain text password (from login form) with the hashed password
 * stored in the database.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User enters password "mypassword123" in login form
 * 2. This method is called: user.comparePassword("mypassword123")
 * 3. bcrypt.compare() hashes the input and compares with stored hash
 * 4. Returns true if passwords match, false otherwise
 * 
 * 📌 USAGE:
 * ---------
 * const user = await User.findOne({ email });
 * const isMatch = await user.comparePassword(enteredPassword);
 * if (isMatch) { /* Login successful *\/ }
 * 
 * =============================================================================
 */
// Compare password method - used during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  // candidatePassword = plain text password from login form
  // this.password = hashed password from database
  // bcrypt.compare() hashes candidatePassword and compares with stored hash
  // Returns true if passwords match, false otherwise
  return await bcrypt.compare(candidatePassword, this.password);
};

// Export the User model so it can be used in other files
// mongoose.model() creates a model from the schema
// 'User' = collection name in MongoDB (will be 'users' - Mongoose pluralizes)
module.exports = mongoose.model('User', userSchema);

