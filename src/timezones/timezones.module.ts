import { Module } from '@nestjs/common';
import { TimezonesController } from './controllers/timezones.controller';
import { TimezonesService } from './_services/timezones.service';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [TimezonesController],
  providers: [TimezonesService],
})
export class TimezonesModule {}
