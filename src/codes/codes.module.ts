import { Module } from '@nestjs/common';
import { CodesController } from './controllers/codes.controller';
import { CodesService } from './_services/codes.service';

@Module({
  controllers: [CodesController],
  providers: [CodesService],
})
export class CodesModule {}
