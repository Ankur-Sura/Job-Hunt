/**
 * ===================================================================================
 *                    COMPREHENSIVE FEATURE TEST SCRIPT
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Tests ALL features of the job portal:
 * - User authentication (login/register)
 * - Resume upload
 * - AI match scores
 * - Interview preparation
 * - Job recommendations
 * - Recruiter dashboard
 * - Recruiter features (ATS analysis, project analysis, AI recommendations)
 * 
 * 🔗 HOW TO RUN:
 * --------------
 * node backend/test-all-features.js
 * 
 * ===================================================================================
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8080';
const AI_SERVICE_URL = 'http://localhost:8005';

// Test users
const TEST_USER = {
  email: 'test@test.com',
  password: 'test123',
  name: 'Test User'
};

const TEST_RECRUITER = {
  email: 'hire@gmail.com',
  password: 'hire123',
  name: 'Hire Recruiter'
};

let userToken = null;
let recruiterToken = null;
let userId = null;
let recruiterId = null;
let resumeId = null;
let jobId = null;
let applicationId = null;

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(70));
  log(title, 'blue');
  console.log('-'.repeat(70));
}

// =============================================================================
//                     TEST FUNCTIONS
// =============================================================================

async function testHealthChecks() {
  logSection('1. HEALTH CHECKS');
  
  try {
    const backendHealth = await axios.get(`${BACKEND_URL}/health`);
    log('✅ Backend is running', 'green');
    console.log('   Response:', JSON.stringify(backendHealth.data, null, 2));
    
    try {
      const aiHealth = await axios.get(`${AI_SERVICE_URL}/health`);
      log('✅ AI Service is running', 'green');
      console.log('   Response:', JSON.stringify(aiHealth.data, null, 2));
      
      // Check interview prep availability
      try {
        const interviewTest = await axios.post(`${AI_SERVICE_URL}/interview/prepare`, {
          resume_data: { test: true },
          job_data: { test: true }
        });
        log('✅ Interview prep service is available', 'green');
      } catch (error) {
        if (error.response?.status === 503) {
          log('❌ Interview prep service NOT available', 'red');
          log('   Error: ' + error.response.data.detail, 'yellow');
          log('   Fix: Check if langgraph is installed and AI service restarted', 'yellow');
        } else {
          log('⚠️  Interview prep endpoint exists but may have issues', 'yellow');
        }
      }
    } catch (error) {
      log('❌ AI Service is not running', 'red');
      return false;
    }
    
    return true;
  } catch (error) {
    log('❌ Health check failed', 'red');
    return false;
  }
}

async function testUserAuth() {
  logSection('2. USER AUTHENTICATION');
  
  try {
    // Try login
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      
      userToken = loginResponse.data.token;
      userId = loginResponse.data.user.id;
      log('✅ User logged in successfully', 'green');
      console.log('   User:', loginResponse.data.user.name);
      console.log('   Email:', loginResponse.data.user.email);
      return true;
    } catch (loginError) {
      // Try register
      log('   Login failed, trying to register...', 'yellow');
      const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: TEST_USER.password,
        role: 'user'
      });
      
      userToken = registerResponse.data.token;
      userId = registerResponse.data.user.id;
      log('✅ User registered successfully', 'green');
      return true;
    }
  } catch (error) {
    log('❌ User authentication failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testRecruiterAuth() {
  logSubSection('2.1. RECRUITER AUTHENTICATION');
  
  try {
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: TEST_RECRUITER.email,
      password: TEST_RECRUITER.password
    });
    
    recruiterToken = loginResponse.data.token;
    recruiterId = loginResponse.data.user.id;
    log('✅ Recruiter logged in successfully', 'green');
    console.log('   Recruiter:', loginResponse.data.user.name);
    console.log('   Role:', loginResponse.data.user.role);
    return true;
  } catch (error) {
    log('❌ Recruiter login failed', 'red');
    console.error(error.response?.data || error.message);
    log('   Note: Make sure admin@gmail.com exists with password admin123', 'yellow');
    return false;
  }
}

async function testResumeUpload() {
  logSection('3. RESUME UPLOAD');
  
  try {
    // Check if user already has resume
    const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    if (userResponse.data.user.resumeId) {
      resumeId = userResponse.data.user.resumeId;
      log('✅ User already has resume uploaded', 'green');
      console.log('   Resume ID:', resumeId);
      return true;
    }
    
    log('⚠️  No resume found. Please upload a resume manually for full testing.', 'yellow');
    return true;
  } catch (error) {
    log('❌ Resume check failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testJobRecommendations() {
  logSection('4. JOB RECOMMENDATIONS');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/recommendations`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    if (response.data.recommendations) {
      log(`✅ Retrieved ${response.data.recommendations.length} recommendations`, 'green');
      
      response.data.recommendations.forEach((job, index) => {
        const score = job.fitScore?.fitScore || job.fitScore || 0;
        console.log(`   ${index + 1}. ${job.title} at ${job.company} - ${score}% match`);
      });
      
      if (response.data.recommendations.length > 0) {
        jobId = response.data.recommendations[0]._id;
      }
      
      return true;
    } else {
      log('⚠️  No recommendations returned', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Job recommendations failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testJobApplication() {
  logSection('5. JOB APPLICATION');
  
  try {
    if (!jobId) {
      // Get a job first
      const jobsResponse = await axios.get(`${BACKEND_URL}/api/jobs?limit=1`);
      if (!jobsResponse.data.jobs || jobsResponse.data.jobs.length === 0) {
        log('⚠️  No jobs found', 'yellow');
        return false;
      }
      jobId = jobsResponse.data.jobs[0]._id;
    }
    
    const applyResponse = await axios.post(
      `${BACKEND_URL}/api/applications/apply/${jobId}`,
      {},
      {
        headers: { 'Authorization': `Bearer ${userToken}` }
      }
    );
    
    if (applyResponse.data.success) {
      applicationId = applyResponse.data.application.id;
      log('✅ Job application successful', 'green');
      console.log('   Application ID:', applicationId);
      return true;
    } else {
      log('❌ Application failed', 'red');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes('Already applied')) {
      log('⚠️  Already applied for this job', 'yellow');
      // Get existing application
      const appsResponse = await axios.get(
        `${BACKEND_URL}/api/applications/my-applications`,
        {
          headers: { 'Authorization': `Bearer ${userToken}` }
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

async function testInterviewPrep() {
  logSection('6. INTERVIEW PREPARATION');
  
  try {
    if (!applicationId) {
      log('⚠️  No application ID available', 'yellow');
      return false;
    }
    
    log('   Generating interview prep (this may take 3-5 minutes)...', 'yellow');
    
    const prepResponse = await axios.get(
      `${BACKEND_URL}/api/interview/prepare/${applicationId}`,
      {
        headers: { 'Authorization': `Bearer ${userToken}` },
        timeout: 300000 // 5 minutes
      }
    );
    
    if (prepResponse.data.success) {
      log('✅ Interview preparation generated successfully', 'green');
      console.log('   Job:', prepResponse.data.job.title, 'at', prepResponse.data.job.company);
      
      // Check what data is available
      if (prepResponse.data.company_info) {
        log('   ✅ Company info available', 'green');
      }
      if (prepResponse.data.interview_rounds) {
        log('   ✅ Interview rounds available', 'green');
      }
      if (prepResponse.data.dsa_prep) {
        log('   ✅ DSA preparation available', 'green');
      }
      if (prepResponse.data.system_design_prep) {
        log('   ✅ System Design preparation available', 'green');
      }
      if (prepResponse.data.behavioral_prep) {
        log('   ✅ Behavioral preparation available', 'green');
      }
      if (prepResponse.data.common_questions && prepResponse.data.common_questions.length > 0) {
        log(`   ✅ ${prepResponse.data.common_questions.length} common questions available`, 'green');
      }
      
      return true;
    } else {
      log('❌ Interview preparation failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Interview preparation failed', 'red');
    console.error('   Error:', error.response?.data?.error || error.message);
    
    if (error.code === 'ECONNABORTED') {
      log('   Request timed out - LangGraph may still be processing', 'yellow');
    }
    
    return false;
  }
}

async function testRecruiterJobs() {
  logSection('7. RECRUITER DASHBOARD - JOBS');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/hirer/my-jobs`, {
      headers: { 'Authorization': `Bearer ${recruiterToken}` }
    });
    
    if (response.data.jobs) {
      log(`✅ Retrieved ${response.data.jobs.length} jobs posted by recruiter`, 'green');
      
      response.data.jobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} at ${job.company} - ${job.applications || 0} applications`);
      });
      
      if (response.data.jobs.length > 0) {
        jobId = response.data.jobs[0]._id;
        return true;
      } else {
        log('⚠️  No jobs posted yet', 'yellow');
        return false;
      }
    } else {
      log('❌ Failed to fetch recruiter jobs', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Recruiter jobs fetch failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testRecruiterCandidates() {
  logSection('8. RECRUITER DASHBOARD - CANDIDATES');
  
  try {
    if (!jobId) {
      log('⚠️  No job ID available', 'yellow');
      return false;
    }
    
    const response = await axios.get(
      `${BACKEND_URL}/api/hirer/job/${jobId}/candidates`,
      {
        headers: { 'Authorization': `Bearer ${recruiterToken}` }
      }
    );
    
    if (response.data.candidates) {
      log(`✅ Retrieved ${response.data.candidates.length} candidates`, 'green');
      
      response.data.candidates.forEach((candidate, index) => {
        const score = candidate.fitScore || 0;
        console.log(`   ${index + 1}. ${candidate.user?.name || 'N/A'} - ${score}% match`);
      });
      
      if (response.data.candidates.length > 0) {
        applicationId = response.data.candidates[0]._id;
        return true;
      } else {
        log('⚠️  No candidates for this job', 'yellow');
        return false;
      }
    } else {
      log('❌ Failed to fetch candidates', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Candidates fetch failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testATSAnalysis() {
  logSection('9. RECRUITER - ATS ANALYSIS');
  
  try {
    if (!applicationId) {
      log('⚠️  No application ID available', 'yellow');
      return false;
    }
    
    const response = await axios.post(
      `${BACKEND_URL}/api/hirer/analyze-resume/${applicationId}`,
      {},
      {
        headers: { 'Authorization': `Bearer ${recruiterToken}` },
        timeout: 60000 // 1 minute
      }
    );
    
    if (response.data.success) {
      log('✅ ATS analysis completed', 'green');
      console.log('   ATS Score:', response.data.atsAnalysis?.score || 'N/A');
      console.log('   ATS Friendly:', response.data.atsAnalysis?.isATSFriendly ? 'Yes' : 'No');
      console.log('   Project Analysis:', response.data.projectAnalysis ? 'Available' : 'N/A');
      return true;
    } else {
      log('❌ ATS analysis failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ ATS analysis failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testAIRecruitment() {
  logSection('10. RECRUITER - AI RECOMMENDATION');
  
  try {
    if (!applicationId) {
      log('⚠️  No application ID available', 'yellow');
      return false;
    }
    
    log('   Getting AI recommendation (this may take 2-3 minutes)...', 'yellow');
    
    const response = await axios.post(
      `${BACKEND_URL}/api/hirer/ai-recommendation/${applicationId}`,
      {},
      {
        headers: { 'Authorization': `Bearer ${recruiterToken}` },
        timeout: 180000 // 3 minutes
      }
    );
    
    if (response.data.success) {
      log('✅ AI recommendation generated', 'green');
      console.log('   Recommendation:', response.data.recommendation?.decision || 'N/A');
      console.log('   Confidence:', response.data.recommendation?.confidence || 'N/A');
      return true;
    } else {
      log('❌ AI recommendation failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ AI recommendation failed', 'red');
    console.error('   Error:', error.response?.data?.error || error.message);
    return false;
  }
}

// =============================================================================
//                     MAIN TEST RUNNER
// =============================================================================

async function runAllTests() {
  console.log('\n');
  log('🚀 Starting Comprehensive Feature Tests', 'cyan');
  console.log('\n');
  
  const results = {
    health: false,
    userAuth: false,
    recruiterAuth: false,
    resume: false,
    recommendations: false,
    application: false,
    interviewPrep: false,
    recruiterJobs: false,
    recruiterCandidates: false,
    atsAnalysis: false,
    aiRecruitment: false
  };
  
  // Run tests sequentially
  results.health = await testHealthChecks();
  if (!results.health) {
    log('\n❌ Health checks failed. Please ensure all services are running.', 'red');
    return;
  }
  
  results.userAuth = await testUserAuth();
  results.recruiterAuth = await testRecruiterAuth();
  
  if (!results.userAuth) {
    log('\n❌ User authentication failed. Cannot continue user tests.', 'red');
  }
  
  if (!results.recruiterAuth) {
    log('\n⚠️  Recruiter authentication failed. Skipping recruiter tests.', 'yellow');
  }
  
  if (results.userAuth) {
    results.resume = await testResumeUpload();
    results.recommendations = await testJobRecommendations();
    results.application = await testJobApplication();
    results.interviewPrep = await testInterviewPrep();
  }
  
  if (results.recruiterAuth) {
    results.recruiterJobs = await testRecruiterJobs();
    results.recruiterCandidates = await testRecruiterCandidates();
    results.atsAnalysis = await testATSAnalysis();
    results.aiRecruitment = await testAIRecruitment();
  }
  
  // Summary
  logSection('TEST SUMMARY');
  
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

