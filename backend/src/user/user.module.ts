import { Module } from '@nestjs/common';
import { UserDirectReadModule } from './direct-read/user-direct-read.module';
import { UserDirectWriteModule } from './direct-write/user-direct-write.module';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [UserDirectReadModule, UserDirectWriteModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
