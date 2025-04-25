import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongoDBModule } from './mongodb/mongodb.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

const modulesWithControllers = [UserModule, AuthModule];

@Module({
  imports: [
    ...modulesWithControllers,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongoDBModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
