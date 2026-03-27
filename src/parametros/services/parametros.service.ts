import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Connection, Model } from 'mongoose';
import { Parametros, ParametrosSchema } from '../models/parametros.model';
import { ADMIN_FIELDS } from 'src/constraints/admin-fields-constraints';
import { HotelSchedulerService } from 'src/scheduler/scheduler.tasks';

@Injectable({ scope: Scope.REQUEST })
export class ParametrosService {
  private parametrosModel: Model<Parametros>;
  private readonly logger = new Logger(ParametrosService.name);

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    @Inject(forwardRef(() => HotelSchedulerService))
    private hotelSchedulerService: HotelSchedulerService,
  ) {
    const connection: Connection = (request as any).dbConnection;
    this.parametrosModel =
      connection.models['Parametros'] ||
      connection.model('Parametros', ParametrosSchema);
  }

  async getAll(
    role: string,
    restrictedFields: readonly string[],
  ): Promise<Parametros> {
    const projection =
      role === 'ADMIN'
        ? {}
        : restrictedFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {});
    try {
      const data = await this.parametrosModel
        .findOne()
        .select(projection)
        .lean()
        .exec();

      if (!data) throw new NotFoundException('No parametros found');
      return data;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Database error fetching parametros: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async getHotelParams(): Promise<Parametros> {
    try {
      const data = await this.parametrosModel.findOne().lean().exec();
      if (!data) throw new NotFoundException('No parametros found');
      return data;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(
        `Database error fetching parametros: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async postParametros(body: any) {
    const hotelId = (this.request as any).hotelId;
    try {
      await this.parametrosModel.deleteOne({});
      const newParametros = new this.parametrosModel(body.parametros);
      const data = await newParametros.save();
      await this.hotelSchedulerService.updateHotelSchedule(
        hotelId,
        body.parametros.checkOut,
      );
      return data;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
}
