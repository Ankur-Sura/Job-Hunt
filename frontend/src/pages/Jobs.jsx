/**
 * ===================================================================================
 *                    JOBS PAGE COMPONENT - Browse All Jobs
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS COMPONENT?
 * ---------------------------
 * This page displays all available jobs with pagination (6 jobs per page).
 * Shows AI match scores if user has uploaded resume.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User navigates to /jobs
 * 2. Component fetches jobs for current page (6 jobs)
 * 3. If user has resume → Fetches jobs with fit scores
 * 4. If user no resume → Fetches jobs without fit scores
 * 5. Displays jobs with pagination controls
 * 
 * 📌 KEY FEATURES:
 * ---------------
 * - Pagination (6 jobs per page)
 * - Tab switching (Jobs vs Internships)
 * - AI match scores (if resume uploaded)
 * - Apply button for each job
 * 
 * ===================================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import AIMatchModal from '../components/AIMatchModal';
import { FaMapMarkerAlt, FaRupeeSign, FaCalendarAlt, FaSearch, FaChevronRight, FaChevronLeft, FaRobot } from 'react-icons/fa';

// Constant: Number of jobs to display per page
// Set to 6 for better performance (faster loading, less AI processing)
const JOBS_PER_PAGE = 6;

const Jobs = () => {
  // =============================================================================
  //                     HOOKS AND STATE
  // =============================================================================
  
  // Get current user from auth context
  // Used to check if user has resume (for fit scores)
  const { user } = useAuth();
  
  // State: Array of jobs for current page
  // Populated from API call, empty array initially
  const [jobs, setJobs] = useState([]);
  
  // State: Loading indicator
  // true = Fetching jobs, false = Done
  const [loading, setLoading] = useState(true);
  
  // State: Active tab ('Jobs' or 'Internships')
  // Controls which type of jobs to display
  const [activeTab, setActiveTab] = useState('Jobs');
  
  // State: Search query (not currently used in fetch, but stored for future)
  const [searchQuery, setSearchQuery] = useState('');
  
  // State: Total number of jobs (for pagination)
  // Used to calculate total pages
  const [totalJobs, setTotalJobs] = useState(0);
  
  // State: Current page number (1-indexed)
  // Changes when user clicks pagination buttons
  const [currentPage, setCurrentPage] = useState(1);
  
  // State: Total number of pages
  // Calculated from totalJobs / JOBS_PER_PAGE
  const [totalPages, setTotalPages] = useState(1);
  
  // State: Job selected for AI match modal
  // When user clicks "View AI Match", this stores the job
  const [selectedJobForAI, setSelectedJobForAI] = useState(null);

  // State for triggering search
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when tab changes
  }, [activeTab]);

  // Keep a ref to the current search query for useEffect
  const searchQueryRef = React.useRef(searchQuery);
  searchQueryRef.current = searchQuery;
  
  useEffect(() => {
    fetchJobs();
  }, [activeTab, user, currentPage, searchTrigger]); // Added searchTrigger to trigger refetch on search

  /**
   * =============================================================================
   *                     FETCH JOBS FUNCTION
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Fetches jobs for the current page with pagination.
   * If user has resume, fetches jobs with AI fit scores.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Check if user has resume
   * 2. If yes → Call /api/jobs/recommended/list (with fit scores)
   * 3. If no → Call /api/jobs (without fit scores)
   * 4. Update state with fetched jobs
   * 5. Update pagination metadata
   * 
   * 📌 WHAT HAPPENS:
   * ---------------
   * - User with resume → Jobs shown with fit scores (sorted by score)
   * - User without resume → Jobs shown without fit scores (sorted by date)
   * - Error → Empty array, no jobs shown
   * 
   * =============================================================================
   */
  const fetchJobs = async () => {
    // Get the current search query from ref (avoids stale closure)
    const currentSearch = searchQueryRef.current;
    // Set loading to true (show loading spinner)
    setLoading(true);
    try {
      // ========================================================================
      //                     OPTION 1: FETCH WITH FIT SCORES
      // ========================================================================
      // If user is logged in AND has uploaded a resume
      // Fetch jobs with AI-calculated fit scores
      if (user?.resumeId) {
        try {
          // Call endpoint that returns jobs with fit scores
          // Backend calculates fit scores on-demand for current page (6 jobs)
          const response = await axios.get('/api/jobs/recommended/list', {
            params: {
              page: currentPage,                    // Current page number
              limit: JOBS_PER_PAGE,                 // 6 jobs per page
              jobType: activeTab === 'Internships' ? 'Internship' : 'Job',  // Filter by tab
              search: currentSearch || undefined    // Search query (company, title, etc.)
            }
          });
          
          // Extract jobs array from response
          const fetchedJobs = response.data.jobs || [];
          
          // Update state with fetched jobs
          setJobs(fetchedJobs);
          
          // Update pagination metadata
          setTotalJobs(response.data.pagination?.total || fetchedJobs.length);
          setTotalPages(response.data.pagination?.pages || Math.ceil(fetchedJobs.length / JOBS_PER_PAGE));
          
          // Set loading to false and return (don't fetch regular jobs)
          setLoading(false);
          return;
        } catch (error) {
          // Error fetching recommended jobs (AI service down, etc.)
          console.error('Fetch recommended jobs error:', error);
          // Fall through to regular jobs fetch (without fit scores)
        }
      }
      
      // ========================================================================
      //                     OPTION 2: FETCH WITHOUT FIT SCORES
      // ========================================================================
      // User doesn't have resume OR recommended endpoint failed
      // Fetch regular jobs (faster, no AI processing)
      
      // Build query parameters
      const params = { 
        limit: JOBS_PER_PAGE,  // 6 jobs per page
        page: currentPage      // Current page number
      };
      
      // If "Internships" tab is active, filter by job type
      if (activeTab === 'Internships') {
        params.jobType = 'Internship';
      }
      
      // Add search query if provided
      if (currentSearch) {
        params.search = currentSearch;
      }

      // Call regular jobs endpoint (no fit scores)
      const response = await axios.get('/api/jobs', { params });
      
      // Extract jobs array (handle different response formats)
      const fetchedJobs = response.data?.jobs || response.data || [];
      
      // Ensure fetchedJobs is an array
      setJobs(Array.isArray(fetchedJobs) ? fetchedJobs : []);
      
      // Update pagination metadata
      setTotalJobs(response.data?.pagination?.total || fetchedJobs.length);
      setTotalPages(response.data?.pagination?.pages || 1);
    } catch (error) {
      // Error fetching jobs (network error, server error, etc.)
      console.error('Fetch jobs error:', error);
      
      // Set empty state (no jobs to show)
      setJobs([]);
      setTotalJobs(0);
      setTotalPages(1);
    } finally {
      // Always set loading to false (even if error)
      // This hides loading spinner
      setLoading(false);
    }
  };

  /**
   * =============================================================================
   *                     HANDLE PAGE CHANGE
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Changes the current page and scrolls to top.
   * 
   * 🔗 WHAT HAPPENS:
   * ---------------
   * 1. Validates new page number (must be between 1 and totalPages)
   * 2. Updates currentPage state
   * 3. useEffect detects change → fetchJobs() called
   * 4. Scrolls to top of page (smooth scroll)
   * 
   * 📌 WHY SCROLL TO TOP:
   * ---------------------
   * When user clicks "Next", they're at bottom of page.
   * Scrolling to top shows the new jobs immediately.
   * 
   * =============================================================================
   */
  const handlePageChange = (newPage) => {
    // Validate page number (must be within valid range)
    if (newPage >= 1 && newPage <= totalPages) {
      // Update current page state
      // This triggers useEffect → fetchJobs() → fetches new page
      setCurrentPage(newPage);
      
      // Scroll to top of page smoothly
      // Makes it clear that new content has loaded
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-[#14b8a6] hover:text-white border border-gray-200'
          }`}
        >
          <FaChevronLeft className="text-sm" />
          Prev
        </button>

        {/* First page + ellipsis */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="w-10 h-10 rounded-lg font-medium transition-all bg-white text-gray-700 hover:bg-[#14b8a6] hover:text-white border border-gray-200"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
          </>
        )}

        {/* Page numbers */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`w-10 h-10 rounded-lg font-medium transition-all ${
              currentPage === page
                ? 'bg-[#14b8a6] text-white'
                : 'bg-white text-gray-700 hover:bg-[#14b8a6] hover:text-white border border-gray-200'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last page + ellipsis */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="w-10 h-10 rounded-lg font-medium transition-all bg-white text-gray-700 hover:bg-[#14b8a6] hover:text-white border border-gray-200"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-[#14b8a6] hover:text-white border border-gray-200'
          }`}
        >
          Next
          <FaChevronRight className="text-sm" />
        </button>
      </div>
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to page 1 when searching
    setSearchTrigger(prev => prev + 1); // Trigger refetch with new search query
  };

  const formatDate = (date) => {
    if (!date) return '20 Dec';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const getLogoColor = (company, index) => {
    const colors = ['bg-cyan-400', 'bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500'];
    return colors[index % colors.length];
  };

  const tabs = ['Jobs', 'Internships'];

  return (
    <div className="min-h-screen bg-[#E8F5F3]">
      <Header showLogin={true} />
      
      {/* Search Section */}
      <div className="py-10 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                <input
                  type="text"
                  placeholder="Search for opportunities,company..etc"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent outline-none text-gray-600 text-base"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-4 bg-[#14b8a6] text-white rounded-full font-medium hover:bg-[#0d9488] transition-colors shadow-sm"
              >
                Search
              </button>
            </div>
          </form>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-full font-medium text-base transition-all border ${
                  activeTab === tab
                    ? 'bg-white shadow-md text-gray-800 border-gray-200'
                    : 'bg-transparent text-gray-600 border-transparent hover:bg-white/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="px-6 pb-12">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-sm p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">{activeTab}</h2>
            <span className="px-5 py-2 border-2 border-[#14b8a6] text-[#14b8a6] rounded-full text-sm font-semibold">
              {totalJobs}+ Openings
            </span>
          </div>

          {/* Jobs Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading jobs...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {jobs.length > 0 ? jobs.map((job, index) => (
                  <div
                    key={job._id}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    {/* Company & Title Row */}
                    <Link to={`/jobs/${job._id}`} className="block">
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex-1 pr-4">
                          <p className="text-sm text-gray-500 mb-1">{job.company}</p>
                          <h3 className="text-lg font-bold text-gray-900 leading-snug hover:text-[#14b8a6] transition-colors">{job.title}</h3>
                        </div>
                      <div className={`w-14 h-14 ${job.logoColor || getLogoColor(job.company, index)} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        {job.company?.toLowerCase() === 'amazon' ? (
                          <span className="text-white text-2xl">↗</span>
                        ) : job.company?.toLowerCase() === 'icertis' ? (
                          <div className="w-8 h-8 border-2 border-white rounded transform rotate-12"></div>
                        ) : job.company?.toLowerCase() === 'lytx' ? (
                          <span className="text-white font-bold text-sm">lytx</span>
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {job.company?.charAt(0) || 'C'}
                          </span>
                        )}
                      </div>
                      </div>
                    </Link>

                    {/* Job Details */}
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-gray-600">
                        <FaMapMarkerAlt className="text-gray-400 text-sm" />
                        <span className="text-sm">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <FaRupeeSign className="text-gray-400 text-sm" />
                        <span className="text-sm">{job.salary?.display || '10-14 LPA'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <FaCalendarAlt className="text-gray-400 text-sm" />
                        <span className="text-sm">{job.jobType || 'Full Time'}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4"></div>

                    {/* Footer with Hiring Now and AI Match Button */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1.5 border border-[#14b8a6] text-[#14b8a6] rounded-full text-xs font-medium">
                        Hiring Now
                      </span>
                      
                      {/* AI Match Button with Score - Only show when logged in */}
                      {user ? (
                        user.resumeId ? (
                          job.fitScore !== null && job.fitScore !== undefined ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedJobForAI({ job, fitScore: job.fitScore });
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white rounded-full text-xs font-semibold hover:from-[#0d9488] hover:to-[#0d4f4a] transition-all shadow-md hover:shadow-lg"
                            >
                              <FaRobot className="text-sm" />
                              <span>AI Match</span>
                              <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                (job.fitScore?.fitScore || job.fitScore) >= 80 
                                  ? 'bg-green-500' 
                                  : (job.fitScore?.fitScore || job.fitScore) >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}>
                                {(job.fitScore?.fitScore || job.fitScore)}%
                              </div>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-gray-500 px-4 py-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#14b8a6]"></div>
                              <span>Calculating match...</span>
                            </div>
                          )
                        ) : (
                          <div className="text-xs text-gray-400 px-4 py-2">
                            Upload resume for AI match
                          </div>
                        )
                      ) : (
                        // Not logged in - don't show match score
                        null
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    <p>No jobs found. Employers can post jobs by registering and creating a company.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {renderPagination()}
              
              {/* Page Info */}
              {totalJobs > 0 && (
                <div className="text-center mt-4 text-gray-500 text-sm">
                  Showing {((currentPage - 1) * JOBS_PER_PAGE) + 1} - {Math.min(currentPage * JOBS_PER_PAGE, totalJobs)} of {totalJobs} jobs
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* AI Match Modal */}
      {selectedJobForAI && (
        <AIMatchModal
          job={selectedJobForAI.job}
          fitScore={selectedJobForAI.fitScore}
          onClose={() => setSelectedJobForAI(null)}
        />
      )}
    </div>
  );
};

export default Jobs;
