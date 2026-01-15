/**
 * =============================================================================
 *                    INTERVIEWPREP.JSX - Simple Interview Prep Page
 * =============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This is a simple interview preparation page that displays AI-generated
 * interview guidance. It's an older/simpler version of the interview prep.
 * The newer, more comprehensive version is InterviewPrepPage.jsx.
 *
 * 🔗 ROUTE:
 * ---------
 * URL: /interview-old/:applicationId (if used)
 * Note: The main app now uses InterviewPrepPage.jsx instead
 *
 * 📌 FEATURES:
 * -----------
 * 1. Fetches interview preparation from AI service
 * 2. Shows job title and company
 * 3. Displays fit score badge
 * 4. Renders markdown-like content with basic formatting
 * 5. Print guide functionality
 *
 * 🔑 KEY CONCEPTS:
 * ----------------
 * - Uses dangerouslySetInnerHTML to render formatted content
 * - Basic markdown parsing (headings, bold, italic)
 * - 3-minute timeout for AI processing
 *
 * =============================================================================
 */

// Line 1: Import React and hooks
// useState = Hook for component state
// useEffect = Hook for side effects (API calls)
import React, { useState, useEffect } from 'react';
// Line 2: Import routing hooks and components
// useParams = Hook to access URL parameters (applicationId)
// useNavigate = Hook for programmatic navigation
// Link = Declarative navigation component
import { useParams, useNavigate, Link } from 'react-router-dom';
// Line 3: Import axios for HTTP requests
import axios from 'axios';
// Line 4: Import Header component for consistent navigation
import Header from '../components/Header';
// Line 5: Import CSS styles for this page
import './InterviewPrep.css';

/**
 * InterviewPrep Component - Simple Interview Preparation Display
 * 
 * @returns {React.ReactElement} - The interview prep page UI
 */
const InterviewPrep = () => {
  // ==================== HOOKS ====================
  
  // Line 8: Get applicationId from URL params (/interview/:applicationId)
  const { applicationId } = useParams();
  // Line 9: Hook for programmatic navigation
  const navigate = useNavigate();
  
  // ==================== STATE ====================
  
  // Line 10: State for interview preparation data from API
  const [preparation, setPreparation] = useState(null);
  // Line 11: State to track loading status
  const [loading, setLoading] = useState(true);
  // Line 12: State for job details
  const [job, setJob] = useState(null);

  // ==================== EFFECTS ====================
  
  // Line 14-16: Fetch interview prep when component mounts or applicationId changes
  useEffect(() => {
    fetchInterviewPrep();
  }, [applicationId]);

  // ==================== API FUNCTIONS ====================
  
  /**
   * Fetch interview preparation from the API
   * Makes a GET request to /api/interview/prepare/:applicationId
   * Uses a 3-minute timeout since LangGraph processing can take time
   */
  const fetchInterviewPrep = async () => {
    try {
      // Make API call with extended timeout for AI processing
      const response = await axios.get(`/api/interview/prepare/${applicationId}`, {
        timeout: 300000 // 5 minutes (300 seconds) for LangGraph processing
      });
      
      // Check if response indicates success
      if (response.data.success) {
        // Set preparation data
        setPreparation(response.data);
        // Set job details
        setJob(response.data.job);
      } else {
        // Throw error if response indicates failure
        throw new Error(response.data.error || 'Failed to generate interview preparation');
      }
    } catch (error) {
      // Log error for debugging
      console.error('Fetch interview prep error:', error);
      // Extract error message from response or use fallback
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load interview preparation. The AI service may be processing. Please try again in a moment.';
      // Show error to user
      alert(errorMessage);
      // Navigate back to dashboard
      navigate('/dashboard');
    } finally {
      // Hide loading state regardless of success/failure
      setLoading(false);
    }
  };

  // ==================== RENDER: LOADING STATE ====================
  
  // Show loading message while fetching data
  if (loading) {
    return (
      <div>
        <Header />
        <div className="loading">Preparing interview guide...</div>
      </div>
    );
  }

  // ==================== RENDER: ERROR STATE ====================
  
  // Show error if no preparation data
  if (!preparation) {
    return (
      <div>
        <Header />
        <div className="error">Interview preparation not found</div>
      </div>
    );
  }

  // ==================== RENDER: MAIN CONTENT ====================
  
  return (
    // Main container
    <div className="interview-prep-page">
      <Header />
      <div className="interview-prep-container">
        {/* Header section with job info */}
        <div className="interview-header">
          <h1>Interview Preparation</h1>
          {/* Job title and company */}
          <p className="job-info">
            {job?.title} at {job?.company}
          </p>
          {/* Fit score badge - shown if fitScore exists */}
          {preparation.fitScore && (
            <div className="fit-score-badge">
              Your Fit Score: {preparation.fitScore}%
            </div>
          )}
        </div>

        {/* Main preparation content */}
        <div className="preparation-content">
          {/* 
           * Render formatted content using dangerouslySetInnerHTML
           * WARNING: This is "dangerous" because it can render arbitrary HTML
           * Only use with trusted content (from your own API)
           * 
           * The regex transformations:
           * - \n → <br/> (newlines to line breaks)
           * - #{1,6}\s(.+) → <h2>$1</h2> (markdown headings to h2)
           * - **text** → <strong>text</strong> (bold)
           * - *text* → <em>text</em> (italic)
           */}
          <div
            className="preparation-text"
            dangerouslySetInnerHTML={{
              __html: preparation.preparation
                ?.replace(/\n/g, '<br/>')
                .replace(/#{1,6}\s(.+)/g, '<h2>$1</h2>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
            }}
          />
        </div>

        {/* Action buttons */}
        <div className="interview-actions">
          {/* Back to Dashboard link */}
          <Link to="/dashboard" className="btn-back">
            Back to Dashboard
          </Link>
          {/* Print button - uses browser's print functionality */}
          <button
            onClick={() => window.print()}
            className="btn-print"
          >
            Print Guide
          </button>
        </div>
      </div>
    </div>
  );
};

// Export the component as default export
export default InterviewPrep;
