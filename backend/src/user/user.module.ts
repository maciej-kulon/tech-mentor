import { Module } from '@nestjs/common';

import { MongoDBModule } from '../mongodb/mongodb.module';

import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';

@Module({
  imports: [MongoDBModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
