/**
 * ===================================================================================
 *                    MAIN.JSX - Application Entry Point
 * ===================================================================================
 * 
 * 📖 WHAT IS THIS FILE?
 * ---------------------
 * This is the entry point of the React application.
 * It renders the App component into the DOM.
 * 
 * 🔗 HOW IT WORKS:
 * ----------------
 * 1. ReactDOM.createRoot() creates a root container
 * 2. Renders App component into #root element in index.html
 * 3. Wraps app with Redux Provider (state management)
 * 4. Wraps app with PersistGate (persists Redux state)
 * 5. React.StrictMode enables additional checks in development
 * 
 * 📌 WHAT HAPPENS WHEN:
 * ---------------------
 * - Page loads → main.jsx executes → App renders → Components mount
 * - Redux store provides global state to all components
 * - PersistGate restores Redux state from localStorage
 * 
 * ===================================================================================
 */

// Line 1: Import React library
// React = Core React library for creating components
import React from 'react'
// Line 2: Import ReactDOM client API
// ReactDOM = Library for rendering React components to DOM
// createRoot = Modern API for creating root (replaces ReactDOM.render)
import ReactDOM from 'react-dom/client'
// Line 3: Import main App component
// App = Root component that contains all routes and pages
import App from './App'
// Line 4: Import global CSS styles
// index.css = Global styles applied to entire application
import './index.css'
// Line 5: Import Redux Provider component
// Provider = React component that provides Redux store to all child components
// This allows any component to access Redux state using useSelector hook
import { Provider } from 'react-redux'
// Line 6: Import PersistGate component
// PersistGate = Component that delays rendering until Redux state is restored from localStorage
// This ensures state persists across page refreshes
import { PersistGate } from 'redux-persist/integration/react'
// Line 7: Import Redux store and persistor
// store = Redux store containing application state
// persistor = Object that handles persisting state to localStorage
import store, { persistor } from './redux/store'
// Line 8: Import Toaster component
// Toaster = Component from 'sonner' library for displaying toast notifications
// Shows success/error messages to users
import { Toaster } from 'sonner'

// Line 10: Create React root and render application
// document.getElementById('root') = Gets the root div element from index.html
// createRoot() = Creates a React root container (modern API, replaces ReactDOM.render)
ReactDOM.createRoot(document.getElementById('root')).render(
  // Line 11: React.StrictMode wrapper
  // StrictMode = Development-only component that enables additional checks
  // Helps identify potential problems (deprecated APIs, unsafe lifecycles, etc.)
  // Does not render anything visible, only activates checks
  <React.StrictMode>
    {/* Line 12: Redux Provider wrapper - Provider makes Redux store available to all child components, any component can now use useSelector() to access state */}
    <Provider store={store}>
      {/* Line 13: PersistGate wrapper - Delays rendering until Redux state is restored from localStorage, loading={null} shows nothing while loading, persistor handles persisting/restoring state */}
      <PersistGate loading={null} persistor={persistor}>
        {/* Line 14: Main App component - Root component containing all routes and pages, this is where the entire application starts */}
        <App />
        {/* Line 15: Toast notification component - Toaster displays toast notifications (success, error, info messages), positioned at bottom-right by default */}
        <Toaster />
      </PersistGate>
    </Provider>
  </React.StrictMode>,
)
