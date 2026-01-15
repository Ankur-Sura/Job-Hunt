/**
 * ===================================================================================
 *                    INTERVIEW PREPARATION PAGE COMPONENT
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS COMPONENT?
 * ---------------------------
 * This component displays a comprehensive interview preparation guide for a job application.
 * It fetches AI-generated content from the backend and displays it in organized sections.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User navigates to /interview/:applicationId
 * 2. Component extracts applicationId from URL params
 * 3. useEffect triggers API call to fetch interview prep
 * 4. Shows loading animation with progress steps while AI processes (3-5 minutes)
 * 5. Displays structured content:
 *    - Company information and interview links
 *    - Interview rounds breakdown
 *    - DSA preparation (if applicable)
 *    - System Design preparation (if applicable)
 *    - Behavioral preparation (if applicable)
 *    - Common questions with answers
 * 
 * 📌 KEY FEATURES:
 * ---------------
 * - Loading animation with progress steps
 * - Collapsible sections for better UX
 * - Error handling with retry option
 * - Prevents duplicate API calls (useRef + hasFetched)
 * - 5-minute timeout for long AI processing
 * 
 * 📌 STATE MANAGEMENT:
 * -------------------
 * - loading: Shows loading spinner
 * - currentStep: Progress indicator (which step is active)
 * - preparation: Full interview prep data from API
 * - error: Error message if API fails
 * - expandedSections: Which sections are expanded/collapsed
 * 
 * ===================================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import { 
  FaArrowLeft, FaBuilding, FaCode, FaServer, 
  FaUsers, FaQuestionCircle, FaLightbulb, FaExternalLinkAlt,
  FaCheckCircle, FaChevronDown, FaChevronUp,
  FaClock, FaGraduationCap, FaLink, FaRocket, FaBookOpen
} from 'react-icons/fa';
import './InterviewPrepPage.css';

const InterviewPrepPage = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const hasFetched = useRef(false); // Prevent duplicate fetches
  
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [preparation, setPreparation] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    company: true,
    rounds: true,
    dsa: false,
    systemDesign: false,
    behavioral: false,
    common: false
  });

  const steps = [
    { icon: FaBuilding, label: 'Researching Company', desc: 'Finding interview experiences online...' },
    { icon: FaClock, label: 'Analyzing Rounds', desc: 'Identifying interview process...' },
    { icon: FaCode, label: 'DSA Preparation', desc: 'Generating coding questions...' },
    { icon: FaServer, label: 'System Design', desc: 'Preparing design questions...' },
    { icon: FaUsers, label: 'Behavioral Prep', desc: 'STAR format questions...' },
    { icon: FaQuestionCircle, label: 'Common Questions', desc: 'Generating interview Q&A...' }
  ];

  /**
   * =============================================================================
   *                     FETCH INTERVIEW PREPARATION
   * =============================================================================
   * 
   * 📖 WHAT IT DOES:
   * ----------------
   * Fetches interview preparation data from the backend API.
   * The backend calls the AI service which uses LangGraph to generate content.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Sets loading state to true
   * 2. Resets progress step to 0
   * 3. Makes GET request to /api/interview/prepare/:applicationId
   * 4. Waits for response (can take 3-5 minutes)
   * 5. Updates state with preparation data
   * 6. Sets loading to false
   * 
   * ⏱️ TIMEOUT:
   * -----------
   * 5 minutes (300000ms) - necessary because AI processing takes time
   * 
   * ⚠️ ERROR HANDLING:
   * -----------------
   * - Catches network errors
   * - Catches API errors
   * - Displays error message to user
   * 
   * =============================================================================
   */
  const fetchInterviewPrep = async () => {
    console.log('🚀 Starting fetchInterviewPrep for:', applicationId);
    
    // Validate applicationId before making API call
    if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
      console.error('❌ Invalid applicationId:', applicationId);
      setError('Invalid application ID. Please apply to a job first.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setCurrentStep(0);
    setError(null);
    
    try {
      console.log('📡 Making API call to /api/interview/prepare/' + applicationId);
      // API call with 5-minute timeout for LangGraph processing
      // This is necessary because the AI service takes 3-5 minutes to generate content
      const response = await axios.get(`/api/interview/prepare/${applicationId}`, {
        timeout: 300000 // 5 minute timeout for LangGraph processing
      });
      
      console.log('✅ API response received:', response.data?.success);
      
      if (response.data.success) {
        setPreparation(response.data);
        setCurrentStep(steps.length);
      } else {
        throw new Error(response.data.error || 'Failed to generate interview preparation');
      }
    } catch (err) {
      console.error('❌ Interview prep error:', err);
      console.error('   Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        code: err.code
      });
      
      // Better error messages for common issues
      let errorMessage = 'Failed to load interview preparation';
      
      if (err.response?.status === 400) {
        if (err.response?.data?.error?.includes('Resume not found') || err.response?.data?.error?.includes('upload your resume')) {
          errorMessage = 'Please upload your resume first to generate interview preparation.';
        } else if (err.response?.data?.error?.includes('Invalid application ID')) {
          errorMessage = 'Invalid application. Please apply to a job first.';
        } else {
          errorMessage = err.response?.data?.error || errorMessage;
        }
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. This application does not belong to you.';
      } else if (err.response?.status === 404) {
        if (err.response?.data?.error?.includes('Application not found')) {
          errorMessage = 'Application not found. Please apply to a job first.';
        } else if (err.response?.data?.error?.includes('Job not found')) {
          errorMessage = 'Job not found for this application.';
        } else {
          errorMessage = 'Application or job not found.';
        }
      } else if (err.response?.status === 500) {
        errorMessage = err.response?.data?.error || 'Server error. The AI service may be processing. Please try again in a moment.';
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The AI service is still processing your interview preparation. For complex companies like Amazon or Google, this can take 4-5 minutes. Please wait a moment and try again.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * =============================================================================
   *                     FETCH ON MOUNT
   * =============================================================================
   * 
   * 📖 WHAT IT DOES:
   * ----------------
   * Fetches interview preparation when component mounts.
   * 
   * 🔗 WHY useRef + hasFetched?
   * ---------------------------
   * React Strict Mode runs useEffect twice in development.
   * This prevents duplicate API calls.
   * 
   * 📌 DEPENDENCIES:
   * ---------------
   * [applicationId] - Only re-fetch if applicationId changes
   * 
   * =============================================================================
   */
  useEffect(() => {
    // Only fetch once per mount (prevents duplicate calls in React Strict Mode)
    if (applicationId && !hasFetched.current) {
      hasFetched.current = true;
      fetchInterviewPrep();
    }
  }, [applicationId]);

  useEffect(() => {
    if (loading && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [loading, currentStep]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Loading State
  if (loading) {
    const StepIcon = steps[currentStep]?.icon || FaRocket;
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 50%, #ecfdf5 100%)' }}>
        <Header />
        <main style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
          {/* Main Loading Card */}
          <div style={{ 
            background: 'white', 
            borderRadius: '24px', 
            padding: '40px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            {/* Animated Icon */}
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <FaGraduationCap style={{ fontSize: '48px', color: 'white' }} />
            </div>
            
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              🎯 Preparing Your Interview Guide
            </h1>
            
            <p style={{ color: '#64748b', marginBottom: '32px' }}>
              AI is researching and creating a personalized preparation plan...
            </p>
            
            {/* Progress Steps */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '16px', 
              padding: '24px',
              marginBottom: '24px'
            }}>
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                
                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '12px',
                    marginBottom: index < steps.length - 1 ? '8px' : '0',
                    background: isActive ? 'linear-gradient(135deg, #14b8a6, #0ea5e9)' : 'transparent',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      background: isComplete ? '#10b981' : isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                      color: isComplete || isActive ? 'white' : '#94a3b8'
                    }}>
                      {isComplete ? <FaCheckCircle /> : <Icon />}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: isActive ? 'white' : isComplete ? '#10b981' : '#64748b',
                        fontSize: '0.9rem'
                      }}>
                        {step.label}
                      </div>
                      {isActive && (
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                          {step.desc}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Time Estimate */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 20px',
              background: '#fef3c7',
              borderRadius: '12px',
              color: '#92400e'
            }}>
              <FaLightbulb />
              <span style={{ fontSize: '0.875rem' }}>
                This takes 2-4 minutes as we search real interview experiences
              </span>
            </div>
          </div>
          
          {/* CSS Animation */}
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}</style>
        </main>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="interview-prep-page">
        <Header />
        <div className="prep-error-container">
          <div className="error-card">
            <div className="error-icon">❌</div>
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => { hasFetched.current = false; fetchInterviewPrep(); }} className="btn-retry">
                Try Again
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-back">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Content
  return (
    <div className="interview-prep-page">
      <Header />
      
      <div className="prep-main-container">
        {/* Header Section */}
        <div className="prep-header">
          <button onClick={() => navigate('/dashboard')} className="back-button">
            <FaArrowLeft /> Back to Dashboard
          </button>
          
          <div className="prep-title-section">
            <h1>🎯 Interview Preparation Guide</h1>
            {preparation?.job && (
              <div className="job-info-header">
                <h2>{preparation.job.title}</h2>
                <span className="company-badge">
                  <FaBuilding /> {preparation.job.company}
                </span>
                {preparation.role_level && (
                  <span className="level-badge">{preparation.role_level}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Sections */}
        <div className="prep-content">
          
          {/* Company Info Section */}
          <section className="prep-section">
            <button 
              className={`section-header ${expandedSections.company ? 'expanded' : ''}`}
              onClick={() => toggleSection('company')}
            >
              <div className="section-title">
                <FaBuilding className="section-icon company" />
                <span>About {preparation?.job?.company || 'the Company'}</span>
              </div>
              {expandedSections.company ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {expandedSections.company && (
              <div className="section-content">
                {preparation?.company_info ? (
                  <div className="markdown-content">
                    <p>{preparation.company_info}</p>
                  </div>
                ) : (
                  <p>Company information not available.</p>
                )}
                
                {/* Interview Links */}
                {preparation?.interview_links && preparation.interview_links.length > 0 && (
                  <div className="interview-links">
                    <h4><FaLink /> Real Interview Experiences:</h4>
                    <div className="links-grid">
                      {preparation.interview_links.map((link, idx) => (
                        <a 
                          key={idx} 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="link-card"
                        >
                          <span className="link-source">{link.source}</span>
                          <span className="link-title">{link.title}</span>
                          <FaExternalLinkAlt className="link-icon" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Interview Rounds Section */}
          <section className="prep-section">
            <button 
              className={`section-header ${expandedSections.rounds ? 'expanded' : ''}`}
              onClick={() => toggleSection('rounds')}
            >
              <div className="section-title">
                <FaClock className="section-icon rounds" />
                <span>Interview Process & Rounds</span>
                {preparation?.interview_rounds?.total_rounds && (
                  <span className="count-badge">{preparation.interview_rounds.total_rounds} rounds</span>
                )}
              </div>
              {expandedSections.rounds ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {expandedSections.rounds && (
              <div className="section-content">
                {preparation?.interview_rounds?.typical_duration && (
                  <p className="timeline-info">
                    <FaClock /> Typical Timeline: {preparation.interview_rounds.typical_duration}
                  </p>
                )}
                
                <div className="rounds-timeline">
                  {preparation?.interview_rounds?.rounds?.map((round, idx) => (
                    <div key={idx} className="round-card">
                      <div className="round-number">Round {round.round_number || idx + 1}</div>
                      <div className="round-content">
                        <h4>{round.name}</h4>
                        <span className="round-type-badge">{round.type}</span>
                        <p><strong>Duration:</strong> {round.duration}</p>
                        <p><strong>What to Expect:</strong> {round.what_to_expect}</p>
                        <p className="round-tips"><FaLightbulb /> {round.tips}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* DSA Section */}
          <section className="prep-section">
            <button 
              className={`section-header ${expandedSections.dsa ? 'expanded' : ''}`}
              onClick={() => toggleSection('dsa')}
            >
              <div className="section-title">
                <FaCode className="section-icon dsa" />
                <span>DSA & Coding Preparation</span>
              </div>
              {expandedSections.dsa ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {expandedSections.dsa && (
              <div className="section-content">
                {preparation?.dsa_prep ? (
                  <>
                    <div className="difficulty-focus">
                      <strong>Difficulty Focus:</strong> {preparation.dsa_prep.difficulty_focus}
                    </div>
                    
                    {preparation.dsa_prep.must_know_topics && (
                      <div className="topics-section">
                        <h4>Must-Know Topics:</h4>
                        <div className="topics-grid">
                          {preparation.dsa_prep.must_know_topics.map((topic, idx) => (
                            <span key={idx} className="topic-tag">
                              {typeof topic === 'string' ? topic : topic.topic || topic.name || JSON.stringify(topic)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {preparation.dsa_prep.top_15_questions && (
                      <div className="questions-section">
                        <h4>Top Questions to Practice:</h4>
                        <div className="questions-list">
                          {preparation.dsa_prep.top_15_questions.map((q, idx) => (
                            <div key={idx} className="question-card">
                              <div className="question-header">
                                <span className="question-number">{idx + 1}</span>
                                <span className="question-name">{q.question}</span>
                                <span className={`difficulty-badge ${q.difficulty?.toLowerCase()}`}>
                                  {q.difficulty}
                                </span>
                              </div>
                              <div className="question-details">
                                <p><strong>Topic:</strong> {q.topic}</p>
                                <p><strong>Approach:</strong> {q.approach}</p>
                                {q.link && (
                                  <a href={q.link} target="_blank" rel="noopener noreferrer" className="leetcode-link">
                                    <FaExternalLinkAlt /> Practice on LeetCode
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Resources */}
                    {preparation.dsa_prep.resources && preparation.dsa_prep.resources.length > 0 && (
                      <div className="resources-section" style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                        <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FaBookOpen /> Practice Resources:
                        </h4>
                        <div className="resources-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {preparation.dsa_prep.resources.map((resource, idx) => (
                            <a 
                              key={idx}
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="resource-link"
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                color: '#0ea5e9',
                                textDecoration: 'none',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                background: 'white',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#e0f2fe'}
                              onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                              <FaExternalLinkAlt /> {resource.name} <span style={{ color: '#64748b', fontSize: '0.875rem' }}>({resource.type})</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p>DSA preparation data not available.</p>
                )}
              </div>
            )}
          </section>

          {/* System Design Section */}
          {preparation?.system_design_prep && (
            <section className="prep-section">
              <button 
                className={`section-header ${expandedSections.systemDesign ? 'expanded' : ''}`}
                onClick={() => toggleSection('systemDesign')}
              >
                <div className="section-title">
                  <FaServer className="section-icon system-design" />
                  <span>System Design Preparation</span>
                </div>
                {expandedSections.systemDesign ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedSections.systemDesign && (
                <div className="section-content">
                  {/* SDE-1 Structured Guidance */}
                  {preparation.system_design_prep.sde1_guidance && (
                    <div style={{ marginBottom: '24px' }}>
                      {preparation.system_design_prep.sde1_guidance.focus_areas?.map((section, idx) => (
                        <div key={idx} style={{ 
                          padding: '16px', 
                          background: idx === 0 ? '#fef3c7' : '#f0fdf4', 
                          borderRadius: '12px', 
                          marginBottom: '12px' 
                        }}>
                          <h5 style={{ marginBottom: '12px', color: idx === 0 ? '#92400e' : '#166534', fontWeight: '600' }}>
                            {section.area}
                          </h5>
                          {section.description && (
                            <p style={{ color: '#64748b' }}>{section.description}</p>
                          )}
                          {section.items && (
                            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                              {section.items.map((item, i) => (
                                <li key={i} style={{ marginBottom: '6px', color: '#475569' }}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                      
                      {/* Quick Resources */}
                      {preparation.system_design_prep.sde1_guidance.quick_resources && (
                        <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', marginBottom: '12px' }}>
                          <h5 style={{ marginBottom: '12px', color: '#1e40af', fontWeight: '600' }}>📚 Quick Resources (1-2 hours total)</h5>
                          <ul style={{ marginLeft: '20px' }}>
                            {preparation.system_design_prep.sde1_guidance.quick_resources.map((res, i) => (
                              <li key={i} style={{ marginBottom: '6px', color: '#475569' }}>
                                {res.name} <span style={{ color: '#64748b' }}>({res.time})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Fallback: Level Expectation as text */}
                  {!preparation.system_design_prep.sde1_guidance && preparation.system_design_prep.level_expectation && (
                    <div className="expectation-box" style={{ padding: '20px', background: '#fef3c7', borderRadius: '12px', marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '16px', color: '#92400e' }}>📋 What's Expected</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {preparation.system_design_prep.level_expectation.split('\n').filter(line => line.trim()).map((line, idx) => {
                          const trimmedLine = line.trim();
                          if (trimmedLine.startsWith('🎯') || trimmedLine.startsWith('💡') || trimmedLine.startsWith('⏰') || trimmedLine.startsWith('📚')) {
                            return <h5 key={idx} style={{ marginTop: '8px', color: '#78350f', fontWeight: '600' }}>{trimmedLine}</h5>;
                          }
                          if (trimmedLine.startsWith('-')) {
                            return <p key={idx} style={{ marginLeft: '16px', color: '#92400e' }}>• {trimmedLine.substring(1).trim()}</p>;
                          }
                          if (/^\d+\./.test(trimmedLine)) {
                            return <p key={idx} style={{ marginLeft: '16px', color: '#92400e' }}>{trimmedLine}</p>;
                          }
                          return trimmedLine.length > 0 ? <p key={idx} style={{ color: '#92400e' }}>{trimmedLine}</p> : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {preparation.system_design_prep.common_questions && preparation.system_design_prep.common_questions.length > 0 && (
                    <div className="questions-section" style={{ marginBottom: '24px' }}>
                      <h4>Common Design Questions:</h4>
                      {preparation.system_design_prep.common_questions.map((q, idx) => (
                        <div key={idx} className="question-card" style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                          <h5 style={{ marginBottom: '8px' }}>{q.question}</h5>
                          <p><strong>Difficulty:</strong> {q.difficulty}</p>
                          {q.time_to_solve && <p><strong>Time:</strong> {q.time_to_solve}</p>}
                          {q.key_concepts && (
                            <div style={{ marginTop: '12px' }}>
                              <strong>Key Concepts:</strong>
                              <div className="topics-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {q.key_concepts.map((concept, i) => (
                                  <span key={i} className="topic-tag" style={{ padding: '4px 12px', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.875rem' }}>
                                    {typeof concept === 'string' ? concept : concept.name || concept.concept || JSON.stringify(concept)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {q.approach_outline && (
                            <div style={{ marginTop: '12px' }}>
                              <strong>Approach:</strong>
                              <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                {q.approach_outline.map((step, i) => (
                                  <li key={i} style={{ marginBottom: '4px' }}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {preparation.system_design_prep.concepts_to_know && preparation.system_design_prep.concepts_to_know.length > 0 && (
                    <div className="concepts-section" style={{ marginBottom: '24px' }}>
                      <h4>Concepts to Master:</h4>
                      {preparation.system_design_prep.concepts_to_know.map((item, idx) => (
                        <div key={idx} className="concept-item" style={{ marginBottom: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                          <strong>{item.concept}:</strong> {item.why}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Resources */}
                  {preparation.system_design_prep.resources && preparation.system_design_prep.resources.length > 0 && (
                    <div className="resources-section" style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                      <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaBookOpen /> Resources:
                      </h4>
                      <div className="resources-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {preparation.system_design_prep.resources.map((resource, idx) => (
                          <a 
                            key={idx}
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="resource-link"
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              color: '#0ea5e9',
                              textDecoration: 'none',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: 'white',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#e0f2fe'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                          >
                            <FaExternalLinkAlt /> {resource.name} <span style={{ color: '#64748b', fontSize: '0.875rem' }}>({resource.type})</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Behavioral Section */}
          {preparation?.behavioral_prep && (
            <section className="prep-section">
              <button 
                className={`section-header ${expandedSections.behavioral ? 'expanded' : ''}`}
                onClick={() => toggleSection('behavioral')}
              >
                <div className="section-title">
                  <FaUsers className="section-icon behavioral" />
                  <span>Behavioral Preparation</span>
                </div>
                {expandedSections.behavioral ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedSections.behavioral && (
                <div className="section-content">
                  {preparation.behavioral_prep.company_values && preparation.behavioral_prep.company_values.length > 0 && (
                    <div className="values-section" style={{ marginBottom: '24px' }}>
                      <h4>Company Values/Principles:</h4>
                      {preparation.behavioral_prep.company_values.map((value, idx) => (
                        <div key={idx} className="value-card" style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                          <strong>{value.value}:</strong> {value.description}
                          {value.example_question && (
                            <p className="example-q" style={{ marginTop: '8px', fontStyle: 'italic', color: '#64748b' }}><em>Example: {value.example_question}</em></p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {preparation.behavioral_prep.stories_to_prepare && preparation.behavioral_prep.stories_to_prepare.length > 0 && (
                    <div className="stories-section" style={{ marginBottom: '24px' }}>
                      <h4>Stories to Prepare (STAR Format):</h4>
                      {preparation.behavioral_prep.stories_to_prepare.map((story, idx) => (
                        <div key={idx} className="story-card" style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                          <strong style={{ color: '#0f172a', fontSize: '1.05rem' }}>{story.story_type || story.type || `Story ${idx + 1}`}</strong>
                          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            {(story.example_questions || story.questions || []).map((q, i) => (
                              <li key={i} style={{ marginBottom: '4px' }}>{typeof q === 'string' ? q : q.question || JSON.stringify(q)}</li>
                            ))}
                          </ul>
                          {story.what_to_include && (
                            <p style={{ marginTop: '8px', fontStyle: 'italic', color: '#64748b' }}><em>💡 Include: {story.what_to_include}</em></p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {preparation.behavioral_prep.common_questions && preparation.behavioral_prep.common_questions.length > 0 && (
                    <div className="behavioral-questions" style={{ marginBottom: '24px' }}>
                      <h4>Common Behavioral Questions:</h4>
                      {preparation.behavioral_prep.common_questions.map((q, idx) => (
                        <div key={idx} className="behavioral-question-card" style={{ marginBottom: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                          <h5 style={{ marginBottom: '8px', color: '#0f172a' }}>{q.question}</h5>
                          {(q.what_they_look_for || q.time) && (
                            <p style={{ color: '#475569', marginBottom: '8px' }}>
                              <strong>What They Look For:</strong> {q.what_they_look_for || 'Your relevant experience and communication skills'}
                              {q.time && <span style={{ marginLeft: '12px', color: '#64748b' }}>⏱️ {q.time}</span>}
                            </p>
                          )}
                          {q.star_framework && (
                            <div className="star-framework" style={{ marginTop: '12px', padding: '12px', background: '#e0f2fe', borderRadius: '8px' }}>
                              <strong>STAR Framework:</strong>
                              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '4px' }}><strong>Situation:</strong> {q.star_framework.situation}</li>
                                <li style={{ marginBottom: '4px' }}><strong>Task:</strong> {q.star_framework.task}</li>
                                <li style={{ marginBottom: '4px' }}><strong>Action:</strong> {q.star_framework.action}</li>
                                <li style={{ marginBottom: '4px' }}><strong>Result:</strong> {q.star_framework.result}</li>
                              </ul>
                            </div>
                          )}
                          {q.tips && <p style={{ marginTop: '8px', color: '#0ea5e9' }}>💡 <strong>Tips:</strong> {q.tips}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {preparation.behavioral_prep.tips && preparation.behavioral_prep.tips.length > 0 && (
                    <div className="tips-section" style={{ marginTop: '24px', padding: '20px', background: '#fef3c7', borderRadius: '12px' }}>
                      <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaLightbulb /> Tips:
                      </h4>
                      <ul style={{ paddingLeft: '20px' }}>
                        {preparation.behavioral_prep.tips.map((tip, idx) => (
                          <li key={idx} style={{ marginBottom: '8px' }}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Common Questions Section */}
          <section className="prep-section">
            <button 
              className={`section-header ${expandedSections.common ? 'expanded' : ''}`}
              onClick={() => toggleSection('common')}
            >
              <div className="section-title">
                <FaQuestionCircle className="section-icon common" />
                <span>Common Interview Questions</span>
              </div>
              {expandedSections.common ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {expandedSections.common && (
              <div className="section-content">
                {preparation?.common_questions?.length > 0 ? (
                  <div className="common-questions-list">
                    {preparation.common_questions.map((q, idx) => (
                      <div key={idx} className="common-question-card">
                        <div className="cq-header">
                          <span className="cq-number">Q{idx + 1}</span>
                          <span className="cq-question">{q.question}</span>
                        </div>
                        <div className="cq-content">
                          {q.how_to_answer && (
                            <p><strong>How to Answer:</strong> {q.how_to_answer}</p>
                          )}
                          {q.sample_answer && (
                            <div className="sample-answer">
                              <strong>Sample Answer:</strong>
                              <p>{q.sample_answer}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Common questions not available.</p>
                )}
              </div>
            )}
          </section>


        </div>
      </div>
    </div>
  );
};

export default InterviewPrepPage;
