import { Module } from '@nestjs/common';
import { ProjectDirectWriteService } from './project-direct-write.service';
import { ProjectRepositoryModule } from '../data-model/project-repository.module';

@Module({
  imports: [ProjectRepositoryModule],
  providers: [ProjectDirectWriteService],
  exports: [ProjectDirectWriteService],
})
export class ProjectDirectWriteModule {}
