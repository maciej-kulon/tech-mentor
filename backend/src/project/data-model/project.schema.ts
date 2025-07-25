import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ProjectStatus } from '../enums/project-status.enum';
import { Types } from 'mongoose';

@Schema({
  collection: 'projects',
  timestamps: true,
  _id: true,
})
/**
 * Represents a Project entity stored in the 'projects' collection.
 * Includes metadata, ownership, and classification details.
 */
export class ProjectEntity {
  /**
   * The unique identifier for the project (MongoDB ObjectId).
   */
  public _id: Types.ObjectId;

  /**
   * The date and time when the project was created.
   */
  public createdAt: Date;

  /**
   * The date and time when the project was last updated.
   */
  public updatedAt: Date;

  /**
   * The name of the project.
   */
  @Prop({ required: true })
  public name: string;

  /**
   * Description of the project.
   */
  @Prop({ required: false })
  public description: string;

  /**
   * The user ID of the owner of the project.
   */
  @Prop({ required: true })
  public ownerId: string;

  /**
   * The current status of the project (e.g., active, completed).
   */
  @Prop({ required: true, enum: ProjectStatus })
  public status: ProjectStatus;

  /**
   * Field which is a map of userId to the modified date, it uses mongo map and type mixed
   */
  @Prop({ type: Types.Map, of: Date })
  public modifiedBy: Map<string, Date>;
}

export const ProjectSchema = SchemaFactory.createForClass(ProjectEntity);
