/**
 * Represents the possible types of values that can be stored in project metadata
 */
export type ProjectMetadataValue = string | number | boolean | object;

/**
 * Represents a key-value store of project metadata
 * Keys are strings and values can be of type ProjectMetadataValue
 */
export type ProjectMetadata = Record<string, ProjectMetadataValue>;
