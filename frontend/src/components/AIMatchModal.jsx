/**
 * =============================================================================
 *                    AIMATCHMODAL.JSX - AI Match Score Modal
 * =============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This component displays a modal popup showing detailed AI match analysis
 * between a user's resume and a specific job. It shows the overall score,
 * breakdown by category, strengths, and areas to improve.
 *
 * 🔗 HOW IT'S USED:
 * -----------------
 * In Dashboard.jsx or Jobs.jsx:
 *   <AIMatchModal 
 *     job={selectedJob}
 *     fitScore={selectedJob.fitScore}
 *     onClose={() => setShowModal(false)}
 *   />
 *
 * 📌 FEATURES:
 * -----------
 * 1. Overall match score with percentage
 * 2. Score breakdown by category (skills, experience, education)
 * 3. List of strengths based on resume
 * 4. List of gaps/areas to improve
 * 5. Job requirements summary
 * 6. Recommendation status (Highly Recommended, Consider, etc.)
 *
 * 🔑 KEY CONCEPTS:
 * ----------------
 * - Modal overlay with backdrop
 * - Dynamic color coding based on scores
 * - Progress bars for visual score representation
 *
 * =============================================================================
 */

// Line 1: Import React library
import React from 'react';
// Line 2: Import icons from react-icons/fa (Font Awesome)
// FaTimes = X icon for close button
// FaCheckCircle = Checkmark icon for strengths
// FaExclamationTriangle = Warning icon for gaps
// FaChartBar = Chart icon for scores
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaChartBar } from 'react-icons/fa';

/**
 * AIMatchModal Component - Displays detailed AI match analysis
 * 
 * @param {Object} props - Component props
 * @param {Object} props.job - The job being analyzed
 * @param {Object} props.fitScore - AI-generated fit score data
 * @param {Function} props.onClose - Function to close the modal
 * @returns {React.ReactElement|null} - Modal UI or null if no data
 */
const AIMatchModal = ({ job, fitScore, onClose }) => {
  // Line 5: Return null if required data is missing
  // This prevents rendering an empty or broken modal
  if (!fitScore || !job) return null;

  // ==================== DATA EXTRACTION ====================
  
  // Line 7: Extract overall score from fitScore object
  // Handle both nested object {fitScore: 75} and direct value 75
  const score = fitScore.fitScore || fitScore;
  // Line 8: Extract score breakdown by category
  // breakdown = {skills: 80, experience: 70, education: 60, overall: 75}
  const breakdown = fitScore.breakdown || {};
  // Line 9: Extract list of strengths
  // strengths = ["Strong JavaScript skills", "Relevant project experience"]
  const strengths = fitScore.strengths || [];
  // Line 10: Extract list of gaps/areas to improve
  // gaps = ["Missing cloud experience", "Need more leadership examples"]
  const gaps = fitScore.gaps || [];
  // Line 11: Extract recommendation text
  // recommendation = "Highly Recommended" | "Consider" | "Not Recommended"
  const recommendation = fitScore.recommendation || 'Consider';

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Get CSS classes for score color based on value
   * 
   * @param {number} score - Score value (0-100)
   * @returns {string} - CSS classes for text and background color
   */
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';  // High score - green
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'; // Medium score - yellow
    return 'text-red-600 bg-red-50';  // Low score - red
  };

  /**
   * Get CSS classes for recommendation badge color
   * 
   * @param {string} rec - Recommendation text
   * @returns {string} - CSS classes for badge styling
   */
  const getRecommendationColor = (rec) => {
    // Check for positive recommendations
    if (rec.toLowerCase().includes('highly') || rec.toLowerCase().includes('recommended')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    // Check for neutral recommendations
    if (rec.toLowerCase().includes('consider')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    // Default to negative/cautionary
    return 'bg-red-100 text-red-800 border-red-300';
  };

  // ==================== RENDER ====================
  
  return (
    // Modal overlay - covers entire screen with semi-transparent black background
    // z-50 ensures modal appears above other content
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Modal container - white background, rounded corners, scrollable */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* ==================== HEADER ==================== */}
        {/* Sticky header with gradient background */}
        <div className="sticky top-0 bg-gradient-to-r from-[#14b8a6] to-[#0d9488] text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-1">AI Match Analysis</h2>
            {/* Show job title and company */}
            <p className="text-teal-100 text-sm">{job.title} at {job.company}</p>
          </div>
          {/* Close button - X icon */}
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* ==================== CONTENT ==================== */}
        <div className="p-6 space-y-6">
          
          {/* Overall Score Section - centered with large number */}
          <div className="text-center bg-gray-50 rounded-xl p-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaChartBar className="text-3xl text-[#14b8a6]" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall Match Score</p>
                {/* Large score display with dynamic color */}
                <div className={`text-5xl font-bold ${getScoreColor(score).split(' ')[0]}`}>
                  {score}%
                </div>
              </div>
            </div>
            {/* Recommendation badge */}
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 ${getRecommendationColor(recommendation)}`}>
              {recommendation}
            </div>
          </div>

          {/* Breakdown Section - show if breakdown data exists */}
          {Object.keys(breakdown).length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaChartBar className="text-[#14b8a6]" />
                Score Breakdown
              </h3>
              {/* Grid of breakdown categories */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(breakdown).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      {/* Category name - convert camelCase to Title Case */}
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {/* Category score with dynamic color */}
                      <span className={`font-bold ${getScoreColor(value).split(' ')[0]}`}>
                        {value}%
                      </span>
                    </div>
                    {/* Progress bar showing score visually */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths Section - show if strengths exist */}
          {strengths.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                Your Strengths
              </h3>
              <div className="space-y-2">
                {/* Map through each strength */}
                {strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3 bg-green-50 rounded-lg p-3">
                    <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps Section - show if gaps exist */}
          {gaps.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-500" />
                Areas to Improve
              </h3>
              <div className="space-y-2">
                {/* Map through each gap */}
                {gaps.map((gap, index) => (
                  <div key={index} className="flex items-start gap-3 bg-yellow-50 rounded-lg p-3">
                    <FaExclamationTriangle className="text-yellow-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700">{gap}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Job Details Section - shows job requirements */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Job Requirements</h3>
            <div className="space-y-2 text-sm">
              {/* Required Skills */}
              {job.skills && job.skills.length > 0 && (
                <div>
                  <span className="font-semibold text-gray-700">Required Skills: </span>
                  <span className="text-gray-600">{job.skills.join(', ')}</span>
                </div>
              )}
              {/* Experience Requirement */}
              {job.experience?.display && (
                <div>
                  <span className="font-semibold text-gray-700">Experience: </span>
                  <span className="text-gray-600">{job.experience.display}</span>
                </div>
              )}
              {/* Job Location */}
              {job.location && (
                <div>
                  <span className="font-semibold text-gray-700">Location: </span>
                  <span className="text-gray-600">{job.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== FOOTER ==================== */}
        {/* Sticky footer with close button */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Export the component as default export
export default AIMatchModal;
