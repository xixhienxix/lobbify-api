import { Module, Global } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Global() // Makes TenantService available everywhere without re-importing
@Module({
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
