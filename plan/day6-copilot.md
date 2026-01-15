# 📅 Day 6: AI Copilot Features

**Duration:** 6-8 hours  
**Goal:** Build AI-powered job matching, fit scores, and recruiter tools

---

## 🎯 What You'll Accomplish Today

By the end of Day 6, you will have:
- ✅ AI fit score calculation system
- ✅ Batch processing for job recommendations
- ✅ Score caching for performance
- ✅ Recruiter ATS analysis
- ✅ AI hiring recommendations

---

## 📚 Table of Contents

1. [Understanding Fit Scores](#1-understanding-fit-scores)
2. [Building the Fit Score Calculator](#2-building-the-fit-score-calculator)
3. [Creating Batch Processing](#3-creating-batch-processing)
4. [Implementing Score Caching](#4-implementing-score-caching)
5. [Building Recommendations API](#5-building-recommendations-api)
6. [ATS Score Analysis](#6-ats-score-analysis)
7. [Recruiter AI Recommendations](#7-recruiter-ai-recommendations)
8. [Background Jobs](#8-background-jobs)
9. [Frontend Integration](#9-frontend-integration)
10. [Testing the Copilot](#10-testing-the-copilot)

---

## 1. Understanding Fit Scores

### 📊 What is a Fit Score?

A fit score (0-100%) measures how well a candidate matches a job, based on:

| Factor | Weight | What We Compare |
|--------|--------|-----------------|
| **Skills Match** | 40% | Resume skills vs job requirements |
| **Experience Match** | 30% | Years + relevance of experience |
| **Education Match** | 15% | Degree level and field |
| **Overall Fit** | 15% | Location, culture, role alignment |

### 🔄 The Scoring Process

```
Resume Data + Job Data → AI Analysis → Breakdown Scores → Overall Score
                                           ↓
                                    Cache in MongoDB
```

### 🎯 Score Interpretation

| Score | Meaning | UI Display |
|-------|---------|------------|
| 80-100 | Excellent Match | 🟢 Green |
| 60-79 | Good Match | 🟡 Yellow |
| 40-59 | Moderate Match | 🟠 Orange |
| 0-39 | Poor Match | 🔴 Red |

---

## 2. Building the Fit Score Calculator

### 2.1 Create Fast Fit Score Service

Create `AI/fast_fit_score.py`:

```python
"""
Fast Fit Score Calculator
Calculates fit scores between resumes and jobs in batches
"""

import os
import json
from typing import Dict, Any, List, Optional
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ============================================
# RESUME SUMMARY CREATOR
# ============================================

def create_resume_summary(resume_data: Dict) -> str:
    """
    Create a concise summary of resume for scoring
    """
    summary_parts = []
    
    # Name and contact
    name = resume_data.get("name", "Unknown")
    summary_parts.append(f"Candidate: {name}")
    
    # Skills
    skills = resume_data.get("skills", [])
    if skills:
        summary_parts.append(f"Skills: {', '.join(skills[:15])}")
    
    # Experience
    exp = resume_data.get("experience", [])
    if isinstance(exp, list) and len(exp) > 0:
        total_years = resume_data.get("total_experience_years", 0)
        summary_parts.append(f"Experience: {total_years} years")
        for e in exp[:3]:
            if isinstance(e, dict):
                title = e.get("title", "")
                company = e.get("company", "")
                domain = e.get("domain", "Unknown")
                summary_parts.append(f"  - {title} at {company} [Domain: {domain}]")
    else:
        summary_parts.append("Experience: No professional work experience")
    
    # Education
    edu = resume_data.get("education", [])
    if isinstance(edu, list) and len(edu) > 0:
        for e in edu[:2]:
            if isinstance(e, dict):
                degree = e.get("degree", "")
                institution = e.get("institution", "")
                summary_parts.append(f"Education: {degree} from {institution}")
    
    # Projects
    projects = resume_data.get("projects", [])
    if projects:
        summary_parts.append(f"Projects: {len(projects)} projects listed")
    
    return "\n".join(summary_parts)

# ============================================
# JOB SUMMARY CREATOR
# ============================================

def create_job_summary(job_data: Dict) -> str:
    """
    Create a concise summary of job for scoring
    """
    summary_parts = []
    
    title = job_data.get("title", "Unknown Position")
    company = job_data.get("company", "Unknown Company")
    summary_parts.append(f"Position: {title} at {company}")
    
    # Experience requirement
    exp_min = job_data.get("experienceMin", 0)
    exp_max = job_data.get("experienceMax")
    if exp_max:
        summary_parts.append(f"Experience Required: {exp_min}-{exp_max} years")
    else:
        summary_parts.append(f"Experience Required: {exp_min}+ years")
    
    # Skills
    skills = job_data.get("skills", [])
    if skills:
        summary_parts.append(f"Required Skills: {', '.join(skills[:10])}")
    
    # Description summary
    desc = job_data.get("description", "")
    if desc:
        summary_parts.append(f"Description: {desc[:300]}...")
    
    # Location
    location = job_data.get("location", "")
    if location:
        summary_parts.append(f"Location: {location}")
    
    return "\n".join(summary_parts)

# ============================================
# SINGLE FIT SCORE CALCULATOR
# ============================================

def calculate_single_fit_score(
    resume_data: Dict[str, Any],
    job_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate fit score for a single resume-job pair
    
    Returns:
        {
            "overall_score": 75,
            "breakdown": {
                "skills_match": 80,
                "experience_match": 70,
                "education_match": 75,
                "overall_fit": 75
            },
            "recommendation": "Good Match - Consider applying"
        }
    """
    try:
        resume_summary = create_resume_summary(resume_data)
        job_summary = create_job_summary(job_data)
        
        prompt = f"""
        Analyze the fit between this candidate and job position.
        
        CANDIDATE PROFILE:
        {resume_summary}
        
        JOB REQUIREMENTS:
        {job_summary}
        
        SCORING RULES:
        1. Skills Match (40%): How many required skills does the candidate have?
        2. Experience Match (30%):
           - If candidate has relevant work experience in the SAME FIELD: Score based on years
           - If candidate has NO work experience (only projects): Max 40-60% for entry-level
           - If candidate's experience is in a DIFFERENT FIELD (non-IT for IT job): Max 0-20%
        3. Education Match (15%): Relevant degree and institution
        4. Overall Fit (15%): Location, career trajectory, growth potential
        
        Return ONLY this JSON:
        {{
            "skills_match": <0-100>,
            "experience_match": <0-100>,
            "education_match": <0-100>,
            "overall_fit": <0-100>,
            "overall_score": <weighted average>,
            "recommendation": "<one line recommendation>"
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a precise job matching AI. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        
        return {
            "overall_score": result.get("overall_score", 50),
            "breakdown": {
                "skills_match": result.get("skills_match", 50),
                "experience_match": result.get("experience_match", 50),
                "education_match": result.get("education_match", 50),
                "overall_fit": result.get("overall_fit", 50)
            },
            "recommendation": result.get("recommendation", "Match calculated")
        }
        
    except Exception as e:
        print(f"Fit score error: {e}")
        return {
            "overall_score": 50,
            "breakdown": {
                "skills_match": 50,
                "experience_match": 50,
                "education_match": 50,
                "overall_fit": 50
            },
            "recommendation": "Unable to calculate detailed match"
        }

# ============================================
# BATCH FIT SCORE CALCULATOR
# ============================================

def calculate_batch_fit_scores(
    resume_data: Dict[str, Any],
    jobs: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Calculate fit scores for multiple jobs in one API call
    
    More efficient than calling one-by-one
    """
    if not jobs:
        return []
    
    try:
        resume_summary = create_resume_summary(resume_data)
        
        # Create job summaries
        job_summaries = []
        for i, job in enumerate(jobs[:10]):  # Max 10 at a time
            job_summary = create_job_summary(job)
            job_summaries.append(f"JOB {i+1}:\n{job_summary}")
        
        all_jobs = "\n\n".join(job_summaries)
        
        prompt = f"""
        Score how well this candidate matches each job.
        
        CANDIDATE:
        {resume_summary}
        
        JOBS TO SCORE:
        {all_jobs}
        
        SCORING:
        - skills_match (40%): Required skills the candidate has
        - experience_match (30%): Years and relevance of experience
        - education_match (15%): Degree alignment
        - overall_fit (15%): Overall suitability
        
        Return JSON array:
        {{
            "scores": [
                {{
                    "job_index": 1,
                    "skills_match": 80,
                    "experience_match": 70,
                    "education_match": 75,
                    "overall_fit": 75,
                    "overall_score": 75,
                    "recommendation": "Good Match"
                }}
            ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a job matching AI. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        scores = result.get("scores", [])
        
        # Map scores back to jobs
        scored_jobs = []
        for i, job in enumerate(jobs[:10]):
            job_score = next(
                (s for s in scores if s.get("job_index") == i + 1),
                None
            )
            
            if job_score:
                scored_jobs.append({
                    "job_id": str(job.get("_id", job.get("id", i))),
                    "overall_score": job_score.get("overall_score", 50),
                    "breakdown": {
                        "skills_match": job_score.get("skills_match", 50),
                        "experience_match": job_score.get("experience_match", 50),
                        "education_match": job_score.get("education_match", 50),
                        "overall_fit": job_score.get("overall_fit", 50)
                    },
                    "recommendation": job_score.get("recommendation", "")
                })
            else:
                scored_jobs.append({
                    "job_id": str(job.get("_id", job.get("id", i))),
                    "overall_score": 50,
                    "breakdown": {
                        "skills_match": 50,
                        "experience_match": 50,
                        "education_match": 50,
                        "overall_fit": 50
                    },
                    "recommendation": "Score not calculated"
                })
        
        return scored_jobs
        
    except Exception as e:
        print(f"Batch scoring error: {e}")
        return [{
            "job_id": str(job.get("_id", job.get("id", i))),
            "overall_score": 50,
            "breakdown": {},
            "recommendation": "Error calculating score"
        } for i, job in enumerate(jobs[:10])]
```

---

## 3. Creating Batch Processing

### 3.1 Add Batch Endpoint to AI Service

Update `AI/main.py` to add batch scoring:

```python
# Add this request model
class BatchFitScoreRequest(BaseModel):
    resume_data: Dict[str, Any]
    jobs: List[Dict[str, Any]]

# Add this import
from fast_fit_score import calculate_single_fit_score, calculate_batch_fit_scores

# Add these endpoints
@app.post("/calculate-fit-score")
async def single_fit_score_endpoint(request: FitScoreRequest):
    """Calculate fit score for a single job"""
    try:
        result = calculate_single_fit_score(
            request.resume_data,
            request.job_data
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/calculate-batch-fit-scores")
async def batch_fit_scores_endpoint(request: BatchFitScoreRequest):
    """Calculate fit scores for multiple jobs at once"""
    try:
        results = calculate_batch_fit_scores(
            request.resume_data,
            request.jobs
        )
        return {"scores": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 4. Implementing Score Caching

### 4.1 Update Backend AI Service

Update `backend/services/aiService.js`:

```javascript
// backend/services/aiService.js
const axios = require('axios');
const UserJobMatch = require('../models/UserJobMatch');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Calculate fit score with caching
 */
async function calculateFitScore(userId, resumeData, job) {
  try {
    // Check cache first
    const cached = await UserJobMatch.findOne({
      userId,
      jobId: job._id
    });
    
    if (cached) {
      return {
        fitScore: cached.fitScore,
        breakdown: cached.breakdown,
        recommendation: cached.recommendation,
        cached: true
      };
    }
    
    // Calculate new score
    const response = await axios.post(`${AI_SERVICE_URL}/calculate-fit-score`, {
      resume_data: resumeData,
      job_data: job
    }, { timeout: 30000 });
    
    const result = response.data;
    
    // Cache the result
    await UserJobMatch.findOneAndUpdate(
      { userId, jobId: job._id },
      {
        userId,
        jobId: job._id,
        fitScore: result.overall_score,
        breakdown: {
          skillsMatch: result.breakdown.skills_match,
          experienceMatch: result.breakdown.experience_match,
          educationMatch: result.breakdown.education_match,
          overallFit: result.breakdown.overall_fit
        },
        recommendation: result.recommendation,
        calculatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    return {
      fitScore: result.overall_score,
      breakdown: result.breakdown,
      recommendation: result.recommendation,
      cached: false
    };
    
  } catch (error) {
    console.error('Fit score calculation error:', error.message);
    throw error;
  }
}

/**
 * Calculate batch fit scores with caching
 */
async function calculateBatchFitScores(userId, resumeData, jobs) {
  try {
    // Get job IDs
    const jobIds = jobs.map(j => j._id);
    
    // Check for cached scores
    const cached = await UserJobMatch.find({
      userId,
      jobId: { $in: jobIds }
    });
    
    const cachedMap = new Map(
      cached.map(c => [c.jobId.toString(), c])
    );
    
    // Separate cached and uncached jobs
    const uncachedJobs = jobs.filter(
      j => !cachedMap.has(j._id.toString())
    );
    
    // Results array
    const results = [];
    
    // Add cached results
    for (const job of jobs) {
      const cachedScore = cachedMap.get(job._id.toString());
      if (cachedScore) {
        results.push({
          jobId: job._id,
          fitScore: cachedScore.fitScore,
          breakdown: cachedScore.breakdown,
          recommendation: cachedScore.recommendation,
          cached: true
        });
      }
    }
    
    // Calculate scores for uncached jobs in batches
    if (uncachedJobs.length > 0) {
      const response = await axios.post(
        `${AI_SERVICE_URL}/calculate-batch-fit-scores`,
        {
          resume_data: resumeData,
          jobs: uncachedJobs.map(j => ({
            _id: j._id.toString(),
            title: j.title,
            company: j.company,
            description: j.description,
            skills: j.skills,
            experienceMin: j.experienceMin,
            experienceMax: j.experienceMax,
            location: j.location
          }))
        },
        { timeout: 60000 }
      );
      
      // Cache and add to results
      for (const score of response.data.scores) {
        const job = uncachedJobs.find(j => j._id.toString() === score.job_id);
        if (job) {
          // Cache the result
          await UserJobMatch.findOneAndUpdate(
            { userId, jobId: job._id },
            {
              userId,
              jobId: job._id,
              fitScore: score.overall_score,
              breakdown: {
                skillsMatch: score.breakdown.skills_match,
                experienceMatch: score.breakdown.experience_match,
                educationMatch: score.breakdown.education_match,
                overallFit: score.breakdown.overall_fit
              },
              recommendation: score.recommendation,
              calculatedAt: new Date()
            },
            { upsert: true, new: true }
          );
          
          results.push({
            jobId: job._id,
            fitScore: score.overall_score,
            breakdown: score.breakdown,
            recommendation: score.recommendation,
            cached: false
          });
        }
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Batch fit score error:', error.message);
    throw error;
  }
}

module.exports = {
  checkHealth,
  extractResumeData,
  processResume,
  calculateFitScore,
  calculateBatchFitScores,
  AI_SERVICE_URL
};
```

---

## 5. Building Recommendations API

### 5.1 Create Recommendations Route

Create `backend/routes/recommendations.js`:

```javascript
// backend/routes/recommendations.js
const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const UserJobMatch = require('../models/UserJobMatch');
const auth = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET RECOMMENDATIONS - GET /api/recommendations
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has resume
    if (!user.resumeData) {
      return res.json({
        recommendations: [],
        message: 'Upload your resume to get personalized recommendations'
      });
    }
    
    // Get jobs user hasn't applied to
    const appliedJobs = await Application.find({ userId: user._id })
      .select('jobId');
    const appliedJobIds = appliedJobs.map(a => a.jobId);
    
    // Get all active jobs
    const jobs = await Job.find({
      status: 'active',
      _id: { $nin: appliedJobIds }
    }).lean();
    
    // Get cached scores
    const cachedScores = await UserJobMatch.find({
      userId: user._id,
      jobId: { $in: jobs.map(j => j._id) }
    }).lean();
    
    const scoreMap = new Map(
      cachedScores.map(s => [s.jobId.toString(), s])
    );
    
    // Combine jobs with scores
    const jobsWithScores = jobs.map(job => {
      const cached = scoreMap.get(job._id.toString());
      return {
        ...job,
        fitScore: cached?.fitScore || null,
        breakdown: cached?.breakdown || null,
        recommendation: cached?.recommendation || null,
        hasScore: !!cached
      };
    });
    
    // Sort by score (jobs with scores first, then by score value)
    jobsWithScores.sort((a, b) => {
      if (a.hasScore && !b.hasScore) return -1;
      if (!a.hasScore && b.hasScore) return 1;
      return (b.fitScore || 0) - (a.fitScore || 0);
    });
    
    // Count statistics
    const totalJobs = jobs.length;
    const cachedCount = cachedScores.length;
    
    res.json({
      recommendations: jobsWithScores.slice(0, 20),
      totalJobs,
      totalCached: cachedCount,
      isCalculating: cachedCount < totalJobs
    });
    
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router;
```

### 5.2 Add Route to Server

Update `backend/server.js`:

```javascript
const recommendationsRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationsRoutes);
```

---

## 6. ATS Score Analysis

### 6.1 Create ATS Analyzer

Add to `AI/fast_fit_score.py`:

```python
# ============================================
# ATS SCORE ANALYZER
# ============================================

def calculate_ats_score(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Calculate ATS (Applicant Tracking System) compatibility score
    
    Checks:
    - Keyword matching
    - Format compatibility
    - Experience alignment
    - Skills coverage
    """
    try:
        prompt = f"""
        Analyze this resume against the job description for ATS compatibility.
        
        RESUME TEXT:
        {resume_text[:2000]}
        
        JOB DESCRIPTION:
        {job_description[:1000]}
        
        Check for:
        1. Keyword Matching (30%): Are key job terms in the resume?
        2. Skills Coverage (30%): Are required skills mentioned?
        3. Experience Relevance (25%): Is experience relevant?
        4. Format Quality (15%): Clean, ATS-friendly format?
        
        Return JSON:
        {{
            "ats_score": <0-100>,
            "keyword_match": <0-100>,
            "skills_coverage": <0-100>,
            "experience_relevance": <0-100>,
            "format_quality": <0-100>,
            "missing_keywords": ["keyword1", "keyword2"],
            "suggestions": [
                "Add these skills: X, Y, Z",
                "Quantify your achievements",
                "Use action verbs"
            ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an ATS optimization expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"ATS analysis error: {e}")
        return {
            "ats_score": 50,
            "keyword_match": 50,
            "skills_coverage": 50,
            "experience_relevance": 50,
            "format_quality": 50,
            "missing_keywords": [],
            "suggestions": ["Unable to analyze - please try again"]
        }
```

### 6.2 Add ATS Endpoint

Add to `AI/main.py`:

```python
from fast_fit_score import calculate_ats_score

class ATSRequest(BaseModel):
    resume_text: str
    job_description: str

@app.post("/analyze-ats")
async def ats_analysis_endpoint(request: ATSRequest):
    """Analyze resume for ATS compatibility"""
    try:
        result = calculate_ats_score(
            request.resume_text,
            request.job_description
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 7. Recruiter AI Recommendations

### 7.1 Create Recruiter Decision Agent

Create `AI/recruiter_decision_graph.py`:

```python
"""
Recruiter Decision Agent
Helps recruiters make hiring decisions with AI insights
"""

import os
import json
from typing import Dict, Any, List
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_hiring_recommendation(
    candidate_resume: Dict[str, Any],
    job_requirements: Dict[str, Any],
    fit_score: int
) -> Dict[str, Any]:
    """
    Generate AI recommendation for a candidate
    
    Returns:
        - Decision recommendation
        - Strengths and weaknesses
        - Interview focus areas
        - Comparison notes
    """
    try:
        prompt = f"""
        As a hiring advisor, analyze this candidate for the role.
        
        CANDIDATE:
        Name: {candidate_resume.get('name', 'Unknown')}
        Skills: {', '.join(candidate_resume.get('skills', [])[:15])}
        Experience: {candidate_resume.get('total_experience_years', 0)} years
        Education: {candidate_resume.get('education', [])}
        
        JOB REQUIREMENTS:
        Title: {job_requirements.get('title', '')}
        Company: {job_requirements.get('company', '')}
        Required Skills: {', '.join(job_requirements.get('skills', []))}
        Experience Needed: {job_requirements.get('experienceMin', 0)}+ years
        
        FIT SCORE: {fit_score}%
        
        Provide hiring recommendation:
        {{
            "recommendation": "Strongly Recommend" | "Recommend" | "Consider" | "Not Recommended",
            "confidence": <0-100>,
            "summary": "One paragraph summary",
            "strengths": ["strength 1", "strength 2", "strength 3"],
            "concerns": ["concern 1", "concern 2"],
            "interview_focus": [
                "Area to probe during interview",
                "Technical topic to assess"
            ],
            "salary_range_suggestion": "Based on experience and market"
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a senior HR advisor. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=600,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"Recommendation error: {e}")
        return {
            "recommendation": "Unable to Generate",
            "confidence": 0,
            "summary": "Error generating recommendation",
            "strengths": [],
            "concerns": [],
            "interview_focus": [],
            "salary_range_suggestion": "N/A"
        }

def compare_candidates(
    candidates: List[Dict[str, Any]],
    job_requirements: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compare multiple candidates for a position
    
    Returns ranking and comparison insights
    """
    try:
        candidates_summary = []
        for i, c in enumerate(candidates[:5]):  # Max 5 candidates
            resume = c.get('resume', {})
            score = c.get('fit_score', 0)
            candidates_summary.append(
                f"Candidate {i+1}: {resume.get('name', 'Unknown')}, "
                f"Score: {score}%, "
                f"Experience: {resume.get('total_experience_years', 0)} years, "
                f"Skills: {', '.join(resume.get('skills', [])[:8])}"
            )
        
        prompt = f"""
        Compare these candidates for the {job_requirements.get('title', 'role')} position.
        
        CANDIDATES:
        {chr(10).join(candidates_summary)}
        
        JOB REQUIREMENTS:
        Required Skills: {', '.join(job_requirements.get('skills', []))}
        Experience: {job_requirements.get('experienceMin', 0)}+ years
        
        Return comparison:
        {{
            "ranking": [
                {{"rank": 1, "candidate_index": 0, "reason": "Why #1"}},
                {{"rank": 2, "candidate_index": 1, "reason": "Why #2"}}
            ],
            "top_pick": {{
                "candidate_index": 0,
                "key_differentiator": "What makes them stand out"
            }},
            "comparison_notes": "Overall comparison insights"
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a hiring manager. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        print(f"Comparison error: {e}")
        return {
            "ranking": [],
            "top_pick": None,
            "comparison_notes": "Unable to compare candidates"
        }
```

### 7.2 Add Recruiter Endpoints

Add to `AI/main.py`:

```python
from recruiter_decision_graph import generate_hiring_recommendation, compare_candidates

class HiringRecommendationRequest(BaseModel):
    candidate_resume: Dict[str, Any]
    job_requirements: Dict[str, Any]
    fit_score: int

class CompareCandidatesRequest(BaseModel):
    candidates: List[Dict[str, Any]]
    job_requirements: Dict[str, Any]

@app.post("/generate-hiring-recommendation")
async def hiring_recommendation_endpoint(request: HiringRecommendationRequest):
    """Generate AI hiring recommendation for a candidate"""
    try:
        result = generate_hiring_recommendation(
            request.candidate_resume,
            request.job_requirements,
            request.fit_score
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compare-candidates")
async def compare_candidates_endpoint(request: CompareCandidatesRequest):
    """Compare multiple candidates for a position"""
    try:
        result = compare_candidates(
            request.candidates,
            request.job_requirements
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 8. Background Jobs

### 8.1 Create Background Job Service

Create `backend/services/backgroundJobs.js`:

```javascript
// backend/services/backgroundJobs.js
const Job = require('../models/Job');
const User = require('../models/User');
const UserJobMatch = require('../models/UserJobMatch');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Calculate all job matches for a user
 * Run this after resume upload
 */
async function calculateAllJobMatches(userId) {
  try {
    const user = await User.findById(userId);
    if (!user?.resumeData) {
      console.log('No resume data for user:', userId);
      return;
    }
    
    console.log(`Starting background job: Calculate matches for user ${userId}`);
    
    // Get all active jobs
    const jobs = await Job.find({ status: 'active' }).lean();
    
    console.log(`Processing ${jobs.length} jobs...`);
    
    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      try {
        const response = await axios.post(
          `${AI_SERVICE_URL}/calculate-batch-fit-scores`,
          {
            resume_data: user.resumeData,
            jobs: batch.map(j => ({
              _id: j._id.toString(),
              title: j.title,
              company: j.company,
              description: j.description,
              skills: j.skills,
              experienceMin: j.experienceMin,
              experienceMax: j.experienceMax,
              location: j.location
            }))
          },
          { timeout: 120000 }
        );
        
        // Save scores
        for (const score of response.data.scores) {
          await UserJobMatch.findOneAndUpdate(
            { userId, jobId: score.job_id },
            {
              userId,
              jobId: score.job_id,
              fitScore: score.overall_score,
              breakdown: {
                skillsMatch: score.breakdown?.skills_match || 50,
                experienceMatch: score.breakdown?.experience_match || 50,
                educationMatch: score.breakdown?.education_match || 50,
                overallFit: score.breakdown?.overall_fit || 50
              },
              recommendation: score.recommendation,
              calculatedAt: new Date()
            },
            { upsert: true }
          );
        }
        
        console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(jobs.length/batchSize)}`);
        
      } catch (error) {
        console.error(`Batch ${i}-${i+batchSize} failed:`, error.message);
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`Completed: All matches calculated for user ${userId}`);
    
  } catch (error) {
    console.error('Background job error:', error);
  }
}

/**
 * Recalculate scores when job is updated
 */
async function recalculateJobScores(jobId) {
  try {
    // Delete old scores for this job
    await UserJobMatch.deleteMany({ jobId });
    
    console.log(`Cleared old scores for job ${jobId}`);
    
  } catch (error) {
    console.error('Recalculate job scores error:', error);
  }
}

module.exports = {
  calculateAllJobMatches,
  recalculateJobScores
};
```

### 8.2 Trigger Background Job After Resume Upload

Update `backend/routes/resume.js`:

```javascript
// Add import
const { calculateAllJobMatches } = require('../services/backgroundJobs');

// In the upload endpoint, after saving resume data:
// Start background job (don't await)
calculateAllJobMatches(req.user._id).catch(err => {
  console.error('Background score calculation error:', err);
});
```

---

## 9. Frontend Integration

### 9.1 Create AI Match Modal Component

Create `frontend/src/components/AIMatchModal.jsx`:

```jsx
// frontend/src/components/AIMatchModal.jsx
import { FaTimes, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

function AIMatchModal({ isOpen, onClose, matchData, job }) {
  if (!isOpen) return null;
  
  const { fitScore, breakdown, recommendation } = matchData || {};
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };
  
  const getScoreBar = (score) => {
    const width = `${score}%`;
    let bgColor = 'bg-red-500';
    if (score >= 80) bgColor = 'bg-green-500';
    else if (score >= 60) bgColor = 'bg-yellow-500';
    else if (score >= 40) bgColor = 'bg-orange-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${bgColor} h-2 rounded-full`} style={{ width }} />
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">AI Match Analysis</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        
        {/* Overall Score */}
        <div className="text-center mb-6">
          <div className={`text-5xl font-bold ${getScoreColor(fitScore)}`}>
            {fitScore}%
          </div>
          <p className="text-gray-600 mt-1">Match Score</p>
        </div>
        
        {/* Job Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800">{job?.title}</h3>
          <p className="text-gray-600">{job?.company}</p>
        </div>
        
        {/* Score Breakdown */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Skills Match</span>
              <span className="font-medium">{breakdown?.skillsMatch || 0}%</span>
            </div>
            {getScoreBar(breakdown?.skillsMatch || 0)}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Experience Match</span>
              <span className="font-medium">{breakdown?.experienceMatch || 0}%</span>
            </div>
            {getScoreBar(breakdown?.experienceMatch || 0)}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Education Match</span>
              <span className="font-medium">{breakdown?.educationMatch || 0}%</span>
            </div>
            {getScoreBar(breakdown?.educationMatch || 0)}
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-700">Overall Fit</span>
              <span className="font-medium">{breakdown?.overallFit || 0}%</span>
            </div>
            {getScoreBar(breakdown?.overallFit || 0)}
          </div>
        </div>
        
        {/* Recommendation */}
        {recommendation && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <FaCheckCircle className="text-teal-600 mt-1" />
              <p className="text-teal-800">{recommendation}</p>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default AIMatchModal;
```

---

## 10. Testing the Copilot

### 10.1 Test Fit Score Calculation

```bash
curl -X POST http://localhost:8001/calculate-fit-score \
  -H "Content-Type: application/json" \
  -d '{
    "resume_data": {
      "name": "John Doe",
      "skills": ["Python", "JavaScript", "React", "Node.js"],
      "total_experience_years": 3,
      "experience": [{"title": "Software Engineer", "company": "Tech Corp"}],
      "education": [{"degree": "B.Tech CS", "institution": "IIT"}]
    },
    "job_data": {
      "title": "Senior Software Engineer",
      "company": "Google",
      "skills": ["Python", "Java", "Kubernetes"],
      "experienceMin": 2,
      "description": "Build scalable systems"
    }
  }'
```

### 10.2 Test Batch Processing

```bash
curl -X POST http://localhost:8001/calculate-batch-fit-scores \
  -H "Content-Type: application/json" \
  -d '{
    "resume_data": {"name": "John", "skills": ["Python", "React"], "total_experience_years": 2},
    "jobs": [
      {"_id": "job1", "title": "Frontend Dev", "skills": ["React", "CSS"]},
      {"_id": "job2", "title": "Backend Dev", "skills": ["Python", "Django"]}
    ]
  }'
```

### 10.3 Verification Checklist

| Feature | Test | Status |
|---------|------|--------|
| Single fit score | Returns score 0-100 | ⬜ |
| Batch processing | Scores multiple jobs | ⬜ |
| Score caching | MongoDB stores scores | ⬜ |
| Recommendations API | Returns sorted jobs | ⬜ |
| ATS analysis | Returns suggestions | ⬜ |
| Hiring recommendations | Generates insights | ⬜ |

---

## 🎉 Day 6 Complete!

You have successfully built:
- ✅ AI fit score calculation
- ✅ Batch processing for efficiency
- ✅ Score caching in MongoDB
- ✅ Job recommendations API
- ✅ ATS score analysis
- ✅ Recruiter AI recommendations
- ✅ Background job processing

---

## 📖 What's Next?

Tomorrow in **Day 7**, you'll integrate everything:
- Complete user flow testing
- Recruiter dashboard
- Final polish and testing
- Deployment preparation

👉 **Continue to [Day 7: Full Integration](./day7-integration.md)**

