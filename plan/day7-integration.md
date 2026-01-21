# 📅 Day 7: Full Integration & Polish

**Duration:** 6-8 hours  
**Goal:** Connect all components, test complete flows, and prepare for deployment

---

## 🎯 What You'll Accomplish Today

By the end of Day 7, you will have:
- ✅ Complete user flow working (register → upload → apply → interview prep)
- ✅ Recruiter dashboard with AI features
- ✅ All frontend pages polished
- ✅ End-to-end testing completed
- ✅ Project ready for deployment

---

## 📚 Table of Contents

1. [Integration Overview](#1-integration-overview)
2. [Building the User Dashboard](#2-building-the-user-dashboard)
3. [Building the Jobs Page](#3-building-the-jobs-page)
4. [Creating Interview Prep Page](#4-creating-interview-prep-page)
5. [Building Recruiter Dashboard](#5-building-recruiter-dashboard)
6. [Complete User Flow Testing](#6-complete-user-flow-testing)
7. [Error Handling & Polish](#7-error-handling--polish)
8. [Performance Optimization](#8-performance-optimization)
9. [Deployment Preparation](#9-deployment-preparation)
10. [Final Testing Checklist](#10-final-testing-checklist)

---

## 1. Integration Overview

### 🔄 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐   │
│  │ Landing │ │  Login  │ │Dashboard│ │  Jobs   │ │ Interview Prep  │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Recruiter Dashboard                           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │    │
│  │  │ My Jobs  │ │Applicants│ │ATS Scores│ │ AI Recommendations│   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Auth   │ │  Resume  │ │   Jobs   │ │  Apply   │ │Interview │      │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Background Jobs                               │   │
│  │  • Calculate fit scores • Update caches • Process uploads        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│      AI SERVICE (Python)        │  │         MONGODB                 │
│  • Resume Parsing               │  │  • Users                        │
│  • Fit Scores                   │  │  • Jobs                         │
│  • Interview Prep (LangGraph)   │  │  • Applications                 │
│  • ATS Analysis                 │  │  • UserJobMatch (cache)         │
│  • Hiring Recommendations       │  │  • Companies                    │
└─────────────────────────────────┘  └─────────────────────────────────┘
```

---

## 2. Building the User Dashboard

### 2.1 Create Dashboard Page

Create `frontend/src/pages/Dashboard.jsx`:

```jsx
// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '../axios';
import Header from '../components/Header';
import { 
  FaCloudUploadAlt, 
  FaBriefcase, 
  FaFileAlt, 
  FaChartLine,
  FaArrowRight
} from 'react-icons/fa';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [recommendations, setRecommendations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCached: 0, totalJobs: 0 });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      // Fetch recommendations
      const recResponse = await axios.get('/api/recommendations');
      setRecommendations(recResponse.data.recommendations || []);
      setStats({
        totalCached: recResponse.data.totalCached || 0,
        totalJobs: recResponse.data.totalJobs || 0
      });
      
      // Fetch applications
      const appResponse = await axios.get('/api/applications/my');
      setApplications(appResponse.data || []);
      
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getScoreBadge = (score) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-600';
    if (score >= 60) return 'bg-yellow-100 text-yellow-600';
    if (score >= 40) return 'bg-orange-100 text-orange-600';
    return 'bg-red-100 text-red-600';
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.resumeData 
              ? "Here are your personalized job recommendations"
              : "Upload your resume to get AI-powered job matches"}
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <FaFileAlt className="text-teal-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Resume</p>
                <p className="text-xl font-bold text-gray-800">
                  {user?.resumeData ? 'Uploaded' : 'Not Uploaded'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaBriefcase className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Applications</p>
                <p className="text-xl font-bold text-gray-800">{applications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">AI Scores Ready</p>
                <p className="text-xl font-bold text-gray-800">
                  {stats.totalCached}/{stats.totalJobs}
                </p>
              </div>
            </div>
          </div>
          
          <Link to="/jobs" className="bg-teal-600 rounded-xl p-6 shadow-sm hover:bg-teal-700 transition-colors">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-teal-100 text-sm">Browse All</p>
                <p className="text-xl font-bold">Jobs</p>
              </div>
              <FaArrowRight className="text-2xl" />
            </div>
          </Link>
        </div>
        
        {/* Resume Upload Section (if no resume) */}
        {!user?.resumeData && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 text-center">
            <FaCloudUploadAlt className="text-6xl text-teal-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Upload Your Resume
            </h2>
            <p className="text-gray-600 mb-6">
              Get personalized job recommendations and AI match scores
            </p>
            <Link 
              to="/profile"
              className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Upload Resume
            </Link>
          </div>
        )}
        
        {/* Recommendations Section */}
        {user?.resumeData && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Recommended For You
              </h2>
              <Link to="/jobs" className="text-teal-600 hover:text-teal-700">
                View All Jobs →
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-8">Loading recommendations...</div>
            ) : recommendations.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.slice(0, 6).map((job) => (
                  <div 
                    key={job._id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{job.title}</h3>
                        <p className="text-gray-600">{job.company}</p>
                      </div>
                      {job.fitScore && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBadge(job.fitScore)}`}>
                          {job.fitScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm mb-4">{job.location}</p>
                    <Link 
                      to={`/jobs/${job._id}`}
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No recommendations yet. AI is calculating your matches...
              </div>
            )}
          </div>
        )}
        
        {/* Recent Applications */}
        {applications.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Recent Applications
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-600">Job</th>
                    <th className="px-6 py-3 text-left text-gray-600">Company</th>
                    <th className="px-6 py-3 text-left text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-gray-600">Applied</th>
                    <th className="px-6 py-3 text-left text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 5).map((app) => (
                    <tr key={app._id} className="border-t border-gray-100">
                      <td className="px-6 py-4">{app.jobId?.title}</td>
                      <td className="px-6 py-4">{app.jobId?.company}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          app.status === 'shortlisted' ? 'bg-green-100 text-green-700' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => navigate(`/interview-prep/${app._id}`)}
                          className="text-teal-600 hover:text-teal-700"
                        >
                          Interview Prep
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default Dashboard;
```

---

## 3. Building the Jobs Page

### 3.1 Create Jobs Page

Create `frontend/src/pages/Jobs.jsx`:

```jsx
// frontend/src/pages/Jobs.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from '../axios';
import Header from '../components/Header';
import AIMatchModal from '../components/AIMatchModal';
import { FaSearch, FaMapMarkerAlt, FaBriefcase, FaClock } from 'react-icons/fa';

const JOBS_PER_PAGE = 6;

function Jobs() {
  const { user } = useSelector((state) => state.auth);
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('Jobs');
  
  // AI Match Modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: JOBS_PER_PAGE,
        jobType: activeTab === 'Internships' ? 'Internship' : 'Job',
        search: searchQuery || undefined
      };
      
      let response;
      if (user?.resumeId) {
        response = await axios.get('/api/jobs/recommended/list', { params });
      } else {
        response = await axios.get('/api/jobs', { params });
      }
      
      setJobs(response.data?.jobs || response.data || []);
      setTotalPages(response.data?.pagination?.pages || 1);
      
    } catch (error) {
      console.error('Fetch jobs error:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, searchQuery, user?.resumeId]);
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };
  
  const getScoreColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-600';
    if (score >= 60) return 'bg-yellow-100 text-yellow-600';
    if (score >= 40) return 'bg-orange-100 text-orange-600';
    return 'bg-red-100 text-red-600';
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Search Section */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for opportunities, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="ml-4 px-6 py-4 bg-teal-600 text-white rounded-full font-medium hover:bg-teal-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['Jobs', 'Internships'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Jobs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading jobs...</p>
          </div>
        ) : jobs.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all"
                >
                  {/* Job Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                          <FaBriefcase className="text-teal-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800">{job.title}</h3>
                        <p className="text-gray-600 text-sm">{job.company}</p>
                      </div>
                    </div>
                    {job.fitScore && (
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setSelectedMatch({
                            fitScore: job.fitScore,
                            breakdown: job.breakdown,
                            recommendation: job.recommendation
                          });
                          setShowMatchModal(true);
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(job.fitScore)} hover:opacity-80 transition-opacity`}
                      >
                        {job.fitScore}% Match
                      </button>
                    )}
                  </div>
                  
                  {/* Job Details */}
                  <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaClock /> {job.jobType}
                    </span>
                  </div>
                  
                  {/* Skills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.skills?.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="flex-1 text-center py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                    >
                      View & Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs found. Try a different search.</p>
          </div>
        )}
        
      </div>
      
      {/* AI Match Modal */}
      <AIMatchModal
        isOpen={showMatchModal}
        onClose={() => setShowMatchModal(false)}
        matchData={selectedMatch}
        job={selectedJob}
      />
    </div>
  );
}

export default Jobs;
```

---

## 4. Creating Interview Prep Page

### 4.1 Create Interview Prep Page

Create `frontend/src/pages/InterviewPrepPage.jsx`:

```jsx
// frontend/src/pages/InterviewPrepPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../axios';
import Header from '../components/Header';
import { 
  FaBuilding, FaCode, FaUsers, FaCogs, FaQuestionCircle,
  FaExternalLinkAlt, FaSpinner, FaChevronDown, FaChevronUp
} from 'react-icons/fa';

function InterviewPrepPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    company: true,
    dsa: false,
    behavioral: false,
    systemDesign: false,
    questions: false
  });
  
  useEffect(() => {
    if (!applicationId) {
      setError('Invalid application ID');
      setLoading(false);
      return;
    }
    fetchInterviewPrep();
  }, [applicationId]);
  
  const fetchInterviewPrep = async () => {
    try {
      const response = await axios.get(`/api/interview/prepare/${applicationId}`, {
        timeout: 120000 // 2 minute timeout
      });
      setPrepData(response.data);
    } catch (err) {
      console.error('Interview prep error:', err);
      setError(err.response?.data?.error || 'Failed to generate interview prep');
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-20">
          <FaSpinner className="text-4xl text-teal-600 animate-spin mb-4" />
          <h2 className="text-xl text-gray-700">Generating your personalized interview prep...</h2>
          <p className="text-gray-500 mt-2">This may take up to 2 minutes</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Interview Preparation
        </h1>
        <p className="text-gray-600 mb-8">
          Personalized guidance for {prepData?.job?.title} at {prepData?.job?.company}
        </p>
        
        {/* Company Section */}
        <Section
          title="Company Overview"
          icon={<FaBuilding />}
          isExpanded={expandedSections.company}
          onToggle={() => toggleSection('company')}
        >
          <p className="text-gray-700 whitespace-pre-line">
            {prepData?.company_info || 'Company information not available'}
          </p>
          
          {prepData?.interview_links?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Interview Resources</h4>
              <div className="space-y-2">
                {prepData.interview_links.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
                  >
                    <FaExternalLinkAlt className="text-sm" />
                    {new URL(link).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}
        </Section>
        
        {/* DSA Section */}
        <Section
          title="DSA Preparation"
          icon={<FaCode />}
          isExpanded={expandedSections.dsa}
          onToggle={() => toggleSection('dsa')}
        >
          {prepData?.dsa_prep?.must_know_topics && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Must-Know Topics</h4>
              <div className="flex flex-wrap gap-2">
                {prepData.dsa_prep.must_know_topics.map((topic, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {typeof topic === 'object' ? topic.topic : topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {prepData?.dsa_prep?.top_15_questions && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Top 15 Questions</h4>
              <div className="space-y-2">
                {prepData.dsa_prep.top_15_questions.map((q, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-gray-800">{q.title}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${
                        q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    {q.link && (
                      <a href={q.link} target="_blank" rel="noopener noreferrer" className="text-teal-600">
                        <FaExternalLinkAlt />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
        
        {/* Behavioral Section */}
        <Section
          title="Behavioral Preparation"
          icon={<FaUsers />}
          isExpanded={expandedSections.behavioral}
          onToggle={() => toggleSection('behavioral')}
        >
          {prepData?.behavioral_prep?.stories_to_prepare && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Stories to Prepare</h4>
              <div className="space-y-3">
                {prepData.behavioral_prep.stories_to_prepare.map((story, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-800">{story.type}</h5>
                    <p className="text-gray-600 text-sm mt-1">{story.example_question}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {prepData?.behavioral_prep?.star_format_tips && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">STAR Format Tips</h4>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {prepData.behavioral_prep.star_format_tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
        
        {/* System Design Section */}
        <Section
          title="System Design"
          icon={<FaCogs />}
          isExpanded={expandedSections.systemDesign}
          onToggle={() => toggleSection('systemDesign')}
        >
          {prepData?.system_design_prep?.sde1_guidance ? (
            <div className="space-y-4">
              <p className="text-gray-700">{prepData.system_design_prep.sde1_guidance.introduction}</p>
              
              {prepData.system_design_prep.sde1_guidance.what_to_know && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">What to Know</h4>
                  <ul className="list-disc list-inside text-gray-700">
                    {prepData.system_design_prep.sde1_guidance.what_to_know.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {prepData?.system_design_prep?.concepts_to_know && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Concepts to Know</h4>
                  <div className="flex flex-wrap gap-2">
                    {prepData.system_design_prep.concepts_to_know.map((concept, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Section>
        
        {/* Common Questions */}
        <Section
          title="Common Interview Questions"
          icon={<FaQuestionCircle />}
          isExpanded={expandedSections.questions}
          onToggle={() => toggleSection('questions')}
        >
          <div className="space-y-4">
            {prepData?.common_questions?.map((q, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">{q.question}</h4>
                {q.what_they_look_for && (
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">What they look for:</span> {q.what_they_look_for}
                  </p>
                )}
                {q.tips && (
                  <p className="text-teal-600 text-sm mt-1">
                    <span className="font-medium">Tip:</span> {q.tips}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
        
      </div>
    </div>
  );
}

// Collapsible Section Component
function Section({ title, icon, isExpanded, onToggle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-teal-600 text-xl">{icon}</span>
          <span className="text-lg font-semibold text-gray-800">{title}</span>
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
}

export default InterviewPrepPage;
```

---

## 5. Building Recruiter Dashboard

### 5.1 Create Recruiter Dashboard

Create `frontend/src/pages/recruiter/RecruiterDashboard.jsx`:

```jsx
// frontend/src/pages/recruiter/RecruiterDashboard.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../axios';
import Header from '../../components/Header';
import { 
  FaBriefcase, FaUsers, FaChartBar, FaPlus,
  FaEye, FaRobot
} from 'react-icons/fa';

function RecruiterDashboard() {
  const { user } = useSelector((state) => state.auth);
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    pendingReviews: 0
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      const response = await axios.get('/api/jobs/my/list');
      setJobs(response.data || []);
      
      // Calculate stats
      const totalApps = response.data.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);
      setStats({
        totalJobs: response.data.length,
        totalApplications: totalApps,
        pendingReviews: totalApps // Simplified
      });
      
    } catch (error) {
      console.error('Fetch recruiter data error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Welcome */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Recruiter Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>
          <button className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">
            <FaPlus /> Post New Job
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={<FaBriefcase />}
            label="Active Jobs"
            value={stats.totalJobs}
            color="teal"
          />
          <StatCard 
            icon={<FaUsers />}
            label="Total Applications"
            value={stats.totalApplications}
            color="blue"
          />
          <StatCard 
            icon={<FaChartBar />}
            label="Pending Reviews"
            value={stats.pendingReviews}
            color="orange"
          />
        </div>
        
        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Your Job Postings</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : jobs.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600">Job Title</th>
                  <th className="px-6 py-3 text-left text-gray-600">Applications</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600">Posted</th>
                  <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{job.title}</p>
                        <p className="text-gray-500 text-sm">{job.location}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{job.applicationsCount || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        job.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-teal-600 hover:bg-teal-50 rounded">
                          <FaEye />
                        </button>
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded">
                          <FaRobot title="AI Analysis" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No jobs posted yet. Click "Post New Job" to get started.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    teal: 'bg-teal-100 text-teal-600',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600'
  };
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-600 text-sm">{label}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default RecruiterDashboard;
```

---

## 6. Complete User Flow Testing

### 6.1 Update App.jsx with All Routes

```jsx
// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/authSlice';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import InterviewPrepPage from './pages/InterviewPrepPage';
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, token } = useSelector((state) => state.auth);
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function App() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/jobs" element={
          <ProtectedRoute>
            <Jobs />
          </ProtectedRoute>
        } />
        <Route path="/interview-prep/:applicationId" element={
          <ProtectedRoute>
            <InterviewPrepPage />
          </ProtectedRoute>
        } />
        
        {/* Recruiter Routes */}
        <Route path="/recruiter/dashboard" element={
          <ProtectedRoute requiredRole="hirer">
            <RecruiterDashboard />
          </ProtectedRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-2xl text-gray-600">Page Not Found</h1>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 7. Error Handling & Polish

### 7.1 Create Toast Notifications

```jsx
// frontend/src/main.jsx
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Add inside the root render:
<ToastContainer position="top-right" autoClose={3000} />
```

### 7.2 Global Error Handling

Update `frontend/src/axios.js`:

```jsx
import { toast } from 'react-toastify';

// In the error interceptor:
if (error.response?.status === 500) {
  toast.error('Server error. Please try again later.');
}
```

---

## 8. Performance Optimization

### 8.1 Key Optimizations

1. **Lazy Loading Pages**
```jsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Jobs = lazy(() => import('./pages/Jobs'));

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Dashboard />
</Suspense>
```

2. **Memoize Components**
```jsx
import { memo } from 'react';
const JobCard = memo(function JobCard({ job }) { ... });
```

3. **Use React Query for Caching** (optional)

---

## 9. Deployment Preparation

### 9.1 Environment Variables Checklist

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-api-domain.com/api
```

**Backend (.env.production):**
```env
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=super-secure-random-key
AI_SERVICE_URL=https://your-ai-service.com
NODE_ENV=production
```

**AI Service (.env.production):**
```env
PORT=8001
OPENAI_API_KEY=sk-xxx
TAVILY_API_KEY=tvly-xxx
QDRANT_URL=https://xxx.cloud.qdrant.io
QDRANT_API_KEY=xxx
```

### 9.2 Build Commands

```bash
# Frontend
cd frontend && npm run build

# Backend (no build needed, just deploy)

# AI Service (no build needed, just deploy)
```

---

## 10. Final Testing Checklist

### 10.1 User Flow Tests

| Test | Steps | Status |
|------|-------|--------|
| Register | Create new account | ⬜ |
| Login | Login with credentials | ⬜ |
| Upload Resume | Upload PDF, see parsed data | ⬜ |
| View Recommendations | See AI-scored jobs | ⬜ |
| Apply to Job | Submit application | ⬜ |
| Interview Prep | View prep for application | ⬜ |

### 10.2 Recruiter Flow Tests

| Test | Steps | Status |
|------|-------|--------|
| Register as Recruiter | Create hirer account | ⬜ |
| Post Job | Create new job listing | ⬜ |
| View Applications | See applicants | ⬜ |
| View ATS Scores | See AI analysis | ⬜ |
| Update Status | Change application status | ⬜ |

### 10.3 AI Feature Tests

| Feature | Test | Status |
|---------|------|--------|
| Resume Parsing | Upload returns parsed data | ⬜ |
| Fit Scores | Jobs show match % | ⬜ |
| Interview Prep | Generates DSA, behavioral, etc. | ⬜ |
| ATS Analysis | Returns suggestions | ⬜ |
| Hiring Recommendations | Generates insights | ⬜ |

---

## 🎉 Day 7 Complete!

Congratulations! You have successfully:
- ✅ Built complete user dashboard
- ✅ Created jobs page with AI scores
- ✅ Implemented interview prep page
- ✅ Built recruiter dashboard
- ✅ Tested all user flows
- ✅ Prepared for deployment

---

## 🚀 What's Next?

Now that you've completed the 7-day plan:

1. **Deploy your application** to cloud services
2. **Add more features** (profile page, notifications, etc.)
3. **Improve UI/UX** based on user feedback
4. **Scale the system** for more users

---

## 📚 Additional Learning Resources

- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [MongoDB University](https://university.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Congratulations on completing the Job Portal Project!** 🎊

