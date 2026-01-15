"""
===================================================================================
            INTERVIEW_PREP_GRAPH.PY - Comprehensive Interview Preparation
===================================================================================

📚 WHAT IS THIS FILE?
---------------------
This implements a multi-node LangGraph workflow for COMPREHENSIVE interview preparation.
Round-based approach: DSA (30 questions), System Design, Behavioral rounds.

📌 THE WORKFLOW (4 NODES):
---------------------------
START → company_research → interview_rounds_analyzer → 
        round_by_round_prep → question_generator → END

===================================================================================
"""

import os
import json
from datetime import datetime
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

# Initialize OpenAI with 4-minute timeout for complex generations (increased for Amazon/Google)
client = OpenAI(timeout=240.0)  # 240 second (4 min) timeout for API calls

# =============================================================================
#                           STATE DEFINITION
# =============================================================================

class InterviewPrepState(TypedDict):
    """Interview Preparation State with round-based structure"""
    messages: Annotated[list, add_messages]
    
    # Input data
    resume_data: Dict[str, Any]
    job_data: Dict[str, Any]
    application_id: str
    
    # Research outputs
    company_info: Optional[str]
    interview_links: Optional[List[Dict]]
    role_level: Optional[str]  # "Fresher", "SDE-1", "SDE-2", "Senior"
    
    # Round-based preparation
    interview_rounds: Optional[Dict]
    dsa_prep: Optional[Dict]
    system_design_prep: Optional[Dict]
    behavioral_prep: Optional[Dict]
    
    # Questions
    common_questions: Optional[List[Dict]]
    prepared_answers: Optional[List[Dict]]


# =============================================================================
#                     NODE 1: COMPANY RESEARCH + INTERVIEW LINKS
# =============================================================================

def company_research_node(state: InterviewPrepState) -> Dict[str, Any]:
    """
    Research company AND search for real interview experiences online.
    
    This node:
    1. Determines role level (Fresher/SDE-1/SDE-2/Senior)
    2. Searches for company interview process
    3. Searches for real interview experiences (Reddit, Glassdoor, Blind)
    4. Searches for coding questions asked at this company
    5. Generates company summary
    """
    import sys
    print("\n" + "="*60, flush=True)
    print("🏢 NODE 1: COMPANY RESEARCH + INTERVIEW LINKS", flush=True)
    print("="*60, flush=True)
    sys.stdout.flush()
    
    job_data = state.get("job_data", {})
    company = job_data.get("company", "")
    title = job_data.get("title", "Software Engineer")
    
    # Determine role level from title
    title_lower = title.lower()
    if 'sde 2' in title_lower or 'sde2' in title_lower or 'sde-2' in title_lower or 'ii' in title_lower or 'level 2' in title_lower:
        role_level = "SDE-2"
    elif 'sde 1' in title_lower or 'sde1' in title_lower or 'sde-1' in title_lower or 'junior' in title_lower or 'level 1' in title_lower:
        role_level = "SDE-1"
    elif 'senior' in title_lower or 'sde 3' in title_lower or 'lead' in title_lower or 'principal' in title_lower:
        role_level = "Senior"
    else:
        # Check experience requirements
        exp = job_data.get("experience", {}).get("display", "").lower() if isinstance(job_data.get("experience"), dict) else str(job_data.get("experience", "")).lower()
        if '0' in exp or 'fresher' in exp:
            role_level = "Fresher"
        elif '1' in exp or '2' in exp:
            role_level = "SDE-1"
        elif '3' in exp or '4' in exp or '5' in exp:
            role_level = "SDE-2"
        else:
            role_level = "SDE-1"  # Default
    
    print(f"   Detected Role Level: {role_level}")
    
    interview_links = []
    
    # Search with error handling to prevent hanging
    try:
        print("   🔍 Searching for company interview process...", flush=True)
        # Search 1: Company interview process
        process_query = f"{company} interview process rounds stages {title}"
        print(f"   Query: {process_query}", flush=True)
        process_results = smart_web_search(process_query, max_results=3)
        print(f"   ✅ Process search completed: {len(process_results.get('results', []))} results", flush=True)
    except Exception as e:
        print(f"   ⚠️ Process search failed: {e}", flush=True)
        process_results = {"results": []}
    
    try:
        print("   🔍 Searching for interview experiences on Reddit/Glassdoor...", flush=True)
        # Search 2: Real interview experiences (Reddit, Glassdoor, Blind)
        experience_query = f"{company} {role_level} interview experience questions reddit glassdoor blind teamblind"
        print(f"   Query: {experience_query}", flush=True)
        experience_results = smart_web_search(experience_query, max_results=4)
        print(f"   ✅ Experience search completed: {len(experience_results.get('results', []))} results", flush=True)
    except Exception as e:
        print(f"   ⚠️ Experience search failed: {e}", flush=True)
        experience_results = {"results": []}
    
    try:
        print("   🔍 Searching for LeetCode questions asked at company...", flush=True)
        # Search 3: LeetCode/GeeksforGeeks questions asked at this company
        coding_query = f"{company} {role_level} coding interview questions leetcode geeksforgeeks"
        print(f"   Query: {coding_query}", flush=True)
        coding_results = smart_web_search(coding_query, max_results=3)
        print(f"   ✅ Coding search completed: {len(coding_results.get('results', []))} results", flush=True)
    except Exception as e:
        print(f"   ⚠️ Coding search failed: {e}", flush=True)
        coding_results = {"results": []}
    
    # Extract links
    all_results = (process_results.get('results', []) + 
                   experience_results.get('results', []) + 
                   coding_results.get('results', []))
    
    for result in all_results:
        if result.get('url'):
            url = result.get('url', '')
            source = url.split('/')[2] if len(url.split('/')) > 2 else 'Unknown'
            # Prioritize Reddit, Glassdoor, LeetCode, Blind
            interview_links.append({
                "title": result.get('title', 'Interview Resource')[:100],
                "url": url,
                "source": source.replace('www.', ''),
                "snippet": result.get('content', result.get('snippet', ''))[:300],
                "type": "Interview Experience" if 'reddit' in url.lower() or 'glassdoor' in url.lower() else "Resource"
            })
    
    # Remove duplicates and limit to 8
    seen_urls = set()
    unique_links = []
    for link in interview_links:
        if link['url'] not in seen_urls:
            seen_urls.add(link['url'])
            unique_links.append(link)
    interview_links = unique_links[:8]
    
    # Summarize company info - keep it concise
    print("   📝 Generating company summary...", flush=True)
    summary_prompt = f"""
    Based on search results, provide a BRIEF overview of {company} for interview preparation:
    
    Results: {json.dumps(all_results[:4])}
    
    Include in 100-120 words ONLY:
    1. What {company} does (1 sentence)
    2. Interview focus areas for {role_level}
    3. Key tips for {company} interviews
    
    Be concise and specific.
    """
    
    try:
        summary = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": summary_prompt}],
            max_tokens=350
        )
        company_info = summary.choices[0].message.content
        print("   ✅ Company summary generated!", flush=True)
    except Exception as e:
        print(f"   ⚠️ OpenAI call failed: {e}", flush=True)
        company_info = f"Information about {company} interview process."
    
    print(f"✅ Found {len(interview_links)} interview resources online!")
    
    return {
        "company_info": company_info,
        "interview_links": interview_links,
        "role_level": role_level
    }


# =============================================================================
#                     NODE 2: INTERVIEW ROUNDS ANALYZER
# =============================================================================

def interview_rounds_analyzer_node(state: InterviewPrepState) -> Dict[str, Any]:
    """
    Analyze and structure the interview rounds for this company/role.
    
    This node determines:
    - How many rounds typically
    - What type each round is (DSA, System Design, Behavioral)
    - Duration and tips for each round
    """
    import time
    print("\n" + "="*60)
    print("📋 NODE 2: INTERVIEW ROUNDS ANALYZER")
    print("="*60)
    
    job_data = state.get("job_data", {})
    company = job_data.get("company", "")
    role_level = state.get("role_level", "SDE-1")
    
    # Search for specific round information
    try:
        rounds_query = f"{company} {role_level} interview rounds how many technical system design behavioral"
        rounds_results = smart_web_search(rounds_query, max_results=3)
    except:
        rounds_results = {"results": []}
    
    rounds_prompt = f"""
    Based on typical {company} interview process for {role_level} roles:
    
    Search Results: {json.dumps(rounds_results.get('results', [])[:3])}
    
    Provide the interview structure in this JSON format:
    {{
        "total_rounds": 4,
        "typical_duration": "2-4 weeks",
        "process_overview": "Detailed description of how the process works at {company}",
        "rounds": [
            {{
                "round_number": 1,
                "name": "Online Assessment / Phone Screen",
                "type": "DSA",
                "duration": "60-90 minutes",
                "what_to_expect": "Detailed description of what happens in this round",
                "format": "Online coding platform like HackerRank/Codility",
                "difficulty": "Medium",
                "tips": ["Practice time management", "Read question carefully", "Test edge cases"],
                "importance": "Screening round - must pass to proceed",
                "pass_rate": "30-40%"
            }},
            {{
                "round_number": 2,
                "name": "Technical Round 1",
                "type": "DSA",
                "duration": "45-60 minutes",
                "what_to_expect": "Live coding with interviewer, 1-2 problems",
                "format": "Video call with shared coding environment",
                "difficulty": "Medium to Hard",
                "tips": ["Think aloud", "Discuss approach before coding", "Ask clarifying questions"],
                "importance": "Core technical assessment",
                "pass_rate": "40-50%"
            }},
            {{
                "round_number": 3,
                "name": "Technical Round 2 / System Design",
                "type": "System Design",
                "duration": "45-60 minutes",
                "what_to_expect": "Design a system like URL shortener or chat app",
                "format": "Whiteboard or virtual whiteboard",
                "difficulty": "Varies by level",
                "tips": ["Start with requirements", "Discuss trade-offs", "Draw diagrams"],
                "importance": "Tests architectural thinking",
                "pass_rate": "50-60%"
            }},
            {{
                "round_number": 4,
                "name": "Behavioral / Bar Raiser",
                "type": "Behavioral",
                "duration": "45-60 minutes",
                "what_to_expect": "STAR method questions about past experiences",
                "format": "Conversation with senior engineer or manager",
                "difficulty": "N/A",
                "tips": ["Prepare 5-6 stories using STAR format", "Be specific with numbers"],
                "importance": "Culture fit and leadership assessment",
                "pass_rate": "60-70%"
            }}
        ]
    }}
    
    IMPORTANT:
    - For {role_level}, adjust rounds appropriately:
      - Fresher/SDE-1: 3-4 rounds, focus on DSA (60-70%), less/no system design, brief behavioral
      - SDE-2: 4-5 rounds, equal DSA and system design, more behavioral
      - Senior: 4-5 rounds, heavy system design, multiple behavioral rounds
    - Be specific to {company}'s known interview style
    - If Amazon, mention Leadership Principles prominently
    - If Google, mention Googleyness and team fit
    - If Microsoft, mention growth mindset
    - Include realistic pass rates
    """
    
    rounds_response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": rounds_prompt}]
    )
    
    try:
        interview_rounds = json.loads(rounds_response.choices[0].message.content)
    except:
        interview_rounds = {
            "total_rounds": 4,
            "typical_duration": "2-4 weeks",
            "rounds": []
        }
    
    print(f"✅ Identified {interview_rounds.get('total_rounds', 0)} interview rounds!")
    
    return {"interview_rounds": interview_rounds}


# =============================================================================
#                     NODE 3: ROUND-BY-ROUND PREPARATION (COMPREHENSIVE)
# =============================================================================

def round_by_round_prep_node(state: InterviewPrepState) -> Dict[str, Any]:
    """
    Prepare COMPREHENSIVE content for each round type:
    - DSA: 30 LeetCode questions with patterns
    - System Design: Concepts and common questions
    - Behavioral: STAR stories and company values
    """
    import time
    print("\n" + "="*60)
    print("🎯 NODE 3: ROUND-BY-ROUND PREPARATION (COMPREHENSIVE)")
    print("="*60)
    
    job_data = state.get("job_data", {})
    company = job_data.get("company", "")
    role_level = state.get("role_level", "SDE-1")
    interview_rounds = state.get("interview_rounds", {})
    
    dsa_prep = None
    system_design_prep = None
    behavioral_prep = None
    
    # Check what round types exist
    round_types = set()
    for round_info in interview_rounds.get("rounds", []):
        round_types.add(round_info.get("type", "").lower())
    
    # ========== DSA PREPARATION (15 FREQUENTLY ASKED QUESTIONS) ==========
    print("   📚 Preparing DSA content (15 frequently asked questions)...", flush=True)
    
    # Search for recent interview experiences and questions at this company
    try:
        dsa_query = f"{company} {role_level} interview questions 2024 2025 leetcode frequently asked"
        dsa_results = smart_web_search(dsa_query, max_results=3)
    except:
        dsa_results = {"results": []}
    
    # Determine difficulty based on role level
    if role_level == "Fresher":
        difficulty_focus = "Easy to Medium (70% Easy, 30% Medium)"
    elif role_level == "SDE-1":
        difficulty_focus = "Medium (80% Medium, 20% Easy)"
    elif role_level == "SDE-2":
        difficulty_focus = "Medium to Hard (60% Medium, 40% Hard)"
    else:
        difficulty_focus = "Hard (30% Medium, 70% Hard)"
    
    dsa_prompt = f"""
    Based on RECENT interview experiences at {company} for {role_level}:
    
    Search Results (Real Interview Data): {json.dumps(dsa_results.get('results', [])[:3])}
    
    Generate DSA preparation content. Return JSON:
    {{
        "difficulty_focus": "{difficulty_focus}",
        "coding_patterns": [
            {{"pattern": "Two Pointers", "when_to_use": "Sorted arrays, pairs", "problems": ["Two Sum II", "3Sum"]}},
            {{"pattern": "Sliding Window", "when_to_use": "Subarray problems", "problems": ["Max Subarray", "Longest Substring"]}},
            {{"pattern": "BFS/DFS", "when_to_use": "Trees, graphs", "problems": ["Level Order", "Number of Islands"]}},
            {{"pattern": "Dynamic Programming", "when_to_use": "Optimization", "problems": ["Coin Change", "LCS"]}},
            {{"pattern": "Binary Search", "when_to_use": "Sorted data", "problems": ["Search Rotated Array"]}}
        ],
        "must_know_topics": [
            {{"topic": "Arrays & Strings", "importance": "Very High"}},
            {{"topic": "Hash Maps", "importance": "Very High"}},
            {{"topic": "Trees", "importance": "High"}},
            {{"topic": "Graphs", "importance": "High"}},
            {{"topic": "DP", "importance": "High"}}
        ],
        "top_15_questions": [
            // Generate EXACTLY 15 questions based on search results
            // Focus on questions asked in 2024/2025 interviews
        ],
        "resources": [
            {{"name": "LeetCode {company} Tag", "url": "https://leetcode.com/company/{company.lower().replace(' ', '-')}/"}},
            {{"name": "NeetCode 150", "url": "https://neetcode.io/practice"}},
            {{"name": "Blind 75", "url": "https://leetcode.com/discuss/general-discussion/460599/"}}
        ]
    }}
    
    IMPORTANT:
    - Generate EXACTLY 15 questions in top_15_questions
    - Base questions on the search results (recent interview experiences)
    - Focus on FREQUENTLY asked questions at {company}
    - Include actual LeetCode links
    - Each question should have: id, question, difficulty, topic, link, approach, recently_asked
    """
    
    dsa_response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": dsa_prompt}],
        max_tokens=2500
    )
    
    try:
        dsa_prep = json.loads(dsa_response.choices[0].message.content)
    except:
        dsa_prep = {"top_15_questions": [], "must_know_topics": [], "coding_patterns": []}
    
    print(f"   ✅ Generated {len(dsa_prep.get('top_15_questions', []))} DSA questions!", flush=True)
    
    # ========== SYSTEM DESIGN PREPARATION ==========
    # Only do comprehensive system design for SDE-2 and Senior roles
    if role_level in ["SDE-2", "Senior"]:
        print("   🏗️ Preparing System Design content for senior role...", flush=True)
        
        try:
            sd_query = f"{company} {role_level} system design interview questions examples"
            sd_results = smart_web_search(sd_query, max_results=3)
        except:
            sd_results = {"results": []}
        
        sd_prompt = f"""
        Prepare COMPREHENSIVE System Design content for {role_level} at {company}:
        
        Search Results: {json.dumps(sd_results.get('results', [])[:3])}
        
        Return JSON:
        {{
            "level_expectation": "Detailed explanation of what's expected from {role_level} in system design rounds",
            "interview_format": {{
                "duration": "45-60 minutes",
                "structure": ["Requirements clarification (5 min)", "High-level design (15 min)", "Deep dive (20 min)", "Trade-offs discussion (10 min)", "Q&A (5 min)"]
            }},
            "common_questions": [
                {{
                    "question": "Design URL Shortener (like bit.ly)",
                    "difficulty": "Medium",
                    "time_to_solve": "45 minutes",
                    "why_asked": "Tests database design, hashing, caching, scaling",
                    "key_concepts": ["Hashing algorithms (MD5, Base62)", "Database sharding", "Caching with Redis", "Rate limiting"],
                    "approach_outline": [
                        "1. Clarify requirements: Read/Write ratio, scale, analytics needed?",
                        "2. API Design: POST /shorten, GET /:shortUrl",
                        "3. Database schema: URL table (id, shortUrl, longUrl, createdAt)",
                        "4. Hashing strategy: Base62 encoding of auto-increment ID or hash function",
                        "5. Caching: Redis for hot URLs",
                        "6. Scaling: Database sharding, CDN for static content"
                    ],
                    "follow_up_questions": ["How to handle hot URLs?", "How to add analytics?", "How to prevent abuse?"]
                }},
                {{
                    "question": "Design a Chat Application (like WhatsApp)",
                    "difficulty": "Hard",
                    "time_to_solve": "45 minutes",
                    "why_asked": "Tests real-time systems, message queues, presence",
                    "key_concepts": ["WebSockets", "Message queues (Kafka)", "Database (Cassandra)", "Presence service"],
                    "approach_outline": [
                        "1. Requirements: 1-1 chat, group chat, read receipts, online status",
                        "2. Real-time: WebSocket connections",
                        "3. Message flow: Client → Gateway → Message Service → Queue → Recipient",
                        "4. Storage: Cassandra for messages (partition by chat_id)",
                        "5. Presence: Heartbeat mechanism",
                        "6. Scaling: Connection servers, message partitioning"
                    ],
                    "follow_up_questions": ["How to handle offline users?", "Message encryption?", "Group scaling?"]
                }},
                {{
                    "question": "Design a Rate Limiter",
                    "difficulty": "Medium",
                    "time_to_solve": "30 minutes",
                    "why_asked": "Tests API design, distributed systems, algorithms",
                    "key_concepts": ["Token bucket", "Sliding window", "Distributed counting", "Redis"],
                    "approach_outline": [
                        "1. Requirements: Rate by user/IP, time window, threshold",
                        "2. Algorithms: Token bucket, Fixed window, Sliding window log",
                        "3. Storage: Redis for counters",
                        "4. Distributed: Sync across servers",
                        "5. Response: 429 Too Many Requests"
                    ],
                    "follow_up_questions": ["Race conditions?", "Different limits per endpoint?"]
                }}
            ],
            "concepts_to_know": [
                {{"concept": "Load Balancing", "why": "Distribute traffic across servers", "tools": "Nginx, HAProxy, AWS ELB", "when_to_use": "Multiple backend servers"}},
                {{"concept": "Caching", "why": "Reduce database load, faster reads", "tools": "Redis, Memcached", "when_to_use": "Read-heavy workloads"}},
                {{"concept": "Database Sharding", "why": "Horizontal scaling for large datasets", "tools": "Vitess, Custom sharding", "when_to_use": "Single DB can't handle load"}},
                {{"concept": "CAP Theorem", "why": "Understanding distributed systems trade-offs", "tools": "N/A - concept", "when_to_use": "Choosing between consistency and availability"}},
                {{"concept": "Message Queues", "why": "Async processing, decoupling services", "tools": "Kafka, RabbitMQ, SQS", "when_to_use": "Background jobs, event streaming"}},
                {{"concept": "CDN", "why": "Serve static content from edge locations", "tools": "Cloudflare, CloudFront", "when_to_use": "Static assets, global users"}},
                {{"concept": "Database Replication", "why": "High availability, read scaling", "tools": "MySQL replication, Postgres streaming", "when_to_use": "Read replicas, failover"}},
                {{"concept": "Consistent Hashing", "why": "Minimize redistribution when adding nodes", "tools": "Custom implementation", "when_to_use": "Distributed caching, sharding"}}
            ],
            "resources": [
                {{"name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "type": "GitHub", "must_read": true}},
                {{"name": "Grokking System Design", "url": "https://www.educative.io/courses/grokking-the-system-design-interview", "type": "Course", "must_read": true}},
                {{"name": "ByteByteGo", "url": "https://bytebytego.com/", "type": "Newsletter", "must_read": true}},
                {{"name": "System Design YouTube", "url": "https://www.youtube.com/c/SystemDesignInterview", "type": "Video", "must_read": false}},
                {{"name": "Designing Data-Intensive Applications", "url": "https://dataintensive.net/", "type": "Book", "must_read": true}}
            ]
        }}
        
        For {role_level}:
        - SDE-2: Focus on High Level Design (HLD), basic scaling concepts
        - Senior: Include Low Level Design (LLD), deep trade-off discussions
        Include at least 5 common questions.
        """
        
        sd_response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
            messages=[{"role": "user", "content": sd_prompt}],
            max_tokens=3000
    )
    
        try:
            system_design_prep = json.loads(sd_response.choices[0].message.content)
        except:
            system_design_prep = {"common_questions": [], "concepts_to_know": []}
        
        print(f"   ✅ Generated System Design content!", flush=True)
    else:
        # For Fresher/SDE-1, provide guidance but less depth
        print(f"   ℹ️ System Design is less important for {role_level}...", flush=True)
        system_design_prep = {
            "level_expectation": f"🎯 FOR {role_level}:\nSystem Design is typically NOT a major focus in your interviews.\n💡 WHAT TO KNOW:\n1. Client-Server architecture\n2. Database, cache (Redis), load balancer basics\n3. REST API basics\n4. Horizontal vs vertical scaling\n⏰ WHERE TO SPEND YOUR TIME:\n- Focus 80% of prep on DSA\n- Learn system design basics (1-2 hours)\n- Don't stress about complex distributed systems",
            "sde1_guidance": {
                "focus_areas": [
                    {"area": "🎯 Interview Focus", "description": "70-80% on DSA, only basic architecture questions"},
                    {"area": "💡 What to Know", "items": ["Client-Server architecture", "Database, cache (Redis), load balancer", "REST API basics", "Horizontal vs vertical scaling"]},
                    {"area": "⏰ Time Allocation", "items": ["Focus 80% prep time on DSA", "Learn system design basics (1-2 hours)", "Don't stress about complex distributed systems"]}
                ],
                "quick_resources": [
                    {"name": "System Design for Beginners (YouTube)", "time": "30 min"},
                    {"name": "System Design Primer - Intro chapter", "time": "1 hour"}
                ]
            },
            "common_questions": [],
            "concepts_to_know": [
                {"concept": "REST API", "why": "Basic client-server communication"},
                {"concept": "Caching", "why": "Speed up repeated requests with Redis"},
                {"concept": "Database", "why": "SQL vs NoSQL - when to use each"},
                {"concept": "Load Balancer", "why": "Distribute traffic across servers"}
            ],
            "resources": [
                {"name": "System Design for Beginners", "url": "https://www.youtube.com/watch?v=MbjObHmDbZo", "type": "Video", "must_read": False}
            ],
            "skip_deep_dive": True
        }
    
    # ========== BEHAVIORAL PREPARATION ==========
    print("   💼 Preparing Behavioral content...", flush=True)
    
    # Skip web search for behavioral to speed up
    behav_results = {"results": []}
    
    behav_prompt = f"""
    Generate behavioral interview prep for {company}. Return JSON with this EXACT structure:
    {{
        "star_framework": {{
            "S": "Situation - Set the context with specific details",
            "T": "Task - Your responsibility or goal", 
            "A": "Action - What YOU specifically did (use 'I' not 'we')",
            "R": "Result - Quantifiable outcome with metrics"
        }},
        "common_questions": [
            {{
                "question": "Tell me about yourself",
                "what_they_look_for": "Clear communication, relevant background, enthusiasm for the role",
                "tips": "Use Present-Past-Future: Current skills → Past experience → Why this role"
            }},
            {{
                "question": "Why {company}?",
                "what_they_look_for": "Research, genuine interest, cultural fit",
                "tips": "Mention specific products, company values, growth opportunities"
            }},
            {{
                "question": "Describe a time you disagreed with your manager",
                "what_they_look_for": "Conflict resolution, professionalism, maturity",
                "tips": "Focus on the resolution and what you learned, not the conflict"
            }},
            {{
                "question": "Tell me about a failure or mistake",
                "what_they_look_for": "Self-awareness, accountability, growth mindset",
                "tips": "Own the mistake, explain what you learned, show how you improved"
            }},
            {{
                "question": "Describe a leadership experience",
                "what_they_look_for": "Initiative, influence, team motivation",
                "tips": "Leadership isn't about title - show how you took initiative"
            }},
            {{
                "question": "Tell me about your most challenging project",
                "what_they_look_for": "Problem-solving, perseverance, technical depth",
                "tips": "Use specific metrics: 'reduced latency by 40%', 'handled 10K requests'"
            }},
            {{
                "question": "How do you handle tight deadlines?",
                "what_they_look_for": "Prioritization, time management, calm under pressure",
                "tips": "Show how you prioritize, communicate, and deliver quality work"
            }},
            {{
                "question": "Describe a time you went above and beyond",
                "what_they_look_for": "Dedication, ownership, impact",
                "tips": "Show initiative and the measurable impact of your extra effort"
            }},
            {{
                "question": "How do you handle feedback or criticism?",
                "what_they_look_for": "Openness, growth mindset, emotional intelligence",
                "tips": "Give example of implementing feedback and improving"
            }},
            {{
                "question": "Tell me about working with a difficult team member",
                "what_they_look_for": "Empathy, communication, collaboration",
                "tips": "Focus on understanding their perspective and finding common ground"
            }}
        ],
        "stories_to_prepare": [
            {{"story_type": "Leadership Story", "example_questions": ["Tell me about a time you led a project", "Describe when you took initiative without being asked"], "what_to_include": "The challenge, your actions, team coordination, measurable outcome"}},
            {{"story_type": "Conflict Resolution Story", "example_questions": ["Describe a disagreement with a colleague", "How did you handle a conflict at work?"], "what_to_include": "The situation, your approach, how you resolved it professionally"}},
            {{"story_type": "Failure/Learning Story", "example_questions": ["Tell me about a mistake you made", "What's your biggest professional failure?"], "what_to_include": "What went wrong, your accountability, what you learned, how you improved"}},
            {{"story_type": "Achievement Story", "example_questions": ["What's your proudest accomplishment?", "Describe when you exceeded expectations"], "what_to_include": "The challenge, your specific contributions, quantifiable results"}},
            {{"story_type": "Pressure/Deadline Story", "example_questions": ["How do you handle stress?", "Tell me about a tight deadline"], "what_to_include": "The pressure situation, how you prioritized, the successful outcome"}},
            {{"story_type": "Customer/Stakeholder Story", "example_questions": ["Tell me about going above and beyond for a user", "How do you handle difficult stakeholders?"], "what_to_include": "Understanding their needs, your actions, positive impact"}}
        ],
        "tips": [
            "Use specific numbers and metrics ('improved performance by 40%', 'reduced bugs by 60%')",
            "Focus on YOUR actions - use 'I' instead of 'we' to show your contribution",
            "Keep answers to 2-3 minutes - be concise but complete",
            "Always end stories on a positive note with results",
            "Prepare 5-6 versatile stories that can answer multiple question types"
        ]
    }}
    """
    
    behav_response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": behav_prompt}],
        max_tokens=2500  # Reduced for faster response
    )
    
    try:
        behavioral_prep = json.loads(behav_response.choices[0].message.content)
    except:
        behavioral_prep = {"common_questions": [], "stories_to_prepare": [], "tips_for_success": []}
    
    print(f"   ✅ Generated Behavioral content with {len(behavioral_prep.get('common_questions', []))} questions!")
    print(f"✅ Round preparation complete!")
    
    return {
        "dsa_prep": dsa_prep,
        "system_design_prep": system_design_prep,
        "behavioral_prep": behavioral_prep
    }


# =============================================================================
#                     NODE 4: COMMON QUESTIONS GENERATOR
# =============================================================================

def question_generator_node(state: InterviewPrepState) -> Dict[str, Any]:
    """Generate common questions - FAST version using static data"""
    print("\n" + "="*60)
    print("❓ NODE 4: COMMON QUESTIONS (FAST)")
    print("="*60)
    
    job_data = state.get("job_data", {})
    company = job_data.get("company", "Company")
    role_level = state.get("role_level", "SDE-1")
    
    # HR/Screening questions different from behavioral questions
    common_questions = [
        {"question": "What are your salary expectations?", "category": "Compensation", "how_to_answer": "Research market rate, give a range, say 'negotiable based on total compensation'"},
        {"question": "What is your notice period?", "category": "Availability", "how_to_answer": "Be honest, mention if negotiable with current employer"},
        {"question": "Are you interviewing with other companies?", "category": "Interest", "how_to_answer": "Be honest but show " + company + " is your top choice"},
        {"question": "Why should we hire you?", "category": "Value Proposition", "how_to_answer": "Match your skills to job requirements, mention unique value you bring"},
        {"question": "What motivates you?", "category": "Motivation", "how_to_answer": "Connect to the role - learning, impact, solving problems"},
        {"question": "How do you stay updated with technology?", "category": "Learning", "how_to_answer": "Mention blogs, courses, side projects, open source contributions"},
        {"question": "Describe your ideal work environment", "category": "Culture Fit", "how_to_answer": "Research " + company + "'s culture, align your preferences"},
        {"question": "What do you know about " + company + "?", "category": "Research", "how_to_answer": "Mention products, recent news, company values, growth"},
        {"question": "Do you prefer working alone or in a team?", "category": "Work Style", "how_to_answer": "Show flexibility - both have value, give examples of each"}
    ]
    
    questions_to_ask = [
        {"question": "What does success look like in the first 90 days?", "why_ask": "Shows you care about impact"},
        {"question": "What are the team's biggest challenges?", "why_ask": "Shows problem-solving interest"},
        {"question": "What do you enjoy most about working here?", "why_ask": "Gets honest insight"}
    ]
    
    print(f"✅ Generated {len(common_questions)} common questions (fast mode)!")
    
    return {
        "common_questions": common_questions,
        "prepared_answers": questions_to_ask
    }


# =============================================================================
#                     BUILD THE GRAPH
# =============================================================================

def build_interview_prep_graph():
    """Build the comprehensive interview preparation graph"""
    workflow = StateGraph(InterviewPrepState)
    
    # Add nodes (4 nodes)
    workflow.add_node("company_research", company_research_node)
    workflow.add_node("interview_rounds_analyzer", interview_rounds_analyzer_node)
    workflow.add_node("round_by_round_prep", round_by_round_prep_node)
    workflow.add_node("question_generator", question_generator_node)
    
    # Define the flow
    workflow.set_entry_point("company_research")
    workflow.add_edge("company_research", "interview_rounds_analyzer")
    workflow.add_edge("interview_rounds_analyzer", "round_by_round_prep")
    workflow.add_edge("round_by_round_prep", "question_generator")
    workflow.add_edge("question_generator", END)
    
    return workflow.compile()


# =============================================================================
#                     MAIN EXECUTION (for testing)
# =============================================================================

if __name__ == "__main__":
    print("🚀 Building Interview Prep Graph...")
    graph = build_interview_prep_graph()
    print("✅ Graph built successfully!")
    print("\nGraph structure:")
    print(graph.get_graph().draw_mermaid())
