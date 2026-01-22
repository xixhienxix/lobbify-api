import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { GuestService } from 'src/guests/services/guest.service';
import { Parametros } from 'src/parametros/models/parametros.model';
import { ParametrosService } from 'src/parametros/services/parametros.service';

@Injectable()
export class HotelSchedulerService implements OnModuleInit {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => ParametrosService))
    private parametrosService: ParametrosService,
    private reservatrionsService: GuestService,
  ) {}

  async onModuleInit() {
    console.log('Loading all hotel schedules...');
    await this.loadAllHotelSchedules();
  }

  async loadAllHotelSchedules() {
    const hotels = await this.parametrosService.getAllHotels();

    for (const hotel of hotels) {
      const parameters = await this.parametrosService.getHotelParams(hotel);

      if (parameters?.checkOut) {
        // Convert time like "17:00" to cron format "0 17 * * *"
        const cronExpression = this.timeToCron(parameters.checkOut);

        this.scheduleHotelJob(hotel, cronExpression, parameters);
      }
    }

    console.log(`Loaded ${hotels.length} hotel schedules`);
  }

  private scheduleHotelJob(
    hotelId: string,
    cronExpression: string,
    parameters: Parametros,
  ) {
    const job = new CronJob(cronExpression, async () => {
      await this.executeHotelTask(hotelId, parameters);
    });

    this.schedulerRegistry.addCronJob(`hotel-${hotelId}`, job);
    job.start();

    console.log(`Scheduled job for hotel ${hotelId}: ${cronExpression}`);
  }

  private async executeHotelTask(hotelId: string, parameters: Parametros) {
    console.log(`Executing scheduled task for hotel: ${hotelId}`);

    try {
      const checkOut = parameters?.checkOut;

      // Find all late checkouts for today
      const lateCheckouts =
        await this.reservatrionsService.findTodayLateCheckouts(
          hotelId,
          checkOut,
        );

      if (lateCheckouts.length === 0) {
        console.log(`No late checkouts found for hotel ${hotelId}`);
        return;
      }

      // Extract folios
      const folios = lateCheckouts.map((reservation) => reservation.folio);

      // Update all late checkouts to lateCheckOut: true
      const result = await this.reservatrionsService.updateLateCheckOutStatus(
        hotelId,
        folios,
      );

      console.log(
        `✅ Hotel ${hotelId}: Found ${lateCheckouts.length} late checkouts, updated ${result.modifiedCount} reservations`,
      );
    } catch (error) {
      console.error(`❌ Error processing hotel ${hotelId}:`, error);
    }
  }

  private async handleLateCheckout(reservation: any) {
    console.log(`Late checkout: ${reservation.folio} - ${reservation.nombre}`);
  }

  private timeToCron(time: string): string {
    // Convert "17:00" to "0 17 * * *" (runs daily at that time)
    const [hours, minutes] = time.split(':');
    return `${minutes} ${hours} * * *`;
  }

  // In HotelSchedulerService
  async updateHotelSchedule(hotelId: string, newTime: string) {
    const jobName = `hotel-${hotelId}`;

    try {
      // Remove existing job
      this.schedulerRegistry.deleteCronJob(jobName);
      console.log(`Deleted old schedule for hotel ${hotelId}`);
    } catch (e) {
      // Job doesn't exist yet, that's fine
      console.log(`No existing schedule found for hotel ${hotelId}`);
    }

    // Get updated parameters
    const parameters = await this.parametrosService.getHotelParams(hotelId);

    // Schedule new job with updated time
    const cronExpression = this.timeToCron(newTime);
    this.scheduleHotelJob(hotelId, cronExpression, parameters);

    console.log(`✅ Updated schedule for hotel ${hotelId} to ${newTime}`);
  }

  // In HotelSchedulerService
  async testHotelTask(hotelId: string) {
    console.log('🧪 MANUALLY TESTING TASK FOR:', hotelId);

    const parameters = await this.parametrosService.getHotelParams(hotelId);
    await this.executeHotelTask(hotelId, parameters);

    console.log('🧪 TEST COMPLETE');
  }
}
