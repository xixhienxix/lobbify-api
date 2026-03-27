import { Module } from '@nestjs/common';
import { HouseKeepingCodesController } from './controllers/housekeepingcodes.controller';
import { HouseKeepingService } from './services/housekeepingcodes.service';
import { HousekeepingGateway } from './gateway/housekeeping.gateway';

@Module({
  controllers: [HouseKeepingCodesController],
  providers: [HouseKeepingService, HousekeepingGateway],
  exports: [HouseKeepingService],
})
export class HouseKeepingModule {}
