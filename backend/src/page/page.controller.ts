import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PageService } from './page.service';
import { IPage } from './interfaces/page.interface';
import { AuthGuard } from '@nestjs/passport';
import { CreatePageRequestDto } from './dto/create-page.dto';
import { LoggerService } from '@/logger/logger.service';

/**
 * Controller for Page API endpoints.
 * Handles HTTP requests for page operations including CRUD operations
 * and specialized queries for finding pages by CAD document or content type.
 * All endpoints require JWT authentication.
 */
@Controller('pages')
export class PageController {
  constructor(
    private readonly pageService: PageService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new page.
   * @param page - The page creation data from request body
   * @returns Promise resolving to the created page
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('/v1')
  public async create(@Body() page: CreatePageRequestDto): Promise<IPage> {
    this.logger.log('Creating page', page);
    return await this.pageService.create(page);
  }

  /**
   * Finds a page by its unique ID.
   * @param id - The unique identifier of the page
   * @returns Promise resolving to the page
   * @throws NotFoundException if the page is not found
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/:id/v1')
  public async findById(@Param('id') id: string): Promise<IPage | null> {
    const page = await this.pageService.findById(id);
    if (!page) {
      throw new NotFoundException(`Page with id: ${id} not found`);
    }
    return page;
  }

  /**
   * Updates an existing page by ID.
   * @param id - The unique identifier of the page to update
   * @param page - The updated page data from request body
   * @returns Promise resolving to the updated page
   * @throws NotFoundException if the page is not found
   */
  @UseGuards(AuthGuard('jwt'))
  @Put('/:id/v1')
  public async update(@Param('id') id: string, @Body() page: IPage): Promise<IPage | null> {
    const updatedPage = await this.pageService.update(id, page);
    if (!updatedPage) {
      throw new NotFoundException(`Page with id: ${id} not found`);
    }
    return updatedPage;
  }

  /**
   * Deletes a page by its unique ID.
   * @param id - The unique identifier of the page to delete
   * @returns Promise resolving to deletion confirmation
   * @throws NotFoundException if the page is not found
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('/:id/v1')
  public async delete(@Param('id') id: string): Promise<{ deleted: boolean }> {
    const deleted = await this.pageService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Page with id: ${id} not found`);
    }
    return { deleted };
  }

  /**
   * Finds all pages belonging to a specific CAD document.
   * @param cadDocumentId - The ID of the CAD document to find pages for
   * @returns Promise resolving to an array of pages, ordered by page number
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/by-cad-document/:cadDocumentId/v1')
  public async findByCADDocumentId(
    @Param('cadDocumentId') cadDocumentId: string,
  ): Promise<IPage[]> {
    this.logger.log('Finding pages by CAD document ID', { cadDocumentId });
    return await this.pageService.findByCADDocumentId(cadDocumentId);
  }

  /**
   * Finds pages by content type.
   * @param contentType - The content type to search for (query parameter)
   * @returns Promise resolving to an array of pages
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/by-content-type/v1')
  public async findByContentType(@Query('type') contentType: string): Promise<IPage[]> {
    if (!contentType) {
      throw new NotFoundException('Content type query parameter is required');
    }
    this.logger.log('Finding pages by content type', { contentType });
    return await this.pageService.findByContentType(contentType);
  }

  /**
   * Finds the highest page number for a given CAD document.
   * Useful for determining the next page number when creating new pages.
   * @param cadDocumentId - The ID of the CAD document
   * @returns Promise resolving to the maximum page number
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('/max-page-number/:cadDocumentId/v1')
  public async findMaxPageNumber(
    @Param('cadDocumentId') cadDocumentId: string,
  ): Promise<{ maxPageNumber: number }> {
    this.logger.log('Finding max page number for CAD document', { cadDocumentId });
    const maxPageNumber = await this.pageService.findMaxPageNumber(cadDocumentId);
    return { maxPageNumber };
  }
}
