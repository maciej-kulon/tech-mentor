// ═══════════════════════════════════════════════════════════════
// REGISTER FORM COMPONENT - User registration with Redux integration
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Import Redux hooks for state management
import { useAppSelector, useAppDispatch } from "../../store/hooks";
// Import Redux auth actions
import { registerUser, clearError } from "../../store/slices/authSlice";

// Import i18n translation hook
import { useTranslation } from "react-i18next";

// Import TypeScript interfaces
import "./RegisterForm.css";

// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT INTERFACES - Define form data structure
// ═══════════════════════════════════════════════════════════════

export interface RegisterFormData {
  name: string;
  surname: string;
  company: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ═══════════════════════════════════════════════════════════════
// REGISTER FORM COMPONENT
// ═══════════════════════════════════════════════════════════════

export const RegisterForm: React.FC = () => {
  // ═══════════════════════════════════════════════════════════════
  // I18N SETUP - Get translation function
  // ═══════════════════════════════════════════════════════════════

  // useTranslation hook provides access to translation functions
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════
  // REDUX STATE ACCESS - Get auth state from Redux store
  // ═══════════════════════════════════════════════════════════════

  // useAppSelector reads data from Redux state
  const { loading: authLoading, error: authError } = useAppSelector(
    (state) => state.auth
  );

  // useAppDispatch allows us to trigger Redux actions
  const dispatch = useAppDispatch();

  // React Router navigation hook
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════
  // LOCAL FORM STATE - Keep form inputs local (not in Redux)
  // ═══════════════════════════════════════════════════════════════

  // State for form input values - stays local since it's UI-specific
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    surname: "",
    company: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Local error state for form validation (separate from auth errors)
  const [formError, setFormError] = useState<string | null>(null);

  // Success message for completed registration
  const [isRegistered, setIsRegistered] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // EFFECTS - Side effects when component mounts or state changes
  // ═══════════════════════════════════════════════════════════════

  // Clear Redux auth error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS - Functions that respond to user interactions
  // ═══════════════════════════════════════════════════════════════

  // Handle input field changes (when user types)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear form validation errors when user starts typing
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

  const validateForm = (): boolean => {
    // Check required fields
    if (!formData.name.trim()) {
      setFormError(t("auth.register.validation.nameRequired"));
      return false;
    }

    if (!formData.surname.trim()) {
      setFormError(t("auth.register.validation.surnameRequired"));
      return false;
    }

    if (!formData.email.trim()) {
      setFormError(t("auth.register.validation.emailRequired"));
      return false;
    }

    // Basic email validation
    if (!formData.email.includes("@")) {
      setFormError(t("auth.register.validation.emailInvalid"));
      return false;
    }

    if (!formData.password.trim()) {
      setFormError(t("auth.register.validation.passwordRequired"));
      return false;
    }

    // Password length validation
    if (formData.password.length < 6) {
      setFormError(t("auth.register.validation.passwordTooShort"));
      return false;
    }

    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      setFormError(t("auth.register.validation.passwordsDoNotMatch"));
      return false;
    }

    return true;
  };

  // ═══════════════════════════════════════════════════════════════
  // FORM SUBMISSION - Handle registration when form is submitted
  // ═══════════════════════════════════════════════════════════════

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't proceed if validation fails
    if (!validateForm()) {
      return;
    }

    // Clear any previous form errors
    setFormError(null);

    // Prepare data for API call (exclude confirmPassword)
    const registrationData = {
      name: formData.name,
      surname: formData.surname,
      company: formData.company,
      email: formData.email,
      password: formData.password,
    };

    try {
      // Dispatch Redux register action
      const result = await dispatch(registerUser(registrationData));

      // Check if registration was successful
      if (registerUser.fulfilled.match(result)) {
        setIsRegistered(true);
        // Navigate to login page after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      // Error is handled by Redux, no need to set local error
      console.error("Registration error:", error);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CONDITIONAL RENDERING - Show success message if registered
  // ═══════════════════════════════════════════════════════════════

  if (isRegistered) {
    return (
      <div className="register-container">
        <div className="register-form">
          <h2>{t("auth.register.successTitle")}</h2>
          <p>{t("auth.register.successMessage")}</p>
          <p>{t("auth.register.redirectingMessage")}</p>
          <div style={{ marginTop: "20px" }}>
            <Link to="/login">{t("auth.register.goToLoginLink")}</Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // JSX RETURN - The main registration form UI
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>{t("auth.register.title")}</h2>
        <p>{t("auth.register.subtitle")}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">{t("auth.register.firstNameLabel")}</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t("auth.register.firstNamePlaceholder")}
              disabled={authLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="surname">{t("auth.register.lastNameLabel")}</label>
            <input
              type="text"
              id="surname"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              placeholder={t("auth.register.lastNamePlaceholder")}
              disabled={authLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">{t("auth.register.companyLabel")}</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder={t("auth.register.companyPlaceholder")}
              disabled={authLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">{t("auth.register.emailLabel")}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t("auth.register.emailPlaceholder")}
              disabled={authLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t("auth.register.passwordLabel")}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={t("auth.register.passwordPlaceholder")}
              disabled={authLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              {t("auth.register.confirmPasswordLabel")}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder={t("auth.register.confirmPasswordPlaceholder")}
              disabled={authLoading}
            />
          </div>

          {/* Show form validation errors */}
          {formError && <div className="error-message">{formError}</div>}

          {/* Show Redux auth errors */}
          {authError && <div className="error-message">{authError}</div>}

          {/* Submit button */}
          <button type="submit" disabled={authLoading} className="submit-btn">
            {authLoading
              ? t("auth.register.creatingAccount")
              : t("auth.register.createAccountButton")}
          </button>

          <p className="register-help">
            {t("auth.register.hasAccount")}{" "}
            <Link to="/login">{t("auth.register.signInLink")}</Link>
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
// 2. Auth loading and error states come from Redux
// 3. Form submission dispatches Redux action (registerUser)
// 4. Redux handles API calls and updates global auth state
// 5. Component shows success message and redirects on successful registration
// 6. User needs to login after registration (common pattern)
// ═══════════════════════════════════════════════════════════════
