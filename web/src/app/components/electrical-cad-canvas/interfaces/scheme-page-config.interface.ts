/**
 * Configuration interface for the electrical scheme page
 * Defines the grid structure of the page
 */
export interface SchemePageConfig {
  /** Number of rows in the grid */
  rows: number;
  /** Number of columns in the grid */
  columns: number;
  /** Size in pixels for row and column labels */
  labelSize?: number;
}
