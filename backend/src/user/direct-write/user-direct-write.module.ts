import { Module } from '@nestjs/common';
import { UserDirectWriteService } from './user-direct-write.service';
import { UserRepositoryModule } from '../data-model/user-repository.module';

@Module({
  imports: [UserRepositoryModule],
  providers: [UserDirectWriteService],
  exports: [UserDirectWriteService],
})
export class UserDirectWriteModule {}
