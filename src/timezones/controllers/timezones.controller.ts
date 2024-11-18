import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { TimezonesService } from '../_services/timezones.service';

@Controller()
export class TimezonesController {
  constructor(private _timeZonesService: TimezonesService) {}

  @Get('/parametros/timezones')
  @UseGuards(RolesUserGuard)
  async findAllRooms(): Promise<any> {
    return this._timeZonesService.findAll();
  }
}
