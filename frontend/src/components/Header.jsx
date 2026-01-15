/**
 * ===================================================================================
 *                    HEADER COMPONENT - Navigation Bar
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS COMPONENT?
 * ---------------------------
 * Navigation header that appears on all pages.
 * Shows logo, navigation links, and user menu.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Checks if user is logged in (from AuthContext)
 * 2. If logged in → Shows user avatar and dashboard link
 * 3. If not logged in → Shows Login and Register links
 * 4. Handles logout functionality
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User logged in → Shows avatar with first letter of name
 * - User not logged in → Shows Login and Register buttons
 * - User clicks avatar → Navigates to dashboard
 * - User clicks logout → Clears auth, redirects to home
 * 
 * ===================================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaGraduationCap, FaChevronDown } from 'react-icons/fa';

const Header = ({ showLogin = false }) => {
  // Get current user and logout function from auth context
  // user = User object if logged in, null if not logged in
  // logout = Function to clear authentication
  const { user, logout } = useAuth();
  
  // React Router hook for navigation
  // navigate('/path') = Programmatically navigate to a route
  const navigate = useNavigate();

  // State: Dropdown menu open/closed
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Ref for dropdown container (to detect clicks outside)
  const dropdownRef = useRef(null);

  /**
   * =============================================================================
   *                     CLOSE DROPDOWN ON OUTSIDE CLICK
   * =============================================================================
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  /**
   * =============================================================================
   *                     HANDLE LOGOUT
   * =============================================================================
   * 
   * 📖 WHAT THIS DOES:
   * ------------------
   * Logs out the current user and redirects to home page.
   * 
   * 🔗 WHAT HAPPENS:
   * ---------------
   * 1. Calls logout() from AuthContext
   *    - Clears token from state
   *    - Clears user from state
   *    - Removes token from localStorage
   *    - Removes Authorization header
   * 2. Navigates to home page (/)
   * 
   * 📌 RESULT:
   * ----------
   * User is logged out and redirected to landing page.
   * 
   * =============================================================================
   */
  const handleLogout = () => {
    // Close dropdown
    setDropdownOpen(false);
    
    // Clear authentication (removes token, clears user state)
    logout();
    
    // Redirect to home page
    navigate('/');
  };

  /**
   * =============================================================================
   *                     NAVIGATE TO DASHBOARD
   * =============================================================================
   */
  const handleDashboardClick = () => {
    setDropdownOpen(false);
    // Navigate to appropriate dashboard based on role
    if (user?.role === 'hirer') {
      navigate('/recruiter/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <div className="relative">
              <span className="text-[#0d4f4a] text-2xl font-semibold">
                Job
              </span>
              <FaGraduationCap className="absolute -top-1 right-0 text-[10px] text-[#0d4f4a]" />
            </div>
            <span className="text-white text-lg font-bold bg-[#14b8a6] px-3 py-1 rounded-md ml-1">
              Hunt
            </span>
          </Link>

          {/* Navigation - Removed Career link */}

          {/* Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* User Dropdown Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-[#ef4444] text-white font-bold text-lg cursor-pointer hover:bg-[#dc2626] transition-colors"
                  >
                    {user.name?.charAt(0).toUpperCase() || 'A'}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-[#14b8a6] mt-1">
                          {user.role === 'hirer' ? 'Recruiter' : 'Job Seeker'}
                        </p>
                      </div>
                      
                      <button
                        onClick={handleDashboardClick}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[#14b8a6] hover:text-[#0d9488] font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-white border-2 border-[#14b8a6] text-[#14b8a6] px-5 py-2.5 rounded-full font-medium hover:bg-[#E0F2F1] transition-colors"
                >
                  For Employers
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
