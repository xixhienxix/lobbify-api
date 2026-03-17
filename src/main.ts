import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { corsOriginHandler } from './config/cors.config';
import { CorsIoAdapter } from './config/socket.io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

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
