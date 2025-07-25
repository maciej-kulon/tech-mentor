import { Module } from '@nestjs/common';
import { PageDirectReadService } from './page-direct-read.service';
import { PageRepositoryModule } from '../data-model/page-repository.module';

/**
 * Module for Page direct read operations.
 * Provides services for reading page data without business logic.
 * Imports the repository module to access data layer services.
 */
@Module({
  imports: [PageRepositoryModule],
  providers: [PageDirectReadService],
  exports: [PageDirectReadService],
})
export class PageDirectReadModule {}
