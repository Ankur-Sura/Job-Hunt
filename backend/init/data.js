/**
 * =============================================================================
 *                    DATA.JS - Sample IT Jobs Data
 * =============================================================================
 *
 * 📚 WHAT IS THIS FILE?
 * ---------------------
 * This file contains sample data (seed data) for IT jobs across India.
 * It's used to populate the MongoDB database with initial job listings.
 *
 * 🔗 HOW IT'S USED:
 * ----------------
 * This data is imported by `init/index.js` and inserted into MongoDB.
 * Run: `node init/index.js` to populate the database.
 *
 * 📌 DATA STRUCTURE:
 * -----------------
 * Each job has:
 *   - company: String (company name)
 *   - title: String (job title)
 *   - location: String (city, state)
 *   - description: String (detailed job description - IMPORTANT for AI processing!)
 *   - skills: Array (required technical skills)
 *   - salary: Object (min, max, currency, display)
 *   - experience: Object (min, max, display)
 *   - qualifications: Object (basic and preferred)
 *
 * 🤖 AI FEATURE CONNECTION:
 * -------------------------
 * The `description` field is used by the AI-powered job matching feature!
 * When users upload resumes, the AI analyzes job descriptions to calculate
 * fit scores and provide personalized recommendations.
 *
 * 📖 INTERVIEW TIP:
 * ----------------
 * "I created comprehensive seed data with detailed descriptions that include
 * responsibilities, requirements, and qualifications. This allows my AI matching
 * feature to demonstrate real-world value by analyzing resumes against job
 * descriptions and providing accurate fit scores."
 *
 * =============================================================================
 */

// Line 44: Define array of sample job objects
// const sampleJobs = [...] = Array containing initial job listings
// These are manually created job objects with detailed information
// Additional jobs will be generated programmatically by generateMoreJobs()
const sampleJobs = [
  // Line 45: First job object (Icertis - Software Engineer)
  // { ... } = JavaScript object representing a single job listing
  // This structure is used as a template for all jobs
  {
    // Line 46: Company name
    // company = 'Icertis' = String containing the company name
    company: 'Icertis',
    // Line 47: Company logo URL (empty string means no logo)
    // companyLogo = '' = String for logo image URL (empty = no logo uploaded)
    companyLogo: '',
    // Line 48: Job title
    // title = 'Software Engineer' = String containing the job position title
    title: 'Software Engineer',
    // Line 49: Job location
    // location = 'Pune' = String containing city/state where job is located
    location: 'Pune',
    // Line 50: Work mode
    // jobMode = 'On-Site' = String indicating work arrangement: 'On-Site', 'Remote', 'Hybrid', or 'Work From Home'
    jobMode: 'On-Site',
    // Line 51: Salary information object
    // salary = { ... } = Object containing salary details
    salary: { 
      // min = 1000000 = Minimum salary in currency units (10 LPA in rupees)
      min: 1000000, 
      // max = 1400000 = Maximum salary in currency units (14 LPA in rupees)
      max: 1400000, 
      // currency = 'INR' = Currency code (INR = Indian Rupees)
      currency: 'INR', 
      // display = '₹ 10-14 LPA' = Human-readable salary range (LPA = Lakhs Per Annum)
      display: '₹ 10-14 LPA' 
    },
    // Line 52: Experience requirements object
    // experience = { ... } = Object containing experience requirements
    experience: { 
      // min = 2 = Minimum years of experience required
      min: 2, 
      // max = 4 = Maximum years of experience (defines range)
      max: 4, 
      // display = '2-4 Years' = Human-readable experience range
      display: '2-4 Years' 
    },
    // Line 53: Job type
    // jobType = 'Full Time' = String indicating employment type: 'Full Time', 'Part Time', 'Contract', 'Internship', etc.
    jobType: 'Full Time',
    // Line 54: Job description (detailed text)
    // description = '...' = String containing detailed job description
    // \n = Newline character for formatting
    // This description is used by AI matching feature to calculate fit scores
    description: 'Job Description:\n\nIcertis is guided by four principles: innovation in contract management, commitment to customer success, passion for technology excellence, and long-term strategic thinking. We are driven by the excitement of building enterprise software solutions that transform how businesses manage contracts. We embrace new technologies, make decisions quickly, and are not afraid to innovate. We have the scope and capabilities of a large enterprise software company, and the agility and heart of a startup.\n\nAbout The Team:\n\nOur engineering team is on a mission to enable customers around the globe to manage contracts efficiently with guaranteed compliance and visibility. We work to improve this experience by making contract management available across all business functions, so that customers can search, analyze, and manage contracts in their preferred workflow. We expect to face complex technical challenges, debate the best solutions, and work together to find approaches that are superior to individual proposals. We\'ll make tough technical decisions, but we\'ll all understand why. We\'ll be the dream team that builds world-class contract management solutions.',
    // Line 55: Job requirements array
    // requirements = [...] = Array of requirement strings describing what's needed
    requirements: ['Strong programming skills', 'Problem-solving ability', 'Team collaboration'],
    // Line 56: Required skills array
    // skills = [...] = Array of technical skill strings required for the job
    // Used by AI matching to compare with resume skills
    skills: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'REST APIs'],
    // Line 57: Qualifications object
    // qualifications = { ... } = Object containing basic and preferred qualifications
    qualifications: {
      // Line 58: Basic qualifications array
      // basic = [...] = Minimum required qualifications
      basic: ['Bachelor\'s degree in Computer Science', '2+ years of software development experience'],
      // Line 59: Preferred qualifications array
      // preferred = [...] = Additional qualifications that are nice to have
      preferred: ['Experience with cloud platforms', 'Knowledge of Agile methodologies']
    },
    // Line 60: Application end date
    // applicationEndDate = new Date('2025-12-20') = Date object representing when applications close
    // new Date('YYYY-MM-DD') = Creates Date object from date string
    applicationEndDate: new Date('2025-12-20'),
    // Line 61: Job status
    // status = 'Hiring Now' = String indicating current status: 'Hiring Now', 'Easy Apply', 'Closed', etc.
    status: 'Hiring Now',
    // Line 62: View count
    // views = 2187 = Number of times this job has been viewed by users
    views: 2187,
    // Line 63: Tags array
    // tags = [...] = Array of tag strings for categorizing/filtering jobs
    tags: ['New Opening'],
    // Line 64: Internship flag
    // isInternship = false = Boolean indicating this is not an internship position
    isInternship: false
  },
  // Line 65: Note: Additional job objects follow the same structure as above
  // Each job object contains: company, companyLogo, title, location, jobMode, salary, 
  // experience, jobType, description, requirements, skills, qualifications, 
  // applicationEndDate, status, views, tags, and isInternship fields
  {
    company: 'Amazon',
    companyLogo: '',
    title: 'Software Development Engineer',
    location: 'Bangalore Urban',
    jobMode: 'On-Site',
    salary: { min: 2300000, max: 3000000, currency: 'INR', display: '₹ 23-30 LPA' },
    experience: { min: 2, max: 3, display: '2-3 Years' },
    jobType: 'Full Time',
    description: 'Job Description:\n\nAmazon is guided by four principles: customer obsession rather than competitor focus, passion for invention, commitment to operational excellence, and long-term thinking. We are driven by the excitement of building technologies, inventing products, and providing services that change lives. We embrace new ways of doing things, make decisions quickly, and are not afraid to fail. We have the scope and capabilities of a large company, and the spirit and heart of a small one.\n\nAbout The Team:\n\nOur team\'s mission is to enable customers around the globe to purchase products on Amazon with guaranteed shipping and import duty fees. We work to improve this experience by making selection available across all Amazon marketplaces, so that customers can search and browse in their preferred language and currency. We expect to face seemingly impossible problems, argue about how to solve them, and work together to find a solution that is superior to each of the proposals we came in with. We\'ll make tough decisions, but we\'ll all understand why. We\'ll be the dream team.',
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
    description: 'Job Description:\n\nMicrosoft is guided by our mission to empower every person and every organization on the planet to achieve more. We are driven by the excitement of building technologies that transform how people work, learn, and connect. We embrace innovation, make data-driven decisions, and are not afraid to pivot when needed. We have the resources and global reach of a large company, and the innovation mindset and agility of a startup.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable customers around the globe to build and deploy cloud applications on Azure with guaranteed performance and reliability. We work to improve this experience by making Azure services available across all regions, so that customers can develop and scale applications in their preferred environment. We expect to face complex technical challenges, debate architectural decisions, and work together to find solutions that are superior to individual proposals. We\'ll make tough technical decisions, but we\'ll all understand why. We\'ll be the dream team that builds world-class cloud infrastructure.',
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
    description: 'Job Description:\n\nGoogle is guided by our mission to organize the world\'s information and make it universally accessible and useful. We are driven by the excitement of building technologies that solve complex problems at scale. We embrace bold ideas, make decisions based on data and user impact, and are not afraid to tackle the world\'s biggest challenges. We have the scale and resources of a global technology leader, and the innovation culture and engineering excellence of a research lab.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable users around the globe to access and interact with information seamlessly across all Google products. We work to improve this experience by making our services available across all platforms and devices, so that users can search, discover, and create in their preferred way. We expect to face seemingly impossible technical problems, argue about the best approaches, and work together to find solutions that are superior to each individual proposal. We\'ll make tough decisions, but we\'ll all understand why. We\'ll be the dream team that builds products used by billions.',
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
    description: 'Job Description:\n\nSwiggy is guided by our mission to bring convenience and joy to millions of customers through food delivery. We are driven by the excitement of building technology that connects restaurants, delivery partners, and customers seamlessly. We embrace rapid iteration, make decisions quickly based on data, and are not afraid to experiment. We have the scale and reach of India\'s leading food delivery platform, and the startup energy and customer obsession of a fast-growing company.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable customers around India to order food from their favorite restaurants with guaranteed fast delivery and great experience. We work to improve this experience by making our platform available across all cities, so that customers can discover and order food in their preferred way. We expect to face high-traffic challenges, debate system architectures, and work together to find solutions that handle millions of orders reliably. We\'ll make tough technical decisions, but we\'ll all understand why. We\'ll be the dream team that powers India\'s food delivery revolution.',
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
    description: 'Job Description:\n\nFlipkart is guided by our mission to democratize commerce in India and make shopping accessible to everyone. We are driven by the excitement of building technology that transforms how millions of Indians shop online. We embrace innovation, make customer-centric decisions, and are not afraid to disrupt traditional retail. We have the scale and infrastructure of India\'s leading e-commerce platform, and the agility and customer focus of a growth-stage company.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable customers across India to discover and purchase products on Flipkart with guaranteed quality and fast delivery. We work to improve this experience by making our platform available across all categories and regions, so that customers can shop in their preferred language and payment method. We expect to face massive scale challenges, debate system designs, and work together to find solutions that handle millions of transactions reliably. We\'ll make tough technical decisions, but we\'ll all understand why. We\'ll be the dream team that powers India\'s e-commerce growth.',
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
    description: 'Job Description:\n\nZomato is guided by our mission to ensure that nobody has a bad meal and to make food discovery and delivery seamless for everyone. We are driven by the excitement of building technology that connects restaurants, delivery partners, and food lovers. We embrace experimentation, make decisions based on user feedback, and are not afraid to pivot when needed. We have the reach and scale of a global food tech platform, and the passion and innovation of a mission-driven startup.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable users around the world to discover great restaurants and order food with guaranteed quality and timely delivery. We work to improve this experience by making our platform available across all cities and cuisines, so that users can explore and order food in their preferred way. We expect to face complex product challenges, debate feature designs, and work together to find solutions that delight millions of users. We\'ll make tough product decisions, but we\'ll all understand why. We\'ll be the dream team that makes every meal great.',
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
    description: 'Job Description:\n\nPaytm is guided by our mission to bring financial inclusion to millions of Indians and make digital payments accessible to everyone. We are driven by the excitement of building technology that transforms how people transact and manage money. We embrace innovation in fintech, make decisions that prioritize security and compliance, and are not afraid to build new financial products. We have the scale and trust of India\'s leading digital payments platform, and the innovation mindset and regulatory expertise of a financial services leader.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable millions of users across India to make payments and access financial services with guaranteed security and reliability. We work to improve this experience by making our platform available across all payment methods and use cases, so that users can transact in their preferred way. We expect to face complex security and compliance challenges, debate architectural decisions, and work together to find solutions that are both secure and user-friendly. We\'ll make tough technical decisions, but we\'ll all understand why. We\'ll be the dream team that powers India\'s digital payments revolution.',
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
    description: 'Job Description:\n\nRazorpay is guided by our mission to simplify payments and banking for businesses and make financial operations effortless. We are driven by the excitement of building payment infrastructure that powers India\'s digital economy. We embrace technical excellence, make decisions that prioritize reliability and security, and are not afraid to solve complex payment challenges. We have the scale and infrastructure of India\'s leading payment gateway, and the engineering culture and innovation of a technology-first company.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable businesses across India to accept payments and manage finances with guaranteed uptime and security. We work to improve this experience by making our payment infrastructure available across all business types and use cases, so that merchants can accept payments in their preferred way. We expect to face high-availability challenges, debate system architectures, and work together to find solutions that process millions of transactions reliably. We\'ll make tough technical decisions, but we\'ll all understand why. We\'ll be the dream team that powers India\'s payment infrastructure.',
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
    description: 'Job Description:\n\nOla is guided by our mission to build mobility for a billion people and make transportation accessible and affordable for everyone. We are driven by the excitement of building technology that connects drivers and riders seamlessly. We embrace rapid innovation, make decisions that prioritize user experience, and are not afraid to disrupt traditional transportation. We have the scale and network of India\'s leading mobility platform, and the agility and customer focus of a growth-stage company.\n\nAbout The Team:\n\nOur engineering team\'s mission is to enable millions of users across India to book rides and move around cities with guaranteed availability and great experience. We work to improve this experience by making our platform available across all cities and vehicle types, so that users can book rides in their preferred way. We expect to face real-time matching challenges, debate algorithm designs, and work together to find solutions that connect drivers and riders efficiently. We\'ll make tough technical decisions, but we\'ll all understand why. We\'ll be the dream team that powers India\'s mobility revolution.',
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

// Line 267: Comment explaining next section
// Generate more jobs (190 more to make 200 total)
// This function programmatically generates additional job objects to reach 200 total jobs
// Line 268: Define function to generate additional jobs
// function generateMoreJobs() { ... } = Function that returns array of job objects
// This function creates jobs programmatically using random selection from predefined arrays
function generateMoreJobs() {
  // Line 270: Define array of company names to randomly select from
  // const companies = [...] = Array of company name strings
  // These companies will be randomly assigned to generated jobs
  const companies = ['Infosys', 'TCS', 'Wipro', 'Accenture', 'Cognizant', 'HCL', 'Tech Mahindra', 'IBM', 'Oracle', 'SAP', 'Salesforce', 'Adobe', 'VMware', 'Red Hat', 'Intel', 'NVIDIA', 'Cisco', 'Dell', 'HP', 'Lenovo'];
  // Line 271: Define array of job titles to randomly select from
  // const titles = [...] = Array of job title strings
  // These titles will be randomly assigned to generated jobs
  const titles = ['Software Engineer', 'Senior Software Engineer', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Engineer', 'ML Engineer', 'QA Engineer', 'Mobile Developer', 'Cloud Engineer', 'Security Engineer'];
  // Line 272: Define array of locations to randomly select from
  // const locations = [...] = Array of location strings (Indian cities)
  // These locations will be randomly assigned to generated jobs
  const locations = ['Bangalore Urban', 'Pune', 'Mumbai', 'Hyderabad', 'Chennai', 'Delhi', 'Gurgaon', 'Noida', 'Kolkata'];
  // Line 273: Define array of skill sets (each is an array of related skills)
  // const skillsList = [...] = Array of arrays, where each inner array is a set of related skills
  // These skill sets will be randomly assigned to generated jobs
  const skillsList = [
    // Line 274: Java/Spring Boot skill set
    ['Java', 'Spring Boot', 'Microservices'],
    // Line 275: Python/Django skill set
    ['Python', 'Django', 'Flask'],
    // Line 276: JavaScript/React skill set
    ['JavaScript', 'React', 'Node.js'],
    // Line 277: C#/.NET skill set
    ['C#', '.NET', 'ASP.NET'],
    // Line 278: Go/DevOps skill set
    ['Go', 'Docker', 'Kubernetes'],
    // Line 279: Ruby/Rails skill set
    ['Ruby', 'Rails', 'PostgreSQL'],
    // Line 280: PHP/Laravel skill set
    ['PHP', 'Laravel', 'MySQL'],
    // Line 281: Scala/Big Data skill set
    ['Scala', 'Spark', 'Kafka']
  ];

  // Line 284: Initialize empty array to store generated jobs
  // const moreJobs = [] = Empty array that will be filled with job objects
  const moreJobs = [];
  // Line 285: Loop to generate 190 jobs
  // for (let i = 0; i < 190; i++) = For loop that runs 190 times
  //   let i = 0 = Initialize counter variable to 0
  //   i < 190 = Continue loop while i is less than 190
  //   i++ = Increment i by 1 after each iteration
  for (let i = 0; i < 190; i++) {
    // Line 286: Randomly select a company name
    // const company = companies[...] = Get random company from companies array
    // Math.random() = Returns random number between 0 and 1
    // * companies.length = Multiply by array length to get range 0 to length-1
    // Math.floor(...) = Round down to nearest integer (array index)
    const company = companies[Math.floor(Math.random() * companies.length)];
    // Line 287: Randomly select a job title
    // const title = titles[...] = Get random title from titles array
    // Same random selection pattern as above
    const title = titles[Math.floor(Math.random() * titles.length)];
    // Line 288: Randomly select a location
    // const location = locations[...] = Get random location from locations array
    // Same random selection pattern as above
    const location = locations[Math.floor(Math.random() * locations.length)];
    // Line 289: Randomly select a skill set
    // const skills = skillsList[...] = Get random skill set array from skillsList
    // Same random selection pattern as above
    const skills = skillsList[Math.floor(Math.random() * skillsList.length)];
    // Line 290: Generate random minimum experience (0-2 years)
    // const minExp = Math.floor(Math.random() * 3) = Random integer 0, 1, or 2
    // Math.random() * 3 = Range 0 to 2.999...
    // Math.floor(...) = Round down to 0, 1, or 2
    const minExp = Math.floor(Math.random() * 3);
    // Line 291: Generate random maximum experience (based on minExp)
    // const maxExp = minExp + Math.floor(Math.random() * 4) + 1 = 
    //   minExp + (0-3) + 1 = minExp + 1 to minExp + 4
    // This ensures maxExp is always greater than minExp
    const maxExp = minExp + Math.floor(Math.random() * 4) + 1;
    // Line 292: Generate random minimum salary (5-14 LPA)
    // const minSalary = (Math.floor(Math.random() * 10) + 5) * 100000 = 
    //   Random integer 5-14, multiplied by 100000 (rupees)
    // Math.random() * 10 = Range 0 to 9.999...
    // Math.floor(...) = Round down to 0-9
    // + 5 = Shift range to 5-14
    // * 100000 = Convert to rupees (5 LPA to 14 LPA)
    const minSalary = (Math.floor(Math.random() * 10) + 5) * 100000;
    // Line 293: Generate random maximum salary (based on minSalary)
    // const maxSalary = minSalary + (Math.floor(Math.random() * 10) + 5) * 100000 = 
    //   minSalary + (5-14 LPA) = Ensures maxSalary is always greater than minSalary
    // Same calculation pattern as minSalary, then added to minSalary
    const maxSalary = minSalary + (Math.floor(Math.random() * 10) + 5) * 100000;
    // Line 294: Randomly determine if job is an internship (10% chance)
    // const isInternship = Math.random() < 0.1 = Boolean: true if random < 0.1 (10% probability)
    // Math.random() = Returns 0 to 1
    // < 0.1 = True if value is less than 0.1 (10% of the time)
    const isInternship = Math.random() < 0.1;

    // Line 296: Create job object and add to moreJobs array
    // moreJobs.push({ ... }) = Add new job object to the array
    // { ... } = Object literal with job properties
    moreJobs.push({
      // Line 297: Company name (from randomly selected company)
      // company = company = Use the randomly selected company name
      company,
      // Line 298: Company logo (empty string = no logo)
      // companyLogo = '' = Empty string (no logo uploaded)
      companyLogo: '',
      // Line 299: Job title (from randomly selected title)
      // title = title = Use the randomly selected job title
      title,
      // Line 300: Location (from randomly selected location)
      // location = location = Use the randomly selected location
      location,
      // Line 301: Job mode (randomly selected from options)
      // jobMode = ['On-Site', 'Remote', 'Hybrid', 'Work From Home'][...] = 
      //   Randomly select one of the 4 work mode options
      // Math.floor(Math.random() * 4) = Random index 0-3
      jobMode: ['On-Site', 'Remote', 'Hybrid', 'Work From Home'][Math.floor(Math.random() * 4)],
      // Line 302: Salary information object
      // salary = { ... } = Object containing salary details
      salary: {
        // min = minSalary = Use the randomly generated minimum salary
        min: minSalary,
        // max = maxSalary = Use the randomly generated maximum salary
        max: maxSalary,
        // currency = 'INR' = Currency code (Indian Rupees)
        currency: 'INR',
        // display = ... = Human-readable salary string
        // isInternship ? 'Stipend' : `...` = Ternary operator: show 'Stipend' for internships, else show salary range
        // (minSalary / 100000).toFixed(0) = Convert rupees to lakhs and round to whole number
        // toFixed(0) = Round to 0 decimal places
        display: isInternship ? 'Stipend' : `₹ ${(minSalary / 100000).toFixed(0)}-${(maxSalary / 100000).toFixed(0)} LPA`
      },
      // Line 308: Experience requirements object
      // experience = { ... } = Object containing experience requirements
      experience: {
        // min = minExp = Use the randomly generated minimum experience
        min: minExp,
        // max = maxExp = Use the randomly generated maximum experience
        max: maxExp,
        // display = ... = Human-readable experience string
        // isInternship ? '0-1 Years' : `...` = Ternary operator: show '0-1 Years' for internships, else show range
        display: isInternship ? '0-1 Years' : `${minExp}-${maxExp} Years`
      },
      // Line 313: Job type
      // jobType = isInternship ? 'Internship' : 'Full Time' = 
      //   Ternary operator: 'Internship' if isInternship is true, else 'Full Time'
      jobType: isInternship ? 'Internship' : 'Full Time',
      description: `Job Description:\n\n${company} is guided by our mission to deliver exceptional value to our customers and stakeholders. We are driven by the excitement of building technology solutions that make a real impact. We embrace innovation, make data-driven decisions, and are not afraid to take calculated risks. We have the resources and capabilities of an established company, and the agility and entrepreneurial spirit of a growing organization.\n\nAbout The Team:\n\nOur engineering team's mission is to enable our customers to achieve their goals through our technology platform. We work to improve this experience by making our solutions available across all platforms and use cases, so that customers can interact with our products in their preferred way. We expect to face complex technical challenges, debate the best solutions, and work together to find approaches that are superior to individual proposals. We'll make tough decisions, but we'll all understand why. We'll be the dream team that builds world-class software solutions.`,
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
      // Line 314: Job description (template string with company name)
      // description = `...` = Template literal containing job description
      // ${company} = Interpolate company name into description
      // \n = Newline characters for formatting
      description: `Job Description:\n\n${company} is guided by our mission to deliver exceptional value to our customers and stakeholders. We are driven by the excitement of building technology solutions that make a real impact. We embrace innovation, make data-driven decisions, and are not afraid to take calculated risks. We have the resources and capabilities of an established company, and the agility and entrepreneurial spirit of a growing organization.\n\nAbout The Team:\n\nOur engineering team's mission is to enable our customers to achieve their goals through our technology platform. We work to improve this experience by making our solutions available across all platforms and use cases, so that customers can interact with our products in their preferred way. We expect to face complex technical challenges, debate the best solutions, and work together to find approaches that are superior to individual proposals. We'll make tough decisions, but we'll all understand why. We'll be the dream team that builds world-class software solutions.`,
      // Line 315: Job requirements array (dynamically generated)
      // requirements = [...] = Array of requirement strings
      // Template literals interpolate skills into requirements
      requirements: [
        // Line 316: Requirement mentioning skills
        // `Strong proficiency in ${skills.join(', ')}` = 
        //   Template literal: "Strong proficiency in Java, Spring Boot, Microservices"
        // skills.join(', ') = Join skills array with comma and space
        `Strong proficiency in ${skills.join(', ')}`,
        // Line 317-321: Standard requirement strings
        'Excellent problem-solving and analytical skills',
        'Strong communication and collaboration abilities',
        'Ability to work in a fast-paced, agile environment',
        'Experience with software development lifecycle (SDLC)',
        'Knowledge of testing frameworks and quality assurance practices'
      ],
      // Line 323: Required skills (from randomly selected skill set)
      // skills = skills = Use the randomly selected skills array
      skills,
      // Line 324: Qualifications object
      // qualifications = { ... } = Object containing basic and preferred qualifications
      qualifications: {
        // Line 325: Basic qualifications array (dynamically generated)
        // basic = [...] = Minimum required qualifications
        basic: [
          // Line 326: Education requirement
          `Bachelor's degree in Computer Science, Engineering, or related field`,
          // Line 327: Experience requirement (using minExp)
          // `${minExp}+ years...` = Template literal interpolating minimum experience
          `${minExp}+ years of professional software development experience`,
          // Line 328: Foundation requirement
          `Strong foundation in computer science fundamentals including data structures, algorithms, and object-oriented design`,
          // Line 329: Technology requirement (using first skill)
          // `${skills[0]}...` = Template literal using first skill from skills array
          `Experience with ${skills[0]} and related technologies`
        ],
        // Line 331: Preferred qualifications array (dynamically generated)
        // preferred = [...] = Additional qualifications that are nice to have
        preferred: [
          // Line 332: Advanced education
          `Master's degree in Computer Science or related field`,
          // Line 333: Certifications (using skills)
          // `Relevant industry certifications (${skills.join(', ')})` = 
          //   Template literal listing all skills
          `Relevant industry certifications (${skills.join(', ')})`,
          // Line 334-337: Standard preferred qualifications
          `Experience with agile development methodologies`,
          `Contributions to open-source projects`,
          `Experience with cloud platforms (AWS, Azure, or GCP)`,
          `Strong problem-solving and analytical thinking skills`
        ]
      },
      // Line 340: Application end date (random date in December 2025)
      // applicationEndDate = new Date(2025, 11, ...) = 
      //   Date object: year 2025, month 11 (December, 0-indexed), random day 15-24
      // new Date(year, month, day) = Creates Date object
      // Math.floor(Math.random() * 10) + 15 = Random integer 15-24
      applicationEndDate: new Date(2025, 11, Math.floor(Math.random() * 10) + 15),
      // Line 341: Job status (randomly selected)
      // status = ['Hiring Now', 'Easy Apply'][...] = 
      //   Randomly select one of the 2 status options
      // Math.floor(Math.random() * 2) = Random index 0 or 1
      status: ['Hiring Now', 'Easy Apply'][Math.floor(Math.random() * 2)],
      // Line 342: View count (random number 1000-2999)
      // views = Math.floor(Math.random() * 2000) + 1000 = 
      //   Random integer between 1000 and 2999
      // Math.random() * 2000 = Range 0 to 1999.999...
      // Math.floor(...) = Round down to 0-1999
      // + 1000 = Shift range to 1000-2999
      views: Math.floor(Math.random() * 2000) + 1000,
      // Line 343: Tags array
      // tags = ['New Opening'] = Array with single tag string
      tags: ['New Opening'],
      // Line 344: Internship flag (from randomly generated value)
      // isInternship = isInternship = Use the randomly generated boolean
      isInternship,
      // Line 345: Created timestamp
      // createdAt = new Date() = Current date and time when job is created
      createdAt: new Date(),
      // Line 346: Updated timestamp
      // updatedAt = new Date() = Current date and time (same as createdAt initially)
      updatedAt: new Date()
    });
  }

  // Line 350: Return the array of generated jobs
  // return moreJobs = Return the array containing all 190 generated job objects
  return moreJobs;
}

// Line 353: Comment explaining next section
// Combine initial jobs with generated jobs
// Line 354: Combine sampleJobs array with generated jobs array
// const allJobs = [...sampleJobs, ...generateMoreJobs()] = 
//   Create new array by spreading both arrays
// [...sampleJobs] = Spread operator: expands sampleJobs array elements
// ...generateMoreJobs() = Spread operator: expands generated jobs array elements
// This creates a single array with all jobs (initial + generated)
const allJobs = [...sampleJobs, ...generateMoreJobs()];

// Line 356: Export the jobs data
// module.exports = { ... } = Node.js module export syntax
// Makes the data available when this file is imported with require()
module.exports = {
  // Line 357: Export jobs array as 'data' property
  // data = allJobs = Property name 'data' contains the combined jobs array
  // This allows: const initData = require('./data.js'); initData.data
  data: allJobs
};


