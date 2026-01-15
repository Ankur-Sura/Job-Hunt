/**
 * =============================================================================
 *                    REGISTER.JSX - User Registration Page
 * =============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This is the user registration page. New users can create an account here
 * by providing their name, email, password, and choosing their role.
 *
 * 🔗 ROUTE:
 * ---------
 * URL: /register
 *
 * 📌 FEATURES:
 * -----------
 * 1. Name input field
 * 2. Email input field with validation
 * 3. Password input field (minimum 6 characters)
 * 4. Role selection (Job Seeker or Hirer)
 * 5. Error display for registration failures
 * 6. Link to login page for existing users
 *
 * 🔑 KEY CONCEPTS:
 * ----------------
 * - Uses AuthContext for registration API call
 * - Form validation with HTML5 required/minLength attributes
 * - Controlled inputs with useState hooks
 * - Navigation to dashboard on successful registration
 *
 * =============================================================================
 */

// Line 1: Import React and useState hook
// useState = Hook for managing component state (form inputs, loading, error)
import React, { useState } from 'react';
// Line 2: Import navigation hooks from react-router-dom
// useNavigate = Hook to programmatically navigate between pages
// Link = Component for declarative navigation (like <a> tag but for SPA)
import { useNavigate, Link } from 'react-router-dom';
// Line 3: Import useAuth hook for authentication functionality
// useAuth = Custom hook providing register function from AuthContext
import { useAuth } from '../context/AuthContext';
// Line 4: Import Header component for consistent navigation
import Header from '../components/Header';

/**
 * Register Component - User Registration Form
 * 
 * @returns {React.ReactElement} - The registration page UI
 */
const Register = () => {
  // ==================== STATE MANAGEMENT ====================
  
  // Line 7: State for user's full name
  const [name, setName] = useState('');
  // Line 8: State for user's email address
  const [email, setEmail] = useState('');
  // Line 9: State for user's password
  const [password, setPassword] = useState('');
  // Line 10: State for user's role (default: 'user' for job seekers)
  // 'user' = Job seeker, 'hirer' = Employer/Recruiter
  const [role, setRole] = useState('user');
  // Line 11: State for error messages from registration API
  const [error, setError] = useState('');
  // Line 12: State to show loading spinner during API call
  const [loading, setLoading] = useState(false);
  
  // Line 13: Get register function from AuthContext
  // register = Async function that creates new user account
  const { register } = useAuth();
  // Line 14: Get navigate function for programmatic navigation
  const navigate = useNavigate();

  // ==================== EVENT HANDLERS ====================
  
  /**
   * Handle form submission
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    // Line 17: Prevent default form submission (page reload)
    e.preventDefault();
    // Line 18: Clear any previous error messages
    setError('');
    // Line 19: Show loading state while API call is in progress
    setLoading(true);

    // Line 21: Call register function from AuthContext
    // This makes API call to POST /api/auth/register
    const result = await register(name, email, password, role);
    // Line 22: Hide loading state after API response
    setLoading(false);

    // Line 24-28: Handle registration result
    if (result.success) {
      // Registration successful - navigate to dashboard
      navigate('/dashboard');
    } else {
      // Registration failed - show error message
      setError(result.error);
    }
  };

  // ==================== RENDER ====================
  
  return (
    // Outer container with gradient background matching app theme
    <div className="min-h-screen bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB]">
      {/* Header component - showLogin=false hides login button on register page */}
      <Header showLogin={false} />
      
      {/* Main content container - centered with flexbox */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        {/* Registration card - white background with shadow */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          {/* Page title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Register to Job Hunt</h1>
          
          {/* Error message display - only shown when error exists */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name input field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            {/* Email input field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            {/* Password input field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter your password (min 6 characters)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            {/* Role selection dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="user">Job Seeker</option>
                <option value="hirer">Hirer</option>
              </select>
            </div>
            
            {/* Submit button - disabled while loading */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          {/* Link to login page for existing users */}
          <p className="text-center mt-6 text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Export the component as default export
export default Register;
