/**
 * =============================================================================
 *                    DELETEDUPLICATEAMAZONJOBS.JS - Cleanup Script
 * =============================================================================
 *
 * 📖 WHAT IS THIS SCRIPT?
 * ------------------------
 * This script deletes duplicate Amazon jobs from the database.
 * It keeps only the Amazon job(s) linked to the correct hirer (hire@gmail.com)
 * and removes all other Amazon jobs that are either:
 * 1. Not linked to any hirer
 * 2. Linked to a different hirer
 *
 * 🔗 HOW TO RUN:
 * --------------
 *     cd "/Users/ankursura/Desktop/Job Portal Project /backend"
 *     node scripts/deleteDuplicateAmazonJobs.js
 *
 * ⚠️ WARNING: This script DELETES data from the database!
 * Make sure you have a backup before running.
 *
 * 📌 WHAT IT DOES:
 * ---------------
 * 1. Connects to MongoDB
 * 2. Finds the correct hirer (hire@gmail.com)
 * 3. Finds all Amazon jobs in the database
 * 4. Identifies jobs to delete (not linked to correct hirer)
 * 5. Deletes associated applications first
 * 6. Deletes the duplicate jobs
 * 7. Shows remaining Amazon jobs
 *
 * =============================================================================
 */

// Line 1: Load environment variables from .env file
// require('dotenv').config() = Loads variables from .env file into process.env
// This allows accessing MONGODB_URI from environment variables
require('dotenv').config();
// Line 2: Import mongoose library
// mongoose = MongoDB object modeling library for Node.js
// Provides schema validation, middleware, and query building
const mongoose = require('mongoose');
// Line 3: Import Job model
// Job = Mongoose model for job documents in MongoDB
// Used to query and manipulate job data
const Job = require('../models/Job');
// Line 4: Import Application model
// Application = Mongoose model for application documents in MongoDB
// Used to delete applications associated with jobs
const Application = require('../models/Application');
// Line 5: Import User model
// User = Mongoose model for user documents in MongoDB
// Used to find the correct hirer user
const User = require('../models/User');

// Line 7: Define MongoDB connection URI
// MONGODB_URI = Connection string for MongoDB database
// process.env.MONGODB_URI = Get URI from environment variables (if set)
// || = Logical OR operator (fallback)
// 'mongodb://localhost:27017/jobportal' = Default local MongoDB URI
// localhost:27017 = Default MongoDB host and port
// jobportal = Database name
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal';

// Line 9: Define async function to delete duplicate jobs
// async function = Function that can use await keyword for asynchronous operations
// deleteDuplicateJobs = Function name
async function deleteDuplicateJobs() {
  // Line 10: Start try-catch block for error handling
  // try { ... } = Block of code to attempt execution
  // catch (error) { ... } = Block to handle any errors that occur
  try {
    // Line 11: Connect to MongoDB database
    // await = Wait for asynchronous operation to complete
    // mongoose.connect(MONGODB_URI) = Establish connection to MongoDB
    // MONGODB_URI = Connection string (defined above)
    await mongoose.connect(MONGODB_URI);
    // Line 12: Log success message to console
    // console.log = Output message to terminal
    // '✅ Connected to MongoDB' = Success message with checkmark emoji
    console.log('✅ Connected to MongoDB');

    // Line 14: Comment explaining next section
    // Find the correct hirer (hire@gmail.com)
    // Line 15: Find the correct hirer user in database
    // await = Wait for database query to complete
    // User.findOne({ ... }) = Mongoose method to find one document matching criteria
    // { email: 'hire@gmail.com', role: 'hirer' } = Query criteria:
    //   email = Must match 'hire@gmail.com'
    //   role = Must be 'hirer'
    // correctHirer = Variable storing the found user document (or null if not found)
    const correctHirer = await User.findOne({ email: 'hire@gmail.com', role: 'hirer' });
    // Line 16: Check if hirer was found
    // if (!correctHirer) = If correctHirer is null/undefined (not found)
    // ! = Logical NOT operator
    if (!correctHirer) {
      // Line 17: Log error message
      // console.error = Output error message to terminal (usually in red)
      // '❌ Hirer (hire@gmail.com) not found' = Error message with X emoji
      console.error('❌ Hirer (hire@gmail.com) not found');
      // Line 18: Exit the script with error code
      // process.exit(1) = Terminate Node.js process with exit code 1 (error)
      // Exit code 1 indicates failure
      process.exit(1);
    }
    // Line 19: Log success message with hirer details
    // console.log = Output message to terminal
    // Template literal (backticks) = Allows string interpolation with ${}
    // `✅ Found correct hirer: ${correctHirer.email} (${correctHirer._id})` = 
    //   Shows hirer email and MongoDB document ID
    console.log(`✅ Found correct hirer: ${correctHirer.email} (${correctHirer._id})`);

    // Line 21: Comment explaining next section
    // Find all Amazon jobs
    // Line 22: Find all jobs with company name "Amazon"
    // await = Wait for database query to complete
    // Job.find({ company: 'Amazon' }) = Mongoose method to find all documents matching criteria
    // { company: 'Amazon' } = Query criteria: company field must equal 'Amazon'
    // .populate('hirerId', 'email') = Mongoose method to replace hirerId reference with actual user document
    //   'hirerId' = Field to populate (foreign key reference)
    //   'email' = Only include email field from populated user document
    // allAmazonJobs = Array of all Amazon job documents
    const allAmazonJobs = await Job.find({ company: 'Amazon' }).populate('hirerId', 'email');
    // Line 23: Log number of Amazon jobs found
    // console.log = Output message to terminal
    // `\n📋 Found ${allAmazonJobs.length} Amazon jobs` = 
    //   Shows count of Amazon jobs (with newline and clipboard emoji)
    // allAmazonJobs.length = Number of items in the array
    console.log(`\n📋 Found ${allAmazonJobs.length} Amazon jobs`);

    // Line 25: Comment explaining next section
    // Find jobs to delete (not linked to correct hirer)
    // Line 26: Filter jobs to identify which ones should be deleted
    // allAmazonJobs.filter = Array method to create new array with items matching condition
    // job => { ... } = Arrow function that returns true/false for each job
    //   true = Include in filtered array (should be deleted)
    //   false = Exclude from filtered array (should be kept)
    const jobsToDelete = allAmazonJobs.filter(job => {
      // Line 27: Get hirer ID from job (if exists)
      // job.hirerId?._id?.toString() = Safely access nested properties
      //   job.hirerId = Hirer user document (populated) or null
      //   ?._id = MongoDB document ID (if hirerId exists)
      //   ?.toString() = Convert ObjectId to string (if _id exists)
      // hirerId = Variable storing hirer ID as string (or undefined if no hirer)
      const hirerId = job.hirerId?._id?.toString();
      // Line 28: Get correct hirer ID as string
      // correctHirer._id = MongoDB ObjectId of correct hirer
      // .toString() = Convert ObjectId to string for comparison
      // correctHirerId = Variable storing correct hirer ID as string
      const correctHirerId = correctHirer._id.toString();
      // Line 29: Return true if job should be deleted
      // return = Return boolean value from filter function
      // !hirerId = If job has no hirer (hirerId is null/undefined)
      // || = Logical OR operator
      // hirerId !== correctHirerId = If job's hirer is different from correct hirer
      // Returns true if: no hirer OR wrong hirer (should be deleted)
      // Returns false if: correct hirer (should be kept)
      return !hirerId || hirerId !== correctHirerId;
    });

    // Line 32: Log number of jobs to delete
    // console.log = Output message to terminal
    // `\n🗑️  Jobs to delete: ${jobsToDelete.length}` = 
    //   Shows count of jobs to be deleted (with newline and trash emoji)
    // jobsToDelete.length = Number of jobs in the filtered array
    console.log(`\n🗑️  Jobs to delete: ${jobsToDelete.length}`);
    
    // Line 34: Loop through each job to delete
    // for (const job of jobsToDelete) = For...of loop iterating over array
    //   const job = Current job object in the loop (constant, cannot be reassigned)
    //   jobsToDelete = Array of jobs to delete
    for (const job of jobsToDelete) {
      // Line 35: Log job being deleted
      // console.log = Output message to terminal
      // `\n  Deleting: ${job._id}` = Shows job ID being deleted (with newline and indentation)
      // job._id = MongoDB document ID of the job
      console.log(`\n  Deleting: ${job._id}`);
      // Line 36: Log job title
      // console.log = Output message to terminal
      // `    Title: ${job.title}` = Shows job title (with indentation)
      // job.title = Job title string
      console.log(`    Title: ${job.title}`);
      // Line 37: Log hirer email (or 'NONE' if no hirer)
      // console.log = Output message to terminal
      // `    Hirer: ${job.hirerId ? job.hirerId.email : 'NONE'}` = 
      //   Shows hirer email if exists, otherwise 'NONE' (with indentation)
      // job.hirerId ? job.hirerId.email : 'NONE' = Ternary operator for conditional value
      console.log(`    Hirer: ${job.hirerId ? job.hirerId.email : 'NONE'}`);
      
      // Line 39: Comment explaining next section
      // Delete applications for this job
      // Line 40: Count applications associated with this job
      // await = Wait for database query to complete
      // Application.countDocuments({ jobId: job._id }) = Mongoose method to count documents
      //   { jobId: job._id } = Query criteria: find applications where jobId matches this job's ID
      // appCount = Variable storing number of applications found
      const appCount = await Application.countDocuments({ jobId: job._id });
      // Line 41: Check if there are applications to delete
      // if (appCount > 0) = If count is greater than 0 (applications exist)
      if (appCount > 0) {
        // Line 42: Delete all applications for this job
        // await = Wait for database operation to complete
        // Application.deleteMany({ jobId: job._id }) = Mongoose method to delete multiple documents
        //   { jobId: job._id } = Query criteria: delete all applications where jobId matches this job's ID
        await Application.deleteMany({ jobId: job._id });
        // Line 43: Log number of applications deleted
        // console.log = Output message to terminal
        // `    Deleted ${appCount} applications` = Shows count of deleted applications (with indentation)
        console.log(`    Deleted ${appCount} applications`);
      }
      
      // Line 45: Comment explaining next section
      // Delete the job
      // Line 46: Delete the job document from database
      // await = Wait for database operation to complete
      // Job.deleteOne({ _id: job._id }) = Mongoose method to delete one document
      //   { _id: job._id } = Query criteria: find job with matching ID
      await Job.deleteOne({ _id: job._id });
      // Line 47: Log success message
      // console.log = Output message to terminal
      // `    ✅ Job deleted` = Success message with checkmark emoji (with indentation)
      console.log(`    ✅ Job deleted`);
    }

    // Line 50: Comment explaining next section
    // Show remaining jobs
    // Line 51: Find all remaining Amazon jobs after deletion
    // await = Wait for database query to complete
    // Job.find({ company: 'Amazon' }) = Mongoose method to find all Amazon jobs
    // { company: 'Amazon' } = Query criteria: company field must equal 'Amazon'
    // .populate('hirerId', 'email') = Populate hirerId reference with user email
    // remaining = Array of remaining Amazon job documents
    const remaining = await Job.find({ company: 'Amazon' }).populate('hirerId', 'email');
    // Line 52: Log number of remaining jobs
    // console.log = Output message to terminal
    // `\n✅ Remaining Amazon jobs: ${remaining.length}` = 
    //   Shows count of remaining jobs (with newline and checkmark emoji)
    // remaining.length = Number of items in the array
    console.log(`\n✅ Remaining Amazon jobs: ${remaining.length}`);
    // Line 53: Loop through remaining jobs to display them
    // remaining.forEach((job, i) => { ... }) = Array method to iterate over items
    //   (job, i) => { ... } = Arrow function with job object and index
    //     job = Current job object in the loop
    //     i = Index (0, 1, 2, ...)
    remaining.forEach((job, i) => {
      // Line 54: Log job number and ID
      // console.log = Output message to terminal
      // `  ${i+1}. ID: ${job._id}` = Shows numbered list item with job ID (with indentation)
      // i+1 = Convert 0-based index to 1-based number (1, 2, 3, ...)
      // job._id = MongoDB document ID of the job
      console.log(`  ${i+1}. ID: ${job._id}`);
      // Line 55: Log hirer email (or 'NONE' if no hirer)
      // console.log = Output message to terminal
      // `     Hirer: ${job.hirerId ? job.hirerId.email : 'NONE'}` = 
      //   Shows hirer email if exists, otherwise 'NONE' (with indentation)
      // job.hirerId ? job.hirerId.email : 'NONE' = Ternary operator for conditional value
      console.log(`     Hirer: ${job.hirerId ? job.hirerId.email : 'NONE'}`);
    });

    // Line 58: Log completion message
    // console.log = Output message to terminal
    // '\n✅ Done!' = Success message with newline and checkmark emoji
    console.log('\n✅ Done!');
    // Line 59: Exit the script successfully
    // process.exit(0) = Terminate Node.js process with exit code 0 (success)
    // Exit code 0 indicates successful completion
    process.exit(0);
  // Line 60: Catch block to handle errors
  // catch (error) { ... } = Block executed if any error occurs in try block
  } catch (error) {
    // Line 61: Log error message
    // console.error = Output error message to terminal (usually in red)
    // '❌ Error:' = Error prefix with X emoji
    // error = Error object containing error details
    console.error('❌ Error:', error);
    // Line 62: Exit the script with error code
    // process.exit(1) = Terminate Node.js process with exit code 1 (error)
    // Exit code 1 indicates failure
    process.exit(1);
  }
}

// Line 65: Call the function to execute the script
// deleteDuplicateJobs() = Invoke the async function
// This starts the script execution when file is run with: node scripts/deleteDuplicateAmazonJobs.js
deleteDuplicateJobs();
