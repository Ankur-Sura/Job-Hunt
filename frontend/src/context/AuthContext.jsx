/**
 * ===================================================================================
 *                    AUTH CONTEXT - Authentication State Management
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This file provides authentication state and functions to all React components.
 * It uses React Context API to share auth state across the entire app.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. AuthProvider wraps the app (in App.jsx)
 * 2. Stores user, token, and loading state
 * 3. Provides login, register, logout functions
 * 4. Automatically sets Authorization header for all API calls
 * 5. Persists token in localStorage
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User logs in → Token stored, user state updated, header set
 * - User registers → Token stored, user state updated, header set
 * - User logs out → Token removed, user state cleared, header removed
 * - App loads → Checks localStorage for token, validates it
 * 
 * 📌 USAGE:
 * ---------
 * const { user, login, logout } = useAuth();
 * 
 * ===================================================================================
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

/**
 * =============================================================================
 *                     CREATE AUTH CONTEXT
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Creates a React Context for authentication.
 * Context allows sharing state without prop drilling.
 * 
 * 🔗 WHAT HAPPENS:
 * ---------------
 * Components can access auth state without passing props through every level.
 * 
 * =============================================================================
 */
const AuthContext = createContext();

/**
 * =============================================================================
 *                     USE AUTH HOOK
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Custom hook to access auth context.
 * Throws error if used outside AuthProvider.
 * 
 * 🔗 WHY IT'S NEEDED:
 * -------------------
 * Ensures useAuth is only used within AuthProvider.
 * Provides better error messages.
 * 
 * 📌 USAGE:
 * ---------
 * const { user, login } = useAuth();
 * 
 * =============================================================================
 */
export const useAuth = () => {
  // Get auth context
  const context = useContext(AuthContext);
  
  // If context is null, component is outside AuthProvider
  // Throw error to help developer debug
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  // Return auth context (user, login, register, logout, etc.)
  return context;
};

/**
 * =============================================================================
 *                     AUTH PROVIDER COMPONENT
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Provides authentication state and functions to all child components.
 * 
 * 🔗 STATE:
 * ---------
 * - user: Current user object (null if not logged in)
 * - loading: Loading state (true while checking auth)
 * - token: JWT token (from localStorage or null)
 * 
 * =============================================================================
 */
export const AuthProvider = ({ children }) => {
  // State: Current user object
  // null = Not logged in, { id, email, name, ... } = Logged in
  const [user, setUser] = useState(null);
  
  // State: Loading indicator
  // true = Checking authentication, false = Done checking
  const [loading, setLoading] = useState(true);
  
  // State: JWT token
  // Gets token from localStorage on mount (persists across page refreshes)
  // null = No token (user not logged in)
  const [token, setToken] = useState(localStorage.getItem('token'));

  /**
   * =============================================================================
   *                     INITIALIZE AUTH ON MOUNT
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Runs when component mounts or token changes.
   * If token exists, validates it and fetches user data.
   * 
   * 🔗 WHAT HAPPENS:
   * ---------------
   * 1. Check if token exists in state
   * 2. If yes → Set Authorization header and fetch user
   * 3. If no → Set loading to false (user not logged in)
   * 
   * 📌 WHY IT'S NEEDED:
   * -------------------
   * On page refresh, token is in localStorage but user state is lost.
   * This effect restores user state from token.
   * 
   * =============================================================================
   */
  useEffect(() => {
    // If token exists (user was logged in before page refresh)
    if (token) {
      // Set Authorization header for all future API calls
      // This ensures authenticated requests work automatically
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch user data from backend
      // Backend validates token and returns user info
      fetchUser();
    } else {
      // No token = user not logged in
      // Set loading to false so app can render
      setLoading(false);
    }
  }, [token]);  // Run when token changes

  /**
   * =============================================================================
   *                     FETCH USER DATA
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Fetches current user data from backend.
   * Backend validates token and returns user info.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Call GET /api/auth/me (protected route)
   * 2. Backend validates token
   * 3. Backend returns user data
   * 4. Update user state
   * 
   * ⚠️ IF TOKEN INVALID:
   * --------------------
   * Backend returns 401 → logout() called → token removed
   * 
   * =============================================================================
   */
  const fetchUser = async () => {
    try {
      // Call protected endpoint to get user data
      // Backend middleware validates token
      // If valid: Returns user data
      // If invalid: Returns 401 error
      const response = await axios.get('/api/auth/me');
      
      // Update user state with data from backend
      // This makes user data available to all components
      setUser(response.data.user);
    } catch (error) {
      // Token is invalid or expired
      console.error('Fetch user error:', error);
      
      // Logout user (removes token, clears state)
      logout();
    } finally {
      // Always set loading to false (even if error)
      // This allows app to render (shows login page if not authenticated)
      setLoading(false);
    }
  };

  /**
   * =============================================================================
   *                     LOGIN FUNCTION
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Authenticates user and stores token.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Send email + password to backend
   * 2. Backend validates credentials
   * 3. Backend returns JWT token + user data
   * 4. Store token in state and localStorage
   * 5. Set Authorization header
   * 6. Update user state
   * 
   * 📌 WHAT HAPPENS:
   * ---------------
   * - Success → User logged in, token stored, can access protected routes
   * - Failure → Error message returned, user stays on login page
   * 
   * =============================================================================
   */
  const login = async (email, password) => {
    try {
      // Step 1: Send login request to backend
      // Backend validates email/password against database
      // If valid: Returns { token, user }
      // If invalid: Returns 401 error
      const response = await axios.post('/api/auth/login', { email, password });
      
      // Step 2: Extract token and user data from response
      const { token: newToken, user: userData } = response.data;
      
      // Step 3: Update token state
      // This triggers useEffect above to set Authorization header
      setToken(newToken);
      
      // Step 4: Update user state
      // Makes user data available to all components
      setUser(userData);
      
      // Step 5: Store token in localStorage
      // Persists across page refreshes
      // If user closes browser and reopens, token is still there
      localStorage.setItem('token', newToken);
      
      // Step 6: Set Authorization header for all future API calls
      // This ensures authenticated requests work automatically
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Return success
      return { success: true };
    } catch (error) {
      // Login failed (wrong credentials, network error, etc.)
      // Return error message to display to user
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  /**
   * =============================================================================
   *                     REGISTER FUNCTION
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Creates new user account and automatically logs them in.
   * 
   * 🔗 FLOW:
   * --------
   * 1. Send name, email, password to backend
   * 2. Backend creates user, hashes password, generates token
   * 3. Backend returns token + user data
   * 4. Store token and user (same as login)
   * 
   * 📌 WHAT HAPPENS:
   * ---------------
   * - Success → User registered AND logged in automatically
   * - Failure → Error message (email exists, validation error, etc.)
   * 
   * =============================================================================
   */
  const register = async (name, email, password, role) => {
    try {
      // Step 1: Send registration request to backend
      // Backend creates user, hashes password, generates token
      const response = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        role
      });
      
      // Step 2-6: Same as login (store token, update state, etc.)
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      // Registration failed (email exists, validation error, etc.)
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  /**
   * =============================================================================
   *                     LOGOUT FUNCTION
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Clears authentication state and removes token.
   * 
   * 🔗 WHAT HAPPENS:
   * ---------------
   * 1. Clear token from state
   * 2. Clear user from state
   * 3. Remove token from localStorage
   * 4. Remove Authorization header
   * 
   * 📌 RESULT:
   * ----------
   * User is logged out, protected routes become inaccessible.
   * 
   * =============================================================================
   */
  const logout = () => {
    // Clear token from state
    // This triggers useEffect to clear Authorization header
    setToken(null);
    
    // Clear user from state
    // Components will see user = null and show login page
    setUser(null);
    
    // Remove token from localStorage
    // Prevents auto-login on next page load
    localStorage.removeItem('token');
    
    // Remove Authorization header
    // Future API calls won't include token
    delete axios.defaults.headers.common['Authorization'];
  };

  /**
   * =============================================================================
   *                     CONTEXT VALUE
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Defines what data/functions are available to components.
   * 
   * 📌 AVAILABLE TO COMPONENTS:
   * ----------------------------
   * - user: Current user object (or null)
   * - loading: Loading state
   * - login: Login function
   * - register: Register function
   * - logout: Logout function
   * - fetchUser: Refresh user data function
   * 
   * =============================================================================
   */
  const value = {
    user,        // Current user (null if not logged in)
    loading,     // Loading state (true while checking auth)
    login,       // Login function
    register,    // Register function
    logout,      // Logout function
    fetchUser    // Refresh user data function
  };

  // Provide context value to all child components
  // Any component inside <AuthProvider> can use useAuth() hook
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

