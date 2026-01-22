import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Parametros } from '../models/parametros.model';
import { Model } from 'mongoose';
import { ADMIN_FIELDS } from 'src/constraints/admin-fields-constraints';
import { HotelSchedulerService } from 'src/scheduler/scheduler.tasks';

@Injectable()
export class ParametrosService {
  constructor(
    @InjectModel('Parametros') private parametrosModel: Model<Parametros>,
    @Inject(forwardRef(() => HotelSchedulerService))
    private hotelSchedulerService: HotelSchedulerService,
  ) {}

  private readonly logger = new Logger(ParametrosService.name);

  async getAll(
    hotel: string,
    role: string,
    restrictedFields: readonly string[],
  ): Promise<Parametros> {
    const projection =
      role === 'ADMIN'
        ? {}
        : restrictedFields.reduce((acc, field) => ({ ...acc, [field]: 0 }), {});
    try {
      const data = await this.parametrosModel
        .findOne({ hotel })
        .select(projection)
        .lean()
        .exec();

      if (!data) {
        throw new NotFoundException(`No parametros found for hotel: ${hotel}`);
      }
      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Database error fetching parametros for hotel ${hotel}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async getAllHotels(): Promise<string[]> {
    try {
      const data = await this.parametrosModel.distinct('hotel').exec();

      if (data.length === 0) {
        throw new NotFoundException('No hotels found in Parametros collection');
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Database error fetching parametros for hotels: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async getHotelParams(hotel: string): Promise<Parametros> {
    try {
      const data = await this.parametrosModel.findOne({ hotel }).lean().exec();

      if (!data) {
        throw new NotFoundException(`No parametros found for hotel ${hotel}`);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Database error fetching parametros for hotels: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }

  async postParametros(hotel: string, body: any) {
    const filter = { hotel: hotel };
    body.parametros.hotel = hotel;
    try {
      // Delete the existing document that matches the filter
      await this.parametrosModel.deleteOne(filter);

      // Create a new document with the provided body.parametros
      const newParametros = new this.parametrosModel(body.parametros);
      const data = await newParametros.save();

      await this.hotelSchedulerService.updateHotelSchedule(
        hotel,
        body.parametros.checkOut,
      );
      return data;
    } catch (err) {
      console.log(err); // Log any errors that occur
      return err;
    }
  }
}
