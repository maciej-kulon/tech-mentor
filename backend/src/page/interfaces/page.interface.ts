/**
 * Interface representing a Page entity.
 * Used for individual pages within CAD documents for technical documentation.
 */
export interface IPage {
  /**
   * The unique identifier for the page.
   */
  id: string;

  /**
   * The name of the page.
   */
  name: string;

  /**
   * Description of the page content and purpose.
   */
  description: string;

  /**
   * The CAD document ID that this page belongs to.
   * Each page can only belong to one CAD document.
   */
  cadDocumentId: string;

  /**
   * The page number or order within the document.
   * Used for organizing pages in a logical sequence.
   */
  pageNumber: number;

  /**
   * Content type of the page (e.g., 'schematic', 'diagram', 'text', 'mixed').
   * Helps categorize the type of content stored on this page.
   */
  contentType: string;

  /**
   * Notes or additional information about the page.
   * Optional field for user-defined notes and comments.
   */
  notes?: string;
}
