import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
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

  @Put('/reportes/borrar-bloqueo/:id')
  @UseGuards(RolesUserGuard)
  async deleteBloqueo(@Param('id') bloqueoId: string): Promise<any> {
    try {
      const result = await this._BloqueosService.deleteBloqueo(bloqueoId);
      if (result.deletedCount === 0) {
        throw new HttpException('Bloqueo not found', HttpStatus.NOT_FOUND);
      }
      return {
        message: 'Bloqueo deleted!',
        bloqueo: result,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
