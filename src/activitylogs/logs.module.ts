import { Module } from '@nestjs/common';
import { GuestModule } from 'src/guests/guest.module';
import { LogController } from './controllers/log.controller';
import { LogService } from './service/log.service';

@Module({
  imports: [GuestModule],
  controllers: [LogController],
  providers: [LogService],
})
export class LogModule {}
