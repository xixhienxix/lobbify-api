import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.PORT ?? 3500;

  // ── Allowed origins ─────────────────────────────────────
  const allowedOrigins = [
    // Local development
    'http://localhost:4200',
    'http://localhost:4201',

    // Any Firebase hosting site under your project
    /^https:\/\/.*\.web\.app$/, // ← matches ANY *.web.app
    /^https:\/\/.*\.firebaseapp\.com$/, // ← matches ANY *.firebaseapp.com

    // Your existing frontend
    'https://lobify-front.web.app',

    // Custom domains (add as hotels go live)
    // 'https://reservas.hotelpokemon.com',
    // 'https://reservas.hotelbingo.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (typeof allowed === 'string') return allowed === origin;
        if (allowed instanceof RegExp) return allowed.test(origin);
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        Logger.warn(`🚫 CORS blocked: ${origin}`, 'CORS');
        callback(new Error(`CORS not allowed for origin: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Authorization, hotel, x-hotel-id, x-internal-access',
    credentials: true,
  });

  await app.listen(port);
  Logger.log(`🚀 NestJS running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
