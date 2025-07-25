import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PageRepositoryService } from '@/page/data-model/page-repository.service';
import { IPage } from '@/page/interfaces/page.interface';
import { ITimestamps } from '@/common-interfaces/timestamps.interface';

/**
 * Service for direct write operations on pages.
 * Provides a clean interface for creating, updating, and deleting pages.
 * Acts as a thin layer over the repository service with basic error handling.
 */
@Injectable()
export class PageDirectWriteService {
  constructor(private readonly pageRepository: PageRepositoryService) {}

  /**
   * Creates a new page.
   * @param page - The page data without ID
   * @returns Promise resolving to the created page with timestamps
   * @throws InternalServerErrorException if creation fails
   */
  public async create(page: Omit<IPage, 'id'>): Promise<IPage & ITimestamps> {
    const createdPage = await this.pageRepository.create(page);
    if (!createdPage) {
      throw new InternalServerErrorException('Unexpected error occurred');
    }
    return createdPage;
  }

  /**
   * Updates an existing page by ID.
   * @param id - The unique identifier of the page to update
   * @param page - The updated page data
   * @returns Promise resolving to the updated page with timestamps
   * @throws NotFoundException if the page is not found
   * @throws InternalServerErrorException if update fails
   */
  public async update(id: string, page: IPage): Promise<IPage & ITimestamps> {
    const updatedPage = await this.pageRepository.update(id, page);
    if (!updatedPage) {
      throw new NotFoundException(`Page with id: ${id} not found`);
    }
    return updatedPage;
  }

  /**
   * Deletes a page by its unique ID.
   * @param id - The unique identifier of the page to delete
   * @returns Promise resolving to true if deletion was successful
   * @throws NotFoundException if the page is not found
   */
  public async delete(id: string): Promise<boolean> {
    const deleted = await this.pageRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Page with id: ${id} not found`);
    }
    return deleted;
  }
}
