import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { AccountingService } from '../services/accounting.service';

@Controller()
export class AccountingController {
  constructor(private _AccountingService: AccountingService) {}

  @Get('/edo_cuenta/:folio')
  @UseGuards(RolesUserGuard)
  async getAccounts(
    @Req() request: Request,
    @Param('folio') folio: string,
  ): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._AccountingService.getAccounts(hotel, folio);
  }

  @Get('/ingresos/range')
  @UseGuards(RolesUserGuard)
  async getAccountsByRange(
    @Req() request: Request,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('folio') folio?: string,
  ): Promise<any> {
    const hotel = request.headers['hotel'];

    return this._AccountingService.getAccountsByDateRange(
      hotel,
      start,
      end,
      folio,
    );
  }

  @Post('/edo_cuenta/pagos')
  @UseGuards(RolesUserGuard)
  async addHospedaje(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.addPayment(hotel, body);
  }

  @Post('/edo_cuenta/descuento')
  @UseGuards(RolesUserGuard)
  async addDscByConcept(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.addDscProperty(hotel, body);
  }

  @Post('/edo_cuenta/hospedaje')
  @UseGuards(RolesUserGuard)
  async updateHuesped(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.addHospedaje(hotel, body);
  }

  @Put('/edo_cuenta/pagos')
  @UseGuards(RolesUserGuard)
  updatePromesa(@Req() request: Request, @Body() body) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.updatePaymentStatus(hotel, body);
  }

  @Put('/edo_cuenta/update/concepto')
  @UseGuards(RolesUserGuard)
  updateHospedaje(@Req() request: Request, @Body() body) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.updateHospedaje(hotel, body);
  }

  @Get('/ingresos/totales')
  @UseGuards(RolesUserGuard)
  async getAllAccounts(@Req() request: Request): Promise<any> {
    const hotel = request.headers['hotel'];
    return this._AccountingService.getAllAccounts(hotel);
  }

  @Put('/edo_cuenta/alojamiento')
  @UseGuards(RolesUserGuard)
  updateBalance(@Req() request: Request, @Body() body) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.updateBalance(hotel, body);
  }

  @Post('/edo_cuenta/totales')
  @UseGuards(RolesUserGuard)
  actualizaSaldos(@Req() request: Request, @Body() body) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.actualizaTotales(hotel, body);
  }

  ///edo_cuenta/pagos
}
