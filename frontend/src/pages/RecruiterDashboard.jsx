/**
 * ===================================================================================
 *                    RECRUITER DASHBOARD PAGE COMPONENT
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS COMPONENT?
 * ---------------------------
 * Comprehensive dashboard for recruiters to:
 * - View all jobs they posted
 * - View candidates who applied
 * - Analyze resumes (ATS-friendly, project relevance)
 * - Make informed decisions (accept/reject)
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Recruiter logs in → Sees their posted jobs
 * 2. Clicks on a job → Sees all applicants
 * 3. Clicks "Analyze Resume" → Gets ATS + project analysis
 * 4. Reviews analysis → Makes decision (accept/reject)
 * 
 * 📌 KEY FEATURES:
 * ---------------
 * - View all posted jobs with application counts
 * - View candidates with fit scores
 * - Comprehensive resume analysis (ATS + Projects)
 * - Accept/Reject functionality
 * - Warning: Don't reject based on score alone
 * 
 * ===================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { 
  FaBriefcase, 
  FaUsers, 
  FaFileAlt, 
  FaCheckCircle, 
  FaTimesCircle,
  FaRobot,
  FaChartLine,
  FaCode,
  FaCheck,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';

const RecruiterDashboard = () => {
  // =============================================================================
  //                     HOOKS AND STATE
  // =============================================================================
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State: List of jobs posted by recruiter
  const [jobs, setJobs] = useState([]);
  
  // State: Selected job (for viewing candidates)
  const [selectedJob, setSelectedJob] = useState(null);
  
  // State: Candidates for selected job
  const [candidates, setCandidates] = useState([]);
  
  // State: Loading indicators
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [analyzing, setAnalyzing] = useState(null); // applicationId being analyzed
  
  // State: Analysis results
  const [analysisResults, setAnalysisResults] = useState({}); // { applicationId: { ats, projects } }
  
  // State: Selected candidate for detailed view
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  
  // State: AI recommendations
  const [aiRecommendations, setAiRecommendations] = useState({}); // { applicationId: { recommendation, reasoning, ... } }
  
  // State: Loading AI recommendation
  const [loadingAIRecommendation, setLoadingAIRecommendation] = useState(null); // applicationId being analyzed

  /**
   * =============================================================================
   *                     FETCH RECRUITER'S JOBS
   * =============================================================================
   */
  useEffect(() => {
    if (user && user.role === 'hirer') {
      fetchMyJobs();
    } else {
      navigate('/dashboard');
    }
  }, [user]);

  const fetchMyJobs = async () => {
    try {
      setLoadingJobs(true);
      // Get token from localStorage or user context
      const token = localStorage.getItem('token') || user?.token;
      
      if (!token) {
        console.error('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      
      const response = await axios.get('/api/hirer/my-jobs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Fetched jobs:', response.data.jobs); // Debug log
      console.log('✅ Jobs count:', response.data.jobs?.length || 0);
      
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('❌ Fetch jobs error:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error details:', error.response?.data);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Unauthorized access, redirecting to login');
        navigate('/login');
        return;
      }
      
      // Set empty array on error to show empty state
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  /**
   * =============================================================================
   *                     FETCH CANDIDATES FOR JOB
   * =============================================================================
   */
  const fetchCandidates = async (jobId) => {
    try {
      setLoadingCandidates(true);
      const response = await axios.get(`/api/hirer/job/${jobId}/candidates`);
      setCandidates(response.data.candidates || []);
      setSelectedJob(response.data.job);
    } catch (error) {
      console.error('Fetch candidates error:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  /**
   * =============================================================================
   *                     ANALYZE RESUME
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Analyzes candidate's resume for:
   * 1. ATS (Applicant Tracking System) friendliness
   * 2. Project relevance and usefulness
   * 
   * =============================================================================
   */
  const analyzeResume = async (applicationId) => {
    try {
      setAnalyzing(applicationId);
      const response = await axios.post(`/api/hirer/analyze-resume/${applicationId}`);
      
      setAnalysisResults(prev => ({
        ...prev,
        [applicationId]: response.data
      }));
      
      // Show candidate details
      const candidate = candidates.find(c => c.applicationId === applicationId);
      setSelectedCandidate({
        ...candidate,
        analysis: response.data
      });
    } catch (error) {
      console.error('Analyze resume error:', error);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setAnalyzing(null);
    }
  };

  /**
   * =============================================================================
   *                     GET AI RECOMMENDATION
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Gets AI-powered hiring recommendation using LangGraph workflow.
   * Considers: ATS, Agentic score, Projects, Profile, Experience, College tier.
   * 
   * 🔗 OPTIMIZATION:
   * ----------------
   * If ATS and Project analysis already exist (from "Analyze Resume" button),
   * passes them to avoid duplicate work in the AI workflow.
   * 
   * =============================================================================
   */
  const getAIRecommendation = async (applicationId) => {
    try {
      setLoadingAIRecommendation(applicationId);
      
      // Check if we already have ATS and project analysis
      const existingAnalysis = analysisResults[applicationId];
      const requestBody = existingAnalysis ? {
        existing_analysis: {
          atsAnalysis: existingAnalysis.atsAnalysis,
          projectAnalysis: existingAnalysis.projectAnalysis
        }
      } : {};
      
      const response = await axios.post(`/api/hirer/ai-recommendation/${applicationId}`, requestBody, {
        timeout: 300000 // 5 minutes for LangGraph workflow
      });
      
      setAiRecommendations(prev => ({
        ...prev,
        [applicationId]: response.data
      }));
      
      // Also update analysis results if available
      if (response.data.atsAnalysis && response.data.projectAnalysis) {
        setAnalysisResults(prev => ({
          ...prev,
          [applicationId]: {
            ...prev[applicationId],
            atsAnalysis: response.data.atsAnalysis,
            projectAnalysis: response.data.projectAnalysis
          }
        }));
      }
      
      // Show candidate details with AI recommendation
      const candidate = candidates.find(c => c.applicationId === applicationId);
      setSelectedCandidate({
        ...candidate,
        analysis: response.data,
        aiRecommendation: response.data
      });
    } catch (error) {
      console.error('AI recommendation error:', error);
      alert('Failed to get AI recommendation. Please try again.');
    } finally {
      setLoadingAIRecommendation(null);
    }
  };

  /**
   * =============================================================================
   *                     UPDATE APPLICATION STATUS
   * =============================================================================
   */
  /**
   * =============================================================================
   *                     RECALCULATE FIT SCORE
   * =============================================================================
   * 
   * Manually trigger fit score calculation for a candidate
   * 
   * =============================================================================
   */
  const handleRecalculateFitScore = async (applicationId) => {
    try {
      const candidate = candidates.find(c => c.applicationId === applicationId);
      if (!candidate) return;

      // Update candidate state to show calculating
      setCandidates(prev => prev.map(c => 
        c.applicationId === applicationId 
          ? { ...c, isCalculating: true, fitScore: 0 }
          : c
      ));

      // Call backend to recalculate
      const response = await axios.post(`/api/hirer/recalculate-fit-score/${applicationId}`, {}, {
        timeout: 60000 // 1 minute timeout
      });

      // Update candidate with new score
      setCandidates(prev => prev.map(c => 
        c.applicationId === applicationId 
          ? { 
              ...c, 
              fitScore: response.data.fitScore || 0,
              fitDetails: response.data.fitDetails || null,
              isCalculating: false
            }
          : c
      ));
    } catch (error) {
      console.error('Recalculate fit score error:', error);
      // Update to show error
      setCandidates(prev => prev.map(c => 
        c.applicationId === applicationId 
          ? { ...c, isCalculating: false, calculationError: error.message }
          : c
      ));
      alert('Failed to calculate fit score. Please try again.');
    }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      await axios.patch(`/api/hirer/application/${applicationId}/status`, { status });
      
      // Update local state
      setCandidates(prev => prev.map(c => 
        c.applicationId === applicationId 
          ? { ...c, status }
          : c
      ));
      
      // Refresh jobs to update counts
      fetchMyJobs();
      
      alert(`Candidate ${status === 'shortlisted' ? 'accepted' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('Update status error:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  /**
   * =============================================================================
   *                     GET FIT SCORE COLOR
   * =============================================================================
   */
  const getFitScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * =============================================================================
   *                     GET FIT SCORE BADGE COLOR
   * =============================================================================
   */
  const getFitScoreBadgeColor = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  /**
   * =============================================================================
   *                     GET RECOMMENDATION COLOR
   * =============================================================================
   */
  const getRecommendationColor = (recommendation) => {
    if (recommendation === 'Strong Accept') return 'bg-green-600 text-white';
    if (recommendation === 'Accept') return 'bg-green-500 text-white';
    if (recommendation === 'Consider') return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  /**
   * =============================================================================
   *                     GET RECOMMENDATION BADGE COLOR
   * =============================================================================
   */
  const getRecommendationBadgeColor = (recommendation) => {
    if (recommendation === 'Strong Accept') return 'bg-green-100 text-green-800 border-green-300';
    if (recommendation === 'Accept') return 'bg-green-50 text-green-700 border-green-200';
    if (recommendation === 'Consider') return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  if (loadingJobs) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-[#14b8a6] mx-auto mb-4" />
            <p className="text-gray-600">Loading your jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Recruiter Dashboard</h1>
          <p className="text-gray-600">Manage your job postings and review candidates</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaRobot className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> Agentic scores are a guide, not a decision-maker. 
                Always review the full resume analysis (ATS compatibility, project relevance) 
                before making hiring decisions. A lower score doesn't mean the candidate isn't 
                qualified - projects and skills matter too!
              </p>
            </div>
          </div>
        </div>

        {!selectedJob ? (
          /* ========================================================================
             *                     JOBS LIST VIEW
             * ======================================================================== */
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Job Postings</h2>
            
            {jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FaBriefcase className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Posted Yet</h3>
                <p className="text-gray-500 mb-4">Start by posting your first job opening</p>
                <button
                  onClick={() => navigate('/admin/jobs/create')}
                  className="bg-[#14b8a6] text-white px-6 py-2 rounded-lg hover:bg-[#0d9488] transition-colors font-semibold"
                >
                  Post a Job
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => fetchCandidates(job.id)}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                        <p className="text-gray-600 text-sm">{job.company}</p>
                        <p className="text-gray-500 text-sm mt-1">{job.location}</p>
                      </div>
                      <FaBriefcase className="text-2xl text-[#14b8a6]" />
                    </div>
                    
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {job.applicationsCount} {job.applicationsCount === 1 ? 'Applicant' : 'Applicants'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================
             *                     CANDIDATES VIEW
             * ======================================================================== */
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedJob(null);
                setCandidates([]);
                setSelectedCandidate(null);
                setAnalysisResults({});
              }}
              className="mb-4 text-[#14b8a6] hover:text-[#0d9488] flex items-center gap-2"
            >
              ← Back to Jobs
            </button>

            {/* Job Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{selectedJob.title}</h2>
              <p className="text-gray-600">{selectedJob.company}</p>
              <p className="text-gray-500 text-sm mt-2">{candidates.length} {candidates.length === 1 ? 'Candidate' : 'Candidates'}</p>
            </div>

            {loadingCandidates ? (
              <div className="text-center py-12">
                <FaSpinner className="animate-spin text-4xl text-[#14b8a6] mx-auto mb-4" />
                <p className="text-gray-600">Loading candidates...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applicants Yet</h3>
                <p className="text-gray-500">Candidates will appear here when they apply</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate) => {
                  const analysis = analysisResults[candidate.applicationId];
                  const isAnalyzing = analyzing === candidate.applicationId;
                  
                  return (
                    <div
                      key={candidate.applicationId}
                      className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-[#14b8a6] text-white flex items-center justify-center font-bold text-lg">
                              {candidate.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">{candidate.name}</h3>
                              <p className="text-gray-600 text-sm">{candidate.email}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                Applied {new Date(candidate.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Fit Score */}
                          {candidate.hasResume && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <FaRobot className="text-[#14b8a6]" />
                                <span className="text-sm font-medium text-gray-700">Agentic Fit Score</span>
                                {candidate.isCalculating && (
                                  <FaSpinner className="text-[#14b8a6] animate-spin text-xs" />
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {candidate.isCalculating ? (
                                  <span className="text-2xl font-bold text-gray-400">
                                    Calculating...
                                  </span>
                                ) : (
                                  <>
                                    <span className={`text-2xl font-bold ${getFitScoreColor(candidate.fitScore)}`}>
                                      {candidate.fitScore || 0}%
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFitScoreBadgeColor(candidate.fitScore)}`}>
                                      {candidate.fitScore >= 70 ? 'Strong Match' : 
                                       candidate.fitScore >= 50 ? 'Moderate Match' : 
                                       candidate.fitScore > 0 ? 'Weak Match' : 'Not Calculated'}
                                    </span>
                                  </>
                                )}
                              </div>
                              {candidate.fitDetails && !candidate.isCalculating && (
                                <div className="mt-2 text-xs text-gray-600">
                                  <p><strong>Strengths:</strong> {candidate.fitDetails.strengths?.slice(0, 2).join(', ') || 'N/A'}</p>
                                  <p><strong>Gaps:</strong> {candidate.fitDetails.gaps?.slice(0, 2).join(', ') || 'N/A'}</p>
                                </div>
                              )}
                              {candidate.isCalculating && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs text-gray-500 italic">
                                    Score is being calculated. 
                                  </span>
                                  <button
                                    onClick={() => handleRecalculateFitScore(candidate.applicationId)}
                                    className="text-xs text-[#14b8a6] hover:underline"
                                  >
                                    Retry Calculation
                                  </button>
                                </div>
                              )}
                              {candidate.fitScore === 0 && !candidate.isCalculating && candidate.hasResume && (
                                <button
                                  onClick={() => handleRecalculateFitScore(candidate.applicationId)}
                                  className="mt-2 text-xs text-[#14b8a6] hover:underline flex items-center gap-1"
                                >
                                  <FaRobot className="text-xs" />
                                  Calculate Fit Score
                                </button>
                              )}
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="mb-4 flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              candidate.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                              candidate.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {candidate.status === 'shortlisted' ? 'Accepted' :
                               candidate.status === 'rejected' ? 'Rejected' :
                               'Applied'}
                            </span>
                            {candidate.hasResume && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                                <FaFileAlt className="text-xs" />
                                Resume Available
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          {candidate.hasResume ? (
                            <>
                              <button
                                onClick={() => getAIRecommendation(candidate.applicationId)}
                                disabled={loadingAIRecommendation === candidate.applicationId}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                              >
                                {loadingAIRecommendation === candidate.applicationId ? (
                                  <>
                                    <FaSpinner className="animate-spin" />
                                    AI Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <FaRobot />
                                    Get AI Suggestion
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => analyzeResume(candidate.applicationId)}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-4 py-2 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                {isAnalyzing ? (
                                  <>
                                    <FaSpinner className="animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <FaFileAlt />
                                    Analyze Resume
                                  </>
                                )}
                              </button>
                              
                              {candidate.status === 'applied' && (
                                <>
                                  <button
                                    onClick={() => updateStatus(candidate.applicationId, 'shortlisted')}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                                  >
                                    <FaCheck />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to reject this candidate? Make sure you\'ve reviewed their resume analysis and AI recommendation.')) {
                                        updateStatus(candidate.applicationId, 'rejected');
                                      }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                  >
                                    <FaTimes />
                                    Reject
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-gray-500 px-4 py-2">No resume uploaded</span>
                          )}
                        </div>
                      </div>

                      {/* AI Recommendation */}
                      {aiRecommendations[candidate.applicationId] && (
                        <div className="mt-6 pt-6 border-t">
                          <div className={`rounded-lg p-6 border-2 ${getRecommendationBadgeColor(aiRecommendations[candidate.applicationId].recommendation)}`}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <FaRobot className="text-2xl" />
                                <div>
                                  <h4 className="font-bold text-lg">AI Hiring Recommendation</h4>
                                  <p className="text-sm opacity-75">Powered by LangGraph Workflow</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getRecommendationColor(aiRecommendations[candidate.applicationId].recommendation)}`}>
                                  {aiRecommendations[candidate.applicationId].recommendation}
                                </div>
                                <p className="text-xs mt-1 opacity-75">
                                  Confidence: {aiRecommendations[candidate.applicationId].confidence_score}%
                                </p>
                              </div>
                            </div>
                            
                            {/* Reasoning */}
                            <div className="mb-4">
                              <h5 className="font-semibold mb-2">Reasoning:</h5>
                              <p className="text-sm leading-relaxed">
                                {aiRecommendations[candidate.applicationId].reasoning}
                              </p>
                            </div>
                            
                            {/* Key Factors */}
                            {aiRecommendations[candidate.applicationId].key_factors?.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-semibold mb-2">Key Factors Considered:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {aiRecommendations[candidate.applicationId].key_factors.map((factor, i) => (
                                    <span key={i} className="px-3 py-1 bg-white rounded-full text-xs border">
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Strengths */}
                            {aiRecommendations[candidate.applicationId].strengths?.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-semibold mb-2 text-green-700">Strengths:</h5>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {aiRecommendations[candidate.applicationId].strengths.map((strength, i) => (
                                    <li key={i}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Concerns */}
                            {aiRecommendations[candidate.applicationId].concerns?.length > 0 && (
                              <div className="mb-4">
                                <h5 className="font-semibold mb-2 text-red-700">Concerns:</h5>
                                <ul className="list-disc list-inside text-sm space-y-1">
                                  {aiRecommendations[candidate.applicationId].concerns.map((concern, i) => (
                                    <li key={i}>{concern}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Suggestion */}
                            {aiRecommendations[candidate.applicationId].suggestion && (
                              <div className="mt-4 pt-4 border-t">
                                <h5 className="font-semibold mb-2">Suggestion:</h5>
                                <p className="text-sm font-medium">
                                  {aiRecommendations[candidate.applicationId].suggestion}
                                </p>
                              </div>
                            )}
                            
                            {/* Analysis Breakdown */}
                            {aiRecommendations[candidate.applicationId].analysis && (
                              <div className="mt-4 pt-4 border-t">
                                <h5 className="font-semibold mb-3">Analysis Breakdown:</h5>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-600">ATS Score</p>
                                    <p className="font-semibold">{aiRecommendations[candidate.applicationId].analysis.ats_score || 0}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Profile Match</p>
                                    <p className="font-semibold">{aiRecommendations[candidate.applicationId].analysis.profile_match_score || 0}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">College Tier</p>
                                    <p className="font-semibold">{aiRecommendations[candidate.applicationId].analysis.college_tier || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Experience</p>
                                    <p className="font-semibold">{aiRecommendations[candidate.applicationId].analysis.experience_level || 'None'}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Project Score</p>
                                    <p className="font-semibold">{Math.round(aiRecommendations[candidate.applicationId].analysis.project_score || 0)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Agentic Score</p>
                                    <p className="font-semibold">{aiRecommendations[candidate.applicationId].analysis.agentic_score || 0}%</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Analysis Results */}
                      {analysis && (
                        <div className="mt-6 pt-6 border-t space-y-4">
                          {/* ATS Analysis */}
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FaChartLine className="text-blue-600" />
                              <h4 className="font-semibold text-gray-800">ATS Compatibility</h4>
                              <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
                                analysis.atsAnalysis.isATSFriendly 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {analysis.atsAnalysis.score}% - {analysis.atsAnalysis.isATSFriendly ? 'ATS Friendly' : 'Needs Improvement'}
                              </span>
                            </div>
                            {analysis.atsAnalysis.strengths?.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">Strengths:</p>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                  {analysis.atsAnalysis.strengths.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysis.atsAnalysis.improvements?.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-gray-700 mb-1">Improvements:</p>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                  {analysis.atsAnalysis.improvements.map((s, i) => (
                                    <li key={i}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Project Analysis */}
                          <div className="bg-purple-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <FaCode className="text-purple-600" />
                              <h4 className="font-semibold text-gray-800">Project Relevance</h4>
                              <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${
                                analysis.projectAnalysis.usefulForCompany 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {analysis.projectAnalysis.usefulForCompany ? 'Useful for Company' : 'Review Needed'}
                              </span>
                            </div>
                            {analysis.projectAnalysis.relevantProjects?.length > 0 && (
                              <div className="space-y-2">
                                {analysis.projectAnalysis.relevantProjects.slice(0, 3).map((project, i) => (
                                  <div key={i} className="bg-white rounded p-2">
                                    <p className="text-xs font-medium text-gray-800">{project.name}</p>
                                    <p className="text-xs text-gray-600">Relevance: {project.relevanceScore}%</p>
                                    {project.reasons && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {project.reasons.slice(0, 1).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-2">{analysis.projectAnalysis.summary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterDashboard;

