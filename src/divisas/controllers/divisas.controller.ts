import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { DivisasService } from '../_services/divisas.service';

@Controller()
export class DivisasController {
  constructor(private _divisasService: DivisasService) {}

  @Get('/parametros/divisas')
  @UseGuards(RolesUserGuard)
  async findAllRooms(): Promise<any> {
    return this._divisasService.findAll();
  }
}
