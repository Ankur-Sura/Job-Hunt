/**
 * ===================================================================================
 *                    APPLICATION SLICE - Application State Management (Redux)
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Redux slice for managing application-related state.
 * Stores applicants, user applications, and single application details.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Components fetch applications → Dispatch actions
 * 2. Reducer updates state → Components re-render
 * 
 * 📌 STATE STRUCTURE:
 * -------------------
 * {
 *   applicants: null,          // Applicants for a job (null = not loaded)
 *   applications: [],          // User's applications (empty initially)
 *   singleApplication: null    // Single application details (null = none selected)
 * }
 * 
 * ===================================================================================
 */

// Line 1: Import createSlice from Redux Toolkit
import { createSlice } from "@reduxjs/toolkit";

// Line 3: Create application slice
const applicationSlice = createSlice({
    // Line 4: name = Slice name
    name: "application",
    // Line 5: initialState = Initial state
    initialState: {
        applicants: null,           // Applicants for a job (null = not loaded)
        applications: [],           // User's applications (empty array)
        singleApplication: null   // Single application (null = none selected)
    },
    // Line 10: reducers = Reducer functions
    reducers: {
        // Line 11: setAllApplicants reducer
        // Sets applicants for a job
        setAllApplicants: (state, action) => {
            // action.payload = Applicants object or null
            state.applicants = action.payload;
        },
        // Line 15: setApplications reducer
        // Sets user's applications
        setApplications: (state, action) => {
            // action.payload = Array of application objects
            state.applications = action.payload;
        },
        // Line 19: setSingleApplication reducer
        // Sets single application details
        setSingleApplication: (state, action) => {
            // action.payload = Application object or null
            state.singleApplication = action.payload;
        }
    }
});

// Line 25: Export action creators
export const { setAllApplicants, setApplications, setSingleApplication } = applicationSlice.actions;
// Line 26: Export reducer
export default applicationSlice.reducer;

