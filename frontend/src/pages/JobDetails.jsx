/**
 * ===================================================================================
 *                    JOB DETAILS PAGE COMPONENT
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS COMPONENT?
 * ---------------------------
 * Displays detailed information about a specific job.
 * Shows job description, requirements, salary, and allows user to apply.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User clicks on a job from jobs list
 * 2. Navigates to /jobs/:id
 * 3. Component extracts job ID from URL
 * 4. Fetches job details from backend
 * 5. If user has resume → Calculates and displays fit score
 * 6. Checks if user already applied
 * 7. Displays job information and apply button
 * 
 * 📌 KEY FEATURES:
 * ---------------
 * - Full job description
 * - Required skills list
 * - Salary and location information
 * - AI match score (if resume uploaded)
 * - Apply button (creates application)
 * - Interview prep link (if already applied)
 * 
 * ===================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './JobDetails.css';

const JobDetails = () => {
  // =============================================================================
  //                     HOOKS AND STATE
  // =============================================================================
  
  // Extract job ID from URL parameter
  // Example: /jobs/123 → id = "123"
  // useParams() extracts route parameters defined in App.jsx
  const { id } = useParams();
  
  // React Router hook for navigation
  // navigate('/path') = Programmatically navigate to a route
  const navigate = useNavigate();
  
  // Get current user from auth context
  // Used to check if user is logged in and has resume
  const { user } = useAuth();
  
  // State: Job details object
  // null = Not loaded yet, Object = Job data from backend
  // Contains: title, company, description, skills, salary, etc.
  const [job, setJob] = useState(null);
  
  // State: Loading indicator
  // true = Fetching job details, false = Done
  const [loading, setLoading] = useState(true);
  
  // State: Applying indicator
  // true = Application in progress, false = Not applying
  // Prevents double-submission of application
  const [applying, setApplying] = useState(false);
  
  // State: AI match score (0-100)
  // null = Not calculated yet, Number = Fit score percentage
  // Only calculated if user has uploaded resume
  const [fitScore, setFitScore] = useState(null);
  
  // State: Whether user has already applied
  // false = Not applied, true = Already applied
  // Used to show "Applied" button instead of "Apply" button
  const [hasApplied, setHasApplied] = useState(false);
  
  // State: Application ID (if user has applied)
  // Used to generate interview prep link
  const [applicationId, setApplicationId] = useState(null);

  /**
   * =============================================================================
   *                     FETCH DATA ON MOUNT
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Runs when component mounts or when job ID or user changes.
   * Fetches job details and checks application status.
   * 
   * 🔗 WHAT HAPPENS:
   * ---------------
   * 1. Fetches job details from backend
   * 2. If user is logged in → Checks if user already applied
   * 3. If user has resume → Calculates fit score
   * 
   * 📌 DEPENDENCIES:
   * ---------------
   * [id, user] - Re-fetch if job ID changes or user logs in/out
   * 
   * =============================================================================
   */
  useEffect(() => {
    // Fetch job details when component mounts
    fetchJobDetails();
    
    // If user is logged in, check if they already applied
    // This shows "Applied" button instead of "Apply" button
    if (user) {
      checkApplicationStatus();
    }
  }, [id, user]);  // Re-run if job ID or user changes

  /**
   * =============================================================================
   *                     FETCH JOB DETAILS
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Fetches detailed information about the job from backend.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Calls GET /api/jobs/:id
   * 2. Backend returns job details
   * 3. If user has resume → Calculates fit score
   * 4. Updates job state
   * 
   * 📌 WHAT HAPPENS:
   * ---------------
   * - Success → Job details displayed, fit score calculated (if applicable)
   * - 404 Error → Job not found, error message shown
   * - Network Error → Error message shown
   * 
   * =============================================================================
   */
  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`/api/jobs/${id}`);
      if (response.data && !response.data.error) {
        setJob(response.data);
        
        // Only calculate fit score if user is logged in and has resume
        if (user && user.resumeId) {
          calculateFitScore(response.data);
        } else {
          setFitScore(null);
        }
      } else {
        setJob(null);
      }
    } catch (error) {
      console.error('Fetch job error:', error);
      if (error.response?.status === 404) {
        setJob(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/applications/check/${id}`);
      if (response.data.applied) {
        setHasApplied(true);
        setApplicationId(response.data.application.id);
      }
    } catch (error) {
      console.error('Check application status error:', error);
    }
  };

  const calculateFitScore = async (jobData) => {
    // Only calculate fit score if user is logged in and has resume
    if (!user || !user.resumeId) {
      setFitScore(null);
      return;
    }

    try {
      const response = await axios.get('/api/jobs/recommended/list');
      const job = response.data.jobs?.find(j => j._id === id);
      if (job?.fitScore) {
        setFitScore(job.fitScore);
      } else {
        setFitScore(null);
      }
    } catch (error) {
      console.error('Calculate fit score error:', error);
      setFitScore(null);
    }
  };

  /**
   * =============================================================================
   *                     HANDLE JOB APPLICATION
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Creates a new job application for the current user.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Checks if user has uploaded resume (required)
   * 2. Sets applying state to true (prevents double-click)
   * 3. Calls POST /api/applications/apply/:jobId
   * 4. Backend creates application, calculates fit score
   * 5. Updates hasApplied state
   * 6. Shows confirmation dialog for interview prep
   * 
   * 📌 WHAT HAPPENS:
   * ---------------
   * - Success → Application created, "Applied" button shown, interview prep option
   * - No resume → Redirects to dashboard to upload resume
   * - Already applied → Error message (shouldn't happen - button disabled)
   * 
   * =============================================================================
   */
  const handleApply = async () => {
    // Check if user has uploaded a resume
    // Resume is required to apply (for fit score calculation)
    if (!user?.resumeId) {
      // No resume uploaded
      // Show alert and redirect to dashboard
      alert('Please upload your resume first');
      navigate('/dashboard');
      return;
    }

    // Set applying to true (shows "Applying..." on button, prevents double-click)
    setApplying(true);
    
    try {
      // Call backend API to create application
      // Backend will:
      // 1. Check if already applied (prevents duplicates)
      // 2. Calculate fit score (if resume available)
      // 3. Create Application document
      // 4. Update user performance counters
      const response = await axios.post(`/api/applications/apply/${id}`);
      if (response.data.success) {
        setHasApplied(true);
        setApplicationId(response.data.application.id);
        const shouldPrep = window.confirm(
          'Application submitted successfully! Would you like to prepare for the interview?'
        );
        if (shouldPrep && response.data.application?.interviewPrepUrl) {
          navigate(response.data.application.interviewPrepUrl);
        } else {
          // Refresh to show updated status
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Apply error:', error);
      if (error.response?.status === 400 && error.response?.data?.error?.includes('Already applied')) {
        setHasApplied(true);
        checkApplicationStatus();
      } else {
        alert(error.response?.data?.error || 'Failed to apply');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleInterviewPrep = () => {
    if (applicationId) {
      navigate(`/interview/${applicationId}`);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-600 mb-4">Job not found</h1>
            <p className="text-gray-600 mb-6">
              The job you're looking for doesn't exist or may have been removed.
            </p>
            <Link
              to="/jobs"
              className="inline-block bg-[#14b8a6] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0d9488] transition-colors"
            >
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-page">
      <Header />
      <div className="job-details-container">
        <div className="job-details-layout">
          {/* Left Column - Job List */}
          <div className="job-list-sidebar">
            <Link to="/jobs" className="back-link">← Back to Jobs</Link>
            {/* Job list would go here */}
          </div>

          {/* Right Column - Job Details */}
          <div className="job-details-content">
            <div className="job-header-section">
              <div className="job-title-section">
                <h1>{job.title}</h1>
                <p className="company-link">{job.company}</p>
                <p className="job-location">📍 {job.location} • {job.jobMode}</p>
            {user && fitScore && (
              <div className="fit-score-display">
                <span className="fit-percentage">
                  {(fitScore.fitScore || fitScore)}% Fit
                </span>
              </div>
            )}
              </div>
            </div>

            {/* Skills Tags */}
            {job.skills && job.skills.length > 0 && (
              <div className="skills-section">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">#{skill}</span>
                ))}
              </div>
            )}

            {/* Job Description */}
            <div className="description-section">
              <h2>Job Description</h2>
              <div className="description-content">
                {job.description ? (
                  typeof job.description === 'string' ? (
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {job.description.split('\n').map((para, index) => 
                        para.trim() ? <p key={index} className="mb-3">{para.trim()}</p> : <br key={index} />
                      )}
                    </div>
                  ) : (
                    <p>{String(job.description)}</p>
                  )
                ) : (
                  <p className="text-gray-500">No description available for this job.</p>
                )}
              </div>
            </div>

            {/* Qualifications */}
            {job.qualifications && (
              <div className="qualifications-section">
                <h2>Basic Qualifications</h2>
                <ul>
                  {job.qualifications.basic?.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
                {job.qualifications.preferred && job.qualifications.preferred.length > 0 && (
                  <>
                    <h2>Preferred Qualifications</h2>
                    <ul>
                      {job.qualifications.preferred.map((qual, index) => (
                        <li key={index}>{qual}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* More Information */}
            <div className="info-section">
              <h2>More Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Package</span>
                  <span className="info-value">{job.salary?.display || 'Not Disclosed'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Minimum Experience</span>
                  <span className="info-value">{job.experience?.display || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Job Location</span>
                  <span className="info-value">{job.location}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Work Type</span>
                  <span className="info-value">{job.jobType}</span>
                </div>
              </div>
            </div>

            {/* Application Dates */}
            <div className="dates-section">
              <p>
                <strong>Application Start:</strong>{' '}
                {new Date(job.applicationStartDate || job.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Application End:</strong>{' '}
                {new Date(job.applicationEndDate).toLocaleDateString()}
              </p>
            </div>

            {/* Apply Button / Applied Status */}
            {hasApplied ? (
              <div className="flex gap-3">
                <button
                  disabled
                  className="apply-button bg-gray-400 cursor-not-allowed"
                >
                  ✓ Applied
                </button>
                <button
                  onClick={handleInterviewPrep}
                  className="apply-button bg-[#14b8a6] hover:bg-[#0d9488]"
                >
                  🎯 Interview Preparation
                </button>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying || !user}
                className="apply-button"
              >
                {applying ? 'Applying...' : user ? 'Apply' : 'Login to Apply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;

