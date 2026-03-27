import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { TarifasService } from '../_services/tarifas.service';

@Controller()
export class TarifasController {
  constructor(private _tarifasService: TarifasService) {}

  @Get('/tarifario/tarifas')
  @UseGuards(RolesUserGuard)
  async findAllRates(): Promise<any> {
    return this._tarifasService.findAllRates();
  }

  @Get('/tarifario/tarifas/rack')
  @UseGuards(RolesUserGuard)
  async findRackRates(): Promise<any> {
    return this._tarifasService.findAllRackRates();
  }

  @Get('/tarifas/activas')
  @UseGuards(RolesUserGuard)
  async activeRates(@Query('date') date?: string): Promise<any> {
    if (date) {
      return this._tarifasService.findActiveRatesByDate(date);
    }
    return this._tarifasService.findActiveRates();
  }

  @Post('/tarifas/agregar')
  @UseGuards(RolesUserGuard)
  postTarifa(@Body() body) {
    return this._tarifasService.postTarifa(body);
  }

  @Post('/tarifas/especial/agregar')
  @UseGuards(RolesUserGuard)
  postTarifaEspecial(@Body() body) {
    return this._tarifasService.postTarifa(body);
  }

  @Post('/tarifario/actualiza/tarifas')
  @UseGuards(RolesUserGuard)
  updateTarifaEspecial(@Body() body) {
    return this._tarifasService.updateTarifaEspecial(body);
  }

  @Post('/tarifario/actualiza/tarifaBase')
  @UseGuards(RolesUserGuard)
  updateTarifa(@Body() body) {
    return this._tarifasService.updateTarifaBase(body);
  }

  @Delete('/tarifas/especial/delete/:_id')
  @UseGuards(RolesUserGuard)
  deleteTarifaEspecial(@Param() _id) {
    return this._tarifasService.deleteTarifa(_id);
  }
}
