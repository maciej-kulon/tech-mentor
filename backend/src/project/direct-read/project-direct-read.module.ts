import { Module } from '@nestjs/common';
import { ProjectDirectReadService } from './project-direct-read.service';
import { ProjectRepositoryModule } from '../data-model/project-repository.module';

@Module({
  imports: [ProjectRepositoryModule],
  providers: [ProjectDirectReadService],
  exports: [ProjectDirectReadService],
})
export class ProjectDirectReadModule {}
