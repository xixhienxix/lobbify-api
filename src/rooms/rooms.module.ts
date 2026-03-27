import { Module } from '@nestjs/common';
import { RoomsService } from './services/rooms.service';
import { RoomsController } from './controllers/rooms.controller';
import { GuestModule } from 'src/guests/guest.module';

@Module({
  imports: [GuestModule],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
