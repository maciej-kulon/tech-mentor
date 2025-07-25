import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongoDBModule } from './mongodb/mongodb.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './logger/logger.module';
import { ProjectModule } from './project/project.module';
import { PageModule } from './page/page.module';

const modulesWithControllers = [UserModule, AuthModule, ProjectModule, PageModule];

@Module({
  imports: [
    LoggerModule,
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
