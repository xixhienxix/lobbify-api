import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { TarifasService } from '../_services/tarifas.service';

@Controller()
export class TarifasController {
  constructor(private _tarifasService: TarifasService) {}

  @Get('/tarifario/tarifas')
  @UseGuards(RolesUserGuard)
  async findAllRates(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._tarifasService.findAllRates(hotel);
  }

  @Get('/tarifario/tarifas/rack')
  @UseGuards(RolesUserGuard)
  async findRackRates(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._tarifasService.findAllRackRates(hotel);
  }
  @Post('/tarifas/agregar')
  @UseGuards(RolesUserGuard)
  postTarifa(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];

    return this._tarifasService.postTarifa(hotel, body);
  }

  @Post('/tarifas/especial/agregar')
  @UseGuards(RolesUserGuard)
  postTarifaEspecial(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];

    return this._tarifasService.postTarifa(hotel, body);
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
