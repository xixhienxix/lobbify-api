import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from '../services/rooms.service';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class RoomsController {
  constructor(private _habitacionService: RoomsService) {}

  @Get('/habitaciones')
  @UseGuards(RolesUserGuard)
  async findAllRooms(): Promise<any> {
    return this._habitacionService.findAll();
  }

  @Get('/habitaciones/codigos')
  @UseGuards(RolesUserGuard)
  async findAllRoomCodes(): Promise<any> {
    return this._habitacionService.findAllRoomCodes();
  }

  @Post('/habitacion/guardar')
  @UseGuards(RolesUserGuard)
  async postRoom(@Body() body): Promise<any> {
    return this._habitacionService.postRoom(body);
  }

  @Post('/habitaciones/agregar')
  @UseGuards(RolesUserGuard)
  async agregarHabitaciones(@Body() body): Promise<any> {
    return this._habitacionService.agregarHabitacion(body);
  }

  @Delete('/habitacion/delete')
  @UseGuards(RolesUserGuard)
  async deleteRoom(
    @Query('codigo') codigo: string,
    @Query('numero') numero: string,
  ): Promise<any> {
    return this._habitacionService.deleteRoom(codigo, numero);
  }

  @Post('update/habitacion/imageurl')
  @UseGuards(RolesUserGuard)
  async updateImgToMongo(@Body() body): Promise<any> {
    return this._habitacionService.uploadImgToMongo(body);
  }
}
