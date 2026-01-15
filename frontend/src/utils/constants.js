/**
 * ===================================================================================
 *                    CONSTANTS - API Endpoint URLs
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Centralized file for all API endpoint URLs.
 * Makes it easy to update URLs in one place.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Defines base URL (from environment variable or default)
 * 2. Exports endpoint constants for each API route
 * 3. Components import these constants instead of hardcoding URLs
 * 
 * 📌 WHY IT'S NEEDED:
 * -------------------
 * - Single source of truth for API URLs
 * - Easy to change URLs (e.g., switch from localhost to production)
 * - Prevents typos in URLs
 * 
 * 📌 ENVIRONMENT VARIABLES:
 * -------------------------
 * VITE_API_URL - Base URL for backend API (from .env file)
 * If not set, defaults to http://localhost:8080
 * 
 * ===================================================================================
 */

// Line 1: Define base URL for backend API
// import.meta.env = Vite's way to access environment variables
// VITE_API_URL = Environment variable from .env file
// || 'http://localhost:8080' = Fallback to localhost if env var not set
// This allows switching between development and production URLs easily
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Line 3: Export user authentication API endpoint
// USER_API_END_POINT = Full URL for auth endpoints
// Used for: login, register, get current user
// Example: "http://localhost:8080/api/auth"
export const USER_API_END_POINT = `${API_BASE_URL}/api/auth`;

// Line 4: Export jobs API endpoint
// JOB_API_END_POINT = Full URL for job endpoints
// Used for: get all jobs, get job by ID, create job, update job
// Example: "http://localhost:8080/api/jobs"
export const JOB_API_END_POINT = `${API_BASE_URL}/api/jobs`;

// Line 5: Export applications API endpoint
// APPLICATION_API_END_POINT = Full URL for application endpoints
// Used for: apply to job, get user's applications, get applicants for job
// Example: "http://localhost:8080/api/applications"
export const APPLICATION_API_END_POINT = `${API_BASE_URL}/api/applications`;

// Line 6: Export company API endpoint
// COMPANY_API_END_POINT = Full URL for company endpoints
// Used for: register company, get companies, update company
// Example: "http://localhost:8080/api/company"
export const COMPANY_API_END_POINT = `${API_BASE_URL}/api/company`;

// Line 7: Export resume API endpoint
// RESUME_API_END_POINT = Full URL for resume endpoints
// Used for: upload resume, get resume data, delete resume
// Example: "http://localhost:8080/api/resume"
export const RESUME_API_END_POINT = `${API_BASE_URL}/api/resume`;

// Line 8: Export recommendations API endpoint
// RECOMMENDATIONS_API_END_POINT = Full URL for recommendations endpoint
// Used for: get job recommendations with AI match scores
// Example: "http://localhost:8080/api/recommendations"
export const RECOMMENDATIONS_API_END_POINT = `${API_BASE_URL}/api/recommendations`;

