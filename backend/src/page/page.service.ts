import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IPage } from './interfaces/page.interface';
import { PageDirectReadService } from './direct-read/page-direct-read.service';
import { PageDirectWriteService } from './direct-write/page-direct-write.service';
import { CreatePageRequestDto } from './dto/create-page.dto';
import { PageResponseDto } from './dto/page-response.dto';
import { LoggerService } from '@/logger/logger.service';

/**
 * Main business logic service for Pages.
 * Orchestrates read and write operations while providing error handling and logging.
 * Acts as the primary interface for page operations in the application.
 */
@Injectable()
export class PageService {
  constructor(
    private readonly pageDirectWriteService: PageDirectWriteService,
    private readonly pageDirectReadService: PageDirectReadService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new page.
   * @param page - The page creation data
   * @returns Promise resolving to the created page response DTO
   * @throws InternalServerErrorException if creation fails
   */
  public async create(page: CreatePageRequestDto): Promise<PageResponseDto> {
    const createdPage = await this.pageDirectWriteService.create(page);
    this.logger.log('Page created', createdPage);
    if (!createdPage) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
    return new PageResponseDto(createdPage);
  }

  /**
   * Finds a page by its unique ID.
   * @param id - The unique identifier of the page
   * @returns Promise resolving to the page response DTO, or null if not found
   */
  public async findById(id: string): Promise<PageResponseDto | null> {
    const page = await this.pageDirectReadService.findById(id);
    if (!page) {
      return null;
    }
    return new PageResponseDto(page);
  }

  /**
   * Updates an existing page by ID.
   * @param id - The unique identifier of the page to update
   * @param page - The updated page data
   * @returns Promise resolving to the updated page response DTO
   */
  public async update(id: string, page: IPage): Promise<PageResponseDto> {
    const updatedPage = await this.pageDirectWriteService.update(id, page);
    this.logger.log('Page updated', updatedPage);
    return new PageResponseDto(updatedPage);
  }

  /**
   * Deletes a page by its unique ID.
   * @param id - The unique identifier of the page to delete
   * @returns Promise resolving to true if deletion was successful
   */
  public async delete(id: string): Promise<boolean> {
    const deleted = await this.pageDirectWriteService.delete(id);
    this.logger.log('Page deleted', { id });
    return deleted;
  }

  /**
   * Finds all pages belonging to a specific CAD document.
   * @param cadDocumentId - The ID of the CAD document to find pages for
   * @returns Promise resolving to an array of page response DTOs, ordered by page number
   */
  public async findByCADDocumentId(cadDocumentId: string): Promise<PageResponseDto[]> {
    const pages = await this.pageDirectReadService.findByCADDocumentId(cadDocumentId);
    return pages.map((page) => new PageResponseDto(page));
  }

  /**
   * Finds pages by content type.
   * @param contentType - The content type to search for
   * @returns Promise resolving to an array of page response DTOs
   */
  public async findByContentType(contentType: string): Promise<PageResponseDto[]> {
    const pages = await this.pageDirectReadService.findByContentType(contentType);
    return pages.map((page) => new PageResponseDto(page));
  }

  /**
   * Finds the highest page number for a given CAD document.
   * Useful for determining the next page number when creating new pages.
   * @param cadDocumentId - The ID of the CAD document
   * @returns Promise resolving to the highest page number, or 0 if no pages exist
   */
  public async findMaxPageNumber(cadDocumentId: string): Promise<number> {
    return this.pageDirectReadService.findMaxPageNumber(cadDocumentId);
  }
}
