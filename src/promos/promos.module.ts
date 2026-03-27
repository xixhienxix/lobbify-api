import { Module } from '@nestjs/common';
import { PromosController } from './controllers/promos.controller';
import { PromosService } from './services/promos.services';
import { PromosGateway } from './gateway/promos.gateway';

@Module({
  controllers: [PromosController],
  providers: [PromosService, PromosGateway],
})
export class PromosModule {}
