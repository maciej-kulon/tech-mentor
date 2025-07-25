import { Module } from '@nestjs/common';
import { PageDirectWriteService } from './page-direct-write.service';
import { PageRepositoryModule } from '../data-model/page-repository.module';

/**
 * Module for Page direct write operations.
 * Provides services for creating, updating, and deleting pages.
 * Imports the repository module to access data layer services.
 */
@Module({
  imports: [PageRepositoryModule],
  providers: [PageDirectWriteService],
  exports: [PageDirectWriteService],
})
export class PageDirectWriteModule {}
