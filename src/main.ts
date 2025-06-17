import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe());
  const port = process.env.PORT ?? 3500;

  // Enable CORS with custom headers
  app.enableCors({
    origin: '*', // Allow requests from any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, hotel', // Include the 'hotel' header
    credentials: true, // Set this to true if you are using cookies or auth headers
  });

  await app.listen(port);
  Logger.log(
    `🚀 NestJS application is running on http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();
