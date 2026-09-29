// admin-verified.guard.ts
//
// AdminGuard (existente) usa jwtDecode — solo decodifica, NO verifica la
// firma del JWT. Cualquiera podría forjar un payload con rol: 1 y pasarlo
// sin haber iniciado sesión. El catálogo de usuarios crea/edita/elimina
// accesos y de aquí se deriva hotelPrefix/hotelId para el nuevo usuario, así
// que amerita verificación real — mismo patrón que ya usas en
// MasterAdminGuard.
//
// A diferencia de MasterAdminAuthGuard (rol=1 Y perfil=1, admin maestro de
// MovNext), este guard es para el admin normal de un hotel: solo rol === 1.

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWTSECRET } from 'src/environments/environment';

export interface UsuarioAutenticado {
  _id: string;
  email: string;
  hotel: string;
  hotelId?: string;
  hotelPrefix?: string;
  nombre: string;
  rol: number;
  terminos: boolean;
  username: string;
}

@Injectable()
export class AdminVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.headers['authorization'] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Falta el header Authorization.');
    }

    let payload: any;
    try {
      // jwt.verify (no jwtDecode) — valida la firma, no solo decodifica.
      payload = jwt.verify(token, JWTSECRET);
    } catch (err) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    const user: UsuarioAutenticado = payload?.usuariosResultQuery;
    if (!user || user.rol !== 1) {
      throw new ForbiddenException('Se requiere un usuario administrador.');
    }

    // Available to any controller/service on this request. UserService
    // reads it (via its injected REQUEST) to derive hotelPrefix/hotelId
    // instead of trusting whatever the client sent in the body.
    (req as any).usuarioAutenticado = user;
    return true;
  }
}
