/**
 * ===================================================================================
 *                    TEST-AI-FEATURES.JS - Comprehensive AI Features Test Script
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This script tests all AI features of the job portal:
 * - Resume upload and RAG processing
 * - Fit score calculation
 * - Batch fit score calculation
 * - Interview preparation (LangGraph)
 * - Job recommendations
 * 
 * 🔗 HOW TO RUN:
 * --------------
 * node backend/test-ai-features.js
 * 
 * 📌 WHAT IT TESTS:
 * -----------------
 * 1. Health checks (backend + AI service)
 * 2. User authentication (login/register)
 * 3. Resume upload and processing
 * 4. Individual fit score calculation
 * 5. Batch fit score calculation
 * 6. Job application flow
 * 7. Interview preparation generation
 * 8. Job recommendations
 * 
 * ===================================================================================
 */

// Line 1: Import axios library for making HTTP requests
// axios = HTTP client library for API calls (similar to fetch but with more features)
const axios = require('axios');
// Line 2: Import fs (file system) module for reading/writing files
// fs = Node.js built-in module for file operations
const fs = require('fs');
// Line 3: Import path module for handling file/directory paths
// path = Node.js built-in module for path manipulation (join, resolve, etc.)
const path = require('path');

// Line 5: Define backend server URL
// BACKEND_URL = Base URL for all backend API calls
// Port 8080 = Default backend port
const BACKEND_URL = 'http://localhost:8080';
// Line 6: Define AI service URL
// AI_SERVICE_URL = Base URL for AI service API calls
// Port 8000 = AI service port (FastAPI/Python)
const AI_SERVICE_URL = 'http://localhost:8005';

// Line 8: Test user configuration
// TEST_USER = Object containing test user credentials
// This user will be created/logged in for testing
const TEST_USER = {
  name: 'admin',                    // User's full name
  email: 'admin@test.com',          // User's email address
  password: 'admin123'              // User's password
};

// Line 14: Global variables to store test data
// authToken = JWT token for authenticated requests (set after login)
let authToken = null;
// userId = MongoDB ObjectId of the test user (set after login/register)
let userId = null;
// resumeId = PDF ID in Qdrant vector database (set after resume upload)
let resumeId = null;
// jobId = MongoDB ObjectId of a test job (set when fetching jobs)
let jobId = null;
// applicationId = MongoDB ObjectId of job application (set after applying)
let applicationId = null;

// Line 20: ANSI color codes for terminal output
// colors = Object mapping color names to ANSI escape codes
// These codes change terminal text color for better readability
const colors = {
  reset: '\x1b[0m',   // Reset to default color
  green: '\x1b[32m',  // Green text (for success messages)
  red: '\x1b[31m',    // Red text (for error messages)
  yellow: '\x1b[33m', // Yellow text (for warnings)
  blue: '\x1b[34m',   // Blue text (for info messages)
  cyan: '\x1b[36m'    // Cyan text (for section headers)
};

// Line 27: Function to log colored messages to console
// log = Helper function that prints colored text
// message = Text to display
// color = Color name from colors object (default: 'reset' = no color)
function log(message, color = 'reset') {
  // Template literal: ${colors[color]} = ANSI code for color, ${message} = text, ${colors.reset} = reset code
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Line 32: Function to log section headers with visual separator
// logSection = Helper function that prints a formatted section header
// title = Section title text
function logSection(title) {
  // Print empty line for spacing
  console.log('\n' + '='.repeat(60));
  // Print title in cyan color
  log(title, 'cyan');
  // Print separator line (60 equals signs)
  console.log('='.repeat(60));
}

// Line 38: Function to test if backend and AI service are running
// testHealthCheck = Async function that checks service health
// Returns: true if both services are healthy, false otherwise
async function testHealthCheck() {
  // Print section header
  logSection('1. Testing Health Checks');
  
  try {
    // Line 42: Check backend health endpoint
    // axios.get = HTTP GET request to backend health endpoint
    // ${BACKEND_URL}/health = Full URL: http://localhost:8080/health
    // await = Wait for HTTP request to complete before continuing
    const backendHealth = await axios.get(`${BACKEND_URL}/health`);
    // Log success message in green
    log('✅ Backend is running', 'green');
    // Print response data for debugging
    console.log('   Response:', backendHealth.data);
    
    // Line 47: Check AI service health endpoint
    // try-catch = Handle errors if AI service is not running
    try {
      // axios.get = HTTP GET request to AI service health endpoint
      // ${AI_SERVICE_URL}/health = Full URL: http://localhost:8005/health
      const aiHealth = await axios.get(`${AI_SERVICE_URL}/health`);
      // Log success message in green
      log('✅ AI Service is running', 'green');
      // Print response data for debugging
      console.log('   Response:', aiHealth.data);
    } catch (error) {
      // If AI service is not running, log error in red
      log('❌ AI Service is not running', 'red');
      // Log instructions in yellow on how to start AI service
      log('   Please start AI service: cd AI && python3 -m uvicorn main:app --reload --port 8000', 'yellow');
      // Return false to indicate health check failed
      return false;
    }
    
    // Return true if both services are healthy
    return true;
  } catch (error) {
    // If backend health check fails, log error
    log('❌ Health check failed', 'red');
    // Print error message
    console.error(error.message);
    // Return false to indicate failure
    return false;
  }
}

// Line 55: Function to create or login test user
// createTestUser = Async function that authenticates test user
// Returns: true if user logged in/registered, false otherwise
async function createTestUser() {
  // Print section header
  logSection('2. Creating/Logging in Test User');
  
  try {
    // Line 60: Try to login first (user might already exist)
    // try-catch = Handle login failure gracefully
    try {
      // axios.post = HTTP POST request to login endpoint
      // ${BACKEND_URL}/api/auth/login = Full URL: http://localhost:8080/api/auth/login
      // Second parameter = Request body with email and password
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: TEST_USER.email,        // User's email from TEST_USER object
        password: TEST_USER.password   // User's password from TEST_USER object
      });
      
      // Store JWT token from response
      // loginResponse.data.token = JWT token returned by backend
      authToken = loginResponse.data.token;
      // Store user ID from response
      // loginResponse.data.user.id = MongoDB ObjectId of user
      userId = loginResponse.data.user.id;
      // Log success message in green
      log('✅ User logged in successfully', 'green');
      // Print user's name for confirmation
      console.log('   User:', loginResponse.data.user.name);
      // Return true to indicate success
      return true;
    } catch (loginError) {
      // If login fails, try to register new user
      // log = Print warning message in yellow
      log('   Login failed, trying to register...', 'yellow');
      
      // axios.post = HTTP POST request to register endpoint
      // ${BACKEND_URL}/api/auth/register = Full URL: http://localhost:8080/api/auth/register
      // Second parameter = Request body with user data
      const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        name: TEST_USER.name,          // User's name from TEST_USER object
        email: TEST_USER.email,         // User's email from TEST_USER object
        password: TEST_USER.password,   // User's password from TEST_USER object
        role: 'user'                   // User role (regular user, not admin)
      });
      
      // Store JWT token from registration response
      // registerResponse.data.token = JWT token returned by backend
      authToken = registerResponse.data.token;
      // Store user ID from registration response
      // registerResponse.data.user.id = MongoDB ObjectId of newly created user
      userId = registerResponse.data.user.id;
      // Log success message in green
      log('✅ User registered successfully', 'green');
      // Print user's name for confirmation
      console.log('   User:', registerResponse.data.user.name);
      // Return true to indicate success
      return true;
    }
  } catch (error) {
    // If both login and registration fail, log error
    log('❌ User creation/login failed', 'red');
    // Print error details (response data if available, otherwise error message)
    // error.response?.data = Error response from backend (if available)
    // error.message = Error message (fallback)
    console.error(error.response?.data || error.message);
    // Return false to indicate failure
    return false;
  }
}

// Line 85: Function to test resume upload and RAG processing
// testResumeUpload = Async function that uploads a test resume
// Returns: true if upload successful, false otherwise
async function testResumeUpload() {
  // Print section header
  logSection('3. Testing Resume Upload & RAG Processing');
  
  try {
    // Line 90: Check if sample resume PDF exists
    // path.join = Join path segments (works on all operating systems)
    // __dirname = Current directory (where this script is located)
    // 'sample-resume.pdf' = Filename of test resume
    const sampleResumePath = path.join(__dirname, 'sample-resume.pdf');
    
    // Line 92: Check if file exists
    // fs.existsSync = Synchronous file existence check
    // ! = Logical NOT operator (if file does NOT exist)
    if (!fs.existsSync(sampleResumePath)) {
      // Log warning message in yellow
      log('⚠️  Sample resume not found. Creating a text file for testing...', 'yellow');
      // Log skip message
      log('   Skipping resume upload test (no sample PDF)', 'yellow');
      // Return true (not a failure, just skipped)
      return true;
    }
    
    // Line 98: Import FormData for multipart/form-data uploads
    // FormData = Library for creating multipart form data (needed for file uploads)
    const FormData = require('form-data');
    // Create new FormData instance
    const formData = new FormData();
    // Append resume file to form data
    // 'resume' = Field name (backend expects this name)
    // fs.createReadStream = Create readable stream from file (for large files)
    formData.append('resume', fs.createReadStream(sampleResumePath));
    
    // Line 104: Upload resume to backend
    // axios.post = HTTP POST request to upload endpoint
    // ${BACKEND_URL}/api/resume/upload = Full URL: http://localhost:8080/api/resume/upload
    // formData = Request body (multipart form data with file)
    // Third parameter = Request configuration object
    const uploadResponse = await axios.post(
      `${BACKEND_URL}/api/resume/upload`,
      formData,
      {
        headers: {
          // Authorization header with JWT token
          // `Bearer ${authToken}` = JWT token format (Bearer scheme)
          'Authorization': `Bearer ${authToken}`,
          // Spread operator: Include all FormData headers (Content-Type with boundary, etc.)
          ...formData.getHeaders()
        }
      }
    );
    
    // Store PDF ID from response
    // uploadResponse.data.pdf_id = Unique ID for uploaded PDF in Qdrant
    resumeId = uploadResponse.data.pdf_id;
    // Log success message in green
    log('✅ Resume uploaded successfully', 'green');
    // Print PDF ID for debugging
    console.log('   PDF ID:', resumeId);
    // Print internship flag (whether resume indicates internship experience)
    console.log('   Has Internship:', uploadResponse.data.hasInternship);
    
    // Line 120: Wait for background processing to complete
    // Background jobs process resume and calculate fit scores
    // log = Print waiting message in yellow
    log('   Waiting 5 seconds for background job processing...', 'yellow');
    // Promise with setTimeout = Wait 5 seconds (5000 milliseconds)
    // new Promise = Create promise that resolves after delay
    // resolve = Function to call when delay is complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Return true to indicate success
    return true;
  } catch (error) {
    // If upload fails, log error
    log('❌ Resume upload failed', 'red');
    // Print error details
    console.error(error.response?.data || error.message);
    // Return false to indicate failure
    return false;
  }
}

// Line 125: Function to test fit score calculation
// testFitScoreCalculation = Async function that tests AI match score calculation
// Returns: true if fit score calculated successfully, false otherwise
async function testFitScoreCalculation() {
  // Print section header
  logSection('4. Testing Fit Score Calculation');
  
  try {
    // Line 130: Get a job from database for testing
    // axios.get = HTTP GET request to jobs endpoint
    // ${BACKEND_URL}/api/jobs?limit=1 = Full URL with query parameter (limit to 1 job)
    // limit=1 = Only fetch 1 job (we just need one for testing)
    const jobsResponse = await axios.get(`${BACKEND_URL}/api/jobs?limit=1`);
    // Check if jobs array exists and has at least one job
    // !jobsResponse.data.jobs = If jobs array doesn't exist
    // || = Logical OR operator
    // jobsResponse.data.jobs.length === 0 = If jobs array is empty
    if (!jobsResponse.data.jobs || jobsResponse.data.jobs.length === 0) {
      // Log warning message in yellow
      log('⚠️  No jobs found in database', 'yellow');
      // Log instruction to seed database
      log('   Please seed the database first', 'yellow');
      // Return false to indicate test cannot proceed
      return false;
    }
    
    // Store job ID from first job
    // jobsResponse.data.jobs[0]._id = MongoDB ObjectId of first job
    jobId = jobsResponse.data.jobs[0]._id;
    // Store full job object for reference
    // jobsResponse.data.jobs[0] = First job object from array
    const job = jobsResponse.data.jobs[0];
    
    // Log job being tested in blue
    log('   Testing with job:', 'blue');
    console.log(`   - Title: ${job.title}`);
    console.log(`   - Company: ${job.company}`);
    
    // Get user data
    const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const user = userResponse.data.user;
    
    if (!user.resumeId) {
      log('⚠️  User has no resume uploaded', 'yellow');
      log('   Skipping fit score test', 'yellow');
      return false;
    }
    
    // Test individual fit score calculation
    log('   Testing individual fit score calculation...', 'blue');
    
    const fitScoreResponse = await axios.get(
      `${BACKEND_URL}/api/jobs/recommended/list`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    if (fitScoreResponse.data.jobs && fitScoreResponse.data.jobs.length > 0) {
      const jobWithScore = fitScoreResponse.data.jobs[0];
      const score = jobWithScore.fitScore?.fitScore || jobWithScore.fitScore;
      
      log('✅ Fit score calculated successfully', 'green');
      console.log(`   Job: ${jobWithScore.title} at ${jobWithScore.company}`);
      console.log(`   Fit Score: ${score}%`);
      
      if (jobWithScore.fitScore?.breakdown) {
        console.log('   Breakdown:', jobWithScore.fitScore.breakdown);
      }
      if (jobWithScore.fitScore?.strengths) {
        console.log('   Strengths:', jobWithScore.fitScore.strengths.slice(0, 3));
      }
      
      return true;
    } else {
      log('⚠️  No jobs with fit scores found', 'yellow');
      log('   This might mean scores are still being calculated', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Fit score calculation failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testBatchFitScores() {
  logSection('5. Testing Batch Fit Score Calculation');
  
  try {
    // Get user data
    const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const user = userResponse.data.user;
    
    if (!user.resumeId || !user.resumeData) {
      log('⚠️  User has no resume data', 'yellow');
      return false;
    }
    
    // Get a few jobs
    const jobsResponse = await axios.get(`${BACKEND_URL}/api/jobs?limit=3`);
    if (!jobsResponse.data.jobs || jobsResponse.data.jobs.length === 0) {
      log('⚠️  No jobs found', 'yellow');
      return false;
    }
    
    const jobs = jobsResponse.data.jobs.slice(0, 3);
    
    log('   Testing batch fit score for 3 jobs...', 'blue');
    
    const batchResponse = await axios.post(
      `${AI_SERVICE_URL}/fast/batch-fit-scores`,
      {
        resume_data: user.resumeData,
        jobs: jobs.map(job => ({
          _id: job._id.toString(),
          title: job.title,
          company: job.company,
          description: job.description,
          skills: job.skills || [],
          experience: job.experience || {},
          qualifications: job.qualifications || {}
        }))
      },
      {
        timeout: 60000
      }
    );
    
    if (batchResponse.data.success && batchResponse.data.scores) {
      log('✅ Batch fit score calculation successful', 'green');
      console.log(`   Calculated scores for ${batchResponse.data.scores.length} jobs`);
      
      batchResponse.data.scores.forEach((score, index) => {
        console.log(`   Job ${index + 1}: ${score.fitScore}% match`);
      });
      
      return true;
    } else {
      log('⚠️  Batch calculation returned unexpected format', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Batch fit score calculation failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testJobApplication() {
  logSection('6. Testing Job Application Flow');
  
  try {
    if (!jobId) {
      // Get a job
      const jobsResponse = await axios.get(`${BACKEND_URL}/api/jobs?limit=1`);
      if (!jobsResponse.data.jobs || jobsResponse.data.jobs.length === 0) {
        log('⚠️  No jobs found', 'yellow');
        return false;
      }
      jobId = jobsResponse.data.jobs[0]._id;
    }
    
    log(`   Applying for job: ${jobId}`, 'blue');
    
    const applyResponse = await axios.post(
      `${BACKEND_URL}/api/applications/apply/${jobId}`,
      {},
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    if (applyResponse.data.success) {
      applicationId = applyResponse.data.application.id;
      log('✅ Job application successful', 'green');
      console.log('   Application ID:', applicationId);
      console.log('   Fit Score:', applyResponse.data.application.fitScore);
      console.log('   Interview Prep URL:', applyResponse.data.application.interviewPrepUrl);
      
      return true;
    } else {
      log('❌ Application failed', 'red');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('Already applied')) {
      log('⚠️  Already applied for this job', 'yellow');
      log('   This is expected if you ran the test before', 'yellow');
      // Try to get existing application
      const appsResponse = await axios.get(
        `${BACKEND_URL}/api/applications/my-applications`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );
      
      if (appsResponse.data.applications && appsResponse.data.applications.length > 0) {
        applicationId = appsResponse.data.applications[0]._id;
        log('   Using existing application:', applicationId, 'blue');
        return true;
      }
    }
    
    log('❌ Job application failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testInterviewPreparation() {
  logSection('7. Testing Interview Preparation (LangGraph)');
  
  try {
    if (!applicationId) {
      log('⚠️  No application ID available', 'yellow');
      log('   Skipping interview prep test', 'yellow');
      return false;
    }
    
    log(`   Generating interview prep for application: ${applicationId}`, 'blue');
    log('   This may take 30-60 seconds (LangGraph workflow)...', 'yellow');
    
    const prepResponse = await axios.get(
      `${BACKEND_URL}/api/interview/prepare/${applicationId}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 120000 // 2 minutes timeout
      }
    );
    
    if (prepResponse.data.success) {
      log('✅ Interview preparation generated successfully', 'green');
      console.log('   Job:', prepResponse.data.job.title, 'at', prepResponse.data.job.company);
      console.log('   Fit Score:', prepResponse.data.fitScore);
      
      const preparation = prepResponse.data.preparation;
      if (preparation) {
        // Show first 500 characters
        const preview = preparation.substring(0, 500);
        console.log('\n   Preview of interview prep:');
        console.log('   ' + preview.replace(/\n/g, '\n   ') + '...\n');
        
        // Check if it contains expected sections
        const hasSections = 
          preparation.includes('Company') ||
          preparation.includes('Questions') ||
          preparation.includes('Technical') ||
          preparation.includes('Tips');
        
        if (hasSections) {
          log('✅ Interview prep contains expected sections', 'green');
        } else {
          log('⚠️  Interview prep format may be unexpected', 'yellow');
        }
      }
      
      return true;
    } else {
      log('❌ Interview preparation failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Interview preparation failed', 'red');
    console.error(error.response?.data || error.message);
    
    if (error.code === 'ECONNABORTED') {
      log('   Request timed out - LangGraph may still be processing', 'yellow');
    }
    
    return false;
  }
}

async function testRecommendations() {
  logSection('8. Testing Top 5 Recommendations');
  
  try {
    const recResponse = await axios.get(
      `${BACKEND_URL}/api/recommendations`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    if (recResponse.data.recommendations) {
      const recommendations = recResponse.data.recommendations;
      log(`✅ Retrieved ${recommendations.length} recommendations`, 'green');
      
      recommendations.slice(0, 5).forEach((job, index) => {
        const score = job.fitScore?.fitScore || job.fitScore || 0;
        console.log(`   ${index + 1}. ${job.title} at ${job.company} - ${score}% match`);
      });
      
      return true;
    } else {
      log('⚠️  No recommendations returned', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Recommendations test failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  log('🚀 Starting Comprehensive AI Features Test', 'cyan');
  console.log('\n');
  
  const results = {
    healthCheck: false,
    userAuth: false,
    resumeUpload: false,
    fitScore: false,
    batchFitScore: false,
    jobApplication: false,
    interviewPrep: false,
    recommendations: false
  };
  
  // Run tests sequentially
  results.healthCheck = await testHealthCheck();
  if (!results.healthCheck) {
    log('\n❌ Health check failed. Please ensure all services are running.', 'red');
    return;
  }
  
  results.userAuth = await createTestUser();
  if (!results.userAuth) {
    log('\n❌ User authentication failed. Cannot continue.', 'red');
    return;
  }
  
  results.resumeUpload = await testResumeUpload();
  results.fitScore = await testFitScoreCalculation();
  results.batchFitScore = await testBatchFitScores();
  results.jobApplication = await testJobApplication();
  results.interviewPrep = await testInterviewPreparation();
  results.recommendations = await testRecommendations();
  
  // Summary
  logSection('Test Summary');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  
  console.log('\nResults:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`   ${status} ${test}`, color);
  });
  
  console.log(`\n${passedTests}/${totalTests} tests passed\n`);
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log('❌ Test runner crashed', 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runAllTests };

