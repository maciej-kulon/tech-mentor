// ═══════════════════════════════════════════════════════════════
// TYPED REDUX HOOKS - TypeScript-enabled hooks for Redux
// ═══════════════════════════════════════════════════════════════

// Import the standard React-Redux hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

// Import our store types
import type { RootState, AppDispatch } from "./index";

// ═══════════════════════════════════════════════════════════════
// TYPED HOOKS - Pre-configured with TypeScript types
// ═══════════════════════════════════════════════════════════════

// Use throughout your app instead of plain `useDispatch`
// This hook knows about all our action creators and async thunks
export const useAppDispatch = () => useDispatch<AppDispatch>();

// Use throughout your app instead of plain `useSelector`
// This hook knows the exact shape of our Redux state
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ═══════════════════════════════════════════════════════════════
// HOW TO USE THESE HOOKS IN COMPONENTS:
// ═══════════════════════════════════════════════════════════════
//
// Reading state:
// const projects = useAppSelector(state => state.projects.projects);
// const isLoading = useAppSelector(state => state.projects.isLoading);
//
// Dispatching actions:
// const dispatch = useAppDispatch();
// dispatch(fetchProjects());
// dispatch(setSelectedProject(project));
//
// These hooks provide full TypeScript autocomplete and type checking!
// ═══════════════════════════════════════════════════════════════
