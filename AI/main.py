"""
===================================================================================
                        MAIN.PY - FastAPI Server Entry Point
===================================================================================

📚 WHAT IS THIS FILE?
--------------------
This is the MAIN ENTRY POINT of our AI Service. It creates and runs the FastAPI 
server that our Node.js Backend calls.

🔗 HOW IT CONNECTS WITH BACKEND & FRONTEND:
-------------------------------------------
    Frontend (React) 
         ↓ 
    Backend (Node.js/Express - port 8080)
         ↓ 
    AI Service (FastAPI/Python - port 8000)  ← This file runs this!
         ↓
    Qdrant Vector DB (port 6333)

📖 WHAT IS FastAPI?
------------------
FastAPI is a modern Python web framework for building APIs.
- It's FAST (as the name suggests)
- It automatically generates API documentation at /docs
- It validates request data automatically using Pydantic
- It's async-friendly (can handle many requests at once)

Think of it like Express.js but for Python, and with extra superpowers!

📌 COMPARISON WITH YOUR NOTES:
-----------------------------
In your notes (advanced_rag/main.py), you wrote:
    uvicorn.run(app, port=8000, host="0.0.0.0")
    
This is the SAME pattern! We use uvicorn to run our FastAPI server.

===================================================================================
"""

# =============================================================================
#                           IMPORTS SECTION
# =============================================================================

# ----- Standard Library Imports -----
# These come from Python itself, no pip install needed
import os  # For reading environment variables (like API keys)

# ----- Third-Party Library Imports -----
# These need to be installed via pip (see requirements.txt)

from dotenv import load_dotenv
"""
📖 What is load_dotenv?
-----------------------
From the 'python-dotenv' library (pip install python-dotenv)

✔ What it does:
  - Reads your .env file and loads all variables into the system environment
  - After this, you can access them using os.getenv("VARIABLE_NAME")

✔ Why needed?
  - API keys should NEVER be hardcoded in your code (security risk!)
  - Instead, we store them in a .env file which is NOT committed to git
  
Example .env file:
    OPENAI_API_KEY=sk-xxxxx
    QDRANT_URL=http://localhost:6333
"""

from fastapi import FastAPI
"""
📖 What is FastAPI?
-------------------
From the 'fastapi' library (pip install fastapi)

✔ FastAPI is a class that creates our web application
✔ We create an instance: app = FastAPI()
✔ Then we add routes to this app using decorators like @app.get("/")

🔗 Documentation: https://fastapi.tiangolo.com/
"""

import uvicorn
"""
📖 What is uvicorn?
-------------------
From the 'uvicorn' library (pip install uvicorn)

✔ Uvicorn is the SERVER that actually runs your FastAPI code
✔ FastAPI is just code - uvicorn serves it to the internet
✔ Think of it like:
    - FastAPI = The recipe (instructions)
    - Uvicorn = The chef (executes the recipe and serves food)

✔ Why uvicorn specifically?
  - It's an ASGI server (Asynchronous Server Gateway Interface)
  - Perfect for async Python web apps
  - Very fast and efficient
"""

# =============================================================================
#                     LOAD ENVIRONMENT VARIABLES
# =============================================================================

# 📌 IMPORTANT: Call load_dotenv() BEFORE importing other modules
# Why? Because other modules (like rag_service) need environment variables
# like OPENAI_API_KEY to work. If we import them first, they might fail!

load_dotenv()
"""
✔ This line reads the .env file in the same directory
✔ Now os.getenv("OPENAI_API_KEY") will return your actual API key
✔ In your notes (advanced_rag/main.py), you did the SAME thing!
"""

# =============================================================================
#                     IMPORT OUR SERVICE MODULES
# =============================================================================

# Now import our custom service modules AFTER load_dotenv()
# Each of these is a separate file in the AI folder

from rag_service import rag_router
"""
📖 What is rag_service?
-----------------------
Our RAG (Retrieval Augmented Generation) service.

✔ This handles:
  - PDF upload and indexing
  - Similarity search in vector database
  - Generating answers based on PDF content

🔗 This is aligned with your Notes Compare/04-RAG/ code!
"""

from agent_service import agent_router
"""
📖 What is agent_service?
-------------------------
Our AI Agent service with tools.

✔ This handles:
  - Web search agent (like your Notes Compare/03-Agents/main.py)
  - The plan → action → observe → output pattern

🔗 This is aligned with your Notes Compare/03-Agents/ code!
"""

from tools_service import tools_router

# Fast AI endpoints
try:
    from fast_fit_score import fast_router
    FAST_AI_AVAILABLE = True
except ImportError:
    FAST_AI_AVAILABLE = False
    print("⚠️ Warning: fast_fit_score not available")
"""
📖 What is tools_service?
-------------------------
Our tools service for STT, OCR, and simple search.

✔ This handles:
  - Speech-to-Text (audio to text using Whisper)
  - OCR (image to text using Tesseract)
  - Simple web search helper
"""

# =============================================================================
#                     CREATE THE FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Sigma GPT AI Service",
    description="""
    This is the AI backend service for Sigma GPT.
    
    It provides:
    - RAG (Retrieval Augmented Generation) for PDF Q&A
    - AI Agents with web search capabilities  
    - Speech-to-Text and OCR tools
    
    📌 This service is called by the Node.js Backend (port 8080)
    """,
    version="1.0.0"
)
"""
📖 Creating the FastAPI app
---------------------------
✔ FastAPI() creates the web application instance
✔ We give it a title and description for the auto-generated docs
✔ Visit http://localhost:8000/docs to see the auto-generated API documentation!

🔗 In your notes (advanced_rag/server.py), you did the SAME thing:
    app = FastAPI()
"""

# =============================================================================
#                     INCLUDE ROUTERS (ROUTE MODULES)
# =============================================================================

"""
📖 What are Routers?
--------------------
Routers are like "sub-applications" that handle related endpoints.

Instead of putting ALL endpoints in one file, we split them:
  - rag_service.py → handles /rag/* endpoints
  - agent_service.py → handles /agent/* endpoints  
  - tools_service.py → handles /stt/*, /ocr/*, /search/* endpoints

Why split?
  - Better organization
  - Easier to understand and maintain
  - Each file focuses on one thing (Single Responsibility Principle)

✔ app.include_router() adds these routes to our main app
"""

app.include_router(rag_router)
app.include_router(agent_router)
app.include_router(tools_router)

if FAST_AI_AVAILABLE:
    app.include_router(fast_router)

# =============================================================================
#                     AI ANALYSIS ENDPOINT (FOR BACKEND)
# =============================================================================
# This endpoint is used by the backend for ATS and Project analysis
# It provides a simple interface to call OpenAI without needing the package in backend

from openai import OpenAI
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    prompt: str
    model: str = "gpt-4o-mini"
    system_message: str = "You are an expert resume analyst. Always return valid JSON when requested."

@app.post("/ai/analyze")
async def analyze_with_ai(request: AnalyzeRequest):
    """
    📖 Analyze text using OpenAI
    
    Used by backend for:
    - ATS compatibility analysis
    - Project relevance analysis
    
    Request body:
    {
        "prompt": "Your analysis prompt",
        "model": "gpt-4o-mini" (optional),
        "system_message": "System message" (optional)
    }
    """
    try:
        if not request.prompt:
            return {"error": "Prompt is required"}
        
        # Initialize OpenAI client
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Call OpenAI
        response = openai_client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "system", "content": request.system_message},
                {"role": "user", "content": request.prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        return {
            "response": response.choices[0].message.content,
            "answer": response.choices[0].message.content  # Alias for compatibility
        }
    except Exception as e:
        return {"error": str(e)}

# =============================================================================
#                     HEALTH CHECK ENDPOINT
# =============================================================================

@app.get("/health")
def health_check():
    """
    📖 Health Check Endpoint
    ------------------------
    ✔ This is a simple endpoint to check if the server is running
    ✔ The Node.js Backend can call this to verify the AI service is alive
    
    HTTP GET request to: http://localhost:8000/health
    Returns: {"status": "ok", "message": "Sigma GPT AI Service is running!"}
    
    📌 Why /health?
    - Industry standard for checking if a service is alive
    - Used by Docker, Kubernetes, load balancers, etc.
    - Useful for debugging: "Is my AI service even running?"
    """
    return {
        "status": "ok",
        "message": "Sigma GPT AI Service is running!"
    }


@app.get("/")
def root():
    """
    📖 Root Endpoint
    ----------------
    ✔ When you visit http://localhost:8000/ in browser, this runs
    ✔ Just a friendly welcome message
    
    🔗 In your notes (advanced_rag/server.py), you did the SAME thing:
        @app.get('/')
        def root():
            return {"status": 'Server is up and running'}
    """
    return {
        "message": "Welcome to Sigma GPT AI Service!",
        "docs": "Visit /docs for API documentation",
        "health": "Visit /health to check server status"
    }


# =============================================================================
#                     RUN THE SERVER
# =============================================================================

def main():
    """
    📖 Main Function - Server Startup
    ---------------------------------
    This function starts the FastAPI server using uvicorn.
    
    ✔ uvicorn.run() starts the server
    ✔ app = our FastAPI application
    ✔ host="0.0.0.0" = listen on ALL network interfaces (important for Docker!)
    ✔ port=8000 = the port number the server runs on
    
    📌 Why host="0.0.0.0"?
    ---------------------
    From your notes (advanced_rag/main.py):
        0.0.0.0 = listen on all network interfaces
        ✔ Required when running inside Docker
        ✔ Required if other services (Redis, Qdrant) need to talk to it
        
        If you wrote host="127.0.0.1":
        👉 Only your laptop could access it
        👉 Other containers cannot reach it
        👉 Docker networking will break
    
    📌 After running, the server is accessible at:
    - http://localhost:8000 (from your machine)
    - http://0.0.0.0:8000 (from other containers/devices)
    """
    print("\n" + "=" * 60)
    print("🚀 Starting Sigma GPT AI Service...")
    print("=" * 60)
    print("📍 Server URL: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("💚 Health Check: http://localhost:8000/health")
    print("=" * 60 + "\n")
    
    uvicorn.run(
        app,              # Our FastAPI application
        host="0.0.0.0",   # Listen on all interfaces (for Docker/other services)
        port=int(os.getenv("AI_SERVICE_PORT", "8005"))  # Port number (8005 to avoid conflict with other apps)
    )


# =============================================================================
#                     SCRIPT ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    """
    📖 What is if __name__ == "__main__"?
    -------------------------------------
    This is a Python idiom (common pattern).
    
    ✔ __name__ is a special variable Python sets automatically
    ✔ When you run this file directly (python main.py), __name__ = "__main__"
    ✔ When this file is imported by another file, __name__ = "main"
    
    So this code only runs when you execute: python main.py
    It does NOT run when another file imports from this file.
    
    📌 Why use this pattern?
    - Makes the file both runnable AND importable
    - Prevents the server from starting when you just want to import something
    """
    main()


"""
===================================================================================
                        HOW TO RUN THIS SERVER
===================================================================================

Method 1: Direct Python execution
---------------------------------
    cd /Users/ankursura/Desktop/Projects/Project 3/Sigma GPT/AI
    python main.py

Method 2: Using uvicorn directly (for development with auto-reload)
-------------------------------------------------------------------
    cd /Users/ankursura/Desktop/Projects/Project 3/Sigma GPT/AI
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    
    📌 --reload means: Auto-restart when code changes (great for development!)

===================================================================================
                        HOW THIS CONNECTS TO YOUR BACKEND
===================================================================================

Your Node.js Backend (Backend/routes/chat.js) calls this service:

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
    
    const response = await fetch(`${AI_SERVICE_URL}/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
    });

So when your Backend wants to:
1. Ask a question about a PDF → calls /rag/query
2. Do a web search → calls /agent/web-search
3. Transcribe audio → calls /stt/transcribe

All these are handled by this FastAPI server!

===================================================================================
"""

