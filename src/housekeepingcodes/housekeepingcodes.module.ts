import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HouseKeeping, HouseKeepingSchema } from './models/housekeeping.model';
import { HouseKeepingCodesController } from './controllers/housekeepingcodes.controller';
import { HouseKeepingService } from './services/housekeepingcodes.service';
import { room, RoomsSchema } from 'src/rooms/models/rooms.model';
import { HousekeepingGateway } from './gateway/housekeeping.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HouseKeeping.name, schema: HouseKeepingSchema },
      { name: room.name, schema: RoomsSchema },
    ]),
  ],
  controllers: [HouseKeepingCodesController],
  providers: [HouseKeepingService, HousekeepingGateway],
  exports: [HouseKeepingService],
})
export class HouseKeepingModule {}
