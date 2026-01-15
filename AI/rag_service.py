"""
===================================================================================
                    RAG_SERVICE.PY - RAG (Retrieval Augmented Generation)
===================================================================================

📚 WHAT IS RAG?
--------------
RAG = Retrieval Augmented Generation

It's a technique where:
1. User asks a question
2. We RETRIEVE relevant information from a database (like PDF chunks)
3. We AUGMENT the LLM's prompt with this retrieved context
4. LLM GENERATES an answer based on the context

📌 WHY RAG?
-----------
LLMs (like GPT) only know what they were trained on.
They don't know about:
- Your personal PDFs
- Your company documents
- Recent information

RAG solves this! We give the LLM the relevant context, and it answers based on that.

🔗 THIS IS EXACTLY WHAT YOU LEARNED IN:
    - Notes Compare/04-RAG/indexing.py (for PDF indexing)
    - Notes Compare/04-RAG/chat.py (for querying)

===================================================================================
                            THE RAG PIPELINE
===================================================================================

Step 1: INDEXING (one-time, when PDF is uploaded)
-------------------------------------------------
    PDF File
        ↓
    Extract Text (page by page)
        ↓
    Split into Chunks (smaller pieces)
        ↓
    Create Embeddings (convert text to numbers/vectors)
        ↓
    Store in Vector Database (Qdrant)

Step 2: QUERYING (every time user asks a question)
--------------------------------------------------
    User Question: "What is Node.js?"
        ↓
    Create Embedding of Question
        ↓
    Similarity Search in Qdrant (find similar chunks)
        ↓
    Get Top K Matching Chunks
        ↓
    Send (Question + Context) to LLM
        ↓
    LLM Generates Answer
        ↓
    Return Answer to User

===================================================================================
"""

# =============================================================================
#                           IMPORTS SECTION
# =============================================================================

# ----- Standard Library Imports -----
import os
from io import BytesIO  # For reading file bytes in memory
from uuid import uuid4  # For generating unique IDs

# ----- MongoDB for Checkpointing -----
from pymongo import MongoClient
"""
📖 Why MongoDB in RAG Service?
------------------------------
We use MongoDB to save PDF Q&A conversations so that follow-up
questions can reference previous answers.

Example:
- User uploads resume.pdf
- User asks: "What are my skills?"
- AI answers: "Python, JavaScript, React..."
- User asks: "Tell me more about my Python experience"
- AI needs to remember what "my" refers to (the resume)!

This is the same checkpointing pattern used in agent_service.py!
"""

# ----- FastAPI Imports -----
from fastapi import APIRouter, HTTPException, UploadFile, File
"""
📖 What are these FastAPI imports?
----------------------------------

APIRouter:
    - Creates a "sub-application" with its own routes
    - Later we include this router in the main app
    - Keeps code organized (all RAG routes in one place)

HTTPException:
    - For returning HTTP error responses
    - Example: HTTPException(status_code=400, detail="Bad request")

UploadFile:
    - Represents an uploaded file from the user
    - Has properties like: filename, content_type, read()

File:
    - A dependency that tells FastAPI to expect a file upload
    - Used with UploadFile in endpoint parameters
"""

from pydantic import BaseModel
from typing import Optional
"""
📖 What is Pydantic?
--------------------
Pydantic is a data validation library.

✔ It defines the SHAPE of data you expect
✔ FastAPI uses it to validate incoming requests
✔ If data doesn't match, FastAPI automatically returns an error

Example:
    class RAGQuery(BaseModel):
        question: str        # MUST be a string
        k: Optional[int] = 4 # Optional, defaults to 4
        
    If someone sends {"question": 123}, FastAPI says:
    "Error: question must be a string"

🔗 In your notes (06-LangGraph/codegraph.py), you used Pydantic:
    class ClassifyMessageResponse(BaseModel):
        is_coding_question: bool
"""

# ----- LangChain Imports -----
from langchain_text_splitters import RecursiveCharacterTextSplitter
"""
📖 What is RecursiveCharacterTextSplitter?
------------------------------------------
From langchain_text_splitters library.

✔ Splits long text into smaller chunks
✔ Keeps paragraphs and sentences together when possible
✔ Uses "recursive" approach - tries to split by paragraph, then sentence, then character

Why split?
    - LLMs have token limits (can't process huge texts)
    - Smaller chunks = more precise similarity search
    - Better matches to user's question

🔗 In your notes (04-RAG/indexing.py), you did EXACTLY this:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,    # Each chunk up to 1000 characters
        chunk_overlap=400   # Overlap so we don't lose context at boundaries
    )
"""

from langchain_openai import OpenAIEmbeddings
"""
📖 What is OpenAIEmbeddings?
----------------------------
From langchain_openai library.

✔ Converts text into vectors (numbers) using OpenAI's embedding model
✔ These vectors represent the "meaning" of the text
✔ Similar meanings = similar vectors (close in vector space)

How it works:
    "I love programming"  →  [0.1, 0.5, -0.3, 0.8, ...]  (1536 numbers)
    "Coding is my passion" → [0.12, 0.48, -0.28, 0.79, ...] (similar numbers!)
    "I hate cooking"       → [-0.5, 0.2, 0.7, -0.1, ...]  (different numbers)

🔗 In your notes (04-RAG/indexing.py), you did EXACTLY this:
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")
    
📌 Note: We use "text-embedding-3-small" here for cost efficiency.
         "large" is more accurate but costs more.
"""

from langchain_qdrant import QdrantVectorStore
"""
📖 What is QdrantVectorStore?
-----------------------------
From langchain_qdrant library.

✔ Connects LangChain to Qdrant vector database
✔ Qdrant stores vectors and enables similarity search
✔ When we search, Qdrant finds the closest vectors to our query

Why Qdrant?
    - Open source and free
    - Very fast similarity search
    - Can handle millions of vectors
    - Has a nice REST API

🔗 In your notes (04-RAG/indexing.py), you did EXACTLY this:
    vector_store = QdrantVectorStore.from_documents(
        documents=split_docs,
        url="http://localhost:6333",
        collection_name="learning_vectors",
        embedding=embedding_model
    )
"""

from langchain_core.documents import Document
"""
📖 What is Document?
--------------------
From langchain_core library.

✔ A simple class that holds:
    - page_content: The actual text
    - metadata: Extra info (page number, source file, etc.)

When we split a PDF, each chunk becomes a Document object.
"""

from qdrant_client.http.models import Filter, FieldCondition, MatchValue
from qdrant_client import QdrantClient
"""
📖 What are these Qdrant filter classes?
----------------------------------------
From qdrant_client library.

✔ Used to FILTER search results
✔ Example: Only search in a specific PDF

Filter = The overall filter container
FieldCondition = A condition to check (like "pdf_id must equal 'abc'")
MatchValue = The value to match against

📌 Why filter?
    - User might have uploaded multiple PDFs
    - When they ask about one PDF, we only want chunks from THAT PDF
    - Filter ensures we don't mix up information from different sources
"""

# ----- PDF Processing -----
from pypdf import PdfReader
"""
📖 What is PdfReader?
--------------------
From pypdf library (pip install pypdf).

✔ Reads PDF files and extracts text
✔ Can process page-by-page
✔ Handles most PDF formats

🔗 Your notes use PyPDFLoader from langchain, but it's the same concept!
"""

# ----- OCR Support for Scanned PDFs -----
try:
    from pdf2image import convert_from_bytes
    import pytesseract
    from PIL import Image
except Exception:
    # These are optional - some systems might not have them
    convert_from_bytes = None
    pytesseract = None
    Image = None

"""
📖 What is OCR?
--------------
OCR = Optical Character Recognition

✔ Converts IMAGES of text into actual text
✔ Used when PDF pages are scanned (images, not text)

pdf2image: Converts PDF pages to images
pytesseract: Python wrapper for Tesseract OCR engine
PIL (Pillow): Python Imaging Library for image processing

📌 These are OPTIONAL because not all PDFs need OCR.
   If the PDF has normal text, we don't need OCR.
"""

# ----- OpenAI for LLM Responses -----
from openai import OpenAI

# Import interview prep graph
try:
    from interview_prep_graph import build_interview_prep_graph
    INTERVIEW_PREP_AVAILABLE = True
except ImportError:
    INTERVIEW_PREP_AVAILABLE = False
    print("⚠️ Warning: interview_prep_graph not available")
"""
📖 What is OpenAI?
------------------
From openai library (pip install openai).

✔ Official OpenAI Python client
✔ Used to call GPT models for generating responses

🔗 In your notes (04-RAG/chat.py), you did EXACTLY this:
    client = OpenAI()
    chat_completion = client.chat.completions.create(...)
"""

# =============================================================================
#                     CONFIGURATION VARIABLES
# =============================================================================

# Qdrant Configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
"""
📖 Qdrant URL
-------------
✔ Where our vector database is running
✔ Default is localhost:6333 (standard Qdrant port)
✔ Can be overridden via environment variable

🔗 In your notes (04-RAG/indexing.py):
    url="http://localhost:6333"
"""

QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "learning_vectors")
"""
📖 Collection Name
------------------
✔ Like a "table" in a regular database
✔ All our PDF vectors go into this collection
✔ We use "learning_vectors" (same as your notes!)

🔗 In your notes (04-RAG/indexing.py):
    collection_name="learning_vectors"
"""

# =============================================================================
#                     CREATE OPENAI CLIENT
# =============================================================================

client = OpenAI()
"""
📖 Creating OpenAI Client
-------------------------
✔ Automatically reads OPENAI_API_KEY from environment
✔ This client is used to call GPT models

🔗 In your notes (04-RAG/chat.py):
    client = OpenAI()
"""

# =============================================================================
#                     CREATE EMBEDDING MODEL
# =============================================================================

embedding_model = OpenAIEmbeddings(model="text-embedding-3-small")
"""
📖 Creating Embedding Model
---------------------------
✔ This model converts text to vectors
✔ We use "text-embedding-3-small" (cost-effective)
✔ Alternatively, "text-embedding-3-large" is more accurate but costs more

📌 IMPORTANT: Use the SAME embedding model for indexing AND querying!
             If you index with "large" and query with "small", it won't work!

🔗 In your notes (04-RAG/indexing.py):
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-large")
"""

# =============================================================================
#                     CREATE API ROUTER
# =============================================================================

rag_router = APIRouter(
    prefix="",  # No prefix, routes are at root level
    tags=["RAG"]  # Groups routes in API docs
)

# =============================================================================
#                     🆕 PDF CONVERSATION CHECKPOINTER
# =============================================================================
"""
📖 Why Checkpointing for PDF Q&A?
---------------------------------
When a user asks questions about a PDF, they often ask follow-up questions:

Example Conversation:
--------------------
User: "What are the key points in this PDF?"
AI:   "The PDF discusses 1) Machine Learning, 2) Neural Networks, 3) Deep Learning"
User: "Tell me more about point 2"  ← FOLLOW-UP!
AI:   Needs to remember what "point 2" refers to!

Without checkpointing, the AI wouldn't know that "point 2" = Neural Networks.

🔗 THIS IS THE SAME PATTERN AS agent_service.py:
    state = _checkpointer.load(thread_id)
    state["messages"].append(...)
    _checkpointer.save(thread_id, state)

📌 FOR YOUR INTERVIEW:
"I implemented conversation persistence for PDF Q&A so that follow-up
questions work naturally. The conversation is stored in MongoDB with
the thread_id, allowing users to ask 'tell me more about X' after
an initial question."
"""

# MongoDB connection for RAG checkpointing
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

try:
    _rag_mongo_client = MongoClient(MONGO_URI)
    _rag_db = _rag_mongo_client["jobportal"]
    _rag_checkpoints = _rag_db["rag_checkpoints"]  # Separate collection for RAG
    print("✅ RAG Checkpointer: Connected to MongoDB")
except Exception as e:
    print(f"⚠️ RAG Checkpointer: MongoDB connection failed: {e}")
    _rag_checkpoints = None


def _save_rag_conversation(thread_id: str, pdf_id: str, question: str, answer: str):
    """
    📖 Save PDF Q&A to Checkpointer
    ===============================
    
    Saves the question and answer to MongoDB so follow-up questions
    have context about what was discussed.
    
    Parameters:
    -----------
    thread_id: str
        The conversation thread ID (from frontend)
    pdf_id: str
        The PDF being discussed
    question: str
        User's question about the PDF
    answer: str
        AI's answer based on PDF content
    
    MongoDB Document Structure:
    ---------------------------
    {
        "thread_id": "abc123",
        "pdf_id": "resume-xyz",
        "messages": [
            {"role": "user", "content": "What are my skills?"},
            {"role": "assistant", "content": "Python, JavaScript..."},
            {"role": "user", "content": "Tell me more about Python"},
            {"role": "assistant", "content": "You have 3 years of..."}
        ]
    }
    """
    if _rag_checkpoints is None:
        print("⚠️ RAG Checkpointer not available, skipping save")
        return
    
    try:
        # Find existing conversation or create new
        existing = _rag_checkpoints.find_one({"thread_id": thread_id})
        
        if existing:
            # Append to existing conversation
            messages = existing.get("messages", [])
            messages.append({"role": "user", "content": question})
            messages.append({"role": "assistant", "content": answer})
            
            _rag_checkpoints.update_one(
                {"thread_id": thread_id},
                {"$set": {"messages": messages, "pdf_id": pdf_id}}
            )
        else:
            # Create new conversation
            _rag_checkpoints.insert_one({
                "thread_id": thread_id,
                "pdf_id": pdf_id,
                "messages": [
                    {"role": "user", "content": question},
                    {"role": "assistant", "content": answer}
                ]
            })
        
        print(f"💾 RAG Checkpointer: Saved Q&A for thread {thread_id}")
        
    except Exception as e:
        print(f"⚠️ RAG Checkpointer: Save failed: {e}")


def _get_rag_conversation_history(thread_id: str) -> list:
    """
    📖 Load Previous PDF Q&A from Checkpointer
    ==========================================
    
    Returns the conversation history for a thread so the LLM
    can understand follow-up questions in context.
    
    Returns:
    --------
    List of message dicts: [{"role": "user", "content": "..."}, ...]
    """
    if _rag_checkpoints is None:
        return []
    
    try:
        existing = _rag_checkpoints.find_one({"thread_id": thread_id})
        if existing:
            return existing.get("messages", [])
        return []
    except Exception as e:
        print(f"⚠️ RAG Checkpointer: Load failed: {e}")
        return []
"""
📖 Creating API Router
----------------------
✔ APIRouter creates a "sub-application" for related routes
✔ All RAG endpoints (upload, query) go here
✔ tags=["RAG"] groups them nicely in /docs

Later in main.py, we do:
    app.include_router(rag_router)
    
This adds all these routes to the main app!
"""

# =============================================================================
#                     SYSTEM PROMPT FOR PDF Q&A
# =============================================================================

SYSTEM_PROMPT = """
You are a helpful AI Assistant who answers user queries based on the available context
retrieved from a PDF file along with page_contents and page number.

📌 RULES:
1. Answer ONLY using the provided context
2. If the context doesn't contain the answer, say "I don't have enough information"
3. Always mention the page number(s) where you found the information
4. Keep the answer clear and well-structured

When explaining concepts:
1. First explain the concept clearly
2. If there's code, show it formatted properly
3. Explain each part step by step
4. Mention common mistakes to avoid
"""
"""
📖 What is a System Prompt?
---------------------------
✔ The system prompt sets the AI's behavior and personality
✔ It tells the AI HOW to respond
✔ It's like giving instructions to a new employee

🔗 In your notes (04-RAG/chat.py), you had:
    SYSTEM_PROMPT = '''
        You are a helpfull AI Assistant who answers user query based on...
    '''
"""

# =============================================================================
#                     PYDANTIC MODELS (Request/Response Schemas)
# =============================================================================

class RAGQuery(BaseModel):
    """
    📖 Request Schema for RAG Query
    -------------------------------
    Defines what data we expect when user asks a question about a PDF.
    
    ✔ question: The user's question (required)
    ✔ k: How many chunks to retrieve (optional, default 4)
    ✔ pdf_id: Which PDF to search in (optional)
    """
    question: str                   # Required: The question to answer
    k: Optional[int] = 4           # Optional: Number of chunks to retrieve
    pdf_id: Optional[str] = None   # Optional: Specific PDF to search


# =============================================================================
#                     HELPER FUNCTION: GET VECTOR STORE
# =============================================================================

def get_vector_store() -> QdrantVectorStore:
    """
    📖 Get Vector Store Connection
    ------------------------------
    Creates a connection to an EXISTING Qdrant collection.
    
    ✔ Use this when you want to QUERY (search) the database
    ✔ Don't use this for creating new collections
    
    🔗 In your notes (04-RAG/chat.py):
        vector_db = QdrantVectorStore.from_existing_collection(
            url="http://localhost:6333",
            collection_name="learning_vectors",
            embedding=embedding_model
        )
    """
    return QdrantVectorStore.from_existing_collection(
        url=QDRANT_URL,
        collection_name=QDRANT_COLLECTION,
        embedding=embedding_model  # Must match the model used for indexing!
    )


# =============================================================================
#                     ENDPOINT: RAG QUERY
# =============================================================================

@rag_router.post("/rag/query")
def rag_query(payload: RAGQuery):
    """
    📖 RAG Query Endpoint
    ---------------------
    Answers questions based on indexed PDF content.
    
    HTTP POST to: http://localhost:8000/rag/query
    Body: { "question": "What is Node.js?", "k": 4 }
    
    THE RAG PIPELINE:
    1. Take user's question
    2. Search Qdrant for similar chunks (similarity_search)
    3. Build context from retrieved chunks
    4. Send (question + context) to GPT
    5. Return GPT's answer
    
    🔗 THIS IS EXACTLY YOUR NOTES (04-RAG/chat.py)!
    """
    try:
        # Step 1: Connect to vector database
        vector_db = get_vector_store()
        
        # Step 2: Similarity Search
        # --------------------------
        # This finds the chunks most similar to the user's question
        # k = how many chunks to retrieve (default 4)
        #
        # 🔗 In your notes (04-RAG/chat.py):
        #     search_results = vector_db.similarity_search(query=query)
        
        search_results = vector_db.similarity_search(
            query=payload.question,
            k=payload.k or 4
        )
        
        # Step 3: Build Context String
        # ----------------------------
        # Convert the search results into a readable context for the LLM
        # Each result has: page_content, metadata (page number, source file)
        #
        # 🔗 In your notes (04-RAG/chat.py):
        #     context = "\n\n\n".join([
        #         f"Page Content: {result.page_content}\nPage Number: {result.metadata['page_label']}..."
        #         for result in search_results
        #     ])
        
        context = "\n\n".join([
            f"Page Content: {result.page_content}\n"
            f"Page Number: {result.metadata.get('page', result.metadata.get('page_label', 'N/A'))}\n"
            f"Source: {result.metadata.get('source', result.metadata.get('filename', 'Unknown'))}"
            for result in search_results
        ])
        
        # Step 4: Create Full System Prompt with Context
        system_prompt_with_context = f"""
            {SYSTEM_PROMPT}
            
            CONTEXT FROM PDF:
            {context}
        """
        
        # Step 5: Call OpenAI GPT to Generate Answer
        # ------------------------------------------
        # We send the system prompt (with context) and user's question
        # GPT generates an answer based ONLY on the provided context
        #
        # 🔗 In your notes (04-RAG/chat.py):
        #     chat_completion = client.chat.completions.create(
        #         model="gpt-4.1",
        #         messages=[
        #             { "role": "system", "content": SYSTEM_PROMPT },
        #             { "role": "user", "content": query },
        #         ]
        #     )
        
        completion = client.chat.completions.create(
            model="gpt-4o-mini",  # Using gpt-4o-mini for cost efficiency
            messages=[
                {"role": "system", "content": system_prompt_with_context},
                {"role": "user", "content": payload.question}
            ]
        )
        
        # Step 6: Extract and Return Answer
        answer = completion.choices[0].message.content
        
        return {
            "answer": answer,
            "context_used": context  # Also return context so user can verify
        }
        
    except Exception as err:
        # Return HTTP 500 error if something goes wrong
        raise HTTPException(status_code=500, detail=f"RAG query failed: {err}")


# =============================================================================
#                     ENDPOINT: PDF UPLOAD
# =============================================================================

@rag_router.post("/pdf/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """
    📖 PDF Upload Endpoint
    ----------------------
    Uploads and indexes a PDF for RAG queries.
    
    HTTP POST to: http://localhost:8000/pdf/upload
    Body: multipart/form-data with file
    
    THE INDEXING PIPELINE:
    1. Receive PDF file
    2. Extract text page-by-page (with OCR fallback for scanned PDFs)
    3. Split text into chunks
    4. Create embeddings for each chunk
    5. Store embeddings in Qdrant
    6. Return PDF ID for future queries
    
    🔗 THIS IS EXACTLY YOUR NOTES (04-RAG/indexing.py)!
    """
    
    # Validate file type
    if file.content_type and "pdf" not in file.content_type.lower():
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Step 1: Read PDF Content
        # ------------------------
        # Read the uploaded file into memory as bytes
        content = await file.read()
        
        # Create a BytesIO object (acts like a file in memory)
        # PdfReader needs a file-like object
        reader = PdfReader(BytesIO(content))
        
        # Step 2: Extract Text Page by Page
        # ----------------------------------
        # We process each page separately to:
        # - Track page numbers (for citations)
        # - Use OCR on pages with no text (scanned documents)
        #
        # 🔗 In your notes (04-RAG/indexing.py):
        #     loader = PyPDFLoader(file_path=pdf_path)
        #     docs = loader.load()  # Reads PDF page by page
        
        pages = []
        full_text_parts = []
        ocr_available = convert_from_bytes is not None and pytesseract is not None
        
        for idx, page in enumerate(reader.pages):
            # Try to extract text normally first
            page_text = page.extract_text() or ""
            
            # OCR Fallback: If page has little text and OCR is available
            # Increased threshold from 10 to 50 to catch partially scanned pages
            if len(page_text.strip()) < 50 and ocr_available:
                try:
                    # Convert PDF page to image
                    images = convert_from_bytes(
                        content,
                        first_page=idx + 1,
                        last_page=idx + 1,
                        dpi=300  # Higher DPI = better OCR accuracy
                    )
                    if images:
                        # Run OCR on the image
                        ocr_text = pytesseract.image_to_string(images[0])
                        if ocr_text.strip():
                            page_text = ocr_text
                except Exception:
                    pass  # OCR failed, continue with empty text
            
            pages.append({"page": idx + 1, "text": page_text})
            full_text_parts.append(f"[Page {idx + 1}]\n{page_text}")
        
        full_text = "\n\n".join(full_text_parts)
        
        # Check if we got any text
        if not any((p["text"] or "").strip() for p in pages):
            raise HTTPException(
                status_code=422,
                detail="No text could be extracted from the PDF"
            )
        
        # Step 3: Split into Chunks
        # -------------------------
        # Use RecursiveCharacterTextSplitter to split text into smaller chunks
        # - chunk_size: Maximum size of each chunk
        # - chunk_overlap: Overlap between chunks (maintains context)
        #
        # 🔗 In your notes (04-RAG/indexing.py):
        #     text_splitter = RecursiveCharacterTextSplitter(
        #         chunk_size=1000,
        #         chunk_overlap=400
        #     )
        #     split_docs = text_splitter.split_documents(documents=docs)
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,     # Larger chunks for more complete content
            chunk_overlap=300    # More overlap to maintain context between chunks
        )
        
        # Generate unique ID for this PDF
        pdf_id = str(uuid4())
        
        # Create Document objects for each chunk
        docs = []
        for p in pages:
            # Split each page's text into chunks
            chunks = splitter.split_text(p["text"])
            
            for chunk in chunks:
                docs.append(
                    Document(
                        page_content=chunk,
                        metadata={
                            "pdf_id": pdf_id,           # Link to this specific PDF
                            "filename": file.filename, # Original filename
                            "page": p["page"]          # Page number for citation
                        }
                    )
                )
        
        # Step 4: Create Embeddings and Store in Qdrant
        # ----------------------------------------------
        # This does two things:
        # 1. Converts each chunk to a vector using embedding_model
        # 2. Stores the vectors in Qdrant
        #
        # 🔗 In your notes (04-RAG/indexing.py):
        #     vector_store = QdrantVectorStore.from_documents(
        #         documents=split_docs,
        #         url="http://localhost:6333",
        #         collection_name="learning_vectors",
        #         embedding=embedding_model
        #     )
        
        print(f"📤 Uploading {len(docs)} chunks with pdf_id: {pdf_id}")
        
        if docs:
            QdrantVectorStore.from_documents(
                documents=docs,
                embedding=embedding_model,
                url=QDRANT_URL,
                collection_name=QDRANT_COLLECTION
            )
            print(f"✅ Successfully stored {len(docs)} chunks in Qdrant")
        
        # Step 5: Return Success Response
        return {
            "status": "ingested",
            "pdf_id": pdf_id,              # Use this ID for queries
            "filename": file.filename,
            "total_pages": len(pages),
            "total_chunks": len(docs),
            "pages": pages,                # Page-wise text breakdown
            "full_text": full_text         # Complete text
        }
        
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {err}")


# =============================================================================
#                     ENDPOINT: DELETE PDF FROM QDRANT
# =============================================================================

@rag_router.delete("/pdf/delete/{pdf_id}")
async def delete_pdf(pdf_id: str):
    """
    📖 Delete PDF from Qdrant
    -------------------------
    Deletes all chunks associated with a specific pdf_id from Qdrant.
    
    This is called when a user uploads a new resume to remove old documents.
    
    HTTP DELETE to: http://localhost:8000/pdf/delete/{pdf_id}
    
    Parameters:
    -----------
    pdf_id: The unique identifier of the PDF to delete
    
    Returns:
    --------
    {
        "success": true,
        "deleted_count": 10,
        "message": "Deleted 10 chunks for pdf_id: abc-123"
    }
    """
    try:
        # Connect to Qdrant
        qdrant_client = QdrantClient(url=QDRANT_URL)
        
        # Connect to existing collection to query by metadata
        # LangChain stores metadata in a nested structure: metadata.pdf_id
        vector_db = QdrantVectorStore.from_existing_collection(
            url=QDRANT_URL,
            collection_name=QDRANT_COLLECTION,
            embedding=embedding_model
        )
        
        # Create filter to find all points with this pdf_id
        # LangChain stores metadata in nested structure: metadata.pdf_id
        filter_condition = Filter(
            must=[
                FieldCondition(
                    key="metadata.pdf_id",  # LangChain stores metadata here
                    match=MatchValue(value=pdf_id)
                )
            ]
        )
        
        # Scroll to get all points with this pdf_id
        # We need to use the Qdrant client directly for deletion
        scroll_result = qdrant_client.scroll(
            collection_name=QDRANT_COLLECTION,
            scroll_filter=filter_condition,
            limit=10000,  # Get up to 10000 points
            with_payload=True,
            with_vectors=False
        )
        
        point_ids = [point.id for point in scroll_result[0]]
        
        if point_ids:
            # Delete the points
            qdrant_client.delete(
                collection_name=QDRANT_COLLECTION,
                points_selector=point_ids
            )
            print(f"🗑️ Deleted {len(point_ids)} chunks for pdf_id: {pdf_id}")
            return {
                "success": True,
                "deleted_count": len(point_ids),
                "message": f"Deleted {len(point_ids)} chunks for pdf_id: {pdf_id}"
            }
        else:
            print(f"⚠️ No chunks found for pdf_id: {pdf_id}")
            return {
                "success": True,
                "deleted_count": 0,
                "message": f"No chunks found for pdf_id: {pdf_id}"
            }
            
    except Exception as err:
        print(f"❌ Error deleting PDF from Qdrant: {err}")
        raise HTTPException(status_code=500, detail=f"Failed to delete PDF: {err}")


# =============================================================================
#                     ENDPOINT: PDF QUERY (Specific PDF)
# =============================================================================

@rag_router.post("/pdf/query")
async def query_pdf(payload: dict):
    """
    📖 PDF Query Endpoint (with Conversation Memory!)
    ==================================================
    
    Query a SPECIFIC PDF by its pdf_id.
    
    HTTP POST to: http://localhost:8000/pdf/query
    Body: { 
        "pdf_id": "abc-123", 
        "question": "What is this about?",
        "thread_id": "optional-thread-id"  ← 🆕 For conversation memory!
    }
    
    📌 DIFFERENCE FROM /rag/query:
    - /rag/query: Searches ALL indexed PDFs
    - /pdf/query: Searches ONLY the specified PDF
    
    🆕 NEW FEATURE: Conversation Memory!
    ------------------------------------
    If thread_id is provided, we:
    1. Load previous Q&A for this thread
    2. Include it in the prompt so LLM has context
    3. Save the new Q&A for future follow-ups
    
    Example:
    --------
    User: "What skills are in this resume?"
    AI:   "The resume shows Python, JavaScript, React..."
    User: "Tell me more about React"  ← Follow-up works!
    AI:   "The candidate used React for 2 years..."
    
    Uses Qdrant filters to limit search to one PDF.
    """
    pdf_id = payload.get("pdf_id")
    question = payload.get("question")
    thread_id = payload.get("thread_id", "default")  # 🆕 Get thread ID
    
    print(f"📝 PDF Query received - pdf_id: {pdf_id}, question: {question}, thread: {thread_id}")
    
    if not pdf_id or not question:
        raise HTTPException(status_code=400, detail="Missing pdf_id or question")
    
    try:
        # Connect to existing collection
        vector_db = QdrantVectorStore.from_existing_collection(
            url=QDRANT_URL,
            collection_name=QDRANT_COLLECTION,
            embedding=embedding_model
        )
        
        # Create filter to search ONLY in this PDF
        # -----------------------------------------
        # This ensures we only get chunks from the specified PDF
        # Uses Qdrant's filtering capability
        
        qdrant_filter = Filter(
            must=[
                FieldCondition(
                    key="metadata.pdf_id",  # LangChain stores metadata here
                    match=MatchValue(value=pdf_id)
                )
            ]
        )
        
        print(f"🔍 Searching with filter for pdf_id: {pdf_id}")
        
        # Detect if this is an extraction request (needs ALL content)
        extraction_keywords = ["extract", "full text", "all text", "entire", "complete", 
                              "everything", "whole", "all content", "full content",
                              "show all", "read all", "all pages"]
        is_extraction = any(kw in question.lower() for kw in extraction_keywords)
        
        # Get more chunks for extraction requests
        num_chunks = 50 if is_extraction else 15  # 50 for extraction, 15 for normal
        
        # Search with filter
        results = vector_db.similarity_search(
            query=question,
            k=num_chunks,
            filter=qdrant_filter
        )
        
        print(f"📊 Found {len(results)} results (extraction mode: {is_extraction})")
        
        if not results:
            return {"answer": "I couldn't find any content for that PDF. Try re-uploading."}
        
        # Sort by page number for logical flow
        sorted_results = sorted(results, key=lambda r: r.metadata.get("page", 0))
        
        # Remove duplicate chunks (same page, similar content)
        seen_content = set()
        unique_results = []
        for r in sorted_results:
            content_key = (r.metadata.get("page", 0), r.page_content[:100])
            if content_key not in seen_content:
                seen_content.add(content_key)
                unique_results.append(r)
        sorted_results = unique_results
        
        # Build context
        context_chunks = []
        for r in sorted_results:
            pg = r.metadata.get("page")
            fname = r.metadata.get("filename")
            context_chunks.append(f"Page {pg} ({fname}): {r.page_content}")
        
        context = "\n\n".join(context_chunks)
        
        # ================================================================
        # 🆕 Load Conversation History for Follow-up Questions
        # ================================================================
        """
        📖 Why Load History?
        --------------------
        If user asked "What skills are in this resume?" and got an answer,
        then asks "Tell me more about Python", we need the history so the
        LLM knows what "Python" refers to from the previous answer.
        
        🔗 This is the same pattern as agent_service.py checkpointing!
        """
        conversation_history = _get_rag_conversation_history(thread_id)
        
        # Build history string for prompt
        history_text = ""
        if conversation_history:
            history_text = "\n📜 PREVIOUS CONVERSATION:\n"
            for msg in conversation_history[-6:]:  # Last 3 exchanges
                role = "User" if msg["role"] == "user" else "Assistant"
                history_text += f"{role}: {msg['content'][:500]}...\n\n"
        
        # Generate answer
        system_prompt = f"""
            {SYSTEM_PROMPT}
            
            PDF Context:
            {context}
            {history_text}
            
            📌 IMPORTANT RULES:
            
            1. If the user asks a follow-up question (like "tell me more" 
               or "what about X"), refer to the previous conversation for context.
            
            2. ✅ ALWAYS ANSWER these types of requests (they ARE related to the PDF):
               - "extract it", "extract text", "extract all text from pdf"
               - "show the content", "what does it say", "read the pdf"
               - "summarize", "summary", "what is this about"
               - "list all", "show everything", "full content"
               - Any question about the PDF content itself
               
               📋 FOR EXTRACTION REQUESTS, format the output BEAUTIFULLY:
               
               # 📄 [Document Title/Topic]
               
               ---
               
               ## 📖 Page 1
               [Content from page 1, properly formatted]
               
               ---
               
               ## 📖 Page 2
               [Content from page 2, properly formatted]
               
               ... and so on
               
               📌 FORMATTING RULES:
               - Use proper markdown headings (## for pages, ### for sections)
               - Format CODE blocks with ```java or ```python etc.
               - Use bullet points for lists
               - Add horizontal rules (---) between pages
               - Make it readable and well-organized
               - Remove duplicate content if same page appears twice
            
            3. 🚨 ONLY redirect to main chat for COMPLETELY UNRELATED questions like:
               - Weather queries ("what's the weather")
               - Stock market queries ("stock price of X")
               - Travel planning ("plan a trip")
               - General knowledge not in PDF ("who is the president")
               
               For these, respond:
               "This question doesn't appear to be related to the uploaded PDF.
                For questions about weather, stocks, travel, etc., please use the main chat.
                Is there anything about this PDF I can help with?"
            
            4. Answer from the PDF context provided. The context above contains the actual PDF text.
        """
        
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ]
        )
        
        answer = completion.choices[0].message.content
        
        # ================================================================
        # 🆕 Save to Checkpointer for Future Follow-ups
        # ================================================================
        """
        📖 Why Save?
        ------------
        So the next question in this thread can reference this Q&A.
        
        Before: Each PDF question was isolated
        After:  Questions build on previous answers!
        """
        _save_rag_conversation(thread_id, pdf_id, question, answer)
        
        return {"answer": answer, "thread_id": thread_id}
        
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to query PDF: {err}")


"""
===================================================================================
                        SUMMARY: RAG SERVICE
===================================================================================

This file implements the RAG (Retrieval Augmented Generation) pattern:

ENDPOINTS:
----------
1. POST /rag/query      - Ask questions, search all indexed content
2. POST /pdf/upload     - Upload and index a PDF
3. POST /pdf/query      - Ask questions about a specific PDF

KEY CONCEPTS:
-------------
1. Embeddings: Convert text to vectors (numbers) that represent meaning
2. Vector Database: Store and search vectors by similarity
3. Similarity Search: Find the most similar chunks to a query
4. Context Augmentation: Add retrieved chunks to the LLM prompt
5. Chunking: Split long documents into smaller, searchable pieces

🔗 MAPPED TO YOUR NOTES:
------------------------
- Notes Compare/04-RAG/indexing.py → /pdf/upload endpoint
- Notes Compare/04-RAG/chat.py → /rag/query endpoint
- Notes Compare/advanced_rag/worker.py → Same RAG logic with queue

===================================================================================
"""

# =============================================================================
#                     QUICK INTERVIEW PREP FALLBACK
# =============================================================================

async def generate_quick_interview_prep(resume_data: dict, job_data: dict, application_id: str) -> dict:
    """
    Quick fallback for interview preparation when full workflow times out.
    Generates prep with 15 frequently asked DSA questions, behavioral stories, etc.
    """
    from openai import OpenAI
    import json
    
    client = OpenAI(timeout=60.0)
    
    company = job_data.get("company", "Company")
    role = job_data.get("title", "Software Developer")
    skills = resume_data.get("skills", [])
    
    # Determine role level
    role_lower = role.lower()
    if 'sde 2' in role_lower or 'sde-2' in role_lower or 'ii' in role_lower:
        role_level = "SDE-2"
    elif 'senior' in role_lower or 'lead' in role_lower:
        role_level = "Senior"
    else:
        role_level = "SDE-1"
    
    prompt = f"""Generate interview preparation for {company} {role} position.
Role Level: {role_level}

Return JSON:
{{
    "company_info": "Brief overview of {company} (50 words)",
    "role_level": "{role_level}",
    "interview_rounds": {{
        "total_rounds": 4,
        "rounds": [
            {{"round_number": 1, "name": "Online Assessment", "type": "DSA", "duration": "60-90 min", "what_to_expect": "2-3 coding problems", "tips": ["Practice LeetCode", "Manage time"]}},
            {{"round_number": 2, "name": "Technical Round 1", "type": "DSA", "duration": "45-60 min", "what_to_expect": "Live coding", "tips": ["Think aloud"]}},
            {{"round_number": 3, "name": "Technical Round 2", "type": "System Design", "duration": "45-60 min", "what_to_expect": "Design discussion", "tips": ["Start with requirements"]}},
            {{"round_number": 4, "name": "Behavioral", "type": "Behavioral", "duration": "45 min", "what_to_expect": "STAR questions", "tips": ["Prepare 5 stories"]}}
        ]
    }},
    "dsa_prep": {{
        "difficulty_focus": "Medium for {role_level}",
        "coding_patterns": [
            {{"pattern": "Two Pointers", "when_to_use": "Sorted arrays, pairs", "problems": ["Two Sum II", "3Sum"]}},
            {{"pattern": "Sliding Window", "when_to_use": "Subarray problems", "problems": ["Max Subarray"]}},
            {{"pattern": "BFS/DFS", "when_to_use": "Trees, graphs", "problems": ["Number of Islands"]}},
            {{"pattern": "Dynamic Programming", "when_to_use": "Optimization", "problems": ["Coin Change"]}},
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
            {{"id": 1, "question": "Two Sum", "difficulty": "Easy", "topic": "Arrays", "link": "https://leetcode.com/problems/two-sum/", "approach": "HashMap O(n)"}},
            {{"id": 2, "question": "Valid Parentheses", "difficulty": "Easy", "topic": "Stack", "link": "https://leetcode.com/problems/valid-parentheses/", "approach": "Stack matching"}},
            {{"id": 3, "question": "Merge Two Sorted Lists", "difficulty": "Easy", "topic": "Linked List", "link": "https://leetcode.com/problems/merge-two-sorted-lists/", "approach": "Dummy node"}},
            {{"id": 4, "question": "Best Time Buy Sell Stock", "difficulty": "Easy", "topic": "Arrays", "link": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "approach": "Track min"}},
            {{"id": 5, "question": "Maximum Subarray", "difficulty": "Medium", "topic": "DP", "link": "https://leetcode.com/problems/maximum-subarray/", "approach": "Kadane's"}},
            {{"id": 6, "question": "3Sum", "difficulty": "Medium", "topic": "Arrays", "link": "https://leetcode.com/problems/3sum/", "approach": "Sort + two pointers"}},
            {{"id": 7, "question": "Longest Substring No Repeat", "difficulty": "Medium", "topic": "Sliding Window", "link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "approach": "Sliding window"}},
            {{"id": 8, "question": "Number of Islands", "difficulty": "Medium", "topic": "Graphs", "link": "https://leetcode.com/problems/number-of-islands/", "approach": "DFS/BFS"}},
            {{"id": 9, "question": "Binary Tree Level Order", "difficulty": "Medium", "topic": "Trees", "link": "https://leetcode.com/problems/binary-tree-level-order-traversal/", "approach": "BFS queue"}},
            {{"id": 10, "question": "Coin Change", "difficulty": "Medium", "topic": "DP", "link": "https://leetcode.com/problems/coin-change/", "approach": "Bottom-up DP"}},
            {{"id": 11, "question": "Product Except Self", "difficulty": "Medium", "topic": "Arrays", "link": "https://leetcode.com/problems/product-of-array-except-self/", "approach": "Prefix/suffix"}},
            {{"id": 12, "question": "Search Rotated Array", "difficulty": "Medium", "topic": "Binary Search", "link": "https://leetcode.com/problems/search-in-rotated-sorted-array/", "approach": "Modified binary search"}},
            {{"id": 13, "question": "Merge Intervals", "difficulty": "Medium", "topic": "Arrays", "link": "https://leetcode.com/problems/merge-intervals/", "approach": "Sort by start"}},
            {{"id": 14, "question": "LRU Cache", "difficulty": "Medium", "topic": "Design", "link": "https://leetcode.com/problems/lru-cache/", "approach": "HashMap + DLL"}},
            {{"id": 15, "question": "Course Schedule", "difficulty": "Medium", "topic": "Graphs", "link": "https://leetcode.com/problems/course-schedule/", "approach": "Topological sort"}}
        ],
        "resources": [
            {{"name": "LeetCode {company} Tag", "url": "https://leetcode.com/company/{company.lower().replace(' ', '-')}/", "type": "Company Questions"}},
            {{"name": "NeetCode 150", "url": "https://neetcode.io/practice", "type": "Curated List"}},
            {{"name": "Blind 75", "url": "https://leetcode.com/discuss/general-discussion/460599/", "type": "Must Do"}},
            {{"name": "LeetCode Patterns", "url": "https://seanprashad.com/leetcode-patterns/", "type": "Pattern Guide"}},
            {{"name": "Striver's SDE Sheet", "url": "https://takeuforward.org/interviews/strivers-sde-sheet/", "type": "Indian Focus"}}
        ]
    }},
    "system_design_prep": {{
        "level_expectation": "For {role_level}: Focus on DSA primarily. Basic system design awareness is good but not critical. If SDE-2+, prepare for full system design rounds.",
        "common_questions": [
            {{"question": "Design URL Shortener", "key_concepts": ["Hashing", "Database", "Caching"]}},
            {{"question": "Design a Rate Limiter", "key_concepts": ["Token bucket", "Redis"]}},
            {{"question": "Design a Chat App", "key_concepts": ["WebSockets", "Message queues"]}}
        ],
        "concepts_to_know": [
            {{"concept": "Load Balancing", "why": "Distribute traffic"}},
            {{"concept": "Caching", "why": "Faster reads"}},
            {{"concept": "Database Sharding", "why": "Scale horizontally"}},
            {{"concept": "Message Queues", "why": "Async processing"}}
        ],
        "resources": [
            {{"name": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "type": "GitHub"}}
        ]
    }},
    "behavioral_prep": {{
        "importance": "Behavioral rounds assess culture fit and soft skills",
        "star_framework": {{
            "S": "Situation - Set context",
            "T": "Task - Your responsibility",
            "A": "Action - What YOU did",
            "R": "Result - Outcome with numbers"
        }},
        "common_questions": [
            {{"question": "Tell me about yourself", "category": "Introduction", "tips": "Present-Past-Future formula", "time": "2 min"}},
            {{"question": "Why {company}?", "category": "Motivation", "tips": "Research + personal connection", "time": "1-2 min"}},
            {{"question": "Tell me about a time you disagreed with your manager", "category": "Conflict", "tips": "Focus on resolution", "time": "2-3 min"}},
            {{"question": "Tell me about a time you failed", "category": "Self-awareness", "tips": "Show growth", "time": "2-3 min"}},
            {{"question": "Tell me about a challenging project", "category": "Achievement", "tips": "Use metrics", "time": "2-3 min"}},
            {{"question": "How do you handle tight deadlines?", "category": "Pressure", "tips": "Show prioritization", "time": "2-3 min"}},
            {{"question": "Tell me about a time you showed leadership", "category": "Leadership", "tips": "Initiative counts", "time": "2-3 min"}},
            {{"question": "What are your strengths and weaknesses?", "category": "Self-awareness", "tips": "Be honest, show improvement", "time": "2 min"}},
            {{"question": "Where do you see yourself in 5 years?", "category": "Career Goals", "tips": "Show ambition aligned with company", "time": "1-2 min"}},
            {{"question": "Tell me about a time you went above and beyond", "category": "Customer Focus", "tips": "Show dedication", "time": "2-3 min"}}
        ],
        "stories_to_prepare": [
            {{"type": "Leadership/Initiative", "questions_it_answers": ["Led a project", "Took initiative", "Influenced others"]}},
            {{"type": "Conflict/Disagreement", "questions_it_answers": ["Disagreed with manager", "Handled conflict"]}},
            {{"type": "Failure/Learning", "questions_it_answers": ["Failed", "Biggest mistake", "What you learned"]}},
            {{"type": "Achievement/Impact", "questions_it_answers": ["Proud moment", "Biggest achievement"]}},
            {{"type": "Tight Deadline", "questions_it_answers": ["Handled pressure", "Tight deadline"]}},
            {{"type": "Customer Focus", "questions_it_answers": ["Went above and beyond", "Customer satisfaction"]}}
        ],
        "tips_for_success": [
            {{"tip": "Use specific numbers", "example": "'Improved by 40%' not 'improved performance'"}},
            {{"tip": "Focus on YOUR actions", "example": "Say 'I' not 'we'"}},
            {{"tip": "Keep answers 2-3 minutes", "example": "Practice timing"}},
            {{"tip": "End positively", "example": "Learning or positive outcome"}},
            {{"tip": "Prepare 5-6 versatile stories", "example": "One story can answer multiple questions"}}
        ],
        "questions_to_ask": [
            {{"question": "What does success look like in 90 days?", "why": "Shows you care about impact"}},
            {{"question": "What are the team's biggest challenges?", "why": "Shows problem-solving interest"}},
            {{"question": "What do you enjoy most about working here?", "why": "Gets honest insight"}}
        ]
    }},
    "common_questions": [
        {{"question": "Tell me about yourself", "category": "Introduction", "how_to_answer": "Present-Past-Future: Current role, past experience, why this role"}},
        {{"question": "Why {company}?", "category": "Motivation", "how_to_answer": "Products you admire + culture fit + growth opportunity"}},
        {{"question": "What are your strengths?", "category": "Self-awareness", "how_to_answer": "Give 2-3 with specific examples"}},
        {{"question": "What are your weaknesses?", "category": "Self-awareness", "how_to_answer": "Real weakness + what you're doing to improve"}},
        {{"question": "Where do you see yourself in 5 years?", "category": "Career Goals", "how_to_answer": "Growth aligned with company trajectory"}},
        {{"question": "Why are you leaving your current job?", "category": "Motivation", "how_to_answer": "Focus on growth, not negatives"}},
        {{"question": "Tell me about a project you're proud of", "category": "Achievement", "how_to_answer": "STAR format with impact metrics"}},
        {{"question": "How do you stay updated with technology?", "category": "Learning", "how_to_answer": "Specific resources: blogs, courses, side projects"}},
        {{"question": "Do you have any questions for me?", "category": "Closing", "how_to_answer": "Ask about team, challenges, growth"}}
    ]
}}

Return ONLY the JSON, no markdown or other text."""

    try:
        # Use json_object response format to ensure valid JSON output
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert interview coach. Return valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4000,  # Reduced for faster response with 15 questions
            response_format={"type": "json_object"}  # Ensures valid JSON
        )
        
        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)
        
        print(f"✅ Quick fallback generated: {len(result.get('dsa_prep', {}).get('top_15_questions', []))} DSA questions")
        return {
            "company_info": result.get("company_info", f"{company} is a leading technology company."),
            "interview_links": [],  # Quick fallback doesn't search web
            "role_level": result.get("role_level", role_level),
            "interview_rounds": result.get("interview_rounds"),
            "dsa_prep": result.get("dsa_prep"),
            "system_design_prep": result.get("system_design_prep"),
            "behavioral_prep": result.get("behavioral_prep"),
            "common_questions": result.get("common_questions", []),
            "prepared_answers": result.get("behavioral_prep", {}).get("questions_to_ask", [])
        }
    except Exception as e:
        print(f"❌ Quick fallback also failed: {e}")
        import traceback
        traceback.print_exc()
        # Return minimal fallback
        return {
            "company_info": f"{company} is a technology company.",
            "interview_links": [],
            "role_level": role_level,
            "interview_rounds": {"total_rounds": 4, "rounds": []},
            "dsa_prep": {"must_know_topics": ["Arrays", "Strings", "Trees"], "top_30_questions": []},
            "system_design_prep": {"level_expectation": "Basic knowledge"},
            "behavioral_prep": {"common_questions": [], "stories_to_prepare": []},
            "common_questions": [],
            "prepared_answers": []
        }

# =============================================================================
#                     ENDPOINT: INTERVIEW PREPARATION (LangGraph)
# =============================================================================

@rag_router.post("/interview/prepare")
async def prepare_interview(payload: dict):
    """
    📖 Interview Preparation Endpoint (LangGraph)
    ============================================
    
    Generate comprehensive interview preparation using LangGraph workflow.
    
    HTTP POST to: http://localhost:8000/interview/prepare
    Body: {
        "resume_data": {...},
        "job_data": {...},
        "application_id": "abc-123"
    }
    
    Returns: {
        "success": true,
        "preparation": "Full markdown guide...",
        "application_id": "abc-123"
    }
    """
    if not INTERVIEW_PREP_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Interview preparation service not available"
        )
    
    try:
        import sys
        print("📥 Interview prep request received!", flush=True)
        
        resume_data = payload.get("resume_data", {})
        job_data = payload.get("job_data", {})
        application_id = payload.get("application_id", f"app-{uuid4().hex[:8]}")
        
        print(f"   Application ID: {application_id}", flush=True)
        print(f"   Company: {job_data.get('company', 'N/A')}", flush=True)
        print(f"   Role: {job_data.get('title', 'N/A')}", flush=True)
        
        if not resume_data or not job_data:
            raise HTTPException(
                status_code=400,
                detail="resume_data and job_data are required"
            )
        
        # Build the graph
        print("🔨 Building interview prep graph...", flush=True)
        graph = build_interview_prep_graph()
        print("✅ Graph built successfully!", flush=True)
        
        # Create initial state with new round-based structure
        initial_state = {
            "messages": [],
            "resume_data": resume_data,
            "job_data": job_data,
            "application_id": application_id,
            # Research outputs
            "company_info": None,
            "interview_links": None,
            "role_level": None,
            # Round-based preparation
            "interview_rounds": None,
            "dsa_prep": None,
            "system_design_prep": None,
            "behavioral_prep": None,
            # Questions
            "common_questions": None,
            "prepared_answers": None
            # Removed: final_guide (redundant)
        }
        
        # Execute the graph in a thread pool to avoid blocking the event loop
        print("🔄 Starting 4-node Round-Based LangGraph workflow...", flush=True)
        print("   Node 1: Company Research + Interview Links (using Tavily)", flush=True)
        print("   Node 2: Interview Rounds Analyzer", flush=True)
        print("   Node 3: Round-by-Round Preparation (DSA/SystemDesign/Behavioral)", flush=True)
        print("   Node 4: Common Questions Generator", flush=True)
        sys.stdout.flush()
        
        # Run the blocking LangGraph in a thread pool to avoid blocking the event loop
        import asyncio
        print("🧵 Running graph in thread pool...", flush=True)
        
        try:
            # Timeout after 240 seconds (4 minutes) for the workflow
            # Increased from 120s to handle complex companies like Amazon/Google
            final_state = await asyncio.wait_for(
                asyncio.to_thread(graph.invoke, initial_state),
                timeout=240.0
            )
            print("🧵 Thread pool completed!", flush=True)
        except asyncio.TimeoutError:
            print("⏱️ LangGraph workflow timed out (240s), using quick fallback...", flush=True)
            # Use quick fallback if workflow times out
            final_state = await generate_quick_interview_prep(resume_data, job_data, application_id)
        
        # Extract all results from the round-based workflow
        print("✅ Interview preparation completed successfully!")
        
        return {
            "success": True,
            "application_id": application_id,
            # Company research
            "company_info": final_state.get("company_info", ""),
            "interview_links": final_state.get("interview_links", []),
            "role_level": final_state.get("role_level", "SDE-1"),
            # Interview rounds
            "interview_rounds": final_state.get("interview_rounds"),
            # Round-by-round preparation
            "dsa_prep": final_state.get("dsa_prep"),
            "system_design_prep": final_state.get("system_design_prep"),
            "behavioral_prep": final_state.get("behavioral_prep"),
            # Questions
            "common_questions": final_state.get("common_questions", []),
            "prepared_answers": final_state.get("prepared_answers", [])
            # Removed: final_guide and preparation (redundant)
        }
        
    except HTTPException:
        raise
    except Exception as err:
        print(f"❌ Interview prep error: {err}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate interview preparation: {str(err)}"
        )


# =============================================================================
#                     RECRUITER DECISION ENDPOINT
# =============================================================================

@rag_router.post("/recruiter/decision")
async def recruiter_decision_endpoint(request: dict):
    """
    📖 Recruiter Decision Endpoint
    ===============================
    
    Generates AI-powered hiring recommendation using LangGraph workflow.
    Considers: ATS score, Agentic score, Project score, Profile matching,
    Experience, and College tier.
    
    HTTP POST to: http://localhost:8001/recruiter/decision
    Body: {
        "resume_data": {...},
        "job_data": {...},
        "agentic_score": 75,
        "agentic_details": {...},
        "project_analysis": {...},
        "application_id": "...",
        "candidate_name": "..."
    }
    
    Returns: {
        "success": true,
        "recommendation": "Strong Accept" | "Accept" | "Consider" | "Reject",
        "confidence_score": 85,
        "reasoning": "...",
        "key_factors": [...],
        "analysis": {...}
    }
    """
    try:
        # Import the recruiter decision graph function
        try:
            from recruiter_decision_graph import get_recruiter_decision as get_decision
            RECRUITER_DECISION_AVAILABLE = True
        except ImportError as e:
            print(f"⚠️ Warning: recruiter_decision_graph not available: {e}")
            RECRUITER_DECISION_AVAILABLE = False
        
        if not RECRUITER_DECISION_AVAILABLE:
            raise HTTPException(
                status_code=503,
                detail="Recruiter decision service not available"
            )
        
        resume_data = request.get("resume_data", {})
        job_data = request.get("job_data", {})
        agentic_score = request.get("agentic_score", 0)
        agentic_details = request.get("agentic_details", {})
        project_analysis = request.get("project_analysis", {})
        ats_analysis = request.get("ats_analysis", None)  # Pre-calculated ATS analysis
        application_id = request.get("application_id", "")
        candidate_name = request.get("candidate_name", "Candidate")
        
        if not resume_data or not job_data:
            raise HTTPException(
                status_code=400,
                detail="Missing required data: resume_data and job_data"
            )
        
        print(f"\n🤖 Generating AI hiring recommendation for {candidate_name}...")
        print(f"   Job: {job_data.get('title', '')} at {job_data.get('company', '')}")
        print(f"   Current Fit Score: {agentic_score}%")
        if ats_analysis:
            print(f"   ✅ Using pre-calculated ATS analysis (score: {ats_analysis.get('score', 0)}%)")
        if project_analysis:
            print(f"   ✅ Using pre-calculated project analysis")
        
        # Execute the graph in a thread pool to avoid blocking the event loop
        import asyncio
        result = await asyncio.to_thread(
            get_decision,
            resume_data,
            job_data,
            agentic_score,
            agentic_details,
            project_analysis,
            application_id,
            candidate_name,
            ats_analysis  # Pass pre-calculated ATS analysis
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to generate recommendation")
            )
        
        print(f"✅ Recommendation: {result.get('recommendation', 'Consider')}")
        print(f"   Confidence: {result.get('confidence_score', 0)}%")
        
        return result
        
    except HTTPException:
        raise
    except Exception as err:
        print(f"❌ Recruiter decision error: {err}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate hiring recommendation: {str(err)}"
        )

