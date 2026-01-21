# 📅 Day 2: Frontend Foundation

**Duration:** 6-8 hours  
**Goal:** Build the React frontend with core pages and components

---

## 🎯 What You'll Accomplish Today

By the end of Day 2, you will have:
- ✅ Complete folder structure for React app
- ✅ Landing page with hero section
- ✅ Login and Register pages with forms
- ✅ Navigation header component
- ✅ Redux store for state management
- ✅ React Router for navigation

---

## 📚 Table of Contents

1. [Understanding React Concepts](#1-understanding-react-concepts)
2. [Project Structure Setup](#2-project-structure-setup)
3. [Setting Up Redux Store](#3-setting-up-redux-store)
4. [Creating the Header Component](#4-creating-the-header-component)
5. [Building the Landing Page](#5-building-the-landing-page)
6. [Building the Login Page](#6-building-the-login-page)
7. [Building the Register Page](#7-building-the-register-page)
8. [Setting Up React Router](#8-setting-up-react-router)
9. [Adding Axios Configuration](#9-adding-axios-configuration)
10. [Testing Your Frontend](#10-testing-your-frontend)

---

## 1. Understanding React Concepts

Before coding, understand these key concepts:

### 🧩 Components

Components are reusable UI pieces. Think of them like LEGO blocks.

```jsx
// A simple component
function Button({ text, onClick }) {
  return (
    <button onClick={onClick} className="bg-blue-500 text-white px-4 py-2">
      {text}
    </button>
  );
}

// Using the component
<Button text="Click Me" onClick={() => alert('Clicked!')} />
```

### 🪝 React Hooks

Hooks let you use React features in functional components:

| Hook | Purpose | Example |
|------|---------|---------|
| `useState` | Store component state | `const [count, setCount] = useState(0)` |
| `useEffect` | Side effects (API calls) | `useEffect(() => { fetchData() }, [])` |
| `useNavigate` | Navigate between pages | `navigate('/dashboard')` |
| `useSelector` | Read Redux state | `const user = useSelector(state => state.auth.user)` |
| `useDispatch` | Dispatch Redux actions | `dispatch(setUser(userData))` |

### 🎨 Tailwind CSS

Tailwind uses utility classes for styling:

```jsx
// Traditional CSS
<div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>

// Tailwind CSS
<div className="flex justify-center p-5">
```

Common Tailwind classes:
- `flex` - Display flex
- `p-4` - Padding 1rem
- `m-2` - Margin 0.5rem
- `bg-blue-500` - Blue background
- `text-white` - White text
- `rounded-lg` - Rounded corners
- `shadow-md` - Medium shadow
- `hover:bg-blue-600` - Hover effect

---

## 2. Project Structure Setup

### 2.1 Create Folder Structure

Navigate to your frontend folder and create this structure:

```bash
cd frontend/src

# Create folders
mkdir -p components pages redux

# Create component subfolders
mkdir -p components/common

# Your structure should look like:
# src/
# ├── components/
# │   └── common/
# ├── pages/
# ├── redux/
# ├── App.jsx
# └── main.jsx
```

### 2.2 Clean Up Default Files

Edit `src/App.jsx` to start fresh:

```jsx
// src/App.jsx
function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center py-10">
        Job Portal - Coming Soon!
      </h1>
    </div>
  );
}

export default App;
```

Edit `src/index.css` to have only Tailwind:

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles can go here */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

Test it works: `npm run dev` and check http://localhost:5173

---

## 3. Setting Up Redux Store

Redux manages global state (like logged-in user info).

### 3.1 Create Auth Slice

Create `src/redux/authSlice.js`:

```jsx
// src/redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Initial state - no user logged in
const initialState = {
  user: null,        // User object when logged in
  token: null,       // JWT token for API calls
  isLoading: false,  // Loading state
};

// Create the slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action: Set user after login
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Also save to localStorage for persistence
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    
    // Action: Clear user on logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    
    // Action: Load user from localStorage
    loadUser: (state) => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        state.token = token;
        state.user = JSON.parse(user);
      }
    },
    
    // Action: Update user data
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    
    // Action: Set loading state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

// Export actions
export const { setUser, logout, loadUser, updateUser, setLoading } = authSlice.actions;

// Export reducer
export default authSlice.reducer;
```

### 3.2 Create Store

Create `src/redux/store.js`:

```jsx
// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Create the Redux store
const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add more reducers here as needed
  },
});

export default store;
```

### 3.3 Add Redux Provider to App

Edit `src/main.jsx`:

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

---

## 4. Creating the Header Component

### 4.1 Create Header Component

Create `src/components/Header.jsx`:

```jsx
// src/components/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get user from Redux store
  const { user } = useSelector((state) => state.auth);
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-teal-600">
              Job Hunt
            </span>
          </Link>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {user ? (
              // Logged in - show user menu
              <>
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/jobs" 
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Jobs
                </Link>
                
                {/* User dropdown */}
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              // Not logged in - show login/register
              <>
                <Link 
                  to="/login" 
                  className="text-gray-600 hover:text-teal-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
          
        </div>
      </div>
    </header>
  );
}

export default Header;
```

---

## 5. Building the Landing Page

### 5.1 Create Landing Page

Create `src/pages/Landing.jsx`:

```jsx
// src/pages/Landing.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaRocket, FaBriefcase, FaUsers } from 'react-icons/fa';
import Header from '../components/Header';

function Landing() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/jobs?search=${searchQuery}&location=${location}`);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-teal-800 mb-6">
            AI-Powered Career Matching & Interview Prep
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-10">
            Get AI match scores, personalized interview guidance & land your dream job faster.
          </p>
          
          {/* Search Box */}
          <form 
            onSubmit={handleSearch}
            className="bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col md:flex-row gap-4"
          >
            {/* Job Title Input */}
            <div className="flex-1 flex items-center gap-3 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4">
              <FaSearch className="text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            
            {/* Location Input */}
            <div className="flex-1 flex items-center gap-3 pb-4 md:pb-0 md:pr-4">
              <FaMapMarkerAlt className="text-gray-400 text-xl" />
              <input
                type="text"
                placeholder="City or location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            
            {/* Search Button */}
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Search Jobs
            </button>
          </form>
          
          {/* Popular Searches */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="text-gray-500">Popular:</span>
            {['Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps'].map((term) => (
              <Link
                key={term}
                to={`/jobs?search=${term}`}
                className="text-teal-600 hover:text-teal-700 hover:underline"
              >
                {term}
              </Link>
            ))}
          </div>
          
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose Job Hunt?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRocket className="text-teal-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                AI Match Scores
              </h3>
              <p className="text-gray-600">
                Get instant compatibility scores showing how well your resume matches each job.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBriefcase className="text-teal-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Interview Prep
              </h3>
              <p className="text-gray-600">
                AI-powered interview guidance tailored to the specific company and role.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUsers className="text-teal-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Smart Recommendations
              </h3>
              <p className="text-gray-600">
                Personalized job recommendations based on your skills and experience.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-6 bg-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Dream Job?
          </h2>
          <p className="text-teal-100 mb-8">
            Join thousands of engineers who found their perfect match.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-teal-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/jobs"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p>© 2024 Job Hunt. Built with React, Node.js, and AI.</p>
        </div>
      </footer>
      
    </div>
  );
}

export default Landing;
```

---

## 6. Building the Login Page

Create `src/pages/Login.jsx`:

```jsx
// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/authSlice';
import { FaEnvelope, FaLock, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Call login API
      const response = await axios.post('/api/auth/login', formData);
      
      // Save user to Redux store
      dispatch(setUser({
        user: response.data.user,
        token: response.data.token,
      }));
      
      // Redirect based on role
      if (response.data.user.role === 'hirer') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100">
      <Header />
      
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your account</p>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
            
          </form>
          
          {/* Register Link */}
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 hover:text-teal-700 font-medium">
              Register
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}

export default Login;
```

---

## 7. Building the Register Page

Create `src/pages/Register.jsx`:

```jsx
// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/authSlice';
import { FaUser, FaEnvelope, FaLock, FaSpinner, FaUserTie, FaBriefcase } from 'react-icons/fa';
import axios from 'axios';
import Header from '../components/Header';

function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // 'user' or 'hirer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // Call register API
      const response = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      // Save user to Redux store
      dispatch(setUser({
        user: response.data.user,
        token: response.data.token,
      }));
      
      // Redirect based on role
      if (formData.role === 'hirer') {
        navigate('/recruiter/dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100">
      <Header />
      
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
            <p className="text-gray-600 mt-2">Join our community</p>
          </div>
          
          {/* Role Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'user' })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                formData.role === 'user'
                  ? 'border-teal-600 bg-teal-50 text-teal-600'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <FaUser />
              Job Seeker
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'hirer' })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all ${
                formData.role === 'hirer'
                  ? 'border-teal-600 bg-teal-50 text-teal-600'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <FaBriefcase />
              Recruiter
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Email Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            
          </form>
          
          {/* Login Link */}
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign In
            </Link>
          </p>
          
        </div>
      </div>
    </div>
  );
}

export default Register;
```

---

## 8. Setting Up React Router

### 8.1 Update App.jsx with Routes

Edit `src/App.jsx`:

```jsx
// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/authSlice';

// Import pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const dispatch = useDispatch();
  
  // Load user from localStorage on app start
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);
  
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* More routes will be added in later days */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/jobs" element={<Jobs />} /> */}
        
        {/* 404 - Page Not Found */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-2xl text-gray-600">Page Not Found</h1>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 9. Adding Axios Configuration

### 9.1 Create Axios Instance

Create `src/axios.js`:

```jsx
// src/axios.js
import axios from 'axios';

// Create axios instance with base URL
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 30000, // 30 second timeout
});

// Request interceptor - add auth token to headers
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
```

### 9.2 Update main.jsx to use axios

Edit `src/main.jsx`:

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store';
import App from './App';
import './index.css';

// Import and configure axios globally
import axios from './axios';
window.axios = axios;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

**Update imports in Login.jsx and Register.jsx:**

Change `import axios from 'axios';` to `import axios from '../axios';`

---

## 10. Testing Your Frontend

### 10.1 Start Development Server

```bash
cd frontend
npm run dev
```

### 10.2 Test Each Page

Open browser and test:

1. **Landing Page**: http://localhost:5173/
   - ✅ Hero section visible
   - ✅ Search form works
   - ✅ Navigation links work

2. **Login Page**: http://localhost:5173/login
   - ✅ Form displays correctly
   - ✅ Can type in fields
   - ✅ Submit button works (will show error - backend not ready yet)

3. **Register Page**: http://localhost:5173/register
   - ✅ Role toggle works
   - ✅ Form validates
   - ✅ Password confirmation works

### 10.3 Verification Checklist

| Item | Status |
|------|--------|
| Landing page loads | ⬜ |
| Header shows Login/Register when logged out | ⬜ |
| Login form displays | ⬜ |
| Register form with role toggle works | ⬜ |
| Navigation between pages works | ⬜ |
| Tailwind CSS styles applied | ⬜ |

---

## 🎉 Day 2 Complete!

You have successfully built:
- ✅ Redux store for state management
- ✅ Header component with conditional rendering
- ✅ Landing page with hero and features
- ✅ Login page with form validation
- ✅ Register page with role selection
- ✅ React Router navigation
- ✅ Axios configuration

---

## 📖 What's Next?

Tomorrow in **Day 3**, you'll build the Backend:
- Express server setup
- MongoDB models (User, Job, Application)
- Authentication endpoints (Register, Login)
- JWT token generation

👉 **Continue to [Day 3: Backend Foundation](./day3-backend.md)**

