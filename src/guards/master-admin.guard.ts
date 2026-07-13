// master-admin.guard.ts
//
// A diferencia de tu AdminGuard existente (que usa jwtDecode — solo decodifica,
// NO verifica la firma del JWT), este guard usa jwt.verify() para validar
// criptográficamente el token contra JWTSECRET. Como este endpoint crea bases
// de datos completas por hotel, vale la pena la verificación real aquí.
//
// Exige que el payload tenga rol === 1 Y perfil === 1 (admin maestro, emitido
// únicamente por MasterAdminAuthService.login() contra la base "MovNext").

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWTSECRET } from '../environments/environment'; // ajustar ruta real

@Injectable()
export class MasterAdminGuard implements CanActivate {
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

    const user = payload?.usuariosResultQuery;
    if (!user || user.rol !== 1 || user.perfil !== 1) {
      throw new ForbiddenException(
        'Se requiere un administrador maestro (rol y perfil = 1 en MovNext).',
      );
    }

    // Disponible por si el controller/service lo necesita más adelante.
    (req as any).masterAdminUser = user;
    return true;
  }
}
