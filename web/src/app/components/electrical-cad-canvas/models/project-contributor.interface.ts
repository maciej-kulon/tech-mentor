/**
 * Represents the possible permission levels for a project contributor
 */
export type ProjectPermission = 'view' | 'edit' | 'comment' | 'admin';

/**
 * Represents a contributor to the project with their permissions
 */
export interface ProjectContributor {
  /** The name of the contributor */
  name: string;

  /** The email address of the contributor */
  email: string;

  /** The permission level of the contributor */
  permission: ProjectPermission;
}
