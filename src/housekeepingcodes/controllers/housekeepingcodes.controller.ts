import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { HouseKeepingService } from '../services/housekeepingcodes.service';

@Controller()
export class HouseKeepingCodesController {
  constructor(private _housekeepingCodesService: HouseKeepingService) {}

  @Get('/codigos/housekeeping')
  @UseGuards(RolesUserGuard)
  async findAllGuests(): Promise<any> {
    return this._housekeepingCodesService.findAll();
  }

  @Post('/codigos/update/housekeeping')
  @UseGuards(RolesUserGuard)
  async updateEstatus(@Body() body): Promise<any> {
    return this._housekeepingCodesService.updateEstatus(body);
  }
}
