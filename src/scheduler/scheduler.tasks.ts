import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TenantService } from 'src/tenant/tenant.service';
import {
  Parametros,
  ParametrosSchema,
} from 'src/parametros/models/parametros.model';
import { huespeds, GuestSchema } from 'src/guests/models/guest.model';
import { Connection, Model } from 'mongoose';
import { DateTime } from 'luxon';

@Injectable()
export class HotelSchedulerService implements OnModuleInit {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private tenantService: TenantService,
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

  // Get models directly from TenantService connection — no request needed
  private async getModels(hotelId: string): Promise<{
    parametrosModel: Model<Parametros>;
    guestModel: Model<huespeds>;
  }> {
    const connection: Connection = await this.tenantService.getConnection(
      hotelId,
    );

    const parametrosModel =
      connection.models['Parametros'] ||
      connection.model('Parametros', ParametrosSchema);

    const guestModel =
      connection.models['Reservaciones'] ||
      connection.model('Reservaciones', GuestSchema);

    return { parametrosModel, guestModel };
  }

  async onModuleInit() {
    console.log('Loading all hotel schedules...');
    await this.loadAllHotelSchedules();
  }

  async loadAllHotelSchedules() {
    console.log('📊 Fetching hotels from database...');

    try {
      // Get all known hotelIds from the connection cache
      const hotels = await this.tenantService.getAllHotelIds();
      console.log(`✅ Found ${hotels.length} hotels`);

      for (const hotel of hotels) {
        console.log(`\n📍 Processing hotel: ${hotel}`);
        const parameters = await this.getHotelParams(hotel);

        if (parameters?.checkOut) {
          const cronExpression = this.timeToCron(parameters.checkOut);
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

  async getHotelParams(hotelId: string): Promise<Parametros | null> {
    try {
      const { parametrosModel } = await this.getModels(hotelId);
      return await parametrosModel.findOne().lean().exec();
    } catch (error) {
      console.error(`Error fetching params for hotel ${hotelId}:`, error);
      return null;
    }
  }

  private scheduleHotelJob(
    hotelId: string,
    cronExpression: string,
    parameters: Parametros,
  ) {
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
      timezone,
    );

    this.schedulerRegistry.addCronJob(`hotel-${hotelId}`, job);
    console.log(`✅ Scheduled job for hotel ${hotelId}`);
    console.log(`   📅 Cron: ${cronExpression} | 🌍 TZ: ${timezone}`);
    console.log(`   ⏰ Next run: ${job.nextDate()?.toISO()}`);
  }

  private async executeHotelTask(hotelId: string, parameters: Parametros) {
    console.log(`Executing scheduled task for hotel: ${hotelId}`);

    try {
      const { guestModel } = await this.getModels(hotelId);
      const checkOut = parameters?.checkOut;

      const lateCheckouts = await this.findTodayLateCheckouts(
        guestModel,
        checkOut,
      );

      if (lateCheckouts.length === 0) {
        console.log(`No late checkouts found for hotel ${hotelId}`);
        return;
      }

      const folios = lateCheckouts.map((r) => r.folio);
      const result = await this.updateLateCheckOutStatus(guestModel, folios);

      console.log(
        `✅ Hotel ${hotelId}: Found ${lateCheckouts.length} late checkouts, updated ${result.modifiedCount}`,
      );
    } catch (error) {
      console.error(`❌ Error processing hotel ${hotelId}:`, error);
    }
  }

  private async findTodayLateCheckouts(
    guestModel: Model<huespeds>,
    cutoffTime = '12:00',
  ) {
    const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number);
    const now = new Date();

    return guestModel.aggregate([
      {
        $match: {
          estatus: 'Huesped en Casa',
          lateCheckOut: { $ne: 'Colgado' },
        },
      },
      {
        $addFields: {
          salidaDate: {
            $cond: {
              if: { $eq: [{ $type: '$salida' }, 'string'] },
              then: { $dateFromString: { dateString: '$salida' } },
              else: '$salida',
            },
          },
        },
      },
      {
        $addFields: {
          salidaYear: { $year: '$salidaDate' },
          salidaMonth: { $month: '$salidaDate' },
          salidaDay: { $dayOfMonth: '$salidaDate' },
          salidaTotalMinutes: {
            $add: [
              { $multiply: [{ $hour: '$salidaDate' }, 60] },
              { $minute: '$salidaDate' },
            ],
          },
        },
      },
      {
        $match: {
          $or: [
            {
              $expr: {
                $or: [
                  { $lt: ['$salidaYear', now.getFullYear()] },
                  {
                    $and: [
                      { $eq: ['$salidaYear', now.getFullYear()] },
                      { $lt: ['$salidaMonth', now.getMonth() + 1] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$salidaYear', now.getFullYear()] },
                      { $eq: ['$salidaMonth', now.getMonth() + 1] },
                      { $lt: ['$salidaDay', now.getDate()] },
                    ],
                  },
                ],
              },
            },
            {
              $expr: {
                $and: [
                  { $eq: ['$salidaYear', now.getFullYear()] },
                  { $eq: ['$salidaMonth', now.getMonth() + 1] },
                  { $eq: ['$salidaDay', now.getDate()] },
                  {
                    $gt: [
                      '$salidaTotalMinutes',
                      cutoffHours * 60 + cutoffMinutes,
                    ],
                  },
                ],
              },
            },
          ],
        },
      },
      {
        $project: {
          salidaDate: 0,
          salidaYear: 0,
          salidaMonth: 0,
          salidaDay: 0,
          salidaTotalMinutes: 0,
        },
      },
    ]);
  }

  private async updateLateCheckOutStatus(
    guestModel: Model<huespeds>,
    folios: string[],
  ) {
    if (folios.length === 0) return { modifiedCount: 0, matchedCount: 0 };
    return guestModel.updateMany(
      { folio: { $in: folios } },
      { $set: { lateCheckOut: 'Late Check-Out' } },
    );
  }

  async updateHotelSchedule(hotelId: string, newTime: string) {
    const jobName = `hotel-${hotelId}`;

    try {
      this.schedulerRegistry.deleteCronJob(jobName);
      console.log(`Deleted old schedule for hotel ${hotelId}`);
    } catch (e) {
      console.log(`No existing schedule found for hotel ${hotelId}`);
    }

    const parameters = await this.getHotelParams(hotelId);
    const cronExpression = this.timeToCron(newTime);
    this.scheduleHotelJob(hotelId, cronExpression, parameters);
    console.log(`✅ Updated schedule for hotel ${hotelId} to ${newTime}`);
  }

  async testHotelTask(hotelId: string) {
    console.log('🧪 MANUALLY TESTING TASK FOR:', hotelId);
    const parameters = await this.getHotelParams(hotelId);
    await this.executeHotelTask(hotelId, parameters);
    console.log('🧪 TEST COMPLETE');
  }

  private timeToCron(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${minutes} ${hours} * * *`;
  }

  private addExecutionLog(log: {
    hotelId: string;
    executedAt: Date;
    status: 'success' | 'error';
    lateCheckoutsFound: number;
    updated: number;
    error?: string;
  }) {
    this.executionHistory.unshift(log);
    if (this.executionHistory.length > this.MAX_HISTORY) {
      this.executionHistory = this.executionHistory.slice(0, this.MAX_HISTORY);
    }
  }

  getExecutionHistory(hotelId?: string, limit = 50) {
    let history = this.executionHistory;
    if (hotelId) history = history.filter((log) => log.hotelId === hotelId);
    return history.slice(0, limit);
  }

  getExecutionStats(hotelId?: string) {
    let history = this.executionHistory;
    if (hotelId) history = history.filter((log) => log.hotelId === hotelId);

    return {
      total: history.length,
      successful: history.filter((l) => l.status === 'success').length,
      failed: history.filter((l) => l.status === 'error').length,
      totalCheckoutsProcessed: history.reduce((sum, l) => sum + l.updated, 0),
      lastExecution: history[0],
    };
  }
}
