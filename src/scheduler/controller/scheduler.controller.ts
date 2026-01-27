// Create a new controller or add to an existing one
import { Controller, Get, Post, Param } from '@nestjs/common';
import { HotelSchedulerService } from '../scheduler.tasks';
import { SchedulerRegistry } from '@nestjs/schedule';

@Controller('scheduler')
export class SchedulerController {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private schedulerService: HotelSchedulerService,
  ) {}

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

  @Get('jobs')
  getJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    const jobList = [];

    jobs.forEach((value, key) => {
      const nextDate = value.nextDate();
      jobList.push({
        name: key,
        running: value.running,
        nextRun: nextDate?.toISO(),
        nextRunUTC: nextDate?.toUTC().toISO(),
        timeUntilNext: nextDate?.toRelative(),
      });
    });

    return {
      totalJobs: jobList.length,
      serverTime: new Date().toISOString(),
      jobs: jobList,
    };
  }

  @Post('reload')
  async reloadJobs() {
    await this.schedulerService.loadAllHotelSchedules();
    return { message: 'Jobs reloaded' };
  }
}
