import { ITimestamps } from '@/common-interfaces/timestamps.interface';
import { IPage } from '@/page/interfaces/page.interface';

/**
 * Data Transfer Object for Page responses.
 * Used to transform internal page data for API responses.
 * Implements both IPage and ITimestamps interfaces.
 */
export class PageResponseDto implements IPage, ITimestamps {
  /**
   * The unique identifier for the page.
   */
  public id: string;

  /**
   * The name of the page.
   */
  public name: string;

  /**
   * Description of the page content and purpose.
   */
  public description: string;

  /**
   * The CAD document ID that this page belongs to.
   */
  public cadDocumentId: string;

  /**
   * The page number or order within the document.
   */
  public pageNumber: number;

  /**
   * Content type of the page.
   */
  public contentType: string;

  /**
   * Notes or additional information about the page.
   */
  public notes?: string;

  /**
   * The date and time when the page was created.
   */
  public createdAt: Date;

  /**
   * The date and time when the page was last updated.
   */
  public updatedAt: Date;

  /**
   * Constructor to transform a page entity into a response DTO.
   * @param page - The page entity with timestamps
   */
  constructor(page: IPage & ITimestamps) {
    this.id = page.id;
    this.name = page.name;
    this.description = page.description;
    this.cadDocumentId = page.cadDocumentId;
    this.pageNumber = page.pageNumber;
    this.contentType = page.contentType;
    this.notes = page.notes;
    this.createdAt = page.createdAt;
    this.updatedAt = page.updatedAt;
  }
}
