/**
 * ===================================================================================
 *                    LOGIN PAGE COMPONENT
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS COMPONENT?
 * ---------------------------
 * Login page where users authenticate to access the job portal.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. User enters email and password
 * 2. Clicks "Login" button
 * 3. Form submits → handleSubmit() called
 * 4. Calls AuthContext.login() → Backend validates credentials
 * 5. If valid → Token stored, user logged in, navigate to dashboard
 * 6. If invalid → Error message displayed
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Valid credentials → User logged in, redirected to /dashboard
 * - Invalid credentials → Error message shown, stays on login page
 * - Network error → Error message shown
 * 
 * ===================================================================================
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';

const Login = () => {
  // =============================================================================
  //                     STATE MANAGEMENT
  // =============================================================================
  
  // State: Email input value
  // Controlled input - value bound to state
  const [email, setEmail] = useState('');
  
  // State: Password input value
  // Controlled input - value bound to state
  const [password, setPassword] = useState('');
  
  // State: Error message to display
  // Empty string = No error, String = Error message to show
  const [error, setError] = useState('');
  
  // State: Loading indicator
  // true = Login in progress, false = Not logging in
  const [loading, setLoading] = useState(false);
  
  // Get login function from auth context
  // This function handles the actual login API call
  const { login } = useAuth();
  
  // React Router hook for navigation
  // navigate('/path') = Programmatically navigate to a route
  const navigate = useNavigate();

  /**
   * =============================================================================
   *                     HANDLE FORM SUBMISSION
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Handles login form submission.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Prevent default form submission (page refresh)
   * 2. Clear any previous errors
   * 3. Set loading to true (show "Logging in..." button)
   * 4. Call login() function from AuthContext
   * 5. If success → Navigate to dashboard
   * 6. If failure → Display error message
   * 
   * 📌 WHAT HAPPENS:
   * ---------------
   * - Success → User redirected to /dashboard
   * - Failure → Error message displayed below form
   * 
   * =============================================================================
   */
  const handleSubmit = async (e) => {
    // Prevent default form submission (page refresh)
    // We handle submission with JavaScript instead
    e.preventDefault();
    
    // Clear any previous error messages
    setError('');
    
    // Set loading to true (shows "Logging in..." on button)
    setLoading(true);

    // Call login function from AuthContext
    // This sends POST /api/auth/login to backend
    // Backend validates credentials and returns token + user data
    // Returns: { success: true } or { success: false, error: "..." }
    const result = await login(email, password);
    
    // Set loading to false (hide "Logging in..." button)
    setLoading(false);

    // Check if login was successful
    if (result.success) {
      // Login successful
      // Navigate to dashboard page
      // User is now authenticated and can access protected routes
      navigate('/dashboard');
    } else {
      // Login failed (wrong credentials, network error, etc.)
      // Display error message to user
      // User stays on login page to try again
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB]">
      <Header showLogin={false} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Login to Job Hunt</h1>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
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
            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="text-center mt-6 text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

