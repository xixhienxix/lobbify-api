import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthenticationGuard } from 'src/guards/auth.guard';
import { HuespedService } from '../service/huesped.service';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller()
@UseGuards(AuthenticationGuard)
export class HuespedController {
  constructor(private _HuespedService: HuespedService) {}

  @Get()
  @UseGuards(AdminGuard)
  async findAlLHuespeds() {
    return this._HuespedService.findAll();
  }
}
