import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PromesasService } from '../services/promesas.services';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class PromesasController {
  constructor(private _promesasService: PromesasService) {}

  @Get('reportes/promesas/:folio')
  @UseGuards(RolesUserGuard)
  async findPromesasByFolio(@Body() body): Promise<any> {
    return this._promesasService.getPromesa(body);
  }

  @Delete('/reportes/promesa/delete/:_id')
  @UseGuards(RolesUserGuard)
  async deletePromesa(@Param('_id') _id: string): Promise<any> {
    return this._promesasService.deletePromesa(_id);
  }

  @Post('/reportes/promesa')
  @UseGuards(RolesUserGuard)
  updateTarifaEspecial(@Body() body) {
    return this._promesasService.promesaPago(body);
  }

  @Put('/reportes/promesas/update')
  @UseGuards(RolesUserGuard)
  updatePromesa(@Body() body) {
    return this._promesasService.updatePromesa(body);
  }

  @Put('/promesas/update/estatus')
  @UseGuards(RolesUserGuard)
  updatePromesaEstatus(@Body() body) {
    return this._promesasService.updatePromesaEstatus(body);
  }
}
