// ═══════════════════════════════════════════════════════════════
// REDUX STORE CONFIGURATION - Central state management setup
// ═══════════════════════════════════════════════════════════════

// Import Redux Toolkit for modern Redux development
import { configureStore } from "@reduxjs/toolkit";

// Import our slices (state management pieces)
import projectsSlice from "./slices/projectsSlice";
import authSlice from "./slices/authSlice";

// ═══════════════════════════════════════════════════════════════
// STORE CONFIGURATION - Combines all slices into one store
// ═══════════════════════════════════════════════════════════════

// Configure the Redux store with our slices
// Redux Toolkit handles all the complex setup automatically
export const store = configureStore({
  reducer: {
    // Each slice manages a specific part of the application state
    projects: projectsSlice,
    auth: authSlice,
  },
  // Redux Toolkit includes helpful middleware by default:
  // - redux-thunk for async actions
  // - development tools for debugging
  // - immutability checks during development
});

// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT CONFIGURATION - Type definitions for the store
// ═══════════════════════════════════════════════════════════════

// Export the root state type - this represents the entire app state
// RootState will be the shape: { projects: ProjectsState, auth: AuthState }
export type RootState = ReturnType<typeof store.getState>;

// Export the dispatch type for TypeScript components
// This includes all the action creators and thunks
export type AppDispatch = typeof store.dispatch;

// ═══════════════════════════════════════════════════════════════
// HOW REDUX STORE WORKS:
// ═══════════════════════════════════════════════════════════════
// 1. The store holds the entire application state in one place
// 2. Components connect to the store to read state and dispatch actions
// 3. Actions describe what happened (e.g., "user loaded projects")
// 4. Reducers specify how state changes in response to actions
// 5. Redux Toolkit makes this process much simpler than vanilla Redux
// ═══════════════════════════════════════════════════════════════
