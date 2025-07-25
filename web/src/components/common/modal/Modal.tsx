// ═══════════════════════════════════════════════════════════════
// REUSABLE MODAL COMPONENT - A flexible popup window for any content
// ═══════════════════════════════════════════════════════════════

// React imports - we need these hooks for functionality
import { useEffect } from "react";

// Import i18n translation hook
import { useTranslation } from "react-i18next";

// Import the CSS styles for this component
import "./Modal.css";

// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT INTERFACE - The "contract" for this component
// ═══════════════════════════════════════════════════════════════

// This interface defines what props (inputs) our Modal component expects
// Think of it like a function signature - it tells other components
// exactly what they need to provide to use this Modal
interface ModalProps {
  // isOpen: boolean - Controls whether the modal is visible or hidden
  // This is a "controlled component" pattern - the parent controls the state
  isOpen: boolean;

  // onClose: function - Called when the modal should be closed
  // The parent component decides what happens when modal closes
  // () => void means: function that takes no parameters and returns nothing
  onClose: () => void;

  // title: string - Text to display in the modal header
  // This makes our modal flexible - different modals can have different titles
  title: string;

  // children: React.ReactNode - The content inside the modal
  // This is React's way of letting you put any content between <Modal></Modal>
  // ReactNode can be text, JSX elements, arrays of elements, etc.
  children: React.ReactNode;
}

// ═══════════════════════════════════════════════════════════════
// MODAL COMPONENT - The actual component function
// ═══════════════════════════════════════════════════════════════

// React.FC<ModalProps> means:
// - React.FC = React Functional Component
// - <ModalProps> = TypeScript generic that tells us what props to expect
// This gives us TypeScript autocomplete and error checking
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  // ═══════════════════════════════════════════════════════════════
  // I18N SETUP - Get translation function
  // ═══════════════════════════════════════════════════════════════

  // useTranslation hook provides access to translation functions
  const { t } = useTranslation();

  // ═══════════════════════════════════════════════════════════════
  // KEYBOARD EVENT HANDLING - Close modal with Escape key
  // ═══════════════════════════════════════════════════════════════

  // useEffect is a React hook that runs "side effects"
  // Side effects are things that happen outside of React (like event listeners)
  useEffect(() => {
    // This function handles keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      // If user presses Escape key, close the modal
      if (event.key === "Escape") {
        onClose(); // Call the function the parent provided
      }
    };

    // Only add the event listener if the modal is open
    // We don't want to listen for Escape when modal is closed
    if (isOpen) {
      // addEventListener attaches our function to keyboard events
      // This is a browser API, not a React thing
      document.addEventListener("keydown", handleKeyDown);
    }

    // CLEANUP FUNCTION - This is crucial to prevent memory leaks!
    // useEffect can return a function that runs when:
    // 1. The component unmounts (gets removed from page)
    // 2. The dependencies change (isOpen or onClose change)
    // 3. The effect runs again
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };

    // DEPENDENCY ARRAY - [isOpen, onClose]
    // This tells React when to re-run this effect
    // If isOpen or onClose changes, remove old listener and add new one
    // This ensures we don't have multiple listeners accumulating
  }, [isOpen, onClose]);

  // ═══════════════════════════════════════════════════════════════
  // BACKDROP CLICK HANDLING - Close when clicking outside modal
  // ═══════════════════════════════════════════════════════════════

  // This function handles clicks on the backdrop (dark area around modal)
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // event.target = the element that was actually clicked
    // event.currentTarget = the element this event handler is attached to

    // We only want to close if they clicked the backdrop itself,
    // not if they clicked something inside the modal
    if (event.target === event.currentTarget) {
      onClose(); // Close the modal
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CONDITIONAL RENDERING - Only show modal if isOpen is true
  // ═══════════════════════════════════════════════════════════════

  // If modal is not open, don't render anything
  // In React, returning null means "render nothing"
  // This is better than CSS display:none because the DOM elements
  // don't exist at all when modal is closed
  if (!isOpen) {
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // JSX RETURN - The actual modal structure
  // ═══════════════════════════════════════════════════════════════

  return (
    // MODAL OVERLAY - The backdrop that covers the entire screen
    <div
      className="modal-overlay"
      onClick={handleBackdropClick}
      // ARIA attributes for accessibility
      // role="dialog" tells screen readers this is a modal dialog
      role="dialog"
      // aria-modal tells assistive technology this is a modal
      aria-modal="true"
      // aria-labelledby connects this modal to its title for screen readers
      aria-labelledby="modal-title"
    >
      {/* MODAL CONTAINER - Centers the modal content on screen */}
      <div className="modal-container">
        {/* MODAL CONTENT - The actual modal box */}
        <div className="modal-content">
          {/* MODAL HEADER - Title and close button */}
          <div className="modal-header">
            {/* Modal title - id matches aria-labelledby above */}
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>

            {/* Close button - X in top right corner */}
            <button
              type="button"
              className="modal-close-button"
              onClick={onClose}
              // aria-label for screen readers since button only contains ×
              aria-label={t("modal.closeButton")}
            >
              {/* × is the HTML entity for multiplication sign - looks like X */}
              &times;
            </button>
          </div>

          {/* MODAL BODY - The flexible content area */}
          <div className="modal-body">
            {/* This is where the magic happens! */}
            {/* {children} renders whatever content was passed between <Modal></Modal> */}
            {/* This makes our modal reusable - it can contain forms, text, images, etc. */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOW TO USE THIS MODAL IN OTHER COMPONENTS:
// ═══════════════════════════════════════════════════════════════

// Example usage in your parent component (like ProjectBrowser):
//
// import { useState } from "react";
// import { Modal } from "./path/to/Modal";
//
// function MyComponent() {
//   // State to control modal visibility
//   const [isModalOpen, setIsModalOpen] = useState(false);
//
//   return (
//     <div>
//       {/* Button to open modal */}
//       <button onClick={() => setIsModalOpen(true)}>
//         Open Modal
//       </button>
//
//       {/* The modal component */}
//       <Modal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         title="My Modal Title"
//       >
//         {/* Everything between these tags becomes "children" */}
//         <p>This is the modal content!</p>
//         <form>
//           <input type="text" placeholder="Enter something..." />
//           <button type="submit">Submit</button>
//         </form>
//       </Modal>
//     </div>
//   );
// }

// ═══════════════════════════════════════════════════════════════
// KEY REACT CONCEPTS DEMONSTRATED HERE:
// ═══════════════════════════════════════════════════════════════

// 1. PROPS - How components receive data from parents
// 2. TYPESCRIPT INTERFACES - Defining component contracts
// 3. CONDITIONAL RENDERING - Showing/hiding based on state
// 4. EVENT HANDLING - Responding to user interactions
// 5. USEEFFECT - Managing side effects and cleanup
// 6. COMPONENT COMPOSITION - Using children for flexibility
// 7. ACCESSIBILITY - Making components usable for everyone
// 8. CONTROLLED COMPONENTS - Parent controls the state
// 9. EVENT DELEGATION - Handling events efficiently
// 10. LIFECYCLE MANAGEMENT - Adding/removing event listeners properly
