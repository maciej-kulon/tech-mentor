import { Module } from '@nestjs/common';
import { CADDocumentDirectReadService } from './cad-document-direct-read.service';
import { CADDocumentRepositoryModule } from '../data-model/cad-document-repository.module';

/**
 * Module for CAD Document direct read operations.
 * Provides services for reading CAD document data without business logic.
 * Imports the repository module to access data layer services.
 */
@Module({
  imports: [CADDocumentRepositoryModule],
  providers: [CADDocumentDirectReadService],
  exports: [CADDocumentDirectReadService],
})
export class CADDocumentDirectReadModule {}
