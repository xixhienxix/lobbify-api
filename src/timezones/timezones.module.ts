import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimezonesSchema, timezone } from './_models/timezone.model';
import { TimezonesController } from './controllers/timezones.controller';
import { TimezonesService } from './_services/timezones.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: timezone.name, schema: TimezonesSchema },
    ]),
  ],
  controllers: [TimezonesController],
  providers: [TimezonesService],
})
export class TimezonesModule {}
