import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWTSECRET } from 'src/environments/environment';
import { ReservationsController } from './reservations.controller';
import { GuestReservationGuard } from './guest.reservation.guard';
import { ReservationAuthService } from './reservation-auth.service';
import { AccountingModule } from '../accounting/accounting.module';
import { GuestStatementService } from './guest.statement.service';

@Module({
  imports: [AccountingModule, JwtModule.register({ secret: JWTSECRET })],
  controllers: [ReservationsController],
  providers: [
    ReservationAuthService,
    GuestReservationGuard,
    GuestStatementService,
  ],
})
export class ReservationsModule {}
