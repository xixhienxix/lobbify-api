import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';

@Controller('hotel')
export class HotelInfoController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('prefix') // GET /hotel/prefix
  async getPrefix(@Headers('x-hotel-id') hotelId: string) {
    if (!hotelId) throw new BadRequestException('Missing x-hotel-id header');

    const prefix = await this.tenantService.getHotelPrefix(hotelId);
    if (!prefix) throw new NotFoundException(`Hotel "${hotelId}" not found`);

    return { hotelId, prefix };
  }
}
