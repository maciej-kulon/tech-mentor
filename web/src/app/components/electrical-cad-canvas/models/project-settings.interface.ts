import { PaperFormat } from "../interfaces/paper-format.interface";

/**
 * Represents project-wide settings that apply to all pages
 */
export interface ProjectSettings {
  /** Default paper format for new pages */
  defaultPaperFormat: PaperFormat;

  /** Measurement units used in the project */
  units: string;

  /** Default background color for new pages */
  defaultBackgroundColor: string;

  /** Default grid size for new pages */
  defaultGridSize: {
    rows: number;
    columns: number;
  };
}
