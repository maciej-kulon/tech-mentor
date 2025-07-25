import { Module } from '@nestjs/common';
import { CADDocumentRepositoryService } from './cad-document-repository.service';
import { CADDocumentEntity, CADDocumentSchema } from './cad-document.schema';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Module for CAD Document data model layer.
 * Provides database access and repository services for CAD documents.
 * Registers the CAD document schema with Mongoose and exports the repository service.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: CADDocumentEntity.name, schema: CADDocumentSchema }]),
  ],
  providers: [CADDocumentRepositoryService],
  exports: [CADDocumentRepositoryService],
})
export class CADDocumentRepositoryModule {}
