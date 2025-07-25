// React import - useState is a "hook" that lets us add state to functional components
import { useState, useEffect } from "react";
// React Router import - Link component for navigation between pages
import { Link, useNavigate } from "react-router-dom";
// CSS import - in React, we import CSS files like this to apply styles
import "./LoginForm.css";

// Import Redux hooks for state management
import { useAppSelector, useAppDispatch } from "../../store/hooks";
// Import Redux auth actions
import {
  loginUser,
  logoutUser,
  clearError,
} from "../../store/slices/authSlice";

// Import i18n translation hook
import { useTranslation } from "react-i18next";

// Import TypeScript interfaces
// Note: User type comes from Redux state, no direct import needed

// TypeScript interfaces - these define the "shape" of our data
// This is like a contract that says "email and password must be strings"
interface LoginFormData {
  email: string;
  password: string;
}

// React.FC means "React Functional Component" - this is a TypeScript type
// The component is exported so other files can import and use it
export const LoginForm: React.FC = () => {
  // ═══════════════════════════════════════════════════════════════
  // I18N SETUP - Get translation function
  // ═══════════════════════════════════════════════════════════════

  // useTranslation hook provides access to translation functions
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════
  // REDUX STATE ACCESS - Get auth state from Redux store
  // ═══════════════════════════════════════════════════════════════

  // useAppSelector reads data from Redux state
  const {
    isAuthenticated,
    user,
    loading: authLoading,
    error: authError,
  } = useAppSelector((state) => state.auth);

  // useAppDispatch allows us to trigger Redux actions
  const dispatch = useAppDispatch();

  // React Router navigation hook
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════
  // LOCAL FORM STATE - Keep form inputs local (not in Redux)
  // ═══════════════════════════════════════════════════════════════

  // State for form input values - this stays local since it's UI-specific
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  // Local error state for form validation (separate from auth errors)
  const [formError, setFormError] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // EFFECTS - Side effects when component mounts or state changes
  // ═══════════════════════════════════════════════════════════════

  // Clear Redux auth error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Navigate to projects page when user successfully logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/projects");
    }
  }, [isAuthenticated, user, navigate]);

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS - Functions that respond to user interactions
  // ═══════════════════════════════════════════════════════════════

  // Handle input field changes (when user types in email/password)
  // React.ChangeEvent<HTMLInputElement> is TypeScript type for input change events
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Destructuring - extracts name and value from the input element
    // e.target is the input field that triggered the event
    const { name, value } = e.target;

    // Update form data using the setter function from useState
    // We use a function that receives the previous state and returns new state
    // This pattern is called "functional state update"
    setFormData((prev) => ({
      ...prev, // Spread operator - keeps all existing fields
      [name]: value, // Dynamic key - updates only the field that changed
    }));

    // Clear any existing error when user starts typing
    // This provides better user experience
    if (formError) {
      setFormError(null);
    }
    // Also clear Redux auth errors when user starts typing
    if (authError) {
      dispatch(clearError());
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FORM VALIDATION - Client-side validation before API call
  // ═══════════════════════════════════════════════════════════════

  // Function that returns boolean - true if form is valid, false otherwise
  const validateForm = (): boolean => {
    // Check if email is empty (trim() removes whitespace)
    if (!formData.email.trim()) {
      setFormError(t("auth.login.validation.emailRequired"));
      return false;
    }

    // Basic email validation (checking for @ symbol)
    if (!formData.email.includes("@")) {
      setFormError(t("auth.login.validation.emailInvalid"));
      return false;
    }

    // Check if password is empty
    if (!formData.password.trim()) {
      setFormError(t("auth.login.validation.passwordRequired"));
      return false;
    }

    return true;
  };

  // ═══════════════════════════════════════════════════════════════
  // FORM SUBMISSION - Handle login when form is submitted
  // ═══════════════════════════════════════════════════════════════

  // async function for form submission using Redux
  // React.FormEvent is TypeScript type for form submission events
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission (which would reload the page)
    // This is crucial in React - we handle form submission with JavaScript
    e.preventDefault();

    // Don't proceed if validation fails
    if (!validateForm()) {
      return;
    }

    // Clear any previous form errors
    setFormError(null);

    // Dispatch Redux login action with form data
    // This will handle the API call, loading states, and auth state updates
    dispatch(
      loginUser({
        email: formData.email,
        password: formData.password,
      })
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // LOGOUT HANDLER - Reset application state and clear cookies
  // ═══════════════════════════════════════════════════════════════

  const handleLogout = () => {
    // Dispatch Redux logout action
    // This will handle the API call and clear auth state
    dispatch(logoutUser());

    // Clear local form data
    setFormData({ email: "", password: "" });
    setFormError(null);
  };

  // ═══════════════════════════════════════════════════════════════
  // CONDITIONAL RENDERING - Show different UI based on state
  // ═══════════════════════════════════════════════════════════════

  // If user is logged in, show success message instead of login form
  // This is called "conditional rendering" in React
  if (isAuthenticated && user) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>{t("auth.login.welcomeMessage", { name: user.name })}</h2>
          <p>{t("auth.login.loggedInMessage")}</p>
          <div
            style={{
              marginBottom: "1rem",
              padding: "1rem",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
          >
            <strong>{t("auth.login.userInfo")}</strong>
            <br />
            {t("auth.login.nameLabel")} {user.name} {user.surname}
            <br />
            {t("auth.login.emailLabel")} {user.email}
            <br />
            {user.company && (
              <>
                {t("auth.login.companyLabel")} {user.company}
                <br />
              </>
            )}
          </div>

          {/* onClick is how we attach event handlers to elements in React */}
          <button onClick={handleLogout} className="logout-btn">
            {t("auth.login.logoutButton")}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // JSX RETURN - The main component UI
  // ═══════════════════════════════════════════════════════════════

  // JSX looks like HTML but it's actually JavaScript
  // React converts this to JavaScript function calls
  return (
    <div className="login-container">
      <div className="login-form">
        {/* h2 is an HTML heading element (level 2) */}
        <h2>{t("auth.login.title")}</h2>
        <p>{t("auth.login.subtitle")}</p>

        {/* Form element with onSubmit event handler */}
        {/* onSubmit triggers when user clicks submit or presses Enter */}
        <form onSubmit={handleSubmit}>
          {/* Form groups organize labels and inputs together */}
          <div className="form-group">
            {/* htmlFor connects the label to the input for accessibility */}
            <label htmlFor="email">{t("auth.login.emailLabel")}</label>
            <input
              type="email" /* HTML5 email input type for validation */
              id="email" /* Must match htmlFor in the label */
              name="email" /* Used in handleChange to identify the field */
              value={
                formData.email
              } /* Controlled component - React controls the value */
              onChange={handleChange} /* Triggers on every keystroke */
              placeholder={t("auth.login.emailPlaceholder")}
              disabled={authLoading} /* Disable input during API call */
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("auth.login.passwordLabel")}</label>
            <input
              type="password" /* Hides the typed characters */
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("auth.login.passwordPlaceholder")}
              disabled={authLoading}
            />
          </div>

          {/* Conditional rendering - show form validation errors */}
          {formError && <div className="error-message">{formError}</div>}

          {/* Show Redux auth errors */}
          {authError && <div className="error-message">{authError}</div>}

          {/* Submit button */}
          <button type="submit" disabled={authLoading} className="submit-btn">
            {/* Ternary operator - show different text based on loading state */}
            {authLoading
              ? t("auth.login.loggingIn")
              : t("auth.login.loginButton")}
          </button>

          {/* Link component for navigation - doesn't reload the page */}
          <p className="register-help">
            {t("auth.login.noAccount")}{" "}
            <Link to="/register">{t("auth.login.signUpLink")}</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOW THIS COMPONENT WORKS WITH REDUX:
// ═══════════════════════════════════════════════════════════════
// 1. Form inputs are managed locally for immediate UI feedback
// 2. Auth state (isAuthenticated, user, loading, error) comes from Redux
// 3. Form submission dispatches Redux action (loginUser)
// 4. Redux handles API calls and updates global auth state
// 5. Component automatically re-renders when Redux state changes
// 6. Navigation happens automatically when user becomes authenticated
// ═══════════════════════════════════════════════════════════════
