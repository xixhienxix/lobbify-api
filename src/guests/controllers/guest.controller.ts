import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
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
  async findAllGuests(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._GuestService.findAll(hotel);
  }

  @Get('/huesped/range')
  @UseGuards(RolesUserGuard)
  async findGuestsByRange(
    @Req() request: Request,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._GuestService.findByDateRange(hotel, start, end);
  }

  @Get('/huesped/search/:folio')
  @UseGuards(RolesUserGuard)
  async findByFolio(
    @Req() request: Request,
    @Param('folio') folio,
  ): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._GuestService.findByFolio(hotel, folio);
  }

  @Get('/huesped/filteredRsv')
  @UseGuards(RolesUserGuard)
  async searchRsv(
    @Req() request: Request,
    @Query() filters: FilterReservationsDto,
  ): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._GuestService.searchByFilter(hotel, filters);
  }

  @Post('/huesped/save')
  @UseGuards(RolesUserGuard)
  async postReservaton(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._GuestService.postReservation(hotel, body);
  }

  @Post('/disponibilidad/reservas')
  @UseGuards(RolesUserGuard)
  async getDisponibilidad(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    console.log(
      `[${new Date().toISOString()}] [START] Controller received request`,
    );
    return this._GuestService.getDisponibilidad(hotel, body);
  }

  @Post('/reserva/onreservaresize')
  @UseGuards(RolesUserGuard)
  async onReservationResize(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._GuestService.onReservationResize(hotel, body);
  }

  @Post('/reserva/modifica/huesped')
  @UseGuards(RolesUserGuard)
  async onModificaHuesped(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._GuestService.onModificaHuesped(hotel, body);
  }

  @Post('/reportes/actualiza/huesped')
  @UseGuards(RolesUserGuard)
  async updateHuesped(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._GuestService.updateHuesped(hotel, body);
  }

  @Get('/promesas/:folio')
  @UseGuards(RolesUserGuard)
  async findPromesasByFolio(
    @Req() request: Request,
    @Param('folio') folio,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._GuestService.findPromesas(hotel, folio);
  }

  @Post('/actualiza/estatus/huesped')
  @UseGuards(RolesUserGuard)
  async updateGuestStatus(@Req() request: Request, @Body() body): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._GuestService.updateStatus(hotel, body);
  }

  @Post('/actualiza/estatus/checkout')
  @UseGuards(RolesUserGuard)
  async updateCheckOut(@Req() request: Request, @Body() body): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._GuestService.updateColgadoStatus(hotel, body);
  }

  // Huesped Details
  @Get('/details')
  @UseGuards(RolesUserGuard)
  async getDetails(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._GuestService.getDetails(hotel);
  }

  @Post('/reportes/details')
  @UseGuards(RolesUserGuard)
  async postDetails(@Req() request: Request, @Body() body): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._GuestService.postDetails(hotel, body);
  }

  @Get('/details/:folio')
  @UseGuards(RolesUserGuard)
  async getDetailsById(
    @Req() request: Request,
    @Param('folio') folio,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._GuestService.getDetailsById(hotel, folio);
  }

  @Post('/actualiza/estatus/reserva')
  @UseGuards(RolesUserGuard)
  async updateHuespedStatus(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._GuestService.updateEstatusHuesped(hotel, body);
  }

  @Get('reservations/resumen-reservaciones')
  @UseGuards(RolesUserGuard)
  async getReservationSummary(@Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._GuestService.getReservationSummary(hotel);
  }
}
