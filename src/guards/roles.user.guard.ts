import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

import { INTERNAL_APP_SECRET, JWTSECRET } from 'src/environments/environment';

type UserPayload = {
  _id: string;
  email: string;
  hotel: string;
  hotelId?: string;
  hotelPrefix?: string;
  nombre: string;
  rol: number;
  terminos: boolean;
  username: string;
};

type TokenPayload = {
  exp: number;
  iat: number;
  usuariosResultQuery: UserPayload;
};

@Injectable()
export class RolesUserGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();

    const internalHeader =
      req.headers['x-internal-access'] || req.headers['X-Internal-Access'];

    if (internalHeader === INTERNAL_APP_SECRET) {
      return true;
    }

    const authJwtToken = req.headers['authorization'];

    if (!authJwtToken) {
      throw new UnauthorizedException('Falta el header Authorization.');
    }

    try {
      const decoded = jwt.verify(authJwtToken, JWTSECRET) as TokenPayload;

      const role = Number(decoded?.usuariosResultQuery?.rol);

      if (![1, 2, 3].includes(role)) {
        throw new ForbiddenException(
          'El usuario no tiene acceso a este recurso.',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }
}
