import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PromesasService } from '../services/promesas.services';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class PromesasController {
  constructor(private _promesasService: PromesasService) {}

  @Get('reportes/promesas/:folio')
  @UseGuards(RolesUserGuard)
  async findPromesasByFolio(
    @Req() request: Request,
    @Body() body,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._promesasService.getPromesa(hotel, body);
  }

  @Delete('/reportes/promesa/delete/:_id')
  @UseGuards(RolesUserGuard)
  async deleteRoom(
    @Req() request: Request,
    @Param('codigo') codigo: string,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._promesasService.deletePromesa(hotel, codigo);
  }

  @Post('/reportes/promesa')
  @UseGuards(RolesUserGuard)
  updateTarifaEspecial(@Req() request: Request, @Body() body) {
    const hotel = request.headers['hotel'];
    return this._promesasService.promesaPago(hotel, body);
  }

  @Put('/reportes/promesas/update')
  @UseGuards(RolesUserGuard)
  updatePromesa(@Req() request: Request, @Body() body) {
    const hotel = request.headers['hotel'];
    return this._promesasService.updatePromesa(hotel, body);
  }

  @Put('/promesas/update/estatus')
  @UseGuards(RolesUserGuard)
  updatePromesaEstatus(@Req() request: Request, @Body() body) {
    const hotel = request.headers['hotel'];
    return this._promesasService.updatePromesaEstatus(hotel, body);
  }
}
