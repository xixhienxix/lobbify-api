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

  private executionHistory: Array<{
    hotelId: string;
    executedAt: Date;
    status: 'success' | 'error';
    lateCheckoutsFound: number;
    updated: number;
    error?: string;
  }> = [];

  private readonly MAX_HISTORY = 100;

  async onModuleInit() {
    console.log('Loading all hotel schedules...');
    await this.loadAllHotelSchedules();
  }

  async loadAllHotelSchedules() {
    console.log('📊 Fetching hotels from database...');

    try {
      const hotels = await this.parametrosService.getAllHotels();
      console.log(`✅ Found ${hotels.length} hotels`);

      for (const hotel of hotels) {
        console.log(`\n📍 Processing hotel: ${hotel}`);

        const parameters = await this.parametrosService.getHotelParams(hotel);

        if (parameters?.checkOut) {
          const cronExpression = this.timeToCron(parameters.checkOut);
          console.log(`   ⏰ CheckOut time: ${parameters.checkOut}`);
          console.log(
            `   🌍 Timezone: ${parameters.codigoZona || 'UTC (default)'}`,
          );

          this.scheduleHotelJob(hotel, cronExpression, parameters);
        } else {
          console.warn(`   ⚠️ No checkOut time found for hotel ${hotel}`);
        }
      }

      console.log(`\n🎉 Successfully loaded ${hotels.length} hotel schedules`);
    } catch (error) {
      console.error('💥 Error loading hotel schedules:', error);
      throw error;
    }
  }

  private scheduleHotelJob(
    hotelId: string,
    cronExpression: string,
    parameters: Parametros,
  ) {
    // Use the timezone from database, fallback to UTC if not provided
    const timezone = parameters.codigoZona || 'UTC';

    const job = new CronJob(
      cronExpression,
      async () => {
        console.log(
          `🔔 CRON JOB EXECUTING for hotel ${hotelId} at ${new Date().toISOString()}`,
        );
        await this.executeHotelTask(hotelId, parameters);
      },
      null,
      true,
      timezone, // Use timezone from database
    );

    this.schedulerRegistry.addCronJob(`hotel-${hotelId}`, job);

    console.log(`✅ Scheduled job for hotel ${hotelId}`);
    console.log(`   📅 Cron expression: ${cronExpression}`);
    console.log(`   🌍 Timezone: ${timezone}`);
    console.log(`   ⏰ Next run: ${job.nextDate()?.toISO()}`);
    console.log(`   ⏰ Next run (UTC): ${job.nextDate()?.toUTC().toISO()}`);
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

  private addExecutionLog(log: {
    hotelId: string;
    executedAt: Date;
    status: 'success' | 'error';
    lateCheckoutsFound: number;
    updated: number;
    error?: string;
  }) {
    this.executionHistory.unshift(log); // Add to beginning

    // Keep only last MAX_HISTORY entries
    if (this.executionHistory.length > this.MAX_HISTORY) {
      this.executionHistory = this.executionHistory.slice(0, this.MAX_HISTORY);
    }
  }

  getExecutionHistory(hotelId?: string, limit = 50) {
    let history = this.executionHistory;

    if (hotelId) {
      history = history.filter((log) => log.hotelId === hotelId);
    }

    return history.slice(0, limit);
  }

  getExecutionStats(hotelId?: string) {
    let history = this.executionHistory;

    if (hotelId) {
      history = history.filter((log) => log.hotelId === hotelId);
    }

    const total = history.length;
    const successful = history.filter((log) => log.status === 'success').length;
    const failed = history.filter((log) => log.status === 'error').length;
    const totalCheckoutsProcessed = history.reduce(
      (sum, log) => sum + log.updated,
      0,
    );

    const lastExecution = history[0];

    return {
      total,
      successful,
      failed,
      totalCheckoutsProcessed,
      lastExecution,
    };
  }
}
