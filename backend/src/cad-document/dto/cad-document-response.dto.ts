import { ITimestamps } from '@/common-interfaces/timestamps.interface';
import { ICADDocument } from '@/cad-document/interfaces/cad-document.interface';

/**
 * Data Transfer Object for CAD Document responses.
 * Used to transform internal CAD document data for API responses.
 * Implements both ICADDocument and ITimestamps interfaces.
 */
export class CADDocumentResponseDto implements ICADDocument, ITimestamps {
  /**
   * The unique identifier for the CAD document.
   */
  public id: string;

  /**
   * The name of the CAD document.
   */
  public name: string;

  /**
   * Description of the CAD document content and purpose.
   */
  public description: string;

  /**
   * The project ID that this document belongs to.
   */
  public projectId: string;

  /**
   * Location description where this document belongs or is used.
   */
  public location: string;

  /**
   * Version of the document for tracking revisions.
   */
  public version: string;

  /**
   * The date and time when the document was created.
   */
  public createdAt: Date;

  /**
   * The date and time when the document was last updated.
   */
  public updatedAt: Date;

  /**
   * Constructor to transform a CAD document entity into a response DTO.
   * @param cadDocument - The CAD document entity with timestamps
   */
  constructor(cadDocument: ICADDocument & ITimestamps) {
    this.id = cadDocument.id;
    this.name = cadDocument.name;
    this.description = cadDocument.description;
    this.projectId = cadDocument.projectId;
    this.location = cadDocument.location;
    this.version = cadDocument.version;
    this.createdAt = cadDocument.createdAt;
    this.updatedAt = cadDocument.updatedAt;
  }
}
