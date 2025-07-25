import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICADDocument } from './interfaces/cad-document.interface';
import { CADDocumentDirectReadService } from './direct-read/cad-document-direct-read.service';
import { CADDocumentDirectWriteService } from './direct-write/cad-document-direct-write.service';
import { CreateCADDocumentRequestDto } from './dto/create-cad-document.dto';
import { CADDocumentResponseDto } from './dto/cad-document-response.dto';
import { LoggerService } from '@/logger/logger.service';

/**
 * Main business logic service for CAD Documents.
 * Orchestrates read and write operations while providing error handling and logging.
 * Acts as the primary interface for CAD document operations in the application.
 */
@Injectable()
export class CADDocumentService {
  constructor(
    private readonly cadDocumentDirectWriteService: CADDocumentDirectWriteService,
    private readonly cadDocumentDirectReadService: CADDocumentDirectReadService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new CAD document.
   * @param cadDocument - The CAD document creation data
   * @returns Promise resolving to the created CAD document response DTO
   * @throws InternalServerErrorException if creation fails
   */
  public async create(cadDocument: CreateCADDocumentRequestDto): Promise<CADDocumentResponseDto> {
    const createdCADDocument = await this.cadDocumentDirectWriteService.create(cadDocument);
    this.logger.log('CAD Document created', createdCADDocument);
    if (!createdCADDocument) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
    return new CADDocumentResponseDto(createdCADDocument);
  }

  /**
   * Finds a CAD document by its unique ID.
   * @param id - The unique identifier of the CAD document
   * @returns Promise resolving to the CAD document or null if not found
   * @throws InternalServerErrorException if an unexpected error occurs
   */
  public async findById(id: string): Promise<ICADDocument | null> {
    try {
      return await this.cadDocumentDirectReadService.findById(id);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  /**
   * Updates an existing CAD document by ID.
   * @param id - The unique identifier of the CAD document to update
   * @param cadDocument - The updated CAD document data
   * @returns Promise resolving to the updated CAD document or null if not found
   * @throws InternalServerErrorException if an unexpected error occurs
   */
  public async update(id: string, cadDocument: ICADDocument): Promise<ICADDocument | null> {
    try {
      return await this.cadDocumentDirectWriteService.update(id, cadDocument);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  /**
   * Deletes a CAD document by ID.
   * @param id - The unique identifier of the CAD document to delete
   * @returns Promise resolving to the deleted CAD document or null if not found
   * @throws InternalServerErrorException if an unexpected error occurs
   */
  public async delete(id: string): Promise<ICADDocument | null> {
    try {
      return await this.cadDocumentDirectWriteService.delete(id);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  /**
   * Finds all CAD documents belonging to a specific project.
   * @param projectId - The ID of the project to find documents for
   * @returns Promise resolving to an array of CAD documents
   * @throws InternalServerErrorException if an unexpected error occurs
   */
  public async findByProjectId(projectId: string): Promise<ICADDocument[]> {
    try {
      return await this.cadDocumentDirectReadService.findByProjectId(projectId);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  /**
   * Finds CAD documents by location string (partial match).
   * @param location - The location string to search for
   * @returns Promise resolving to an array of CAD documents
   * @throws InternalServerErrorException if an unexpected error occurs
   */
  public async findByLocation(location: string): Promise<ICADDocument[]> {
    try {
      return await this.cadDocumentDirectReadService.findByLocation(location);
    } catch (error) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }
}
