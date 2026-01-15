/**
 * ===================================================================================
 *                    COMPANY SLICE - Company State Management (Redux)
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Redux slice for managing company-related state.
 * 
 * 📌 STATE STRUCTURE:
 * -------------------
 * {
 *   singleCompany: null,        // Single company object
 *   companies: [],              // Array of companies
 *   searchCompanyByText: ""     // Search query text
 * }
 * 
 * ===================================================================================
 */

// Line 1: Import createSlice from Redux Toolkit
import { createSlice } from "@reduxjs/toolkit";

// Line 3: Create company slice
const companySlice = createSlice({
    // Line 4: name = Slice name
    name: "company",
    // Line 5: initialState = Initial state
    initialState: {
        singleCompany: null,        // Single company (null = none selected)
        companies: [],              // Array of companies (empty initially)
        searchCompanyByText: ""     // Search query (empty = no search)
    },
    // Line 10: reducers = Reducer functions
    reducers: {
        // Line 11: setSingleCompany reducer
        setSingleCompany: (state, action) => {
            // action.payload = Company object or null
            state.singleCompany = action.payload;
        },
        // Line 15: setCompanies reducer
        setCompanies: (state, action) => {
            // action.payload = Array of company objects
            state.companies = action.payload;
        },
        // Line 19: setSearchCompanyByText reducer
        setSearchCompanyByText: (state, action) => {
            // action.payload = Search text string
            state.searchCompanyByText = action.payload;
        }
    }
});

// Line 25: Export action creators
export const { setSingleCompany, setCompanies, setSearchCompanyByText } = companySlice.actions;
// Line 26: Export reducer
export default companySlice.reducer;

