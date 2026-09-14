import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { Hotel, HotelSchema } from 'src/admin/models/hotel.model';
import { JWTSECRET } from 'src/environments/environment';
import { GuestSchema, huespeds } from 'src/guests/models/guest.model'; // was HuespedDetailsSchema
import { TenantService } from 'src/tenant/tenant.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ReservationAuthService {
  constructor(
    private readonly tenantService: TenantService,
    private readonly jwt: JwtService,
  ) {}

  async resolveCode(rawCode: string) {
    const code = (rawCode ?? '').trim().toUpperCase();
    const match = /^([A-Z]{2,4})-(.+)$/.exec(code);
    if (!match) throw new BadRequestException('Código inválido.');
    const [, prefix, folio] = match;

    const adminConn = this.tenantService.getAdminConnection();
    const hotelModel = (adminConn.models['hotels'] ||
      adminConn.model('hotels', HotelSchema)) as Model<Hotel>;
    const hotel = await hotelModel.findOne({ prefix, status: 'active' }).lean();
    if (!hotel) throw new NotFoundException('Reservación no encontrada.');

    const hotelConn = await this.tenantService.getConnection(hotel.hotelId);
    // 'Reservaciones' — the actual reservation record with folio/habitacion/fechas,
    // not the guest-profile collection. Match the registry key AccountingService
    // uses, so both share one cached model on this connection.
    const guestModel = (hotelConn.models['Reservaciones'] ||
      hotelConn.model('Reservaciones', GuestSchema)) as Model<huespeds>;

    const reservation = await guestModel.findOne({ folio }).lean();
    if (!reservation) throw new NotFoundException('Reservación no encontrada.');

    const token = this.jwt.sign(
      { hotelId: hotel.hotelId, folio },
      { secret: JWTSECRET, expiresIn: '30d' },
    );

    return { token, hotelId: hotel.hotelId, reservation };
  }
}
