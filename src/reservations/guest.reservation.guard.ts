import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JWTSECRET } from 'src/environments/environment';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class GuestReservationGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const raw = req.headers['authorization'] as string | undefined;
    if (!raw) throw new UnauthorizedException('Falta el token de reservación.');

    let payload: any;
    try {
      payload = this.jwt.verify(raw.replace(/^Bearer /, ''), {
        secret: JWTSECRET,
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    if (payload.hotelId !== req.headers['x-hotel-id']) {
      throw new ForbiddenException('El token no corresponde a este hotel.');
    }
    req.reservationFolio = payload.folio;
    return true;
  }
}
