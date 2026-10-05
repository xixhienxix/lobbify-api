import { Module, Global } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { HotelInfoController } from './tenant.controller';

@Global() // Makes TenantService available everywhere without re-importing
@Module({
  providers: [TenantService],
  controllers: [HotelInfoController],
  exports: [TenantService],
})
export class TenantModule {}
