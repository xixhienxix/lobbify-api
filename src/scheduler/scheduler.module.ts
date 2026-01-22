import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HotelSchedulerService } from './scheduler.tasks';
import { ParametrosModule } from '../parametros/parametros.module';
import { GuestModule } from '../guests/guest.module';
import { SchedulerController } from './controller/scheduler.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    forwardRef(() => ParametrosModule),
    GuestModule,
  ],
  controllers: [SchedulerController],
  providers: [HotelSchedulerService],
  exports: [HotelSchedulerService],
})
export class SchedulerModule {}
