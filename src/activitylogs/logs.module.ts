import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuestModule } from 'src/guests/guest.module';
import { LogSchema } from './models/log.model';
import { LogController } from './controllers/log.controller';
import { LogService } from './service/log.service';

@Module({
  imports: [
    GuestModule,
    MongooseModule.forFeature([{ name: 'Log', schema: LogSchema }]),
  ],
  controllers: [LogController],
  providers: [LogService],
})
export class LogModule {}
