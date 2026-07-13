import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { corsOriginHandler } from './config/cors.config';
import { CorsIoAdapter } from './config/socket.io.adapter';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: false, // don't throw on extra props
      transform: true, // auto-transform types (string → number etc)
    }),
  );
  app.useWebSocketAdapter(new CorsIoAdapter(app, corsOriginHandler));

  app.enableCors({
    origin: corsOriginHandler,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Authorization, hotel, x-hotel-id, x-internal-access',
    credentials: true,
  });

  const port = process.env.PORT ?? 3500;
  await app.listen(port);
  Logger.log(`🚀 NestJS running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
