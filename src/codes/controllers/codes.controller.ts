import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { CodesService } from '../_services/codes.service';

@Controller()
export class CodesController {
  constructor(private _codesService: CodesService) {}

  @Get('/codigos/getAll')
  @UseGuards(RolesUserGuard)
  async findAllRooms(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findAll(hotel);
  }

  @Get('estatus/all')
  @UseGuards(RolesUserGuard)
  async findAllEstatus(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findAllEstatus(hotel);
  }

  @Get('/folios/all')
  @UseGuards(RolesUserGuard)
  async findAllFolios(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findFolios(hotel);
  }

  @Get('/adicional/all')
  @UseGuards(RolesUserGuard)
  async findAllAdicionales(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._codesService.findAdicional(hotel);
  }
}
