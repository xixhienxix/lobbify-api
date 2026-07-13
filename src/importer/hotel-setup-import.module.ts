// hotel-setup-import.module.ts

import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module'; // ajustar ruta real — debe exportar TenantService

import { HotelSetupImportController } from './hotel-setup-import.controller';
import { HotelSetupAuthController } from '../auth/hotel-setup-auth.controller';
import { HotelSetupImportService } from './hotel-setup-import.service';
import { MasterAdminAuthService } from '../auth/service/master-admin-auth.service';

@Module({
  imports: [TenantModule],
  controllers: [HotelSetupImportController, HotelSetupAuthController],
  providers: [HotelSetupImportService, MasterAdminAuthService],
})
export class HotelSetupImportModule {}
