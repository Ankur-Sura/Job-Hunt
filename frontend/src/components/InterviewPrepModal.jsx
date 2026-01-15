import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaBuilding, FaBriefcase, FaUserCheck, FaQuestionCircle, FaLightbulb, FaCode, FaClipboardList, FaPrint, FaSpinner, FaCheckCircle, FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaSearch, FaGraduationCap } from 'react-icons/fa';
import './InterviewPrepModal.css';

const InterviewPrepModal = ({ isOpen, onClose, applicationId, job }) => {
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [preparation, setPreparation] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    company: true,
    role: true,
    match: false,
    questions: false,
    technical: false,
    tips: false
  });

  const steps = [
    { icon: FaSearch, label: 'Researching Company', desc: 'Searching web with Tavily...' },
    { icon: FaBriefcase, label: 'Analyzing Role', desc: 'Understanding job requirements...' },
    { icon: FaUserCheck, label: 'Matching Resume', desc: 'Finding your strengths & gaps...' },
    { icon: FaQuestionCircle, label: 'Generating Questions', desc: 'Preparing common questions...' },
    { icon: FaLightbulb, label: 'Preparing Answers', desc: 'Tailoring answers to your resume...' },
    { icon: FaCode, label: 'Technical Prep', desc: 'Generating technical questions...' },
    { icon: FaClipboardList, label: 'Building Guide', desc: 'Creating your complete guide...' }
  ];

  useEffect(() => {
    if (isOpen && applicationId) {
      fetchInterviewPrep();
    }
  }, [isOpen, applicationId]);

  // Simulate progress through steps
  useEffect(() => {
    if (loading && currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 3000); // Move to next step every 3 seconds
      return () => clearTimeout(timer);
    }
  }, [loading, currentStep]);

  const fetchInterviewPrep = async () => {
    setLoading(true);
    setCurrentStep(0);
    setError(null);
    
    try {
      const response = await axios.get(`/api/interview/prepare/${applicationId}`, {
        timeout: 300000 // 5 minutes for LangGraph processing
      });
      
      if (response.data.success) {
        setPreparation(response.data);
        setCurrentStep(steps.length); // Complete all steps
      } else {
        throw new Error(response.data.error || 'Failed to generate interview preparation');
      }
    } catch (err) {
      console.error('Interview prep error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load interview preparation');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const parseMarkdownContent = (content) => {
    if (!content) return '';
    
    // Convert markdown to HTML
    return content
      .replace(/^### (.*$)/gm, '<h3 class="prep-h3">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="prep-h2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="prep-h1">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="prep-code">$1</code>')
      .replace(/^- (.*$)/gm, '<li class="prep-li">$1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="prep-li-numbered"><span class="num">$1.</span> $2</li>')
      .replace(/\n\n/g, '</p><p class="prep-para">')
      .replace(/\n/g, '<br/>');
  };

  const extractSections = (content) => {
    if (!content) return {};
    
    const sections = {};
    const sectionRegex = /##\s*(\d+\.)?\s*(.+?)(?=##|$)/gs;
    let match;
    
    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionName = match[2].trim().toLowerCase();
      const sectionContent = match[0];
      
      if (sectionName.includes('company') || sectionName.includes('about')) {
        sections.company = sectionContent;
      } else if (sectionName.includes('role') || sectionName.includes('understanding')) {
        sections.role = sectionContent;
      } else if (sectionName.includes('match') || sectionName.includes('experience')) {
        sections.match = sectionContent;
      } else if (sectionName.includes('common') || sectionName.includes('interview question')) {
        sections.questions = sectionContent;
      } else if (sectionName.includes('technical')) {
        sections.technical = sectionContent;
      } else if (sectionName.includes('ask') || sectionName.includes('interviewer')) {
        sections.askQuestions = sectionContent;
      } else if (sectionName.includes('tips') || sectionName.includes('success')) {
        sections.tips = sectionContent;
      }
    }
    
    return sections;
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="interview-modal-overlay" onClick={onClose}>
      <div className="interview-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="interview-modal-header">
          <div className="interview-modal-title">
            <FaGraduationCap className="title-icon" />
            <div>
              <h2>Interview Preparation</h2>
              {job && (
                <p className="job-subtitle">
                  {job.title} at <span className="company-name">{job.company}</span>
                </p>
              )}
            </div>
          </div>
          <div className="header-actions">
            {!loading && preparation && (
              <button className="print-btn" onClick={handlePrint}>
                <FaPrint /> Print Guide
              </button>
            )}
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="interview-modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-header">
                <FaSpinner className="spinner-icon" />
                <h3>AI is preparing your interview guide...</h3>
                <p>Using LangGraph with Tavily Web Search</p>
              </div>
              
              <div className="steps-container">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === currentStep;
                  const isComplete = index < currentStep;
                  
                  return (
                    <div 
                      key={index} 
                      className={`step-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                    >
                      <div className="step-icon-container">
                        {isComplete ? (
                          <FaCheckCircle className="check-icon" />
                        ) : (
                          <StepIcon className={isActive ? 'pulse' : ''} />
                        )}
                      </div>
                      <div className="step-content">
                        <span className="step-label">{step.label}</span>
                        {isActive && <span className="step-desc">{step.desc}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="loading-tip">
                <FaLightbulb /> <span>This typically takes 1-2 minutes as we research the company and prepare personalized answers</span>
              </div>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">❌</div>
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchInterviewPrep}>
                Try Again
              </button>
            </div>
          ) : preparation ? (
            <div className="preparation-sections">
              {/* Company Info Section */}
              <div className="prep-section">
                <button 
                  className={`section-header ${expandedSections.company ? 'expanded' : ''}`}
                  onClick={() => toggleSection('company')}
                >
                  <div className="section-title">
                    <FaBuilding className="section-icon company" />
                    <span>About the Company</span>
                  </div>
                  {expandedSections.company ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.company && (
                  <div className="section-content">
                    {preparation.company_info ? (
                      <div dangerouslySetInnerHTML={{ __html: parseMarkdownContent(preparation.company_info) }} />
                    ) : (
                      <p className="no-content">Company information will be displayed here based on web research.</p>
                    )}
                    {job?.company && (
                      <a 
                        href={`https://www.google.com/search?q=${encodeURIComponent(job.company + ' company')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="learn-more-link"
                      >
                        <FaExternalLinkAlt /> Learn more about {job.company}
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Role Analysis Section */}
              <div className="prep-section">
                <button 
                  className={`section-header ${expandedSections.role ? 'expanded' : ''}`}
                  onClick={() => toggleSection('role')}
                >
                  <div className="section-title">
                    <FaBriefcase className="section-icon role" />
                    <span>Understanding the Role</span>
                  </div>
                  {expandedSections.role ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.role && (
                  <div className="section-content">
                    {preparation.role_analysis ? (
                      <div dangerouslySetInnerHTML={{ __html: parseMarkdownContent(preparation.role_analysis) }} />
                    ) : (
                      <div className="role-summary">
                        <div className="role-item">
                          <strong>Position:</strong> {job?.title || 'N/A'}
                        </div>
                        <div className="role-item">
                          <strong>Experience Required:</strong> {job?.experience?.display || 'Not specified'}
                        </div>
                        <div className="role-item">
                          <strong>Location:</strong> {job?.location || 'Not specified'}
                        </div>
                        <div className="role-item">
                          <strong>Key Skills:</strong>
                          <div className="skills-tags">
                            {job?.skills?.map((skill, idx) => (
                              <span key={idx} className="skill-tag">{skill}</span>
                            )) || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resume Match Section */}
              <div className="prep-section">
                <button 
                  className={`section-header ${expandedSections.match ? 'expanded' : ''}`}
                  onClick={() => toggleSection('match')}
                >
                  <div className="section-title">
                    <FaUserCheck className="section-icon match" />
                    <span>How Your Experience Matches</span>
                    {preparation.fitScore && (
                      <span className={`fit-badge ${preparation.fitScore >= 70 ? 'good' : preparation.fitScore >= 50 ? 'moderate' : 'low'}`}>
                        {preparation.fitScore}% Match
                      </span>
                    )}
                  </div>
                  {expandedSections.match ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.match && (
                  <div className="section-content">
                    {preparation.fitDetails && (
                      <div className="fit-breakdown">
                        <div className="breakdown-item">
                          <span className="breakdown-label">Skills Match</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill skills" 
                              style={{ width: `${preparation.fitDetails.breakdown?.skillsMatch || 0}%` }}
                            />
                          </div>
                          <span className="breakdown-value">{preparation.fitDetails.breakdown?.skillsMatch || 0}%</span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Experience Match</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill experience" 
                              style={{ width: `${preparation.fitDetails.breakdown?.experienceMatch || 0}%` }}
                            />
                          </div>
                          <span className="breakdown-value">{preparation.fitDetails.breakdown?.experienceMatch || 0}%</span>
                        </div>
                        <div className="breakdown-item">
                          <span className="breakdown-label">Education Match</span>
                          <div className="breakdown-bar">
                            <div 
                              className="breakdown-fill education" 
                              style={{ width: `${preparation.fitDetails.breakdown?.educationMatch || 0}%` }}
                            />
                          </div>
                          <span className="breakdown-value">{preparation.fitDetails.breakdown?.educationMatch || 0}%</span>
                        </div>
                      </div>
                    )}
                    
                    {preparation.fitDetails?.strengths?.length > 0 && (
                      <div className="match-section strengths">
                        <h4>✅ Your Strengths</h4>
                        <ul>
                          {preparation.fitDetails.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {preparation.fitDetails?.gaps?.length > 0 && (
                      <div className="match-section gaps">
                        <h4>⚠️ Areas to Address</h4>
                        <ul>
                          {preparation.fitDetails.gaps.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Interview Questions Section */}
              <div className="prep-section">
                <button 
                  className={`section-header ${expandedSections.questions ? 'expanded' : ''}`}
                  onClick={() => toggleSection('questions')}
                >
                  <div className="section-title">
                    <FaQuestionCircle className="section-icon questions" />
                    <span>Common Interview Questions & Answers</span>
                  </div>
                  {expandedSections.questions ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.questions && (
                  <div className="section-content">
                    {preparation.preparation ? (
                      <div 
                        className="full-guide-content"
                        dangerouslySetInnerHTML={{ 
                          __html: parseMarkdownContent(
                            extractSections(preparation.preparation).questions || 
                            preparation.preparation
                          ) 
                        }} 
                      />
                    ) : (
                      <p className="no-content">Interview questions and answers will appear here.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Technical Questions Section */}
              <div className="prep-section">
                <button 
                  className={`section-header ${expandedSections.technical ? 'expanded' : ''}`}
                  onClick={() => toggleSection('technical')}
                >
                  <div className="section-title">
                    <FaCode className="section-icon technical" />
                    <span>Technical Questions & Preparation</span>
                  </div>
                  {expandedSections.technical ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.technical && (
                  <div className="section-content">
                    {preparation.preparation ? (
                      <div 
                        className="full-guide-content"
                        dangerouslySetInnerHTML={{ 
                          __html: parseMarkdownContent(
                            extractSections(preparation.preparation).technical || 
                            'Technical questions based on required skills will appear here.'
                          ) 
                        }} 
                      />
                    ) : (
                      <p className="no-content">Technical questions will appear here.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Tips for Success Section */}
              <div className="prep-section">
                <button 
                  className={`section-header ${expandedSections.tips ? 'expanded' : ''}`}
                  onClick={() => toggleSection('tips')}
                >
                  <div className="section-title">
                    <FaLightbulb className="section-icon tips" />
                    <span>Tips for Success</span>
                  </div>
                  {expandedSections.tips ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.tips && (
                  <div className="section-content">
                    {preparation.preparation ? (
                      <div 
                        className="full-guide-content"
                        dangerouslySetInnerHTML={{ 
                          __html: parseMarkdownContent(
                            extractSections(preparation.preparation).tips || 
                            extractSections(preparation.preparation).askQuestions ||
                            'Success tips and questions to ask will appear here.'
                          ) 
                        }} 
                      />
                    ) : (
                      <div className="default-tips">
                        <h4>General Interview Tips</h4>
                        <ul>
                          <li>Research the company thoroughly before the interview</li>
                          <li>Prepare specific examples from your experience</li>
                          <li>Practice the STAR method for behavioral questions</li>
                          <li>Prepare thoughtful questions to ask the interviewer</li>
                          <li>Be punctual and dress professionally</li>
                          <li>Follow up with a thank you email after the interview</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Full Guide - Collapsible */}
              {preparation.preparation && (
                <div className="prep-section full-guide-section">
                  <details className="full-guide-details">
                    <summary className="full-guide-summary">
                      <FaClipboardList className="section-icon" />
                      <span>View Complete Interview Guide</span>
                    </summary>
                    <div 
                      className="full-guide-content"
                      dangerouslySetInnerHTML={{ __html: parseMarkdownContent(preparation.preparation) }}
                    />
                  </details>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default InterviewPrepModal;

