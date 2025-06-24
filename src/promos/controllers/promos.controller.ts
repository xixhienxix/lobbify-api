import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PromosService } from '../services/promos.services';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class PromosController {
  constructor(private _promosService: PromosService) {}

  @Get('/promos')
  @UseGuards(RolesUserGuard)
  async findAllRooms(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._promosService.findAll(hotel);
  }

  @Post('/promos')
  @UseGuards(RolesUserGuard)
  async postPromo(@Body() body, @Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._promosService.createPromos(hotel, body);
  }

  @Delete('/promos/:_id')
  @UseGuards(RolesUserGuard)
  async deletePromo(@Param() _id): Promise<any> {
    return this._promosService.deletePromo(_id);
  }
}
