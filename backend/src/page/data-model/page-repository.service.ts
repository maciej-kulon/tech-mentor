import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PageEntity } from './page.schema';
import { IPage } from '@/page/interfaces/page.interface';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';
import { LoggerService } from '@/logger/logger.service';

/**
 * Repository service for Page data access operations.
 * Handles all database interactions for pages including CRUD operations
 * and specialized queries for finding pages by CAD document or other criteria.
 */
@Injectable()
export class PageRepositoryService {
  constructor(
    @InjectModel(PageEntity.name) private pageModel: Model<PageEntity>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new page in the database.
   * @param page - The page data without ID
   * @returns Promise resolving to the created page with timestamps, or null if creation fails
   */
  public async create(page: Omit<IPage, 'id'>): Promise<(IPage & ITimestamps) | null> {
    const createdPage = await this.pageModel.create(page);
    this.logger.log('Page created', createdPage);
    return this.toPageInterface(createdPage);
  }

  /**
   * Finds a page by its unique ID.
   * @param id - The unique identifier of the page
   * @returns Promise resolving to the page with timestamps, or null if not found
   */
  public async findById(id: string): Promise<(IPage & ITimestamps) | null> {
    const page = await this.pageModel.findById(id);
    if (!page) {
      return null;
    }
    return this.toPageInterface(page);
  }

  /**
   * Updates an existing page by ID.
   * @param id - The unique identifier of the page to update
   * @param page - The updated page data
   * @returns Promise resolving to the updated page with timestamps, or null if not found
   */
  public async update(id: string, page: IPage): Promise<(IPage & ITimestamps) | null> {
    const updatedPage = await this.pageModel.findByIdAndUpdate(id, page, {
      new: true,
    });
    if (!updatedPage) {
      return null;
    }
    return this.toPageInterface(updatedPage);
  }

  /**
   * Deletes a page by its unique ID.
   * @param id - The unique identifier of the page to delete
   * @returns Promise resolving to true if deletion was successful, false otherwise
   */
  public async delete(id: string): Promise<boolean> {
    const result = await this.pageModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Finds all pages belonging to a specific CAD document.
   * @param cadDocumentId - The ID of the CAD document to find pages for
   * @returns Promise resolving to an array of pages with timestamps, ordered by page number
   */
  public async findByCADDocumentId(cadDocumentId: string): Promise<(IPage & ITimestamps)[]> {
    const pages = await this.pageModel.find({ cadDocumentId }).sort({ pageNumber: 1 });
    return pages.map((page) => this.toPageInterface(page));
  }

  /**
   * Finds pages by content type.
   * @param contentType - The content type to search for
   * @returns Promise resolving to an array of pages with timestamps
   */
  public async findByContentType(contentType: string): Promise<(IPage & ITimestamps)[]> {
    const pages = await this.pageModel.find({ contentType });
    return pages.map((page) => this.toPageInterface(page));
  }

  /**
   * Finds the highest page number for a given CAD document.
   * @param cadDocumentId - The ID of the CAD document
   * @returns Promise resolving to the highest page number, or 0 if no pages exist
   */
  public async findMaxPageNumber(cadDocumentId: string): Promise<number> {
    const result = await this.pageModel
      .findOne({ cadDocumentId })
      .sort({ pageNumber: -1 })
      .select('pageNumber');
    return result?.pageNumber || 0;
  }

  /**
   * Transforms a page entity from MongoDB to the interface format.
   * @param page - The page entity from MongoDB
   * @returns The transformed page interface with timestamps
   */
  private toPageInterface(page: PageEntity): IPage & ITimestamps {
    return {
      id: page._id.toString(),
      name: page.name,
      description: page.description,
      cadDocumentId: page.cadDocumentId,
      pageNumber: page.pageNumber,
      contentType: page.contentType,
      notes: page.notes,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }
}
