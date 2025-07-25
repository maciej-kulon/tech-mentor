import { Injectable } from '@nestjs/common';
import { PageRepositoryService } from '@/page/data-model/page-repository.service';
import { IPage } from '@/page/interfaces/page.interface';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

/**
 * Service for direct read operations on pages.
 * Provides a clean interface for reading page data without business logic.
 * Acts as a thin layer over the repository service for read operations.
 */
@Injectable()
export class PageDirectReadService {
  constructor(private readonly pageRepository: PageRepositoryService) {}

  /**
   * Finds a page by its unique ID.
   * @param id - The unique identifier of the page
   * @returns Promise resolving to the page with timestamps, or null if not found
   */
  public async findById(id: string): Promise<(IPage & ITimestamps) | null> {
    return this.pageRepository.findById(id);
  }

  /**
   * Finds all pages belonging to a specific CAD document.
   * @param cadDocumentId - The ID of the CAD document to find pages for
   * @returns Promise resolving to an array of pages with timestamps, ordered by page number
   */
  public findByCADDocumentId(cadDocumentId: string): Promise<(IPage & ITimestamps)[]> {
    return this.pageRepository.findByCADDocumentId(cadDocumentId);
  }

  /**
   * Finds pages by content type.
   * @param contentType - The content type to search for
   * @returns Promise resolving to an array of pages with timestamps
   */
  public findByContentType(contentType: string): Promise<(IPage & ITimestamps)[]> {
    return this.pageRepository.findByContentType(contentType);
  }

  /**
   * Finds the highest page number for a given CAD document.
   * @param cadDocumentId - The ID of the CAD document
   * @returns Promise resolving to the highest page number, or 0 if no pages exist
   */
  public findMaxPageNumber(cadDocumentId: string): Promise<number> {
    return this.pageRepository.findMaxPageNumber(cadDocumentId);
  }
}
