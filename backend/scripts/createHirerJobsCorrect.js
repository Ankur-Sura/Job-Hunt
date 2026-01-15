/**
 * =============================================================================
 *                    CREATEHIRERJOBS CORRECT.JS - Job Creation Script
 * =============================================================================
 *
 * 📖 WHAT IS THIS SCRIPT?
 * ------------------------
 * This script creates 3 jobs (Amazon, Google, Facebook) for the hirer
 * (hire@gmail.com). It also creates or finds the associated companies and
 * optionally creates a test application for the Amazon job.
 *
 * 🔗 HOW TO RUN:
 * --------------
 *     cd "/Users/ankursura/Desktop/Job Portal Project /backend"
 *     node scripts/createHirerJobsCorrect.js
 *
 * 📌 WHAT IT DOES:
 * ---------------
 * 1. Connects to MongoDB
 * 2. Finds the hirer (hire@gmail.com)
 * 3. Creates or finds companies (Amazon, Google, Facebook)
 * 4. Creates/updates 3 jobs with detailed information
 * 5. Optionally creates a test application for Amazon job
 * 6. Shows summary of created jobs
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
// Used to create and update job listings
const Job = require('../models/Job');
// Line 4: Import User model
// User = Mongoose model for user documents in MongoDB
// Used to find the hirer and regular users
const User = require('../models/User');
// Line 5: Import Application model
// Application = Mongoose model for application documents in MongoDB
// Used to create test applications
const Application = require('../models/Application');
// Line 6: Import Company model
// Company = Mongoose model for company documents in MongoDB
// Used to create or find company records
const Company = require('../models/Company');

// Line 8: Define MongoDB connection URI
// MONGODB_URI = Connection string for MongoDB database
// process.env.MONGODB_URI = Get URI from environment variables (if set)
// || = Logical OR operator (fallback)
// 'mongodb://localhost:27017/jobportal' = Default local MongoDB URI
// localhost:27017 = Default MongoDB host and port
// jobportal = Database name
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal';

// Line 10: Define async function to create hirer jobs
// async function = Function that can use await keyword for asynchronous operations
// createHirerJobs = Function name
async function createHirerJobs() {
  // Line 11: Start try-catch block for error handling
  // try { ... } = Block of code to attempt execution
  // catch (error) { ... } = Block to handle any errors that occur
  try {
    // Line 12: Comment explaining next section
    // Connect to MongoDB
    // Line 13: Connect to MongoDB database
    // await = Wait for asynchronous operation to complete
    // mongoose.connect(MONGODB_URI) = Establish connection to MongoDB
    // MONGODB_URI = Connection string (defined above)
    await mongoose.connect(MONGODB_URI);
    // Line 14: Log success message to console
    // console.log = Output message to terminal
    // '✅ Connected to MongoDB' = Success message with checkmark emoji
    console.log('✅ Connected to MongoDB');

    // Line 16: Comment explaining next section
    // Find the hirer (hire@gmail.com)
    // Line 17: Find the hirer user in database
    // await = Wait for database query to complete
    // User.findOne({ email: 'hire@gmail.com' }) = Mongoose method to find one document
    //   { email: 'hire@gmail.com' } = Query criteria: email must match 'hire@gmail.com'
    // hirer = Variable storing the found user document (or null if not found)
    const hirer = await User.findOne({ email: 'hire@gmail.com' });
    // Line 18: Check if hirer was found
    // if (!hirer) = If hirer is null/undefined (not found)
    // ! = Logical NOT operator
    if (!hirer) {
      // Line 19: Log error message
      // console.error = Output error message to terminal (usually in red)
      // '❌ Hirer not found...' = Error message with X emoji
      console.error('❌ Hirer not found. Please make sure hire@gmail.com exists.');
      // Line 20: Exit the script with error code
      // process.exit(1) = Terminate Node.js process with exit code 1 (error)
      process.exit(1);
    }
    // Line 21: Log success message with hirer details
    // console.log = Output message to terminal
    // Template literal (backticks) = Allows string interpolation with ${}
    // `✅ Found hirer: ${hirer.name} (${hirer.email})` = Shows hirer name and email
    console.log(`✅ Found hirer: ${hirer.name} (${hirer.email})`);

    // Line 23: Comment explaining next section
    // Create or get companies
    // Line 24: Initialize empty object to store companies
    // companies = {} = Empty object that will store company documents by name
    // This allows easy lookup: companies['Amazon'] = company document
    const companies = {};
    // Line 25: Define array of company names to create
    // companyNames = ['Amazon', 'Google', 'Facebook'] = Array of company name strings
    const companyNames = ['Amazon', 'Google', 'Facebook'];
    
    // Line 27: Loop through each company name
    // for (const companyName of companyNames) = For...of loop iterating over array
    //   const companyName = Current company name in the loop (constant)
    //   companyNames = Array of company names
    for (const companyName of companyNames) {
      // Line 28: Try to find existing company in database
      // await = Wait for database query to complete
      // Company.findOne({ name: companyName }) = Mongoose method to find one document
      //   { name: companyName } = Query criteria: name must match current company name
      // company = Variable storing found company document (or null if not found)
      let company = await Company.findOne({ name: companyName });
      // Line 29: Check if company doesn't exist
      // if (!company) = If company is null/undefined (not found)
      if (!company) {
        // Line 30: Create new company document
        // await = Wait for database operation to complete
        // Company.create({ ... }) = Mongoose method to create new document
        //   { ... } = Object containing company data
        company = await Company.create({
          // Line 31: Company name
          // name = Company name string (e.g., 'Amazon')
          name: companyName,
          // Line 32: User ID of the hirer who owns this company
          // userId = Reference to User document
          // hirer._id = MongoDB ObjectId of the hirer user
          userId: hirer._id,
          // Line 33: Company description
          // description = String describing the company
          // Template literal = Allows string interpolation
          // `${companyName} is a leading technology company.` = Dynamic description
          description: `${companyName} is a leading technology company.`,
          // Line 34: Company location
          // location = String representing company location
          location: 'USA'
        });
        // Line 35: Log success message
        // console.log = Output message to terminal
        // `✅ Created company: ${companyName}` = Shows company name that was created
        console.log(`✅ Created company: ${companyName}`);
      // Line 36: Else block (company already exists)
      } else {
        // Line 37: Log message that company was found
        // console.log = Output message to terminal
        // `✅ Found existing company: ${companyName}` = Shows company name that was found
        console.log(`✅ Found existing company: ${companyName}`);
      }
      // Line 39: Store company in companies object
      // companies[companyName] = company = Add company to object with name as key
      // This allows lookup: companies['Amazon'] returns the Amazon company document
      companies[companyName] = company;
    }

    // Line 42: Comment explaining next section
    // Find a regular user to create an application for Amazon job
    // Line 43: Find a regular user (not the hirer) to create test application
    // await = Wait for database query to complete
    // User.findOne({ ... }) = Mongoose method to find one document
    //   { email: { $ne: 'hire@gmail.com' }, role: 'user' } = Query criteria:
    //     email: { $ne: 'hire@gmail.com' } = Email not equal to 'hire@gmail.com' ($ne = not equal)
    //     role: 'user' = Role must be 'user' (not 'hirer' or 'admin')
    // regularUser = Variable storing found user document (or null if not found)
    const regularUser = await User.findOne({ email: { $ne: 'hire@gmail.com' }, role: 'user' });
    // Line 44: Check if regular user was not found
    // if (!regularUser) = If regularUser is null/undefined
    if (!regularUser) {
      // Line 45: Log warning message
      // console.log = Output message to terminal
      // '⚠️  No regular user found...' = Warning message with warning emoji
      console.log('⚠️  No regular user found. Amazon job will be created without application.');
    }

    // Line 48: Comment explaining next section
    // Job 1: Amazon - Software Development Engineer
    // Line 49: Create or update Amazon job using findOneAndUpdate
    // await = Wait for database operation to complete
    // Job.findOneAndUpdate(query, update, options) = Mongoose method to find and update
    //   If document exists, update it; if not, create it (upsert: true)
    const amazonJob = await Job.findOneAndUpdate(
      // Line 50: Query criteria to find existing job
      // { ... } = Object defining search criteria
      { 
        // Line 51: Company name must be 'Amazon'
        // company = 'Amazon' = Match jobs with company field equal to 'Amazon'
        company: 'Amazon',
        // Line 52: Job title must be 'Software Development Engineer'
        // title = 'Software Development Engineer' = Match jobs with this exact title
        title: 'Software Development Engineer',
        // Line 53: Hirer ID must match the hirer's ID
        // hirerId = hirer._id = Match jobs owned by this specific hirer
        // hirer._id = MongoDB ObjectId of the hirer user
        hirerId: hirer._id
      },
      // Line 54: Update data (or data to create if job doesn't exist)
      // { ... } = Object containing all job fields
      {
        // Line 55: Company name
        // company = 'Amazon' = Company name string
        company: 'Amazon',
        // Line 56: Job title
        // title = 'Software Development Engineer' = Job title string
        title: 'Software Development Engineer',
        // Line 57: Job description (multi-line string)
        // description = Template literal containing detailed job description
        // `...` = Template literal (backticks) allows multi-line strings
        // Contains job responsibilities, requirements, and benefits
        description: `We are looking for a Software Development Engineer to join our team. You will be responsible for designing, developing, and maintaining scalable software solutions. You'll work on cutting-edge technologies and collaborate with cross-functional teams to deliver high-quality products.

Key Responsibilities:
- Design and develop scalable software solutions
- Write clean, maintainable, and efficient code
- Collaborate with product managers and designers
- Participate in code reviews and technical discussions
- Debug and fix issues in production systems
- Contribute to architectural decisions

What We Offer:
- Competitive salary and benefits
- Health insurance
- Flexible work hours
- Professional development opportunities
- Great work culture and team environment`,
        // Line 64: Job location
        // location = 'Bangalore, India' = Location string
        location: 'Bangalore, India',
        // Line 65: Job mode (work arrangement)
        // jobMode = 'Hybrid' = Work arrangement: 'Remote', 'On-Site', or 'Hybrid'
        jobMode: 'Hybrid',
        // Line 66: Job type (employment type)
        // jobType = 'Full Time' = Employment type: 'Full Time', 'Part Time', 'Contract', etc.
        jobType: 'Full Time',
        // Line 67: Salary information object
        // salary = { ... } = Object containing salary details
        salary: {
          // Line 68: Minimum salary in currency units
          // min = 1500000 = Minimum salary (15 LPA in rupees)
          min: 1500000,
          // Line 69: Maximum salary in currency units
          // max = 2500000 = Maximum salary (25 LPA in rupees)
          max: 2500000,
          // Line 70: Currency code
          // currency = 'INR' = Indian Rupees currency code
          currency: 'INR',
          // Line 71: Display string for salary
          // display = '15-25 LPA' = Human-readable salary range (LPA = Lakhs Per Annum)
          display: '15-25 LPA'
        },
        // Line 72: Experience requirements object
        // experience = { ... } = Object containing experience requirements
        experience: {
          // Line 73: Minimum years of experience
          // min = 1 = Minimum 1 year of experience required
          min: 1,
          // Line 74: Maximum years of experience
          // max = 3 = Maximum 3 years of experience (defines range)
          max: 3,
          // Line 75: Display string for experience
          // display = '1-3 Years' = Human-readable experience range
          display: '1-3 Years'
        },
        // Line 76: Required skills array
        // skills = [...] = Array of skill strings required for the job
        skills: ['Java', 'Python', 'AWS', 'Docker', 'Kubernetes', 'System Design', 'Data Structures', 'Algorithms'],
        // Line 77: Job requirements array
        // requirements = [...] = Array of requirement strings
        requirements: [
          // Line 78: Education requirement
          "Bachelor's degree in Computer Science or related field",
          // Line 79: Skill requirement
          'Strong problem-solving skills',
          // Line 80: Experience requirement
          'Experience with cloud platforms (AWS preferred)',
          // Line 81: Knowledge requirement
          'Knowledge of software development best practices'
        ],
        // Line 82: Qualifications object
        // qualifications = { ... } = Object containing basic and preferred qualifications
        qualifications: {
          // Line 83: Basic qualifications array
          // basic = [...] = Minimum required qualifications
          basic: ["Bachelor's degree in Computer Science, Engineering, or related field"],
          // Line 84: Preferred qualifications array
          // preferred = [...] = Additional qualifications that are nice to have
          preferred: ["Master's degree", 'AWS Certification']
        },
        // Line 85: Job status
        // status = 'Hiring Now' = Current status of the job posting
        status: 'Hiring Now',
        // Line 86: Hirer ID (who posted this job)
        // hirerId = hirer._id = Reference to User document of the hirer
        // hirer._id = MongoDB ObjectId of the hirer user
        hirerId: hirer._id,
        // Line 87: Application end date
        // applicationEndDate = new Date(...) = Date when applications close
        // Date.now() = Current timestamp in milliseconds
        // + 30 * 24 * 60 * 60 * 1000 = Add 30 days in milliseconds
        //   30 = Number of days
        //   24 = Hours per day
        //   60 = Minutes per hour
        //   60 = Seconds per minute
        //   1000 = Milliseconds per second
        // Result: 30 days from now
        applicationEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        // Line 88: Internship flag
        // isInternship = false = Boolean indicating this is not an internship
        isInternship: false,
        // Line 89: View count (initialized to 0)
        // views = 0 = Number of times job has been viewed
        views: 0,
        // Line 90: Application count (initialized to 0)
        // applications = 0 = Number of applications received
        applications: 0
      },
      // Line 91: Options object for findOneAndUpdate
      // { ... } = Object containing Mongoose options
      { 
        // Line 92: Upsert option
        // upsert = true = Create document if it doesn't exist, update if it does
        upsert: true, 
        // Line 93: Return new document option
        // new = true = Return the updated document (not the original)
        new: true 
      }
    );
    // Line 94: Log success message with job ID
    // console.log = Output message to terminal
    // `✅ Created/Updated Amazon job: ${amazonJob._id}` = Shows job ID
    // amazonJob._id = MongoDB document ID of the created/updated job
    console.log('✅ Created/Updated Amazon job:', amazonJob._id);

    // Line 96: Comment explaining next section
    // Create application for Amazon job if regular user exists
    // Line 97: Check if regular user was found
    // if (regularUser) = If regularUser is not null/undefined
    if (regularUser) {
      // Line 98: Check if application already exists
      // await = Wait for database query to complete
      // Application.findOne({ ... }) = Mongoose method to find one document
      //   { userId: regularUser._id, jobId: amazonJob._id } = Query criteria:
      //     userId = Must match regular user's ID
      //     jobId = Must match Amazon job's ID
      // existingApp = Variable storing found application (or null if not found)
      const existingApp = await Application.findOne({
        userId: regularUser._id,
        jobId: amazonJob._id
      });
      
      // Line 103: Check if application doesn't exist
      // if (!existingApp) = If existingApp is null/undefined (no application found)
      if (!existingApp) {
        // Line 104: Create new application
        // await = Wait for database operation to complete
        // Application.create({ ... }) = Mongoose method to create new document
        await Application.create({
          // Line 105: User ID who applied
          // userId = regularUser._id = Reference to User document
          // regularUser._id = MongoDB ObjectId of the user who applied
          userId: regularUser._id,
          // Line 106: Job ID they applied to
          // jobId = amazonJob._id = Reference to Job document
          // amazonJob._id = MongoDB ObjectId of the Amazon job
          jobId: amazonJob._id,
          // Line 107: Application status
          // status = 'applied' = Current status of the application
          status: 'applied',
          // Line 108: Application date
          // appliedAt = new Date() = Timestamp when application was created
          // new Date() = Current date and time
          appliedAt: new Date(),
          // Line 109: Fit score (initialized to 0)
          // fitScore = 0 = AI-calculated compatibility score (will be calculated later)
          fitScore: 0 // Will be calculated later
        });
        // Line 110: Log success message
        // console.log = Output message to terminal
        // '✅ Created application for Amazon job' = Success message
        console.log('✅ Created application for Amazon job');
        
        // Line 112: Comment explaining next section
        // Update job applications count
        // Line 113: Set applications count to 1
        // amazonJob.applications = 1 = Update the job's application count
        // This tracks how many people have applied
        amazonJob.applications = 1;
        // Line 114: Save the updated job document
        // await = Wait for database operation to complete
        // amazonJob.save() = Mongoose method to save document changes to database
        await amazonJob.save();
      }
    }

    // Line 118: Comment explaining next section
    // Job 2: Google - Software Engineer
    // Line 119: Create or update Google job (similar structure to Amazon job)
    // await = Wait for database operation to complete
    // Job.findOneAndUpdate(query, update, options) = Find and update job
    const googleJob = await Job.findOneAndUpdate(
      // Line 120: Query criteria for Google job
      { 
        company: 'Google',
        title: 'Software Engineer',
        hirerId: hirer._id
      },
      // Line 121: Update data for Google job
      {
        company: 'Google',
        title: 'Software Engineer',
        // Line 122: Google job description (similar structure to Amazon)
        description: `Join Google as a Software Engineer and work on products that impact billions of users worldwide. You'll be part of a team that builds innovative solutions using cutting-edge technologies.

Key Responsibilities:
- Develop and maintain large-scale distributed systems
- Write production-quality code in C++, Java, Python, or Go
- Design and implement scalable architectures
- Work on machine learning and AI-powered features
- Optimize system performance and reliability
- Collaborate with teams across Google

What We Offer:
- Top-tier compensation package
- Comprehensive health benefits
- Free meals and snacks
- On-site gym and wellness programs
- Learning and development opportunities
- Amazing work-life balance`,
        location: 'Hyderabad, India',
        jobMode: 'On-Site',
        jobType: 'Full Time',
        salary: {
          min: 2000000,
          max: 3500000,
          currency: 'INR',
          display: '20-35 LPA'
        },
        experience: {
          min: 2,
          max: 5,
          display: '2-5 Years'
        },
        skills: ['C++', 'Java', 'Python', 'Go', 'Distributed Systems', 'Machine Learning', 'Algorithms', 'Data Structures'],
        requirements: [
          "Bachelor's degree in Computer Science or equivalent",
          'Strong coding skills in one or more programming languages',
          'Experience with distributed systems',
          'Excellent problem-solving abilities'
        ],
        qualifications: {
          basic: ["Bachelor's degree in Computer Science or related field"],
          preferred: ["Master's degree or PhD", 'Publications in top-tier conferences']
        },
        status: 'Hiring Now',
        hirerId: hirer._id,
        // Line 123: Application end date (45 days from now)
        // Date.now() + 45 * 24 * 60 * 60 * 1000 = 45 days in milliseconds
        applicationEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        isInternship: false,
        views: 0,
        applications: 0
      },
      { upsert: true, new: true }
    );
    // Line 124: Log success message with Google job ID
    console.log('✅ Created/Updated Google job:', googleJob._id);

    // Line 126: Comment explaining next section
    // Job 3: Facebook - Software Engineer
    // Line 127: Create or update Facebook job (similar structure to previous jobs)
    const facebookJob = await Job.findOneAndUpdate(
      { 
        company: 'Facebook',
        title: 'Software Engineer',
        hirerId: hirer._id
      },
      {
        company: 'Facebook',
        title: 'Software Engineer',
        // Line 128: Facebook job description
        description: `Facebook (Meta) is looking for a Software Engineer to join our team. You'll work on building products that connect billions of people worldwide. You'll be part of a team that builds innovative solutions using cutting-edge technologies.

Key Responsibilities:
- Design and develop scalable software systems
- Build features for Facebook, Instagram, WhatsApp, or other Meta products
- Write clean, efficient, and maintainable code
- Work with large-scale distributed systems
- Collaborate with cross-functional teams
- Optimize system performance and reliability
- Participate in code reviews and technical discussions

What We Offer:
- Competitive salary and equity
- Comprehensive health benefits
- Free meals and snacks
- On-site gym and wellness programs
- Learning and development opportunities
- Amazing work culture
- Opportunity to work on products used by billions`,
        location: 'Menlo Park, CA / Remote',
        jobMode: 'Hybrid',
        jobType: 'Full Time',
        salary: {
          min: 1800000,
          max: 3000000,
          currency: 'INR',
          display: '18-30 LPA'
        },
        experience: {
          min: 1,
          max: 4,
          display: '1-4 Years'
        },
        skills: ['React', 'JavaScript', 'Python', 'PHP', 'GraphQL', 'Distributed Systems', 'Algorithms', 'Data Structures'],
        requirements: [
          "Bachelor's degree in Computer Science or related field",
          'Strong coding skills in JavaScript, Python, or PHP',
          'Experience with web development',
          'Excellent problem-solving abilities'
        ],
        qualifications: {
          basic: ["Bachelor's degree in Computer Science or related field"],
          preferred: ["Master's degree", 'Experience with social media platforms']
        },
        status: 'Hiring Now',
        hirerId: hirer._id,
        // Line 129: Application end date (30 days from now)
        applicationEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isInternship: false,
        views: 0,
        applications: 0
      },
      { upsert: true, new: true }
    );
    // Line 130: Log success message with Facebook job ID
    console.log('✅ Created/Updated Facebook job:', facebookJob._id);

    // Line 132: Log summary message
    // console.log = Output message to terminal
    // '\n✅ All jobs created successfully!' = Success message with newline
    console.log('\n✅ All jobs created successfully!');
    // Line 133: Log Amazon job ID
    // `   - Amazon: ${amazonJob._id}` = Shows Amazon job ID with indentation
    console.log(`   - Amazon: ${amazonJob._id}`);
    // Line 134: Log Google job ID
    // `   - Google: ${googleJob._id}` = Shows Google job ID with indentation
    console.log(`   - Google: ${googleJob._id}`);
    // Line 135: Log Facebook job ID
    // `   - Facebook: ${facebookJob._id}` = Shows Facebook job ID with indentation
    console.log(`   - Facebook: ${facebookJob._id}`);
    
    // Line 137: Check if regular user exists
    // if (regularUser) = If regularUser is not null/undefined
    if (regularUser) {
      // Line 138: Log message about application creation
      // `\n✅ Application created for Amazon job by user: ${regularUser.email}` = 
      //   Shows user email who applied (with newline)
      console.log(`\n✅ Application created for Amazon job by user: ${regularUser.email}`);
    }

    // Line 141: Exit the script successfully
    // process.exit(0) = Terminate Node.js process with exit code 0 (success)
    // Exit code 0 indicates successful completion
    process.exit(0);
  // Line 142: Catch block to handle errors
  // catch (error) { ... } = Block executed if any error occurs in try block
  } catch (error) {
    // Line 143: Log error message
    // console.error = Output error message to terminal (usually in red)
    // '❌ Error creating jobs:' = Error prefix with X emoji
    // error = Error object containing error details
    console.error('❌ Error creating jobs:', error);
    // Line 144: Exit the script with error code
    // process.exit(1) = Terminate Node.js process with exit code 1 (error)
    // Exit code 1 indicates failure
    process.exit(1);
  }
}

// Line 148: Comment explaining next line
// Run the script
// Line 149: Call the function to execute the script
// createHirerJobs() = Invoke the async function
// This starts the script execution when file is run with: node scripts/createHirerJobsCorrect.js
createHirerJobs();
