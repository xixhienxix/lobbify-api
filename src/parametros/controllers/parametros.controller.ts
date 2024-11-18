import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ParametrosService } from '../services/parametros.service';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class ParametrosController {
  constructor(private _parametrosService: ParametrosService) {}

  @Get('/parametros')
  @UseGuards(RolesUserGuard)
  async getParametros(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._parametrosService.getAll(hotel);
  }

  @Post('/parametros/save')
  @UseGuards(RolesUserGuard)
  async postParametros(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._parametrosService.postParametros(hotel, body);
  }
}
