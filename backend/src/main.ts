import { NestFactory } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(LoggerService));

  // Configure cookie parser middleware to parse cookies from requests
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:5174', // Vite dev server (alternate port)
      'http://localhost:3000', // In case frontend runs on 3000
      'http://localhost:4173', // Vite preview
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Access-Control-Allow-Origin',
    ],
    credentials: true, // Important: allows cookies to be sent with requests
  });

  ConfigModule.forRoot({
    isGlobal: true,
  });

  await app.listen(3000);
}
bootstrap();
