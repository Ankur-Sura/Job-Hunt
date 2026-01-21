# 📋 Quick Reference Cheatsheet

A quick reference guide for common commands and patterns used in this project.

---

## 🚀 Starting Services

### Start All Services (3 terminals needed)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:8080
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3 - AI Service:**
```bash
cd AI
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows
python main.py
# Runs on http://localhost:8001
```

---

## 📡 API Endpoints Reference

### Authentication
```bash
# Register
POST /api/auth/register
Body: { "name": "John", "email": "john@example.com", "password": "pass123", "role": "user" }

# Login
POST /api/auth/login
Body: { "email": "john@example.com", "password": "pass123" }

# Get Current User (Protected)
GET /api/auth/me
Header: Authorization: Bearer <token>
```

### Jobs
```bash
# Get All Jobs
GET /api/jobs

# Get Jobs with AI Scores (requires auth)
GET /api/jobs/recommended/list?page=1&limit=6

# Get Single Job
GET /api/jobs/:id

# Create Job (Recruiter only)
POST /api/jobs
```

### Resume
```bash
# Upload Resume
POST /api/resume/upload
Form Data: resume (PDF file)

# Get My Resume
GET /api/resume
```

### Applications
```bash
# Apply to Job
POST /api/applications
Body: { "jobId": "xxx", "coverLetter": "..." }

# Get My Applications
GET /api/applications/my
```

### Interview Prep
```bash
# Get Interview Prep
GET /api/interview/prepare/:applicationId
```

### AI Service Direct Endpoints
```bash
# Health Check
GET http://localhost:8001/health

# Extract Resume
POST http://localhost:8001/extract-resume
Body: { "text": "resume text..." }

# Calculate Fit Score
POST http://localhost:8001/calculate-fit-score
Body: { "resume_data": {...}, "job_data": {...} }

# Prepare Interview
POST http://localhost:8001/prepare-interview
Body: { "resume_data": {...}, "job_data": {...}, "company": "Google", "role": "SDE" }
```

---

## 🔧 Common Commands

### Node.js / npm
```bash
# Install dependencies
npm install

# Install specific package
npm install package-name

# Install dev dependency
npm install -D package-name

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

### Python / pip
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment (Mac/Linux)
source venv/bin/activate

# Activate virtual environment (Windows)
venv\Scripts\activate

# Deactivate
deactivate

# Install from requirements.txt
pip install -r requirements.txt

# Install specific package
pip install package-name

# Freeze dependencies
pip freeze > requirements.txt
```

### MongoDB
```bash
# Start MongoDB (Mac)
brew services start mongodb-community

# Stop MongoDB (Mac)
brew services stop mongodb-community

# Connect to MongoDB shell
mongosh

# Show databases
show dbs

# Use database
use jobportal

# Show collections
show collections

# Find all documents
db.users.find()

# Find specific document
db.users.findOne({ email: "john@example.com" })

# Delete document
db.users.deleteOne({ email: "john@example.com" })

# Drop collection
db.users.drop()
```

### Git
```bash
# Initialize repo
git init

# Add all files
git add .

# Commit
git commit -m "message"

# Push
git push origin main

# Pull
git pull origin main

# Create branch
git checkout -b feature-name

# Switch branch
git checkout main

# Merge branch
git merge feature-name
```

---

## 🎨 React Patterns

### Functional Component
```jsx
function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effect
  }, [dependencies]);
  
  return (
    <div>Content</div>
  );
}
```

### useEffect Patterns
```jsx
// Run once on mount
useEffect(() => {
  fetchData();
}, []);

// Run when dependency changes
useEffect(() => {
  doSomething(value);
}, [value]);

// Cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### Redux Patterns
```jsx
// Select from store
const user = useSelector((state) => state.auth.user);

// Dispatch action
const dispatch = useDispatch();
dispatch(setUser({ user, token }));
```

### API Call Pattern
```jsx
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await axios.get('/api/endpoint');
    setData(response.data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 🐍 Python Patterns

### FastAPI Endpoint
```python
@app.post("/endpoint")
async def endpoint_name(request: RequestModel):
    try:
        result = process(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### OpenAI Call
```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "System prompt"},
        {"role": "user", "content": "User prompt"}
    ],
    temperature=0.7,
    max_tokens=1000,
    response_format={"type": "json_object"}  # For JSON output
)

result = response.choices[0].message.content
```

### Async Function
```python
async def my_async_function():
    result = await some_async_call()
    return result
```

---

## 🎯 Tailwind CSS Classes

### Layout
```
flex          - display: flex
grid          - display: grid
block         - display: block
hidden        - display: none
```

### Spacing
```
p-4           - padding: 1rem
m-4           - margin: 1rem
px-4          - padding-left/right: 1rem
py-4          - padding-top/bottom: 1rem
gap-4         - gap: 1rem
space-x-4     - horizontal spacing between children
```

### Typography
```
text-sm       - font-size: 0.875rem
text-lg       - font-size: 1.125rem
text-xl       - font-size: 1.25rem
font-medium   - font-weight: 500
font-bold     - font-weight: 700
text-gray-600 - color: gray
```

### Colors
```
bg-white      - background: white
bg-gray-100   - background: light gray
bg-teal-600   - background: teal
text-white    - color: white
text-gray-800 - color: dark gray
```

### Borders & Shadows
```
rounded       - border-radius: 0.25rem
rounded-lg    - border-radius: 0.5rem
rounded-full  - border-radius: 9999px
shadow-sm     - small shadow
shadow-lg     - large shadow
border        - border: 1px solid
```

### Responsive
```
md:flex       - flex on medium screens+
lg:grid-cols-3 - 3 columns on large screens+
```

### Interactive
```
hover:bg-teal-700  - hover background
transition-colors   - smooth color transition
cursor-pointer      - pointer cursor
disabled:opacity-50 - dim when disabled
```

---

## 🔐 JWT Token Structure

```javascript
// Token payload
{
  "userId": "64abc...",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,  // Issued at
  "exp": 1234567890   // Expires at
}

// Sending token
headers: {
  "Authorization": "Bearer eyJhbG..."
}
```

---

## 📁 Project Structure

```
job-portal/
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # State management
│   │   ├── App.jsx        # Main app + routes
│   │   ├── main.jsx       # Entry point
│   │   └── axios.js       # API configuration
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, validation
│   ├── services/          # Business logic
│   ├── server.js          # Entry point
│   └── package.json
│
└── AI/
    ├── main.py            # FastAPI server
    ├── rag_service.py     # Resume processing
    ├── interview_prep_graph.py  # LangGraph
    ├── fast_fit_score.py  # Scoring
    ├── requirements.txt
    └── .env
```

---

## 🔄 Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend | 8080 | http://localhost:8080 |
| AI Service | 8001 | http://localhost:8001 |
| MongoDB | 27017 | mongodb://localhost:27017 |

---

## ⚡ Quick Fixes

### Kill Process on Port
```bash
# Mac/Linux
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Clear Node Modules
```bash
rm -rf node_modules
npm install
```

### Reset Python Environment
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Clear MongoDB Collection
```bash
mongosh
use jobportal
db.users.deleteMany({})
```

