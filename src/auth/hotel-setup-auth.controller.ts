// hotel-setup-auth.controller.ts
//
// Controller SEPARADO del import — sin @UseGuards, porque este es el propio
// endpoint de login que emite el JWT que luego se usa para entrar al import.
// Vive bajo el mismo prefijo '/hotel-setup' (ya excluido de TenantMiddleware).

import { Body, Controller, Post } from '@nestjs/common';
import { MasterAdminAuthService } from '../auth/service/master-admin-auth.service';

@Controller('hotel-setup')
export class HotelSetupAuthController {
  constructor(
    private readonly masterAdminAuthService: MasterAdminAuthService,
  ) {}

  /**
   * POST /hotel-setup/master-login
   * Body: { "username": "...", "password": "..." }
   *
   * Login exclusivo contra la base "MovNext" — solo usuarios con
   * rol=1 Y perfil=1 pueden obtener un token válido para el importer.
   */
  @Post('master-login')
  async masterLogin(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.masterAdminAuthService.login(username, password);
  }
}
