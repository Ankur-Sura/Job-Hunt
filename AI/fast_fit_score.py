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
    Process a batch of jobs in a single LLM call - OPTIMIZED FOR SPEED.
    """
    # Create compact resume summary
    resume_summary = create_resume_summary(resume_data)
    
    # Create minimal job summaries
    job_summaries = []
    for job in jobs:
        job_summaries.append({
            "id": str(job.get("_id", "")),
            "title": job.get("title", ""),
            "skills": job.get("skills", [])[:8],  # Top 8 skills only
            "exp": job.get("experience", {}).get("display", "0-1 years")
        })
    
    # OPTIMIZED SHORT PROMPT - Much faster!
    batch_prompt = f"""Score resume against jobs. Be STRICT and REALISTIC.

RESUME:
{resume_summary}

JOBS:
{json.dumps(job_summaries)}

SCORING (weights): Skills=40%, Experience=30%, Education=20%, Alignment=10%
- Projects ≠ work experience (projects = 25% value of real exp)
- No exp + entry job (0-1yr) = 50-65%
- No exp + mid job (2-3yr) = 30-45%
- Matching exp = 70-85%

Return JSON: {{"scores":[{{"job_id":"id","fitScore":0-100,"breakdown":{{"skillsMatch":0-100,"experienceMatch":0-100,"educationMatch":0-100,"overallAlignment":0-100}},"strengths":["max 2"],"gaps":["max 2"],"recommendation":"Highly recommended|Recommended|Consider|Not recommended"}}]}}"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": batch_prompt}],
            temperature=0.2,
            max_tokens=500 * len(jobs),  # Limit response size
            timeout=60.0  # Reduced timeout - faster model should respond quickly
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
    Create a COMPACT summary of resume data - OPTIMIZED FOR SPEED.
    Minimal tokens, maximum information density.
    """
    parts = []
    
    # Skills (top 12 only)
    skills = resume_data.get("skills", [])
    if skills:
        if isinstance(skills, list):
            parts.append(f"Skills:{','.join(skills[:12])}")
        else:
            parts.append(f"Skills:{str(skills)[:100]}")
    
    # Work Experience (compact format)
    exp = resume_data.get("experience", [])
    if isinstance(exp, list) and exp:
        exp_str = ";".join([f"{e.get('title','')}" for e in exp[:2] if isinstance(e, dict)])
        parts.append(f"Exp:{len(exp)}jobs[{exp_str}]")
    else:
        parts.append("Exp:NONE")
    
    # Internships
    internships = resume_data.get("internships", [])
    if isinstance(internships, list) and internships:
        parts.append(f"Intern:{len(internships)}")
    
    # Projects (count only)
    projects = resume_data.get("projects", [])
    if isinstance(projects, list) and projects:
        parts.append(f"Projects:{len(projects)}(not exp)")
    
    # Education (compact)
    edu = resume_data.get("education", [])
    if edu:
        if isinstance(edu, list) and edu:
            e = edu[0] if isinstance(edu[0], dict) else {}
            parts.append(f"Edu:{e.get('degree','')}@{e.get('institution','')[:20]}")
        elif isinstance(edu, str):
            parts.append(f"Edu:{edu[:50]}")
    
    return "|".join(parts) if parts else "No data"

