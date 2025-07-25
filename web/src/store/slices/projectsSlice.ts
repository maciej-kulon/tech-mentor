// ═══════════════════════════════════════════════════════════════
// PROJECTS SLICE - State management for project browser
// ═══════════════════════════════════════════════════════════════

// Import Redux Toolkit utilities for creating slices
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Import TypeScript interfaces for projects
import {
  CreateProjectRequestDto,
  ProjectResponseDto,
} from "../../types/generated";
import { API } from "../../types/generated/api-endpoints";
import { RootState } from "../index";

// ═══════════════════════════════════════════════════════════════
// STATE INTERFACE - Define the shape of projects state
// ═══════════════════════════════════════════════════════════════

interface ProjectsState {
  // Array of all projects loaded from the API
  projects: ProjectResponseDto[];

  // Loading state for API calls
  isLoading: boolean;

  // Error message if something goes wrong
  error: string | null;

  // Currently selected project (for detailed views)
  selectedProject: ProjectResponseDto | null;

  // Filter and search functionality
  searchTerm: string;
  statusFilter: string | null;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE - Starting values when app loads
// ═══════════════════════════════════════════════════════════════

const initialState: ProjectsState = {
  projects: [],
  isLoading: false,
  error: null,
  selectedProject: null,
  searchTerm: "",
  statusFilter: null,
};

// ═══════════════════════════════════════════════════════════════
// ASYNC THUNKS - For API calls and async operations
// ═══════════════════════════════════════════════════════════════

// Async thunk to fetch projects from the API
// This handles the loading states automatically and auth errors
export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue, dispatch, getState }) => {
    // Get state using getState() instead of useAppSelector (which only works in components)
    const state = getState() as RootState;
    const { user } = state.auth;

    if (!user) {
      return rejectWithValue("User not authenticated");
    }

    try {
      // TODO: Replace with actual API call to your backend
      // For now, we'll return mock data
      const response = await fetch(
        `http://localhost:3000${API.PROJECTS_OWNERS_OWNERID_V1(user.id)}`,
        {
          credentials: "include", // Include httpOnly cookies for authentication
        }
      );

      // Handle authentication errors
      if (response.status === 401) {
        // Import auth actions dynamically to avoid circular imports
        const { resetAuth } = await import("./authSlice");
        dispatch(resetAuth());
        return rejectWithValue("Authentication required. Please log in.");
      }

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data: ProjectResponseDto[] = await response.json();
      return data;
    } catch (error) {
      // Return error message if API call fails
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (
    project: CreateProjectRequestDto,
    { rejectWithValue, dispatch, getState }
  ) => {
    // Get state using getState() instead of useAppSelector (which only works in components)
    const state = getState() as RootState; // Use proper RootState type
    const { user } = state.auth;

    if (!user) {
      return rejectWithValue("User not authenticated");
    }

    try {
      const url = `http://localhost:3000${API.POST_PROJECTS_V1}`;
      console.log("🌐 Making API call to:", url);
      console.log("📤 Request data:", project);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
        credentials: "include", // Include httpOnly cookies for authentication
      });

      console.log("📥 Response status:", response.status);
      console.log(
        "📥 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Handle authentication errors
      if (response.status === 401) {
        console.log("🚫 Authentication error - user not logged in");
        // Import auth actions dynamically to avoid circular imports
        const { resetAuth } = await import("./authSlice");
        dispatch(resetAuth());
        return rejectWithValue("Authentication required. Please log in.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ API error response:", errorText);
        throw new Error(
          `Failed to create project: ${response.status} ${errorText}`
        );
      }

      const data: ProjectResponseDto = await response.json();
      console.log("✅ Project created successfully:", data);
      return data;
    } catch (error) {
      console.error("💥 API call error:", error);
      // Return error message if API call fails
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// PROJECTS SLICE - Actions and reducers combined
// ═══════════════════════════════════════════════════════════════

const projectsSlice = createSlice({
  name: "projects",
  initialState,

  // Regular synchronous actions
  reducers: {
    // Set the currently selected project
    setSelectedProject: (
      state,
      action: PayloadAction<ProjectResponseDto | null>
    ) => {
      state.selectedProject = action.payload;
    },

    // Update search term for filtering projects
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },

    // Update status filter
    setStatusFilter: (state, action: PayloadAction<string | null>) => {
      state.statusFilter = action.payload;
    },

    // Clear all filters
    clearFilters: (state) => {
      state.searchTerm = "";
      state.statusFilter = null;
    },

    // Clear error message
    clearError: (state) => {
      state.error = null;
    },
  },

  // Handle async actions from createAsyncThunk
  extraReducers: (builder) => {
    builder
      // Handle fetchProjects pending state
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      // Handle fetchProjects success
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
        state.error = null;
      })

      // Handle fetchProjects failure
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Handle createProject pending state
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      // Handle createProject success
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new project to the beginning of the projects array
        state.projects.unshift(action.payload);
        state.error = null;
      })

      // Handle createProject failure
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ═══════════════════════════════════════════════════════════════
// EXPORTS - Actions and reducer for use in components and store
// ═══════════════════════════════════════════════════════════════

// Export action creators for use in components
export const {
  setSelectedProject,
  setSearchTerm,
  setStatusFilter,
  clearFilters,
  clearError,
} = projectsSlice.actions;

// Export the reducer to be used in the store
export default projectsSlice.reducer;

// ═══════════════════════════════════════════════════════════════
// HOW TO USE THIS SLICE IN COMPONENTS:
// ═══════════════════════════════════════════════════════════════
// 1. Use useSelector to read state: useSelector(state => state.projects)
// 2. Use useDispatch to send actions: dispatch(setSelectedProject(project))
// 3. Use async thunks for API calls: dispatch(fetchProjects())
// 4. All state updates are immutable and handled by Redux Toolkit
// ═══════════════════════════════════════════════════════════════
