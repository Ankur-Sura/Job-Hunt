# 📚 Reading Order - Job Portal Project

**🎓 NEW: Before reading code, check out `ProjectBuildingGuide.md` - A comprehensive guide on how to build this project from scratch as a beginner!**

This guide tells you **in what order** to read the codebase to understand the project.

## 🎯 For Interviews

**Start here if you have an interview coming up:**

1. **InterviewQuestions.txt** ← Read this FIRST!
   - Complete Q&A covering all aspects
   - Organized by topic
   - Ready to use answers

2. **Then read the code files** (in order below)

---

## 🎓 For Learning

**Start here if you want to understand how it works:**

### Phase 1: Project Overview
1. **README.md** (root) - Project overview and setup
2. **InterviewQuestions.txt** - High-level understanding

### Phase 2: Backend Basics
3. **backend/server.js** - Express server setup
4. **backend/models/User.js** - User schema
5. **backend/models/Job.js** - Job schema
6. **backend/routes/auth.js** - Authentication logic
7. **backend/routes/jobs.js** - Job listing and pagination

### Phase 3: AI Service Basics
8. **AI/main.py** - FastAPI server entry
9. **AI/rag_service.py** - OCR and RAG processing
10. **AI/fast_fit_score.py** - Fit score calculation

### Phase 4: Advanced AI Features
11. **AI/interview_prep_graph.py** - LangGraph workflow
12. **AI/tools_service.py** - Web search and utilities
13. **AI/agent_service.py** - Chat and agent endpoints

### Phase 5: Frontend
14. **frontend/src/App.jsx** - Routing setup
15. **frontend/src/pages/Dashboard.jsx** - Main dashboard
16. **frontend/src/pages/Jobs.jsx** - Job listing with pagination
17. **frontend/src/pages/InterviewPrepPage.jsx** - Interview prep UI

### Phase 6: Integration
18. **backend/routes/interview.js** - Interview prep API
19. **backend/services/aiService.js** - AI service communication
20. **backend/services/backgroundJobs.js** - Background processing

---

## 📌 Key Concepts to Understand

1. **Microservices Architecture** - Express ↔ FastAPI
2. **JWT Authentication** - Token-based auth
3. **OCR + RAG** - Resume processing pipeline
4. **LangGraph** - Multi-node AI workflows
5. **Vector Databases** - Qdrant for embeddings
6. **Pagination** - Efficient data loading
7. **Caching** - Fit score optimization

---

## 🚀 Quick Start

If you just want to **run the project**:

1. See **README.md** for setup instructions
2. Start MongoDB, Qdrant
3. Run backend: `cd backend && npm start`
4. Run AI service: `cd AI && python3 main.py`
5. Run frontend: `cd frontend && npm run dev`

---

## 💡 Tips

- **Don't skip files** - Each builds on previous concepts
- **Read comments** - They explain WHY, not just WHAT
- **Run the code** - See it in action while reading
- **Take notes** - Write down questions as you read

Good luck! 🎯

