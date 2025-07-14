import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { AuthenticationGuard } from './auth.guard';
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
export class AdminGuard extends AuthenticationGuard implements CanActivate {
  constructor() {
    //     const roles = process.env.ALLOW_USER_ROLE ? ['ADMIN', 'USER'] : ['ADMIN'];
    // super(roles);
    super(['ADMIN', 'USER']);
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const host = context.switchToHttp(),
      req = host.getRequest();
    const authJwtToken = req.headers['authorization'];
    if (!authJwtToken) {
      throw new UnauthorizedException();
    }
    try {
      const decoded = jwtDecode(authJwtToken) as TokenPayload;
      if (decoded.usuariosResultQuery.rol === 'ADMIN') {
        return true;
      } else {
        return false;
      }
    } catch (ex) {
      console.error(ex);
      throw new UnauthorizedException();
    }
  }
}
