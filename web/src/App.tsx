// ═══════════════════════════════════════════════════════════════
// IMPORTS - How React applications load components and styles
// ═══════════════════════════════════════════════════════════════

// Import React hooks
import { useEffect } from "react";

// Import React Router components for navigation
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Import Redux Provider to make store available to all components
import { Provider } from "react-redux";
import { store } from "./store";

// Import Redux hooks for auth checking
import { useAppSelector, useAppDispatch } from "./store/hooks";
import { checkAuthStatus } from "./store/slices/authSlice";

// Import our custom components from the components folder
// { } means we're importing a named export (not a default export)
import { LoginForm } from "./components/login/LoginForm";
import { RegisterForm } from "./components/register/RegisterForm";
import { ProjectBrowser } from "./components/project/ProjectBrowser";
import { LanguageSwitcher } from "./components/common/LanguageSwitcher";

// Import i18n configuration
import "./i18n";

// Import CSS styles for this component
import "./App.css";

// ═══════════════════════════════════════════════════════════════
// PROTECTED ROUTE COMPONENT - Wraps components that require authentication
// ═══════════════════════════════════════════════════════════════

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );

  // If auth status hasn't been checked yet, show loading
  if (!isInitialized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, show the protected component
  return <>{children}</>;
};

// ═══════════════════════════════════════════════════════════════
// APP ROUTES COMPONENT - Contains routing logic with auth checks
// ═══════════════════════════════════════════════════════════════

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );
  const dispatch = useAppDispatch();

  // Check auth status when app loads
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  // Show loading while checking auth status
  if (!isInitialized) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <>
      {/* Language switcher - available on all pages */}
      <LanguageSwitcher />

      <Routes>
        {/* Public routes - accessible without authentication */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/projects" replace />
            ) : (
              <LoginForm />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/projects" replace />
            ) : (
              <RegisterForm />
            )
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectBrowser />
            </ProtectedRoute>
          }
        />

        {/* Default route - redirect based on auth status */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? "/projects" : "/login"} replace />
          }
        />

        {/* Catch-all route for invalid paths */}
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/projects" : "/login"} replace />
          }
        />
      </Routes>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN APP COMPONENT - The root component of our application
// ═══════════════════════════════════════════════════════════════

// This is a React Functional Component with routing and auth setup
// It defines which component to show based on the URL path and auth status
function App() {
  return (
    // Redux Provider makes the store available to all components
    // This must wrap the entire app so any component can access Redux state
    <Provider store={store}>
      <Router>
        {/* Router wraps our entire app to enable navigation */}
        <AppRoutes />
      </Router>
    </Provider>
  );
}

// Export the component so other files can import it
// This is a "default export" - when you import this file,
// you get the App component by default
export default App;

// ═══════════════════════════════════════════════════════════════
// HOW ROUTING, REDUX, AND AUTHENTICATION WORK TOGETHER:
// ═══════════════════════════════════════════════════════════════
// 1. Redux Provider wraps the entire app, making state available everywhere
// 2. App loads and checks authentication status from httpOnly cookies
// 3. Routes are protected based on authentication state from Redux
// 4. Login/Register forms dispatch Redux actions for auth operations
// 5. httpOnly cookies handle secure token storage automatically
// 6. Protected routes redirect to login if user is not authenticated
// 7. API calls include credentials and handle 401 errors gracefully
// 8. All state updates are centralized and components react automatically
// ═══════════════════════════════════════════════════════════════
