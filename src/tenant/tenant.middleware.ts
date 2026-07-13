import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  // tenant.middleware.ts
  async use(req: Request, res: Response, next: NextFunction) {
    console.log(
      '🔎 METHOD:',
      req.method,
      '| URL:',
      JSON.stringify(req.originalUrl),
    );

    const openRoutes = [
      '/login',
      '/getUserByToken',
      '/register',
      '/hotel-setup',
      '/admin-import.html',
    ];

    const matched = openRoutes.some((route) =>
      req.originalUrl.startsWith(route),
    );
    console.log('🔎 matched openRoutes?', matched); // 🔎 DEBUG TEMPORAL

    if (matched) {
      return next();
    }

    const hotelId = req.headers['x-hotel-id'] as string;
    console.log(' x-hotel-id received:', hotelId);

    if (!hotelId) {
      throw new BadRequestException('Missing x-hotel-id header');
    }

    (req as any).hotelId = hotelId;
    (req as any).dbConnection = await this.tenantService.getConnection(hotelId);

    next();
  }
}
