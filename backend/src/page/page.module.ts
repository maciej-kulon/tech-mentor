import { Module } from '@nestjs/common';
import { PageDirectReadModule } from './direct-read/page-direct-read.module';
import { PageDirectWriteModule } from './direct-write/page-direct-write.module';
import { PageService } from './page.service';
import { PageController } from './page.controller';

/**
 * Main module for Page functionality.
 * Orchestrates all page-related services, controllers, and dependencies.
 * Provides a complete page management system including CRUD operations
 * and specialized queries for finding pages by CAD document or content type.
 */
@Module({
  imports: [PageDirectReadModule, PageDirectWriteModule],
  controllers: [PageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
