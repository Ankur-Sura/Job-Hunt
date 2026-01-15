/**
 * =============================================================================
 *                    LANDING.JSX - Homepage/Landing Page
 * =============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This is the main landing page (homepage) of the Job Hunt application.
 * It's the first page users see when visiting the website without logging in.
 *
 * 🔗 ROUTE:
 * ---------
 * URL: / (root)
 *
 * 📌 SECTIONS:
 * -----------
 * 1. Header - Navigation with login/register buttons
 * 2. Hero Section - Main headline with job search box
 * 3. Stats Section - Platform statistics (jobs, companies, etc.)
 * 4. Featured Jobs Section - Grid of latest job listings
 * 5. CTA Section - Call-to-action to encourage registration
 * 6. Footer - Links and copyright information
 *
 * 🔑 KEY FEATURES:
 * ----------------
 * - Job search form with keyword and location inputs
 * - Popular search tags for quick filtering
 * - Featured jobs loaded from API
 * - Responsive design for mobile and desktop
 *
 * =============================================================================
 */

// Line 1: Import React and hooks
// useState = Hook for managing component state
// useEffect = Hook for side effects (API calls on mount)
import React, { useState, useEffect } from 'react';
// Line 2: Import routing components
// Link = Declarative navigation component
// useNavigate = Hook for programmatic navigation
import { Link, useNavigate } from 'react-router-dom';
// Line 3: Import icons from react-icons/fa (Font Awesome)
// Each icon is used in different sections of the landing page
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaBuilding, FaArrowRight, FaStar, FaUsers, FaRocket, FaChartLine } from 'react-icons/fa';
// Line 4: Import axios for HTTP requests
import axios from 'axios';
// Line 5: Import Header component
import Header from '../components/Header';

/**
 * Landing Component - Main Homepage
 * 
 * @returns {React.ReactElement} - The landing page UI
 */
const Landing = () => {
  // ==================== STATE MANAGEMENT ====================
  
  // Line 8: State for featured jobs loaded from API
  const [featuredJobs, setFeaturedJobs] = useState([]);
  // Line 9: State for search query input
  const [searchQuery, setSearchQuery] = useState('');
  // Line 10: State for location filter input
  const [location, setLocation] = useState('');
  // Line 11: Hook for programmatic navigation
  const navigate = useNavigate();

  // ==================== EFFECTS ====================
  
  // Line 13-15: Fetch featured jobs on component mount
  // Empty dependency array [] means this runs once when component loads
  useEffect(() => {
    fetchFeaturedJobs();
  }, []);

  // ==================== API FUNCTIONS ====================
  
  /**
   * Fetch featured jobs from the API
   * Gets the first 6 jobs to display on the landing page
   */
  const fetchFeaturedJobs = async () => {
    try {
      // GET /api/jobs with limit=6 to get only 6 jobs
      const response = await axios.get('/api/jobs?limit=6');
      // Set jobs state with response data (or empty array if no jobs)
      setFeaturedJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  // ==================== EVENT HANDLERS ====================
  
  /**
   * Handle search form submission
   * Navigates to jobs page with search parameters
   * 
   * @param {Event} e - Form submit event
   */
  const handleSearch = (e) => {
    // Prevent default form submission (page reload)
    e.preventDefault();
    // Navigate to jobs page with search query and location as URL params
    navigate(`/jobs?search=${searchQuery}&location=${location}`);
  };

  // ==================== STATIC DATA ====================
  
  // Statistics to display in the stats section
  // Each stat has an icon, value, and label
  const stats = [
    { icon: FaBriefcase, value: '1000+', label: 'Active Jobs' },
    { icon: FaBuilding, value: '500+', label: 'Companies' },
    { icon: FaUsers, value: '10K+', label: 'Candidates' },
    { icon: FaRocket, value: '5K+', label: 'Placements' },
  ];

  // ==================== RENDER ====================
  
  return (
    // Main container - minimum full screen height with gray background
    <div className="min-h-screen bg-gray-50">
      {/* Header with login button shown */}
      <Header showLogin={true} />
      
      {/* ==================== HERO SECTION ==================== */}
      {/* Main hero area with gradient background and search box */}
      <section className="bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main headline - responsive text sizes */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0d4f4a] mb-6 leading-tight">
              AI-Powered Career Matching & Interview Prep
            </h1>
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              Get AI match scores, personalized interview guidance & land your dream job faster.
            </p>
            
            {/* Search Box - form with job title and location inputs */}
            <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col md:flex-row gap-4">
              {/* Job title/keyword input */}
              <div className="flex-1 flex items-center gap-3 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4">
                <FaSearch className="text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Job title, keywords, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {/* Location input */}
              <div className="flex-1 flex items-center gap-3 pb-4 md:pb-0 md:pr-4">
                <FaMapMarkerAlt className="text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="City or location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {/* Search button */}
              <button
                type="submit"
                className="bg-[#14b8a6] hover:bg-[#0d9488] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Search Jobs
              </button>
            </form>

            {/* Quick Links - popular search tags */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="text-gray-600">Popular:</span>
              {/* Map through popular search terms */}
              {['Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps', 'Full Stack'].map((tag) => (
                <Link
                  key={tag}
                  to={`/jobs?search=${tag}`}
                  className="text-[#14b8a6] hover:text-[#0d9488] hover:underline"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS SECTION ==================== */}
      {/* Platform statistics displayed in a 4-column grid */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Map through stats array to create stat cards */}
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6">
                {/* Dynamic icon rendering using stat.icon component */}
                <stat.icon className="text-4xl text-[#14b8a6] mx-auto mb-3" />
                <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED JOBS SECTION ==================== */}
      {/* Grid of featured job listings loaded from API */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          {/* Section header with "View All" link */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Featured Jobs</h2>
              <p className="text-gray-600">Discover your next career opportunity</p>
            </div>
            <Link
              to="/jobs"
              className="flex items-center gap-2 text-[#14b8a6] hover:text-[#0d9488] font-semibold"
            >
              View All Jobs
              <FaArrowRight />
            </Link>
          </div>

          {/* Job cards grid - responsive columns */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              // Each job card is a link to the job details page
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 border border-gray-100"
              >
                {/* Job card header - company logo and internship badge */}
                <div className="flex items-start justify-between mb-4">
                  {/* Company initial as logo placeholder */}
                  <div className="w-12 h-12 bg-[#14b8a6] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {job.company?.charAt(0) || 'C'}
                  </div>
                  {/* Internship badge - shown only for internships */}
                  {job.isInternship && (
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                      Internship
                    </span>
                  )}
                </div>
                {/* Job title */}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{job.title}</h3>
                {/* Company name */}
                <p className="text-[#14b8a6] font-medium mb-3">{job.company}</p>
                {/* Job details - location and experience */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    {job.location} ({job.jobMode})
                  </div>
                  <div className="flex items-center gap-2">
                    <FaBriefcase className="text-gray-400" />
                    {job.experience?.display || 'Experience not specified'}
                  </div>
                </div>
                {/* Card footer - salary and apply link */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    {job.salary?.display || 'Salary not disclosed'}
                  </span>
                  <span className="text-[#14b8a6] text-sm font-medium">Apply Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      {/* Call-to-action section encouraging registration */}
      <section className="py-16 bg-[#14b8a6]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to find your dream job?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of engineers who have found their perfect career match through Job Hunt
          </p>
          {/* CTA buttons - register and browse jobs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-[#14b8a6] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
            >
              <FaStar className="text-yellow-500" />
              Get Started Free
            </Link>
            <Link
              to="/jobs"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#14b8a6] transition-colors"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      {/* Site footer with navigation links */}
      <footer className="bg-gray-800 text-gray-300 py-12">
        <div className="container mx-auto px-6">
          {/* Footer grid - 4 columns on desktop */}
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#14b8a6] text-xl">Job</span>
                <span className="bg-[#14b8a6] text-white px-2 py-1 rounded text-sm font-bold">Hunt</span>
              </div>
              <p className="text-gray-400">
                Your one-stop destination for engineering careers and opportunities.
              </p>
            </div>
            {/* Job seeker links */}
            <div>
              <h4 className="font-semibold text-white mb-4">For Job Seekers</h4>
              <ul className="space-y-2">
                <li><Link to="/jobs" className="hover:text-[#14b8a6]">Browse Jobs</Link></li>
                <li><Link to="/register" className="hover:text-[#14b8a6]">Create Account</Link></li>
                <li><Link to="/login" className="hover:text-[#14b8a6]">Login</Link></li>
              </ul>
            </div>
            {/* Employer links */}
            <div>
              <h4 className="font-semibold text-white mb-4">For Employers</h4>
              <ul className="space-y-2">
                <li><Link to="/register" className="hover:text-[#14b8a6]">Post a Job</Link></li>
                <li><Link to="/register" className="hover:text-[#14b8a6]">Find Candidates</Link></li>
              </ul>
            </div>
            {/* Resource links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-[#14b8a6]">Career Tips</a></li>
                <li><a href="#" className="hover:text-[#14b8a6]">Interview Prep</a></li>
                <li><a href="#" className="hover:text-[#14b8a6]">Resume Builder</a></li>
              </ul>
            </div>
          </div>
          {/* Copyright notice */}
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2024 Job Hunt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Export the component as default export
export default Landing;
