// ═══════════════════════════════════════════════════════════════
// AUTH SLICE - Authentication state management without tokens
// ═══════════════════════════════════════════════════════════════

// Import Redux Toolkit utilities for creating slices
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Import TypeScript interfaces for auth
import {
  LoginDto,
  LoginResponseDto,
  GetUserResponseDto,
  CreateUserDto,
} from "../../types/generated";

// ═══════════════════════════════════════════════════════════════
// STATE INTERFACE - Define the shape of auth state
// ═══════════════════════════════════════════════════════════════

interface AuthState {
  // Authentication status - true when user is logged in
  isAuthenticated: boolean;

  // Current user data from login response
  user: GetUserResponseDto | null;

  // Loading state for auth operations (login/logout/register)
  loading: boolean;

  // Error message for auth operations
  error: string | null;

  // Flag to track if we've attempted to check auth status on app load
  isInitialized: boolean;
}

// ═══════════════════════════════════════════════════════════════
// INITIAL STATE - Starting values when app loads
// ═══════════════════════════════════════════════════════════════

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  isInitialized: false,
};

// ═══════════════════════════════════════════════════════════════
// ASYNC THUNKS - For API calls and async operations
// ═══════════════════════════════════════════════════════════════

// Async thunk to login user
// httpOnly cookies are handled automatically by the browser
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: LoginDto, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:3000/auth/login/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include", // Important: includes httpOnly cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data: LoginResponseDto = await response.json();
      // Return user data, httpOnly cookie is set automatically by browser
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown login error"
      );
    }
  }
);

// Async thunk to register user
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData: CreateUserDto, { rejectWithValue }) => {
    try {
      const response = await fetch("http://localhost:3000/users/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (!response.ok) {
        // Try to parse error response as JSON, fallback to text
        let errorMessage = "Registration failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown registration error"
      );
    }
  }
);

// Async thunk to logout user
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  try {
    const response = await fetch("http://localhost:3000/auth/logout/v1", {
      method: "POST",
      credentials: "include", // Clears httpOnly cookie
    });

    if (!response.ok) {
      // Even if logout fails on server, clear local state
      console.warn("Logout request failed, but clearing local state");
    }

    return true;
  } catch (error) {
    // Even if network fails, clear local state
    console.warn("Logout network error, but clearing local state");
    return true;
  }
});

// Async thunk to check if user is already authenticated
// This runs on app startup to restore auth state
export const checkAuthStatus = createAsyncThunk(
  "auth/checkAuthStatus",
  async (_, { rejectWithValue }) => {
    try {
      // Call a protected endpoint to verify if user is authenticated
      const response = await fetch("http://localhost:3000/users/me/v1", {
        credentials: "include", // Include httpOnly cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, this is normal
          return null;
        }
        throw new Error("Failed to check auth status");
      }

      const userData: GetUserResponseDto = await response.json();
      return userData;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Auth check failed"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// AUTH SLICE - Actions and reducers combined
// ═══════════════════════════════════════════════════════════════

const authSlice = createSlice({
  name: "auth",
  initialState,

  // Regular synchronous actions
  reducers: {
    // Clear error message
    clearError: (state) => {
      state.error = null;
    },

    // Reset auth state (useful for testing or debugging)
    resetAuth: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.error = null;
      state.loading = false;
    },

    // Set user data directly (useful when data comes from other sources)
    setUser: (state, action: PayloadAction<GetUserResponseDto>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },

  // Handle async actions from createAsyncThunk
  extraReducers: (builder) => {
    builder
      // ═══════════════════════════════════════════════════════════════
      // LOGIN USER HANDLERS
      // ═══════════════════════════════════════════════════════════════
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      })

      // ═══════════════════════════════════════════════════════════════
      // REGISTER USER HANDLERS
      // ═══════════════════════════════════════════════════════════════
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        // Registration successful but user needs to login
        // Don't set authenticated here, let them login
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ═══════════════════════════════════════════════════════════════
      // LOGOUT USER HANDLERS
      // ═══════════════════════════════════════════════════════════════
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails, clear the state
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })

      // ═══════════════════════════════════════════════════════════════
      // CHECK AUTH STATUS HANDLERS
      // ═══════════════════════════════════════════════════════════════
      .addCase(checkAuthStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.isInitialized = true;

        if (action.payload) {
          // User is authenticated
          state.isAuthenticated = true;
          state.user = action.payload;
        } else {
          // User is not authenticated
          state.isAuthenticated = false;
          state.user = null;
        }
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.loading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });
  },
});

// ═══════════════════════════════════════════════════════════════
// EXPORTS - Actions and reducer for use in components and store
// ═══════════════════════════════════════════════════════════════

// Export action creators for use in components
export const { clearError, resetAuth, setUser } = authSlice.actions;

// Export the reducer to be used in the store
export default authSlice.reducer;

// ═══════════════════════════════════════════════════════════════
// HOW TO USE THIS AUTH SLICE:
// ═══════════════════════════════════════════════════════════════
// 1. Login: dispatch(loginUser({ email, password }))
// 2. Register: dispatch(registerUser(userData))
// 3. Logout: dispatch(logoutUser())
// 4. Check auth on app start: dispatch(checkAuthStatus())
// 5. Read auth state: useAppSelector(state => state.auth)
// 6. httpOnly cookies are handled automatically by the browser
// ═══════════════════════════════════════════════════════════════
