import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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

  @Post('/edo_cuenta/pagos')
  @UseGuards(RolesUserGuard)
  async addHospedaje(@Body() body, @Req() request: Request) {
    const hotel = request.headers['hotel'];
    return this._AccountingService.addPayment(hotel, body);
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

  ///edo_cuenta/pagos
}
