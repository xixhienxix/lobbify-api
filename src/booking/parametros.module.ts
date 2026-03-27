import { Module } from '@nestjs/common';
import { ParametrosController } from './controllers/parameters.controller';
import { ParametrosService } from './_services/parameters.service';

@Module({
  controllers: [ParametrosController],
  providers: [ParametrosService],
  exports: [ParametrosService],
})
export class BookingParametrosModule {}
