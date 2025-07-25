import { Module } from '@nestjs/common';
import { ProjectDirectReadModule } from './direct-read/project-direct-read.module';
import { ProjectDirectWriteModule } from './direct-write/project-direct-write.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  imports: [ProjectDirectReadModule, ProjectDirectWriteModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
