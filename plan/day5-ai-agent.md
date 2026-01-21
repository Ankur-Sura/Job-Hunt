# 📅 Day 5: AI Agent (LangGraph)

**Duration:** 6-8 hours  
**Goal:** Build an AI agent using LangGraph for interview preparation

---

## 🎯 What You'll Accomplish Today

By the end of Day 5, you will have:
- ✅ Understanding of LangGraph state machines
- ✅ Multi-node AI workflow for interview prep
- ✅ Web search integration with Tavily
- ✅ Company research automation
- ✅ Complete interview prep agent

---

## 📚 Table of Contents

1. [Understanding LangGraph](#1-understanding-langgraph)
2. [Setting Up LangGraph](#2-setting-up-langgraph)
3. [Creating the State Schema](#3-creating-the-state-schema)
4. [Building Node 1: Company Research](#4-building-node-1-company-research)
5. [Building Node 2: Interview Rounds Analysis](#5-building-node-2-interview-rounds-analysis)
6. [Building Node 3: Round-by-Round Prep](#6-building-node-3-round-by-round-prep)
7. [Building Node 4: Question Generator](#7-building-node-4-question-generator)
8. [Connecting the Graph](#8-connecting-the-graph)
9. [Creating the API Endpoint](#9-creating-the-api-endpoint)
10. [Testing the Agent](#10-testing-the-agent)

---

## 1. Understanding LangGraph

### 🔄 What is LangGraph?

LangGraph is a framework for building **stateful, multi-step AI workflows**. Think of it as a flow chart where each step (node) can:
- Call an LLM
- Search the web
- Process data
- Make decisions

### 📊 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                         STATE                               │
│  (Shared data that flows through all nodes)                │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │  Node 1  │──────▶│  Node 2  │──────▶│  Node 3  │
    │ Research │       │ Analysis │       │   Prep   │
    └──────────┘       └──────────┘       └──────────┘
```

### 🧩 Key Concepts

| Concept | What It Is | Example |
|---------|------------|---------|
| **State** | Shared data object | Resume, job info, results |
| **Node** | A function that processes state | Company research |
| **Edge** | Connection between nodes | Node 1 → Node 2 |
| **Graph** | The complete workflow | Interview prep agent |

### 🎯 Our Interview Prep Agent

```
Node 1: Company Research
    ↓ Search web for company info, interview experiences
Node 2: Interview Rounds Analysis  
    ↓ Determine what rounds to expect
Node 3: Round-by-Round Prep
    ↓ Generate prep for each round (DSA, Behavioral, System Design)
Node 4: Question Generator
    ↓ Generate practice questions
    ↓
OUTPUT: Complete interview prep guide
```

---

## 2. Setting Up LangGraph

### 2.1 Verify Installation

Make sure LangGraph is installed:

```bash
cd AI
source venv/bin/activate
pip install langgraph langchain langchain-openai tavily-python
```

### 2.2 Create the Interview Prep Graph File

Create `AI/interview_prep_graph.py`:

```python
"""
Interview Prep Graph - LangGraph-based interview preparation agent
"""

import os
from typing import TypedDict, List, Optional, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import json

# ============================================
# STATE DEFINITION
# ============================================

class InterviewPrepState(TypedDict):
    """
    State that flows through the interview prep graph.
    Each node can read from and write to this state.
    """
    # Input data
    resume_data: Dict[str, Any]      # User's resume
    job_data: Dict[str, Any]         # Job they applied to
    company: str                      # Company name
    role: str                         # Job title/role
    
    # Research results (Node 1)
    company_info: Optional[str]       # Company description
    interview_links: Optional[List[str]]  # Links to interview experiences
    
    # Analysis results (Node 2)
    interview_rounds: Optional[List[Dict[str, str]]]  # Expected rounds
    role_level: Optional[str]         # Junior/Mid/Senior
    
    # Prep content (Node 3)
    dsa_prep: Optional[Dict[str, Any]]        # DSA preparation
    behavioral_prep: Optional[Dict[str, Any]]  # Behavioral prep
    system_design_prep: Optional[Dict[str, Any]]  # System design
    
    # Questions (Node 4)
    common_questions: Optional[List[Dict[str, str]]]  # Common questions
    
    # Error tracking
    error: Optional[str]

# ============================================
# LLM SETUP
# ============================================

def get_llm(temperature: float = 0.7) -> ChatOpenAI:
    """Get a ChatOpenAI instance"""
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=temperature,
        api_key=os.getenv("OPENAI_API_KEY")
    )

# ============================================
# TAVILY WEB SEARCH
# ============================================

def search_web(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """
    Search the web using Tavily API
    
    Returns list of results with title, url, and content
    """
    try:
        from tavily import TavilyClient
        
        client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        
        response = client.search(
            query=query,
            max_results=max_results,
            include_answer=True
        )
        
        results = []
        for result in response.get("results", []):
            results.append({
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "content": result.get("content", "")[:500]  # Limit content
            })
        
        return results
        
    except Exception as e:
        print(f"Tavily search error: {e}")
        return []

# Rest of the code will be added in following sections...
```

---

## 3. Creating the State Schema

The state is already defined above. Let's understand each field:

### 📋 Input Fields

```python
# These come from the user's application
resume_data: Dict[str, Any]  # Parsed resume (skills, experience, etc.)
job_data: Dict[str, Any]     # Job details (requirements, description)
company: str                  # "Google", "Amazon", etc.
role: str                     # "Software Engineer", "SDE-1", etc.
```

### 📝 Processing Fields

```python
# Filled by Node 1: Company Research
company_info: str             # Brief company description
interview_links: List[str]    # URLs to interview experiences

# Filled by Node 2: Analysis
interview_rounds: List[Dict]  # ["Phone Screen", "DSA", "System Design"]
role_level: str              # "Fresher", "SDE-1", "SDE-2", "Senior"

# Filled by Node 3: Prep Content
dsa_prep: Dict               # DSA topics, questions, resources
behavioral_prep: Dict        # Stories, STAR format tips
system_design_prep: Dict     # Design concepts, practice problems

# Filled by Node 4: Questions
common_questions: List[Dict]  # Q&A pairs for practice
```

---

## 4. Building Node 1: Company Research

Add this to `interview_prep_graph.py`:

```python
# ============================================
# NODE 1: COMPANY RESEARCH
# ============================================

def company_research_node(state: InterviewPrepState) -> InterviewPrepState:
    """
    Node 1: Research the company and find interview experiences
    
    Tasks:
    1. Search for company information
    2. Find interview experiences for this company + role
    3. Collect useful links
    """
    try:
        company = state["company"]
        role = state["role"]
        
        print(f"🔍 Researching {company} for {role} position...")
        
        # Search for interview experiences
        query = f"{company} {role} interview experience questions"
        search_results = search_web(query, max_results=5)
        
        # Extract links
        interview_links = [r["url"] for r in search_results if r.get("url")][:8]
        
        # Compile search content for summary
        search_content = "\n".join([
            f"- {r['title']}: {r['content']}"
            for r in search_results
        ])
        
        # Use LLM to create company summary
        llm = get_llm(temperature=0.3)
        
        summary_prompt = f"""
        Based on the following search results about {company}, create a brief 
        company introduction for someone preparing for an interview.
        
        Include:
        - What the company does
        - Company culture and values
        - What they look for in candidates
        
        Search Results:
        {search_content}
        
        Keep it concise (150-200 words).
        """
        
        response = llm.invoke([
            SystemMessage(content="You are a helpful career advisor."),
            HumanMessage(content=summary_prompt)
        ])
        
        company_info = response.content
        
        print(f"✅ Found {len(interview_links)} interview resources")
        
        return {
            **state,
            "company_info": company_info,
            "interview_links": interview_links
        }
        
    except Exception as e:
        print(f"❌ Company research error: {e}")
        return {
            **state,
            "error": f"Company research failed: {str(e)}"
        }
```

---

## 5. Building Node 2: Interview Rounds Analysis

Add this to `interview_prep_graph.py`:

```python
# ============================================
# NODE 2: INTERVIEW ROUNDS ANALYSIS
# ============================================

def interview_rounds_analyzer_node(state: InterviewPrepState) -> InterviewPrepState:
    """
    Node 2: Analyze what interview rounds to expect
    
    Tasks:
    1. Determine role level (Fresher/Junior/Senior)
    2. Identify expected interview rounds
    3. Understand focus areas for each round
    """
    try:
        company = state["company"]
        role = state["role"]
        job_data = state.get("job_data", {})
        resume_data = state.get("resume_data", {})
        
        print(f"📊 Analyzing interview process for {role} at {company}...")
        
        # Calculate experience from resume
        experience_years = resume_data.get("total_experience_years", 0)
        
        # Determine role level
        if experience_years <= 1:
            role_level = "Fresher"
        elif experience_years <= 3:
            role_level = "SDE-1"
        elif experience_years <= 5:
            role_level = "SDE-2"
        else:
            role_level = "Senior"
        
        llm = get_llm(temperature=0.3)
        
        rounds_prompt = f"""
        For a {role} position at {company}, determine the typical interview process.
        
        Candidate Profile:
        - Experience: {experience_years} years
        - Level: {role_level}
        - Skills: {', '.join(resume_data.get('skills', [])[:10])}
        
        Job Requirements:
        {job_data.get('description', 'Not provided')[:500]}
        
        Return a JSON object with the interview rounds:
        {{
            "rounds": [
                {{
                    "name": "Phone Screen",
                    "duration": "30-45 mins",
                    "focus": "Background, basic technical questions",
                    "tips": "Brief tips for this round"
                }},
                // Add more rounds...
            ]
        }}
        
        Typical rounds for tech companies:
        - Phone Screen / HR Round
        - Online Assessment (OA)
        - Technical Phone Screen
        - DSA / Coding Rounds
        - System Design (for experienced)
        - Behavioral / Culture Fit
        - Hiring Manager Round
        
        Be specific to the company and role level.
        """
        
        response = llm.invoke([
            SystemMessage(content="You are an interview coach. Return only valid JSON."),
            HumanMessage(content=rounds_prompt)
        ])
        
        # Parse response
        try:
            content = response.content
            # Clean up markdown if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            rounds_data = json.loads(content)
            interview_rounds = rounds_data.get("rounds", [])
        except json.JSONDecodeError:
            # Fallback to default rounds
            interview_rounds = [
                {"name": "Phone Screen", "duration": "30 mins", "focus": "Introduction and basic questions"},
                {"name": "Technical Round", "duration": "60 mins", "focus": "DSA and coding"},
                {"name": "HR Round", "duration": "30 mins", "focus": "Behavioral and culture fit"}
            ]
        
        print(f"✅ Identified {len(interview_rounds)} interview rounds")
        
        return {
            **state,
            "interview_rounds": interview_rounds,
            "role_level": role_level
        }
        
    except Exception as e:
        print(f"❌ Interview analysis error: {e}")
        return {
            **state,
            "error": f"Interview analysis failed: {str(e)}",
            "role_level": "SDE-1",
            "interview_rounds": []
        }
```

---

## 6. Building Node 3: Round-by-Round Prep

Add this to `interview_prep_graph.py`:

```python
# ============================================
# NODE 3: ROUND-BY-ROUND PREPARATION
# ============================================

def round_by_round_prep_node(state: InterviewPrepState) -> InterviewPrepState:
    """
    Node 3: Generate detailed preparation for each round type
    
    Tasks:
    1. DSA Preparation (topics, questions, resources)
    2. Behavioral Preparation (STAR format, stories)
    3. System Design (if applicable for level)
    """
    try:
        company = state["company"]
        role = state["role"]
        role_level = state.get("role_level", "SDE-1")
        resume_data = state.get("resume_data", {})
        interview_rounds = state.get("interview_rounds", [])
        
        print(f"📚 Generating preparation content for {role_level}...")
        
        llm = get_llm(temperature=0.5)
        
        # ============================================
        # DSA PREPARATION
        # ============================================
        
        dsa_prompt = f"""
        Create DSA preparation guide for {role} at {company}.
        Level: {role_level}
        
        Candidate Skills: {', '.join(resume_data.get('skills', [])[:10])}
        
        Return JSON with:
        {{
            "must_know_topics": ["Arrays", "Strings", "Trees", ...],
            "key_concepts": ["Two Pointers", "Sliding Window", ...],
            "top_15_questions": [
                {{
                    "title": "Two Sum",
                    "difficulty": "Easy",
                    "topic": "Arrays",
                    "link": "https://leetcode.com/problems/two-sum/"
                }}
            ],
            "resources": [
                {{"name": "NeetCode 150", "url": "https://neetcode.io/practice"}}
            ]
        }}
        
        Focus on questions frequently asked at {company} based on current interview trends.
        Include exactly 15 questions.
        """
        
        dsa_response = llm.invoke([
            SystemMessage(content="You are a DSA interview coach. Return only valid JSON."),
            HumanMessage(content=dsa_prompt)
        ])
        
        try:
            content = dsa_response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            dsa_prep = json.loads(content)
        except:
            dsa_prep = {"must_know_topics": [], "key_concepts": [], "top_15_questions": [], "resources": []}
        
        # ============================================
        # BEHAVIORAL PREPARATION
        # ============================================
        
        behavioral_prompt = f"""
        Create behavioral interview preparation for {role} at {company}.
        
        Candidate Experience: {resume_data.get('experience', [])}
        
        Return JSON with:
        {{
            "stories_to_prepare": [
                {{
                    "type": "Leadership",
                    "example_question": "Tell me about a time you led a project",
                    "what_to_include": ["Problem you faced", "Your actions", "Results"]
                }}
            ],
            "common_questions": [
                {{
                    "question": "Why do you want to work at {company}?",
                    "what_they_look_for": "Genuine interest, research about company",
                    "tips": "Mention specific products or values"
                }}
            ],
            "star_format_tips": [
                "Situation: Set the context briefly",
                "Task: Explain your responsibility",
                "Action: Detail YOUR specific actions",
                "Result: Quantify the outcome"
            ]
        }}
        
        Include 6 story types and 10 common questions.
        """
        
        behavioral_response = llm.invoke([
            SystemMessage(content="You are a behavioral interview coach. Return only valid JSON."),
            HumanMessage(content=behavioral_prompt)
        ])
        
        try:
            content = behavioral_response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            behavioral_prep = json.loads(content)
        except:
            behavioral_prep = {"stories_to_prepare": [], "common_questions": [], "star_format_tips": []}
        
        # ============================================
        # SYSTEM DESIGN PREPARATION (Only for experienced roles)
        # ============================================
        
        if role_level in ["Fresher", "SDE-1"]:
            # Simpler guidance for juniors
            system_design_prep = {
                "sde1_guidance": {
                    "introduction": f"As a {role_level}, you typically won't face full system design rounds.",
                    "what_to_know": [
                        "Basic database concepts (SQL vs NoSQL)",
                        "REST API design basics",
                        "Client-server architecture",
                        "Caching basics"
                    ],
                    "time_allocation": "Focus 80% on DSA, 20% on basics",
                    "resources": [
                        {"name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}
                    ]
                }
            }
        else:
            # Full system design for senior roles
            sd_prompt = f"""
            Create system design preparation for {role_level} at {company}.
            
            Return JSON with:
            {{
                "concepts_to_know": ["Load Balancing", "Caching", ...],
                "practice_problems": [
                    {{
                        "name": "Design URL Shortener",
                        "difficulty": "Medium",
                        "key_concepts": ["Hashing", "Database design"]
                    }}
                ],
                "resources": [
                    {{"name": "Resource name", "url": "URL"}}
                ]
            }}
            """
            
            sd_response = llm.invoke([
                SystemMessage(content="You are a system design expert. Return only valid JSON."),
                HumanMessage(content=sd_prompt)
            ])
            
            try:
                content = sd_response.content
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                system_design_prep = json.loads(content)
            except:
                system_design_prep = {"concepts_to_know": [], "practice_problems": [], "resources": []}
        
        print("✅ Generated preparation content for all rounds")
        
        return {
            **state,
            "dsa_prep": dsa_prep,
            "behavioral_prep": behavioral_prep,
            "system_design_prep": system_design_prep
        }
        
    except Exception as e:
        print(f"❌ Prep generation error: {e}")
        return {
            **state,
            "error": f"Prep generation failed: {str(e)}",
            "dsa_prep": {},
            "behavioral_prep": {},
            "system_design_prep": {}
        }
```

---

## 7. Building Node 4: Question Generator

Add this to `interview_prep_graph.py`:

```python
# ============================================
# NODE 4: COMMON QUESTIONS GENERATOR
# ============================================

def question_generator_node(state: InterviewPrepState) -> InterviewPrepState:
    """
    Node 4: Generate common interview questions specific to the company/role
    
    These are general HR/screening questions, different from behavioral questions.
    """
    try:
        company = state["company"]
        role = state["role"]
        resume_data = state.get("resume_data", {})
        
        print(f"❓ Generating common interview questions for {company}...")
        
        # Static common questions (faster than LLM call)
        common_questions = [
            {
                "question": f"Tell me about yourself",
                "what_they_look_for": "Clear, concise summary of your background",
                "tips": "Keep it under 2 minutes. Focus on relevant experience."
            },
            {
                "question": f"Why do you want to work at {company}?",
                "what_they_look_for": "Genuine interest and research about the company",
                "tips": "Mention specific products, values, or recent news about the company."
            },
            {
                "question": f"Why are you interested in this {role} position?",
                "what_they_look_for": "Alignment between your skills and the role",
                "tips": "Connect your experience to job requirements."
            },
            {
                "question": "What are your greatest strengths?",
                "what_they_look_for": "Self-awareness and relevant skills",
                "tips": "Give specific examples that demonstrate each strength."
            },
            {
                "question": "What is your biggest weakness?",
                "what_they_look_for": "Self-awareness and growth mindset",
                "tips": "Choose a real weakness and explain how you're improving."
            },
            {
                "question": "Where do you see yourself in 5 years?",
                "what_they_look_for": "Ambition and commitment to the field",
                "tips": "Show growth aspirations aligned with the company."
            },
            {
                "question": "Do you have any questions for us?",
                "what_they_look_for": "Curiosity and engagement",
                "tips": "Always have 2-3 thoughtful questions prepared."
            },
            {
                "question": "What's your expected salary?",
                "what_they_look_for": "Reasonable expectations",
                "tips": "Research market rates. Give a range based on your research."
            },
            {
                "question": "When can you start?",
                "what_they_look_for": "Availability and current situation",
                "tips": "Be honest about notice period if currently employed."
            }
        ]
        
        print(f"✅ Generated {len(common_questions)} common questions")
        
        return {
            **state,
            "common_questions": common_questions
        }
        
    except Exception as e:
        print(f"❌ Question generation error: {e}")
        return {
            **state,
            "error": f"Question generation failed: {str(e)}",
            "common_questions": []
        }
```

---

## 8. Connecting the Graph

Add this to complete `interview_prep_graph.py`:

```python
# ============================================
# BUILD THE GRAPH
# ============================================

def build_interview_prep_graph() -> StateGraph:
    """
    Build and compile the interview preparation graph
    
    Flow: Research → Analyze → Prep → Questions → END
    """
    # Create the graph with our state schema
    graph = StateGraph(InterviewPrepState)
    
    # Add nodes
    graph.add_node("company_research", company_research_node)
    graph.add_node("interview_rounds", interview_rounds_analyzer_node)
    graph.add_node("round_prep", round_by_round_prep_node)
    graph.add_node("questions", question_generator_node)
    
    # Define the flow (edges)
    graph.set_entry_point("company_research")  # Start here
    graph.add_edge("company_research", "interview_rounds")
    graph.add_edge("interview_rounds", "round_prep")
    graph.add_edge("round_prep", "questions")
    graph.add_edge("questions", END)  # End here
    
    # Compile the graph
    compiled_graph = graph.compile()
    
    return compiled_graph

# ============================================
# MAIN FUNCTION TO RUN THE AGENT
# ============================================

async def prepare_interview(
    resume_data: Dict[str, Any],
    job_data: Dict[str, Any],
    company: str,
    role: str
) -> Dict[str, Any]:
    """
    Run the interview preparation agent
    
    Args:
        resume_data: User's parsed resume
        job_data: Job details
        company: Company name
        role: Job title/role
    
    Returns:
        Complete interview preparation guide
    """
    print(f"\n{'='*50}")
    print(f"🚀 Starting Interview Prep for {role} at {company}")
    print(f"{'='*50}\n")
    
    # Build the graph
    graph = build_interview_prep_graph()
    
    # Initial state
    initial_state: InterviewPrepState = {
        "resume_data": resume_data,
        "job_data": job_data,
        "company": company,
        "role": role,
        "company_info": None,
        "interview_links": None,
        "interview_rounds": None,
        "role_level": None,
        "dsa_prep": None,
        "behavioral_prep": None,
        "system_design_prep": None,
        "common_questions": None,
        "error": None
    }
    
    try:
        # Run the graph
        final_state = await graph.ainvoke(initial_state)
        
        print(f"\n{'='*50}")
        print(f"✅ Interview Prep Complete!")
        print(f"{'='*50}\n")
        
        # Return the relevant parts
        return {
            "success": True,
            "company_info": final_state.get("company_info"),
            "interview_links": final_state.get("interview_links", []),
            "interview_rounds": final_state.get("interview_rounds", []),
            "role_level": final_state.get("role_level"),
            "dsa_prep": final_state.get("dsa_prep", {}),
            "behavioral_prep": final_state.get("behavioral_prep", {}),
            "system_design_prep": final_state.get("system_design_prep", {}),
            "common_questions": final_state.get("common_questions", []),
            "error": final_state.get("error")
        }
        
    except Exception as e:
        print(f"❌ Graph execution error: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# ============================================
# TEST FUNCTION
# ============================================

if __name__ == "__main__":
    import asyncio
    
    # Test data
    test_resume = {
        "name": "John Doe",
        "skills": ["Python", "Java", "React", "Node.js", "SQL", "MongoDB"],
        "total_experience_years": 2,
        "experience": [
            {
                "title": "Software Engineer",
                "company": "Tech Corp",
                "duration": "2022 - Present"
            }
        ]
    }
    
    test_job = {
        "title": "Software Engineer",
        "company": "Google",
        "description": "Join our team to build scalable systems..."
    }
    
    # Run the agent
    result = asyncio.run(prepare_interview(
        resume_data=test_resume,
        job_data=test_job,
        company="Google",
        role="Software Engineer"
    ))
    
    print("\n📋 RESULT:")
    print(json.dumps(result, indent=2, default=str))
```

---

## 9. Creating the API Endpoint

Update `AI/main.py` to add the interview prep endpoint:

```python
# Add these imports at the top
from interview_prep_graph import prepare_interview

# Add this request model
class InterviewPrepRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_data: Dict[str, Any]
    company: str
    role: str

# Add this endpoint
@app.post("/prepare-interview")
async def interview_prep_endpoint(request: InterviewPrepRequest):
    """
    Generate comprehensive interview preparation
    
    Uses a multi-step AI agent to:
    1. Research the company
    2. Analyze interview rounds
    3. Generate preparation content
    4. Create practice questions
    """
    try:
        result = await prepare_interview(
            resume_data=request.resume_data,
            job_data=request.job_data,
            company=request.company,
            role=request.role
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 10. Testing the Agent

### 10.1 Run the Test Script

```bash
cd AI
source venv/bin/activate
python interview_prep_graph.py
```

You should see:
```
==================================================
🚀 Starting Interview Prep for Software Engineer at Google
==================================================

🔍 Researching Google for Software Engineer position...
✅ Found 8 interview resources
📊 Analyzing interview process for Software Engineer at Google...
✅ Identified 5 interview rounds
📚 Generating preparation content for SDE-1...
✅ Generated preparation content for all rounds
❓ Generating common interview questions for Google...
✅ Generated 9 common questions

==================================================
✅ Interview Prep Complete!
==================================================
```

### 10.2 Test via API

Start the AI service:
```bash
python main.py
```

Test with curl:
```bash
curl -X POST http://localhost:8001/prepare-interview \
  -H "Content-Type: application/json" \
  -d '{
    "resume_data": {
      "name": "John Doe",
      "skills": ["Python", "Java", "React"],
      "total_experience_years": 2
    },
    "job_data": {
      "title": "Software Engineer",
      "description": "Build scalable systems"
    },
    "company": "Google",
    "role": "Software Engineer"
  }'
```

### 10.3 Verification Checklist

| Feature | Test | Status |
|---------|------|--------|
| Tavily search works | No errors in Node 1 | ⬜ |
| Company info generated | Non-empty company_info | ⬜ |
| Interview rounds identified | List of rounds returned | ⬜ |
| DSA prep generated | Top 15 questions returned | ⬜ |
| Behavioral prep generated | Stories and questions returned | ⬜ |
| System design handled | Based on role level | ⬜ |
| Common questions generated | 9 questions returned | ⬜ |

---

## 🎉 Day 5 Complete!

You have successfully built:
- ✅ LangGraph state machine
- ✅ Multi-node AI workflow
- ✅ Web search integration with Tavily
- ✅ Company research automation
- ✅ Interview rounds analysis
- ✅ DSA, Behavioral, and System Design prep
- ✅ Complete interview prep agent

---

## 📖 What's Next?

Tomorrow in **Day 6**, you'll build AI Copilot features:
- Fit score calculation
- Batch processing for recommendations
- Recruiter AI tools (ATS, recommendations)

👉 **Continue to [Day 6: AI Copilot](./day6-copilot.md)**

