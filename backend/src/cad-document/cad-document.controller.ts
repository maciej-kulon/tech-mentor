import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CADDocumentService } from './cad-document.service';
import { ICADDocument } from './interfaces/cad-document.interface';
import { AuthGuard } from '@nestjs/passport';
import { CreateCADDocumentRequestDto } from './dto/create-cad-document.dto';
import { LoggerService } from '@/logger/logger.service';

/**
 * Controller for CAD Document API endpoints.
 * Handles HTTP requests for CAD document operations including CRUD operations
 * and specialized queries for finding documents by project or location.
 * All endpoints require JWT authentication.
 */
@Controller('documents')
export class CADDocumentController {
  constructor(
    private readonly cadDocumentService: CADDocumentService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new CAD document.
   * @param cadDocument - The CAD document creation data from request body
   * @returns Promise resolving to the created CAD document
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('/v1')
  public async create(@Body() cadDocument: CreateCADDocumentRequestDto): Promise<ICADDocument> {
    this.logger.log('Creating CAD document', cadDocument);
    return await this.cadDocumentService.create(cadDocument);
  }

  /**
   * Finds a CAD document by its unique ID.
   * @param id - The unique identifier of the CAD document
   * @returns Promise resolving to the CAD document
   * @throws NotFoundException if the CAD document is not found
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/:id/v1')
  public async findById(@Param('id') id: string): Promise<ICADDocument | null> {
    const cadDocument = await this.cadDocumentService.findById(id);
    if (!cadDocument) {
      throw new NotFoundException(`CAD Document with id: ${id} not found`);
    }
    return cadDocument;
  }

  /**
   * Updates an existing CAD document by ID.
   * @param id - The unique identifier of the CAD document to update
   * @param cadDocument - The updated CAD document data from request body
   * @returns Promise resolving to the updated CAD document
   * @throws NotFoundException if the CAD document is not found
   */
  @UseGuards(AuthGuard('jwt'))
  @Put('/:id/v1')
  public async update(
    @Param('id') id: string,
    @Body() cadDocument: ICADDocument,
  ): Promise<ICADDocument | null> {
    const updatedCADDocument = await this.cadDocumentService.update(id, cadDocument);
    if (!updatedCADDocument) {
      throw new NotFoundException(`CAD Document with id: ${id} not found`);
    }
    return updatedCADDocument;
  }

  /**
   * Deletes a CAD document by ID.
   * @param id - The unique identifier of the CAD document to delete
   * @returns Promise resolving to the deleted CAD document
   * @throws NotFoundException if the CAD document is not found
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('/:id/v1')
  public async delete(@Param('id') id: string): Promise<ICADDocument | null> {
    const deletedCADDocument = await this.cadDocumentService.delete(id);
    if (!deletedCADDocument) {
      throw new NotFoundException(`CAD Document with id: ${id} not found`);
    }
    return deletedCADDocument;
  }

  /**
   * Finds all CAD documents belonging to a specific project.
   * @param projectId - The ID of the project to find documents for
   * @returns Promise resolving to an array of CAD documents
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/projects/:projectId/v1')
  public async findByProjectId(@Param('projectId') projectId: string): Promise<ICADDocument[]> {
    return await this.cadDocumentService.findByProjectId(projectId);
  }

  /**
   * Finds CAD documents by location string (partial match).
   * @param location - The location string to search for
   * @returns Promise resolving to an array of CAD documents
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/locations/:location/v1')
  public async findByLocation(@Param('location') location: string): Promise<ICADDocument[]> {
    return await this.cadDocumentService.findByLocation(location);
  }
}
