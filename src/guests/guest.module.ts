import { Module } from '@nestjs/common';
import { GuestService } from './services/guest.service';
import { GuestsController } from './controllers/guest.controller';
import { BloqueosModule } from 'src/bloqueos/bloqueos.module';
import { GuestGateway } from './gateway/guest.gateway';
import { GuestReservationGuard } from '../reservations/guest.reservation.guard';
import { JWTSECRET } from 'src/environments/environment';
import { JwtModule } from '@nestjs/jwt';
import { ReservationAuthService } from 'src/reservations/reservation-auth.service';
import { GuestStatementService } from 'src/reservations/guest.statement.service';

@Module({
  imports: [BloqueosModule, JwtModule.register({ secret: JWTSECRET })],
  controllers: [GuestsController],
  providers: [
    GuestService,
    ReservationAuthService,
    GuestStatementService,
    GuestGateway,
    GuestReservationGuard,
  ],
  exports: [GuestService],
})
export class GuestModule {}
