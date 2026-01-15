/**
 * ===================================================================================
 *                    JOB SLICE - Job State Management (Redux)
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Redux slice for managing job-related state.
 * Stores jobs list, single job, search queries, and applied jobs.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Components fetch jobs → Dispatch setAllJobs action
 * 2. Reducer updates state → Components re-render with new jobs
 * 3. Components can access jobs using useSelector hook
 * 
 * 📌 STATE STRUCTURE:
 * -------------------
 * {
 *   allJobs: [],              // All jobs from database
 *   allAdminJobs: [],         // All jobs (admin view)
 *   singleJob: null,          // Currently viewed job
 *   searchJobByText: "",      // Search query text
 *   allAppliedJobs: [],       // Jobs user has applied to
 *   searchedQuery: ""         // Last searched query
 * }
 * 
 * 📌 ACTIONS:
 * -----------
 * - setAllJobs(jobs[]): Sets all jobs
 * - setSingleJob(job): Sets single job
 * - setAllAdminJobs(jobs[]): Sets admin jobs
 * - setSearchJobByText(text): Sets search text
 * - setAllAppliedJobs(jobs[]): Sets applied jobs
 * - setSearchedQuery(query): Sets searched query
 * 
 * ===================================================================================
 */

// Line 1: Import createSlice from Redux Toolkit
// createSlice = Function that creates Redux slice
import { createSlice } from "@reduxjs/toolkit";

// Line 3: Create job slice
const jobSlice = createSlice({
    // Line 4: name = Slice name
    name: "job",
    // Line 5: initialState = Initial state
    initialState: {
        allJobs: [],            // Array of all jobs (empty initially)
        allAdminJobs: [],       // Array of all jobs for admin view (empty initially)
        singleJob: null,        // Single job object (null = no job selected)
        searchJobByText: "",    // Search query text (empty = no search)
        allAppliedJobs: [],     // Array of jobs user has applied to (empty initially)
        searchedQuery: "",      // Last searched query (empty = no search)
    },
    // Line 12: reducers = Reducer functions
    reducers: {
        // Line 13: setAllJobs reducer
        // Handles "job/setAllJobs" action
        // Sets the allJobs array with fetched jobs
        setAllJobs: (state, action) => {
            // Line 14: Update allJobs state
            // action.payload = Array of job objects
            state.allJobs = action.payload;
        },
        // Line 16: setSingleJob reducer
        // Handles "job/setSingleJob" action
        // Sets the currently viewed job
        setSingleJob: (state, action) => {
            // Line 17: Update singleJob state
            // action.payload = Single job object (or null)
            state.singleJob = action.payload;
        },
        // Line 19: setAllAdminJobs reducer
        // Handles "job/setAllAdminJobs" action
        // Sets jobs for admin view
        setAllAdminJobs: (state, action) => {
            // Line 20: Update allAdminJobs state
            // action.payload = Array of job objects
            state.allAdminJobs = action.payload;
        },
        // Line 22: setSearchJobByText reducer
        // Handles "job/setSearchJobByText" action
        // Sets search query text
        setSearchJobByText: (state, action) => {
            // Line 23: Update searchJobByText state
            // action.payload = Search text string
            state.searchJobByText = action.payload;
        },
        // Line 25: setAllAppliedJobs reducer
        // Handles "job/setAllAppliedJobs" action
        // Sets jobs user has applied to
        setAllAppliedJobs: (state, action) => {
            // Line 26: Update allAppliedJobs state
            // action.payload = Array of application objects
            state.allAppliedJobs = action.payload;
        },
        // Line 28: setSearchedQuery reducer
        // Handles "job/setSearchedQuery" action
        // Sets last searched query
        setSearchedQuery: (state, action) => {
            // Line 29: Update searchedQuery state
            // action.payload = Query string
            state.searchedQuery = action.payload;
        }
    }
});

// Line 34: Export action creators
// These functions create actions that can be dispatched
// Usage: dispatch(setAllJobs(jobs)) or dispatch(setSingleJob(job))
export const {
    setAllJobs,           // Action creator for setting all jobs
    setSingleJob,         // Action creator for setting single job
    setAllAdminJobs,      // Action creator for setting admin jobs
    setSearchJobByText,   // Action creator for setting search text
    setAllAppliedJobs,    // Action creator for setting applied jobs
    setSearchedQuery      // Action creator for setting searched query
} = jobSlice.actions;

// Line 42: Export reducer
// jobSlice.reducer = Reducer function for this slice
// Used in store.js to combine with other reducers
export default jobSlice.reducer;

