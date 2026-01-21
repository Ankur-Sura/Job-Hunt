# 🔧 Troubleshooting Guide

Common issues and their solutions when building the Job Portal project.

---

## 📚 Table of Contents

1. [Installation Issues](#installation-issues)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [AI Service Issues](#ai-service-issues)
5. [Database Issues](#database-issues)
6. [API Issues](#api-issues)
7. [Authentication Issues](#authentication-issues)
8. [AI Feature Issues](#ai-feature-issues)

---

## Installation Issues

### ❌ "npm command not found"

**Cause:** Node.js is not installed or not in PATH.

**Solution:**
```bash
# Mac
brew install node

# Verify installation
node --version
npm --version
```

For Windows, download from https://nodejs.org/ and ensure "Add to PATH" is checked during installation.

---

### ❌ "python3 command not found"

**Cause:** Python is not installed or not in PATH.

**Solution:**
```bash
# Mac
brew install python@3.10

# Verify
python3 --version
```

For Windows, download from https://python.org/ and check "Add Python to PATH" during installation.

---

### ❌ "pip install fails with SSL error"

**Cause:** SSL certificates issue.

**Solution:**
```bash
# Mac
pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org <package>

# Or update certificates
pip install --upgrade certifi
```

---

### ❌ "Cannot create virtual environment"

**Cause:** venv module not available.

**Solution:**
```bash
# Ubuntu/Debian
sudo apt install python3-venv

# Mac (usually works out of box)
python3 -m venv venv
```

---

## Backend Issues

### ❌ "Cannot find module 'express'"

**Cause:** Dependencies not installed.

**Solution:**
```bash
cd backend
rm -rf node_modules
npm install
```

---

### ❌ "EADDRINUSE: Port 8080 already in use"

**Cause:** Another process is using port 8080.

**Solution:**
```bash
# Find and kill the process
lsof -ti:8080 | xargs kill -9

# Or use a different port in .env
PORT=8081
```

---

### ❌ "MongoDB connection failed"

**Cause:** MongoDB is not running or connection string is wrong.

**Solution:**
```bash
# Start MongoDB (Mac)
brew services start mongodb-community

# Check if running
brew services list

# Verify connection string in .env
MONGO_URI=mongodb://localhost:27017/jobportal
```

For MongoDB Atlas, ensure:
- IP is whitelisted (0.0.0.0/0 for testing)
- Username/password are correct
- Database name is specified

---

### ❌ "JWT_SECRET is not defined"

**Cause:** Environment variable missing.

**Solution:**
Create or update `backend/.env`:
```env
JWT_SECRET=your-super-secret-key-make-it-long-and-random
```

---

### ❌ "Cannot read property 'X' of undefined"

**Cause:** Trying to access property on null/undefined object.

**Solution:**
Use optional chaining and nullish coalescing:
```javascript
// Instead of
const name = user.profile.name;

// Use
const name = user?.profile?.name ?? 'Default';
```

---

## Frontend Issues

### ❌ "Module not found: Can't resolve 'react-router-dom'"

**Cause:** Package not installed.

**Solution:**
```bash
cd frontend
npm install react-router-dom
```

---

### ❌ "Invalid hook call"

**Cause:** Multiple React versions or incorrect hook usage.

**Solution:**
```bash
# Check for duplicate React
npm ls react

# If duplicate, fix in package.json and reinstall
rm -rf node_modules
npm install
```

Also ensure hooks are only called at the top level of functional components.

---

### ❌ "Tailwind classes not working"

**Cause:** Tailwind not configured properly.

**Solution:**
1. Check `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
}
```

2. Check `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

3. Restart dev server.

---

### ❌ "axios is not defined"

**Cause:** Axios not imported.

**Solution:**
```javascript
import axios from '../axios';  // Use your configured instance
// or
import axios from 'axios';  // Use default axios
```

---

### ❌ "CORS error when calling API"

**Cause:** Backend not allowing frontend origin.

**Solution:**
In `backend/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true
}));
```

---

### ❌ "Objects are not valid as React child"

**Cause:** Trying to render an object directly.

**Solution:**
```jsx
// Wrong
{user}

// Right - render specific property
{user.name}

// Or convert to string
{JSON.stringify(user)}
```

---

## AI Service Issues

### ❌ "ModuleNotFoundError: No module named 'fastapi'"

**Cause:** Virtual environment not activated or packages not installed.

**Solution:**
```bash
cd AI
source venv/bin/activate  # Activate venv first!
pip install -r requirements.txt
```

---

### ❌ "OpenAI API key not found"

**Cause:** Environment variable not set.

**Solution:**
Create `AI/.env`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

---

### ❌ "OpenAI rate limit exceeded"

**Cause:** Too many API calls too quickly.

**Solution:**
1. Add delays between calls:
```python
import time
time.sleep(1)  # Wait 1 second
```

2. Use batch processing instead of individual calls.

3. Consider using `gpt-4o-mini` instead of `gpt-4` for cost efficiency.

---

### ❌ "Tavily search returns empty results"

**Cause:** Tavily API key invalid or query issue.

**Solution:**
1. Verify API key in `.env`:
```env
TAVILY_API_KEY=tvly-your-key-here
```

2. Check if the key is valid at https://tavily.com/

3. Try a simpler search query.

---

### ❌ "LangGraph import error"

**Cause:** langgraph not installed or version mismatch.

**Solution:**
```bash
pip install --upgrade langgraph langchain langchain-openai
```

---

### ❌ "uvicorn: command not found"

**Cause:** uvicorn not installed or not in path.

**Solution:**
```bash
pip install uvicorn
# Or run with python
python -m uvicorn main:app --reload
```

---

### ❌ "JSONDecodeError: Invalid JSON"

**Cause:** AI returned invalid JSON.

**Solution:**
1. Use `response_format={"type": "json_object"}` in OpenAI calls.
2. Add error handling:
```python
try:
    result = json.loads(response)
except json.JSONDecodeError:
    result = {"error": "Invalid JSON", "raw": response}
```

---

## Database Issues

### ❌ "MongoServerError: bad auth"

**Cause:** Wrong username/password for MongoDB Atlas.

**Solution:**
1. Verify credentials in connection string
2. URL-encode special characters in password:
```
@ → %40
: → %3A
/ → %2F
```

---

### ❌ "MongoDB network timeout"

**Cause:** Network/firewall blocking connection.

**Solution:**
1. Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for testing)
2. Check firewall settings
3. Try different network

---

### ❌ "Duplicate key error"

**Cause:** Trying to insert document with existing unique field.

**Solution:**
```javascript
// Check if exists first
const existing = await User.findOne({ email });
if (existing) {
  return res.status(400).json({ error: 'Email already exists' });
}
```

Or use upsert:
```javascript
await Model.findOneAndUpdate(
  { email },
  { $set: data },
  { upsert: true }
);
```

---

## API Issues

### ❌ "404 Not Found"

**Cause:** Route doesn't exist or wrong path.

**Solution:**
1. Check route definition in backend
2. Verify URL in frontend (should match `/api/...`)
3. Check if route is registered in `server.js`

---

### ❌ "500 Internal Server Error"

**Cause:** Unhandled exception in backend.

**Solution:**
1. Check backend terminal for error message
2. Add error logging:
```javascript
try {
  // code
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message });
}
```

---

### ❌ "Request timeout"

**Cause:** Operation taking too long.

**Solution:**
1. Increase timeout in axios:
```javascript
axios.get('/api/endpoint', { timeout: 60000 }); // 60 seconds
```

2. Optimize backend operation
3. Use loading states in frontend

---

## Authentication Issues

### ❌ "Token expired"

**Cause:** JWT token has expired.

**Solution:**
1. Increase token expiry in backend:
```javascript
jwt.sign(payload, secret, { expiresIn: '7d' });
```

2. Handle in frontend:
```javascript
if (error.response?.status === 401) {
  localStorage.removeItem('token');
  navigate('/login');
}
```

---

### ❌ "No token provided"

**Cause:** Token not included in request.

**Solution:**
Check axios interceptor:
```javascript
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### ❌ "Invalid token"

**Cause:** Token is malformed or using wrong secret.

**Solution:**
1. Clear localStorage and login again
2. Verify JWT_SECRET is same between token generation and verification
3. Check if token is complete (not truncated)

---

## AI Feature Issues

### ❌ "Interview prep returns empty/incomplete data"

**Cause:** API timeout or partial response.

**Solution:**
1. Increase timeout in backend service call
2. Implement retry logic
3. Use fallback quick prep function

---

### ❌ "Fit scores all showing 50%"

**Cause:** AI service not calculating properly.

**Solution:**
1. Check AI service is running
2. Check connection between backend and AI service
3. Verify resume data is being sent correctly
4. Check AI service logs for errors

---

### ❌ "Resume parsing fails"

**Cause:** PDF format issue or extraction failure.

**Solution:**
1. Ensure PDF is text-based (not image-based)
2. Try with different PDF
3. Check pypdf is installed:
```bash
pip install pypdf
```

---

### ❌ "Qdrant connection failed"

**Cause:** Wrong URL or API key.

**Solution:**
1. Verify credentials in `.env`
2. Check Qdrant cluster is running
3. For testing, use in-memory:
```python
client = QdrantClient(":memory:")
```

---

## 🆘 General Debugging Tips

### 1. Check All Services Are Running
```bash
# Check ports
lsof -i :5173  # Frontend
lsof -i :8080  # Backend
lsof -i :8001  # AI Service
```

### 2. Check Environment Variables
```bash
# Backend
node -e "require('dotenv').config(); console.log(process.env)"

# Python
python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.environ)"
```

### 3. Check Network Requests
- Open browser DevTools (F12)
- Go to Network tab
- Look for failed requests (red)
- Check request/response details

### 4. Check Server Logs
- Watch terminal where server is running
- Look for error messages and stack traces

### 5. Test API Directly
```bash
# Test with curl
curl http://localhost:8080/api/health
curl http://localhost:8001/health
```

### 6. Clear Cache
```bash
# Browser
# Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# npm cache
npm cache clean --force

# pip cache
pip cache purge
```

### 7. Restart Everything
```bash
# Kill all Node processes
pkill -f node

# Kill all Python processes
pkill -f python

# Start fresh
```

---

## 📞 Getting Help

If you're still stuck:

1. **Search the error message** on Google/Stack Overflow
2. **Check GitHub issues** for the library/framework
3. **Read documentation** for the specific feature
4. **Ask in community forums** with:
   - Full error message
   - Code snippet
   - What you've tried

---

*Remember: Most errors have been encountered before. Search for the exact error message first!*

