"""
===================================================================================
            RECRUITER_DECISION_GRAPH.PY - AI Hiring Decision Workflow
===================================================================================

📚 WHAT IS THIS FILE?
---------------------
This implements a LangGraph workflow for AI-powered hiring suggestions.
It analyzes multiple factors to provide recruiters with informed recommendations.

📌 THE WORKFLOW (5 NODES):
---------------------------
START → ats_analyzer → profile_matcher → college_tier_analyzer → 
        experience_evaluator → decision_maker → END

FACTORS CONSIDERED:
-------------------
1. ATS Compatibility Score (0-100)
2. Agentic (Fit) Score (0-100)
3. Project Relevance Score (0-100)
4. Profile Matching (skills, education alignment)
5. Experience Level (work experience, internships, projects)
6. College Tier (TIER 1, TIER 2, TIER 3 in India)

OUTPUT:
-------
- Overall recommendation (Strong Accept, Accept, Consider, Reject)
- Confidence score (0-100)
- Detailed reasoning
- Key factors summary

===================================================================================
"""

import os
import json
from typing import TypedDict, Annotated, List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Workaround for langchain.debug issue
try:
    import langchain
    if not hasattr(langchain, 'debug'):
        langchain.debug = False
except:
    pass

# LangGraph imports
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

# OpenAI
from openai import OpenAI

# Our tools
from tools_service import smart_web_search

# =============================================================================
#                           INITIALIZE
# =============================================================================

# Initialize OpenAI with timeout
client = OpenAI(timeout=60.0)

# =============================================================================
#                           STATE DEFINITION
# =============================================================================

class RecruiterDecisionState(TypedDict):
    """Recruiter Decision State"""
    messages: Annotated[list, add_messages]
    
    # Input data
    resume_data: Dict[str, Any]
    job_data: Dict[str, Any]
    application_id: str
    candidate_name: str
    
    # Analysis results from each node (can be pre-calculated)
    ats_score: Optional[float]
    ats_analysis: Optional[Dict]  # Can be passed in to avoid recalculation
    
    agentic_score: Optional[float]
    agentic_details: Optional[Dict]
    
    project_score: Optional[float]
    project_analysis: Optional[Dict]  # Can be passed in to avoid recalculation
    
    profile_match_score: Optional[float]
    profile_match_details: Optional[Dict]
    
    experience_level: Optional[str]  # "High", "Medium", "Low", "None"
    experience_details: Optional[Dict]
    
    college_tier: Optional[str]  # "TIER 1", "TIER 2", "TIER 3", "Unknown"
    college_details: Optional[Dict]
    
    # Final decision
    recommendation: Optional[str]  # "Strong Accept", "Accept", "Consider", "Reject"
    confidence_score: Optional[float]
    reasoning: Optional[str]
    key_factors: Optional[List[str]]


# =============================================================================
#                     NODE 1: ATS ANALYZER
# =============================================================================

def ats_analyzer_node(state: RecruiterDecisionState) -> Dict[str, Any]:
    """Analyze ATS compatibility (uses pre-calculated if available)"""
    import sys
    print("\n" + "="*60, flush=True)
    print("📄 NODE 1: ATS COMPATIBILITY ANALYZER", flush=True)
    print("="*60, flush=True)
    sys.stdout.flush()
    
    # Check if ATS analysis already exists (from recruiter dashboard)
    existing_ats = state.get("ats_analysis")
    if existing_ats and existing_ats.get("score") is not None:
        print("   ✅ Using pre-calculated ATS analysis", flush=True)
        return {
            "ats_score": existing_ats.get("score", 0),
            "ats_analysis": existing_ats
        }
    
    resume_data = state.get("resume_data", {})
    
    print("   🔍 Analyzing ATS compatibility...", flush=True)
    
    ats_prompt = f"""
Analyze this resume for ATS (Applicant Tracking System) compatibility.

Resume Data:
{json.dumps(resume_data, indent=2)}

Evaluate:
1. Formatting (sections, structure, clarity) - 25 points
2. Keyword optimization (job-relevant keywords) - 25 points
3. File compatibility (PDF, text-based) - 25 points
4. Readability by ATS systems (no images, simple layout) - 25 points

Return ONLY valid JSON:
{{
  "atsScore": 0-100,
  "isATSFriendly": true/false,
  "strengths": ["list of strengths"],
  "weaknesses": ["list of weaknesses"],
  "details": "brief explanation"
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": ats_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        
        ats_score = result.get("atsScore", 0)
        print(f"   ✅ ATS Score: {ats_score}%", flush=True)
        
        return {
            "ats_score": ats_score,
            "ats_analysis": {
                "score": ats_score,
                "isATSFriendly": result.get("isATSFriendly", False),
                "strengths": result.get("strengths", []),
                "weaknesses": result.get("weaknesses", []),
                "details": result.get("details", "")
            }
        }
    except Exception as e:
        print(f"   ⚠️ ATS analysis failed: {e}", flush=True)
        return {
            "ats_score": 0,
            "ats_analysis": {
                "score": 0,
                "isATSFriendly": False,
                "strengths": [],
                "weaknesses": ["Unable to analyze"],
                "details": "Analysis failed"
            }
        }


# =============================================================================
#                     NODE 2: PROFILE MATCHER
# =============================================================================

def profile_matcher_node(state: RecruiterDecisionState) -> Dict[str, Any]:
    """Analyze profile matching (skills, education alignment)"""
    import sys
    print("\n" + "="*60, flush=True)
    print("🎯 NODE 2: PROFILE MATCHER", flush=True)
    print("="*60, flush=True)
    sys.stdout.flush()
    
    resume_data = state.get("resume_data", {})
    job_data = state.get("job_data", {})
    
    print("   🔍 Analyzing profile matching...", flush=True)
    
    profile_prompt = f"""
Analyze how well the candidate's profile matches the job requirements.

CANDIDATE PROFILE:
Skills: {json.dumps(resume_data.get("skills", []), indent=2)}
Education: {json.dumps(resume_data.get("education", []), indent=2)}
Certifications: {json.dumps(resume_data.get("certifications", []), indent=2)}

JOB REQUIREMENTS:
Title: {job_data.get("title", "")}
Required Skills: {json.dumps(job_data.get("skills", []), indent=2)}
Qualifications: {json.dumps(job_data.get("qualifications", {}), indent=2)}
Description: {job_data.get("description", "")[:500]}

Evaluate:
1. Skills Match (40 points) - How many required skills does candidate have?
2. Education Alignment (30 points) - Does education match job requirements?
3. Certification Relevance (15 points) - Relevant certifications?
4. Overall Profile Fit (15 points) - General alignment

Return ONLY valid JSON:
{{
  "profileMatchScore": 0-100,
  "skillsMatch": 0-100,
  "educationMatch": 0-100,
  "certificationMatch": 0-100,
  "matchingSkills": ["list of matching skills"],
  "missingSkills": ["list of missing skills"],
  "educationAlignment": "description",
  "details": "brief explanation"
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": profile_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        
        profile_score = result.get("profileMatchScore", 0)
        print(f"   ✅ Profile Match Score: {profile_score}%", flush=True)
        
        return {
            "profile_match_score": profile_score,
            "profile_match_details": {
                "score": profile_score,
                "skillsMatch": result.get("skillsMatch", 0),
                "educationMatch": result.get("educationMatch", 0),
                "certificationMatch": result.get("certificationMatch", 0),
                "matchingSkills": result.get("matchingSkills", []),
                "missingSkills": result.get("missingSkills", []),
                "educationAlignment": result.get("educationAlignment", ""),
                "details": result.get("details", "")
            }
        }
    except Exception as e:
        print(f"   ⚠️ Profile matching failed: {e}", flush=True)
        return {
            "profile_match_score": 0,
            "profile_match_details": {
                "score": 0,
                "skillsMatch": 0,
                "educationMatch": 0,
                "details": "Analysis failed"
            }
        }


# =============================================================================
#                     NODE 3: COLLEGE TIER ANALYZER
# =============================================================================

def college_tier_analyzer_node(state: RecruiterDecisionState) -> Dict[str, Any]:
    """Determine college tier (TIER 1, TIER 2, TIER 3)"""
    import sys
    print("\n" + "="*60, flush=True)
    print("🏛️ NODE 3: COLLEGE TIER ANALYZER", flush=True)
    print("="*60, flush=True)
    sys.stdout.flush()
    
    resume_data = state.get("resume_data", {})
    education = resume_data.get("education", [])
    
    print("   🔍 Analyzing college tier...", flush=True)
    
    if not education or len(education) == 0:
        print("   ⚠️ No education data found", flush=True)
        return {
            "college_tier": "Unknown",
            "college_details": {
                "tier": "Unknown",
                "institution": "Not specified",
                "reasoning": "No education information available",
                "impact": "Neutral"
            }
        }
    
    # Get the most recent/highest degree
    latest_education = education[0] if isinstance(education, list) else education
    institution = latest_education.get("institution", "") if isinstance(latest_education, dict) else str(latest_education)
    degree = latest_education.get("degree", "") if isinstance(latest_education, dict) else ""
    
    # Search for college tier information using Tavily
    try:
        # Enhanced search query for better results
        search_queries = [
            f"{institution} college tier India ranking",
            f"{institution} IIT NIT BITS IIIT India engineering college",
            f"{institution} NIRF ranking India college tier"
        ]
        
        all_results = []
        for query in search_queries:
            print(f"   🔍 Searching Tavily: {query}", flush=True)
            try:
                search_results = smart_web_search(query, max_results=2)
                if search_results.get('results'):
                    all_results.extend(search_results.get('results', []))
            except Exception as e:
                print(f"   ⚠️ Search query failed: {e}", flush=True)
                continue
        
        # Remove duplicates and limit to top 5
        seen_urls = set()
        unique_results = []
        for result in all_results:
            url = result.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(result)
            if len(unique_results) >= 5:
                break
        
        search_results = {"results": unique_results}
        print(f"   ✅ Tavily search completed: {len(unique_results)} unique results", flush=True)
    except Exception as e:
        print(f"   ⚠️ Tavily search failed: {e}", flush=True)
        search_results = {"results": []}
    
    tier_prompt = f"""
Determine the college tier for this Indian institution.

Institution Name: {institution}
Degree: {degree}

Search Results:
{json.dumps(search_results.get('results', [])[:3], indent=2)}

TIER CLASSIFICATION (for Indian colleges):
- TIER 1: IITs, NITs, BITS Pilani, IIITs, top private universities (BITS, VIT, SRM, Manipal), top state universities
- TIER 2: Good state universities, reputable private colleges, regional engineering colleges
- TIER 3: Other colleges, local institutions, unknown colleges

Consider:
1. Institution reputation
2. Ranking (if mentioned)
3. Recognition (AICTE, UGC approved)
4. Alumni network
5. Placement records

Return ONLY valid JSON:
{{
  "tier": "TIER 1" or "TIER 2" or "TIER 3" or "Unknown",
  "institution": "{institution}",
  "reasoning": "why this tier",
  "confidence": "high/medium/low",
  "impact": "positive/neutral/negative",
  "details": "additional information"
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": tier_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        
        tier = result.get("tier", "Unknown")
        print(f"   ✅ College Tier: {tier}", flush=True)
        
        return {
            "college_tier": tier,
            "college_details": {
                "tier": tier,
                "institution": institution,
                "reasoning": result.get("reasoning", ""),
                "confidence": result.get("confidence", "medium"),
                "impact": result.get("impact", "neutral"),
                "details": result.get("details", "")
            }
        }
    except Exception as e:
        print(f"   ⚠️ College tier analysis failed: {e}", flush=True)
        return {
            "college_tier": "Unknown",
            "college_details": {
                "tier": "Unknown",
                "institution": institution,
                "reasoning": "Analysis failed",
                "impact": "neutral"
            }
        }


# =============================================================================
#                     NODE 4: EXPERIENCE EVALUATOR
# =============================================================================

def experience_evaluator_node(state: RecruiterDecisionState) -> Dict[str, Any]:
    """Evaluate experience level"""
    import sys
    print("\n" + "="*60, flush=True)
    print("💼 NODE 4: EXPERIENCE EVALUATOR", flush=True)
    print("="*60, flush=True)
    sys.stdout.flush()
    
    resume_data = state.get("resume_data", {})
    job_data = state.get("job_data", {})
    
    print("   🔍 Evaluating experience...", flush=True)
    
    experience = resume_data.get("experience", [])
    internships = resume_data.get("internships", [])
    projects = resume_data.get("projects", [])
    
    exp_prompt = f"""
Evaluate the candidate's experience level for this job.

CANDIDATE EXPERIENCE:
Work Experience: {json.dumps(experience, indent=2)}
Internships: {json.dumps(internships, indent=2)}
Projects: {json.dumps(projects[:5], indent=2)}  # Top 5 projects

JOB REQUIREMENTS:
Title: {job_data.get("title", "")}
Experience Required: {job_data.get("experience", {}).get("display", "Not specified")}
Description: {job_data.get("description", "")[:500]}

Evaluate:
1. Work Experience (years, relevance, quality)
2. Internship Experience (relevance, duration)
3. Project Experience (complexity, relevance, impact)
4. Overall Experience Level: "High", "Medium", "Low", "None"

Return ONLY valid JSON:
{{
  "experienceLevel": "High" or "Medium" or "Low" or "None",
  "workExperienceYears": 0,
  "hasRelevantExperience": true/false,
  "internshipCount": 0,
  "projectCount": 0,
  "experienceScore": 0-100,
  "strengths": ["list of experience strengths"],
  "gaps": ["list of experience gaps"],
  "details": "brief explanation"
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": exp_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        
        exp_level = result.get("experienceLevel", "None")
        exp_score = result.get("experienceScore", 0)
        print(f"   ✅ Experience Level: {exp_level} (Score: {exp_score}%)", flush=True)
        
        return {
            "experience_level": exp_level,
            "experience_details": {
                "level": exp_level,
                "workExperienceYears": result.get("workExperienceYears", 0),
                "hasRelevantExperience": result.get("hasRelevantExperience", False),
                "internshipCount": result.get("internshipCount", 0),
                "projectCount": result.get("projectCount", 0),
                "experienceScore": exp_score,
                "strengths": result.get("strengths", []),
                "gaps": result.get("gaps", []),
                "details": result.get("details", "")
            }
        }
    except Exception as e:
        print(f"   ⚠️ Experience evaluation failed: {e}", flush=True)
        return {
            "experience_level": "None",
            "experience_details": {
                "level": "None",
                "experienceScore": 0,
                "details": "Analysis failed"
            }
        }


# =============================================================================
#                     NODE 5: DECISION MAKER
# =============================================================================

def decision_maker_node(state: RecruiterDecisionState) -> Dict[str, Any]:
    """Make final hiring decision based on all factors"""
    import sys
    print("\n" + "="*60, flush=True)
    print("🤖 NODE 5: AI DECISION MAKER", flush=True)
    print("="*60, flush=True)
    sys.stdout.flush()
    
    # Collect all scores
    ats_score = state.get("ats_score", 0)
    agentic_score = state.get("agentic_score", 0)
    project_score = state.get("project_score", 0)
    profile_score = state.get("profile_match_score", 0)
    experience_level = state.get("experience_level", "None")
    college_tier = state.get("college_tier", "Unknown")
    
    # Get details
    ats_analysis = state.get("ats_analysis", {})
    agentic_details = state.get("agentic_details", {})
    project_analysis = state.get("project_analysis", {})
    profile_details = state.get("profile_match_details", {})
    experience_details = state.get("experience_details", {})
    college_details = state.get("college_details", {})
    
    print("   🔍 Making final decision...", flush=True)
    
    decision_prompt = f"""
You are an expert recruiter making a hiring decision. Analyze ALL factors and provide a recommendation.

CANDIDATE: {state.get("candidate_name", "Unknown")}
JOB: {state.get("job_data", {}).get("title", "")} at {state.get("job_data", {}).get("company", "")}

FACTORS TO CONSIDER:

1. ATS Compatibility: {ats_score}%
   - {ats_analysis.get("details", "N/A")}
   - Strengths: {', '.join(ats_analysis.get("strengths", [])[:3])}
   - Weaknesses: {', '.join(ats_analysis.get("weaknesses", [])[:3])}

2. Agentic (Fit) Score: {agentic_score}%
   - Breakdown: {json.dumps(agentic_details.get("breakdown", {}), indent=2)}
   - Strengths: {', '.join(agentic_details.get("strengths", [])[:3])}
   - Gaps: {', '.join(agentic_details.get("gaps", [])[:3])}

3. Project Relevance: {project_score}%
   - Useful for company: {project_analysis.get("usefulForCompany", False)}
   - Summary: {project_analysis.get("summary", "N/A")}

4. Profile Matching: {profile_score}%
   - Skills Match: {profile_details.get("skillsMatch", 0)}%
   - Education Match: {profile_details.get("educationMatch", 0)}%
   - Matching Skills: {', '.join(profile_details.get("matchingSkills", [])[:5])}

5. Experience Level: {experience_level}
   - Experience Score: {experience_details.get("experienceScore", 0)}%
   - Work Experience Years: {experience_details.get("workExperienceYears", 0)}
   - Has Relevant Experience: {experience_details.get("hasRelevantExperience", False)}
   - Strengths: {', '.join(experience_details.get("strengths", [])[:3])}

6. College Tier: {college_tier}
   - Institution: {college_details.get("institution", "N/A")}
   - Impact: {college_details.get("impact", "neutral")}
   - Reasoning: {college_details.get("reasoning", "N/A")}

DECISION CRITERIA:
- Strong Accept: Excellent scores across all factors, high confidence
- Accept: Good overall match, minor gaps acceptable
- Consider: Mixed signals, needs careful review
- Reject: Significant gaps, poor fit

IMPORTANT:
- Don't reject based on single factor (e.g., low fit score alone)
- Projects can compensate for lack of experience
- College tier is a factor but not the only factor
- ATS compatibility matters for resume filtering
- Consider overall potential, not just current qualifications

Return ONLY valid JSON:
{{
  "recommendation": "Strong Accept" or "Accept" or "Consider" or "Reject",
  "confidenceScore": 0-100,
  "reasoning": "detailed explanation of decision",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "strengths": ["main strengths"],
  "concerns": ["main concerns"],
  "suggestion": "specific hiring suggestion"
}}
"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": decision_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        result = json.loads(response.choices[0].message.content)
        
        recommendation = result.get("recommendation", "Consider")
        confidence = result.get("confidenceScore", 0)
        print(f"   ✅ Recommendation: {recommendation} (Confidence: {confidence}%)", flush=True)
        
        return {
            "recommendation": recommendation,
            "confidence_score": confidence,
            "reasoning": result.get("reasoning", ""),
            "key_factors": result.get("keyFactors", []),
            "strengths": result.get("strengths", []),
            "concerns": result.get("concerns", []),
            "suggestion": result.get("suggestion", "")
        }
    except Exception as e:
        print(f"   ⚠️ Decision making failed: {e}", flush=True)
        return {
            "recommendation": "Consider",
            "confidence_score": 50,
            "reasoning": "Unable to generate recommendation",
            "key_factors": [],
            "suggestion": "Review manually"
        }


# =============================================================================
#                     BUILD THE GRAPH
# =============================================================================

def create_recruiter_decision_graph():
    """Create the LangGraph workflow"""
    
    workflow = StateGraph(RecruiterDecisionState)
    
    # Add nodes
    workflow.add_node("ats_analyzer", ats_analyzer_node)
    workflow.add_node("profile_matcher", profile_matcher_node)
    workflow.add_node("college_tier_analyzer", college_tier_analyzer_node)
    workflow.add_node("experience_evaluator", experience_evaluator_node)
    workflow.add_node("decision_maker", decision_maker_node)
    
    # Define edges
    workflow.add_edge(START, "ats_analyzer")
    workflow.add_edge("ats_analyzer", "profile_matcher")
    workflow.add_edge("profile_matcher", "college_tier_analyzer")
    workflow.add_edge("college_tier_analyzer", "experience_evaluator")
    workflow.add_edge("experience_evaluator", "decision_maker")
    workflow.add_edge("decision_maker", END)
    
    return workflow.compile()


# =============================================================================
#                     MAIN FUNCTION
# =============================================================================

def get_recruiter_decision(resume_data, job_data, agentic_score, agentic_details, project_analysis, application_id, candidate_name, ats_analysis=None):
    """
    Main function to get AI hiring recommendation
    
    Parameters:
    -----------
    resume_data: Candidate's resume data
    job_data: Job requirements
    agentic_score: Fit score (0-100)
    agentic_details: Fit score breakdown
    project_analysis: Project analysis results (can be pre-calculated)
    application_id: Application ID
    candidate_name: Candidate name
    ats_analysis: Pre-calculated ATS analysis (optional, to avoid duplicate work)
    
    Returns:
    --------
    Dict with recommendation, confidence, reasoning, etc.
    """
    try:
        # Create graph
        graph = create_recruiter_decision_graph()
        
        # Calculate project score from project analysis
        project_score = 0
        if project_analysis and project_analysis.get("relevantProjects"):
            relevant_projects = project_analysis.get("relevantProjects", [])
            if relevant_projects:
                # Average relevance score of top projects
                scores = [p.get("relevanceScore", 0) for p in relevant_projects[:3]]
                project_score = sum(scores) / len(scores) if scores else 0
        
        # Initial state (include pre-calculated ATS analysis if available)
        initial_state = {
            "messages": [],
            "resume_data": resume_data,
            "job_data": job_data,
            "application_id": application_id,
            "candidate_name": candidate_name,
            "agentic_score": agentic_score,
            "agentic_details": agentic_details,
            "project_score": project_score,
            "project_analysis": project_analysis,
            "ats_analysis": ats_analysis  # Pass pre-calculated ATS analysis
        }
        
        # If ATS analysis is provided, set the score
        if ats_analysis and ats_analysis.get("score") is not None:
            initial_state["ats_score"] = ats_analysis.get("score", 0)
        
        # Run the graph
        print("\n" + "="*60)
        print("🚀 STARTING RECRUITER DECISION WORKFLOW")
        print("="*60)
        
        result = graph.invoke(initial_state)
        
        print("\n" + "="*60)
        print("✅ WORKFLOW COMPLETE")
        print("="*60)
        
        return {
            "success": True,
            "recommendation": result.get("recommendation", "Consider"),
            "confidence_score": result.get("confidence_score", 0),
            "reasoning": result.get("reasoning", ""),
            "key_factors": result.get("key_factors", []),
            "strengths": result.get("strengths", []),
            "concerns": result.get("concerns", []),
            "suggestion": result.get("suggestion", ""),
            "analysis": {
                "ats_score": result.get("ats_score", 0),
                "ats_analysis": result.get("ats_analysis", {}),
                "profile_match_score": result.get("profile_match_score", 0),
                "profile_match_details": result.get("profile_match_details", {}),
                "college_tier": result.get("college_tier", "Unknown"),
                "college_details": result.get("college_details", {}),
                "experience_level": result.get("experience_level", "None"),
                "experience_details": result.get("experience_details", {}),
                "project_score": project_score,
                "agentic_score": agentic_score
            }
        }
    except Exception as e:
        print(f"\n❌ RECRUITER DECISION WORKFLOW ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "recommendation": "Consider",
            "confidence_score": 0,
            "reasoning": "Workflow failed, manual review recommended"
        }

