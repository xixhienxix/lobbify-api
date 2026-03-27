import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { GuestService } from '../services/guest.service';
import { FilterReservationsDto } from '../models/guest.model';

@Controller()
export class GuestsController {
  constructor(private _GuestService: GuestService) {}

  @Get('/huesped/getAll')
  @UseGuards(RolesUserGuard)
  async findAllGuests(): Promise<any> {
    return this._GuestService.findAll();
  }

  @Get('/huesped/range')
  @UseGuards(RolesUserGuard)
  async findGuestsByRange(
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<any> {
    return this._GuestService.findByDateRange(start, end);
  }

  @Get('/huesped/search/:folio')
  @UseGuards(RolesUserGuard)
  async findByFolio(@Param('folio') folio): Promise<any> {
    return this._GuestService.findByFolio(folio);
  }

  @Get('/huesped/filteredRsv')
  @UseGuards(RolesUserGuard)
  async searchRsv(@Query() filters: FilterReservationsDto): Promise<any> {
    return this._GuestService.searchByFilter(filters);
  }

  @Post('/huesped/save')
  @UseGuards(RolesUserGuard)
  async postReservaton(@Body() body) {
    return this._GuestService.postReservation(body);
  }

  @Post('/disponibilidad/reservas')
  @UseGuards(RolesUserGuard)
  async getDisponibilidad(@Body() body) {
    return this._GuestService.getDisponibilidad(body);
  }

  @Post('/reserva/onreservaresize')
  @UseGuards(RolesUserGuard)
  async onReservationResize(@Body() body) {
    return this._GuestService.onReservationResize(body);
  }

  @Post('/reserva/modifica/huesped')
  @UseGuards(RolesUserGuard)
  async onModificaHuesped(@Body() body) {
    return this._GuestService.onModificaHuesped(body);
  }

  @Post('/reportes/actualiza/huesped')
  @UseGuards(RolesUserGuard)
  async assignRoom(@Body() body) {
    return this._GuestService.roomUpdate(body);
  }

  @Post('/reservaciones/asignar-cuarto')
  @UseGuards(RolesUserGuard)
  async updateHuesped(@Body() body) {
    return this._GuestService.updateHuesped(body);
  }

  @Get('/promesas/:folio')
  @UseGuards(RolesUserGuard)
  async findPromesasByFolio(@Param('folio') folio): Promise<any> {
    return this._GuestService.findPromesas(folio);
  }

  @Post('/actualiza/estatus/huesped')
  @UseGuards(RolesUserGuard)
  async updateGuestStatus(@Body() body): Promise<any> {
    return this._GuestService.updateStatus(body);
  }

  @Post('/actualiza/estatus/checkout')
  @UseGuards(RolesUserGuard)
  async updateCheckOut(@Body() body): Promise<any> {
    return this._GuestService.updateColgadoStatus(body);
  }

  @Get('/details')
  @UseGuards(RolesUserGuard)
  async getDetails(): Promise<any> {
    return this._GuestService.getDetails();
  }

  @Post('/reportes/details')
  @UseGuards(RolesUserGuard)
  async postDetails(@Body() body): Promise<any> {
    return this._GuestService.postDetails(body);
  }

  @Get('/details/:folio')
  @UseGuards(RolesUserGuard)
  async getDetailsById(@Param('folio') folio): Promise<any> {
    return this._GuestService.getDetailsById(folio);
  }

  @Post('/actualiza/estatus/reserva')
  @UseGuards(RolesUserGuard)
  async updateHuespedStatus(@Body() body) {
    return this._GuestService.updateEstatusHuesped(body);
  }

  @Get('reservations/resumen-reservaciones')
  @UseGuards(RolesUserGuard)
  async getReservationSummary() {
    return this._GuestService.getReservationSummary();
  }
}
