import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { ConfigService } from '@nestjs/config';
import { INTERNAL_APP_SECRET } from 'src/environments/environment';
type TokenPayload = {
  exp: number;
  iat: number;
  usuariosResultQuery: UserPayload;
};
type UserPayload = {
  _id: string;
  email: string;
  hotel: string;
  nombre: string;
  password: string;
  rol: string;
  terminos: boolean;
  username: string;
};
@Injectable()
export class RolesUserGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    const header =
      req.headers['x-internal-access'] || req.headers['X-Internal-Access'];

    if (header === INTERNAL_APP_SECRET) {
      return true;
    }

    const authJwtToken = req.headers['authorization'];
    if (!authJwtToken) throw new UnauthorizedException();

    try {
      const decoded = jwtDecode(authJwtToken) as TokenPayload;
      const role = decoded?.usuariosResultQuery?.rol;
      return role === 'ADMIN' || role === 'USER';
    } catch {
      throw new UnauthorizedException();
    }
  }
}
