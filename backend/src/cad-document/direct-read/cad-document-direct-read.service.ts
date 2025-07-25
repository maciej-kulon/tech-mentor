import { Injectable } from '@nestjs/common';
import { CADDocumentRepositoryService } from '../data-model/cad-document-repository.service';
import { ICADDocument } from '@/cad-document/interfaces/cad-document.interface';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

/**
 * Service for direct read operations on CAD documents.
 * Provides a clean interface for reading CAD document data without business logic.
 * Acts as a thin layer over the repository service for read operations.
 */
@Injectable()
export class CADDocumentDirectReadService {
  constructor(private readonly cadDocumentRepository: CADDocumentRepositoryService) {}

  /**
   * Finds a CAD document by its unique ID.
   * @param id - The unique identifier of the CAD document
   * @returns Promise resolving to the CAD document with timestamps, or null if not found
   */
  public async findById(id: string): Promise<(ICADDocument & ITimestamps) | null> {
    return this.cadDocumentRepository.findById(id);
  }

  /**
   * Finds all CAD documents belonging to a specific project.
   * @param projectId - The ID of the project to find documents for
   * @returns Promise resolving to an array of CAD documents with timestamps
   */
  public findByProjectId(projectId: string): Promise<(ICADDocument & ITimestamps)[]> {
    return this.cadDocumentRepository.findByProjectId(projectId);
  }

  /**
   * Finds CAD documents by location string (partial match).
   * @param location - The location string to search for
   * @returns Promise resolving to an array of CAD documents with timestamps
   */
  public findByLocation(location: string): Promise<(ICADDocument & ITimestamps)[]> {
    return this.cadDocumentRepository.findByLocation(location);
  }
}
