// ═══════════════════════════════════════════════════════════════
// PROJECT BROWSER COMPONENT - Displays and manages projects using Redux
// ═══════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";

// Import Redux hooks for state management
import { useAppSelector, useAppDispatch } from "../../store/hooks";

// Import Redux actions and async thunks
import {
  fetchProjects,
  setSelectedProject,
  setSearchTerm,
  setStatusFilter,
  clearFilters,
  clearError,
  // createProject is now used in CreateProjectForm component
} from "../../store/slices/projectsSlice";

// Import TypeScript interfaces
import { ProjectResponseDto } from "../../types/generated";

// Import CSS styles
import "./ProjectBrowser.css";

// Import our reusable Modal component
import { Modal } from "../common/modal";

// Import our CreateProjectForm component
import { CreateProjectForm } from "./CreateProjectForm";

// Import i18n translation hook
import { useTranslation } from "react-i18next";

// ═══════════════════════════════════════════════════════════════
// PROJECT BROWSER COMPONENT - Main component for project management
// ═══════════════════════════════════════════════════════════════

export const ProjectBrowser: React.FC = () => {
  // ═══════════════════════════════════════════════════════════════
  // I18N SETUP - Get translation function
  // ═══════════════════════════════════════════════════════════════

  // useTranslation hook provides access to translation functions
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════
  // REDUX STATE ACCESS - Get state from the Redux store
  // ═══════════════════════════════════════════════════════════════

  // useAppSelector reads data from Redux state
  // This automatically re-renders when state changes
  const {
    projects,
    isLoading,
    error,
    selectedProject,
    searchTerm,
    statusFilter,
  } = useAppSelector((state) => state.projects);

  // useAppDispatch allows us to trigger actions
  const dispatch = useAppDispatch();

  // ═══════════════════════════════════════════════════════════════
  // LOCAL COMPONENT STATE - For modal visibility
  // ═══════════════════════════════════════════════════════════════

  // State to control whether the create project modal is open
  // This is local state (not Redux) because it's UI-specific
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // COMPONENT LIFECYCLE - Load projects when component mounts
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    // Dispatch the async thunk to fetch projects from API
    // This will automatically handle loading states
    dispatch(fetchProjects());
  }, [dispatch]);

  // ═══════════════════════════════════════════════════════════════
  // EVENT HANDLERS - Functions to handle user interactions
  // ═══════════════════════════════════════════════════════════════

  // Handle project selection
  const handleProjectSelect = (project: ProjectResponseDto) => {
    dispatch(setSelectedProject(project));
  };

  // Handle search input changes
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(event.target.value));
  };

  // Handle status filter changes
  const handleStatusFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;
    dispatch(setStatusFilter(value === "" ? null : value));
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Handle clearing error message
  const handleClearError = () => {
    dispatch(clearError());
  };

  // Handle opening the create project modal
  const handleCreateProject = () => {
    // Instead of directly creating a project with hardcoded data,
    // we now open a modal where the user can input the details
    setIsCreateModalOpen(true);
  };

  // Handle closing the create project modal
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  // Handle clicking on empty space to clear selection
  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only clear selection if clicking directly on the background element
    // This prevents clearing when clicking on child elements
    if (event.target === event.currentTarget) {
      dispatch(setSelectedProject(null));
    }
  };

  // Handle opening the selected project
  const handleOpenProject = () => {
    if (selectedProject) {
      // TODO: Implement project opening functionality
      console.log("Opening project:", selectedProject.name);
      // This could navigate to a project detail page or open project workspace
    }
  };

  // Handle editing project information
  const handleEditProjectInfo = () => {
    if (selectedProject) {
      // TODO: Implement project editing functionality
      console.log("Editing project info:", selectedProject.name);
      // This could open an edit modal or navigate to an edit page
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER COMPONENT - JSX structure for the UI
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="project-browser" onClick={handleBackgroundClick}>
      {/* Page Header */}
      <h1 onClick={(e) => e.stopPropagation()}>
        {t("projects.browser.title")}
      </h1>

      {/* Error Display */}
      {error && (
        <div className="error-container" onClick={(e) => e.stopPropagation()}>
          <p className="error-message">
            {t("common.error")}: {error}
          </p>
          <button onClick={handleClearError} className="error-clear-button">
            {t("common.clear")} {t("common.error")}
          </button>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="controls-section" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <input
          type="text"
          placeholder={t("projects.browser.searchPlaceholder")}
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-input"
        />

        {/* Status Filter */}
        <select
          value={statusFilter || ""}
          onChange={handleStatusFilterChange}
          className="status-filter"
        >
          <option value="">{t("projects.browser.statusFilter.all")}</option>
          <option value="active">
            {t("projects.browser.statusFilter.active")}
          </option>
          <option value="completed">
            {t("projects.browser.statusFilter.completed")}
          </option>
          <option value="paused">
            {t("projects.browser.statusFilter.paused")}
          </option>
        </select>

        {/* Create Project Button */}
        <button onClick={handleCreateProject} className="btn btn-primary">
          {t("projects.browser.createButton")}
        </button>

        {/* Clear Filters Button */}
        <button onClick={handleClearFilters} className="btn btn-secondary">
          {t("projects.browser.clearFiltersButton")}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container" onClick={(e) => e.stopPropagation()}>
          <p>{t("projects.browser.loadingMessage")}</p>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && (
        <div className="projects-grid" onClick={(e) => e.stopPropagation()}>
          {projects.length === 0 ? (
            <div className="empty-state">
              <p>{t("projects.browser.noProjectsMessage")}</p>
              <p className="subtitle">
                {t("projects.browser.noProjectsSubtitle")}
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProjectSelect(project);
                }}
                className={`project-card ${
                  selectedProject?.id === project.id ? "selected" : ""
                }`}
              >
                <h3 className="project-card-title">{project.name}</h3>
                <p className="project-card-description">
                  {project.description ||
                    t("projects.browser.projectCard.noDescription")}
                </p>
                <div className="project-card-meta">
                  <span>
                    {t("projects.browser.projectCard.statusLabel")}{" "}
                    {project.status}
                  </span>
                  <span>
                    {t("projects.browser.projectCard.idLabel")} {project.id}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Project Details */}
      {selectedProject && (
        <div
          className="selected-project-details"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="selected-project-title">
            {t("projects.browser.selectedProject.title")}
          </h2>
          <div className="selected-project-grid">
            <span className="selected-project-label">
              {t("projects.browser.selectedProject.nameLabel")}
            </span>
            <span className="selected-project-value">
              {selectedProject.name}
            </span>

            <span className="selected-project-label">
              {t("projects.browser.selectedProject.descriptionLabel")}
            </span>
            <span className="selected-project-value">
              {selectedProject.description ||
                t("projects.browser.selectedProject.noDescription")}
            </span>

            <span className="selected-project-label">
              {t("projects.browser.selectedProject.statusLabel")}
            </span>
            <span className="selected-project-value">
              {selectedProject.status}
            </span>

            <span className="selected-project-label">
              {t("projects.browser.selectedProject.idLabel")}
            </span>
            <span className="selected-project-value">{selectedProject.id}</span>
          </div>

          <div className="selected-project-actions">
            <button onClick={handleOpenProject} className="btn btn-primary">
              {t("projects.browser.selectedProject.openButton")}
            </button>
            <button
              onClick={handleEditProjectInfo}
              className="btn btn-secondary"
            >
              {t("projects.browser.selectedProject.editButton")}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CREATE PROJECT MODAL - Demonstration of modal usage
          ═══════════════════════════════════════════════════════════════ */}

      {/* Modal component - only renders when isCreateModalOpen is true */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title={t("projects.browser.createModal.title")}
      >
        <CreateProjectForm onClose={handleCloseCreateModal} />
      </Modal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOW THIS COMPONENT USES REDUX:
// ═══════════════════════════════════════════════════════════════
// 1. useAppSelector reads all project state from Redux store
// 2. useAppDispatch gets the dispatch function to trigger actions
// 3. useEffect dispatches fetchProjects() when component mounts
// 4. Event handlers dispatch actions to update state
// 5. Component automatically re-renders when Redux state changes
// 6. All state management is centralized in Redux store
// ═══════════════════════════════════════════════════════════════
