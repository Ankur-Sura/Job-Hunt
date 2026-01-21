# 📅 Day 1: Project Setup & Environment

**Duration:** 4-6 hours  
**Goal:** Set up your development environment and understand the project architecture

---

## 🎯 What You'll Accomplish Today

By the end of Day 1, you will have:
- ✅ All development tools installed
- ✅ Project folder structure created
- ✅ All 3 services running (Frontend, Backend, AI)
- ✅ Understanding of the architecture

---

## 📚 Table of Contents

1. [Understanding the Architecture](#1-understanding-the-architecture)
2. [Installing Development Tools](#2-installing-development-tools)
3. [Setting Up API Keys](#3-setting-up-api-keys)
4. [Creating Project Structure](#4-creating-project-structure)
5. [Setting Up Frontend](#5-setting-up-frontend)
6. [Setting Up Backend](#6-setting-up-backend)
7. [Setting Up AI Service](#7-setting-up-ai-service)
8. [Running All Services](#8-running-all-services)
9. [Verification Checklist](#9-verification-checklist)

---

## 1. Understanding the Architecture

### 📊 System Overview

Our job portal has **3 separate services** that communicate with each other:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│                    Port: 5173                                    │
│                                                                  │
│  • User Interface (pages, components)                           │
│  • State Management (Redux)                                     │
│  • API calls to Backend                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                             │
│                    Port: 8080                                    │
│                                                                  │
│  • REST API endpoints                                           │
│  • User authentication (JWT)                                    │
│  • Database operations (MongoDB)                                │
│  • Communicates with AI Service                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│    AI SERVICE (Python)   │    │      MONGODB             │
│    Port: 8001            │    │      Port: 27017         │
│                          │    │                          │
│  • Resume parsing        │    │  • Users collection      │
│  • Fit score calculation │    │  • Jobs collection       │
│  • Interview prep        │    │  • Applications          │
│  • LangGraph agents      │    │  • Cached scores         │
└──────────────────────────┘    └──────────────────────────┘
              │
              ▼
┌──────────────────────────┐
│      EXTERNAL APIs       │
│                          │
│  • OpenAI (GPT-4)        │
│  • Tavily (Web Search)   │
│  • Qdrant (Vector DB)    │
└──────────────────────────┘
```

### 🔑 Key Concepts

| Concept | What It Is | Why We Use It |
|---------|------------|---------------|
| **React** | Frontend library | Build interactive UIs |
| **Vite** | Build tool | Fast development server |
| **Tailwind CSS** | CSS framework | Rapid styling |
| **Express** | Node.js framework | Create REST APIs |
| **MongoDB** | NoSQL database | Store users, jobs, applications |
| **FastAPI** | Python framework | AI service endpoints |
| **LangGraph** | AI workflow | Multi-step AI agents |
| **OpenAI** | LLM provider | GPT for text generation |
| **Qdrant** | Vector database | Store resume embeddings |

---

## 2. Installing Development Tools

### 2.1 Install Node.js

Node.js runs our Frontend and Backend.

**For Mac:**
```bash
# Install using Homebrew
brew install node

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

**For Windows:**
1. Download from https://nodejs.org/
2. Run the installer
3. Open Command Prompt and verify:
```bash
node --version
npm --version
```

### 2.2 Install Python

Python runs our AI service.

**For Mac:**
```bash
# Install using Homebrew
brew install python@3.10

# Verify installation
python3 --version  # Should show 3.10.x or higher
pip3 --version
```

**For Windows:**
1. Download from https://www.python.org/downloads/
2. ✅ Check "Add Python to PATH" during installation
3. Verify in Command Prompt:
```bash
python --version
pip --version
```

### 2.3 Install MongoDB

**Option A: MongoDB Atlas (Recommended - Cloud)**

1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a free M0 cluster
4. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/jobportal
   ```

**Option B: Local MongoDB**

**For Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify
mongosh  # Should open MongoDB shell
```

**For Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Run installer
3. Start MongoDB service

### 2.4 Install VS Code / Cursor

Download from:
- VS Code: https://code.visualstudio.com/
- Cursor: https://cursor.sh/

**Recommended Extensions:**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Python
- Prettier - Code formatter
- MongoDB for VS Code

### 2.5 Install Git

**For Mac:**
```bash
brew install git
git --version
```

**For Windows:**
Download from https://git-scm.com/downloads

---

## 3. Setting Up API Keys

You'll need these API keys. Create accounts and get keys:

### 3.1 OpenAI API Key

1. Go to https://platform.openai.com/
2. Sign up / Login
3. Go to API Keys section
4. Create new secret key
5. **Save it** - you won't see it again!

**Cost:** ~$5-10 for learning (GPT-4o-mini is cheap)

### 3.2 Tavily API Key

1. Go to https://tavily.com/
2. Sign up for free account
3. Get API key from dashboard

**Cost:** Free tier available (1000 searches/month)

### 3.3 Qdrant Cloud

1. Go to https://cloud.qdrant.io/
2. Create free account
3. Create a free cluster
4. Get:
   - Cluster URL (e.g., `https://xxx-xxx.aws.cloud.qdrant.io`)
   - API Key

**Cost:** Free tier available

### 📝 Save Your Keys

Create a note with your keys (keep it private!):

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxx
QDRANT_URL=https://xxx-xxx.aws.cloud.qdrant.io
QDRANT_API_KEY=xxxxxxxxxxxxxxxxxx
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobportal
JWT_SECRET=your-super-secret-key-make-it-long
```

---

## 4. Creating Project Structure

### 4.1 Create Main Project Folder

```bash
# Navigate to where you want the project
cd ~/Desktop  # or wherever you prefer

# Create project folder
mkdir job-portal
cd job-portal

# Create subfolders
mkdir frontend backend AI

# Verify structure
ls -la
# Should show: frontend/ backend/ AI/
```

### 4.2 Initialize Git (Optional but Recommended)

```bash
# Inside job-portal folder
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
venv/
__pycache__/

# Environment files
.env
.env.local

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
EOF

git add .
git commit -m "Initial project setup"
```

---

## 5. Setting Up Frontend

### 5.1 Create React App with Vite

```bash
# Navigate to frontend folder
cd frontend

# Create Vite React app
npm create vite@latest . -- --template react

# When prompted:
# - Select: React
# - Select: JavaScript

# Install dependencies
npm install
```

### 5.2 Install Frontend Dependencies

```bash
# Core dependencies
npm install react-router-dom axios react-redux @reduxjs/toolkit

# UI dependencies
npm install react-icons react-toastify

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 5.3 Configure Tailwind CSS

Edit `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Edit `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5.4 Create Environment File

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

### 5.5 Test Frontend

```bash
# Start development server
npm run dev

# Open http://localhost:5173 in browser
# You should see the Vite + React default page
```

✅ **Checkpoint:** Frontend is running on http://localhost:5173

---

## 6. Setting Up Backend

### 6.1 Initialize Node.js Project

```bash
# Navigate to backend folder
cd ../backend

# Initialize npm project
npm init -y
```

### 6.2 Install Backend Dependencies

```bash
# Core dependencies
npm install express mongoose dotenv cors jsonwebtoken bcryptjs

# File upload
npm install multer

# HTTP client (for AI service calls)
npm install axios

# Development
npm install -D nodemon
```

### 6.3 Create Basic Server

Create `backend/server.js`:

```javascript
// Load environment variables
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobportal';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
```

### 6.4 Create Environment File

Create `backend/.env`:

```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/jobportal
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
AI_SERVICE_URL=http://localhost:8001
```

**Note:** Replace `MONGO_URI` with your MongoDB Atlas connection string if using cloud.

### 6.5 Update package.json Scripts

Edit `backend/package.json`, add to "scripts":

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 6.6 Test Backend

```bash
# Start development server
npm run dev

# In another terminal, test the health endpoint:
curl http://localhost:8080/api/health

# Should return:
# {"status":"ok","message":"Backend server is running!","timestamp":"..."}
```

✅ **Checkpoint:** Backend is running on http://localhost:8080

---

## 7. Setting Up AI Service

### 7.1 Create Python Virtual Environment

```bash
# Navigate to AI folder
cd ../AI

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# Mac/Linux:
source venv/bin/activate

# Windows:
# venv\Scripts\activate

# You should see (venv) in your terminal prompt
```

### 7.2 Install Python Dependencies

Create `AI/requirements.txt`:

```txt
fastapi>=0.104.0
uvicorn>=0.24.0
python-dotenv>=1.0.0
openai>=1.3.0
langchain>=0.1.0
langchain-openai>=0.0.5
langgraph>=0.2.0
qdrant-client>=1.6.0
pymongo>=4.6.0
pypdf>=3.17.0
python-multipart>=0.0.6
pydantic>=2.5.0
httpx>=0.25.0
tavily-python>=0.3.0
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### 7.3 Create Basic AI Server

Create `AI/main.py`:

```python
"""
AI Service - FastAPI Server
Handles resume parsing, fit scores, and interview prep
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "AI Service is running!",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY"))
    }

# Run the server
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### 7.4 Create Environment File

Create `AI/.env`:

```env
PORT=8001
OPENAI_API_KEY=sk-your-openai-api-key
TAVILY_API_KEY=tvly-your-tavily-api-key
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
```

### 7.5 Test AI Service

```bash
# Make sure virtual environment is activated
# (venv) should appear in prompt

# Start the server
python main.py

# In another terminal, test:
curl http://localhost:8001/health

# Should return:
# {"status":"ok","message":"AI Service is running!","openai_configured":true}
```

✅ **Checkpoint:** AI Service is running on http://localhost:8001

---

## 8. Running All Services

### 8.1 Terminal Setup

You need **3 terminal windows/tabs** running simultaneously:

**Terminal 1 - Frontend:**
```bash
cd job-portal/frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd job-portal/backend
npm run dev
# Runs on http://localhost:8080
```

**Terminal 3 - AI Service:**
```bash
cd job-portal/AI
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows
python main.py
# Runs on http://localhost:8001
```

### 8.2 Verify All Services

Run these commands to verify everything works:

```bash
# Check Frontend (should open in browser)
open http://localhost:5173

# Check Backend
curl http://localhost:8080/api/health

# Check AI Service
curl http://localhost:8001/health
```

---

## 9. Verification Checklist

Before moving to Day 2, verify:

| Item | Check | Status |
|------|-------|--------|
| Node.js installed | `node --version` shows v18+ | ⬜ |
| Python installed | `python3 --version` shows 3.10+ | ⬜ |
| MongoDB running | Connection successful | ⬜ |
| Frontend running | http://localhost:5173 loads | ⬜ |
| Backend running | Health endpoint returns OK | ⬜ |
| AI Service running | Health endpoint returns OK | ⬜ |
| API keys saved | All keys noted securely | ⬜ |

---

## 🎉 Day 1 Complete!

You have successfully:
- ✅ Installed all development tools
- ✅ Created the project structure
- ✅ Set up all three services
- ✅ Verified everything is running

---

## 📖 What's Next?

Tomorrow in **Day 2**, you'll build the Frontend:
- React components
- Pages (Landing, Login, Register)
- Tailwind CSS styling
- React Router navigation

👉 **Continue to [Day 2: Frontend Foundation](./day2-frontend.md)**

---

## 🆘 Troubleshooting

**Problem:** npm command not found
- **Solution:** Reinstall Node.js, make sure to add to PATH

**Problem:** MongoDB connection failed
- **Solution:** Check if MongoDB is running, verify connection string

**Problem:** Port already in use
- **Solution:** Kill the process: `lsof -ti:PORT | xargs kill -9`

**Problem:** Python packages not installing
- **Solution:** Make sure virtual environment is activated

See [troubleshooting.md](./troubleshooting.md) for more solutions.

