import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesUserGuard } from 'src/guards/roles.user.guard';
import { AccountingService } from '../services/accounting.service';

@Controller()
export class AccountingController {
  constructor(private _AccountingService: AccountingService) {}

  @Get('/edo_cuenta/:folio')
  @UseGuards(RolesUserGuard)
  async getAccounts(@Param('folio') folio: string): Promise<any> {
    return this._AccountingService.getAccounts(folio);
  }

  @Get('/ingresos/range')
  @UseGuards(RolesUserGuard)
  async getAccountsByRange(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('folio') folio?: string,
  ): Promise<any> {
    return this._AccountingService.getAccountsByDateRange(start, end, folio);
  }

  @Post('/edo_cuenta/pagos')
  @UseGuards(RolesUserGuard)
  async addHospedaje(@Body() body) {
    return this._AccountingService.addPayment(body);
  }

  @Post('/edo_cuenta/descuento')
  @UseGuards(RolesUserGuard)
  async addDscByConcept(@Body() body) {
    return this._AccountingService.addDscProperty(body);
  }

  @Post('/edo_cuenta/hospedaje')
  @UseGuards(RolesUserGuard)
  async updateHuesped(@Body() body) {
    return this._AccountingService.addHospedaje(body);
  }

  @Put('/edo_cuenta/pagos')
  @UseGuards(RolesUserGuard)
  updatePromesa(@Body() body) {
    return this._AccountingService.updatePaymentStatus(body);
  }

  @Put('/edo_cuenta/update/concepto')
  @UseGuards(RolesUserGuard)
  updateHospedaje(@Body() body) {
    return this._AccountingService.updateHospedaje(body);
  }

  @Get('/ingresos/totales')
  @UseGuards(RolesUserGuard)
  async getAllAccounts(): Promise<any> {
    return this._AccountingService.getAllAccounts();
  }

  @Put('/edo_cuenta/alojamiento')
  @UseGuards(RolesUserGuard)
  updateBalance(@Body() body) {
    return this._AccountingService.updateBalance(body);
  }

  @Post('/edo_cuenta/totales')
  @UseGuards(RolesUserGuard)
  actualizaSaldos(@Body() body) {
    return this._AccountingService.actualizaTotales(body);
  }

  ///edo_cuenta/pagos
}
