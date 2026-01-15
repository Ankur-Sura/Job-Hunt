/**
 * =============================================================================
 *                    CREATEHIRERJOBS.JS - Job Creation Script (Legacy)
 * =============================================================================
 *
 * 📖 WHAT IS THIS SCRIPT?
 * ------------------------
 * This script creates 3 jobs (Microsoft, Netflix, Apple) for the hirer
 * (hire@gmail.com). This is a legacy version - use createHirerJobsCorrect.js
 * for Amazon, Google, Facebook jobs instead.
 *
 * 🔗 HOW TO RUN:
 * --------------
 *     cd "/Users/ankursura/Desktop/Job Portal Project /backend"
 *     node scripts/createHirerJobs.js
 *
 * 📌 WHAT IT DOES:
 * ---------------
 * 1. Connects to MongoDB
 * 2. Finds the hirer (hire@gmail.com)
 * 3. Creates or finds companies (Microsoft, Netflix, Apple)
 * 4. Creates/updates 3 jobs with detailed information
 * 5. Optionally creates a test application for Microsoft job
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
// localhost:27017 = Local MongoDB host and port
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
    // This allows easy lookup: companies['Microsoft'] = company document
    const companies = {};
    // Line 25: Define array of company names to create
    // companyNames = ['Microsoft', 'Netflix', 'Apple'] = Array of company name strings
    const companyNames = ['Microsoft', 'Netflix', 'Apple'];
    
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
          // name = Company name string (e.g., 'Microsoft')
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
      // This allows lookup: companies['Microsoft'] returns the Microsoft company document
      companies[companyName] = company;
    }

    // Line 42: Comment explaining next section
    // Find a regular user to create an application for Microsoft job
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
      console.log('⚠️  No regular user found. Microsoft job will be created without application.');
    }

    // Line 48: Comment explaining next section
    // Job 1: Microsoft - Software Engineer
    // Line 49: Create or update Microsoft job using findOneAndUpdate
    // await = Wait for database operation to complete
    // Job.findOneAndUpdate(query, update, options) = Mongoose method to find and update
    //   If document exists, update it; if not, create it (upsert: true)
    const microsoftJob = await Job.findOneAndUpdate(
      // Line 50: Query criteria to find existing job
      // { ... } = Object defining search criteria
      { 
        // Line 51: Company name must be 'Microsoft'
        // company = 'Microsoft' = Match jobs with company field equal to 'Microsoft'
        company: 'Microsoft',
        // Line 52: Job title must be 'Software Engineer'
        // title = 'Software Engineer' = Match jobs with this exact title
        title: 'Software Engineer',
        // Line 53: Hirer ID must match the hirer's ID
        // hirerId = hirer._id = Match jobs owned by this specific hirer
        // hirer._id = MongoDB ObjectId of the hirer user
        hirerId: hirer._id
      },
      // Line 54: Update data (or data to create if job doesn't exist)
      // { ... } = Object containing all job fields
      {
        // Line 55: Company name
        // company = 'Microsoft' = Company name string
        company: 'Microsoft',
        // Line 56: Job title
        // title = 'Software Engineer' = Job title string
        title: 'Software Engineer',
        // Line 57: Job description (multi-line string)
        // description = Template literal containing detailed job description
        // `...` = Template literal (backticks) allows multi-line strings
        // Contains job responsibilities, requirements, and benefits
        description: `Microsoft is looking for a Software Engineer to join our team. You'll work on building products that empower billions of people worldwide. You'll be part of a team that builds innovative solutions using cutting-edge technologies.

Key Responsibilities:
- Design and develop scalable software systems
- Build features for Microsoft products (Office, Azure, Teams, etc.)
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
        // Line 64: Job location
        // location = 'Seattle, WA / Remote' = Location string
        location: 'Seattle, WA / Remote',
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
          // min = 1600000 = Minimum salary (16 LPA in rupees)
          min: 1600000,
          // Line 69: Maximum salary in currency units
          // max = 2800000 = Maximum salary (28 LPA in rupees)
          max: 2800000,
          // Line 70: Currency code
          // currency = 'INR' = Indian Rupees currency code
          currency: 'INR',
          // Line 71: Display string for salary
          // display = '16-28 LPA' = Human-readable salary range (LPA = Lakhs Per Annum)
          display: '16-28 LPA'
        },
        // Line 72: Experience requirements object
        // experience = { ... } = Object containing experience requirements
        experience: {
          // Line 73: Minimum years of experience
          // min = 1 = Minimum 1 year of experience required
          min: 1,
          // Line 74: Maximum years of experience
          // max = 4 = Maximum 4 years of experience (defines range)
          max: 4,
          // Line 75: Display string for experience
          // display = '1-4 Years' = Human-readable experience range
          display: '1-4 Years'
        },
        // Line 76: Required skills array
        // skills = [...] = Array of skill strings required for the job
        skills: ['C#', 'C++', 'Python', 'Azure', 'JavaScript', 'TypeScript', 'Distributed Systems', 'Algorithms'],
        // Line 77: Job requirements array
        // requirements = [...] = Array of requirement strings
        requirements: [
          // Line 78: Education requirement
          "Bachelor's degree in Computer Science or related field",
          // Line 79: Skill requirement
          'Strong coding skills in C#, C++, or Python',
          // Line 80: Experience requirement
          'Experience with cloud platforms (Azure preferred)',
          // Line 81: Knowledge requirement
          'Excellent problem-solving abilities'
        ],
        // Line 82: Qualifications object
        // qualifications = { ... } = Object containing basic and preferred qualifications
        qualifications: {
          // Line 83: Basic qualifications array
          // basic = [...] = Minimum required qualifications
          basic: ["Bachelor's degree in Computer Science or related field"],
          // Line 84: Preferred qualifications array
          // preferred = [...] = Additional qualifications that are nice to have
          preferred: ["Master's degree", 'Azure Certification']
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
    // `✅ Created/Updated Microsoft job: ${microsoftJob._id}` = Shows job ID
    // microsoftJob._id = MongoDB document ID of the created/updated job
    console.log('✅ Created/Updated Microsoft job:', microsoftJob._id);

    // Line 96: Comment explaining next section
    // Create application for Microsoft job if regular user exists
    // Line 97: Check if regular user was found
    // if (regularUser) = If regularUser is not null/undefined
    if (regularUser) {
      // Line 98: Check if application already exists
      // await = Wait for database query to complete
      // Application.findOne({ ... }) = Mongoose method to find one document
      //   { userId: regularUser._id, jobId: microsoftJob._id } = Query criteria:
      //     userId = Must match regular user's ID
      //     jobId = Must match Microsoft job's ID
      // existingApp = Variable storing found application (or null if not found)
      const existingApp = await Application.findOne({
        userId: regularUser._id,
        jobId: microsoftJob._id
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
          // jobId = microsoftJob._id = Reference to Job document
          // microsoftJob._id = MongoDB ObjectId of the Microsoft job
          jobId: microsoftJob._id,
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
        // '✅ Created application for Microsoft job' = Success message
        console.log('✅ Created application for Microsoft job');
        
        // Line 112: Comment explaining next section
        // Update job applications count
        // Line 113: Set applications count to 1
        // microsoftJob.applications = 1 = Update the job's application count
        // This tracks how many people have applied
        microsoftJob.applications = 1;
        // Line 114: Save the updated job document
        // await = Wait for database operation to complete
        // microsoftJob.save() = Mongoose method to save document changes to database
        await microsoftJob.save();
      }
    }

    // Line 118: Comment explaining next section
    // Job 2: Netflix - Backend Engineer
    // Line 119: Create or update Netflix job (similar structure to Microsoft job)
    // await = Wait for database operation to complete
    // Job.findOneAndUpdate(query, update, options) = Find and update job
    const netflixJob = await Job.findOneAndUpdate(
      // Line 120: Query criteria for Netflix job
      { 
        company: 'Netflix',
        title: 'Backend Engineer',
        hirerId: hirer._id
      },
      // Line 121: Update data for Netflix job
      {
        company: 'Netflix',
        title: 'Backend Engineer',
        // Line 122: Netflix job description (similar structure to Microsoft)
        description: `Netflix is looking for a Backend Engineer to join our engineering team. You'll work on building robust, scalable backend systems that power our streaming platform serving millions of users worldwide.

Key Responsibilities:
- Design and develop RESTful APIs and microservices
- Build high-performance backend systems
- Work with databases (MySQL, PostgreSQL, Cassandra)
- Implement caching strategies for better performance
- Write unit tests and integration tests
- Monitor and optimize system performance
- Collaborate with frontend and mobile teams

What We Offer:
- Competitive salary package
- Stock options
- Health and life insurance
- Free meals and snacks
- Flexible work schedule
- Fast-paced startup environment
- Opportunity to work on high-impact products`,
        location: 'Los Gatos, CA / Remote',
        jobMode: 'Hybrid',
        jobType: 'Full Time',
        salary: {
          min: 1800000,
          max: 3000000,
          currency: 'INR',
          display: '18-30 LPA'
        },
        experience: {
          min: 2,
          max: 5,
          display: '2-5 Years'
        },
        skills: ['Java', 'Python', 'MySQL', 'PostgreSQL', 'Cassandra', 'REST APIs', 'Microservices', 'Docker', 'Kubernetes'],
        requirements: [
          "Bachelor's degree in Computer Science or related field",
          'Strong experience with Java or Python',
          'Knowledge of databases and caching',
          'Understanding of microservices architecture'
        ],
        qualifications: {
          basic: ["Bachelor's degree in Computer Science or related field"],
          preferred: ['Experience with streaming platforms', 'Knowledge of distributed systems']
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
    // Line 124: Log success message with Netflix job ID
    console.log('✅ Created/Updated Netflix job:', netflixJob._id);

    // Line 126: Comment explaining next section
    // Job 3: Apple - iOS Developer
    // Line 127: Create or update Apple job (similar structure to previous jobs)
    const appleJob = await Job.findOneAndUpdate(
      { 
        company: 'Apple',
        title: 'iOS Developer',
        hirerId: hirer._id
      },
      {
        company: 'Apple',
        title: 'iOS Developer',
        // Line 128: Apple job description
        description: `Apple is looking for an iOS Developer to join our team. You'll work on building innovative iOS applications that millions of users love. You'll be part of a team that creates beautiful, intuitive user experiences.

Key Responsibilities:
- Design and develop iOS applications using Swift and Objective-C
- Build user interfaces using UIKit and SwiftUI
- Work with Core Data and other iOS frameworks
- Write unit tests and UI tests
- Optimize app performance and memory usage
- Collaborate with designers and product managers
- Participate in code reviews

What We Offer:
- Competitive salary and equity
- Comprehensive health benefits
- Employee discount on Apple products
- On-site gym and wellness programs
- Learning and development opportunities
- Amazing work culture
- Opportunity to work on products used by millions`,
        location: 'Cupertino, CA / Remote',
        jobMode: 'Hybrid',
        jobType: 'Full Time',
        salary: {
          min: 1700000,
          max: 2900000,
          currency: 'INR',
          display: '17-29 LPA'
        },
        experience: {
          min: 1,
          max: 3,
          display: '1-3 Years'
        },
        skills: ['Swift', 'Objective-C', 'iOS', 'UIKit', 'SwiftUI', 'Core Data', 'Xcode', 'Algorithms'],
        requirements: [
          "Bachelor's degree in Computer Science or related field",
          'Strong experience with Swift and iOS development',
          'Knowledge of iOS frameworks and design patterns',
          'Excellent problem-solving abilities'
        ],
        qualifications: {
          basic: ["Bachelor's degree in Computer Science or related field"],
          preferred: ['Published apps on App Store', 'Experience with SwiftUI']
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
    // Line 130: Log success message with Apple job ID
    console.log('✅ Created/Updated Apple job:', appleJob._id);

    // Line 132: Log summary message
    // console.log = Output message to terminal
    // '\n✅ All jobs created successfully!' = Success message with newline
    console.log('\n✅ All jobs created successfully!');
    // Line 133: Log Microsoft job ID
    // `   - Microsoft: ${microsoftJob._id}` = Shows Microsoft job ID with indentation
    console.log(`   - Microsoft: ${microsoftJob._id}`);
    // Line 134: Log Netflix job ID
    // `   - Netflix: ${netflixJob._id}` = Shows Netflix job ID with indentation
    console.log(`   - Netflix: ${netflixJob._id}`);
    // Line 135: Log Apple job ID
    // `   - Apple: ${appleJob._id}` = Shows Apple job ID with indentation
    console.log(`   - Apple: ${appleJob._id}`);
    
    // Line 137: Check if regular user exists
    // if (regularUser) = If regularUser is not null/undefined
    if (regularUser) {
      // Line 138: Log message about application creation
      // `\n✅ Application created for Microsoft job by user: ${regularUser.email}` = 
      //   Shows user email who applied (with newline)
      console.log(`\n✅ Application created for Microsoft job by user: ${regularUser.email}`);
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
// This starts the script execution when file is run with: node scripts/createHirerJobs.js
createHirerJobs();
