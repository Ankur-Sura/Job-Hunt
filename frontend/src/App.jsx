/**
 * ===================================================================================
 *                    APP.JSX - Main Application Component & Routing
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This is the root component of the React application.
 * It sets up routing and wraps the app with AuthProvider.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. AuthProvider wraps entire app (provides authentication state)
 * 2. Router sets up client-side routing
 * 3. Routes define which component renders for each URL
 * 4. ProtectedRoute wraps routes that require authentication
 * 
 * 📌 ROUTE STRUCTURE:
 * -------------------
 * PUBLIC ROUTES (No login required):
 *   - / → Landing page
 *   - /login → Login page
 *   - /register → Registration page
 *   - /jobs → Browse all jobs
 *   - /jobs/:id → Job details
 * 
 * PROTECTED ROUTES (Login required):
 *   - /dashboard → User dashboard
 *   - /interview/:applicationId → Interview prep page
 * 
 * ADMIN ROUTES (Admin/Hirer only):
 *   - /admin/companies → Company management
 *   - /admin/jobs → Job management
 *   - /admin/jobs/create → Post new job
 *   - /admin/jobs/:id/applicants → View applicants
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - User navigates to /dashboard → ProtectedRoute checks auth → Shows Dashboard or redirects
 * - User navigates to /jobs → Shows Jobs page (no auth needed)
 * - User clicks job → Navigates to /jobs/:id → Shows JobDetails
 * 
 * ===================================================================================
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import InterviewPrepPage from './pages/InterviewPrepPage';
import ProtectedRoute from './components/ProtectedRoute';
// Admin components
import Companies from './components/admin/Companies';
import CompanyCreate from './components/admin/CompanyCreate';
import CompanySetup from './components/admin/CompanySetup';
import AdminJobs from './components/admin/AdminJobs';
import PostJob from './components/admin/PostJob';
import Applicants from './components/admin/Applicants';
import AdminProtectedRoute from './components/admin/ProtectedRoute';

/**
 * =============================================================================
 *                     APP COMPONENT
 * =============================================================================
 * 
 * 📖 WHAT THIS DOES:
 * ------------------
 * Main application component that sets up routing and authentication.
 * 
 * 🔗 COMPONENT STRUCTURE:
 * -----------------------
 * <AuthProvider>
 *   <Router>
 *     <Routes>
 *       <Route path="/" element={<Landing />} />
 *       <Route path="/dashboard" element={
 *         <ProtectedRoute>
 *           <Dashboard />
 *         </ProtectedRoute>
 *       } />
 *       ...
 *     </Routes>
 *   </Router>
 * </AuthProvider>
 * 
 * 📌 WHAT HAPPENS:
 * ---------------
 * - AuthProvider provides auth state to all components
 * - Router handles URL changes and renders appropriate component
 * - ProtectedRoute checks authentication before rendering
 * 
 * =============================================================================
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute>
                <RecruiterDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route
            path="/interview/:applicationId"
            element={
              <ProtectedRoute>
                <InterviewPrepPage />
              </ProtectedRoute>
            }
          />
          {/* Admin Routes */}
          <Route
            path="/admin/companies"
            element={
              <AdminProtectedRoute>
                <Companies />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/companies/create"
            element={
              <AdminProtectedRoute>
                <CompanyCreate />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/companies/:id"
            element={
              <AdminProtectedRoute>
                <CompanySetup />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <AdminProtectedRoute>
                <AdminJobs />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/jobs/create"
            element={
              <AdminProtectedRoute>
                <PostJob />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/jobs/:id/applicants"
            element={
              <AdminProtectedRoute>
                <Applicants />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

