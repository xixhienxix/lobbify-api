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
    const openRoutes = ['/login', '/getUserByToken', '/register'];
    if (openRoutes.some((route) => req.originalUrl.startsWith(route))) {
      return next();
    }

    const hotelId = req.headers['x-hotel-id'] as string;
    if (!hotelId) {
      throw new BadRequestException('Missing x-hotel-id header');
    }

    (req as any).hotelId = hotelId;
    (req as any).dbConnection = await this.tenantService.getConnection(hotelId);

    next();
  }
}
