import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { MasterAdminGuard } from 'src/guards/master-admin.guard';
import { TenantService } from './tenant.service';

@Controller('admin/hotels')
export class HotelAdminController {
  constructor(private readonly tenantService: TenantService) {}

  @UseGuards(MasterAdminGuard)
  @Patch(':hotelId/email-credentials')
  async setEmailCredentials(
    @Param('hotelId') hotelId: string,
    @Body() body: { emailPass: string },
  ) {
    if (!body?.emailPass) throw new BadRequestException('emailPass required');
    const ok = await this.tenantService.setHotelEmailPass(
      hotelId,
      body.emailPass,
    );
    if (!ok) throw new NotFoundException(`Hotel "${hotelId}" not found`);
    return { message: 'Email credentials saved' };
  }
}
