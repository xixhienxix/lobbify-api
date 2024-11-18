import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { BloqueosService } from '../_services/bloqueos.service';

@Controller()
export class BloqueosController {
  constructor(private _BloqueosService: BloqueosService) {}

  @Get('/bloqueos/getAll')
  @UseGuards(RolesUserGuard)
  async findAllBloqueos(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._BloqueosService.findAll(hotel);
  }

  @Post('/post/bloqueos')
  @UseGuards(RolesUserGuard)
  async postReservaton(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._BloqueosService.createBloqueo(hotel, body);
  }
}
