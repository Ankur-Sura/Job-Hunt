/**
 * ===================================================================================
 *                    DASHBOARD PAGE COMPONENT
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS COMPONENT?
 * ---------------------------
 * Main user dashboard showing:
 * - Profile completion status
 * - Top 5 job recommendations (with AI match scores)
 * - Recent applications
 * - Resume upload functionality
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Component mounts → Fetches recommendations and applied jobs
 * 2. User uploads resume → Sends to backend → AI processes → Recommendations update
 * 3. User clicks "Apply" → Creates application → Updates applied jobs list
 * 4. User clicks "Interview Prep" → Navigates to interview prep page
 * 
 * 📌 KEY FEATURES:
 * ---------------
 * - Job recommendations with fit scores
 * - Resume upload with progress indicator
 * - Application tracking
 * - Profile completion tracking
 * - Recalculate AI match scores button
 * 
 * ===================================================================================
 */

// Line 32: Import React library and hooks (useState for state management, useEffect for side effects)
import React, { useState, useEffect } from 'react';
// Line 33: Import React Router hooks - useNavigate for programmatic navigation, Link for clickable links
import { useNavigate, Link } from 'react-router-dom';
// Line 34: Import axios library for making HTTP requests to backend API
import axios from 'axios';
// Line 35: Import useAuth hook from AuthContext to access current user and authentication functions
import { useAuth } from '../context/AuthContext';
// Line 36: Import Header component to display navigation bar at top of page
import Header from '../components/Header';
// Line 37: Import Font Awesome icons for UI elements (download, trash, edit, share, handshake, sync, eye, file, checkmark, robot)
import { FaDownload, FaTrash, FaEdit, FaShare, FaHandshake, FaSync, FaEye, FaFileAlt, FaCheckCircle, FaRobot } from 'react-icons/fa';

// Line 39: Define Dashboard functional component (arrow function syntax)
const Dashboard = () => {
  // =============================================================================
  //                     HOOKS AND STATE
  // =============================================================================
  
  // Line 47: Destructure user and fetchUser from useAuth hook
  // user = Current logged-in user object (contains name, email, resumeId, etc.) or null if not logged in
  // fetchUser = Function to refresh user data from backend API
  const { user, fetchUser } = useAuth();
  
  // Line 51: Initialize React Router's useNavigate hook
  // navigate('/path') = Function to programmatically navigate to different routes
  // Example: navigate('/jobs') will redirect user to jobs page
  const navigate = useNavigate();

  /**
   * =============================================================================
   *                     REDIRECT HIRERS TO RECRUITER DASHBOARD
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * If user is a recruiter/hirer, redirects them to recruiter dashboard.
   * 
   * =============================================================================
   */
  // Line 64: useEffect hook runs when component mounts or dependencies change
  useEffect(() => {
    // Line 65: Check if user exists AND user's role is 'hirer' (recruiter)
    if (user && user.role === 'hirer') {
      // Line 66: If user is a hirer, redirect them to recruiter dashboard
      // This prevents hirers from seeing the job seeker dashboard
      navigate('/recruiter/dashboard');
    }
    // Line 68: Dependencies array - effect runs when 'user' or 'navigate' changes
    // If user logs in/out or role changes, this effect re-runs
  }, [user, navigate]);
  
  // Line 73: State variable to store job recommendations array
  // recommendations = Array of job objects with AI match scores
  // setRecommendations = Function to update recommendations array
  // [] = Initial value (empty array) - will be populated after API call
  const [recommendations, setRecommendations] = useState([]);
  
  // Line 77: State variable to track loading status for recommendations
  // loading = Boolean (true/false) indicating if recommendations are being fetched
  // setLoading = Function to update loading status
  // true = Initial value (shows loading spinner when component first mounts)
  const [loading, setLoading] = useState(true);
  
  // State to track if AI is still calculating scores in background
  // Shows indicator to user that more scores will be available soon
  const [isCalculating, setIsCalculating] = useState(false);
  const [scoreStats, setScoreStats] = useState({ cached: 0, total: 0 });
  
  // Line 81: State variable to store selected resume file from file input
  // resumeFile = File object or null
  // setResumeFile = Function to update resume file
  // null = Initial value (no file selected yet)
  const [resumeFile, setResumeFile] = useState(null);
  
  // Line 85: State variable to track resume upload progress
  // uploading = Boolean indicating if resume is currently being uploaded
  // setUploading = Function to update upload status
  // false = Initial value (not uploading initially)
  const [uploading, setUploading] = useState(false);
  
  // Line 89: State variable to store user's applied jobs
  // appliedJobs = Array of application objects (each contains job details and application status)
  // setAppliedJobs = Function to update applied jobs array
  // [] = Initial value (empty array) - populated after API call
  const [appliedJobs, setAppliedJobs] = useState([]);
  
  // Line 92: State variable to track loading status for applied jobs
  // loadingApplied = Boolean indicating if applied jobs are being fetched
  // setLoadingApplied = Function to update loading status
  // false = Initial value (not loading initially)
  const [loadingApplied, setLoadingApplied] = useState(false);
  
  // Line 96: State variable to track AI score recalculation progress
  // recalculating = Boolean indicating if fit scores are being recalculated
  // setRecalculating = Function to update recalculation status
  // false = Initial value (not recalculating initially)
  const [recalculating, setRecalculating] = useState(false);

  /**
   * =============================================================================
   *                     NAVIGATE TO INTERVIEW PREP
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Navigates to interview preparation page for a specific application.
   * 
   * 🔗 WHAT HAPPENS:
   * ---------------
   * User clicks "Interview Prep" button → Navigates to /interview/:applicationId
   * Interview prep page loads and fetches AI-generated guide.
   * 
   * =============================================================================
   */
  // Line 115: Define function to navigate to interview prep page
  // openInterviewPrep = Function that takes an application object as parameter
  const openInterviewPrep = (application) => {
    // Validate application before navigating
    if (!application || !application._id) {
      console.error('❌ Invalid application object:', application);
      alert('Invalid application. Please apply to a job first.');
      return;
    }
    
    // Line 118: Use navigate function to redirect to interview prep page
    // `/interview/${application._id}` = Dynamic route with application ID
    // Example: If application._id is "123", navigates to "/interview/123"
    // React Router will render InterviewPrepPage component for this route
    console.log('🎯 Navigating to interview prep for application:', application._id);
    navigate(`/interview/${application._id}`);
  };

  /**
   * =============================================================================
   *                     FETCH DATA ON MOUNT
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Fetches recommendations and applied jobs when component mounts or user changes.
   * 
   * 🔗 WHAT HAPPENS:
   * ---------------
   * 1. If user has resume → Fetch job recommendations
   * 2. If user logged in → Fetch applied jobs
   * 3. Update state with fetched data
   * 
   * 📌 WHY IT'S NEEDED:
   * -------------------
   * Dashboard needs to show recommendations and applications on load.
   * 
   * =============================================================================
   */
  // Line 142: useEffect hook to fetch data when component mounts or user changes
  useEffect(() => {
    // Line 145: Check if user exists AND user has uploaded a resume (resumeId property exists)
    // user?.resumeId = Optional chaining - safely checks if resumeId exists without error
    if (user?.resumeId) {
      // Line 146: If resume exists, call fetchRecommendations function to get job recommendations
      fetchRecommendations();
    } else {
      // Line 149: If no resume uploaded, stop loading spinner
      setLoading(false);
      // Line 151: Clear recommendations array (no recommendations to show without resume)
      setRecommendations([]);
    }
    
    // Line 155: Check if user is logged in (user object exists)
    if (user) {
      // Line 156: If user is logged in, fetch their applied jobs
      fetchAppliedJobs();
    }
    // Line 158: Dependencies array - effect runs when 'user' changes
    // This means: when user logs in, logs out, or uploads resume, this effect re-runs
  }, [user]);

  /**
   * =============================================================================
   *                     FETCH JOB RECOMMENDATIONS
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Fetches top 5 job recommendations with AI match scores.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Call GET /api/recommendations
   * 2. Backend gets cached fit scores or calculates on-demand
   * 3. Returns top 5 jobs sorted by fit score
   * 4. Sort by fit score (highest first)
   * 5. Update recommendations state
   * 
   * 📌 WHAT HAPPENS:
   * ---------------
   * - Success → Recommendations displayed with fit scores
   * - Error → Empty array, no recommendations shown
   * 
   * =============================================================================
   */
  // Line 184: Define async function to fetch job recommendations from backend
  // FAST: Only uses cached scores - no waiting for AI calculation!
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Make GET request - returns only cached scores (instant!)
      const response = await axios.get('/api/recommendations');
      
      // Extract data from response
      const recommendations = response.data.recommendations || [];
      const { totalCached = 0, totalJobs = 0, isCalculating: calculating = false } = response.data;
      
      // Update calculating status
      setIsCalculating(calculating);
      setScoreStats({ cached: totalCached, total: totalJobs });
      
      // Sort by fit score (highest first)
      const sortedRecommendations = recommendations
        .map(job => ({
          ...job,
          fitScore: job.fitScore || null
        }))
        .sort((a, b) => {
          const scoreA = a.fitScore?.fitScore || a.fitScore || 0;
          const scoreB = b.fitScore?.fitScore || b.fitScore || 0;
          return scoreB - scoreA;
        });
      
      setRecommendations(sortedRecommendations);
    } catch (error) {
      console.error('Fetch recommendations error:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // Line 225: Define async function to fetch user's applied jobs from backend
  const fetchAppliedJobs = async () => {
    // Line 226: Set loadingApplied to true to show loading indicator
    setLoadingApplied(true);
    // Line 227: try block for error handling
    try {
      // Line 228: Make GET request to backend endpoint for user's applications
      // '/api/applications/my-applications' = Backend route that returns current user's applications
      const response = await axios.get('/api/applications/my-applications');
      // Line 229: Update appliedJobs state with applications from response
      // response.data.applications = Array of application objects
      // || [] = Fallback to empty array if undefined
      setAppliedJobs(response.data.applications || []);
    } catch (error) {
      // Line 231: Log error to console for debugging
      console.error('Fetch applied jobs error:', error);
      // Line 232: Set appliedJobs to empty array on error
      setAppliedJobs([]);
    } finally {
      // Line 234: Always hide loading indicator (whether success or error)
      setLoadingApplied(false);
    }
  };

  // Line 238: Define async function to handle resume file upload
  // e = Event object from file input onChange event
  const handleResumeUpload = async (e) => {
    // Line 239: Get first file from file input (files is array, [0] gets first file)
    // e.target = The file input element that triggered the event
    // .files = FileList object containing selected files
    const file = e.target.files[0];
    // Line 240: If no file selected, exit function early (do nothing)
    if (!file) return;

    // Line 242: Check if file type is PDF (not image, text, etc.)
    // file.type = MIME type string (e.g., "application/pdf", "image/png")
    if (file.type !== 'application/pdf') {
      // Line 243: Show alert popup to user
      alert('Please upload a PDF file');
      // Line 244: Exit function (don't proceed with upload)
      return;
    }

    // Line 247: Store selected file in state (for UI display)
    setResumeFile(file);
    // Line 248: Set uploading to true to show upload progress indicator
    setUploading(true);

    // Line 250: Create FormData object to send file to backend
    // FormData = Special object for multipart/form-data requests (file uploads)
    const formData = new FormData();
    // Line 251: Append file to FormData with field name 'resume'
    // Backend expects file in 'resume' field
    formData.append('resume', file);

    // Line 253: try block for error handling
    try {
      // Line 254: Make POST request to upload resume endpoint
      // '/api/resume/upload' = Backend route that handles file upload
      // formData = File data to send
      const response = await axios.post('/api/resume/upload', formData, {
        // Line 255: Set Content-Type header to multipart/form-data
        // This tells backend that request contains file data
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Line 259: Refresh user data from backend (gets updated resumeId)
      // await = Wait for fetchUser to complete before continuing
      await fetchUser();
      
      // Line 262: Wait 2 seconds before fetching recommendations
      // setTimeout = Delays execution by specified milliseconds
      // This gives backend time to process resume and start background job
      setTimeout(async () => {
        // Line 264: Fetch updated job recommendations with new resume data
        await fetchRecommendations();
        // Line 265: Hide loading spinner
        setLoading(false);
      }, 2000);  // 2000 milliseconds = 2 seconds
      
      // Line 268: Show success message to user
      alert('Resume uploaded successfully! Calculating your best job matches...');
    } catch (error) {
      // Line 270: Log error to console for debugging
      console.error('Upload error:', error);
      // Line 271: Show error message to user
      // error.response?.data?.error = Backend error message (if available)
      // || error.message = Fallback to generic error message
      alert('Failed to upload resume: ' + (error.response?.data?.error || error.message));
      // Line 272: Stop upload indicator
      setUploading(false);
      // Line 273: Clear selected file from state
      setResumeFile(null);
    }
  };

  // Line 277: Define async function to recalculate AI match scores for all jobs
  const handleRecalculateScores = async () => {
    // Line 278: Check if user has uploaded a resume
    // !user?.resumeId = If user doesn't exist OR resumeId doesn't exist
    if (!user?.resumeId) {
      // Line 279: Show alert if no resume uploaded
      alert('Please upload your resume first');
      // Line 280: Exit function (can't recalculate without resume)
      return;
    }

    // Line 283: Set recalculating to true to show progress indicator
    setRecalculating(true);
    // Line 284: try block for error handling
    try {
      // Line 285: Make POST request to trigger score recalculation
      // '/api/resume/recalculate-scores' = Backend endpoint that starts background job
      const response = await axios.post('/api/resume/recalculate-scores');
      // Line 286: Check if backend returned success response
      if (response.data.success) {
        // Line 287: Show message to user explaining recalculation is in progress
        alert('Recalculating AI match scores for all jobs. This should take 45-90 seconds with optimized processing. Please refresh the page shortly.');
        // Line 289: Wait 5 seconds before refreshing recommendations
        // This gives backend time to start processing
        setTimeout(async () => {
          // Line 290: Fetch updated recommendations with new scores
          await fetchRecommendations();
          // Line 291: Hide recalculation indicator
          setRecalculating(false);
        }, 5000);  // 5000 milliseconds = 5 seconds
      }
    } catch (error) {
      // Line 295: Log error to console
      console.error('Recalculate error:', error);
      // Line 296: Show error message to user
      alert('Failed to recalculate scores: ' + (error.response?.data?.error || error.message));
      // Line 297: Hide recalculation indicator on error
      setRecalculating(false);
    }
  };

  // Line 301: Return JSX (JavaScript XML) - this is what gets rendered on screen
  return (
    // Line 302: Main container div with minimum height of full screen and gray background
    // min-h-screen = Tailwind CSS class for minimum height of viewport (100vh)
    // bg-gray-50 = Tailwind CSS class for light gray background color
    <div className="min-h-screen bg-gray-50">
      {/* Line 303: Render Header component (navigation bar)
          showLogin={false} = Prop passed to Header to hide login button (user is already logged in) */}
      <Header showLogin={false} />
      {/* Line 304: Container div with max width, centered, and padding
          container = Tailwind class for max-width container
          mx-auto = Tailwind class for horizontal margin auto (centers container)
          px-6 = Tailwind class for horizontal padding (left/right)
          py-8 = Tailwind class for vertical padding (top/bottom) */}
      <div className="container mx-auto px-6 py-8">
        {/* Line 305: Grid layout - 1 column on mobile, 3 columns on large screens
            grid = Tailwind class to create CSS grid
            grid-cols-1 = 1 column on mobile devices
            lg:grid-cols-3 = 3 columns on large screens (desktop)
            gap-6 = Tailwind class for gap between grid items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line 435: Left Column - Profile Card Section
              lg:col-span-1 = On large screens, this column takes 1 out of 3 grid columns */}
          <div className="lg:col-span-1">
            {/* Line 437: Profile card container with gradient background
                bg-gradient-to-br = Tailwind class for gradient from top-left to bottom-right
                from-[#0d9488] via-[#14b8a6] to-[#2dd4bf] = Teal gradient colors
                rounded-2xl = Large rounded corners
                shadow-xl = Large shadow for depth
                overflow-hidden = Hides content that overflows container */}
            <div className="bg-gradient-to-br from-[#0d9488] via-[#14b8a6] to-[#2dd4bf] rounded-2xl shadow-xl overflow-hidden">
              {/* Line 439: Profile Header Section with decorative elements
                  relative = Position relative for absolute positioned children
                  pt-8 pb-6 px-6 = Padding top 8, bottom 6, horizontal 6 */}
              <div className="relative pt-8 pb-6 px-6">
                {/* Line 441: Decorative circle element (top right)
                    absolute = Positioned absolutely within relative parent
                    top-0 right-0 = Positioned at top-right corner
                    w-32 h-32 = Width and height of 32 (128px)
                    bg-white/10 = White color with 10% opacity
                    rounded-full = Perfect circle
                    -translate-y-1/2 translate-x-1/2 = Centered on corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                {/* Line 442: Decorative circle element (bottom left)
                    w-20 h-20 = Smaller circle (80px)
                    bg-white/5 = White with 5% opacity (more subtle) */}
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                {/* Line 444: Avatar Section Container
                    relative = For positioning checkmark badge
                    flex flex-col = Flexbox column layout
                    items-center = Center items horizontally */}
                <div className="relative flex flex-col items-center">
                  {/* Line 446: Avatar wrapper div (relative for badge positioning) */}
                  <div className="relative">
                    {/* Line 447: Avatar circle with user's initial
                        w-28 h-28 = 112px circle
                        rounded-full = Perfect circle
                        bg-gradient-to-br from-[#ef4444] to-[#dc2626] = Red gradient
                        text-white = White text color
                        flex items-center justify-center = Center content
                        text-5xl = Large text size
                        font-bold = Bold font weight
                        shadow-lg = Large shadow
                        ring-4 ring-white/30 = White ring around circle */}
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white flex items-center justify-center text-5xl font-bold shadow-lg ring-4 ring-white/30">
                      {/* Line 448: Display first letter of user's name in uppercase, or 'A' as fallback
                          user?.name?.charAt(0) = Get first character of name (safely)
                          .toUpperCase() = Convert to uppercase
                          || 'A' = If name doesn't exist, show 'A' */}
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    {/* Line 449: Checkmark badge (only shown if user has resume)
                        user?.resumeId = Check if resumeId exists */}
                    {user?.resumeId && (
                      // Line 450: Green checkmark badge positioned at bottom-right of avatar
                      // absolute = Positioned absolutely
                      // -bottom-1 -right-1 = Positioned slightly outside avatar
                      // w-8 h-8 = 32px circle
                      // bg-green-500 = Green background
                      // rounded-full = Circle shape
                      // flex items-center justify-center = Center checkmark icon
                      // ring-4 ring-[#14b8a6] = Teal ring around badge
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-[#14b8a6]">
                        {/* Line 451: Checkmark icon from Font Awesome
                            text-white = White icon color
                            text-sm = Small icon size */}
                        <FaCheckCircle className="text-white text-sm" />
                      </div>
                    )}
                  </div>
                  {/* Line 453: User's name heading
                      text-2xl = Large text size
                      font-bold = Bold font
                      text-white = White text color
                      mt-4 = Margin top 4
                      tracking-wide = Letter spacing
                      user?.name || 'User' = Display name or 'User' as fallback */}
                  <h3 className="text-2xl font-bold text-white mt-4 tracking-wide">{user?.name || 'User'}</h3>
                  {/* Line 454: User's email address
                      text-white/80 = White text with 80% opacity
                      text-sm = Small text size
                      mt-1 = Small margin top */}
                  <p className="text-white/80 text-sm mt-1">{user?.email}</p>
                  {/* Line 455: Role badge (Recruiter or Job Seeker)
                      mt-2 = Margin top 2
                      px-4 py-1 = Horizontal padding 4, vertical padding 1
                      bg-white/20 = White background with 20% opacity
                      backdrop-blur-sm = Blur effect behind element
                      rounded-full = Pill shape
                      text-xs = Extra small text
                      font-medium = Medium font weight
                      text-white = White text
                      uppercase = All caps
                      tracking-wider = Wide letter spacing
                      Conditional: Show 'Recruiter' if role is 'hirer', else 'Job Seeker' */}
                  <span className="mt-2 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white uppercase tracking-wider">
                    {user?.role === 'hirer' ? '👔 Recruiter' : '💼 Job Seeker'}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-px bg-white/10 mx-4 rounded-xl overflow-hidden mb-4">
                <div className="bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-2xl font-bold text-white">{appliedJobs.length}</p>
                  <p className="text-xs text-white/70 uppercase tracking-wide">Applied</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 text-center">
                  <p className="text-2xl font-bold text-white">{recommendations.length}</p>
                  <p className="text-xs text-white/70 uppercase tracking-wide">Matches</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 px-4 mb-4">
                <button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white hover:text-[#0d9488] text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group">
                  <FaEdit className="text-sm group-hover:scale-110 transition-transform" />
                  Edit
                </button>
                <button className="flex-1 bg-white/20 backdrop-blur-sm hover:bg-white hover:text-[#0d9488] text-white px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group">
                  <FaShare className="text-sm group-hover:scale-110 transition-transform" />
                  Share
                </button>
              </div>

              {/* Line 560: Resume Section Card Container
                  bg-white = White background
                  rounded-t-3xl = Rounded top corners (large radius)
                  p-5 = Padding of 5 (20px)
                  space-y-4 = Vertical spacing of 4 (16px) between children */}
              <div className="bg-white rounded-t-3xl p-5 space-y-4">
                {/* Line 562: Resume Header Section
                    flex items-center justify-between = Flexbox with items centered vertically, space between horizontally */}
                <div className="flex items-center justify-between">
                  {/* Line 564: Left side of header (icon + text)
                      flex items-center gap-3 = Flexbox with 12px gap between items */}
                  <div className="flex items-center gap-3">
                    {/* Line 565: Resume icon container
                        w-10 h-10 = 40px square
                        bg-gradient-to-br = Gradient from top-left to bottom-right
                        from-[#14b8a6] to-[#0d9488] = Teal gradient colors
                        rounded-xl = Rounded corners
                        flex items-center justify-center = Center icon
                        shadow-md = Medium shadow */}
                    <div className="w-10 h-10 bg-gradient-to-br from-[#14b8a6] to-[#0d9488] rounded-xl flex items-center justify-center shadow-md">
                      {/* Line 566: File icon from Font Awesome
                          text-white = White icon color */}
                      <FaFileAlt className="text-white" />
                    </div>
                    {/* Line 568: Text container (title + status) */}
                    <div>
                      {/* Line 569: "Resume" heading
                          font-bold = Bold font weight
                          text-gray-800 = Dark gray text color */}
                      <h4 className="font-bold text-gray-800">Resume</h4>
                      {/* Line 570: Resume status text
                          text-xs = Extra small text
                          text-gray-500 = Medium gray text
                          Conditional: Shows "PDF uploaded" if resumeId exists, else "No resume yet" */}
                      <p className="text-xs text-gray-500">
                        {user?.resumeId ? 'PDF uploaded' : 'No resume yet'}
                      </p>
                    </div>
                  </div>
                  {/* Line 575: Active badge (only shown if resume exists)
                      user?.resumeId = Check if resumeId exists */}
                  {user?.resumeId && (
                    // Line 576: Green "Active" badge
                    // flex items-center gap-1 = Flexbox with 4px gap
                    // text-xs = Extra small text
                    // text-green-600 = Green text color
                    // bg-green-50 = Light green background
                    // px-2 py-1 = Small padding
                    // rounded-full = Pill shape
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {/* Line 577: Checkmark icon
                          text-[10px] = Very small icon (10px) */}
                      <FaCheckCircle className="text-[10px]" /> Active
                    </span>
                  )}
                </div>
                
                {/* Resume Actions */}
                <div className="flex gap-2 flex-wrap">
                  <label className="flex-1 min-w-[80px] bg-gray-100 hover:bg-[#14b8a6] hover:text-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-300 flex items-center justify-center gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    {uploading ? (
                      <>
                        <FaSync className="animate-spin text-xs" />
                        Uploading...
                      </>
                    ) : (
                      <>Update</>
                    )}
                  </label>
                  <button className="bg-gray-100 hover:bg-[#14b8a6] hover:text-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2">
                    <FaEye className="text-xs" /> View
                  </button>
                  <button className="bg-gray-100 hover:bg-[#14b8a6] hover:text-white text-gray-700 p-2.5 rounded-xl text-sm font-medium transition-all duration-300">
                    <FaDownload />
                  </button>
                  <button className="bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 p-2.5 rounded-xl text-sm font-medium transition-all duration-300">
                    <FaTrash />
                  </button>
                </div>

                {/* AI Match Recalculate Button */}
                {user?.resumeId && (
                  <button 
                    onClick={handleRecalculateScores}
                    disabled={recalculating}
                    className="w-full bg-gradient-to-r from-[#14b8a6] to-[#0d9488] hover:from-[#0d9488] hover:to-[#115e59] text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#14b8a6]/30 hover:shadow-[#14b8a6]/50"
                  >
                    <FaRobot className={`text-lg ${recalculating ? 'animate-pulse' : ''}`} />
                    {recalculating ? 'Recalculating Scores...' : '🎯 Refresh AI Match Scores'}
                  </button>
                )}

                {/* Visibility Notice */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-amber-500 text-lg">👁️</span>
                  <p className="text-xs text-amber-700">
                    Your profile is visible to recruiters.{' '}
                    <a href="#" className="font-medium text-amber-800 hover:underline">Manage privacy →</a>
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applied Jobs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FaHandshake className="text-[#14b8a6] text-xl" />
                <h3 className="text-2xl font-bold text-gray-800">Jobs Applied:</h3>
              </div>
              {loadingApplied ? (
                <div className="text-center py-8 text-gray-600">Loading applied jobs...</div>
              ) : appliedJobs.length > 0 ? (
                <div className="space-y-4">
                  {appliedJobs.map((application) => {
                    const job = application.jobId;
                    if (!job) return null;
                    
                    // Ensure application has _id for navigation
                    const applicationId = application._id || application.id;
                    if (!applicationId) {
                      console.error('⚠️ Application missing ID:', application);
                      return null;
                    }
                    
                    return (
                      <div 
                        key={applicationId}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm mb-1">{job.company}</p>
                            <Link 
                              to={`/jobs/${job._id || job}`}
                              className="text-lg font-bold text-gray-800 mb-1 hover:text-[#14b8a6] transition-colors block"
                            >
                              {job.title}
                            </Link>
                            <p className="text-gray-600 text-sm mb-1">{job.location} ({job.jobType || 'Full Time'})</p>
                            <p className="text-gray-600 text-sm mb-1">Salary: {job.salary?.display || 'Not Disclosed'}</p>
                            <p className="text-gray-600 text-sm mb-2">
                              Applied: {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                application.status === 'applied' ? 'bg-blue-100 text-blue-700' :
                                application.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                                application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                              {application.fitScore > 0 && (
                                <span className="text-xs text-gray-500">
                                  AI Match: {application.fitScore}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => {
                                console.log('🎯 Interview Prep clicked for application:', application);
                                console.log('   Application ID:', applicationId);
                                console.log('   Full application:', application);
                                openInterviewPrep({ ...application, _id: applicationId });
                              }}
                              className="bg-[#14b8a6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0d9488] transition-colors flex items-center gap-2"
                            >
                              🎯 Interview Prep
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>You haven't applied for any jobs yet.</p>
                  <Link 
                    to="/jobs"
                    className="text-[#14b8a6] hover:underline mt-2 inline-block"
                  >
                    Browse Jobs →
                  </Link>
                </div>
              )}
            </div>

            {/* Browse All Jobs - Prominent Button */}
            <div className="bg-gradient-to-r from-[#14b8a6] to-[#0d9488] rounded-xl shadow-lg p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">🎯 Browse All Jobs</h3>
                  <p className="text-white/90">
                    Explore {scoreStats.total || 200}+ job opportunities with AI match scores
                  </p>
                  {isCalculating && (
                    <p className="text-white/80 text-sm mt-1 flex items-center gap-2">
                      <span className="animate-pulse">●</span>
                      AI is calculating scores ({scoreStats.cached}/{scoreStats.total} ready)
                    </p>
                  )}
                </div>
                <Link 
                  to="/jobs"
                  className="bg-white text-[#14b8a6] px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-md flex items-center gap-2"
                >
                  Browse Jobs →
                </Link>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FaHandshake className="text-[#14b8a6] text-xl" />
                  <h3 className="text-2xl font-bold text-gray-800">Top Recommendations</h3>
                </div>
                {isCalculating && (
                  <span className="text-sm text-orange-500 flex items-center gap-1">
                    <span className="animate-spin">⏳</span> Calculating more scores...
                  </span>
                )}
              </div>
              {loading ? (
                <div className="text-center py-8 text-gray-600">Loading recommendations...</div>
              ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                  {recommendations.slice(0, 6).map((job) => {
                    const fitScore = job.fitScore?.fitScore || job.fitScore || 0;
                    const getScoreColor = (score) => {
                      if (score >= 80) return 'bg-green-500 text-white';
                      if (score >= 60) return 'bg-yellow-500 text-white';
                      if (score > 0) return 'bg-orange-500 text-white';
                      return 'bg-gray-400 text-white';
                    };
                    
                    return (
                      <Link 
                        key={job._id} 
                        to={`/jobs/${job._id}`}
                        className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-gray-600 text-sm mb-1">{job.company}</p>
                            <h4 className="text-lg font-bold text-gray-800 mb-1 hover:text-[#14b8a6] transition-colors">{job.title}</h4>
                            <p className="text-gray-600 text-sm mb-1">{job.location} ({job.jobMode})</p>
                            <p className="text-gray-600 text-sm mb-1">Salary: {job.salary?.display || 'Not Disclosed'}</p>
                            <p className="text-gray-600 text-sm mb-2">Experience: {job.experience?.display}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {/* AI Match Score */}
                            {fitScore > 0 ? (
                              <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${getScoreColor(fitScore)}`}>
                                {fitScore}% Match
                              </div>
                            ) : (
                              <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-200 text-gray-600">
                                Calculating...
                              </div>
                            )}
                            {job.tags?.includes('New Opening') && (
                              <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                New Opening
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  
                  {/* View More Link */}
                  <div className="text-center pt-4">
                    <Link 
                      to="/jobs"
                      className="text-[#14b8a6] hover:text-[#0d9488] font-semibold inline-flex items-center gap-2"
                    >
                      View All Jobs →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {user?.resumeId ? (
                    <div>
                      <p className="mb-4">AI is analyzing your profile...</p>
                      <Link 
                        to="/jobs"
                        className="bg-[#14b8a6] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#0d9488] transition-colors"
                      >
                        Browse All Jobs
                      </Link>
                    </div>
                  ) : (
                    <p>Upload your resume to get AI-powered job recommendations!</p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
