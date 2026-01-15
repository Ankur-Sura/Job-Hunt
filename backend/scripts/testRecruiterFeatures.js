/**
 * =============================================================================
 *                    TESTRECRUITERFEATURES.JS - Test Script
 * =============================================================================
 *
 * 📖 WHAT IS THIS SCRIPT?
 * ------------------------
 * This script tests the recruiter dashboard features by:
 * 1. Finding the recruiter (admin@gmail.com)
 * 2. Finding all jobs posted by the recruiter (Amazon, Google, Facebook)
 * 3. Displaying applications for each job
 * 4. Showing candidate details (resume, skills, projects, experience)
 * 5. Displaying fit scores and application status
 *
 * 🔗 HOW TO RUN:
 * --------------
 *     cd "/Users/ankursura/Desktop/Job Portal Project /backend"
 *     node scripts/testRecruiterFeatures.js
 *
 * 📌 WHAT IT DOES:
 * ---------------
 * 1. Connects to MongoDB
 * 2. Finds recruiter user
 * 3. Queries jobs posted by recruiter
 * 4. For each job, finds all applications
 * 5. Displays detailed candidate information
 * 6. Shows summary statistics
 *
 * =============================================================================
 */

// Line 1: Comment explaining next section
// Test script to verify recruiter features are working
// Line 2: Load environment variables from .env file
// require('dotenv').config() = Loads variables from .env file into process.env
// This allows accessing MONGODB_URI from environment variables
require('dotenv').config();
// Line 3: Import mongoose library
// mongoose = MongoDB object modeling library for Node.js
// Provides schema validation, middleware, and query building
const mongoose = require('mongoose');
// Line 4: Import Job model
// Job = Mongoose model for job documents in MongoDB
// Used to query jobs posted by the recruiter
const Job = require('../models/Job');
// Line 5: Import User model
// User = Mongoose model for user documents in MongoDB
// Used to find the recruiter user
const User = require('../models/User');
// Line 6: Import Application model
// Application = Mongoose model for application documents in MongoDB
// Used to query applications for each job
const Application = require('../models/Application');

// Line 8: Define MongoDB connection URI
// MONGODB_URI = Connection string for MongoDB database
// process.env.MONGODB_URI = Get URI from environment variables (if set)
// || = Logical OR operator (fallback)
// 'mongodb://localhost:27017/jobportal' = Default local MongoDB URI
// localhost:27017 = Local MongoDB host and port
// jobportal = Database name
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal';

// Line 10: Define async function to test recruiter features
// async function = Function that can use await keyword for asynchronous operations
// testRecruiterFeatures = Function name
async function testRecruiterFeatures() {
  // Line 11: Start try-catch block for error handling
  // try { ... } = Block of code to attempt execution
  // catch (error) { ... } = Block to handle any errors that occur
  try {
    // Line 12: Connect to MongoDB database
    // await = Wait for asynchronous operation to complete
    // mongoose.connect(MONGODB_URI) = Establish connection to MongoDB
    // MONGODB_URI = Connection string (defined above)
    await mongoose.connect(MONGODB_URI);
    // Line 13: Log success message with newline
    // console.log = Output message to terminal
    // '✅ Connected to MongoDB\n' = Success message with checkmark emoji and newline
    // \n = Newline character for formatting
    console.log('✅ Connected to MongoDB\n');

    // Line 15: Comment explaining next section
    // Find recruiter
    // Line 16: Find the recruiter user in database
    // await = Wait for database query to complete
    // User.findOne({ email: 'admin@gmail.com' }) = Mongoose method to find one document
    //   { email: 'admin@gmail.com' } = Query criteria: email must match 'admin@gmail.com'
    // recruiter = Variable storing the found user document (or null if not found)
    const recruiter = await User.findOne({ email: 'admin@gmail.com' });
    // Line 17: Check if recruiter was found
    // if (!recruiter) = If recruiter is null/undefined (not found)
    // ! = Logical NOT operator
    if (!recruiter) {
      // Line 18: Log error message
      // console.error = Output error message to terminal (usually in red)
      // '❌ Recruiter not found' = Error message with X emoji
      console.error('❌ Recruiter not found');
      // Line 19: Exit the script with error code
      // process.exit(1) = Terminate Node.js process with exit code 1 (error)
      process.exit(1);
    }
    // Line 20: Log recruiter details
    // console.log = Output message to terminal
    // Template literal (backticks) = Allows string interpolation with ${}
    // `📋 Recruiter: ${recruiter.name} (${recruiter.email})\n` = 
    //   Shows recruiter name and email with clipboard emoji and newline
    // recruiter.name = Recruiter's full name
    // recruiter.email = Recruiter's email address
    console.log(`📋 Recruiter: ${recruiter.name} (${recruiter.email})\n`);

    // Line 22: Comment explaining next section
    // Get all jobs posted by recruiter
    // Line 23: Find all jobs posted by the recruiter
    // await = Wait for database query to complete
    // Job.find({ ... }) = Mongoose method to find multiple documents
    //   { hirerId: recruiter._id, company: { $in: [...] } } = Query criteria:
    //     hirerId = Must match recruiter's ID (jobs posted by this recruiter)
    //     company: { $in: [...] } = Company name must be in the array ['Amazon', 'Google', 'Facebook']
    //       $in = MongoDB operator meaning "value is in array"
    // .sort({ company: 1 }) = Sort results by company name in ascending order (A-Z)
    //   1 = Ascending order
    // jobs = Array of job documents matching the criteria
    const jobs = await Job.find({ 
      hirerId: recruiter._id,
      company: { $in: ['Amazon', 'Google', 'Facebook'] }
    }).sort({ company: 1 });

    // Line 24: Log section header
    // console.log = Output message to terminal
    // '📊 JOBS POSTED BY RECRUITER:' = Section title with chart emoji
    console.log('📊 JOBS POSTED BY RECRUITER:');
    // Line 25: Log separator line
    // console.log = Output message to terminal
    // '='.repeat(60) = Create a line of 60 equal signs for visual separation
    // .repeat(60) = String method that repeats the character 60 times
    console.log('='.repeat(60));
    
    // Line 27: Loop through each job
    // for (const job of jobs) = For...of loop iterating over jobs array
    //   const job = Current job object in the loop (constant)
    //   jobs = Array of job documents
    for (const job of jobs) {
      // Line 28: Find all applications for this job
      // await = Wait for database query to complete
      // Application.find({ jobId: job._id }) = Mongoose method to find multiple documents
      //   { jobId: job._id } = Query criteria: find applications where jobId matches this job's ID
      // .populate('userId', 'name email resumeId resumeData') = Mongoose method to replace userId reference
      //   'userId' = Field to populate (foreign key reference to User document)
      //   'name email resumeId resumeData' = Only include these fields from populated user document
      // apps = Array of application documents with populated user data
      const apps = await Application.find({ jobId: job._id })
        .populate('userId', 'name email resumeId resumeData');
      
      // Line 29: Comment explaining next section
      // Update application count
      // Line 30: Update the job's application count
      // job.applications = apps.length = Set the job's application count to the number of applications found
      // apps.length = Number of applications in the array
      job.applications = apps.length;
      // Line 31: Save the updated job document
      // await = Wait for database operation to complete
      // job.save() = Mongoose method to save document changes to database
      await job.save();

      // Line 33: Log job information
      // console.log = Output message to terminal
      // Template literal = Allows string interpolation
      // `\n${job.company} - ${job.title}` = Shows company name and job title with newline
      // \n = Newline character for formatting
      // job.company = Company name string
      // job.title = Job title string
      console.log(`\n${job.company} - ${job.title}`);
      // Line 34: Log job location
      // console.log = Output message to terminal
      // `  Location: ${job.location}` = Shows job location with indentation
      //   (two spaces) = Indentation for readability
      console.log(`  Location: ${job.location}`);
      // Line 35: Log application count
      // console.log = Output message to terminal
      // `  Applications: ${apps.length}` = Shows number of applications with indentation
      console.log(`  Applications: ${apps.length}`);
      
      // Line 37: Check if there are applications
      // if (apps.length > 0) = If there are applications (length is greater than 0)
      if (apps.length > 0) {
        // Line 38: Loop through each application
        // apps.forEach((app, idx) => { ... }) = Array method to iterate over applications
        //   (app, idx) => { ... } = Arrow function with application object and index
        //     app = Current application object in the loop
        //     idx = Index (0, 1, 2, ...)
        apps.forEach((app, idx) => {
          // Line 39: Get user data from populated application
          // const user = app.userId = Get the populated user document
          // app.userId = User document (populated from userId reference)
          const user = app.userId;
          // Line 40: Log candidate number
          // console.log = Output message to terminal
          // `\n  Candidate ${idx + 1}:` = Shows candidate number with newline and indentation
          // idx + 1 = Convert 0-based index to 1-based number (1, 2, 3, ...)
          console.log(`\n  Candidate ${idx + 1}:`);
          // Line 41: Log candidate name
          // console.log = Output message to terminal
          // `    Name: ${user.name}` = Shows candidate name with indentation
          //   (four spaces) = Indentation for readability
          // user.name = Candidate's full name
          console.log(`    Name: ${user.name}`);
          // Line 42: Log candidate email
          // console.log = Output message to terminal
          // `    Email: ${user.email}` = Shows candidate email with indentation
          // user.email = Candidate's email address
          console.log(`    Email: ${user.email}`);
          // Line 43: Log resume availability
          // console.log = Output message to terminal
          // `    Has Resume: ${user.resumeId ? '✅ YES' : '❌ NO'}` = 
          //   Shows resume availability with checkmark or X emoji
          // user.resumeId ? '✅ YES' : '❌ NO' = Ternary operator: show 'YES' if resumeId exists, else 'NO'
          console.log(`    Has Resume: ${user.resumeId ? '✅ YES' : '❌ NO'}`);
          // Line 44: Check if resume exists
          // if (user.resumeId) = If resumeId is not null/undefined (resume exists)
          if (user.resumeId) {
            // Line 45: Log resume ID
            // console.log = Output message to terminal
            // `    Resume ID: ${user.resumeId}` = Shows resume ID with indentation
            // user.resumeId = MongoDB ObjectId of the resume document
            console.log(`    Resume ID: ${user.resumeId}`);
            // Line 46: Log resume data availability
            // console.log = Output message to terminal
            // `    Resume Data: ${user.resumeData ? '✅ Available' : '❌ Missing'}` = 
            //   Shows resume data availability with checkmark or X emoji
            // user.resumeData ? '✅ Available' : '❌ Missing' = Ternary operator for resume data
            console.log(`    Resume Data: ${user.resumeData ? '✅ Available' : '❌ Missing'}`);
            // Line 47: Check if resume data exists
            // if (user.resumeData) = If resumeData is not null/undefined (resume data exists)
            if (user.resumeData) {
              // Line 48: Log skills count
              // console.log = Output message to terminal
              // `    Skills: ${user.resumeData.skills?.length || 0} skills` = 
              //   Shows number of skills with indentation
              // user.resumeData.skills?.length = Number of skills in the array (safely accessed)
              // ?. = Optional chaining to safely access nested properties
              // || 0 = Fallback to 0 if skills array doesn't exist
              console.log(`    Skills: ${user.resumeData.skills?.length || 0} skills`);
              // Line 49: Log projects count
              // console.log = Output message to terminal
              // `    Projects: ${user.resumeData.projects?.length || 0} projects` = 
              //   Shows number of projects with indentation
              // user.resumeData.projects?.length = Number of projects in the array (safely accessed)
              console.log(`    Projects: ${user.resumeData.projects?.length || 0} projects`);
              // Line 50: Log experience count
              // console.log = Output message to terminal
              // `    Experience: ${user.resumeData.experience?.length || 0} entries` = 
              //   Shows number of experience entries with indentation
              // user.resumeData.experience?.length = Number of experience entries in the array (safely accessed)
              console.log(`    Experience: ${user.resumeData.experience?.length || 0} entries`);
            }
          }
          // Line 52: Log application status
          // console.log = Output message to terminal
          // `    Application Status: ${app.status}` = Shows application status with indentation
          // app.status = Application status string (e.g., 'applied', 'shortlisted', 'rejected')
          console.log(`    Application Status: ${app.status}`);
          // Line 53: Log fit score
          // console.log = Output message to terminal
          // `    Fit Score: ${app.fitScore || 0}%` = Shows fit score with indentation
          // app.fitScore || 0 = Fit score value, or 0 if not set
          // || = Logical OR operator for fallback value
          // % = Percentage symbol
          console.log(`    Fit Score: ${app.fitScore || 0}%`);
        });
      // Line 54: Else block (no applications)
      } else {
        // Line 55: Log message when no applications
        // console.log = Output message to terminal
        // '  No applications yet' = Message indicating no applications with indentation
        console.log('  No applications yet');
      }
    }

    // Line 58: Log separator line
    // console.log = Output message to terminal
    // '\n' + '='.repeat(60) = Newline followed by 60 equal signs
    // \n = Newline character
    // '='.repeat(60) = Create separator line
    console.log('\n' + '='.repeat(60));
    // Line 59: Log completion message
    // console.log = Output message to terminal
    // '\n✅ TEST COMPLETE' = Success message with newline and checkmark emoji
    console.log('\n✅ TEST COMPLETE');
    // Line 60: Log summary header
    // console.log = Output message to terminal
    // '\n📝 SUMMARY:' = Summary header with newline and memo emoji
    console.log('\n📝 SUMMARY:');
    // Line 61: Log total jobs count
    // console.log = Output message to terminal
    // `   - Total Jobs: ${jobs.length}` = Shows total number of jobs with indentation
    // jobs.length = Number of jobs in the array
    console.log(`   - Total Jobs: ${jobs.length}`);
    // Line 62: Log Amazon applications count
    // console.log = Output message to terminal
    // `   - Amazon: ${jobs.find(...)?.applications || 0} applications` = 
    //   Shows Amazon job's application count with indentation
    // jobs.find(j => j.company === 'Amazon') = Find Amazon job in the array
    //   j => j.company === 'Amazon' = Arrow function checking if company is 'Amazon'
    // ?.applications = Safely access applications property
    // || 0 = Fallback to 0 if job not found or applications not set
    console.log(`   - Amazon: ${jobs.find(j => j.company === 'Amazon')?.applications || 0} applications`);
    // Line 63: Log Google applications count
    // console.log = Output message to terminal
    // `   - Google: ${jobs.find(...)?.applications || 0} applications` = 
    //   Shows Google job's application count with indentation
    // Same pattern as Amazon above
    console.log(`   - Google: ${jobs.find(j => j.company === 'Google')?.applications || 0} applications`);
    // Line 64: Log Facebook applications count
    // console.log = Output message to terminal
    // `   - Facebook: ${jobs.find(...)?.applications || 0} applications` = 
    //   Shows Facebook job's application count with indentation
    // Same pattern as Amazon above
    console.log(`   - Facebook: ${jobs.find(j => j.company === 'Facebook')?.applications || 0} applications`);

    // Line 66: Exit the script successfully
    // process.exit(0) = Terminate Node.js process with exit code 0 (success)
    // Exit code 0 indicates successful completion
    process.exit(0);
  // Line 67: Catch block to handle errors
  // catch (error) { ... } = Block executed if any error occurs in try block
  } catch (error) {
    // Line 68: Log error message
    // console.error = Output error message to terminal (usually in red)
    // '❌ Error:' = Error prefix with X emoji
    // error = Error object containing error details
    console.error('❌ Error:', error);
    // Line 69: Exit the script with error code
    // process.exit(1) = Terminate Node.js process with exit code 1 (error)
    // Exit code 1 indicates failure
    process.exit(1);
  }
}

// Line 72: Call the function to execute the script
// testRecruiterFeatures() = Invoke the async function
// This starts the test when file is run with: node scripts/testRecruiterFeatures.js
testRecruiterFeatures();
