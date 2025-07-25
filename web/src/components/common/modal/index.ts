// ═══════════════════════════════════════════════════════════════
// MODAL COMPONENT INDEX - Export the Modal component for easy importing
// ═══════════════════════════════════════════════════════════════

// Export the Modal component so other files can import it easily
// This allows us to write: import { Modal } from './components/common/modal'
// Instead of: import { Modal } from './components/common/modal/Modal'
export { Modal } from "./Modal";

// ═══════════════════════════════════════════════════════════════
// WHY WE CREATE INDEX FILES:
// ═══════════════════════════════════════════════════════════════

// 1. CLEANER IMPORTS - Shorter import paths in other components
// 2. ENCAPSULATION - Hide internal file structure from consumers
// 3. FLEXIBILITY - Can export multiple related components from one folder
// 4. CONVENTION - Standard practice in React/TypeScript projects
// 5. FUTURE-PROOFING - Easy to reorganize files without breaking imports

// Example: If we later add ModalHeader, ModalBody, ModalFooter components,
// we can export them all from this index file:
// export { Modal } from './Modal';
// export { ModalHeader } from './ModalHeader';
// export { ModalBody } from './ModalBody';
// export { ModalFooter } from './ModalFooter';
