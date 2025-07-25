import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CADDocumentRepositoryService } from '@/cad-document/data-model/cad-document-repository.service';
import { ICADDocument } from '@/cad-document/interfaces/cad-document.interface';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

/**
 * Service for direct write operations on CAD documents.
 * Provides a clean interface for creating, updating, and deleting CAD documents.
 * Acts as a thin layer over the repository service with basic error handling.
 */
@Injectable()
export class CADDocumentDirectWriteService {
  constructor(private readonly cadDocumentRepository: CADDocumentRepositoryService) {}

  /**
   * Creates a new CAD document.
   * @param cadDocument - The CAD document data without ID
   * @returns Promise resolving to the created CAD document with timestamps
   * @throws InternalServerErrorException if creation fails
   */
  public async create(cadDocument: Omit<ICADDocument, 'id'>): Promise<ICADDocument & ITimestamps> {
    const createdCADDocument = await this.cadDocumentRepository.create(cadDocument);
    if (!createdCADDocument) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
    return createdCADDocument;
  }

  /**
   * Updates an existing CAD document by ID.
   * @param id - The unique identifier of the CAD document to update
   * @param cadDocument - The updated CAD document data
   * @returns Promise resolving to the updated CAD document with timestamps
   * @throws NotFoundException if the CAD document is not found
   */
  public async update(id: string, cadDocument: ICADDocument): Promise<ICADDocument & ITimestamps> {
    const updatedCADDocument = await this.cadDocumentRepository.update(id, cadDocument);
    if (!updatedCADDocument) {
      throw new NotFoundException('CAD Document not found');
    }
    return updatedCADDocument;
  }

  /**
   * Deletes a CAD document by ID.
   * @param id - The unique identifier of the CAD document to delete
   * @returns Promise resolving to the deleted CAD document with timestamps
   * @throws NotFoundException if the CAD document is not found
   */
  public async delete(id: string): Promise<ICADDocument & ITimestamps> {
    const deletedCADDocument = await this.cadDocumentRepository.delete(id);
    if (!deletedCADDocument) {
      throw new NotFoundException('CAD Document not found');
    }
    return deletedCADDocument;
  }
}
