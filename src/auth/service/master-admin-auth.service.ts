// master-admin-auth.service.ts
//
// Login EXCLUSIVO para acceder al importer de setup de hoteles.
// A diferencia de UserService.loginFromAdmin() (que busca al usuario en TODAS
// las bases de hoteles), este login busca SOLO en la base maestra "MovNext",
// y exige rol === 1 Y perfil === 1 (administrador maestro real de la
// plataforma, no solo admin de un hotel individual).

import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { JWTSECRET } from 'src/environments/environment'; // ajustar ruta real
import { TenantService } from '../../tenant/tenant.service'; // ajustar ruta real
import { usuario, UsuarioSchema } from '../models/user.model'; // ajustar ruta real

const MASTER_DB_NAME = 'MovNext';

@Injectable()
export class MasterAdminAuthService {
  constructor(private readonly tenantService: TenantService) {}

  async login(username: string, password: string): Promise<any> {
    // TenantService.getConnection() ya sabe conectar por nombre de base
    // (dbUrl = `${MONGODB_CONNECTION_URL}/${hotelId}`), así que reusamos el
    // mismo mecanismo pasándole "MovNext" como si fuera un "hotelId" más.
    const connection = await this.tenantService.getConnection(MASTER_DB_NAME);
    const userModel = (connection.models['usuarios'] ||
      connection.model('usuarios', UsuarioSchema)) as Model<usuario>;

    const user = await userModel
      .findOne({ username, password, rol: 1, perfil: 1 })
      .lean();

    if (!user) {
      return {
        mensaje:
          'Usuario inexistente o sin permisos de administrador maestro (rol y perfil deben ser 1 en MovNext).',
      };
    }

    const accessToken = jwt.sign({ usuariosResultQuery: user }, JWTSECRET, {
      expiresIn: '30m',
    });

    return { ...user, accessToken };
  }
}
