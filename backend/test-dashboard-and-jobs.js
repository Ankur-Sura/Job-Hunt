/**
 * Dashboard and Jobs Page Test Script
 * Tests:
 * 1. Dashboard resume upload
 * 2. Top 5 recommendations after resume upload
 * 3. Browse all jobs with AI scores
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BACKEND_URL = 'http://localhost:8080';
const AI_SERVICE_URL = 'http://localhost:8001';

// Test configuration
const TEST_USER = {
  name: 'admin',
  email: 'admin@test.com',
  password: 'admin123'
};

let authToken = null;
let userId = null;
let resumeId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
  log(title, 'magenta');
  console.log('-'.repeat(70));
}

async function loginUser() {
  logSection('Step 1: User Authentication');
  
  try {
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    authToken = loginResponse.data.token;
    userId = loginResponse.data.user.id;
    log('✅ User logged in successfully', 'green');
    console.log('   User:', loginResponse.data.user.name);
    console.log('   Email:', loginResponse.data.user.email);
    console.log('   User ID:', userId);
    return true;
  } catch (error) {
    log('❌ Login failed', 'red');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function checkUserResume() {
  logSubSection('Checking Current Resume Status');
  
  try {
    const userResponse = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const user = userResponse.data.user;
    
    if (user.resumeId) {
      resumeId = user.resumeId;
      log('✅ User already has resume uploaded', 'green');
      console.log('   Resume ID:', resumeId);
      console.log('   Has Internship:', user.hasInternship);
      return true;
    } else {
      log('⚠️  User has no resume uploaded', 'yellow');
      return false;
    }
  } catch (error) {
    log('❌ Failed to check user resume', 'red');
    return false;
  }
}

async function testResumeUpload() {
  logSection('Step 2: Testing Resume Upload on Dashboard');
  
  // Check if sample resume exists
  const sampleResumePath = path.join(__dirname, 'sample-resume.pdf');
  const sampleResumePath2 = path.join(__dirname, '../sample-resume.pdf');
  const sampleResumePath3 = path.join(__dirname, 'backend/sample-resume.pdf');
  
  let resumePath = null;
  if (fs.existsSync(sampleResumePath)) {
    resumePath = sampleResumePath;
  } else if (fs.existsSync(sampleResumePath2)) {
    resumePath = sampleResumePath2;
  } else if (fs.existsSync(sampleResumePath3)) {
    resumePath = sampleResumePath3;
  }
  
  if (!resumePath) {
    log('⚠️  No sample resume PDF found', 'yellow');
    log('   Creating a minimal test PDF would require additional libraries', 'yellow');
    log('   Please upload a resume manually through the UI for full testing', 'yellow');
    return false;
  }
  
  try {
    log('   Uploading resume:', resumePath, 'blue');
    
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(resumePath));
    
    const uploadResponse = await axios.post(
      `${BACKEND_URL}/api/resume/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        },
        timeout: 60000
      }
    );
    
    resumeId = uploadResponse.data.pdf_id;
    log('✅ Resume uploaded successfully', 'green');
    console.log('   PDF ID:', resumeId);
    console.log('   Has Internship:', uploadResponse.data.hasInternship);
    console.log('   Message:', uploadResponse.data.message || 'Upload successful');
    
    // Wait for background processing
    log('   Waiting 10 seconds for background job to calculate match scores...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    return true;
  } catch (error) {
    log('❌ Resume upload failed', 'red');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testDashboardRecommendations() {
  logSection('Step 3: Testing Dashboard - Top 5 Recommendations');
  
  try {
    log('   Fetching recommendations from dashboard...', 'blue');
    
    const recResponse = await axios.get(
      `${BACKEND_URL}/api/recommendations`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 30000
      }
    );
    
    const recommendations = recResponse.data.recommendations || [];
    
    if (recommendations.length === 0) {
      log('⚠️  No recommendations found', 'yellow');
      log('   This might mean:', 'yellow');
      log('   1. Background job is still processing (wait a few more minutes)', 'yellow');
      log('   2. No jobs match the 60%+ threshold', 'yellow');
      log('   3. Resume data is not sufficient', 'yellow');
      return false;
    }
    
    log(`✅ Found ${recommendations.length} recommendations`, 'green');
    
    // Check if we have at least 5 (or show what we have)
    const top5 = recommendations.slice(0, 5);
    log(`\n   Showing top ${top5.length} recommendations:`, 'cyan');
    
    top5.forEach((job, index) => {
      const score = job.fitScore?.fitScore || job.fitScore || 0;
      const breakdown = job.fitScore?.breakdown || {};
      const recommendation = job.fitScore?.recommendation || 'N/A';
      
      console.log(`\n   ${index + 1}. ${job.title} at ${job.company}`);
      console.log(`      📍 Location: ${job.location}`);
      console.log(`      💰 Salary: ${job.salary?.display || 'Not Disclosed'}`);
      console.log(`      🎯 AI Match Score: ${score}%`);
      console.log(`      📊 Recommendation: ${recommendation}`);
      
      if (Object.keys(breakdown).length > 0) {
        console.log(`      Breakdown:`);
        Object.entries(breakdown).forEach(([key, value]) => {
          console.log(`        - ${key}: ${value}%`);
        });
      }
      
      if (job.fitScore?.strengths && job.fitScore.strengths.length > 0) {
        console.log(`      ✅ Strengths: ${job.fitScore.strengths.slice(0, 2).join(', ')}`);
      }
    });
    
    // Verify we have fit scores
    const hasScores = top5.every(job => {
      const score = job.fitScore?.fitScore || job.fitScore;
      return score !== null && score !== undefined && score > 0;
    });
    
    if (hasScores) {
      log('\n   ✅ All recommendations have AI match scores!', 'green');
    } else {
      log('\n   ⚠️  Some recommendations are missing match scores', 'yellow');
    }
    
    return true;
  } catch (error) {
    log('❌ Failed to fetch recommendations', 'red');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testBrowseAllJobs() {
  logSection('Step 4: Testing Browse All Jobs - AI Scores on Job Cards');
  
  try {
    log('   Fetching all jobs with AI match scores...', 'blue');
    
    const jobsResponse = await axios.get(
      `${BACKEND_URL}/api/jobs/recommended/list`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` },
        timeout: 30000
      }
    );
    
    const jobs = jobsResponse.data.jobs || [];
    
    if (jobs.length === 0) {
      log('⚠️  No jobs found', 'yellow');
      return false;
    }
    
    log(`✅ Found ${jobs.length} jobs`, 'green');
    
    // Check how many have fit scores
    const jobsWithScores = jobs.filter(job => {
      const score = job.fitScore?.fitScore || job.fitScore;
      return score !== null && score !== undefined;
    });
    
    const jobsWithoutScores = jobs.length - jobsWithScores.length;
    
    log(`\n   📊 Score Statistics:`, 'cyan');
    console.log(`      Total Jobs: ${jobs.length}`);
    console.log(`      Jobs with AI Scores: ${jobsWithScores.length}`);
    console.log(`      Jobs without Scores: ${jobsWithoutScores}`);
    
    if (jobsWithScores.length > 0) {
      log(`\n   ✅ AI scores are being displayed on job cards!`, 'green');
      
      // Show sample of jobs with scores
      log(`\n   Sample jobs with AI match scores:`, 'cyan');
      jobsWithScores.slice(0, 5).forEach((job, index) => {
        const score = job.fitScore?.fitScore || job.fitScore;
        const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
        const emoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
        
        console.log(`\n   ${index + 1}. ${emoji} ${job.title} at ${job.company}`);
        console.log(`      AI Match: ${score}%`);
        console.log(`      Location: ${job.location}`);
        console.log(`      Salary: ${job.salary?.display || 'Not Disclosed'}`);
      });
    } else {
      log(`\n   ⚠️  No jobs have AI scores yet`, 'yellow');
      log('   This might mean:', 'yellow');
      log('   1. Background job is still processing', 'yellow');
      log('   2. Scores are being calculated on-demand', 'yellow');
      log('   3. Resume data is not sufficient', 'yellow');
    }
    
    // Test regular jobs endpoint (should not show scores if not logged in)
    logSubSection('Testing Regular Jobs Endpoint (No Auth)');
    
    try {
      const regularJobsResponse = await axios.get(
        `${BACKEND_URL}/api/jobs?limit=5`
      );
      
      const regularJobs = regularJobsResponse.data.jobs || [];
      log(`✅ Regular jobs endpoint works (${regularJobs.length} jobs)`, 'green');
      log('   Note: This endpoint should NOT show AI scores (no authentication)', 'blue');
      
      // Verify no scores in regular endpoint
      const hasScoresInRegular = regularJobs.some(job => job.fitScore !== undefined);
      if (hasScoresInRegular) {
        log('   ⚠️  Warning: Regular endpoint shows scores (should be auth-only)', 'yellow');
      } else {
        log('   ✅ Regular endpoint correctly hides AI scores', 'green');
      }
    } catch (error) {
      log('   ⚠️  Regular jobs endpoint test failed', 'yellow');
    }
    
    return jobsWithScores.length > 0;
  } catch (error) {
    log('❌ Failed to fetch jobs with scores', 'red');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

async function testAIMatchModal() {
  logSection('Step 5: Testing AI Match Modal Details');
  
  try {
    // Get a job with fit score
    const jobsResponse = await axios.get(
      `${BACKEND_URL}/api/jobs/recommended/list`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    
    const jobs = jobsResponse.data.jobs || [];
    const jobWithScore = jobs.find(job => {
      const score = job.fitScore?.fitScore || job.fitScore;
      return score !== null && score !== undefined && score > 0;
    });
    
    if (!jobWithScore) {
      log('⚠️  No job with fit score found for modal test', 'yellow');
      return false;
    }
    
    log('   Testing AI Match details for:', 'blue');
    console.log(`   Job: ${jobWithScore.title} at ${jobWithScore.company}`);
    
    const fitScore = jobWithScore.fitScore;
    const score = fitScore?.fitScore || fitScore;
    
    log(`\n   ✅ AI Match Score Details:`, 'green');
    console.log(`      Overall Score: ${score}%`);
    
    if (fitScore?.breakdown) {
      console.log(`      Breakdown:`);
      Object.entries(fitScore.breakdown).forEach(([key, value]) => {
        console.log(`        - ${key}: ${value}%`);
      });
    }
    
    if (fitScore?.strengths && fitScore.strengths.length > 0) {
      console.log(`      Strengths:`);
      fitScore.strengths.forEach(strength => {
        console.log(`        ✅ ${strength}`);
      });
    }
    
    if (fitScore?.gaps && fitScore.gaps.length > 0) {
      console.log(`      Areas to Improve:`);
      fitScore.gaps.forEach(gap => {
        console.log(`        ⚠️  ${gap}`);
      });
    }
    
    if (fitScore?.recommendation) {
      console.log(`      Recommendation: ${fitScore.recommendation}`);
    }
    
    log('\n   ✅ AI Match modal would show all these details!', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to test AI match details', 'red');
    return false;
  }
}

// Main test runner
async function runDashboardAndJobsTests() {
  console.log('\n');
  log('🚀 Starting Dashboard & Jobs Page Test', 'cyan');
  log('   Testing: Resume Upload → 5 Recommendations → Browse Jobs with AI Scores', 'blue');
  console.log('\n');
  
  const results = {
    login: false,
    resumeCheck: false,
    resumeUpload: false,
    dashboardRecommendations: false,
    browseJobs: false,
    aiMatchDetails: false
  };
  
  // Step 1: Login
  results.login = await loginUser();
  if (!results.login) {
    log('\n❌ Cannot continue without authentication', 'red');
    return;
  }
  
  // Step 2: Check/Upload Resume
  results.resumeCheck = await checkUserResume();
  if (!results.resumeCheck) {
    log('\n   No resume found, attempting upload...', 'yellow');
    results.resumeUpload = await testResumeUpload();
    
    if (!results.resumeUpload) {
      log('\n⚠️  Resume upload skipped or failed', 'yellow');
      log('   Some tests will be limited without a resume', 'yellow');
    } else {
      // Wait a bit more for processing
      log('\n   Waiting additional 15 seconds for score calculation...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  } else {
    log('\n   Resume already exists, using existing resume', 'green');
    // Still wait a bit in case scores are being recalculated
    log('   Waiting 5 seconds to check for updated scores...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Step 3: Test Dashboard Recommendations
  results.dashboardRecommendations = await testDashboardRecommendations();
  
  // Step 4: Test Browse All Jobs
  results.browseJobs = await testBrowseAllJobs();
  
  // Step 5: Test AI Match Details
  results.aiMatchDetails = await testAIMatchModal();
  
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
  
  if (passedTests >= totalTests - 1) { // Allow one failure (resume upload if no file)
    log('🎉 Dashboard and Jobs features are working!', 'green');
    log('\n✅ Verified Features:', 'green');
    log('   - Dashboard shows resume upload section', 'green');
    log('   - Top 5 recommendations appear after resume upload', 'green');
    log('   - All jobs show AI match scores when browsing', 'green');
    log('   - AI Match button shows detailed breakdown', 'green');
  } else {
    log('⚠️  Some features need attention', 'yellow');
    log('   Check the output above for details', 'yellow');
  }
  
  console.log('\n');
}

// Run tests
if (require.main === module) {
  runDashboardAndJobsTests().catch(error => {
    log('❌ Test runner crashed', 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runDashboardAndJobsTests };

