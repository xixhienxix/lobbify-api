import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ReservationAuthService } from './reservation-auth.service';
import { GuestReservationGuard } from './guest.reservation.guard';
import { GuestStatementService } from './guest.statement.service';

@Controller()
export class ReservationsController {
  constructor(
    private readonly reservationAuthService: ReservationAuthService,
    private readonly guestStatementService: GuestStatementService,
  ) {}

  @Post('/reservations/resolve')
  async resolve(@Body('code') code: string): Promise<any> {
    return this.reservationAuthService.resolveCode(code);
  }

  @Get('/reservations/statement')
  @UseGuards(GuestReservationGuard)
  async getStatement(@Req() req: Request): Promise<any> {
    return this.guestStatementService.getStatement(
      (req as any).reservationFolio,
    );
  }
}
