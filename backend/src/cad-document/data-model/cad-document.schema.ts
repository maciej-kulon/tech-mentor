import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  collection: 'cad_documents',
  timestamps: true,
  _id: true,
})
/**
 * Represents a CAD Document entity stored in the 'cad_documents' collection.
 * Used for maintenance documents with electrical schemes and technical documentation.
 * Each document belongs to a single project and contains versioned technical information.
 */
export class CADDocumentEntity {
  /**
   * The unique identifier for the CAD document (MongoDB ObjectId).
   */
  public _id: Types.ObjectId;

  /**
   * The date and time when the document was created.
   */
  public createdAt: Date;

  /**
   * The date and time when the document was last updated.
   */
  public updatedAt: Date;

  /**
   * The name of the CAD document.
   */
  @Prop({ required: true })
  public name: string;

  /**
   * Description of the CAD document content and purpose.
   */
  @Prop({ required: true })
  public description: string;

  /**
   * The project ID that this document belongs to.
   * References a project in the projects collection.
   */
  @Prop({ required: true })
  public projectId: string;

  /**
   * Location description where this document belongs or is used.
   * User-defined string to help locate the physical or logical place.
   */
  @Prop({ required: true })
  public location: string;

  /**
   * Version of the document for tracking revisions.
   */
  @Prop({ required: true })
  public version: string;
}

export const CADDocumentSchema = SchemaFactory.createForClass(CADDocumentEntity);
