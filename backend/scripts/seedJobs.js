/**
 * =============================================================================
 *                    SEEDJOBS.JS - Database Seeding Script
 * =============================================================================
 *
 * 📖 WHAT IS THIS SCRIPT?
 * ------------------------
 * This script seeds the MongoDB database with sample job listings.
 * It creates 10 initial jobs manually, then generates 200 more jobs
 * programmatically, for a total of 210 jobs.
 *
 * 🔗 HOW TO RUN:
 * --------------
 *     cd "/Users/ankursura/Desktop/Job Portal Project /backend"
 *     node scripts/seedJobs.js
 *
 * ⚠️ WARNING: This will DELETE all existing jobs and replace them!
 *
 * 📌 WHAT IT DOES:
 * ---------------
 * 1. Connects to MongoDB
 * 2. Deletes ALL existing jobs
 * 3. Inserts 10 manually created jobs
 * 4. Generates and inserts 200 additional jobs programmatically
 * 5. Shows summary of seeded jobs
 *
 * =============================================================================
 */

// Line 1: Import mongoose library
// mongoose = MongoDB object modeling library for Node.js
// Provides schema validation, middleware, and query building
const mongoose = require('mongoose');
// Line 2: Import Job model
// Job = Mongoose model for job documents in MongoDB
// Used to interact with the jobs collection in the database
const Job = require('../models/Job');
// Line 3: Load environment variables from .env file
// require('dotenv').config() = Loads variables from .env file into process.env
// This allows accessing MONGODB_URI from environment variables
require('dotenv').config();

// Line 5: Comment explaining next section
// 100 IT Jobs Data
// Line 6: Define array of initial job objects (10 jobs manually created)
// const jobs = [...] = Array containing manually created job listings
// These are detailed job objects with complete information
// Note: The array actually contains 10 jobs, not 100 (the comment is outdated)
const jobs = [
  {
    company: 'Icertis',
    companyLogo: '',
    title: 'Software Engineer',
    location: 'Pune',
    jobMode: 'On-Site',
    salary: { min: 1000000, max: 1400000, currency: 'INR', display: '₹ 10-14 LPA' },
    experience: { min: 2, max: 4, display: '2-4 Years' },
    jobType: 'Full Time',
    description: 'Icertis is looking for a Software Engineer to join our team. You will be responsible for developing and maintaining enterprise software solutions. We work with cutting-edge technologies and offer a collaborative work environment.',
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
    description: 'Amazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking. We are driven by the excitement of building technologies, inventing products, and providing services that change lives.',
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
  },
  {
    company: 'Microsoft',
    companyLogo: '',
    title: 'Software Engineer',
    location: 'Bangalore Urban',
    jobMode: 'On-Site',
    salary: { min: 2400000, max: 3000000, currency: 'INR', display: '₹ 24-30 LPA' },
    experience: { min: 2, max: 5, display: '2-5 Years' },
    jobType: 'Full Time',
    description: 'Microsoft is looking for talented Software Engineers to join our team. You will work on building scalable cloud services and applications that serve millions of users worldwide.',
    requirements: ['Strong coding skills', 'Experience with cloud platforms', 'System design knowledge'],
    skills: ['C#', '.NET', 'Azure', 'JavaScript', 'TypeScript', 'React'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '2+ years of software development experience'],
      preferred: ['Master\'s degree', 'Experience with Azure', 'Open source contributions']
    },
    applicationEndDate: new Date('2025-12-20'),
    status: 'Hiring Now',
    views: 2186,
    tags: ['New Opening'],
    isInternship: false
  },
  {
    company: 'Google',
    companyLogo: '',
    title: 'Software Engineer',
    location: 'Hyderabad',
    jobMode: 'On-Site',
    salary: { min: 2500000, max: 3500000, currency: 'INR', display: '₹ 25-35 LPA' },
    experience: { min: 3, max: 6, display: '3-6 Years' },
    jobType: 'Full Time',
    description: 'Google is seeking Software Engineers to work on innovative products and services. You will collaborate with world-class engineers to solve complex technical challenges.',
    requirements: ['Strong algorithms and data structures knowledge', 'Experience with large-scale systems', 'Excellent problem-solving skills'],
    skills: ['Python', 'Java', 'C++', 'Go', 'Kubernetes', 'Distributed Systems'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '3+ years of software development experience'],
      preferred: ['Master\'s or PhD', 'Experience with machine learning', 'Published research papers']
    },
    applicationEndDate: new Date('2025-12-25'),
    status: 'Hiring Now',
    views: 3500,
    tags: ['New Opening', 'Premium'],
    isInternship: false
  },
  {
    company: 'Swiggy',
    companyLogo: '',
    title: 'Software Dev Engineer I',
    location: 'Bangalore Urban',
    jobMode: 'Hybrid',
    salary: { min: 1800000, max: 2500000, currency: 'INR', display: '₹ 18-25 LPA' },
    experience: { min: 1, max: 3, display: '1-3 Years' },
    jobType: 'Full Time',
    description: 'Swiggy is looking for Software Development Engineers to build and scale our food delivery platform. You will work on high-traffic systems serving millions of orders.',
    requirements: ['Strong programming fundamentals', 'Experience with backend systems', 'Problem-solving mindset'],
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Kafka', 'Microservices'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '1+ years of software development experience'],
      preferred: ['Experience with distributed systems', 'Knowledge of food tech domain']
    },
    applicationEndDate: new Date('2025-12-20'),
    status: 'Hiring Now',
    views: 2192,
    tags: ['New Opening'],
    isInternship: false
  },
  {
    company: 'Flipkart',
    companyLogo: '',
    title: 'Backend Developer',
    location: 'Bangalore Urban',
    jobMode: 'On-Site',
    salary: { min: 2000000, max: 2800000, currency: 'INR', display: '₹ 20-28 LPA' },
    experience: { min: 2, max: 4, display: '2-4 Years' },
    jobType: 'Full Time',
    description: 'Flipkart is hiring Backend Developers to work on our e-commerce platform. You will build scalable systems handling millions of transactions daily.',
    requirements: ['Strong backend development skills', 'Experience with databases', 'System design knowledge'],
    skills: ['Java', 'Python', 'PostgreSQL', 'MongoDB', 'Elasticsearch', 'Kafka'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '2+ years of backend development experience'],
      preferred: ['Experience with e-commerce platforms', 'Knowledge of search systems']
    },
    applicationEndDate: new Date('2025-12-22'),
    status: 'Hiring Now',
    views: 2500,
    tags: ['New Opening'],
    isInternship: false
  },
  {
    company: 'Zomato',
    companyLogo: '',
    title: 'Full Stack Developer',
    location: 'Gurgaon',
    jobMode: 'Hybrid',
    salary: { min: 1500000, max: 2200000, currency: 'INR', display: '₹ 15-22 LPA' },
    experience: { min: 2, max: 4, display: '2-4 Years' },
    jobType: 'Full Time',
    description: 'Zomato is looking for Full Stack Developers to work on our food delivery and restaurant discovery platform. You will work on both frontend and backend systems.',
    requirements: ['Full stack development experience', 'Strong JavaScript skills', 'Database knowledge'],
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Redis', 'GraphQL'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '2+ years of full stack development'],
      preferred: ['Experience with React Native', 'Knowledge of food delivery systems']
    },
    applicationEndDate: new Date('2025-12-21'),
    status: 'Hiring Now',
    views: 2300,
    tags: ['New Opening'],
    isInternship: false
  },
  {
    company: 'Paytm',
    companyLogo: '',
    title: 'Senior Software Engineer',
    location: 'Noida',
    jobMode: 'On-Site',
    salary: { min: 2200000, max: 3000000, currency: 'INR', display: '₹ 22-30 LPA' },
    experience: { min: 4, max: 7, display: '4-7 Years' },
    jobType: 'Full Time',
    description: 'Paytm is seeking Senior Software Engineers to work on our payment and financial services platform. You will lead technical initiatives and mentor junior engineers.',
    requirements: ['Strong technical leadership', 'Experience with payment systems', 'System architecture knowledge'],
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'Payment Gateways'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '4+ years of software development experience'],
      preferred: ['Experience with fintech', 'Knowledge of payment processing', 'Leadership experience']
    },
    applicationEndDate: new Date('2025-12-23'),
    status: 'Hiring Now',
    views: 2800,
    tags: ['New Opening'],
    isInternship: false
  },
  {
    company: 'Razorpay',
    companyLogo: '',
    title: 'Backend Engineer',
    location: 'Bangalore Urban',
    jobMode: 'On-Site',
    salary: { min: 1800000, max: 2500000, currency: 'INR', display: '₹ 18-25 LPA' },
    experience: { min: 2, max: 4, display: '2-4 Years' },
    jobType: 'Full Time',
    description: 'Razorpay is hiring Backend Engineers to build our payment infrastructure. You will work on high-availability systems processing millions of transactions.',
    requirements: ['Strong backend development skills', 'Experience with distributed systems', 'Problem-solving ability'],
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Docker'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '2+ years of backend development'],
      preferred: ['Experience with payment systems', 'Knowledge of financial regulations']
    },
    applicationEndDate: new Date('2025-12-24'),
    status: 'Hiring Now',
    views: 2100,
    tags: ['New Opening'],
    isInternship: false
  },
  {
    company: 'Ola',
    companyLogo: '',
    title: 'Software Engineer',
    location: 'Bangalore Urban',
    jobMode: 'On-Site',
    salary: { min: 1600000, max: 2300000, currency: 'INR', display: '₹ 16-23 LPA' },
    experience: { min: 2, max: 4, display: '2-4 Years' },
    jobType: 'Full Time',
    description: 'Ola is looking for Software Engineers to work on our ride-hailing platform. You will build systems that connect drivers and riders seamlessly.',
    requirements: ['Strong programming skills', 'Experience with mobile backend', 'System design knowledge'],
    skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Kafka', 'Microservices'],
    qualifications: {
      basic: ['Bachelor\'s degree in Computer Science', '2+ years of software development'],
      preferred: ['Experience with location-based services', 'Knowledge of real-time systems']
    },
    applicationEndDate: new Date('2025-12-22'),
    status: 'Hiring Now',
    views: 2400,
    tags: ['New Opening'],
    isInternship: false
  }
];

// Line 229: Comment explaining next section (currently unused)
// Add 90 more jobs (simplified for brevity - in production, you'd have full details)
// Note: This array is currently empty and not used
// The generateMoreJobs() function below is used instead
const additionalJobs = [
  // Add more job entries here - I'll create a pattern
];

// Line 235: Comment explaining next section
// Function to generate more jobs
// This function programmatically generates 200 additional job objects
// Line 236: Define function to generate additional jobs
// function generateMoreJobs() { ... } = Function that returns array of job objects
// This function creates jobs programmatically using random selection from predefined arrays
function generateMoreJobs() {
  const companies = ['Infosys', 'TCS', 'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Tech Mahindra', 'L&T Infotech', 'Mindtree', 'Mphasis', 'Capgemini', 'Deloitte', 'PwC', 'EY', 'KPMG', 'IBM', 'Oracle', 'SAP', 'Salesforce', 'Adobe', 'VMware', 'Red Hat', 'Intel', 'NVIDIA', 'AMD', 'Qualcomm', 'Cisco', 'Juniper', 'NetApp', 'Dell', 'HP', 'Lenovo', 'Samsung', 'LG', 'Sony', 'Panasonic', 'Honeywell', 'GE', 'Siemens', 'Bosch', 'Philips', '3M', 'Xerox', 'Canon', 'Epson', 'Ricoh', 'Konica Minolta', 'Sharp', 'Toshiba', 'Hitachi', 'Fujitsu', 'NEC', 'Alcatel-Lucent', 'Ericsson', 'Nokia', 'Motorola', 'BlackBerry', 'Palm', 'HTC', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Honor', 'Meizu', 'Gionee', 'Micromax', 'Lava', 'Karbonn', 'Intex', 'iBall', 'Celkon', 'Spice', 'Zen', 'Yu', 'Lyf', 'Jio', 'Airtel', 'Vodafone', 'Idea', 'BSNL', 'MTNL', 'Reliance', 'Tata', 'Birla', 'Adani', 'Ambani', 'Mittal', 'Premji', 'Murthy', 'Nilekani', 'Nadella', 'Pichai', 'Cook', 'Bezos', 'Musk', 'Zuckerberg'];
  const titles = ['Software Engineer', 'Senior Software Engineer', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Engineer', 'ML Engineer', 'QA Engineer', 'Mobile Developer', 'Cloud Engineer', 'Security Engineer', 'System Engineer', 'Network Engineer', 'Database Administrator', 'Technical Lead', 'Architect', 'Product Manager', 'Project Manager', 'Scrum Master'];
  const locations = ['Bangalore Urban', 'Pune', 'Mumbai', 'Hyderabad', 'Chennai', 'Delhi', 'Gurgaon', 'Noida', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Indore', 'Chandigarh', 'Coimbatore', 'Kochi'];
  const skillsList = [
    ['Java', 'Spring Boot', 'Microservices'],
    ['Python', 'Django', 'Flask'],
    ['JavaScript', 'React', 'Node.js'],
    ['C#', '.NET', 'ASP.NET'],
    ['Go', 'Docker', 'Kubernetes'],
    ['Ruby', 'Rails', 'PostgreSQL'],
    ['PHP', 'Laravel', 'MySQL'],
    ['Scala', 'Spark', 'Kafka'],
    ['Rust', 'WebAssembly', 'Blockchain'],
    ['Swift', 'iOS', 'Xcode'],
    ['Kotlin', 'Android', 'Jetpack'],
    ['TypeScript', 'Angular', 'Vue.js'],
    ['AWS', 'Lambda', 'S3'],
    ['Azure', 'Functions', 'Cosmos DB'],
    ['GCP', 'Cloud Functions', 'BigQuery']
  ];

  const moreJobs = [];
  for (let i = 0; i < 200; i++) { // Increased from 90 to 200 for more jobs
    const company = companies[Math.floor(Math.random() * companies.length)];
    const title = titles[Math.floor(Math.random() * titles.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const skills = skillsList[Math.floor(Math.random() * skillsList.length)];
    const minExp = Math.floor(Math.random() * 3);
    const maxExp = minExp + Math.floor(Math.random() * 4) + 1;
    const minSalary = (Math.floor(Math.random() * 10) + 5) * 100000;
    const maxSalary = minSalary + (Math.floor(Math.random() * 10) + 5) * 100000;
    const isInternship = Math.random() < 0.1; // 10% internships

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
      description: `${company} is seeking a talented ${title} to join our dynamic team in ${location}. 

As a ${title}, you will be responsible for designing, developing, and maintaining high-quality software solutions. You will work closely with cross-functional teams including product managers, designers, and other engineers to deliver innovative features and improvements.

Key Responsibilities:
- Design and develop scalable, maintainable, and efficient software solutions
- Collaborate with team members to define technical requirements and architecture
- Write clean, well-documented code following best practices and coding standards
- Participate in code reviews to ensure code quality and knowledge sharing
- Debug and resolve technical issues in production and development environments
- Stay updated with the latest technologies and industry trends
- Contribute to technical documentation and knowledge sharing sessions

Technical Requirements:
- Proficiency in ${skills.join(', ')} and related technologies
- Strong understanding of software development principles and design patterns
- Experience with version control systems (Git) and collaborative development workflows
- Knowledge of database design and optimization
- Understanding of RESTful APIs and microservices architecture
- Familiarity with cloud platforms and deployment practices

What We Offer:
- Competitive salary package and comprehensive benefits
- Opportunity to work on cutting-edge technologies and challenging projects
- Collaborative and inclusive work environment
- Professional growth and career development opportunities
- Flexible work arrangements and work-life balance

If you are passionate about technology and eager to make an impact, we would love to hear from you!`,
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

// Line 353: Define async function to seed jobs
// async function = Function that can use await keyword for asynchronous operations
// seedJobs = Function name (stands for "seed jobs")
async function seedJobs() {
  // Line 354: Start try-catch block for error handling
  // try { ... } = Block of code to attempt execution
  // catch (error) { ... } = Block to handle any errors that occur
  try {
    // Line 355: Connect to MongoDB database
    // await = Wait for asynchronous operation to complete
    // mongoose.connect(...) = Establish connection to MongoDB
    // process.env.MONGODB_URI = Get URI from environment variables (if set)
    // || = Logical OR operator (fallback)
    // 'mongodb://localhost:27017/jobportal' = Default local MongoDB URI
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal');
    // Line 356: Log success message
    // console.log = Output message to terminal
    // '✅ Connected to MongoDB' = Success message with checkmark emoji
    console.log('✅ Connected to MongoDB');

    // Line 358: Comment explaining next section
    // Clear existing jobs
    // Line 359: Delete all existing job documents from database
    // await = Wait for database operation to complete
    // Job.deleteMany({}) = Mongoose method to delete multiple documents
    //   {} = Empty filter object means "delete ALL documents" (no conditions)
    // This ensures a clean slate before inserting new data
    await Job.deleteMany({});
    // Line 360: Log success message
    // console.log = Output message to terminal
    // '🗑️  Cleared existing jobs' = Success message with trash emoji
    console.log('🗑️  Cleared existing jobs');

    // Line 362: Comment explaining next section
    // Add initial 10 jobs
    // Line 363: Insert initial manually created jobs into database
    // await = Wait for database operation to complete
    // Job.insertMany(jobs) = Mongoose method to insert multiple documents
    //   jobs = Array of 10 manually created job objects (defined above)
    //   insertMany = Efficiently inserts all documents in one operation
    await Job.insertMany(jobs);
    // Line 364: Log success message with count
    // console.log = Output message to terminal
    // Template literal (backticks) = Allows string interpolation with ${}
    // `✅ Inserted ${jobs.length} initial jobs` = Shows number of jobs inserted
    // jobs.length = Number of job objects in the array (10)
    console.log(`✅ Inserted ${jobs.length} initial jobs`);

    // Line 366: Comment explaining next section
    // Add 90 more jobs (actually 200 more jobs)
    // Line 367: Generate additional jobs programmatically
    // const moreJobs = generateMoreJobs() = Call function to generate 200 jobs
    // generateMoreJobs() = Function defined above that returns array of job objects
    // moreJobs = Array containing 200 generated job objects
    const moreJobs = generateMoreJobs();
    // Line 368: Insert generated jobs into database
    // await = Wait for database operation to complete
    // Job.insertMany(moreJobs) = Mongoose method to insert multiple documents
    //   moreJobs = Array of 200 generated job objects
    await Job.insertMany(moreJobs);
    // Line 369: Log success message with count
    // console.log = Output message to terminal
    // `✅ Inserted ${moreJobs.length} additional jobs` = Shows number of jobs inserted
    // moreJobs.length = Number of job objects in the array (200)
    console.log(`✅ Inserted ${moreJobs.length} additional jobs`);

    // Line 371: Log final success message
    // console.log = Output message to terminal
    // '🎉 Successfully seeded 210 jobs!' = Success message with party emoji
    // Note: Total is 10 + 200 = 210 jobs
    console.log('🎉 Successfully seeded 210 jobs!');
    // Line 372: Exit the script successfully
    // process.exit(0) = Terminate Node.js process with exit code 0 (success)
    // Exit code 0 indicates successful completion
    process.exit(0);
  // Line 373: Catch block to handle errors
  // catch (error) { ... } = Block executed if any error occurs in try block
  } catch (error) {
    // Line 374: Log error message
    // console.error = Output error message to terminal (usually in red)
    // '❌ Error seeding jobs:' = Error prefix with X emoji
    // error = Error object containing error details
    console.error('❌ Error seeding jobs:', error);
    // Line 375: Exit the script with error code
    // process.exit(1) = Terminate Node.js process with exit code 1 (error)
    // Exit code 1 indicates failure
    process.exit(1);
  }
}

// Line 379: Call the function to execute the script
// seedJobs() = Invoke the async function
// This starts the database seeding when file is run with: node scripts/seedJobs.js
seedJobs();

