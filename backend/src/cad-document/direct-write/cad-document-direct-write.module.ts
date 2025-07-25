import { Module } from '@nestjs/common';
import { CADDocumentDirectWriteService } from './cad-document-direct-write.service';
import { CADDocumentRepositoryModule } from '../data-model/cad-document-repository.module';

/**
 * Module for CAD Document direct write operations.
 * Provides services for creating, updating, and deleting CAD documents.
 * Imports the repository module to access data layer services.
 */
@Module({
  imports: [CADDocumentRepositoryModule],
  providers: [CADDocumentDirectWriteService],
  exports: [CADDocumentDirectWriteService],
})
export class CADDocumentDirectWriteModule {}
