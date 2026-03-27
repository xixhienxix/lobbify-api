import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Connection, Model } from 'mongoose';
import { timezone, TimezonesSchema } from '../_models/timezone.model';
import { TenantService } from 'src/tenant/tenant.service';

@Injectable()
export class TimezonesService {
  private readonly logger = new Logger(TimezonesService.name);

  constructor(private readonly tenantService: TenantService) {}

  private getModel(): Model<timezone> {
    const connection: Connection = this.tenantService.getAdminConnection();
    return (
      connection.models['Timezones'] ||
      connection.model('Timezones', TimezonesSchema)
    );
  }

  async findAll(): Promise<timezone[]> {
    try {
      const data = await this.getModel().find().lean().exec();
      if (!data) throw new NotFoundException('No timezones loaded');
      return data;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Database error fetching timezones', error.stack);
      throw new InternalServerErrorException('Failed to fetch timezones');
    }
  }
}
