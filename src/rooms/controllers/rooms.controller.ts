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
import { RoomsService } from '../services/rooms.service';
import { RolesUserGuard } from 'src/guards/roles.user.guard';

@Controller()
export class RoomsController {
  constructor(private _habitacionService: RoomsService) {}

  @Get('/habitaciones')
  @UseGuards(RolesUserGuard)
  async findAllRooms(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._habitacionService.findAll(hotel);
  }

  @Get('/habitaciones/codigos')
  @UseGuards(RolesUserGuard)
  async findAllRoomCodes(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._habitacionService.findAllRoomCodes(hotel);
  }

  @Post('/habitacion/guardar')
  @UseGuards(RolesUserGuard)
  async postRoom(@Body() body, @Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._habitacionService.postRoom(hotel, body);
  }

  @Post('/habitaciones/agregar')
  @UseGuards(RolesUserGuard)
  async agregarHabitaciones(
    @Body() body,
    @Req() request: Request,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._habitacionService.agregarHabitacion(hotel, body);
  }

  @Delete('/habitacion/delete/:codigo')
  @UseGuards(RolesUserGuard)
  async deleteRoom(
    @Req() request: Request,
    @Param('codigo') codigo: string,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._habitacionService.deleteRoom(hotel, codigo);
  }

  @Post('update/habitacion/imageurl')
  @UseGuards(RolesUserGuard)
  async updateImgToMongo(@Body() body, @Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._habitacionService.uploadImgToMongo(hotel, body);
  }
}
