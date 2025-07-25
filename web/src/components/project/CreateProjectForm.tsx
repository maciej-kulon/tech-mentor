// ═══════════════════════════════════════════════════════════════
// CREATE PROJECT FORM COMPONENT - Form for creating new projects
// ═══════════════════════════════════════════════════════════════

// React imports - useState for local form state, useEffect for side effects
import { useState, useEffect } from "react";

// Import Redux hooks for state management
import { useAppSelector, useAppDispatch } from "../../store/hooks";

// Import Redux actions - we'll use createProject to submit the form
import { createProject, clearError } from "../../store/slices/projectsSlice";

// Import i18n translation hook
import { useTranslation } from "react-i18next";

// Import TypeScript interfaces for type safety
import { CreateProjectRequestDto } from "../../types/generated";
import { ProjectStatus } from "../../types/generated/project/enums/project-status.enum";

// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT INTERFACES - Define the shape of our form data
// ═══════════════════════════════════════════════════════════════

// This interface defines what our form will contain
// Notice it's similar to CreateProjectRequestDto but we'll handle ownerId separately
interface CreateProjectFormData {
  name: string; // Project name - required
  description: string; // Project description - required
  status: ProjectStatus; // Project status - required, from enum
}

// Props interface - what this component expects from its parent
interface CreateProjectFormProps {
  // Function to call when the form should be closed (successful submit or cancel)
  onClose: () => void;
}

// ═══════════════════════════════════════════════════════════════
// CREATE PROJECT FORM COMPONENT
// ═══════════════════════════════════════════════════════════════

// React.FC<CreateProjectFormProps> means this is a React Functional Component
// that expects props matching the CreateProjectFormProps interface
export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onClose,
}) => {
  // ═══════════════════════════════════════════════════════════════
  // I18N SETUP - Get translation function
  // ═══════════════════════════════════════════════════════════════

  // useTranslation hook provides access to translation functions
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════
  // REDUX STATE ACCESS - Get state from Redux store
  // ═══════════════════════════════════════════════════════════════

  // Get authentication state to access current user
  const { user } = useAppSelector((state) => state.auth);

  // Get projects state to access loading and error states
  const { isLoading, error } = useAppSelector((state) => state.projects);

  // Get dispatch function to trigger Redux actions
  const dispatch = useAppDispatch();

  // ═══════════════════════════════════════════════════════════════
  // LOCAL FORM STATE - Form data that stays in this component
  // ═══════════════════════════════════════════════════════════════

  // Form data state - this is local state because it's UI-specific
  // We use useState hook to manage form field values
  const [formData, setFormData] = useState<CreateProjectFormData>({
    name: "", // Start with empty name
    description: "", // Start with empty description
    status: ProjectStatus.ACTIVE, // Default to ACTIVE status
  });

  // Local error state for client-side validation
  // This is separate from Redux errors (which come from the API)
  const [formError, setFormError] = useState<string | null>(null);

  // Success state to show confirmation message
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // SIDE EFFECTS - Things that happen when component mounts or state changes
  // ═══════════════════════════════════════════════════════════════

  // Clear any existing Redux errors when component mounts
  // This ensures we start with a clean slate
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS - Functions that respond to user interactions
  // ═══════════════════════════════════════════════════════════════

  // Handle input field changes (when user types)
  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    // Destructure name and value from the input element
    // name = the "name" attribute of the input
    // value = what the user typed/selected
    const { name, value } = event.target;

    // Update form data using functional state update
    // This pattern ensures we don't lose other form fields
    setFormData((prevData) => ({
      ...prevData, // Keep all existing form data
      [name]: value, // Update only the field that changed
    }));

    // Clear any existing validation errors when user starts typing
    // This provides immediate feedback that they're fixing the issue
    if (formError) {
      setFormError(null);
    }

    // Also clear Redux errors when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FORM VALIDATION - Client-side validation before API submission
  // ═══════════════════════════════════════════════════════════════

  // Validation function that returns true if form is valid, false otherwise
  const validateForm = (): boolean => {
    // Check each required field and set appropriate error messages

    if (!formData.name.trim()) {
      setFormError(t("projects.createForm.validation.nameRequired"));
      return false;
    }

    if (formData.name.trim().length < 2) {
      setFormError(t("projects.createForm.validation.nameTooShort"));
      return false;
    }

    if (!formData.status) {
      setFormError(t("projects.createForm.validation.statusRequired"));
      return false;
    }

    // If we get here, all validation passed
    return true;
  };

  // ═══════════════════════════════════════════════════════════════
  // FORM SUBMISSION - Handle form submission with Redux
  // ═══════════════════════════════════════════════════════════════

  const handleSubmit = async (event: React.FormEvent) => {
    // Prevent default form submission (which would reload the page)
    event.preventDefault();

    // Don't proceed if validation fails
    if (!validateForm()) {
      return;
    }

    // Check if user is authenticated (should always be true, but safety check)
    if (!user) {
      setFormError(t("projects.createForm.validation.notLoggedIn"));
      return;
    }

    // Clear any previous errors
    setFormError(null);

    // Prepare data for API call - convert form data to API format
    const projectData: CreateProjectRequestDto = {
      name: formData.name.trim(), // Clean whitespace
      description: formData.description.trim(), // Clean whitespace
      status: formData.status, // Status from enum
      ownerId: user.id, // Current user as owner
    };

    try {
      // Log the data being sent to help debug
      console.log("🚀 Creating project with data:", projectData);

      // Dispatch Redux action to create project
      // createProject is an async thunk that handles the API call
      const result = await dispatch(createProject(projectData));

      // Log the result to help debug
      console.log("📡 Create project result:", result);

      // Check if the action was successful
      // Redux Toolkit provides these action creators for async thunks
      if (createProject.fulfilled.match(result)) {
        console.log("✅ Project created successfully!");
        // Success! Show confirmation and close modal after a delay
        setIsSubmitted(true);

        // Close the modal after 1.5 seconds to show success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else if (createProject.rejected.match(result)) {
        console.log("❌ Project creation failed:", result.payload);
        // Error will be shown via Redux error state
      }

      // If action was rejected, error will be in Redux state
      // The error will be displayed via the error state we're reading from Redux
    } catch (error) {
      // This catch block handles any unexpected errors
      console.error("💥 Unexpected error during project creation:", error);
      setFormError(t("projects.createForm.validation.unexpectedError"));
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CONDITIONAL RENDERING - Show success message if form was submitted
  // ═══════════════════════════════════════════════════════════════

  // If form was successfully submitted, show success message
  if (isSubmitted) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h3 style={{ color: "#ffffff", marginBottom: "1rem" }}>
          {t("projects.createForm.successTitle")}
        </h3>
        <p style={{ color: "rgba(255, 255, 255, 0.8)" }}>
          {t("projects.createForm.successMessage")}
        </p>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // JSX RETURN - The form UI
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="create-project-form">
      {/* Form element with onSubmit handler */}
      <form onSubmit={handleSubmit}>
        {/* PROJECT NAME FIELD */}
        <div className="form-group">
          <label htmlFor="name">{t("projects.createForm.nameLabel")}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={t("projects.createForm.namePlaceholder")}
            disabled={isLoading}
            required
          />
        </div>

        {/* PROJECT DESCRIPTION FIELD */}
        <div className="form-group">
          <label htmlFor="description">
            {t("projects.createForm.descriptionLabel")}
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t("projects.createForm.descriptionPlaceholder")}
            disabled={isLoading}
            rows={4}
            required
          />
        </div>

        {/* PROJECT STATUS FIELD */}
        <div className="form-group">
          <label htmlFor="status">{t("projects.createForm.statusLabel")}</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isLoading}
            required
          >
            {/* Map over enum values to create options */}
            {Object.values(ProjectStatus).map((status) => (
              <option key={status} value={status}>
                {/* Convert enum value to display text */}
                {status
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* ERROR DISPLAY - Show validation or API errors */}
        {formError && <div className="error-message">{formError}</div>}

        {/* Show Redux errors from API */}
        {error && <div className="error-message">{error}</div>}

        {/* FORM BUTTONS */}
        <div className="form-buttons" style={{ marginTop: "2rem" }}>
          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading
              ? t("projects.createForm.creatingButton")
              : t("projects.createForm.createButton")}
          </button>

          {/* Cancel button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {t("projects.createForm.cancelButton")}
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// KEY REACT PATTERNS DEMONSTRATED IN THIS COMPONENT:
// ═══════════════════════════════════════════════════════════════

/*
1. CONTROLLED COMPONENTS - Form inputs controlled by React state
   - value={formData.name} makes React control the input value
   - onChange={handleChange} updates state when user types
   - This gives us full control over form behavior

2. FORM HANDLING PATTERNS
   - Single handleChange function for all inputs using event.target.name
   - Client-side validation before API submission
   - Separate local state (formError) and global state (Redux error)

3. ASYNC OPERATIONS WITH REDUX
   - dispatch(createProject(data)) triggers async API call
   - Redux handles loading states automatically
   - We check if action was fulfilled/rejected for UI feedback

4. CONDITIONAL RENDERING
   - Different UI based on submission state (form vs success message)
   - Error messages only show when there are errors
   - Buttons disabled during loading

5. TYPESCRIPT INTEGRATION
   - Interfaces define data shapes and component contracts
   - Type-safe event handlers and state management
   - Enum usage for predefined values (ProjectStatus)

6. COMPONENT COMPOSITION
   - This form component can be used in any modal or page
   - Props interface defines how parent communicates with this component
   - onClose callback lets parent decide what happens when form closes

7. USER EXPERIENCE PATTERNS
   - Real-time validation error clearing
   - Loading states and disabled buttons
   - Success confirmation before closing
   - Placeholder text to guide user input

8. SEPARATION OF CONCERNS
   - Form logic separated from modal logic
   - Redux handles API calls and global state
   - Component handles local form state and validation
   - Clear responsibility boundaries

This component follows React best practices and demonstrates how to build
reusable, type-safe, and user-friendly forms in a React/Redux application.
*/
