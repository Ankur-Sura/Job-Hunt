/**
 * ===================================================================================
 *                    REDUX STORE CONFIGURATION - Global State Management
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * Configures Redux store with Redux Toolkit and Redux Persist.
 * Redux = State management library for React.
 * Redux Persist = Persists Redux state to localStorage.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. Combines all Redux slices into one reducer
 * 2. Wraps reducer with Redux Persist (saves to localStorage)
 * 3. Configures Redux store with persisted reducer
 * 4. Exports store and persistor
 * 
 * 📌 REDUX SLICES:
 * ----------------
 * - auth: Authentication state (user, token)
 * - job: Job-related state (all jobs, single job, search)
 * - company: Company-related state (companies, single company)
 * - application: Application-related state (applications, applicants)
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - App loads → Redux state restored from localStorage
 * - State changes → Saved to localStorage automatically
 * - Page refresh → State persists (not lost)
 * 
 * ===================================================================================
 */

// Line 1: Import combineReducers and configureStore from Redux Toolkit
// combineReducers = Combines multiple reducers into one
// configureStore = Creates Redux store with good defaults
import { combineReducers, configureStore } from "@reduxjs/toolkit";
// Line 2: Import auth slice reducer
// authSlice = Reducer for authentication state
import authSlice from "./authSlice";
// Line 3: Import job slice reducer
// jobSlice = Reducer for job-related state
import jobSlice from "./jobSlice";
// Line 4: Import company slice reducer
// companySlice = Reducer for company-related state
import companySlice from "./companySlice";
// Line 5: Import application slice reducer
// applicationSlice = Reducer for application-related state
import applicationSlice from "./applicationSlice";
// Line 6: Import Redux Persist functions and constants
// persistStore = Creates persistor object
// persistReducer = Wraps reducer to persist state
// FLUSH, REHYDRATE, etc. = Action types for Redux Persist
import {
    persistStore,      // Creates persistor for saving/loading state
    persistReducer,    // Wraps reducer to enable persistence
    FLUSH,             // Action type: flush state to storage
    REHYDRATE,          // Action type: restore state from storage
    PAUSE,              // Action type: pause persistence
    PERSIST,            // Action type: persist state
    PURGE,              // Action type: purge persisted state
    REGISTER,           // Action type: register reducer
} from 'redux-persist';
// Line 15: Import localStorage storage engine
// storage = Storage engine that uses browser's localStorage
// State is saved to localStorage and restored on page load
import storage from 'redux-persist/lib/storage';

// Line 17: Configure Redux Persist
// persistConfig = Configuration object for Redux Persist
const persistConfig = {
    key: 'root',        // Key for localStorage (state saved as 'root' key)
    version: 1,         // Version number (increment when schema changes)
    storage,            // Storage engine (localStorage)
};

// Line 23: Combine all reducers into one root reducer
// combineReducers = Merges multiple reducers into single reducer
// Each slice manages its own part of state
const rootReducer = combineReducers({
    auth: authSlice,              // Authentication state (user, token)
    job: jobSlice,                // Job state (all jobs, single job, search)
    company: companySlice,        // Company state (companies, single company)
    application: applicationSlice  // Application state (applications, applicants)
});

// Line 30: Wrap root reducer with Redux Persist
// persistReducer = Enhances reducer to save/load state from storage
// persistConfig = Configuration for persistence
// rootReducer = Original reducer to wrap
// Result: State automatically saved to localStorage and restored on load
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Line 32: Configure Redux store
// configureStore = Creates Redux store with good defaults (Redux Toolkit)
const store = configureStore({
    reducer: persistedReducer,  // Use persisted reducer (saves to localStorage)
    middleware: (getDefaultMiddleware) =>
        // Line 33: Configure middleware
        // getDefaultMiddleware = Function that returns default middleware
        getDefaultMiddleware({
            serializableCheck: {
                // Line 34: Ignore Redux Persist actions in serialization check
                // Redux Toolkit checks if actions are serializable
                // Redux Persist actions contain non-serializable data (functions)
                // Ignoring them prevents false warnings
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

// Line 42: Create persistor object
// persistStore = Creates persistor that handles saving/loading state
// store = Redux store to persist
// Used in main.jsx with PersistGate component
export const persistor = persistStore(store);

// Line 43: Export Redux store
// store = Redux store containing all application state
// Used in main.jsx with Provider component
export default store;

