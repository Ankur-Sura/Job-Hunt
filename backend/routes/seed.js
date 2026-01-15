/**
 * ===================================================================================
 *                    SEED ROUTES - Database Seeding Endpoint
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Express router for seeding the database with initial job data.
 * Used for development/testing to populate database with sample jobs.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. POST /api/seed → Clears existing jobs
 * 2. Inserts 2 initial jobs (Icertis, Amazon)
 * 3. Generates 200 additional random jobs
 * 4. Returns success message with count
 * 
 * 📌 USAGE:
 * ---------
 * POST /api/seed - Seeds database with sample jobs
 * 
 * ⚠️ WARNING:
 * -----------
 * This endpoint DELETES all existing jobs before seeding.
 * Use only in development/testing environments.
 * 
 * ===================================================================================
 */

// Line 1: Import Express framework
// express = Web framework for Node.js
const express = require('express');
// Line 2: Import mongoose library
// mongoose = MongoDB object modeling library
// Not directly used here, but may be needed for connection
const mongoose = require('mongoose');
// Line 3: Import Job model
// Job = Mongoose model for job documents
// Used to create/delete job documents
const Job = require('../models/Job');
// Line 4: Create Express router
// router = Mini-app for handling routes
const router = express.Router();

// Line 6: Define initial jobs array
// These are hardcoded sample jobs (Icertis, Amazon)
// Used as seed data for development/testing
const initialJobs = [
  {
    company: 'Icertis',
    companyLogo: '',
    title: 'Software Engineer',
    location: 'Pune',
    jobMode: 'On-Site',
    salary: { min: 1000000, max: 1400000, currency: 'INR', display: '₹ 10-14 LPA' },
    experience: { min: 2, max: 4, display: '2-4 Years' },
    jobType: 'Full Time',
    description: 'Icertis is looking for a Software Engineer to join our team. You will be responsible for developing and maintaining enterprise software solutions. We work with cutting-edge technologies and offer a collaborative work environment.\n\nKey Responsibilities:\n- Design and develop scalable, maintainable, and efficient software solutions\n- Collaborate with team members to define technical requirements and architecture\n- Write clean, well-documented code following best practices and coding standards\n- Participate in code reviews to ensure code quality and knowledge sharing\n- Debug and resolve technical issues in production and development environments\n- Stay updated with the latest technologies and industry trends\n- Contribute to technical documentation and knowledge sharing sessions',
    requirements: ['Strong programming skills', 'Problem-solving ability', 'Team collaboration'],
    skills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'REST APIs'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '2+ years of software development experience'],
      preferred: ['Experience with cloud platforms', 'Knowledge of Agile methodologies']
    },
    applicationEndDate: new Date('2025-12-20'),
    status: 'Hiring Now',
    views: 2187,
    tags: ['New Opening'],
    isInternship: false
  },
  {
    company: 'Amazon',
    companyLogo: '',
    title: 'Software Development Engineer',
    location: 'Bangalore Urban',
    jobMode: 'On-Site',
    salary: { min: 2300000, max: 3000000, currency: 'INR', display: '₹ 23-30 LPA' },
    experience: { min: 2, max: 3, display: '2-3 Years' },
    jobType: 'Full Time',
    description: 'Amazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking. We are driven by the excitement of building technologies, inventing products, and providing services that change lives.\n\nAs a Software Development Engineer, you will work on large-scale distributed systems, design and implement new features, and solve complex technical challenges. You will collaborate with cross-functional teams to deliver high-quality software solutions.',
    requirements: ['3+ years of professional software development', 'Strong problem-solving skills', 'Experience with system design'],
    skills: ['Java', 'Python', 'AWS', 'Distributed Systems', 'API Development', 'SDLC'],
    qualifications: {
      basic: ['3+ years of non-internship professional software development experience', '2+ years of design or architecture experience', 'Experience programming with at least one software programming language'],
      preferred: ['3+ years of full software development life cycle experience', 'Bachelor\'s degree in computer science or equivalent']
    },
    applicationStartDate: new Date('2025-12-13'),
    applicationEndDate: new Date('2025-12-20'),
    status: 'Hiring Now',
    views: 2107,
    tags: ['New Opening'],
    isInternship: false
  }
];

/**
 * =============================================================================
 *                     GENERATE MORE JOBS FUNCTION
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Generates 200 random jobs with realistic data.
 * Used to populate database with sample jobs for testing.
 * 
 * 🔗 HOW IT WORKS:
 * ---------------
 * 1. Defines arrays of companies, titles, locations, skills
 * 2. Loops 200 times
 * 3. Randomly selects values from arrays
 * 4. Generates job object with random data
 * 5. Returns array of 200 jobs
 * 
 * =============================================================================
 */
// Line 55: Define function to generate random jobs
// generateMoreJobs = Function that creates 200 random job objects
function generateMoreJobs() {
  // Line 56: Array of company names
  // Used to randomly assign companies to generated jobs
  const companies = ['Microsoft', 'Google', 'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'Razorpay', 'Ola', 'Uber', 'Infosys', 'TCS', 'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Tech Mahindra', 'IBM', 'Oracle', 'SAP', 'Salesforce', 'Adobe', 'VMware', 'Red Hat', 'Intel', 'NVIDIA'];
  // Line 57: Array of job titles
  // Used to randomly assign titles to generated jobs
  const titles = ['Software Engineer', 'Senior Software Engineer', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Engineer', 'ML Engineer', 'QA Engineer', 'Mobile Developer', 'Cloud Engineer', 'Security Engineer'];
  // Line 58: Array of locations
  // Used to randomly assign locations to generated jobs
  const locations = ['Bangalore Urban', 'Pune', 'Mumbai', 'Hyderabad', 'Chennai', 'Delhi', 'Gurgaon', 'Noida', 'Kolkata'];
  // Line 59: Array of skills arrays
  // Each sub-array represents a tech stack
  // Used to randomly assign skills to generated jobs
  const skillsList = [
    ['Java', 'Spring Boot', 'Microservices'],    // Java stack
    ['Python', 'Django', 'Flask'],               // Python stack
    ['JavaScript', 'React', 'Node.js'],          // JavaScript stack
    ['C#', '.NET', 'ASP.NET'],                   // .NET stack
    ['Go', 'Docker', 'Kubernetes'],              // Go/DevOps stack
    ['Ruby', 'Rails', 'PostgreSQL'],              // Ruby stack
    ['PHP', 'Laravel', 'MySQL'],                 // PHP stack
    ['Scala', 'Spark', 'Kafka']                  // Big Data stack
  ];

  // Line 71: Initialize empty array to store generated jobs
  const moreJobs = [];
  // Line 72: Loop 200 times to generate 200 jobs
  // i = Loop counter (0 to 199)
  for (let i = 0; i < 200; i++) {
    // Line 73: Randomly select company from companies array
    // Math.random() = Returns random number between 0 and 1
    // Math.floor() = Rounds down to nearest integer
    // companies.length = Number of companies in array
    // Result: Random index from 0 to companies.length-1
    const company = companies[Math.floor(Math.random() * companies.length)];
    // Line 74: Randomly select title from titles array
    const title = titles[Math.floor(Math.random() * titles.length)];
    // Line 75: Randomly select location from locations array
    const location = locations[Math.floor(Math.random() * locations.length)];
    // Line 76: Randomly select skills array from skillsList
    const skills = skillsList[Math.floor(Math.random() * skillsList.length)];
    // Line 77: Generate random minimum experience (0-2 years)
    const minExp = Math.floor(Math.random() * 3);
    // Line 78: Generate random maximum experience (minExp + 1 to minExp + 4)
    // Ensures maxExp is always greater than minExp
    const maxExp = minExp + Math.floor(Math.random() * 4) + 1;
    // Line 79: Generate random minimum salary (5-14 LPA)
    // Math.random() * 10 = 0-9.999...
    // + 5 = 5-14.999...
    // Math.floor() = 5-14
    // * 100000 = 500000-1400000 (5-14 LPA)
    const minSalary = (Math.floor(Math.random() * 10) + 5) * 100000;
    // Line 80: Generate random maximum salary (minSalary + 5-14 LPA)
    // Ensures maxSalary is always greater than minSalary
    const maxSalary = minSalary + (Math.floor(Math.random() * 10) + 5) * 100000;
    // Line 81: Randomly decide if job is internship (10% chance)
    // Math.random() < 0.1 = True 10% of the time
    const isInternship = Math.random() < 0.1;

    // Line 83: Create job object and add to array
    moreJobs.push({
      company,
      companyLogo: '',
      title,
      location,
      jobMode: ['On-Site', 'Remote', 'Hybrid', 'Work From Home'][Math.floor(Math.random() * 4)],
      salary: {
        min: minSalary,
        max: maxSalary,
        currency: 'INR',
        display: isInternship ? 'Stipend' : `₹ ${(minSalary / 100000).toFixed(0)}-${(maxSalary / 100000).toFixed(0)} LPA`
      },
      experience: {
        min: minExp,
        max: maxExp,
        display: isInternship ? '0-1 Years' : `${minExp}-${maxExp} Years`
      },
      jobType: isInternship ? 'Internship' : 'Full Time',
      description: `${company} is seeking a talented ${title} to join our dynamic team in ${location}.\n\nAs a ${title}, you will be responsible for designing, developing, and maintaining high-quality software solutions. You will work closely with cross-functional teams including product managers, designers, and other engineers to deliver innovative features and improvements.\n\nKey Responsibilities:\n- Design and develop scalable, maintainable, and efficient software solutions\n- Collaborate with team members to define technical requirements and architecture\n- Write clean, well-documented code following best practices and coding standards\n- Participate in code reviews to ensure code quality and knowledge sharing\n- Debug and resolve technical issues in production and development environments\n- Stay updated with the latest technologies and industry trends\n- Contribute to technical documentation and knowledge sharing sessions\n\nTechnical Requirements:\n- Proficiency in ${skills.join(', ')} and related technologies\n- Strong understanding of software development principles and design patterns\n- Experience with version control systems (Git) and collaborative development workflows\n- Knowledge of database design and optimization\n- Understanding of RESTful APIs and microservices architecture\n- Familiarity with cloud platforms and deployment practices\n\nWhat We Offer:\n- Competitive salary package and comprehensive benefits\n- Opportunity to work on cutting-edge technologies and challenging projects\n- Collaborative and inclusive work environment\n- Professional growth and career development opportunities\n- Flexible work arrangements and work-life balance`,
      requirements: [
        `Strong proficiency in ${skills.join(', ')}`,
        'Excellent problem-solving and analytical skills',
        'Strong communication and collaboration abilities',
        'Ability to work in a fast-paced, agile environment',
        'Experience with software development lifecycle (SDLC)',
        'Knowledge of testing frameworks and quality assurance practices'
      ],
      skills,
      qualifications: {
        basic: [
          `Bachelor's degree in Computer Science, Engineering, or related field`,
          `${minExp}+ years of professional software development experience`,
          `Strong foundation in computer science fundamentals including data structures, algorithms, and object-oriented design`,
          `Experience with ${skills[0]} and related technologies`
        ],
        preferred: [
          `Master's degree in Computer Science or related field`,
          `Relevant industry certifications (${skills.join(', ')})`,
          `Experience with agile development methodologies`,
          `Contributions to open-source projects`,
          `Experience with cloud platforms (AWS, Azure, or GCP)`,
          `Strong problem-solving and analytical thinking skills`
        ]
      },
      applicationEndDate: new Date(2025, 11, Math.floor(Math.random() * 10) + 15),
      status: ['Hiring Now', 'Easy Apply'][Math.floor(Math.random() * 2)],
      views: Math.floor(Math.random() * 2000) + 1000,
      tags: ['New Opening'],
      isInternship
    });
  }

  return moreJobs;
}

// Line 138: POST /api/seed - Seed database with jobs
// No auth required = Public endpoint (for development only)
// ⚠️ WARNING: This deletes all existing jobs!
router.post('/', async (req, res) => {
  // Line 139: try block for error handling
  try {
    // Line 140: Delete all existing jobs from database
    // deleteMany({}) = Deletes all documents (empty filter = match all)
    // await = Wait for deletion to complete before continuing
    await Job.deleteMany({});
    // Line 141: Log success message to console
    console.log('🗑️  Cleared existing jobs');

    // Line 143: Insert initial jobs (Icertis, Amazon)
    // insertMany() = Inserts multiple documents at once
    // initialJobs = Array of 2 hardcoded jobs
    await Job.insertMany(initialJobs);
    // Line 144: Log success message with count
    console.log(`✅ Inserted ${initialJobs.length} initial jobs`);

    // Line 146: Generate 200 random jobs
    // generateMoreJobs() = Function that returns array of 200 job objects
    const moreJobs = generateMoreJobs();
    // Line 147: Insert generated jobs into database
    await Job.insertMany(moreJobs);
    // Line 148: Log success message with count
    console.log(`✅ Inserted ${moreJobs.length} additional jobs`);

    // Line 150: Calculate total number of jobs inserted
    // initialJobs.length = 2
    // moreJobs.length = 200
    // total = 202 jobs
    const total = initialJobs.length + moreJobs.length;
    // Line 151: Return success response with count
    res.json({
      success: true,                              // Operation successful
      message: `Successfully seeded ${total} jobs!`,  // Success message
      count: total                                // Total number of jobs inserted
    });
  } catch (error) {
    // Line 160: If error occurs (database error, validation error, etc.)
    // Log error to console for debugging
    console.error('❌ Error seeding jobs:', error);
    // Line 161: Return 500 error response
    res.status(500).json({
      success: false,                    // Operation failed
      error: 'Failed to seed jobs',     // Error message
      message: error.message             // Detailed error message
    });
  }
});

// Line 170: Export router
// Makes this router available for use in server.js
// server.js imports this and mounts it at /api/seed
module.exports = router;

