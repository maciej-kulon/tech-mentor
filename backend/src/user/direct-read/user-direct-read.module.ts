import { Module } from '@nestjs/common';
import { UserDirectReadService } from './user-direct-read.service';
import { UserRepositoryModule } from '../data-model/user-repository.module';

@Module({
  imports: [UserRepositoryModule],
  providers: [UserDirectReadService],
  exports: [UserDirectReadService],
})
export class UserDirectReadModule {}
