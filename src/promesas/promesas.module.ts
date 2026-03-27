import { Module } from '@nestjs/common';
import { PromesasService } from './services/promesas.services';
import { PromesasController } from './controllers/promesas.controller';
import { PromesasGateWay } from './gateway/promesas.gateway';

@Module({
  controllers: [PromesasController],
  providers: [PromesasService, PromesasGateWay],
})
export class PromesasModule {}
