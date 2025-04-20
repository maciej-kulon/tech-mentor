import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';

@Global()
@Module({})
export class MongoDBModule {
  public static forRoot(): DynamicModule {
    return {
      module: MongoDBModule,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            uri: configService.get('MONGODB_URI'),
            useNewUrlParser: true,
            useUnifiedTopology: true,
          }),
          inject: [ConfigService],
        }),
      ],
      exports: [MongooseModule],
    };
  }

  public static forFeature(models: ModelDefinition[]): DynamicModule {
    return {
      module: MongoDBModule,
      imports: [MongooseModule.forFeature(models)],
      exports: [MongooseModule],
    };
  }
}
