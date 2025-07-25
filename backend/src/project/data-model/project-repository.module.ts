import { Module } from '@nestjs/common';
import { ProjectRepositoryService } from './project-repository.service';
import { ProjectEntity, ProjectSchema } from './project.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: ProjectEntity.name, schema: ProjectSchema }])],
  providers: [ProjectRepositoryService],
  exports: [ProjectRepositoryService],
})
export class ProjectRepositoryModule {}
