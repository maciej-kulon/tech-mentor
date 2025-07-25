import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({
  collection: 'pages',
  timestamps: true,
  _id: true,
})
/**
 * Represents a Page entity stored in the 'pages' collection.
 * Used for individual pages within CAD documents for technical documentation.
 * Each page belongs to a single CAD document and contains ordered content.
 */
export class PageEntity {
  /**
   * The unique identifier for the page (MongoDB ObjectId).
   */
  public _id: Types.ObjectId;

  /**
   * The date and time when the page was created.
   */
  public createdAt: Date;

  /**
   * The date and time when the page was last updated.
   */
  public updatedAt: Date;

  /**
   * The name of the page.
   */
  @Prop({ required: true })
  public name: string;

  /**
   * Description of the page content and purpose.
   */
  @Prop({ required: true })
  public description: string;

  /**
   * The CAD document ID that this page belongs to.
   * References a CAD document in the cad_documents collection.
   */
  @Prop({ required: true })
  public cadDocumentId: string;

  /**
   * The page number or order within the document.
   * Used for organizing pages in a logical sequence.
   */
  @Prop({ required: true })
  public pageNumber: number;

  /**
   * Content type of the page (e.g., 'schematic', 'diagram', 'text', 'mixed').
   * Helps categorize the type of content stored on this page.
   */
  @Prop({ required: true })
  public contentType: string;

  /**
   * Notes or additional information about the page.
   * Optional field for user-defined notes and comments.
   */
  @Prop({ required: false })
  public notes?: string;
}

export const PageSchema = SchemaFactory.createForClass(PageEntity);
