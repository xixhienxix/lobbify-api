import { Module } from '@nestjs/common';
import { RoomsService } from './services/rooms.service';
import { RoomsController } from './controllers/rooms.controller';
import { GuestModule } from 'src/guests/guest.module';
import { RoomImagesController } from 'src/aws/s3/controllers/room-images.controller';
import { RoomImagesService } from 'src/aws/s3/services/s3.service';

@Module({
  imports: [GuestModule],
  controllers: [RoomsController, RoomImagesController],
  providers: [RoomsService, RoomImagesService],
})
export class RoomsModule {}
