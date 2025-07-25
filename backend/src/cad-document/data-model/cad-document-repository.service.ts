import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CADDocumentEntity } from './cad-document.schema';
import { ICADDocument } from '@/cad-document/interfaces/cad-document.interface';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';
import { LoggerService } from '@/logger/logger.service';

/**
 * Repository service for CAD Document data access operations.
 * Handles all database interactions for CAD documents including CRUD operations
 * and specialized queries for finding documents by project or other criteria.
 */
@Injectable()
export class CADDocumentRepositoryService {
  constructor(
    @InjectModel(CADDocumentEntity.name) private cadDocumentModel: Model<CADDocumentEntity>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new CAD document in the database.
   * @param cadDocument - The CAD document data without ID
   * @returns Promise resolving to the created CAD document with timestamps, or null if creation fails
   */
  public async create(
    cadDocument: Omit<ICADDocument, 'id'>,
  ): Promise<(ICADDocument & ITimestamps) | null> {
    const createdCADDocument = await this.cadDocumentModel.create(cadDocument);
    this.logger.log('CAD Document created', createdCADDocument);
    return this.toCADDocumentInterface(createdCADDocument);
  }

  /**
   * Finds a CAD document by its unique ID.
   * @param id - The unique identifier of the CAD document
   * @returns Promise resolving to the CAD document with timestamps, or null if not found
   */
  public async findById(id: string): Promise<(ICADDocument & ITimestamps) | null> {
    const cadDocument = await this.cadDocumentModel.findById(id);
    if (!cadDocument) {
      return null;
    }
    return this.toCADDocumentInterface(cadDocument);
  }

  /**
   * Updates an existing CAD document by ID.
   * @param id - The unique identifier of the CAD document to update
   * @param cadDocument - The updated CAD document data
   * @returns Promise resolving to the updated CAD document with timestamps, or null if not found
   */
  public async update(
    id: string,
    cadDocument: ICADDocument,
  ): Promise<(ICADDocument & ITimestamps) | null> {
    const updatedCADDocument = await this.cadDocumentModel.findByIdAndUpdate(id, cadDocument, {
      new: true,
    });
    if (!updatedCADDocument) {
      return null;
    }
    return this.toCADDocumentInterface(updatedCADDocument);
  }

  /**
   * Deletes a CAD document by ID.
   * @param id - The unique identifier of the CAD document to delete
   * @returns Promise resolving to the deleted CAD document with timestamps, or null if not found
   */
  public async delete(id: string): Promise<(ICADDocument & ITimestamps) | null> {
    const deletedCADDocument = await this.cadDocumentModel.findByIdAndDelete(id);
    if (!deletedCADDocument) {
      return null;
    }
    return this.toCADDocumentInterface(deletedCADDocument);
  }

  /**
   * Finds all CAD documents belonging to a specific project.
   * @param projectId - The ID of the project to find documents for
   * @returns Promise resolving to an array of CAD documents with timestamps
   */
  public async findByProjectId(projectId: string): Promise<(ICADDocument & ITimestamps)[]> {
    const cadDocuments = await this.cadDocumentModel.find({ projectId });
    return cadDocuments.map((cadDocument) => this.toCADDocumentInterface(cadDocument));
  }

  /**
   * Finds CAD documents by location string (partial match).
   * @param location - The location string to search for
   * @returns Promise resolving to an array of CAD documents with timestamps
   */
  public async findByLocation(location: string): Promise<(ICADDocument & ITimestamps)[]> {
    const cadDocuments = await this.cadDocumentModel.find({
      location: { $regex: location, $options: 'i' },
    });
    return cadDocuments.map((cadDocument) => this.toCADDocumentInterface(cadDocument));
  }

  /**
   * Transforms a CAD document entity from MongoDB to the interface format.
   * @param cadDocument - The CAD document entity from MongoDB
   * @returns The transformed CAD document interface with timestamps
   */
  private toCADDocumentInterface(cadDocument: CADDocumentEntity): ICADDocument & ITimestamps {
    return {
      id: cadDocument._id.toString(),
      name: cadDocument.name,
      description: cadDocument.description,
      projectId: cadDocument.projectId,
      location: cadDocument.location,
      version: cadDocument.version,
      createdAt: cadDocument.createdAt,
      updatedAt: cadDocument.updatedAt,
    };
  }
}
