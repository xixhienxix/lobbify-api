import { Module } from '@nestjs/common';
import { TarifasController } from './_controllers/tarifas.controller';
import { TarifasService } from './_services/tarifas.service';
import { RatesGateway } from './_gateway/rates.gateway';

@Module({
  controllers: [TarifasController],
  providers: [TarifasService, RatesGateway],
})
export class TarifasModule {}
