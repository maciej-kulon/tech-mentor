import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for creating a new CAD Document.
 * Contains validation rules for all required fields when creating a document.
 */
export class CreateCADDocumentRequestDto {
  /**
   * The name of the CAD document.
   * Must be a non-empty string.
   */
  @IsNotEmpty()
  @IsString()
  public name: string;

  /**
   * Description of the CAD document content and purpose.
   * Must be a non-empty string.
   */
  @IsNotEmpty()
  @IsString()
  public description: string;

  /**
   * The project ID that this document belongs to.
   * Must be a valid non-empty string referencing an existing project.
   */
  @IsNotEmpty()
  @IsString()
  public projectId: string;

  /**
   * Location description where this document belongs or is used.
   * Must be a non-empty string.
   */
  @IsNotEmpty()
  @IsString()
  public location: string;

  /**
   * Version of the document for tracking revisions.
   * Must be a non-empty string.
   */
  @IsNotEmpty()
  @IsString()
  public version: string;
}
