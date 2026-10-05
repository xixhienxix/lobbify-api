import { Module } from '@nestjs/common';
import { TarifasController } from './_controllers/tarifas.controller';
import { TarifasService } from './_services/tarifas.service';
import { RatesGateway } from './_gateway/rates.gateway';
import { GuestStatementService } from '../reservations/guest.statement.service';

@Module({
  controllers: [TarifasController],
  providers: [TarifasService, RatesGateway, GuestStatementService],
  exports: [GuestStatementService],
})
export class TarifasModule {}
