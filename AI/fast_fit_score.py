"""
===================================================================================
            FAST_FIT_SCORE.PY - Fast Batch Fit Score Calculation
===================================================================================

📚 WHAT IS THIS FILE?
---------------------
Fast AI endpoint for calculating multiple job match scores in batch.
Uses optimized prompts and batch processing for speed.

===================================================================================
"""

import os
import json
import asyncio
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

fast_router = APIRouter(prefix="/fast", tags=["Fast AI"])

client = OpenAI()

class JobMatchRequest(BaseModel):
    resume_data: Dict[str, Any]
    jobs: List[Dict[str, Any]]

class JobMatchResponse(BaseModel):
    job_id: str
    fitScore: int
    breakdown: Dict[str, int]
    strengths: List[str]
    gaps: List[str]
    recommendation: str

@fast_router.post("/batch-fit-scores")
async def batch_calculate_fit_scores(request: JobMatchRequest):
    """
    📖 Fast Batch Fit Score Calculation
    ===================================
    
    Calculate fit scores for multiple jobs at once using optimized batch processing.
    This is faster than calculating one-by-one.
    
    HTTP POST to: http://localhost:8000/fast/batch-fit-scores
    Body: {
        "resume_data": {...},
        "jobs": [
            {"_id": "job1", "title": "...", "company": "...", ...},
            {"_id": "job2", ...}
        ]
    }
    
    Returns: {
        "scores": [
            {
                "job_id": "job1",
                "fitScore": 85,
                "breakdown": {...},
                "strengths": [...],
                "gaps": [...],
                "recommendation": "Highly recommended"
            },
            ...
        ]
    }
    """
    try:
        resume_data = request.resume_data
        jobs = request.jobs
        
        if not jobs:
            return {"scores": []}
        
        # Process in batches of 20 for optimal speed (increased from 10)
        # Larger batches = fewer API calls = faster overall processing
        batch_size = 20
        total_batches = (len(jobs) + batch_size - 1) // batch_size
        print(f"📊 Processing {len(jobs)} jobs in {total_batches} batches of {batch_size}...")
        
        all_scores = []
        
        # Process batches in parallel (up to 3 batches at once) for speed
        semaphore = asyncio.Semaphore(3)  # Limit to 3 concurrent batches
        
        async def process_batch_with_semaphore(batch, batch_num):
            async with semaphore:
                print(f"  🔄 Processing batch {batch_num}/{total_batches} ({len(batch)} jobs)...")
                result = await process_batch(resume_data, batch)
                print(f"  ✅ Batch {batch_num}/{total_batches} complete ({len(result)} scores)")
                return result
        
        # Create all batch tasks
        batch_tasks = []
        batch_num = 0
        for i in range(0, len(jobs), batch_size):
            batch = jobs[i:i + batch_size]
            batch_num += 1
            batch_tasks.append(process_batch_with_semaphore(batch, batch_num))
        
        # Process all batches in parallel (up to 3 at a time)
        print(f"🚀 Starting parallel processing of {len(batch_tasks)} batches...")
        batch_results = await asyncio.gather(*batch_tasks)
        
        # Flatten results
        for batch_scores in batch_results:
            all_scores.extend(batch_scores)
        
        return {
            "success": True,
            "scores": all_scores,
            "total": len(all_scores)
        }
        
    except Exception as err:
        print(f"❌ Batch fit score error: {err}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to calculate fit scores: {str(err)}")


async def process_batch(resume_data: Dict, jobs: List[Dict]) -> List[Dict]:
    """
    Process a batch of jobs (up to 20) in a single LLM call for speed.
    Optimized for parallel processing.
    """
    # Create a compact summary of resume
    resume_summary = create_resume_summary(resume_data)
    
    # Create job summaries
    job_summaries = []
    for job in jobs:
        job_summaries.append({
            "id": str(job.get("_id", "")),
            "title": job.get("title", ""),
            "company": job.get("company", ""),
            "skills": job.get("skills", []),
            "experience": job.get("experience", {}).get("display", ""),
            "description": job.get("description", "")[:300]  # First 300 chars (optimized for speed)
        })
    
    # Single optimized prompt for all jobs
    batch_prompt = f"""
You are a STRICT and REALISTIC recruiter. Analyze this candidate's resume against multiple job positions and calculate ACCURATE fit scores.

CANDIDATE RESUME SUMMARY:
{resume_summary}

JOBS TO ANALYZE:
{json.dumps(job_summaries, indent=2)}

⚠️ CRITICAL SCORING RULES - BE STRICT AND REALISTIC:

1. **Skills Match (40% weight)**
   - Only count skills explicitly mentioned in resume
   - Partial matches (e.g., "JS" vs "JavaScript") count as 70%
   - Missing critical skills = major penalty
   - Non-tech skills (sales, marketing, nursing, etc.) do NOT count for IT jobs

2. **Experience Match (30% weight)** - MOST IMPORTANT FOR ACCURACY
   - ⚠️ DOMAIN/FIELD MISMATCH = CRITICAL PENALTY ⚠️
   - If candidate's experience is in a DIFFERENT FIELD (e.g., healthcare, sales, retail, teaching, nursing, banking operations), their experience does NOT count for tech jobs:
     * Experience in non-tech field applying to tech job = 0-15% experience match
     * Experience must be RELEVANT to the job domain
   - Check job titles: "Nurse", "Teacher", "Sales Executive", "Accountant", "Bank Teller" = NOT IT experience
   - IT experience includes: Developer, Engineer, Programmer, Data Analyst, QA, DevOps, DBA, IT Support, etc.
   - REAL WORK EXPERIENCE = Jobs at companies with relevant titles
   - PROJECTS ARE NOT WORK EXPERIENCE - they show potential but NOT professional experience
   - If candidate has NO relevant work experience:
     * For jobs requiring 0-1 years: Give 40-60% (if has relevant projects/skills)
     * For jobs requiring 1-3 years: Give 20-40% (significant gap)
     * For jobs requiring 3+ years: Give 0-20% (not qualified)
   - Internships in relevant field count as 50% of real experience
   - Projects count as 20-30% (shows skills, not professional work)

3. **Education Match (20% weight)**
   - Relevant degree in CS/IT/Engineering = 100%
   - Related field (Math, Physics, Statistics) = 70-80%
   - Unrelated field (Arts, Commerce, Nursing, etc.) = 30-50%
   - No degree = 20-30%

4. **Overall Alignment (10% weight)**
   - Consider career trajectory, role fit, industry match
   - Career switcher from unrelated field = lower alignment (30-50%)
   - Candidate in same industry = higher alignment (70-90%)

📊 REALISTIC SCORE RANGES:
- Fresher (no experience) applying to entry-level (0-1 yr): 50-70%
- Fresher applying to mid-level (2-3 yr): 30-50%
- Fresher applying to senior (3+ yr): 20-40%
- Experienced matching requirements: 70-90%
- Perfect match: 85-95% (never give 100%)

🚫 DO NOT:
- Inflate scores because candidate has many projects
- Give 80%+ to someone with no experience for roles needing experience
- Treat projects as equivalent to work experience
- Be overly generous - be REALISTIC

Return ONLY a valid JSON object with a "scores" key containing an array in this exact format:
{{
  "scores": [
    {{
      "job_id": "job_id_1",
      "fitScore": 65,
      "breakdown": {{
        "skillsMatch": 85,
        "experienceMatch": 35,
        "educationMatch": 70,
        "overallAlignment": 60
      }},
      "strengths": ["Strong technical skills", "Relevant projects"],
      "gaps": ["No professional work experience", "Missing required 2 years experience"],
      "recommendation": "Consider"
    }},
    ...
  ]
}}

IMPORTANT: 
- Return ONLY the JSON object with "scores" array, no additional text
- Include ALL jobs in the response
- recommendation: "Highly recommended" (80%+), "Recommended" (65-79%), "Consider" (50-64%), "Not recommended" (<50%)
- job_id must match the job ID from the input
- BE STRICT about experience - projects ≠ work experience!
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast model
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": batch_prompt}],
            temperature=0.3,  # Lower temperature for consistency
            timeout=120.0  # 2 minute timeout per batch (increased for larger batches)
        )
        
        result = json.loads(response.choices[0].message.content)
        
        # Handle different response formats
        # When using json_object, the response might be wrapped
        if isinstance(result, list):
            scores = result
        elif "scores" in result:
            scores = result["scores"]
        elif "results" in result:
            scores = result["results"]
        elif "jobs" in result:
            scores = result["jobs"]
        elif isinstance(result, dict):
            # Try to find array in any value
            for key, value in result.items():
                if isinstance(value, list):
                    scores = value
                    break
            else:
                scores = []
        else:
            scores = []
        
        # Ensure all jobs have scores
        job_ids = {str(job.get("_id", "")) for job in jobs}
        scored_ids = {score.get("job_id", "") for score in scores}
        
        # Add default scores for missing jobs
        for job in jobs:
            job_id = str(job.get("_id", ""))
            if job_id not in scored_ids:
                scores.append({
                    "job_id": job_id,
                    "fitScore": 0,
                    "breakdown": {
                        "skillsMatch": 0,
                        "experienceMatch": 0,
                        "educationMatch": 0,
                        "overallAlignment": 0
                    },
                    "strengths": [],
                    "gaps": ["Unable to calculate match"],
                    "recommendation": "Not recommended"
                })
        
        return scores
        
    except Exception as err:
        print(f"❌ Batch processing error: {err}")
        # Return default scores for all jobs
        return [
            {
                "job_id": str(job.get("_id", "")),
                "fitScore": 0,
                "breakdown": {
                    "skillsMatch": 0,
                    "experienceMatch": 0,
                    "educationMatch": 0,
                    "overallAlignment": 0
                },
                "strengths": [],
                "gaps": ["Error calculating match"],
                "recommendation": "Not recommended"
            }
            for job in jobs
        ]


def create_resume_summary(resume_data: Dict) -> str:
    """
    Create a compact summary of resume data for faster processing.
    Clearly distinguishes between work experience and projects.
    """
    summary_parts = []
    
    # Skills
    if resume_data.get("skills"):
        skills = resume_data["skills"]
        if isinstance(skills, list):
            summary_parts.append(f"Skills: {', '.join(skills[:20])}")  # Top 20 skills
        elif isinstance(skills, str):
            summary_parts.append(f"Skills: {skills[:200]}")
    
    # Work Experience - CLEARLY LABELED WITH DOMAIN DETECTION
    exp = resume_data.get("experience", [])
    if isinstance(exp, list) and len(exp) > 0:
        # Detect if experience is in IT/Tech or other field
        it_keywords = ['developer', 'engineer', 'programmer', 'software', 'data', 'analyst', 
                       'devops', 'qa', 'testing', 'frontend', 'backend', 'fullstack', 'web', 
                       'mobile', 'cloud', 'database', 'dba', 'it', 'technical', 'tech', 'sde',
                       'machine learning', 'ml', 'ai', 'python', 'java', 'coding']
        non_it_keywords = ['nurse', 'nursing', 'teacher', 'teaching', 'sales', 'marketing',
                          'accountant', 'accounting', 'bank', 'teller', 'cashier', 'retail',
                          'healthcare', 'medical', 'doctor', 'receptionist', 'admin', 'clerk',
                          'customer service', 'call center', 'bpo', 'hr', 'human resources']
        
        is_it_exp = False
        is_non_it_exp = False
        exp_titles = []
        
        for e in exp[:3]:
            if isinstance(e, dict):
                title = e.get("title", "").lower()
                exp_titles.append(e.get("title", ""))
                if any(kw in title for kw in it_keywords):
                    is_it_exp = True
                if any(kw in title for kw in non_it_keywords):
                    is_non_it_exp = True
        
        # Determine experience domain
        if is_non_it_exp and not is_it_exp:
            domain_warning = "⚠️ NON-IT BACKGROUND - Experience is NOT in tech/IT field"
        elif is_it_exp:
            domain_warning = "✅ IT/Tech Background"
        else:
            domain_warning = "⚠️ Field unclear - verify if relevant to tech"
        
        summary_parts.append(f"⚠️ WORK EXPERIENCE: {len(exp)} professional positions ({domain_warning})")
        for e in exp[:3]:
                if isinstance(e, dict):
                    title = e.get("title", "")
                    company = e.get("company", "")
                    duration = e.get("duration", "")
                    summary_parts.append(f"  - {title} at {company} ({duration})")
    else:
        summary_parts.append("⚠️ WORK EXPERIENCE: NONE (No professional work experience)")
    
    # Internships - Separate from experience
    internships = resume_data.get("internships", [])
    if isinstance(internships, list) and len(internships) > 0:
        summary_parts.append(f"Internships: {len(internships)} internship(s)")
        for i in internships[:2]:
            if isinstance(i, dict):
                title = i.get("title", "")
                company = i.get("company", "")
                duration = i.get("duration", "")
                summary_parts.append(f"  - {title} at {company} ({duration})")
    else:
        summary_parts.append("Internships: NONE")
    
    # Projects - CLEARLY LABELED AS NOT EXPERIENCE
    projects = resume_data.get("projects", [])
    if isinstance(projects, list) and len(projects) > 0:
        summary_parts.append(f"Projects (NOT work experience, shows skills only): {len(projects)} project(s)")
        for p in projects[:3]:
            if isinstance(p, dict):
                name = p.get("name", "")
                tech = p.get("technologies", [])
                tech_str = ", ".join(tech[:5]) if isinstance(tech, list) else str(tech)[:50]
                summary_parts.append(f"  - {name} (Tech: {tech_str})")
    
    # Education
    if resume_data.get("education"):
        edu = resume_data["education"]
        if isinstance(edu, list):
            for e in edu[:2]:  # Top 2 education
                if isinstance(e, dict):
                    degree = e.get("degree", "")
                    institution = e.get("institution", "")
                    summary_parts.append(f"Education: {degree} from {institution}")
        elif isinstance(edu, str):
            summary_parts.append(f"Education: {edu[:200]}")
    
    # Certifications
    if resume_data.get("certifications"):
        certs = resume_data["certifications"]
        if isinstance(certs, list):
            summary_parts.append(f"Certifications: {', '.join(certs[:5])}")
        elif isinstance(certs, str):
            summary_parts.append(f"Certifications: {certs[:200]}")
    
    # If no structured data, use raw text
    if not summary_parts and resume_data.get("rawText"):
        summary_parts.append(f"Resume Text: {resume_data['rawText'][:1000]}")
    
    return "\n".join(summary_parts) if summary_parts else "Resume data available"

