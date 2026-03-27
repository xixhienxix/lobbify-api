import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PromosService } from '../services/promos.services';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class PromosController {
  constructor(private _promosService: PromosService) {}

  @Get('/promos')
  @UseGuards(RolesUserGuard)
  async findAllRooms(): Promise<any> {
    return this._promosService.findAll();
  }

  @Post('/promos')
  @UseGuards(RolesUserGuard)
  async postPromo(@Body() body): Promise<any> {
    return this._promosService.createPromos(body);
  }

  @Delete('/promos/:_id')
  @UseGuards(RolesUserGuard)
  async deletePromo(@Param() _id): Promise<any> {
    return this._promosService.deletePromo(_id);
  }
}
