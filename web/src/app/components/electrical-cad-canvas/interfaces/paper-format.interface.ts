/**
 * Supported paper formats for the electrical scheme
 */
export type PaperFormat = "A4" | "A3" | "A2" | "A1" | "A0";

/**
 * Page orientation options
 */
export type PageOrientation = "portrait" | "landscape";

/**
 * Interface representing paper dimensions
 */
export interface PaperDimensions {
  width: number;
  height: number;
}

/**
 * Interface for page metadata
 */
export interface PageMetadata {
  title: string;
  description: string;
  author: string;
  version: string;
  reviewedBy: string;
}

/**
 * Interface for page dates
 */
export interface PageDates {
  creationDate: Date;
  reviewDate?: Date;
  lastUpdateDate: Date;
}
