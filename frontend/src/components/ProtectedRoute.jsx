/**
 * =============================================================================
 *                    PROTECTEDROUTE.JSX - Route Guard Component
 * =============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This component protects routes that require authentication.
 * If a user is not logged in, they are redirected to the login page.
 *
 * 🔗 HOW IT'S USED:
 * -----------------
 * In App.jsx:
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   } />
 *
 * 📌 HOW IT WORKS:
 * ---------------
 * 1. Check if user authentication is still loading
 * 2. If loading, show a loading indicator
 * 3. If not logged in (no user), redirect to /login
 * 4. If logged in, render the protected content (children)
 *
 * =============================================================================
 */

// Line 1: Import React library for creating components
import React from 'react';
// Line 2: Import Navigate component from react-router-dom
// Navigate = Programmatic navigation component that redirects users
import { Navigate } from 'react-router-dom';
// Line 3: Import useAuth hook from AuthContext
// useAuth = Custom hook that provides access to authentication state
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The protected content to render
 * @returns {React.ReactElement} - Either loading state, redirect, or children
 */
const ProtectedRoute = ({ children }) => {
  // Line 5: Destructure user and loading from useAuth hook
  // user = Current logged-in user object (null if not logged in)
  // loading = Boolean indicating if auth check is in progress
  const { user, loading } = useAuth();

  // Line 7-9: Show loading state while checking authentication
  // This prevents flash of redirect before auth state is determined
  if (loading) {
    return <div>Loading...</div>;
  }

  // Line 11-13: Redirect to login if user is not authenticated
  // Navigate with replace = Replaces current history entry (no back button loop)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Line 15: User is authenticated, render the protected content
  // children = The nested components passed inside <ProtectedRoute>...</ProtectedRoute>
  return children;
};

// Line 18: Export the component as default export
// This allows importing with: import ProtectedRoute from './ProtectedRoute'
export default ProtectedRoute;
