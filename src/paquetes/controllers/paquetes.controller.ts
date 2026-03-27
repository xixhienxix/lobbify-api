import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaquetesServices } from '../services/paquetes.services';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class PaquetesController {
  constructor(private readonly _paquetesService: PaquetesServices) {}

  @Get('catalogos/paquetes')
  @UseGuards(RolesUserGuard)
  async getAllPackages(): Promise<any> {
    return this._paquetesService.getAllPackages();
  }

  @Post('catalogos/paquetes')
  @UseGuards(RolesUserGuard)
  async postPackages(@Body() body) {
    return this._paquetesService.postNewPackage(body);
  }

  @Delete('catalogos/paquetes/:_id')
  @UseGuards(RolesUserGuard)
  deleteTarifaEspecial(@Param() _id) {
    return this._paquetesService.deletePackete(_id);
  }
}
