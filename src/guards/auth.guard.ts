import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';
import { JWTSECRET } from 'src/environments/environment';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const host = context.switchToHttp(),
      req = host.getRequest();

    const authJwtToken = req.headers['authorization'];
    const user = jwt.verify(authJwtToken, JWTSECRET);

    if (!user) {
      console.log('User Not Allowed by Guard');
      throw new UnauthorizedException();
    }

    return true;
  }
}
