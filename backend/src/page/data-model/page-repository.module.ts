import { Module } from '@nestjs/common';
import { PageRepositoryService } from './page-repository.service';
import { PageEntity, PageSchema } from './page.schema';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Module for Page data model layer.
 * Provides database access and repository services for pages.
 * Registers the page schema with Mongoose and exports the repository service.
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: PageEntity.name, schema: PageSchema }])],
  providers: [PageRepositoryService],
  exports: [PageRepositoryService],
})
export class PageRepositoryModule {}
