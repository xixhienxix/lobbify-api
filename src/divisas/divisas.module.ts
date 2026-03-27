import { Module } from '@nestjs/common';
import { DivisasController } from './controllers/divisas.controller';
import { DivisasService } from './_services/divisas.service';
import { TenantModule } from 'src/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [DivisasController],
  providers: [DivisasService],
})
export class DivisasModule {}
