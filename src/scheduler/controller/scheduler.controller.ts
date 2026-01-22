// Create a new controller or add to an existing one
import { Controller, Post, Param } from '@nestjs/common';
import { HotelSchedulerService } from '../scheduler.tasks';

@Controller('scheduler')
export class SchedulerController {
  constructor(private schedulerService: HotelSchedulerService) {}

  @Post('test/:hotel')
  async testScheduler(@Param('hotel') hotel: string) {
    // Decode URL + convert hyphens to spaces
    const hotelName = decodeURIComponent(hotel).replace(/-/g, ' ');

    await this.schedulerService.testHotelTask(hotelName);

    return {
      message: 'Task executed manually',
      hotel: hotelName,
    };
  }
}
