import { Module } from '@nestjs/common';
import { GuestService } from './services/guest.service';
import { GuestsController } from './controllers/guest.controller';
import { BloqueosModule } from 'src/bloqueos/bloqueos.module';
import { GuestGateway } from './gateway/guest.gateway';

@Module({
  imports: [BloqueosModule],
  controllers: [GuestsController],
  providers: [GuestService, GuestGateway],
  exports: [GuestService],
})
export class GuestModule {}
