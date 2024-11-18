import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsSchema, room } from 'src/rooms/models/rooms.model';
import { RoomsService } from './services/rooms.service';
import { RoomsController } from './controllers/rooms.controller';
import { GuestModule } from 'src/guests/guest.module';
import { TarifasSchema } from 'src/tarifas/_models/tarifas.model';

@Module({
  imports: [
    GuestModule,
    MongooseModule.forFeature([
      { name: room.name, schema: RoomsSchema },
      { name: 'Tarifas', schema: TarifasSchema },
    ]),
  ],
  controllers: [RoomsController],
  providers: [RoomsService],
})
export class RoomsModule {}
