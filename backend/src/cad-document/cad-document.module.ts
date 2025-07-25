import { Module } from '@nestjs/common';
import { CADDocumentDirectReadModule } from './direct-read/cad-document-direct-read.module';
import { CADDocumentDirectWriteModule } from './direct-write/cad-document-direct-write.module';
import { CADDocumentService } from './cad-document.service';
import { CADDocumentController } from './cad-document.controller';

/**
 * Main module for CAD Document functionality.
 * Orchestrates all CAD document-related services, controllers, and dependencies.
 * Provides a complete CAD document management system including CRUD operations
 * and specialized queries for finding documents by project or location.
 */
@Module({
  imports: [CADDocumentDirectReadModule, CADDocumentDirectWriteModule],
  controllers: [CADDocumentController],
  providers: [CADDocumentService],
  exports: [CADDocumentService],
})
export class CADDocumentModule {}
