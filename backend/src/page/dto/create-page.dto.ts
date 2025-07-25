import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * Data Transfer Object for creating a new Page.
 * Contains validation rules for all required fields when creating a page.
 */
export class CreatePageRequestDto {
  /**
   * The name of the page.
   * Must be a non-empty string.
   */
  @IsNotEmpty()
  @IsString()
  public name: string;

  /**
   * Description of the page content and purpose.
   * Must be a non-empty string.
   */
  @IsNotEmpty()
  @IsString()
  public description: string;

  /**
   * The CAD document ID that this page belongs to.
   * Must be a valid non-empty string referencing an existing CAD document.
   */
  @IsNotEmpty()
  @IsString()
  public cadDocumentId: string;

  /**
   * The page number or order within the document.
   * Must be a valid number for organizing pages in sequence.
   */
  @IsNotEmpty()
  @IsNumber()
  public pageNumber: number;

  /**
   * Content type of the page (e.g., 'schematic', 'diagram', 'text', 'mixed').
   * Must be a non-empty string.
   */
  @IsNotEmpty()
  @IsString()
  public contentType: string;

  /**
   * Notes or additional information about the page.
   * Optional field for user-defined notes and comments.
   */
  @IsOptional()
  @IsString()
  public notes?: string;
}
