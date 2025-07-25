/**
 * Interface representing a CAD Document entity.
 * Used for maintenance documents with electrical schemes and technical documentation.
 */
export interface ICADDocument {
  /**
   * The unique identifier for the CAD document.
   */
  id: string;

  /**
   * The name of the CAD document.
   */
  name: string;

  /**
   * Description of the CAD document content and purpose.
   */
  description: string;

  /**
   * The project ID that this document belongs to.
   * Each document can only belong to one project.
   */
  projectId: string;

  /**
   * Location description where this document belongs or is used.
   * This is a user-defined string to help locate the physical or logical place.
   */
  location: string;

  /**
   * Version of the document for tracking revisions.
   */
  version: string;
}
