import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { timezone } from '../_models/timezone.model';

@Injectable()
export class TimezonesService {
  constructor(@InjectModel(timezone.name) private TimeModel: Model<timezone>) {}

  private readonly logger = new Logger(TimezonesService.name);

  async findAll(): Promise<timezone[]> {
    try {
      const data = await this.TimeModel.find({}).lean().exec();

      if (!data) {
        throw new NotFoundException(`No timezones loaded`);
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Database error fetching timezones`, error.stack);
      throw new InternalServerErrorException(
        'Failed to fetch parametros configuration',
      );
    }
  }
}
