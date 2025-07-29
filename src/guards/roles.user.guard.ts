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

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    // ✅ Allow bypass via internal secret header
    const internalSecret = this.config.get('INTERNAL_APP_SECRET');

    const header =
      req.headers['x-internal-access'] || req.headers['X-Internal-Access'];

    if (header === internalSecret) {
      return true;
    }

    const authJwtToken = req.headers['authorization'];
    if (!authJwtToken) {
      throw new UnauthorizedException();
    }

    try {
      const decoded = jwtDecode(authJwtToken) as TokenPayload;
      const role = decoded?.usuariosResultQuery?.rol;
      return role === 'ADMIN' || role === 'USER';
    } catch (ex) {
      throw new UnauthorizedException();
    }
  }
}
