# 📅 Day 4: AI Foundation

**Duration:** 6-8 hours  
**Goal:** Build the Python AI service with OpenAI integration, resume parsing, and vector database

---

## 🎯 What You'll Accomplish Today

By the end of Day 4, you will have:
- ✅ FastAPI server running
- ✅ OpenAI API integration working
- ✅ Resume PDF parsing with AI extraction
- ✅ Qdrant vector database setup
- ✅ Resume embedding and storage

---

## 📚 Table of Contents

1. [Understanding AI Concepts](#1-understanding-ai-concepts)
2. [Setting Up FastAPI](#2-setting-up-fastapi)
3. [OpenAI Integration](#3-openai-integration)
4. [Resume PDF Parsing](#4-resume-pdf-parsing)
5. [AI-Powered Resume Extraction](#5-ai-powered-resume-extraction)
6. [Qdrant Vector Database](#6-qdrant-vector-database)
7. [Creating Embeddings](#7-creating-embeddings)
8. [Building the Resume API](#8-building-the-resume-api)
9. [Connecting to Backend](#9-connecting-to-backend)
10. [Testing the AI Service](#10-testing-the-ai-service)

---

## 1. Understanding AI Concepts

### 🧠 Key AI Concepts

| Concept | What It Is | Why We Need It |
|---------|------------|----------------|
| **LLM** | Large Language Model (GPT-4) | Understands and generates text |
| **Embeddings** | Numerical representation of text | For similarity search |
| **Vector Database** | Stores embeddings | Fast similarity search |
| **RAG** | Retrieval Augmented Generation | Combines search + LLM |
| **Prompt Engineering** | Crafting instructions for AI | Get accurate responses |

### 📊 How Resume Processing Works

```
PDF Upload → Extract Text → Send to GPT-4 → Parse JSON → Store in DB
                                               ↓
                              Create Embedding → Store in Qdrant
```

### 🔄 How Job Matching Works

```
User's Resume Embedding → Compare with Job Requirements → Calculate Fit Score
```

---

## 2. Setting Up FastAPI

### 2.1 Create Virtual Environment

```bash
cd AI

# Create virtual environment
python3 -m venv venv

# Activate it
# Mac/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate

# You should see (venv) in your terminal
```

### 2.2 Create Requirements File

Create `AI/requirements.txt`:

```txt
# Web Framework
fastapi>=0.104.0
uvicorn>=0.24.0
python-multipart>=0.0.6

# Environment
python-dotenv>=1.0.0

# OpenAI
openai>=1.3.0

# LangChain (for AI orchestration)
langchain>=0.1.0
langchain-openai>=0.0.5
langgraph>=0.2.0

# Vector Database
qdrant-client>=1.6.0

# MongoDB
pymongo>=4.6.0

# PDF Processing
pypdf>=3.17.0

# HTTP Client
httpx>=0.25.0

# Data Validation
pydantic>=2.5.0

# Web Search
tavily-python>=0.3.0
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 2.3 Create Environment File

Create `AI/.env`:

```env
# Server
PORT=8001

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Tavily (for web search)
TAVILY_API_KEY=tvly-your-tavily-api-key-here

# Qdrant Vector Database
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key-here

# MongoDB (same as backend)
MONGO_URI=mongodb://localhost:27017/jobportal
```

### 2.4 Create Main FastAPI Server

Create `AI/main.py`:

```python
"""
AI Service - FastAPI Server
Handles resume parsing, fit scores, and interview preparation
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Job Portal AI Service",
    description="AI-powered features for job matching and interview prep",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health_check():
    """Check if the AI service is running and configured properly"""
    return {
        "status": "ok",
        "message": "AI Service is running!",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "qdrant_configured": bool(os.getenv("QDRANT_URL")),
        "tavily_configured": bool(os.getenv("TAVILY_API_KEY"))
    }

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class ResumeExtractRequest(BaseModel):
    """Request model for resume extraction"""
    text: str  # Raw text from PDF
    
class ResumeExtractResponse(BaseModel):
    """Response model for extracted resume data"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class FitScoreRequest(BaseModel):
    """Request model for fit score calculation"""
    resume_data: Dict[str, Any]
    job_data: Dict[str, Any]

class FitScoreResponse(BaseModel):
    """Response model for fit score"""
    overall_score: int
    breakdown: Dict[str, int]
    recommendation: str

# ============================================
# PLACEHOLDER ENDPOINTS (Will implement in sections below)
# ============================================

@app.post("/extract-resume", response_model=ResumeExtractResponse)
async def extract_resume(request: ResumeExtractRequest):
    """Extract structured data from resume text using AI"""
    # Will implement in Section 5
    return {"success": False, "error": "Not implemented yet"}

@app.post("/calculate-fit-score", response_model=FitScoreResponse)
async def calculate_fit_score(request: FitScoreRequest):
    """Calculate fit score between resume and job"""
    # Will implement in Day 6
    return {
        "overall_score": 0,
        "breakdown": {},
        "recommendation": "Not implemented yet"
    }

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    print(f"🚀 Starting AI Service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### 2.5 Test FastAPI Server

```bash
# Make sure venv is activated
python main.py

# In another terminal:
curl http://localhost:8001/health
```

You should see:
```json
{
  "status": "ok",
  "message": "AI Service is running!",
  "openai_configured": true,
  "qdrant_configured": true,
  "tavily_configured": true
}
```

✅ **Checkpoint:** FastAPI server is running on port 8001

---

## 3. OpenAI Integration

### 3.1 Create OpenAI Service

Create `AI/openai_service.py`:

```python
"""
OpenAI Service - Handles all OpenAI API interactions
"""

import os
import json
from openai import OpenAI
from typing import Dict, Any, Optional

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Default model to use
DEFAULT_MODEL = "gpt-4o-mini"  # Faster and cheaper than gpt-4

def get_completion(
    prompt: str,
    system_prompt: str = "You are a helpful assistant.",
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 2000,
    json_mode: bool = False
) -> str:
    """
    Get a completion from OpenAI
    
    Args:
        prompt: The user's prompt/question
        system_prompt: System instructions for the AI
        model: Which model to use
        temperature: Creativity (0=focused, 1=creative)
        max_tokens: Maximum response length
        json_mode: If True, ensures valid JSON response
    
    Returns:
        The AI's response as a string
    """
    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        # Configure request
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        # Enable JSON mode if requested
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        
        # Make API call
        response = client.chat.completions.create(**kwargs)
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"OpenAI error: {e}")
        raise

def get_json_completion(
    prompt: str,
    system_prompt: str = "You are a helpful assistant. Always respond with valid JSON.",
    model: str = DEFAULT_MODEL,
    temperature: float = 0.3,  # Lower temperature for structured output
    max_tokens: int = 2000
) -> Dict[str, Any]:
    """
    Get a JSON response from OpenAI
    
    Returns:
        Parsed JSON as a dictionary
    """
    response = get_completion(
        prompt=prompt,
        system_prompt=system_prompt,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        json_mode=True
    )
    
    return json.loads(response)

def create_embedding(text: str, model: str = "text-embedding-3-small") -> list:
    """
    Create an embedding vector for text
    
    Args:
        text: The text to embed
        model: Embedding model to use
    
    Returns:
        Embedding vector as a list of floats
    """
    try:
        response = client.embeddings.create(
            model=model,
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding error: {e}")
        raise
```

### 3.2 Test OpenAI Integration

Create a test file `AI/test_openai.py`:

```python
"""Test OpenAI integration"""

import os
from dotenv import load_dotenv
load_dotenv()

from openai_service import get_completion, get_json_completion, create_embedding

def test_completion():
    print("Testing basic completion...")
    response = get_completion("What is Python programming?")
    print(f"Response: {response[:200]}...")
    print("✅ Basic completion works!\n")

def test_json_completion():
    print("Testing JSON completion...")
    response = get_json_completion(
        "List 3 programming languages with their main uses. Return as JSON with 'languages' array.",
        system_prompt="Return valid JSON only."
    )
    print(f"Response: {response}")
    print("✅ JSON completion works!\n")

def test_embedding():
    print("Testing embedding...")
    embedding = create_embedding("Software Engineer with Python experience")
    print(f"Embedding length: {len(embedding)}")
    print(f"First 5 values: {embedding[:5]}")
    print("✅ Embedding works!\n")

if __name__ == "__main__":
    test_completion()
    test_json_completion()
    test_embedding()
    print("🎉 All OpenAI tests passed!")
```

Run the test:

```bash
python test_openai.py
```

✅ **Checkpoint:** OpenAI integration is working

---

## 4. Resume PDF Parsing

### 4.1 Create PDF Parser

Create `AI/pdf_parser.py`:

```python
"""
PDF Parser - Extracts text from PDF files
"""

import io
from pypdf import PdfReader
from typing import Optional

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Extract text from a PDF file
    
    Args:
        pdf_content: PDF file as bytes
    
    Returns:
        Extracted text as string
    """
    try:
        # Create a file-like object from bytes
        pdf_file = io.BytesIO(pdf_content)
        
        # Read PDF
        reader = PdfReader(pdf_file)
        
        # Extract text from all pages
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        # Join all text
        full_text = "\n".join(text_parts)
        
        # Clean up whitespace
        full_text = " ".join(full_text.split())
        
        return full_text
        
    except Exception as e:
        print(f"PDF parsing error: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def clean_resume_text(text: str) -> str:
    """
    Clean up extracted resume text
    
    Args:
        text: Raw extracted text
    
    Returns:
        Cleaned text
    """
    # Remove excessive whitespace
    text = " ".join(text.split())
    
    # Remove common PDF artifacts
    text = text.replace("", "")
    text = text.replace("•", "-")
    
    # Limit length (OpenAI has token limits)
    max_chars = 15000  # ~3750 tokens
    if len(text) > max_chars:
        text = text[:max_chars] + "..."
    
    return text
```

### 4.2 Add PDF Upload Endpoint

Update `AI/main.py` to add the PDF upload endpoint:

```python
# Add this import at the top
from pdf_parser import extract_text_from_pdf, clean_resume_text

# Add this endpoint after the health check

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Upload and parse a PDF resume
    
    Returns extracted text and structured data
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        # Read file content
        content = await file.read()
        
        # Extract text from PDF
        raw_text = extract_text_from_pdf(content)
        cleaned_text = clean_resume_text(raw_text)
        
        if not cleaned_text or len(cleaned_text) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from PDF. Please ensure it's not an image-only PDF."
            )
        
        return {
            "success": True,
            "text": cleaned_text,
            "characters": len(cleaned_text)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
```

---

## 5. AI-Powered Resume Extraction

### 5.1 Create Resume Extractor

Create `AI/resume_extractor.py`:

```python
"""
Resume Extractor - Uses AI to extract structured data from resume text
"""

import json
from openai_service import get_json_completion

# The prompt that tells AI how to extract resume data
EXTRACTION_PROMPT = """
Analyze the following resume text and extract structured information.
Return a JSON object with these fields:

{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number",
  "location": "City, State/Country",
  "summary": "Brief professional summary (2-3 sentences)",
  "skills": ["skill1", "skill2", ...],  // Technical and soft skills
  "experience": [
    {
      "title": "Job title",
      "company": "Company name",
      "location": "Location",
      "duration": "Start - End (e.g., 'Jan 2020 - Present')",
      "description": "Brief description of role and achievements",
      "domain": "Industry/Domain (e.g., 'IT', 'Marketing', 'Healthcare', 'Finance')"
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "institution": "School/University name",
      "year": "Graduation year",
      "gpa": "GPA if mentioned"
    }
  ],
  "certifications": ["cert1", "cert2", ...],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "languages": ["English", "Spanish", ...],
  "total_experience_years": 2.5  // Estimated total years of experience
}

IMPORTANT RULES:
1. Only include information that's actually in the resume
2. If something is not found, use null or empty array
3. Be accurate - don't make up information
4. For experience duration, extract exactly as written
5. Skills should be individual items (split "Python, Java" into ["Python", "Java"])
6. Domain should identify what industry/field the experience is in

Resume Text:
{resume_text}
"""

def extract_resume_data(resume_text: str) -> dict:
    """
    Extract structured data from resume text using AI
    
    Args:
        resume_text: Plain text extracted from PDF
    
    Returns:
        Dictionary with structured resume data
    """
    try:
        # Create the prompt
        prompt = EXTRACTION_PROMPT.format(resume_text=resume_text)
        
        # System prompt for the AI
        system_prompt = """You are an expert resume parser. 
        Extract information accurately from the provided resume text.
        Always respond with valid JSON only.
        Do not make up any information - only extract what's present."""
        
        # Get AI response
        result = get_json_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.1,  # Very low for accuracy
            max_tokens=3000
        )
        
        # Validate required fields
        required_fields = ['name', 'skills', 'experience', 'education']
        for field in required_fields:
            if field not in result:
                result[field] = None if field == 'name' else []
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        raise ValueError("AI returned invalid JSON")
    except Exception as e:
        print(f"Resume extraction error: {e}")
        raise

def calculate_experience_years(experience: list) -> float:
    """
    Calculate total years of experience from experience list
    
    Args:
        experience: List of experience dictionaries
    
    Returns:
        Estimated years of experience
    """
    # This is a simplified calculation
    # In production, you'd parse duration strings more carefully
    total_months = 0
    
    for exp in experience:
        duration = exp.get('duration', '')
        
        # Simple heuristics
        if 'Present' in duration or 'Current' in duration:
            total_months += 12  # Assume at least 1 year for current roles
        elif '-' in duration:
            # Try to estimate based on duration string
            total_months += 18  # Average job tenure
        else:
            total_months += 12
    
    return round(total_months / 12, 1)
```

### 5.2 Update Extract Resume Endpoint

Update the `/extract-resume` endpoint in `AI/main.py`:

```python
# Add import at top
from resume_extractor import extract_resume_data

# Update the endpoint
@app.post("/extract-resume", response_model=ResumeExtractResponse)
async def extract_resume(request: ResumeExtractRequest):
    """Extract structured data from resume text using AI"""
    try:
        if not request.text or len(request.text) < 50:
            return {
                "success": False,
                "error": "Resume text is too short or empty"
            }
        
        # Extract structured data
        resume_data = extract_resume_data(request.text)
        
        return {
            "success": True,
            "data": resume_data
        }
        
    except ValueError as e:
        return {
            "success": False,
            "error": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Extraction failed: {str(e)}"
        }
```

---

## 6. Qdrant Vector Database

### 6.1 Create Qdrant Service

Create `AI/qdrant_service.py`:

```python
"""
Qdrant Service - Vector database for resume embeddings
"""

import os
from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Dict, Any, Optional

# Collection name for resumes
RESUME_COLLECTION = "resumes"

# Embedding dimensions (OpenAI text-embedding-3-small)
EMBEDDING_DIMENSIONS = 1536

def get_qdrant_client() -> QdrantClient:
    """
    Get Qdrant client instance
    
    Returns:
        QdrantClient connected to cloud or local
    """
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    
    if qdrant_url and qdrant_api_key:
        # Cloud Qdrant
        return QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key
        )
    else:
        # Local Qdrant (in-memory for development)
        print("Warning: Using in-memory Qdrant (data won't persist)")
        return QdrantClient(":memory:")

def ensure_collection_exists(client: QdrantClient) -> bool:
    """
    Ensure the resume collection exists
    
    Returns:
        True if collection exists or was created
    """
    try:
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if RESUME_COLLECTION not in collection_names:
            # Create collection
            client.create_collection(
                collection_name=RESUME_COLLECTION,
                vectors_config=models.VectorParams(
                    size=EMBEDDING_DIMENSIONS,
                    distance=models.Distance.COSINE
                )
            )
            print(f"Created collection: {RESUME_COLLECTION}")
        
        return True
        
    except Exception as e:
        print(f"Qdrant collection error: {e}")
        return False

def store_resume_embedding(
    client: QdrantClient,
    user_id: str,
    embedding: List[float],
    resume_data: Dict[str, Any]
) -> bool:
    """
    Store resume embedding in Qdrant
    
    Args:
        client: Qdrant client
        user_id: User ID (used as point ID)
        embedding: Embedding vector
        resume_data: Resume metadata to store
    
    Returns:
        True if successful
    """
    try:
        # Ensure collection exists
        ensure_collection_exists(client)
        
        # Upsert the point (insert or update)
        client.upsert(
            collection_name=RESUME_COLLECTION,
            points=[
                models.PointStruct(
                    id=user_id,
                    vector=embedding,
                    payload={
                        "user_id": user_id,
                        "name": resume_data.get("name"),
                        "skills": resume_data.get("skills", []),
                        "experience_years": resume_data.get("total_experience_years", 0),
                        "summary": resume_data.get("summary", "")
                    }
                )
            ]
        )
        
        return True
        
    except Exception as e:
        print(f"Store embedding error: {e}")
        return False

def search_similar_resumes(
    client: QdrantClient,
    query_embedding: List[float],
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Search for similar resumes
    
    Args:
        client: Qdrant client
        query_embedding: Query vector
        limit: Maximum results to return
    
    Returns:
        List of similar resumes with scores
    """
    try:
        results = client.search(
            collection_name=RESUME_COLLECTION,
            query_vector=query_embedding,
            limit=limit
        )
        
        return [
            {
                "user_id": hit.id,
                "score": hit.score,
                "payload": hit.payload
            }
            for hit in results
        ]
        
    except Exception as e:
        print(f"Search error: {e}")
        return []

def delete_resume_embedding(client: QdrantClient, user_id: str) -> bool:
    """
    Delete a resume embedding
    
    Args:
        client: Qdrant client
        user_id: User ID to delete
    
    Returns:
        True if successful
    """
    try:
        client.delete(
            collection_name=RESUME_COLLECTION,
            points_selector=models.PointIdsList(
                points=[user_id]
            )
        )
        return True
    except Exception as e:
        print(f"Delete error: {e}")
        return False
```

### 6.2 Test Qdrant Connection

Create `AI/test_qdrant.py`:

```python
"""Test Qdrant connection"""

import os
from dotenv import load_dotenv
load_dotenv()

from qdrant_service import get_qdrant_client, ensure_collection_exists

def test_connection():
    print("Testing Qdrant connection...")
    
    client = get_qdrant_client()
    
    # Test collection creation
    success = ensure_collection_exists(client)
    
    if success:
        print("✅ Qdrant connection successful!")
        
        # Get collection info
        collections = client.get_collections()
        print(f"Collections: {[c.name for c in collections.collections]}")
    else:
        print("❌ Qdrant connection failed!")

if __name__ == "__main__":
    test_connection()
```

Run:
```bash
python test_qdrant.py
```

---

## 7. Creating Embeddings

### 7.1 Create Embedding Service

Create `AI/embedding_service.py`:

```python
"""
Embedding Service - Creates embeddings for resumes and jobs
"""

from openai_service import create_embedding
from typing import Dict, Any, List

def create_resume_embedding_text(resume_data: Dict[str, Any]) -> str:
    """
    Create a text representation of resume for embedding
    
    Combines relevant fields into a single text for embedding.
    This ensures similar resumes have similar embeddings.
    """
    parts = []
    
    # Add summary
    if resume_data.get("summary"):
        parts.append(f"Summary: {resume_data['summary']}")
    
    # Add skills (important for matching)
    skills = resume_data.get("skills", [])
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    
    # Add experience
    experience = resume_data.get("experience", [])
    for exp in experience[:3]:  # Top 3 experiences
        if isinstance(exp, dict):
            title = exp.get("title", "")
            company = exp.get("company", "")
            desc = exp.get("description", "")
            parts.append(f"Experience: {title} at {company}. {desc}")
    
    # Add education
    education = resume_data.get("education", [])
    for edu in education[:2]:  # Top 2 educations
        if isinstance(edu, dict):
            degree = edu.get("degree", "")
            institution = edu.get("institution", "")
            parts.append(f"Education: {degree} from {institution}")
    
    # Add projects
    projects = resume_data.get("projects", [])
    for proj in projects[:3]:  # Top 3 projects
        if isinstance(proj, dict):
            name = proj.get("name", "")
            desc = proj.get("description", "")
            tech = proj.get("technologies", [])
            parts.append(f"Project: {name}. {desc}. Tech: {', '.join(tech)}")
    
    return " ".join(parts)

def create_job_embedding_text(job_data: Dict[str, Any]) -> str:
    """
    Create a text representation of job for embedding
    """
    parts = []
    
    # Title and company
    parts.append(f"Job: {job_data.get('title', '')} at {job_data.get('company', '')}")
    
    # Description
    if job_data.get("description"):
        parts.append(f"Description: {job_data['description'][:500]}")
    
    # Skills required
    skills = job_data.get("skills", [])
    if skills:
        parts.append(f"Required Skills: {', '.join(skills)}")
    
    # Requirements
    requirements = job_data.get("requirements", [])
    if requirements:
        parts.append(f"Requirements: {', '.join(requirements[:5])}")
    
    return " ".join(parts)

def get_resume_embedding(resume_data: Dict[str, Any]) -> List[float]:
    """
    Get embedding vector for a resume
    
    Returns:
        Embedding vector as list of floats
    """
    text = create_resume_embedding_text(resume_data)
    return create_embedding(text)

def get_job_embedding(job_data: Dict[str, Any]) -> List[float]:
    """
    Get embedding vector for a job
    
    Returns:
        Embedding vector as list of floats
    """
    text = create_job_embedding_text(job_data)
    return create_embedding(text)
```

---

## 8. Building the Resume API

### 8.1 Create RAG Service

Create `AI/rag_service.py`:

```python
"""
RAG Service - Retrieval Augmented Generation for the job portal
"""

import os
from typing import Dict, Any, Optional
from openai_service import get_json_completion
from embedding_service import get_resume_embedding
from qdrant_service import get_qdrant_client, store_resume_embedding

def process_resume(user_id: str, resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a resume: create embedding and store in vector DB
    
    Args:
        user_id: User's ID
        resume_data: Extracted resume data
    
    Returns:
        Processing result
    """
    try:
        # Create embedding
        embedding = get_resume_embedding(resume_data)
        
        # Store in Qdrant
        client = get_qdrant_client()
        success = store_resume_embedding(
            client=client,
            user_id=user_id,
            embedding=embedding,
            resume_data=resume_data
        )
        
        return {
            "success": success,
            "embedding_size": len(embedding),
            "message": "Resume processed and stored" if success else "Failed to store"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
```

### 8.2 Update Main.py with Full Resume Endpoint

Update `AI/main.py` with the complete resume processing endpoint:

```python
"""
AI Service - Complete main.py with all endpoints
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uvicorn

# Load environment variables
load_dotenv()

# Import our services
from pdf_parser import extract_text_from_pdf, clean_resume_text
from resume_extractor import extract_resume_data
from rag_service import process_resume

# Create FastAPI app
app = FastAPI(
    title="Job Portal AI Service",
    description="AI-powered features for job matching and interview prep",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class ResumeExtractRequest(BaseModel):
    text: str

class ResumeExtractResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ProcessResumeRequest(BaseModel):
    user_id: str
    resume_data: Dict[str, Any]

# ============================================
# ENDPOINTS
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "AI Service is running!",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "qdrant_configured": bool(os.getenv("QDRANT_URL")),
        "tavily_configured": bool(os.getenv("TAVILY_API_KEY"))
    }

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a PDF resume"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    try:
        content = await file.read()
        raw_text = extract_text_from_pdf(content)
        cleaned_text = clean_resume_text(raw_text)
        
        if not cleaned_text or len(cleaned_text) < 50:
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from PDF"
            )
        
        return {
            "success": True,
            "text": cleaned_text,
            "characters": len(cleaned_text)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-resume", response_model=ResumeExtractResponse)
async def extract_resume(request: ResumeExtractRequest):
    """Extract structured data from resume text using AI"""
    try:
        if not request.text or len(request.text) < 50:
            return {"success": False, "error": "Resume text is too short"}
        
        resume_data = extract_resume_data(request.text)
        
        return {"success": True, "data": resume_data}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/process-resume")
async def process_resume_endpoint(request: ProcessResumeRequest):
    """Process resume: create embedding and store in vector DB"""
    try:
        result = process_resume(request.user_id, request.resume_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))
    print(f"🚀 Starting AI Service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
```

---

## 9. Connecting to Backend

### 9.1 Create AI Service in Backend

Create `backend/services/aiService.js`:

```javascript
// backend/services/aiService.js
const axios = require('axios');

// AI Service URL from environment
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';

/**
 * Check if AI service is available
 */
async function checkHealth() {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('AI service health check failed:', error.message);
    return { status: 'error', message: error.message };
  }
}

/**
 * Extract structured data from resume text
 */
async function extractResumeData(resumeText) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/extract-resume`, {
      text: resumeText
    }, {
      timeout: 60000 // 60 second timeout
    });
    
    return response.data;
  } catch (error) {
    console.error('Resume extraction error:', error.message);
    throw new Error('Failed to extract resume data');
  }
}

/**
 * Process resume and store embedding
 */
async function processResume(userId, resumeData) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/process-resume`, {
      user_id: userId.toString(),
      resume_data: resumeData
    });
    
    return response.data;
  } catch (error) {
    console.error('Resume processing error:', error.message);
    throw new Error('Failed to process resume');
  }
}

module.exports = {
  checkHealth,
  extractResumeData,
  processResume,
  AI_SERVICE_URL
};
```

### 9.2 Create Resume Routes in Backend

Create `backend/routes/resume.js`:

```javascript
// backend/routes/resume.js
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const User = require('../models/User');
const auth = require('../middleware/auth');
const aiService = require('../services/aiService');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ============================================
// UPLOAD RESUME - POST /api/resume/upload
// ============================================
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Send PDF to AI service for parsing
    const formData = new FormData();
    formData.append('file', new Blob([req.file.buffer]), 'resume.pdf');
    
    // First, extract text from PDF
    const uploadResponse = await axios.post(
      `${aiService.AI_SERVICE_URL}/upload-resume`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    
    if (!uploadResponse.data.success) {
      return res.status(400).json({ error: 'Failed to parse PDF' });
    }
    
    const resumeText = uploadResponse.data.text;
    
    // Extract structured data using AI
    const extractResponse = await aiService.extractResumeData(resumeText);
    
    if (!extractResponse.success) {
      return res.status(400).json({ error: 'Failed to extract resume data' });
    }
    
    const resumeData = extractResponse.data;
    
    // Generate a unique resume ID
    const resumeId = `resume_${req.user._id}_${Date.now()}`;
    
    // Update user with resume data
    await User.findByIdAndUpdate(req.user._id, {
      resumeId,
      resumeData,
      resumeText
    });
    
    // Process resume for vector embedding (async - don't wait)
    aiService.processResume(req.user._id, resumeData).catch(err => {
      console.error('Background resume processing error:', err);
    });
    
    res.json({
      message: 'Resume uploaded successfully',
      resumeId,
      resumeData
    });
    
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// ============================================
// GET MY RESUME - GET /api/resume
// ============================================
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user.resumeData) {
      return res.status(404).json({ error: 'No resume uploaded' });
    }
    
    res.json({
      resumeId: user.resumeId,
      resumeData: user.resumeData,
      uploadedAt: user.updatedAt
    });
    
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Failed to get resume' });
  }
});

module.exports = router;
```

### 9.3 Add Resume Route to Server

Update `backend/server.js` to include the resume route:

```javascript
// Add to the routes section
const resumeRoutes = require('./routes/resume');
app.use('/api/resume', resumeRoutes);
```

---

## 10. Testing the AI Service

### 10.1 Test Complete Flow

Start all services:

**Terminal 1 - AI Service:**
```bash
cd AI
source venv/bin/activate
python main.py
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

### 10.2 Test PDF Upload

```bash
# Test with a sample PDF resume
curl -X POST http://localhost:8001/upload-resume \
  -F "file=@sample_resume.pdf"
```

### 10.3 Test Resume Extraction

```bash
curl -X POST http://localhost:8001/extract-resume \
  -H "Content-Type: application/json" \
  -d '{"text": "John Doe, Software Engineer with 5 years experience in Python, Java, and React. Worked at Google and Microsoft. Masters in Computer Science from MIT."}'
```

### 10.4 Verification Checklist

| Endpoint | Test | Status |
|----------|------|--------|
| GET /health | Returns OK with all configs | ⬜ |
| POST /upload-resume | Parses PDF and returns text | ⬜ |
| POST /extract-resume | Returns structured JSON | ⬜ |
| POST /process-resume | Stores embedding in Qdrant | ⬜ |

---

## 🎉 Day 4 Complete!

You have successfully built:
- ✅ FastAPI server with endpoints
- ✅ OpenAI integration for AI responses
- ✅ PDF parsing for resume uploads
- ✅ AI-powered resume data extraction
- ✅ Qdrant vector database setup
- ✅ Resume embedding and storage
- ✅ Backend integration with AI service

---

## 📖 What's Next?

Tomorrow in **Day 5**, you'll build the AI Agent:
- LangGraph for multi-step workflows
- Interview Prep Agent
- Web search integration with Tavily
- Company research automation

👉 **Continue to [Day 5: AI Agent](./day5-ai-agent.md)**

