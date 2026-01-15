/**
 * ===================================================================================
 *                    AUTH SLICE - Authentication State Management (Redux)
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Redux slice for managing authentication state.
 * Redux slice = Piece of Redux state with its own reducer and actions.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Components dispatch actions (setLoading, setUser)
 * 2. Reducer updates state based on action
 * 3. Components re-render with new state
 * 
 * 📌 STATE STRUCTURE:
 * -------------------
 * {
 *   loading: false,    // Loading indicator
 *   user: null         // Current user object (or null if not logged in)
 * }
 * 
 * 📌 ACTIONS:
 * -----------
 * - setLoading(boolean): Sets loading state
 * - setUser(userObject): Sets current user
 * 
 * ===================================================================================
 */

// Line 1: Import createSlice from Redux Toolkit
// createSlice = Function that creates Redux slice (reducer + actions)
// Automatically generates action creators and action types
import { createSlice } from "@reduxjs/toolkit";

// Line 3: Create auth slice
// createSlice = Creates reducer and actions in one go
const authSlice = createSlice({
    // Line 4: name = Slice name (used in action types)
    // Action types will be: "auth/setLoading", "auth/setUser"
    name: "auth",
    // Line 5: initialState = Initial state when app loads
    initialState: {
        loading: false,  // Loading indicator (false = not loading)
        user: null       // Current user (null = not logged in)
    },
    // Line 9: reducers = Object of reducer functions
    // Each function handles one action type
    reducers: {
        // Line 10: setLoading reducer
        // Handles "auth/setLoading" action
        // state = Current state (can be mutated directly with Redux Toolkit)
        // action = Action object (contains payload)
        setLoading: (state, action) => {
            // Line 11: Update loading state
            // action.payload = Value passed to action (true/false)
            // Redux Toolkit uses Immer internally, so we can mutate state directly
            state.loading = action.payload;
        },
        // Line 13: setUser reducer
        // Handles "auth/setUser" action
        setUser: (state, action) => {
            // Line 14: Update user state
            // action.payload = User object (or null)
            // If user logs in: payload = { id, email, name, ... }
            // If user logs out: payload = null
            state.user = action.payload;
        }
    }
});

// Line 19: Export action creators
// setLoading, setUser = Functions that create actions
// Usage: dispatch(setLoading(true)) or dispatch(setUser(userObject))
export const { setLoading, setUser } = authSlice.actions;

// Line 20: Export reducer
// authSlice.reducer = Reducer function for this slice
// Used in store.js to combine with other reducers
export default authSlice.reducer;

