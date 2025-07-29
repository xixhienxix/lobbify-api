import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { PaquetesServices } from '../services/paquetes.services';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class PaquetesController {
  constructor(private readonly _paquetesService: PaquetesServices) {}

  @Get('catalogos/paquetes')
  @UseGuards(RolesUserGuard)
  async getAllPackages(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    // Optional: validate hotel header presence
    if (!hotel || Array.isArray(hotel)) {
      throw new BadRequestException('Missing or invalid hotel header');
    }

    return this._paquetesService.getAllPackages(hotel);
  }

  @Post('catalogos/paquetes')
  @UseGuards(RolesUserGuard)
  async postPackages(@Req() request, @Body() body) {
    const hotel = request.headers['hotel'];
    // Optional: validate hotel header presence
    if (!hotel || Array.isArray(hotel)) {
      throw new BadRequestException('Missing or invalid hotel header');
    }

    return this._paquetesService.postNewPackage(hotel, body);
  }

  @Delete('catalogos/paquetes/:_id')
  @UseGuards(RolesUserGuard)
  deleteTarifaEspecial(@Param() _id) {
    return this._paquetesService.deletePackete(_id);
  }
}
